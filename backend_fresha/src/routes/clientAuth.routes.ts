import express from 'express'
import {
  checkEmailHandler,
  setPasswordHandler,
  registerHandler,
  loginHandler,
  getProfileHandler,
  checkEmailValidation,
  setPasswordValidation,
  registerValidation,
  loginValidation
} from '../controllers/clientAuth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = express.Router()

// Routes publiques

/**
 * POST /api/client-auth/check-email
 * Vérifier si un email existe et si le client a déjà un mot de passe
 */
router.post('/check-email', checkEmailValidation, checkEmailHandler)

/**
 * POST /api/client-auth/set-password
 * Définir le mot de passe pour un client existant (migré de l'ancienne app)
 */
router.post('/set-password', setPasswordValidation, setPasswordHandler)

/**
 * POST /api/client-auth/register
 * Inscription complète d'un nouveau client
 */
router.post('/register', registerValidation, registerHandler)

/**
 * POST /api/client-auth/login
 * Connexion d'un client
 */
router.post('/login', loginValidation, loginHandler)

// Routes protégées

/**
 * GET /api/client-auth/me
 * Obtenir le profil du client connecté
 */
router.get('/me', authMiddleware, getProfileHandler)

export default router
