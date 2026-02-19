import { createHash, randomBytes } from 'crypto'
import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/hash.util'
import { generateToken } from '../utils/jwt.util'
import { createClientBooking } from './clientBooking.service'
import { getSlotHoldMinutes } from './bookingExpiration.service'
import { sendClientAccountVerificationEmail, sendClientVerificationEmail } from './email.service'

interface CheckEmailResponse {
  exists: boolean
  hasPassword: boolean
  client?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface RegisterClientData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  salonId?: string
  marketing?: boolean
}

interface RegisterClientWithBookingData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  salonId: string
  serviceId: string
  staffId?: string
  startTime: string
  notes?: string
}

interface SetPasswordData {
  email: string
  password: string
}

interface LoginClientData {
  email: string
  password: string
}

interface VerifyClientEmailResult {
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string
  }
  salonSlug?: string
}

interface RegisterClientPendingVerificationResult {
  email: string
  verificationExpiresAt: Date
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashVerificationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

function createVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

function getClientEmailVerificationTtlMinutes(): number {
  const parsed = Number(process.env.CLIENT_EMAIL_VERIFICATION_TTL_MINUTES)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }
  return 1440
}

export async function checkEmailExists(email: string): Promise<CheckEmailResponse> {
  const normalizedEmail = normalizeEmail(email)

  const client = await prisma.client.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      password: true
    }
  })

  if (!client) {
    return {
      exists: false,
      hasPassword: false
    }
  }

  return {
    exists: true,
    hasPassword: Boolean(client.password),
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName
    }
  }
}

export async function setPasswordForExistingClient(data: SetPasswordData) {
  const normalizedEmail = normalizeEmail(data.email)
  const client = await prisma.client.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  if (client.password) {
    throw new Error('Ce compte a deja un mot de passe. Veuillez vous connecter.')
  }

  const hashedPassword = await hashPassword(data.password)

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: { password: hashedPassword },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  const token = generateToken({
    userId: updatedClient.id,
    email: updatedClient.email,
    userType: 'client',
    type: 'client'
  })

  return {
    user: updatedClient,
    token
  }
}

export async function registerNewClient(data: RegisterClientData) {
  const normalizedEmail = normalizeEmail(data.email)
  const existingClient = await prisma.client.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    }
  })

  if (existingClient) {
    throw new Error('Un client avec cet email existe deja')
  }

  if (data.salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId }
    })

    if (!salon) {
      throw new Error('Salon introuvable')
    }
  }

  const hashedPassword = await hashPassword(data.password)

  const client = await prisma.client.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      salonId: data.salonId,
      marketing: data.marketing || false
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  const token = generateToken({
    userId: client.id,
    email: client.email,
    userType: 'client',
    type: 'client'
  })

  return {
    user: client,
    token
  }
}

export async function registerClientWithEmailVerification(
  data: RegisterClientData
): Promise<RegisterClientPendingVerificationResult> {
  const normalizedEmail = normalizeEmail(data.email)
  const ttlMinutes = getClientEmailVerificationTtlMinutes()
  const tokenRaw = createVerificationToken()
  const tokenHash = hashVerificationToken(tokenRaw)
  const tokenExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

  const existingClient = await prisma.client.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    }
  })

  if (existingClient) {
    throw new Error('Un client avec cet email existe deja')
  }

  if (data.salonId) {
    const salon = await prisma.salon.findUnique({
      where: { id: data.salonId }
    })

    if (!salon) {
      throw new Error('Salon introuvable')
    }
  }

  const hashedPassword = await hashPassword(data.password)

  const client = await prisma.client.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      salonId: data.salonId,
      marketing: data.marketing || false,
      emailVerificationRequired: true,
      emailVerifiedAt: null,
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: tokenExpiresAt
    },
    select: {
      email: true,
      firstName: true
    }
  })

  await sendClientAccountVerificationEmail({
    to: client.email,
    firstName: client.firstName,
    token: tokenRaw,
    expiresAt: tokenExpiresAt
  })

  return {
    email: client.email,
    verificationExpiresAt: tokenExpiresAt
  }
}

