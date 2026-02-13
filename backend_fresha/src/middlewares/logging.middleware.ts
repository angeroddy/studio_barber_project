import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger'

/**
 * Middleware de logging HTTP
 * Logs automatiquement toutes les requêtes avec leur durée
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()

  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const { method, originalUrl, ip } = req
    const { statusCode } = res

    const logData = {
      method,
      url: originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip: ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
    }

    // Logger selon le code de statut
    if (statusCode >= 500) {
      logger.error('HTTP Request - Server Error', logData)
    } else if (statusCode >= 400) {
      logger.warn('HTTP Request - Client Error', logData)
    } else if (statusCode >= 300) {
      logger.info('HTTP Request - Redirect', logData)
    } else {
      logger.info('HTTP Request - Success', logData)
    }
  })

  next()
}

/**
 * Middleware pour logger les tentatives de connexion
 */
export const logAuthAttempt = (success: boolean, email: string, reason?: string) => {
  if (success) {
    logger.info('Authentication Success', { email })
  } else {
    logger.warn('Authentication Failed', { email, reason })
  }
}
