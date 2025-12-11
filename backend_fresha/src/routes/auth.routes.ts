import express from 'express'
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  registerValidation,
  loginValidation
} from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = express.Router()

// Routes publiques
router.post('/register', registerValidation, registerHandler)
router.post('/login', loginValidation, loginHandler)

// Routes protégées
router.get('/me', authMiddleware, getMeHandler)

export default router