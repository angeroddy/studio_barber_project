import { randomBytes } from 'crypto'
import prisma from '../config/database'
import { generateToken } from '../utils/jwt.util'
import { getSlotHoldMinutes } from './bookingExpiration.service'
import { createClientBooking } from './clientBooking.service'
import { sendClientAccountVerificationEmail, sendClientVerificationEmail } from './email.service'
import { sha256Hex, verifyGoogleIdToken } from './oauth/googleOAuth.service'

interface ClientEmailVerificationPayload {
  tokenRaw: string
  tokenHash: string
  tokenExpiresAt: Date
}

export interface SocialBookingPayload {
  salonId: string
  serviceId: string
  staffId?: string
  startTime: string
  notes?: string
}

interface SocialAuthBase {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
}

interface SocialAuthAuthenticatedResponse {
  mode: 'authenticated'
  user: SocialAuthBase
  token: string
}

interface SocialAuthPendingResponse {
  mode: 'verification_pending'
  email: string
  verificationExpiresAt: Date
}

export type SocialAuthResponse = {
  message: string
} & (SocialAuthAuthenticatedResponse | SocialAuthPendingResponse)

export interface SocialAuthInput {
  idToken: string
  phone?: string
  pendingBooking?: SocialBookingPayload
}

export class ClientSocialAuthError extends Error {
  code?: string
  status?: number
  data?: {
    email?: string
    firstName?: string
    lastName?: string
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizePhone(phone?: string): string {
  return phone?.trim() || ''
}

function createClientVerificationPayload(ttlMinutes = getClientEmailVerificationTtlMinutes()): ClientEmailVerificationPayload {
  const tokenRaw = randomBytes(32).toString('hex')
  return {
    tokenRaw,
    tokenHash: sha256Hex(tokenRaw),
    tokenExpiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
  }
}

function getClientEmailVerificationTtlMinutes(): number {
  const parsed = Number(process.env.CLIENT_EMAIL_VERIFICATION_TTL_MINUTES)
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }
  return 1440
}

function isGoogleAuthEnabled(): boolean {
  const configured = process.env.CLIENT_OAUTH_GOOGLE_ENABLED?.trim().toLowerCase()
  if (!configured) {
    return true
  }

  return configured !== 'false' && configured !== '0'
}

function throwSocialError(message: string, code: string, status = 400, data?: ClientSocialAuthError['data']): never {
  const error = new ClientSocialAuthError(message) as ClientSocialAuthError
  error.code = code
  error.status = status
  error.data = data
  throw error
}

function formatAuthUser(user: {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
}): SocialAuthBase {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email
  }
}

function buildIdentityData(clientId: string, providerUserId: string, providerEmail: string) {
  return {
    clientId,
    provider: 'GOOGLE' as const,
    providerUserId,
    providerEmail
  }
}

async function attachIdentityToExistingClient(clientId: string, providerUserId: string, email: string): Promise<void> {
  try {
    await prisma.clientOAuthIdentity.create({
      data: buildIdentityData(clientId, providerUserId, email)
    })
  } catch (error: any) {
    if (error?.code !== 'P2002') {
      throw error
    }
  }
}

async function buildVerificationChallenge(clientId: string): Promise<ClientEmailVerificationPayload> {
  const verification = createClientVerificationPayload()

  await prisma.client.update({
    where: { id: clientId },
    data: {
      emailVerificationRequired: true,
      emailVerifiedAt: null,
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationTokenExpiresAt: verification.tokenExpiresAt
    }
  })

  return verification
}

async function finalizeExistingClientForSocialLogin(
  client: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string
    emailVerificationRequired: boolean
    emailVerifiedAt: Date | null
  }
): Promise<SocialAuthResponse> {
  if (client.emailVerificationRequired && !client.emailVerifiedAt) {
    const verification = await buildVerificationChallenge(client.id)

    await sendClientAccountVerificationEmail({
      to: client.email,
      firstName: client.firstName,
      token: verification.tokenRaw,
      expiresAt: verification.tokenExpiresAt
    })

    return {
      mode: 'verification_pending',
      message: 'Verification email envoyee. Confirmez votre email pour finaliser votre compte.',
      email: client.email,
      verificationExpiresAt: verification.tokenExpiresAt
    }
  }

  const token = generateToken({
    userId: client.id,
    email: client.email,
    userType: 'client',
    type: 'client'
  })

  return {
    mode: 'authenticated',
    message: 'Connexion reussie via Google.',
    user: formatAuthUser(client),
    token
  }
}

