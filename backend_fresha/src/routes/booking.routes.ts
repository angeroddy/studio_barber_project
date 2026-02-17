import { Router } from 'express'
import * as bookingController from '../controllers/booking.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireOwner } from '../middlewares/authorization.middleware'

const router = Router()

// ============= ROUTES =============

// Public booking discovery route.
router.get('/available-slots', bookingController.getAvailableSlots)

// All remaining booking management routes are owner-only.
router.use(authMiddleware, requireOwner)

router.post('/check-availability', bookingController.checkAvailability)
router.post('/', bookingController.createBooking)
router.post('/multi-services', bookingController.createMultiServiceBooking)

// Collection routes
router.get('/salon/:salonId', bookingController.getBookingsBySalon)
router.get('/staff/:staffId', bookingController.getBookingsByStaff)

// Single booking routes
router.get('/:id', bookingController.getBooking)
router.put('/:id', bookingController.updateBooking)
router.delete('/:id', bookingController.deleteBooking)
router.patch('/:id/status', bookingController.updateBookingStatus)

export default router
