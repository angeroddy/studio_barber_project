import express from 'express'
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  logoutHandler,
  registerValidation,
  loginValidation
} from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireOwner } from '../middlewares/authorization.middleware'

const router = express.Router()

// Public routes.
router.post('/register', registerValidation, registerHandler)
router.post('/login', loginValidation, loginHandler)
router.post('/logout', logoutHandler)

// Owner-only protected route.
router.get('/me', authMiddleware, requireOwner, getMeHandler)

export default router
