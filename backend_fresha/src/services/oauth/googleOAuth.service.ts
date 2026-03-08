import { createHash } from 'crypto'
import { OAuth2Client } from 'google-auth-library'

export interface SocialProfile {
  provider: 'GOOGLE'
  providerUserId: string
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
}

export interface SocialAuthServiceError extends Error {
  code: string
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim()
const oauthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

function buildError(message: string, code: string): SocialAuthServiceError {
  const error = new Error(message) as SocialAuthServiceError
  error.code = code
  return error
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function verifyGoogleIdToken(idToken: string): Promise<SocialProfile> {
  if (!GOOGLE_CLIENT_ID || !oauthClient) {
    throw buildError('Google OAuth n\'est pas configure', 'GOOGLE_NOT_CONFIGURED')
  }

  if (!idToken || !idToken.trim()) {
    throw buildError('Token Google manquant', 'GOOGLE_ID_TOKEN_MISSING')
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID
  })

  const payload = ticket.getPayload()
  if (!payload) {
    throw buildError('Token Google invalide', 'GOOGLE_TOKEN_INVALID')
  }

  if (!payload.sub) {
    throw buildError('Identifiant Google invalide', 'GOOGLE_TOKEN_INVALID')
  }

  if (!payload.email) {
    throw buildError('Email Google non disponible', 'GOOGLE_TOKEN_INVALID')
  }

  if (!payload.email_verified) {
    throw buildError('Veuillez verifier votre email Google', 'GOOGLE_EMAIL_NOT_VERIFIED')
  }

  return {
    provider: 'GOOGLE',
    providerUserId: payload.sub,
    email: normalizeEmail(payload.email),
    firstName: payload.given_name?.trim() || '',
    lastName: payload.family_name?.trim() || '',
    emailVerified: true
  }
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
