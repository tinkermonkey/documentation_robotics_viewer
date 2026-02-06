/**
 * Error Tracking Service
 * Handles error logging with tracking IDs and Sentry integration
 */

import { ErrorId } from '@/constants/errorIds';

interface ErrorContext {
  [key: string]: any;
}

/**
 * Log an error with tracking ID
 * @param errorId - Unique error identifier from ERROR_IDS
 * @param message - Error message
 * @param context - Additional context for debugging
 */
export function logError(
  errorId: ErrorId,
  message: string,
  context?: ErrorContext
): void {
  const timestamp = new Date().toISOString();

  // Construct error log entry
  const errorLog = {
    errorId,
    message,
    timestamp,
    context: context || {},
  };

  // Log to console with tracking ID
  console.error(
    `[${errorId}] ${message}`,
    context ? context : ''
  );

  // Send to Sentry if configured
  try {
    const Sentry = (window as any).__SENTRY__;
    if (Sentry && Sentry.captureException) {
      const error = new Error(message);
      (error as any).errorId = errorId;
      (error as any).context = context;
      Sentry.captureException(error);
    }
  } catch {
    // Fail silently if Sentry is not available
  }

  // Store in session storage for debugging (keep last 50 errors)
  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    logs.push(errorLog);

    // Keep only last 50 errors
    if (logs.length > 50) {
      logs.shift();
    }

    sessionStorage.setItem(storageKey, JSON.stringify(logs));
  } catch {
    // Fail silently if storage is not available
  }
}

/**
 * Log a warning with optional tracking ID
 * @param message - Warning message
 * @param context - Additional context
 */
export function logWarning(
  message: string,
  context?: ErrorContext
): void {
  const timestamp = new Date().toISOString();

  console.warn(message, context ? context : '');

  // Store in session storage for debugging
  try {
    const storageKey = 'app:warning_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    logs.push({
      message,
      timestamp,
      context: context || {},
    });

    // Keep only last 50 warnings
    if (logs.length > 50) {
      logs.shift();
    }

    sessionStorage.setItem(storageKey, JSON.stringify(logs));
  } catch {
    // Fail silently if storage is not available
  }
}

/**
 * Get all logged errors from session storage
 */
export function getErrorLog(): any[] {
  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all logged errors from session storage
 */
export function clearErrorLog(): void {
  try {
    sessionStorage.removeItem('app:error_log');
    sessionStorage.removeItem('app:warning_log');
  } catch {
    // Fail silently if storage is not available
  }
}
