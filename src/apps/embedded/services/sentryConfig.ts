/**
 * Sentry Configuration
 * Initializes error tracking for production environments
 */

/**
 * Initialize Sentry for error tracking
 * Reads DSN from VITE_SENTRY_DSN environment variable
 */
export function initSentry(): void {
  try {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';

    // Only initialize if DSN is provided
    if (!sentryDsn) {
      console.debug('[Sentry] No DSN configured, error tracking disabled');
      return;
    }

    // Dynamically import Sentry to avoid bundling in dev
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        environment: sentryEnvironment,
        tracesSampleRate: sentryEnvironment === 'production' ? 0.1 : 1.0,
        debug: sentryEnvironment !== 'production',
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        replaysSessionSampleRate: sentryEnvironment === 'production' ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0,
      });

      console.debug(`[Sentry] Initialized with environment: ${sentryEnvironment}`);

      // Store Sentry instance on window for error tracking service to access
      (window as any).__SENTRY__ = Sentry;
    }).catch((error) => {
      console.warn('[Sentry] Failed to load Sentry:', error);
    });
  } catch (error) {
    console.warn('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Set user context for Sentry
 * @param userId - User identifier
 * @param email - User email
 * @param username - User username
 */
export function setSentryUser(userId?: string, email?: string, username?: string): void {
  try {
    const Sentry = (window as any).__SENTRY__;
    if (Sentry && Sentry.setUser) {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });
    }
  } catch (error) {
    console.warn('[Sentry] Failed to set user:', error);
  }
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUser(): void {
  try {
    const Sentry = (window as any).__SENTRY__;
    if (Sentry && Sentry.setUser) {
      Sentry.setUser(null);
    }
  } catch (error) {
    console.warn('[Sentry] Failed to clear user:', error);
  }
}
