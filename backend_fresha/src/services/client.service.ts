import prisma from '../config/database'
import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'crypto'
import logger from '../config/logger'
import { sendClientPasswordSetupEmail } from './email.service'

interface CreateClientData {
  salonId?: string
  email: string
  password?: string
  firstName: string
  lastName: string
  phone: string
  notes?: string
  marketing?: boolean
}

interface UpdateClientData {
  firstName?: string
  lastName?: string
  phone?: string
  notes?: string
  marketing?: boolean
  password?: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function createPasswordSetupToken(): string {
  return randomBytes(32).toString('hex')
}

function hashPasswordSetupToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

function getClientPasswordSetupTtlHours(): number {
  const parsed = Number(process.env.CLIENT_PASSWORD_SETUP_TTL_HOURS)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }
  return 72
}

function buildSalonScope(accessibleSalonIds?: string[]) {
  if (!accessibleSalonIds) {
    return {}
  }

  if (accessibleSalonIds.length === 0) {
    return {
      salonId: {
        in: ['__no_access__']
      }
    }
  }

  return {
    salonId: {
      in: accessibleSalonIds
    }
  }
}

function stripPassword<T extends { password?: string | null }>(item: T) {
  const { password, ...rest } = item
  return rest
}

export async function createClient(data: CreateClientData) {
  const normalizedEmail = normalizeEmail(data.email)
  const existingClient = await prisma.client.findUnique({
    where: { email: normalizedEmail }
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

  const hasProvidedPassword = Boolean(data.password && data.password.trim().length > 0)
  let hashedPassword: string | undefined
  if (hasProvidedPassword) {
    hashedPassword = await bcrypt.hash(data.password!.trim(), 10)
  }

  const passwordSetupTokenRaw = !hasProvidedPassword ? createPasswordSetupToken() : null
  const passwordSetupTokenHash = passwordSetupTokenRaw ? hashPasswordSetupToken(passwordSetupTokenRaw) : null
  const passwordSetupTokenExpiresAt = passwordSetupTokenRaw
    ? new Date(Date.now() + getClientPasswordSetupTtlHours() * 60 * 60 * 1000)
    : null

  let createdClientId: string | null = null
  const client = await prisma.client.create({
    data: {
      salonId: data.salonId,
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      notes: data.notes,
      marketing: data.marketing || false,
      emailVerificationRequired: false,
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: passwordSetupTokenHash,
      emailVerificationTokenExpiresAt: passwordSetupTokenExpiresAt
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })
  createdClientId = client.id

  if (passwordSetupTokenRaw && passwordSetupTokenExpiresAt) {
    try {
      await sendClientPasswordSetupEmail({
        to: client.email,
        firstName: client.firstName,
        token: passwordSetupTokenRaw,
        expiresAt: passwordSetupTokenExpiresAt
      })
    } catch (error: any) {
      if (createdClientId) {
        try {
          await prisma.client.delete({ where: { id: createdClientId } })
        } catch (rollbackError: any) {
          logger.error('Failed to rollback client creation after password setup email failure', {
            clientId: createdClientId,
            error: rollbackError?.message
          })
        }
      }
      throw error
    }
  }

  return stripPassword(client)
}

export async function getClientById(clientId: string, accessibleSalonIds?: string[]) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ...buildSalonScope(accessibleSalonIds)
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
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

  return stripPassword(client)
}

export async function getClientByEmail(email: string, accessibleSalonIds?: string[]) {
  const client = await prisma.client.findFirst({
    where: {
      email,
      ...buildSalonScope(accessibleSalonIds)
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
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

  return stripPassword(client)
}

export async function getClientsByPhone(phone: string, accessibleSalonIds?: string[]) {
  const clients = await prisma.client.findMany({
    where: {
      phone,
      ...buildSalonScope(accessibleSalonIds)
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    }
  })

  return clients.map(stripPassword)
}

export async function getClientsBySalon(
  salonId: string,
  accessibleSalonIds?: string[],
  options?: { minimal?: boolean }
) {
  const salonScope = buildSalonScope(accessibleSalonIds)

  if (options?.minimal) {
    return prisma.client.findMany({
      where: {
        salonId,
        ...salonScope
      },
      select: {
        id: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  const clients = await prisma.client.findMany({
    where: {
      salonId,
      ...salonScope
    },
    include: {
      _count: {
        select: {
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return clients.map(stripPassword)
}

export async function getAllClients(
  page: number = 1,
  limit: number = 20,
  accessibleSalonIds?: string[]
) {
  const skip = (page - 1) * limit
  const where = buildSalonScope(accessibleSalonIds)

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      skip,
      take: limit,
      where,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.client.count({ where })
  ])

  return {
    clients: clients.map(stripPassword),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export async function updateClient(
  clientId: string,
  data: UpdateClientData,
  accessibleSalonIds?: string[]
) {
  await getClientById(clientId, accessibleSalonIds)

  let hashedPassword: string | undefined
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 10)
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      notes: data.notes,
      marketing: data.marketing,
      password: hashedPassword
    },
    include: {
      salon: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  return stripPassword(client)
}

export async function deleteClient(clientId: string, accessibleSalonIds?: string[]) {
  await getClientById(clientId, accessibleSalonIds)

  await prisma.client.delete({
    where: { id: clientId }
  })

  return { message: 'Client supprime avec succes' }
}

export async function searchClients(
  searchTerm: string,
  salonId?: string,
  page: number = 1,
  limit: number = 20,
  accessibleSalonIds?: string[]
) {
  const skip = (page - 1) * limit
  const words = searchTerm.trim().split(/\s+/)

  const orConditions: any[] = [
    { firstName: { contains: searchTerm, mode: 'insensitive' } },
    { lastName: { contains: searchTerm, mode: 'insensitive' } },
    { email: { contains: searchTerm, mode: 'insensitive' } },
    { phone: { contains: searchTerm } }
  ]

  if (words.length >= 2) {
    const firstName = words[0]
    const lastName = words.slice(1).join(' ')

    orConditions.push({
      AND: [
        { firstName: { contains: firstName, mode: 'insensitive' } },
        { lastName: { contains: lastName, mode: 'insensitive' } }
      ]
    })

    orConditions.push({
      AND: [
        { lastName: { contains: firstName, mode: 'insensitive' } },
        { firstName: { contains: lastName, mode: 'insensitive' } }
      ]
    })
  }

  const whereClause: any = {
    OR: orConditions,
    ...buildSalonScope(accessibleSalonIds)
  }

  if (salonId) {
    whereClause.salonId = salonId
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.client.count({ where: whereClause })
  ])

  return {
    clients: clients.map(stripPassword),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}
