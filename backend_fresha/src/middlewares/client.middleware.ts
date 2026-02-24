import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'
import { body } from 'express-validator'

// ============= Vérifier que le client existe =============
export async function checkClientExists(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client introuvable'
      })
    }

    // Attacher le client à la requête pour éviter de le rechercher plus tard
    req.client = client

    next()
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du client'
    })
  }
}

// ============= Validation des données de création =============
export function validateCreateClient(req: Request, res: Response, next: NextFunction) {
  const { email, firstName, lastName, phone } = req.body

  const errors: string[] = []

  if (!email || typeof email !== 'string') {
    errors.push('email est requis')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('email doit être une adresse email valide')
    }
  }

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
    errors.push('firstName est requis et doit contenir au moins 2 caractères')
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
    errors.push('lastName est requis et doit contenir au moins 2 caractères')
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    errors.push('phone est requis et doit contenir au moins 8 caractères')
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
export function validateUpdateClient(req: Request, res: Response, next: NextFunction) {
  const { firstName, lastName, phone } = req.body

  const errors: string[] = []

  // Au moins un champ doit être fourni
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Au moins un champ à mettre à jour doit être fourni'
    })
  }

  if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length < 2)) {
    errors.push('firstName doit contenir au moins 2 caractères')
  }

  if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length < 2)) {
    errors.push('lastName doit contenir au moins 2 caractères')
  }

  if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length < 8)) {
    errors.push('phone doit contenir au moins 8 caractères')
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
export const createClientValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('L\'email doit être valide'),

  body('firstName')
    .trim()
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Le téléphone est requis')
    .isLength({ min: 8 }).withMessage('Le téléphone doit contenir au moins 8 chiffres'),

  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'),

  body('notes')
    .optional()
    .trim(),

  body('marketing')
    .optional()
    .isBoolean().withMessage('marketing doit être un booléen'),

  body('salonId')
    .optional()
    .isString().withMessage('salonId doit etre une chaine valide')
    .trim()
    .notEmpty().withMessage('salonId ne peut pas etre vide')
]

export const updateClientValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Le prénom doit contenir au moins 2 caractères'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 8 }).withMessage('Le téléphone doit contenir au moins 8 chiffres'),

  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'),

  body('notes')
    .optional()
    .trim(),

  body('marketing')
    .optional()
    .isBoolean().withMessage('marketing doit être un booléen')
]
