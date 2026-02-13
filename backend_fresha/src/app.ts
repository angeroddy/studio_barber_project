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

// Initialiser Sentry en PREMIER (avant Express)
initSentry()

const app = express()

// Sentry Request Handler - Doit être le premier middleware (uniquement si Sentry est activé)
// Note: In Sentry v10+, request/tracing handlers are integrated differently
// The error handler setup at the end handles instrumentation

// HTTP Request Logging - À activer en premier pour capturer toutes les requêtes
app.use(httpLogger)

// Security Headers - Helmet
app.use(helmet())

// CORS Configuration - Dynamique selon l'environnement
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000']

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

// Rate Limiting Global - Protection contre les attaques DDoS
// Désactivé en test et développement pour faciliter les tests
const globalLimiter = (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development')
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requêtes en production
      message: {
        success: false,
        error: 'Trop de requêtes, veuillez réessayer plus tard.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    })

// Rate Limiting Strict pour les routes d'authentification
// Désactivé en test et développement pour faciliter les tests
const authLimiter = (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development')
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 tentatives en production
      message: {
        success: false,
        error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    })

// Body parsers avec limite de payload (protection DoS)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes avec rate limiting
// Routes d'authentification avec limite stricte (5 tentatives/15min)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/staff-auth', authLimiter, staffAuthRoutes)
app.use('/api/client-auth', authLimiter, clientAuthRoutes)

// Autres routes avec limite globale (100 requêtes/15min)
app.use('/api/staff-bookings', globalLimiter, staffBookingRoutes)
app.use('/api/absences', globalLimiter, absenceRoutes)
app.use('/api/client-bookings', globalLimiter, clientBookingRoutes)
app.use('/api/salons', globalLimiter, salonRoutes)
app.use('/api/services', globalLimiter, serviceRoutes)
app.use('/api/staff', globalLimiter, staffRoutes)
app.use('/api/bookings', globalLimiter, bookingRoutes)
app.use('/api/clients', globalLimiter, clientRoutes)

// Health Check Endpoint - Pour monitoring (Render, Kubernetes, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Backend is running'
  })
})

// Sentry Error Handler - Doit être AVANT les autres error handlers (uniquement si Sentry est activé)
if (isSentryEnabled()) {
  Sentry.setupExpressErrorHandler(app)
}

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  })
})

// Gestion des erreurs globales
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Import logger localement pour éviter les dépendances circulaires
  const logger = require('./config/logger').default

  logger.error('Erreur serveur', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  })

  // L'erreur a déjà été envoyée à Sentry par le middleware Sentry.Handlers.errorHandler()
  res.status(500).json({
    success: false,
    error: 'Erreur serveur interne'
  })
})

export default app