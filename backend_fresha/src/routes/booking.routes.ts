import { Router } from 'express'
import * as bookingController from '../controllers/booking.controller'

const router = Router()

// ============= ROUTES =============

// Créer une réservation
router.post('/', bookingController.createBooking)

// Récupérer une réservation par ID
router.get('/:id', bookingController.getBooking)

// Récupérer les réservations d'un salon
router.get('/salon/:salonId', bookingController.getBookingsBySalon)

// Récupérer les réservations d'un staff
router.get('/staff/:staffId', bookingController.getBookingsByStaff)

// Mettre à jour une réservation
router.put('/:id', bookingController.updateBooking)

// Supprimer une réservation
router.delete('/:id', bookingController.deleteBooking)

// Mettre à jour le statut d'une réservation
router.patch('/:id/status', bookingController.updateBookingStatus)

// Vérifier la disponibilité
router.post('/check-availability', bookingController.checkAvailability)

export default router
