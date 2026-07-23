import * as Sentry from '@sentry/node';
import { env } from '../../config/env.js';

/**
 * Initializes Sentry error tracking for server and worker processes.
 * Operates gracefully as a no-op if SENTRY_DSN is omitted.
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
    console.log('🛡️ Sentry initialized for error tracking.');
  }
}

export function captureException(error: unknown, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}
