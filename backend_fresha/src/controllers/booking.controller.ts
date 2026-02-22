import { Request, Response } from 'express'
import * as bookingService from '../services/booking.service'
import logger from '../config/logger'

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
    logger.error('Erreur lors de la création de la réservation:', { error: error.message, stack: error.stack })
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
    logger.error('Erreur lors de la récupération de la réservation:', { error: error.message, stack: error.stack })
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
    const { startDate, endDate, staffId, status, page, limit, lite } = req.query

    const result = await bookingService.getBookingsBySalon(salonId, {
      startDate: startDate as string,
      endDate: endDate as string,
      staffId: staffId as string,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      lite: lite === 'true'
    })

    res.json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des réservations:', { error: error.message, stack: error.stack })
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
    const { startDate, endDate, status, page, limit, lite } = req.query

    const result = await bookingService.getBookingsByStaff(staffId, {
      startDate: startDate as string,
      endDate: endDate as string,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      lite: lite === 'true'
    })

    res.json({
      success: true,
      ...result  // Déstructure { data: [...], pagination: {...} }
    })
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des réservations:', { error: error.message, stack: error.stack })
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
    logger.error('Erreur lors de la mise à jour de la réservation:', { error: error.message, stack: error.stack })
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
    logger.error('Erreur lors de la suppression de la réservation:', { error: error.message, stack: error.stack })
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
    logger.error('Erreur lors de la mise à jour du statut:', { error: error.message, stack: error.stack })
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
    logger.error('Erreur lors de la vérification de la disponibilité:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la vérification de la disponibilité'
    })
  }
}

// ============= GET AVAILABLE SLOTS =============
export async function getAvailableSlots(req: Request, res: Response) {
  try {
    const { salonId, staffId, serviceId, date, duration } = req.query

    // Validation des paramètres
    if (!salonId || !staffId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants : salonId, staffId, serviceId et date sont requis'
      })
    }

    // Convertir la date
    const dateObj = new Date(date as string)
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide'
      })
    }

    // Convertir la durée si fournie
    const customDuration = duration ? parseInt(duration as string) : undefined

    // Appeler le service
    const slots = await bookingService.getAvailableSlots(
      salonId as string,
      staffId as string,
      serviceId as string,
      dateObj,
      customDuration
    )

    res.json({
      success: true,
      data: slots,
      count: slots.length
    })
  } catch (error: any) {
    logger.error('Erreur lors de la récupération des créneaux disponibles:', { error: error.message, stack: error.stack })
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération des créneaux disponibles'
    })
  }
}

// ============= CREATE MULTI-SERVICE BOOKING =============
export async function createMultiServiceBooking(req: Request, res: Response) {
  try {
    const booking = await bookingService.createMultiServiceBooking(req.body)
    res.status(201).json({
      success: true,
      message: 'Réservation multi-services créée avec succès',
      data: booking
    })
  } catch (error: any) {
    logger.error('Erreur lors de la création de la réservation multi-services:', {
      error: error.message,
      stack: error.stack
    })
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la réservation multi-services'
    })
  }
}
