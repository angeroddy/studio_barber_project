import { NextFunction, Request, Response } from 'express'
import logger from '../config/logger'
import { expireUnverifiedPendingBookings } from '../services/bookingExpiration.service'

export async function bookingExpirationMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    await expireUnverifiedPendingBookings()
  } catch (error: any) {
    logger.error('Erreur expiration reservations pending non verifiees:', {
      error: error.message,
      stack: error.stack
    })
  }

  next()
}
