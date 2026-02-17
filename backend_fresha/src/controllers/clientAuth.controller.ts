import { Request, Response } from 'express'
import {
  checkEmailExists,
  setPasswordForExistingClient,
  registerNewClient,
  loginClient,
  getClientProfile
} from '../services/clientAuth.service'
import { body, validationResult } from 'express-validator'
import logger from '../config/logger'
import { clearAuthCookie, setAuthCookie } from '../config/authCookie'

// Validation rules
export const checkEmailValidation = [
  body('email').isEmail().withMessage('Email invalide')
]

export const setPasswordValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)')
]

export const registerValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'),
  body('firstName').notEmpty().withMessage('Prénom requis'),
  body('lastName').notEmpty().withMessage('Nom requis'),
  body('phone').notEmpty().withMessage('Téléphone requis')
]

export const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
]

/**
 * POST /api/client-auth/check-email
 * Vérifier si un email existe et si le client a déjà un mot de passe
 */
export async function checkEmailHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { email } = req.body

    const result = await checkEmailExists(email)

    res.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    logger.error('Erreur vérification email:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/client-auth/set-password
 * Définir le mot de passe pour un client existant (migré)
 */
export async function setPasswordHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    const result = await setPasswordForExistingClient({ email, password })

    setAuthCookie(res, result.token)

    res.status(201).json({
      success: true,
      message: 'Mot de passe défini avec succès. Bienvenue !',
      data: result
    })

  } catch (error: any) {
    logger.error('Erreur définition mot de passe:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/client-auth/register
 * Inscription complète d'un nouveau client
 */
export async function registerHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { email, password, firstName, lastName, phone, salonId, marketing } = req.body

    const result = await registerNewClient({
      email,
      password,
      firstName,
      lastName,
      phone,
      salonId,
      marketing
    })

    setAuthCookie(res, result.token)

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: result
    })

  } catch (error: any) {
    logger.error('Erreur inscription:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/client-auth/login
 * Connexion d'un client
 */
export async function loginHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { email, password } = req.body

    const result = await loginClient({ email, password })

    setAuthCookie(res, result.token)

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: result
    })

  } catch (error: any) {
    logger.error('Erreur connexion:', { error: error.message, stack: error.stack })
    res.status(401).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/client-auth/me
 * Profil du client connecté
 */
export async function getProfileHandler(req: Request, res: Response) {
  try {
    // req.user est ajouté par le middleware auth
    const clientId = (req as any).user.userId

    const profile = await getClientProfile(clientId)

    res.json({
      success: true,
      data: profile
    })

  } catch (error: any) {
    logger.error('Erreur récupération profil:', { error: error.message, stack: error.stack })
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/client-auth/logout
 * Déconnexion client (suppression cookie HttpOnly)
 */
export async function logoutHandler(req: Request, res: Response) {
  clearAuthCookie(res)
  return res.json({
    success: true,
    message: 'Déconnexion réussie'
  })
}
