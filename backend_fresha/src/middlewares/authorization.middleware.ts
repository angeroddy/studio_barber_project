import { Request, Response, NextFunction } from 'express'

export type UserType = 'owner' | 'staff' | 'client'

function getUserType(req: Request): UserType | null {
  const userType = req.user?.userType
  if (userType === 'owner' || userType === 'staff' || userType === 'client') {
    return userType
  }
  return null
}

export function requireUserTypes(...allowedUserTypes: UserType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userType = getUserType(req)

    if (!userType) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifie'
      })
    }

    if (!allowedUserTypes.includes(userType)) {
      return res.status(403).json({
        success: false,
        error: 'Acces refuse pour ce type de compte'
      })
    }

    next()
  }
}

export const requireOwner = requireUserTypes('owner')
export const requireStaff = requireUserTypes('staff')
export const requireClient = requireUserTypes('client')
export const requireOwnerOrStaff = requireUserTypes('owner', 'staff')

export function requireOwnerOrManager(req: Request, res: Response, next: NextFunction) {
  const userType = getUserType(req)

  if (!userType) {
    return res.status(401).json({
      success: false,
      error: 'Utilisateur non authentifie'
    })
  }

  if (userType === 'owner') {
    return next()
  }

  if (userType === 'staff' && req.user?.role === 'MANAGER') {
    return next()
  }

  return res.status(403).json({
    success: false,
    error: 'Acces reserve aux proprietaires et managers'
  })
}
