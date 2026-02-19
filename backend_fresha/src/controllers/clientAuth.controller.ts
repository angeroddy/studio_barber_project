import { Request, Response } from 'express'
import { body, query, validationResult } from 'express-validator'
import logger from '../config/logger'
import { clearAuthCookie, setAuthCookie } from '../config/authCookie'
import {
  checkEmailExists,
  setPasswordForExistingClient,
  registerClientWithEmailVerification,
  loginClient,
  getClientProfile,
  registerClientWithPendingBooking,
  verifyClientEmailAndFinalizeBooking
} from '../services/clientAuth.service'

function getFrontendBaseUrl(): string {
  const configured = process.env.CLIENT_APP_URL?.trim() || process.env.FRONTEND_URL?.trim()
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  return 'http://localhost:3000'
}

function buildFrontendUrl(path: string): string {
  return `${getFrontendBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

export const checkEmailValidation = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail()
]

export const setPasswordValidation = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere special (@$!%*?&)'
    )
]

export const registerValidation = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Mot de passe minimum 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractere special (@$!%*?&)'
    ),
  body('firstName').notEmpty().withMessage('Prenom requis'),
  body('lastName').notEmpty().withMessage('Nom requis'),
  body('phone').notEmpty().withMessage('Telephone requis')
]

export const registerWithBookingValidation = [
  ...registerValidation,
  body('salonId').notEmpty().withMessage('Salon requis'),
  body('serviceId').notEmpty().withMessage('Service requis'),
  body('staffId').optional().isString().withMessage('Professionnel invalide'),
  body('startTime').isISO8601().withMessage('Date de reservation invalide'),
  body('notes').optional().isString().withMessage('Notes invalides')
]

export const loginValidation = [
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis')
]

export const verifyEmailValidation = [
  query('token').notEmpty().withMessage('Token requis')
]

export async function checkEmailHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const result = await checkEmailExists(email)

    return res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    logger.error('Erreur verification email:', { error: error.message, stack: error.stack })
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

export async function setPasswordHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const { password } = req.body

    const result = await setPasswordForExistingClient({ email, password })
    setAuthCookie(res, result.token)

    return res.status(201).json({
      success: true,
      message: 'Mot de passe defini avec succes. Bienvenue !',
      data: result
    })
  } catch (error: any) {
    logger.error('Erreur definition mot de passe:', { error: error.message, stack: error.stack })
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

export async function registerHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const { password, firstName, lastName, phone, salonId, marketing } = req.body

    const result = await registerClientWithEmailVerification({
      email,
      password,
      firstName,
      lastName,
      phone,
      salonId,
      marketing
    })

    return res.status(201).json({
      success: true,
      message: 'Un email de confirmation vous a ete envoye',
      data: result
    })
  } catch (error: any) {
    logger.error('Erreur inscription:', { error: error.message, stack: error.stack })
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

export async function registerWithBookingHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const { password, firstName, lastName, phone, salonId, serviceId, staffId, startTime, notes } = req.body

    const result = await registerClientWithPendingBooking({
      email,
      password,
      firstName,
      lastName,
      phone,
      salonId,
      serviceId,
      staffId,
      startTime,
      notes
    })

    return res.status(201).json({
      success: true,
      message: 'Un email de confirmation vous a ete envoye',
      data: result
    })
  } catch (error: any) {
    logger.error('Erreur inscription avec reservation:', { error: error.message, stack: error.stack })
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.redirect(302, buildFrontendUrl('/?emailVerification=invalid'))
  }

  try {
    const token = String(req.query.token || '').trim()
    const result = await verifyClientEmailAndFinalizeBooking(token)
    setAuthCookie(res, result.token)

    if (result.salonSlug) {
      return res.redirect(302, buildFrontendUrl(`/reserver/${result.salonSlug}/confirmation?verified=1`))
    }

    return res.redirect(302, buildFrontendUrl('/dashboard?verified=1'))
  } catch (error: any) {
    logger.error('Erreur verification email client:', { error: error.message, stack: error.stack })
    return res.redirect(302, buildFrontendUrl('/?emailVerification=failed'))
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const { password } = req.body
    const result = await loginClient({ email, password })

    setAuthCookie(res, result.token)

    return res.json({
      success: true,
      message: 'Connexion reussie',
      data: result
    })
  } catch (error: any) {
    logger.error('Erreur connexion:', { error: error.message, stack: error.stack })
    return res.status(401).json({
      success: false,
      error: error.message
    })
  }
}

export async function getProfileHandler(req: Request, res: Response) {
  try {
    const clientId = (req as any).user.userId
    const profile = await getClientProfile(clientId)

    return res.json({
      success: true,
      data: profile
    })
  } catch (error: any) {
    logger.error('Erreur recuperation profil:', { error: error.message, stack: error.stack })
    return res.status(404).json({
      success: false,
      error: error.message
    })
  }
}

export async function logoutHandler(req: Request, res: Response) {
  clearAuthCookie(res)
  return res.json({
    success: true,
    message: 'Deconnexion reussie'
  })
}
