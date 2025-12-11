import { Request, Response } from 'express'
import { register, login, getProfile } from '../services/auth.service'
import { body, validationResult } from 'express-validator'

// Validation rules
export const registerValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('firstName').notEmpty().withMessage('Prénom requis'),
  body('lastName').notEmpty().withMessage('Nom requis')
]

export const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
]

/**
 * POST /api/auth/register
 * Inscription
 */
export async function registerHandler(req: Request, res: Response) {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array() 
      })
    }
    
    const { email, password, firstName, lastName, phone } = req.body
    
    const result = await register({
      email,
      password,
      firstName,
      lastName,
      phone
    })
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: result
    })
    
  } catch (error: any) {
    console.error('Erreur inscription:', error)
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/auth/login
 * Connexion
 */
export async function loginHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array() 
      })
    }
    
    const { email, password } = req.body
    
    const result = await login({ email, password })
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: result
    })
    
  } catch (error: any) {
    console.error('Erreur connexion:', error)
    res.status(401).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/auth/me
 * Profil de l'utilisateur connecté
 */
export async function getMeHandler(req: Request, res: Response) {
  try {
    // req.user est ajouté par le middleware auth
    const userId = (req as any).user.userId
    
    const profile = await getProfile(userId)
    
    res.json({
      success: true,
      data: profile
    })
    
  } catch (error: any) {
    console.error('Erreur récupération profil:', error)
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}