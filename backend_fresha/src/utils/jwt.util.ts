import jwt from 'jsonwebtoken'

// Validation stricte - pas de fallback
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables')
}

const JWT_SECRET = process.env.JWT_SECRET

interface TokenPayload {
  userId: string
  email: string
  userType?: string
  type?: string
  salonId?: string
  role?: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  })
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch (error) {
    throw new Error('Token invalide ou expiré')
  }
}