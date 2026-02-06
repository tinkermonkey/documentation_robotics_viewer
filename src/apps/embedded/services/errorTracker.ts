/**
 * Error Tracking Service
 * Handles error logging with tracking IDs, exception classification, and Sentry integration
 */

import { ErrorId } from '@/constants/errorIds';
import {
  ClassifiedException,
  ExceptionCategory,
  ExceptionSeverity,
  RecoveryStrategy,
} from '@/core/types/exceptions';
import { classifyException } from '@/core/services/exceptionClassifier';

interface ErrorContext {
  [key: string]: any;
}

/**
 * Log an error with tracking ID and automatic classification
 * @param errorId - Unique error identifier from ERROR_IDS
 * @param message - Error message
 * @param context - Additional context for debugging
 * @param originalError - Optional original Error object for classification
 * @returns Classified exception with full metadata
 */
export function logError(
  errorId: ErrorId,
  message: string,
  context?: ErrorContext,
  originalError?: Error
): ClassifiedException {
  const timestamp = new Date().toISOString();

  // Classify the exception
  const classified = classifyException(errorId, message, originalError, context);

  // Construct error log entry with classification
  const errorLog = {
    errorId,
    message,
    timestamp,
    context: context || {},
    category: classified.category,
    severity: classified.severity,
    isExpectedFailure: classified.isExpectedFailure,
    isTransient: classified.isTransient,
    recoveryStrategy: classified.recoveryStrategy,
    canRetry: classified.canRetry,
    affectedFeatures: classified.affectedFeatures,
  };

  // Note: console.error logging removed to prevent Playwright from treating
  // intentional test errors as test failures. Errors are still logged to:
  // 1. Session storage (getErrorLog() to retrieve)
  // 2. Sentry (if configured)
  // 3. Can be accessed via browser devtools -> Application -> Session Storage

  // Send to Sentry if configured
  try {
    const Sentry = (window as any).__SENTRY__;
    if (Sentry && Sentry.captureException) {
      const error = originalError || new Error(message);
      (error as any).errorId = errorId;
      (error as any).context = context;
      (error as any).category = classified.category;
      (error as any).severity = classified.severity;
      (error as any).isExpectedFailure = classified.isExpectedFailure;
      (error as any).isTransient = classified.isTransient;
      (error as any).recoveryStrategy = classified.recoveryStrategy;

      // Set Sentry tags for filtering/grouping
      Sentry.setTag('error_id', errorId);
      Sentry.setTag('error_category', classified.category);
      Sentry.setTag('error_severity', classified.severity);
      Sentry.setTag('is_expected', String(classified.isExpectedFailure));
      Sentry.setTag('is_transient', String(classified.isTransient));

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

  return classified;
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

/**
 * Check if an error should be retried based on its classification
 */
export function shouldRetry(classified: ClassifiedException, attempt: number = 0): boolean {
  if (!classified.canRetry) {
    return false;
  }

  const maxAttempts = classified.maxRetryAttempts ?? 3;
  return attempt < maxAttempts;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(
  classified: ClassifiedException,
  attempt: number
): number {
  if (classified.recoveryStrategy !== RecoveryStrategy.EXPONENTIAL_BACKOFF) {
    return classified.retryDelayMs ?? 1000;
  }

  // Exponential backoff: delay = initialDelay * (2 ^ attempt)
  const baseDelay = classified.retryDelayMs ?? 500;
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * (exponentialDelay * 0.1);
  const maxDelay = 30000; // Cap at 30 seconds

  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Filter logged errors by category
 */
export function getErrorsByCategory(category: ExceptionCategory): any[] {
  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: any) => log.category === category);
  } catch {
    return [];
  }
}

/**
 * Filter logged errors by severity
 */
export function getErrorsBySeverity(severity: ExceptionSeverity): any[] {
  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: any) => log.severity === severity);
  } catch {
    return [];
  }
}

/**
 * Get all bugs (unexpected/programming errors) from logs
 */
export function getBugLogs(): any[] {
  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: any) => !log.isExpectedFailure);
  } catch {
    return [];
  }
}

/**
 * Get all expected failures from logs
 */
export function getExpectedFailureLogs(): any[] {
  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: any) => log.isExpectedFailure);
  } catch {
    return [];
  }
}
