import express from 'express'
import * as staffAuthController from '../controllers/staffAuth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireOwnerOrManager, requireStaff } from '../middlewares/authorization.middleware'

const router = express.Router()

// Public routes
router.post('/login', staffAuthController.login)
router.post('/first-login', staffAuthController.firstLogin)
router.post('/complete-invitation', staffAuthController.completeInvitation)
router.post('/logout', staffAuthController.logout)

// Staff-only routes
router.get('/me', authenticate, requireStaff, staffAuthController.getProfile)
router.put('/password', authenticate, requireStaff, staffAuthController.updatePassword)

// Owner/manager-only route
router.post('/:staffId/initialize-password', authenticate, requireOwnerOrManager, staffAuthController.initializePassword)

export default router
