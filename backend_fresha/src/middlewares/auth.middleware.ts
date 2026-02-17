import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../utils/jwt.util'
import { getAuthCookieName } from '../config/authCookie'

function normalizeUserType(decoded: TokenPayload): 'owner' | 'staff' | 'client' {
  if (decoded.userType === 'owner' || decoded.userType === 'staff' || decoded.userType === 'client') {
    return decoded.userType
  }

  if (decoded.type === 'client') {
    return 'client'
  }

  // Legacy compatibility:
  // - staff tokens historically include role/salonId
  // - owner tokens historically only had userId/email
  if (decoded.salonId || decoded.role) {
    return 'staff'
  }

  return 'owner'
}

/**
 * Middleware pour proteger les routes.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const cookieToken = getTokenFromCookie(req)
    const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : null
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null
    const token = cookieToken || headerToken

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant'
      })
    }

    const decoded = verifyToken(token)
    const userType = normalizeUserType(decoded)

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType,
      salonId: decoded.salonId,
      role: decoded.role
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expire'
    })
  }
}

// Export alias for compatibility.
export { authMiddleware as authenticate }

function getTokenFromCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) {
    return null
  }

  const cookieName = getAuthCookieName()
  const cookies = cookieHeader.split(';')
  for (const rawCookie of cookies) {
    const cookie = rawCookie.trim()
    if (!cookie.startsWith(`${cookieName}=`)) {
      continue
    }

    const value = cookie.slice(cookieName.length + 1)
    if (!value) {
      return null
    }

    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return null
}
