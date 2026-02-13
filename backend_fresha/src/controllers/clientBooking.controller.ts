import { Request, Response } from 'express'
import {
  createClientBooking,
  getClientBookings,
  cancelClientBooking,
  createClientMultiServiceBooking
} from '../services/clientBooking.service'
import { body, validationResult } from 'express-validator'
import logger from '../config/logger'

// Validation rules
export const createBookingValidation = [
  body('salonId').notEmpty().withMessage('ID du salon requis'),
  body('serviceId').notEmpty().withMessage('ID du service requis'),
  body('startTime').isISO8601().withMessage('Heure de début invalide (format ISO 8601 requis)')
]

export const createMultiServiceBookingValidation = [
  body('salonId').notEmpty().withMessage('ID du salon requis'),
  body('services').isArray({ min: 1 }).withMessage('Au moins un service doit être fourni'),
  body('services.*.serviceId').notEmpty().withMessage('ID du service requis pour chaque service'),
  body('startTime').isISO8601().withMessage('Heure de début invalide (format ISO 8601 requis)')
]

/**
 * POST /api/client-bookings
 * Créer une réservation pour le client authentifié
 */
export async function createBookingHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    // Récupérer l'ID du client depuis le token (ajouté par authMiddleware)
    const clientId = (req as any).user.userId

    const { salonId, staffId, serviceId, startTime, notes } = req.body

    const booking = await createClientBooking({
      clientId,
      salonId,
      staffId,
      serviceId,
      startTime,
      notes
    })

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: booking
    })

  } catch (error: any) {
    logger.error('Erreur création réservation client:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * GET /api/client-bookings
 * Obtenir toutes les réservations du client authentifié
 */
export async function getBookingsHandler(req: Request, res: Response) {
  try {
    const clientId = (req as any).user.userId

    const bookings = await getClientBookings(clientId)

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    })

  } catch (error: any) {
    logger.error('Erreur récupération réservations client:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/client-bookings/:id/cancel
 * Annuler une réservation
 */
export async function cancelBookingHandler(req: Request, res: Response) {
  try {
    const clientId = (req as any).user.userId
    const { id } = req.params

    const booking = await cancelClientBooking(id, clientId)

    res.json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: booking
    })

  } catch (error: any) {
    logger.error('Erreur annulation réservation:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * POST /api/client-bookings/multi-services
 * Créer une réservation multi-services pour le client authentifié
 */
export async function createMultiServiceBookingHandler(req: Request, res: Response) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    // Récupérer l'ID du client depuis le token (ajouté par authMiddleware)
    const clientId = (req as any).user.userId

    const { salonId, services, startTime, notes } = req.body

    const booking = await createClientMultiServiceBooking({
      clientId,
      salonId,
      services,
      startTime,
      notes
    })

    res.status(201).json({
      success: true,
      message: 'Réservation multi-services créée avec succès',
      data: booking
    })

  } catch (error: any) {
    logger.error('Erreur création réservation multi-services client:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}
