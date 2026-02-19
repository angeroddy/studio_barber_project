import express from 'express'
import {
  createBookingHandler,
  getBookingsHandler,
  cancelBookingHandler,
  createBookingValidation,
  createMultiServiceBookingHandler,
  createMultiServiceBookingValidation
} from '../controllers/clientBooking.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireClient } from '../middlewares/authorization.middleware'
import { bookingExpirationMiddleware } from '../middlewares/bookingExpiration.middleware'

const router = express.Router()

router.use(bookingExpirationMiddleware)

// All routes require an authenticated client account.
router.use(authMiddleware, requireClient)

/**
 * POST /api/client-bookings
 * Creer une nouvelle reservation pour le client connecte
 */
router.post('/', createBookingValidation, createBookingHandler)

/**
 * POST /api/client-bookings/multi-services
 * Creer une reservation multi-services pour le client connecte
 */
router.post('/multi-services', createMultiServiceBookingValidation, createMultiServiceBookingHandler)

/**
 * GET /api/client-bookings
 * Obtenir toutes les reservations du client connecte
 */
router.get('/', getBookingsHandler)

/**
 * POST /api/client-bookings/:id/cancel
 * Annuler une reservation
 */
router.post('/:id/cancel', cancelBookingHandler)

export default router
