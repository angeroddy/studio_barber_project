import express from 'express'
import * as staffAuthController from '../controllers/staffAuth.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = express.Router()

// Routes publiques
router.post('/login', staffAuthController.login)
router.post('/first-login', staffAuthController.firstLogin) // Première connexion (création mot de passe)

// Routes protégées (authentification staff requise)
router.get('/me', authenticate, staffAuthController.getProfile)
router.put('/password', authenticate, staffAuthController.updatePassword)

// Route protégée pour l'Owner (initialisation du mot de passe d'un staff)
router.post('/:staffId/initialize-password', authenticate, staffAuthController.initializePassword)

export default router
