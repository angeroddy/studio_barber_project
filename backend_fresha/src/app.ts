import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import Sentry, { initSentry, isSentryEnabled } from './config/sentry'
import { httpLogger } from './middlewares/logging.middleware'
import authRoutes from './routes/auth.routes'
import serviceRoutes from './routes/crudService.routes'
import staffRoutes from './routes/staff.routes'
import staffAuthRoutes from './routes/staffAuth.routes'
import staffBookingRoutes from './routes/staffBooking.routes'
import absenceRoutes from './routes/absence.routes'
import salonRoutes from './routes/salon.routes'
import bookingRoutes from './routes/booking.routes'
import clientRoutes from './routes/client.routes'
import clientAuthRoutes from './routes/clientAuth.routes'
import clientBookingRoutes from './routes/clientBooking.routes'

dotenv.config()
initSentry()

const app = express()

// Render/Proxy support so req.ip is the real client IP for rate limiting.
const trustProxy = Number(process.env.TRUST_PROXY || 0)
if (Number.isFinite(trustProxy) && trustProxy > 0) {
  app.set('trust proxy', trustProxy)
}

const globalRateLimitWindowMs = Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)
const globalRateLimitMax = Number(process.env.GLOBAL_RATE_LIMIT_MAX || 100)
const authRateLimitWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)
const authRateLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX || 5)

app.use(httpLogger)
app.use(helmet())

const allowedOrigins = getAllowedOrigins()
const allowedOriginSet = new Set(allowedOrigins)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true)
        return
      }

      const normalizedOrigin = normalizeOrigin(origin)
      callback(null, Boolean(normalizedOrigin && allowedOriginSet.has(normalizedOrigin)))
    },
    credentials: true
  })
)

const globalLimiter =
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
    ? (req: any, res: any, next: any) => next()
    : rateLimit({
        windowMs: globalRateLimitWindowMs,
        max: globalRateLimitMax,
        message: {
          success: false,
          error: 'Trop de requetes, veuillez reessayer plus tard.'
        },
        standardHeaders: true,
        legacyHeaders: false
      })

const authLimiter =
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
    ? (req: any, res: any, next: any) => next()
    : rateLimit({
        windowMs: authRateLimitWindowMs,
        max: authRateLimitMax,
        skipSuccessfulRequests: true,
        message: {
          success: false,
          error: 'Trop de tentatives de connexion, veuillez reessayer dans 15 minutes.'
        },
        standardHeaders: true,
        legacyHeaders: false
      })

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/staff-auth', authLimiter, staffAuthRoutes)
app.use('/api/client-auth', authLimiter, clientAuthRoutes)

app.use('/api/staff-bookings', globalLimiter, staffBookingRoutes)
app.use('/api/absences', globalLimiter, absenceRoutes)
app.use('/api/client-bookings', globalLimiter, clientBookingRoutes)
app.use('/api/salons', globalLimiter, salonRoutes)
app.use('/api/services', globalLimiter, serviceRoutes)
app.use('/api/staff', globalLimiter, staffRoutes)
app.use('/api/bookings', globalLimiter, bookingRoutes)
app.use('/api/clients', globalLimiter, clientRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Backend is running'
  })
})

if (isSentryEnabled()) {
  Sentry.setupExpressErrorHandler(app)
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvee'
  })
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const logger = require('./config/logger').default

  logger.error('Erreur serveur', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  })

  res.status(500).json({
    success: false,
    error: 'Erreur serveur interne'
  })
})

export default app

function getAllowedOrigins(): string[] {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000']
  const configuredOrigins = process.env.ALLOWED_ORIGINS

  if (!configuredOrigins) {
    return defaultOrigins
  }

  const normalizedOrigins = configuredOrigins
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin))

  if (normalizedOrigins.length === 0) {
    return defaultOrigins
  }

  return Array.from(new Set(normalizedOrigins))
}

function normalizeOrigin(origin: string): string | null {
  const trimmedOrigin = origin.trim()
  if (!trimmedOrigin) {
    return null
  }

  try {
    return new URL(trimmedOrigin).origin
  } catch {
    return null
  }
}
