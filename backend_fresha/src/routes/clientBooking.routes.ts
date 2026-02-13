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

const router = express.Router()

// Toutes les routes nécessitent l'authentification

/**
 * POST /api/client-bookings
 * Créer une nouvelle réservation pour le client connecté
 */
router.post('/', authMiddleware, createBookingValidation, createBookingHandler)

/**
 * POST /api/client-bookings/multi-services
 * Créer une réservation multi-services pour le client connecté
 */
router.post('/multi-services', authMiddleware, createMultiServiceBookingValidation, createMultiServiceBookingHandler)

/**
 * GET /api/client-bookings
 * Obtenir toutes les réservations du client connecté
 */
router.get('/', authMiddleware, getBookingsHandler)

/**
 * POST /api/client-bookings/:id/cancel
 * Annuler une réservation
 */
router.post('/:id/cancel', authMiddleware, cancelBookingHandler)

export default router
