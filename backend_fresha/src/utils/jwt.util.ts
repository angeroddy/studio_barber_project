import jwt from 'jsonwebtoken'
import type { StaffRole } from '@prisma/client'

// Validation stricte - pas de fallback
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables')
}

const JWT_SECRET = process.env.JWT_SECRET

export interface TokenPayload {
  userId: string
  email: string
  userType?: string
  type?: string
  salonId?: string
  role?: StaffRole
}

export function generateToken(payload: TokenPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn
  })
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    throw new Error('Token invalide ou expiré')
  }
}
