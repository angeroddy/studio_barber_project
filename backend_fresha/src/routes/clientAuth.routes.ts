import express from 'express'
import {
  checkEmailHandler,
  setPasswordHandler,
  registerHandler,
  registerWithBookingHandler,
  loginHandler,
  logoutHandler,
  getProfileHandler,
  checkEmailValidation,
  setPasswordValidation,
  registerValidation,
  loginValidation,
  registerWithBookingValidation,
  verifyEmailValidation,
  verifyEmailHandler
} from '../controllers/clientAuth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireClient } from '../middlewares/authorization.middleware'

const router = express.Router()

// Public routes.
router.post('/check-email', checkEmailValidation, checkEmailHandler)
router.post('/set-password', setPasswordValidation, setPasswordHandler)
router.post('/register', registerValidation, registerHandler)
router.post('/register-with-booking', registerWithBookingValidation, registerWithBookingHandler)
router.get('/verify-email', verifyEmailValidation, verifyEmailHandler)
router.post('/login', loginValidation, loginHandler)
router.post('/logout', logoutHandler)

// Client-only protected route.
router.get('/me', authMiddleware, requireClient, getProfileHandler)

export default router
