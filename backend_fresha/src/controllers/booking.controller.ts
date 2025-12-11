import { Request, Response } from 'express'
import * as bookingService from '../services/booking.service'

// ============= CREATE =============
export async function createBooking(req: Request, res: Response) {
  try {
    const booking = await bookingService.createBooking(req.body)
    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: booking
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de la réservation:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la réservation'
    })
  }
}

// ============= READ (un seul) =============
export async function getBooking(req: Request, res: Response) {
  try {
    const { id } = req.params
    const booking = await bookingService.getBooking(id)
    res.json({
      success: true,
      data: booking
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la réservation:', error)
    res.status(404).json({
      success: false,
      message: error.message || 'Réservation introuvable'
    })
  }
}

// ============= READ (liste par salon) =============
export async function getBookingsBySalon(req: Request, res: Response) {
  try {
    const { salonId } = req.params
    const { startDate, endDate, staffId, status } = req.query

    const bookings = await bookingService.getBookingsBySalon(salonId, {
      startDate: startDate as string,
      endDate: endDate as string,
      staffId: staffId as string,
      status: status as string
    })

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des réservations:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des réservations'
    })
  }
}

// ============= READ (liste par staff) =============
export async function getBookingsByStaff(req: Request, res: Response) {
  try {
    const { staffId } = req.params
    const { startDate, endDate, status } = req.query

    const bookings = await bookingService.getBookingsByStaff(staffId, {
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string
    })

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    })
  } catch (error: any) {
    console.error('Erreur lors de la récupération des réservations:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des réservations'
    })
  }
}

// ============= UPDATE =============
export async function updateBooking(req: Request, res: Response) {
  try {
    const { id } = req.params
    const booking = await bookingService.updateBooking({
      id,
      ...req.body
    })
    res.json({
      success: true,
      message: 'Réservation mise à jour avec succès',
      data: booking
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la réservation:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la réservation'
    })
  }
}

// ============= DELETE =============
export async function deleteBooking(req: Request, res: Response) {
  try {
    const { id } = req.params
    const result = await bookingService.deleteBooking(id)
    res.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la réservation:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression de la réservation'
    })
  }
}

// ============= UPDATE STATUS =============
export async function updateBookingStatus(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body
    const booking = await bookingService.updateBookingStatus(id, status)
    res.json({
      success: true,
      message: 'Statut de la réservation mis à jour avec succès',
      data: booking
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du statut'
    })
  }
}

// ============= CHECK AVAILABILITY =============
export async function checkAvailability(req: Request, res: Response) {
  try {
    const { staffId, startTime, endTime, excludeBookingId } = req.body
    const result = await bookingService.checkAvailability(
      staffId,
      startTime,
      endTime,
      excludeBookingId
    )
    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Erreur lors de la vérification de la disponibilité:', error)
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification de la disponibilité'
    })
  }
}
