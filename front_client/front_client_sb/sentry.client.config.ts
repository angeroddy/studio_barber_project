/**
 * Configuration Sentry côté client (browser) pour Next.js
 */
import * as Sentry from '@sentry/nextjs'

// Initialiser Sentry uniquement si DSN configuré
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',

    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Sample rates
    tracesSampleRate: 0.1,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% des sessions normales
    replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreurs

    // Filtrer les données sensibles
    beforeSend(event) {
      // Supprimer les données sensibles des logs
      if (event.request?.cookies) {
        delete event.request.cookies
      }
      return event
    },
  })
}
