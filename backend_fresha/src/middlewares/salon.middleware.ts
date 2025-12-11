import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'
import { body } from 'express-validator'

// ============= Vérifier que le salon existe =============
export async function checkSalonExists(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const salon = await prisma.salon.findUnique({
      where: { id }
    })

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon introuvable'
      })
    }

    // Attacher le salon à la requête pour éviter de le rechercher plus tard
    req.salon = salon

    next()
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du salon'
    })
  }
}

// ============= Vérifier que l'owner possède le salon =============
export async function checkSalonOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId
    const { id } = req.params

    console.log('=== BACKEND: Vérification ownership salon ===')
    console.log('User ID:', userId)
    console.log('Salon ID:', id)

    if (!userId) {
      console.log('Erreur: userId manquant')
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      })
    }

    // Récupérer le salon
    const salon = await prisma.salon.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true
      }
    })

    console.log('Salon trouvé:', salon ? 'Oui' : 'Non')
    if (salon) {
      console.log('Owner du salon:', salon.ownerId)
      console.log('Match avec user?', salon.ownerId === userId)
    }

    if (!salon) {
      console.log('Erreur: Salon introuvable')
      return res.status(404).json({
        success: false,
        message: 'Salon introuvable'
      })
    }

    // Vérifier que l'owner possède le salon
    if (salon.ownerId !== userId) {
      console.log('Erreur: Pas de permission (owner différent)')
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission d\'accéder à ce salon'
      })
    }

    console.log('Ownership OK, passage au next()')
    req.salon = salon

    next()
  } catch (error: any) {
    console.error('Erreur dans checkSalonOwnership:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    })
  }
}

// ============= Validation des données de création =============
export function validateCreateSalon(req: Request, res: Response, next: NextFunction) {
  const { name, address, city, zipCode, phone, email } = req.body

  console.log('=== BACKEND: Validation création salon ===')
  console.log('Body reçu:', req.body)

  const errors: string[] = []

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name est requis et doit contenir au moins 2 caractères')
  }

  if (!address || typeof address !== 'string' || address.trim().length < 5) {
    errors.push('address est requis et doit contenir au moins 5 caractères')
  }

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    errors.push('city est requis et doit contenir au moins 2 caractères')
  }

  if (!zipCode || typeof zipCode !== 'string' || zipCode.trim().length < 3) {
    errors.push('zipCode est requis et doit contenir au moins 3 caractères')
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    errors.push('phone est requis et doit contenir au moins 8 caractères')
  }

  if (!email || typeof email !== 'string') {
    errors.push('email est requis')
  } else {
    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('email doit être une adresse email valide')
    }
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
export function validateUpdateSalon(req: Request, res: Response, next: NextFunction) {
  const { name, address, city, zipCode, phone, email } = req.body

  const errors: string[] = []

  // Au moins un champ doit être fourni
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Au moins un champ à mettre à jour doit être fourni'
    })
  }

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('name doit contenir au moins 2 caractères')
  }

  if (address !== undefined && (typeof address !== 'string' || address.trim().length < 5)) {
    errors.push('address doit contenir au moins 5 caractères')
  }

  if (city !== undefined && (typeof city !== 'string' || city.trim().length < 2)) {
    errors.push('city doit contenir au moins 2 caractères')
  }

  if (zipCode !== undefined && (typeof zipCode !== 'string' || zipCode.trim().length < 3)) {
    errors.push('zipCode doit contenir au moins 3 caractères')
  }

  if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length < 8)) {
    errors.push('phone doit contenir au moins 8 caractères')
  }

  if (email !== undefined && typeof email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('email doit être une adresse email valide')
    }
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

// ============= Règles de validation pour express-validator =============
export const createSalonValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom du salon est requis')
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),

  body('address')
    .trim()
    .notEmpty().withMessage('L\'adresse est requise')
    .isLength({ min: 5 }).withMessage('L\'adresse doit contenir au moins 5 caractères'),

  body('city')
    .trim()
    .notEmpty().withMessage('La ville est requise')
    .isLength({ min: 2 }).withMessage('La ville doit contenir au moins 2 caractères'),

  body('zipCode')
    .trim()
    .notEmpty().withMessage('Le code postal est requis')
    .isLength({ min: 3 }).withMessage('Le code postal doit contenir au moins 3 caractères'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Le téléphone est requis')
    .isLength({ min: 8 }).withMessage('Le téléphone doit contenir au moins 8 chiffres'),

  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('L\'email doit être valide')
]

export const updateSalonValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),

  body('address')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('L\'adresse doit contenir au moins 5 caractères'),

  body('city')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('La ville doit contenir au moins 2 caractères'),

  body('zipCode')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Le code postal doit contenir au moins 3 caractères'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 8 }).withMessage('Le téléphone doit contenir au moins 8 chiffres'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('L\'email doit être valide')
]