export async function registerClientWithPendingBooking(data: RegisterClientWithBookingData) {
  const normalizedEmail = normalizeEmail(data.email)
  const holdMinutes = getSlotHoldMinutes()
  const tokenRaw = createVerificationToken()
  const tokenHash = hashVerificationToken(tokenRaw)
  const tokenExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000)

  const existingClient = await prisma.client.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    }
  })

  if (existingClient?.password) {
    throw new Error('Un compte avec cet email existe deja. Veuillez vous connecter.')
  }

  const hashedPassword = await hashPassword(data.password)

  const client = existingClient
    ? await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          password: hashedPassword,
          firstName: data.firstName || existingClient.firstName,
          lastName: data.lastName || existingClient.lastName,
          phone: data.phone || existingClient.phone
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      })
    : await prisma.client.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true
        }
      })

  const booking = await createClientBooking({
    clientId: client.id,
    salonId: data.salonId,
    staffId: data.staffId,
    serviceId: data.serviceId,
    startTime: data.startTime,
    notes: data.notes,
    status: 'PENDING'
  })

  await prisma.client.update({
    where: { id: client.id },
    data: {
      emailVerificationRequired: true,
      emailVerifiedAt: null,
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: tokenExpiresAt
    }
  })

  await sendClientVerificationEmail({
    to: client.email,
    firstName: client.firstName,
    token: tokenRaw,
    holdMinutes,
    salonName: booking.salon?.name || 'votre salon',
    serviceName: booking.service?.name || 'votre prestation',
    bookingStartTime: booking.startTime
  })

  return {
    email: client.email,
    verificationExpiresAt: tokenExpiresAt
  }
}

export async function verifyClientEmailAndFinalizeBooking(rawToken: string): Promise<VerifyClientEmailResult> {
  const hashedToken = hashVerificationToken(rawToken)
  const now = new Date()

  const client = await prisma.client.findFirst({
    where: {
      emailVerificationTokenHash: hashedToken
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      emailVerificationRequired: true,
      emailVerificationTokenExpiresAt: true
    }
  })

  if (!client || !client.emailVerificationRequired) {
    throw new Error('Lien de verification invalide')
  }

  if (!client.emailVerificationTokenExpiresAt || client.emailVerificationTokenExpiresAt < now) {
    throw new Error('Ce lien de verification a expire')
  }

  const finalized = await prisma.$transaction(async (tx) => {
    const updatedClient = await tx.client.update({
      where: { id: client.id },
      data: {
        emailVerificationRequired: false,
        emailVerifiedAt: now,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true
      }
    })

    await tx.booking.updateMany({
      where: {
        clientId: client.id,
        status: 'PENDING',
        canceledAt: null
      },
      data: {
        status: 'CONFIRMED'
      }
    })

    const latestConfirmedBooking = await tx.booking.findFirst({
      where: {
        clientId: client.id,
        status: 'CONFIRMED'
      },
      include: {
        salon: {
          select: {
            slug: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return {
      updatedClient,
      salonSlug: latestConfirmedBooking?.salon?.slug
    }
  })

  const token = generateToken({
    userId: finalized.updatedClient.id,
    email: finalized.updatedClient.email,
    userType: 'client',
    type: 'client'
  })

  return {
    token,
    user: finalized.updatedClient,
    salonSlug: finalized.salonSlug
  }
}

export async function loginClient(data: LoginClientData) {
  const normalizedEmail = normalizeEmail(data.email)

  const client = await prisma.client.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      password: true,
      emailVerificationRequired: true,
      emailVerifiedAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  if (!client) {
    throw new Error('Email ou mot de passe incorrect')
  }

  if (!client.password) {
    throw new Error('Aucun mot de passe defini pour ce compte. Veuillez completer votre inscription.')
  }

  if (client.emailVerificationRequired && !client.emailVerifiedAt) {
    throw new Error('Veuillez confirmer votre adresse email avant de vous connecter.')
  }

  const isPasswordValid = await comparePassword(data.password, client.password)
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect')
  }

  const token = generateToken({
    userId: client.id,
    email: client.email,
    userType: 'client',
    type: 'client'
  })

  return {
    user: {
      id: client.id,
      email: client.email,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      salon: client.salon
    },
    token
  }
}

export async function getClientProfile(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      marketing: true,
      createdAt: true,
      salon: {
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    }
  })

  if (!client) {
    throw new Error('Client introuvable')
  }

  return client
}
