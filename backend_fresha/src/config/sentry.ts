import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

/**
 * Configuration Sentry pour le monitoring d'erreurs en production
 *
 * Pour obtenir votre DSN:
 * 1. Créer un compte sur https://sentry.io
 * 2. Créer un nouveau projet Node.js/Express
 * 3. Copier le DSN fourni
 * 4. Ajouter SENTRY_DSN dans votre .env
 */

let isSentryInitialized = false

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN

  // Ne pas initialiser Sentry si pas de DSN configuré (développement local)
  if (!dsn) {
    console.log('ℹ️  Sentry non configuré (SENTRY_DSN manquant) - mode développement')
    return
  }

  // Initialiser Sentry uniquement en staging/production
  if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'production',

      // Performance Monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

      // Profiling (optionnel - consomme des ressources)
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      integrations: [
        nodeProfilingIntegration(),
      ],

      // Release tracking (pour associer erreurs avec versions Git)
      release: process.env.SENTRY_RELEASE || undefined,

      // Filtrer les informations sensibles
      beforeSend(event) {
        // Ne jamais logger les tokens, mots de passe, etc.
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
        }
        if (event.request?.data) {
          if (typeof event.request.data === 'object' && event.request.data !== null) {
            const requestData = event.request.data as Record<string, unknown>
            delete requestData.password
            delete requestData.token
          }
        }
        return event
      },
    })

    console.log('✅ Sentry initialisé - Environnement:', process.env.NODE_ENV)
    isSentryInitialized = true
  }
}

export const isSentryEnabled = () => isSentryInitialized

// Helper pour capturer des erreurs manuellement
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('additional', context)
  }
  Sentry.captureException(error)
}

// Helper pour logger des messages custom
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level)
}

export default Sentry
