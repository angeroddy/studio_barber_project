import express from 'express'
import * as staffBookingController from '../controllers/staffBooking.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireStaff } from '../middlewares/authorization.middleware'

const router = express.Router()

// All routes require an authenticated staff account.
router.use(authenticate, requireStaff)

// Staff booking routes.
router.get('/my-bookings', staffBookingController.getMyBookings)
router.get('/salon-bookings', staffBookingController.getSalonBookings)
router.get('/my-stats', staffBookingController.getMyBookingStats)

// Staff self-management routes.
router.patch('/:id/status', staffBookingController.updateBookingStatus)
router.patch('/:id/notes', staffBookingController.addInternalNotes)

export default router
