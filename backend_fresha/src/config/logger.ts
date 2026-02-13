import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// Format console pour le développement (plus lisible)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`
    }
    return msg
  })
)

// Transport pour les logs d'erreurs (rotation quotidienne)
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d', // Garder 30 jours de logs
  maxSize: '20m',  // 20MB max par fichier
  format: logFormat,
})

// Transport pour tous les logs (rotation quotidienne)
const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d', // Garder 14 jours de logs
  maxSize: '20m',
  format: logFormat,
})

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    errorFileTransport,
    combinedFileTransport,
  ],
  // Ne pas quitter sur erreur
  exitOnError: false,
})

// En développement, logger aussi dans la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }))
}

// En production, toujours logger dans la console aussi (pour Render logs)
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: logFormat, // JSON en production pour parsing
  }))
}

// Helper pour logger les requêtes HTTP
export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
  const logData = {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  }

  if (statusCode >= 500) {
    logger.error('HTTP Request Error', logData)
  } else if (statusCode >= 400) {
    logger.warn('HTTP Request Warning', logData)
  } else {
    logger.info('HTTP Request', logData)
  }
}

// Helper pour logger les erreurs Prisma
export const logDatabaseError = (operation: string, error: any) => {
  logger.error('Database Error', {
    operation,
    error: error.message,
    code: error.code,
    meta: error.meta,
  })
}

// Helper pour logger les tentatives d'authentification
export const logAuthAttempt = (type: 'success' | 'failure', email: string, reason?: string) => {
  const logData = {
    type,
    email,
    timestamp: new Date().toISOString(),
  }

  if (type === 'failure') {
    logger.warn('Auth Attempt Failed', { ...logData, reason })
  } else {
    logger.info('Auth Attempt Success', logData)
  }
}

export default logger
