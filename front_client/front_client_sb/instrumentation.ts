/**
 * Fichier d'instrumentation Next.js pour Sentry
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Ne charger Sentry que côté serveur et si configuré
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',

      // Performance Monitoring
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

      // Filtrer les informations sensibles
      beforeSend(event) {
        // Ne jamais logger les cookies, tokens, etc.
        if (event.request?.headers) {
          delete event.request.headers['cookie']
          delete event.request.headers['authorization']
        }
        return event
      },
    })
  }

  // Côté Edge Runtime
  if (process.env.NEXT_RUNTIME === 'edge' && process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    })
  }
}