export async function loginWithGoogle(data: SocialAuthInput): Promise<SocialAuthResponse> {
  if (!isGoogleAuthEnabled()) {
    throwSocialError('Connexion Google desactive', 'GOOGLE_AUTH_DISABLED', 503)
  }

  const profile = await verifyGoogleIdToken(data.idToken)

  const existingIdentity = await prisma.clientOAuthIdentity.findFirst({
    where: {
      provider: 'GOOGLE',
      providerUserId: profile.providerUserId
    },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          emailVerificationRequired: true,
          emailVerifiedAt: true
        }
      }
    }
  })

  if (existingIdentity?.client) {
    return finalizeExistingClientForSocialLogin(existingIdentity.client)
  }

  const normalizedEmail = normalizeEmail(profile.email)
  const matchingClient = await prisma.client.findFirst({
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
      emailVerificationRequired: true,
      emailVerifiedAt: true
    }
  })

  if (matchingClient) {
    await attachIdentityToExistingClient(matchingClient.id, profile.providerUserId, normalizedEmail)
    return finalizeExistingClientForSocialLogin(matchingClient)
  }

  const phone = normalizePhone(data.phone)
  if (!phone) {
    throwSocialError('Telephone requis', 'PHONE_REQUIRED', 422, {
      email: normalizedEmail,
      firstName: profile.firstName,
      lastName: profile.lastName
    })
  }

  const newClient = await prisma.client.create({
    data: {
      email: normalizedEmail,
      password: null,
      firstName: profile.firstName || 'Client',
      lastName: profile.lastName || 'Utilisateur',
      phone,
      emailVerificationRequired: true,
      emailVerifiedAt: null
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      emailVerificationRequired: true,
      emailVerifiedAt: true
    }
  })

  await prisma.clientOAuthIdentity.create({
    data: buildIdentityData(newClient.id, profile.providerUserId, normalizedEmail)
  })

  if (data.pendingBooking) {
    const booking = await createClientBooking({
      clientId: newClient.id,
      salonId: data.pendingBooking.salonId,
      staffId: data.pendingBooking.staffId,
      serviceId: data.pendingBooking.serviceId,
      startTime: data.pendingBooking.startTime,
      notes: data.pendingBooking.notes,
      status: 'PENDING'
    })

    const holdMinutes = getSlotHoldMinutes()
    const verification = createClientVerificationPayload(holdMinutes)

    await sendClientVerificationEmail({
      to: newClient.email,
      firstName: newClient.firstName,
      token: verification.tokenRaw,
      holdMinutes,
      salonName: booking.salon?.name || 'votre salon',
      serviceName: booking.service?.name || 'votre prestation',
      bookingStartTime: booking.startTime
    })

    await prisma.client.update({
      where: { id: newClient.id },
      data: {
        emailVerificationTokenHash: verification.tokenHash,
        emailVerificationTokenExpiresAt: verification.tokenExpiresAt
      }
    })

    return {
      mode: 'verification_pending',
      message: 'Compte cree et reservation reservee. Confirmez votre email pour valider.',
      email: newClient.email,
      verificationExpiresAt: verification.tokenExpiresAt
    }
  }

  const verification = createClientVerificationPayload()

  await sendClientAccountVerificationEmail({
    to: newClient.email,
    firstName: newClient.firstName,
    token: verification.tokenRaw,
    expiresAt: verification.tokenExpiresAt
  })

  return {
    mode: 'verification_pending',
    message: 'Compte cree. Un email de confirmation vous a ete envoye.',
    email: newClient.email,
    verificationExpiresAt: verification.tokenExpiresAt
  }
}
