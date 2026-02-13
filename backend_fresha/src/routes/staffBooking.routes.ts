import express from 'express'
import * as staffBookingController from '../controllers/staffBooking.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// Routes pour les rendez-vous de l'employé
router.get('/my-bookings', staffBookingController.getMyBookings)
router.get('/salon-bookings', staffBookingController.getSalonBookings)
router.get('/my-stats', staffBookingController.getMyBookingStats)

// Routes pour gérer ses propres rendez-vous
router.patch('/:id/status', staffBookingController.updateBookingStatus)
router.patch('/:id/notes', staffBookingController.addInternalNotes)

export default router
