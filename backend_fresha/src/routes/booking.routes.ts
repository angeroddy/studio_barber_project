import { Router } from 'express'
import * as bookingController from '../controllers/booking.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requireOwnerOrStaff } from '../middlewares/authorization.middleware'
import { bookingExpirationMiddleware } from '../middlewares/bookingExpiration.middleware'

const router = Router()

// ============= ROUTES =============
router.use(bookingExpirationMiddleware)

// Public booking discovery route.
router.get('/available-slots', bookingController.getAvailableSlots)

// Protected routes
router.use(authMiddleware)

// Read routes: owner and staff can visualize bookings.
router.get('/salon/:salonId', requireOwnerOrStaff, bookingController.getBookingsBySalon)
router.get('/staff/:staffId', requireOwnerOrStaff, bookingController.getBookingsByStaff)
router.get('/:id', requireOwnerOrStaff, bookingController.getBooking)

// Write routes: owner and staff can manage calendar operations.
router.post('/check-availability', requireOwnerOrStaff, bookingController.checkAvailability)
router.post('/', requireOwnerOrStaff, bookingController.createBooking)
router.post('/multi-services', requireOwnerOrStaff, bookingController.createMultiServiceBooking)
router.put('/:id', requireOwnerOrStaff, bookingController.updateBooking)
router.delete('/:id', requireOwnerOrStaff, bookingController.deleteBooking)
router.patch('/:id/status', requireOwnerOrStaff, bookingController.updateBookingStatus)

export default router
