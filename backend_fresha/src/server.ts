import app from './app'
import logger from './config/logger'
import { startBookingRecapWorker } from './services/bookingRecap.service'

function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
  const missing: string[] = []
  const warnings: string[] = []

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  })

  if (process.env.JWT_SECRET) {
    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret.length < 32) {
      warnings.push('JWT_SECRET est trop court (minimum 32 caracteres recommande)')
    }
    if (jwtSecret === 'votre_secret_jwt_super_long_et_securise') {
      warnings.push('JWT_SECRET utilise la valeur par defaut - CHANGEZ-LA IMMEDIATEMENT!')
    }
  }

  if (missing.length > 0) {
    logger.error("Variables d'environnement manquantes", { missing })
    console.error("ERREUR: Variables d'environnement manquantes:")
    missing.forEach((value) => console.error(`   - ${value}`))
    console.error('\nCopiez .env.example vers .env et configurez les valeurs')
    process.exit(1)
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => logger.warn(warning))
    console.warn('AVERTISSEMENTS:')
    warnings.forEach((warning) => console.warn(`   - ${warning}`))
    console.warn('')
  }

  logger.info("Variables d'environnement validees")
}

validateEnvironment()

const PORT = process.env.PORT || 5000
const publicBaseUrl = getPublicBaseUrl()

app.listen(PORT, () => {
  startBookingRecapWorker()

  logger.info('Backend demarre', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `${publicBaseUrl}/health`,
    corsOrigins: process.env.ALLOWED_ORIGINS || 'localhost seulement'
  })

  console.log(`Backend demarre sur ${publicBaseUrl}`)
  console.log(`Health check: ${publicBaseUrl}/health`)
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`)
  console.log(`CORS active pour: ${process.env.ALLOWED_ORIGINS || 'localhost seulement'}`)
})

function getPublicBaseUrl(): string {
  const configured =
    process.env.BACKEND_PUBLIC_URL?.trim() ||
    process.env.RENDER_EXTERNAL_URL?.trim()

  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  return `http://localhost:${PORT}`
}
