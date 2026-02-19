import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'
import logger from '../config/logger'

// ============= Vérifier que le staff existe =============
export async function checkStaffExists(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const staff = await prisma.staff.findUnique({
      where: { id }
    })

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Membre du personnel introuvable'
      })
    }

    // Attacher le staff à la requête pour éviter de le rechercher plus tard
    req.staff = staff

    next()
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du membre du personnel'
    })
  }
}

// ============= Vérifier que l'owner possède le salon du staff =============
export async function checkStaffOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId // Suppose que tu as un middleware d'auth qui ajoute req.user
    const { id } = req.params

    logger.debug('Checking staff ownership', { staffId: id })

    if (!userId) {
      logger.warn('Staff ownership check failed: missing userId')
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    // Récupérer le staff avec son salon
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        salon: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (!staff) {
      logger.warn('Staff ownership check failed: staff not found', { staffId: id })
      return res.status(404).json({
        success: false,
        message: 'Membre du personnel introuvable'
      })
    }

    // Vérifier que l'owner possède le salon
    if (staff.salon.ownerId !== userId) {
      logger.warn('Staff ownership check failed: permission denied', { staffId: id })
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission d\'accéder à ce membre du personnel'
      })
    }

    logger.debug('Staff ownership check passed', { staffId: id })
    req.staff = staff

    next()
  } catch (error: any) {
    logger.error('Error in checkStaffOwnership', { error: error.message, stack: error.stack })
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    })
  }
}

// ============= Vérifier que l'owner possède le salon (pour création) =============
export async function checkSalonOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    const { salonId } = req.body

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'salonId requis'
      })
    }

    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { ownerId: true }
    })

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon introuvable'
      })
    }

    if (salon.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission d\'ajouter du personnel à ce salon'
      })
    }

    next()
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    })
  }
}

// ============= Validation des données de création =============
export function validateCreateStaff(req: Request, res: Response, next: NextFunction) {
  const { salonId, email, password, firstName, lastName, role, specialties } = req.body

  logger.debug('Validating staff creation')

  const errors: string[] = []

  if (!salonId || typeof salonId !== 'string') {
    errors.push('salonId est requis et doit être une chaîne de caractères')
  }

  // Email optionnel mais doit être valide si fourni
  if (email) {
    if (typeof email !== 'string') {
      errors.push('email doit être une chaîne de caractères')
    } else {
      // Validation format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('email doit être une adresse email valide')
      }
    }
  }

  if (password !== undefined && password !== null && String(password).trim() !== '') {
    errors.push('Le mot de passe ne peut pas être défini à la création du compte employé')
  }

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
    errors.push('firstName est requis et doit contenir au moins 2 caractères')
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
    errors.push('lastName est requis et doit contenir au moins 2 caractères')
  }

  // Validation optionnelle du rôle
  if (role && !['MANAGER', 'EMPLOYEE'].includes(role)) {
    errors.push('role doit être MANAGER ou EMPLOYEE')
  }

  // Validation optionnelle des spécialités
  if (specialties && !Array.isArray(specialties)) {
    errors.push('specialties doit être un tableau')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors
    })
  }

  next()
}

// ============= Validation des données de mise à jour =============
export function validateUpdateStaff(req: Request, res: Response, next: NextFunction) {
  const { email, password, firstName, lastName, role, specialties } = req.body

  const errors: string[] = []

  // Au moins un champ doit être fourni
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Au moins un champ à mettre à jour doit être fourni'
    })
  }

  if (email !== undefined) {
    if (typeof email !== 'string') {
      errors.push('email doit être une chaîne de caractères')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('email doit être une adresse email valide')
      }
    }
  }

  if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
    errors.push('password doit contenir au moins 6 caractères')
  }

  if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length < 2)) {
    errors.push('firstName doit contenir au moins 2 caractères')
  }

  if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length < 2)) {
    errors.push('lastName doit contenir au moins 2 caractères')
  }

  if (role !== undefined && !['MANAGER', 'EMPLOYEE'].includes(role)) {
    errors.push('role doit être MANAGER ou EMPLOYEE')
  }

  if (specialties !== undefined && !Array.isArray(specialties)) {
    errors.push('specialties doit être un tableau')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors
    })
  }

  next()
}
