import app from './app'
import logger from './config/logger'

// Validation des variables d'environnement critiques au démarrage
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
  const missing: string[] = []
  const warnings: string[] = []

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  })

  // Validation spécifique pour JWT_SECRET
  if (process.env.JWT_SECRET) {
    const jwtSecret = process.env.JWT_SECRET
    if (jwtSecret.length < 32) {
      warnings.push('JWT_SECRET est trop court (minimum 32 caractères recommandé)')
    }
    if (jwtSecret === 'votre_secret_jwt_super_long_et_securise') {
      warnings.push('JWT_SECRET utilise la valeur par défaut - CHANGEZ-LA IMMÉDIATEMENT!')
    }
  }

  // Fail-fast si des variables critiques manquent
  if (missing.length > 0) {
    logger.error('Variables d\'environnement manquantes', { missing })
    console.error('❌ ERREUR: Variables d\'environnement manquantes:')
    missing.forEach(v => console.error(`   - ${v}`))
    console.error('\n💡 Copiez .env.example vers .env et configurez les valeurs')
    process.exit(1)
  }

  // Afficher les warnings
  if (warnings.length > 0) {
    warnings.forEach(w => logger.warn(w))
    console.warn('⚠️  AVERTISSEMENTS:')
    warnings.forEach(w => console.warn(`   - ${w}`))
    console.warn('')
  }

  logger.info('Variables d\'environnement validées')
}

// Valider avant de démarrer le serveur
validateEnvironment()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  logger.info('Backend démarré', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `/health`,
    corsOrigins: process.env.ALLOWED_ORIGINS || 'localhost seulement',
  })

  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS activé pour: ${process.env.ALLOWED_ORIGINS || 'localhost seulement'}`)
})