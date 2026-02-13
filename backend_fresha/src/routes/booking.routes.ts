import { Router } from 'express'
import * as bookingController from '../controllers/booking.controller'

const router = Router()

// ============= ROUTES =============

// Get available slots (must be before dynamic :id routes)
router.get('/available-slots', bookingController.getAvailableSlots)

// Create bookings
router.post('/', bookingController.createBooking)
router.post('/multi-services', bookingController.createMultiServiceBooking)
router.post('/check-availability', bookingController.checkAvailability)

// Collection routes
router.get('/salon/:salonId', bookingController.getBookingsBySalon)
router.get('/staff/:staffId', bookingController.getBookingsByStaff)

// Single booking routes
router.get('/:id', bookingController.getBooking)
router.put('/:id', bookingController.updateBooking)
router.delete('/:id', bookingController.deleteBooking)
router.patch('/:id/status', bookingController.updateBookingStatus)

export default router
