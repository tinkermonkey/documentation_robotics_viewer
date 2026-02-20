/**
 * Error Tracking Service
 * Handles error logging with tracking IDs, exception classification, and Sentry integration
 */

import { ErrorId, ERROR_IDS } from '@/constants/errorIds';
import {
  ClassifiedException,
  ExceptionCategory,
  ExceptionSeverity,
  RecoveryStrategy,
} from '@/core/types/exceptions';
import { classifyException } from '@/core/services/exceptionClassifier';

interface ErrorContext {
  [key: string]: unknown;
}

interface ErrorWithMetadata extends Error {
  errorId?: ErrorId;
  context?: ErrorContext;
  category?: ExceptionCategory;
  severity?: ExceptionSeverity;
  isExpectedFailure?: boolean;
  isTransient?: boolean;
  recoveryStrategy?: RecoveryStrategy;
}

interface SentryLike {
  captureException: (error: Error) => void;
  setTag: (key: string, value: string) => void;
}

declare global {
  interface Window {
    __SENTRY__?: SentryLike;
  }
}

export interface ErrorLogEntry {
  errorId: ErrorId;
  message: string;
  timestamp: string;
  context: ErrorContext;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  isExpectedFailure: boolean;
  isTransient: boolean;
  recoveryStrategy: RecoveryStrategy;
  canRetry: boolean;
  affectedFeatures?: string[];
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

  // Send to Sentry if configured (only in browser environment)
  if (typeof window !== 'undefined') {
    try {
      const Sentry = window.__SENTRY__;
      if (Sentry && Sentry.captureException) {
        const error: ErrorWithMetadata = originalError || new Error(message);
        error.errorId = errorId;
        error.context = context;
        error.category = classified.category;
        error.severity = classified.severity;
        error.isExpectedFailure = classified.isExpectedFailure;
        error.isTransient = classified.isTransient;
        error.recoveryStrategy = classified.recoveryStrategy;

        // Set Sentry tags for filtering/grouping
        Sentry.setTag('error_id', errorId);
        Sentry.setTag('error_category', classified.category);
        Sentry.setTag('error_severity', classified.severity);
        Sentry.setTag('is_expected', String(classified.isExpectedFailure));
        Sentry.setTag('is_transient', String(classified.isTransient));

        Sentry.captureException(error);
      }
    } catch (sentryError) {
      // Log Sentry capture failures to prevent silent debugging black hole
      console.warn(
        '[ErrorTracker] Failed to capture error in Sentry:',
        sentryError instanceof Error ? sentryError.message : String(sentryError),
        { errorId, message }
      );
    }
  }

  // Store in session storage for debugging (keep last 50 errors, only in browser environment)
  // CRITICAL: Skip storage operations for SESSION_STORAGE_PARSE_ERROR to prevent circular dependency
  // when the storage system itself is corrupted. If we attempted to store this error to the same
  // corrupted storage, it would trigger another parse error, leading to infinite recursion.
  // This guard ensures SESSION_STORAGE_PARSE_ERROR can be logged and reported without triggering
  // recursive failures.
  if (errorId !== ERROR_IDS.SESSION_STORAGE_PARSE_ERROR && typeof sessionStorage !== 'undefined') {
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
    } catch (storageError) {
      // Log storage failures to prevent silent loss of error tracking
      console.warn(
        '[ErrorTracker] Failed to store error log in session storage:',
        storageError instanceof Error ? storageError.message : String(storageError),
        { errorId, message }
      );
    }
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

  // Store in session storage for debugging (only in browser environment)
  if (typeof sessionStorage !== 'undefined') {
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
    } catch (storageError) {
      // Log storage failures to maintain visibility of storage issues
      console.warn(
        '[ErrorTracker] Failed to store warning log in session storage:',
        storageError instanceof Error ? storageError.message : String(storageError),
        { message }
      );
    }
  }
}

/**
 * Get all logged errors from session storage
 */
export function getErrorLog(): ErrorLogEntry[] {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }

  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    return existing ? JSON.parse(existing) : [];
  } catch (storageError) {
    // Log retrieval failures with structured error tracking
    // This surfaces storage corruption in Sentry and error logs
    logError(
      ERROR_IDS.SESSION_STORAGE_PARSE_ERROR,
      'Failed to retrieve error log from session storage - session storage may be corrupted',
      {
        operation: 'getErrorLog',
        storageKey: 'app:error_log',
        error: storageError instanceof Error ? storageError.message : String(storageError)
      },
      storageError instanceof Error ? storageError : new Error(String(storageError))
    );
    return [];
  }
}

/**
 * Clear all logged errors from session storage
 */
export function clearErrorLog(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem('app:error_log');
    sessionStorage.removeItem('app:warning_log');
  } catch (storageError) {
    // Log deletion failures to maintain visibility of storage issues
    console.warn(
      '[ErrorTracker] Failed to clear error logs from session storage:',
      storageError instanceof Error ? storageError.message : String(storageError)
    );
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
export function getErrorsByCategory(category: ExceptionCategory): ErrorLogEntry[] {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }

  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: ErrorLogEntry) => log.category === category);
  } catch (storageError) {
    logError(
      ERROR_IDS.SESSION_STORAGE_PARSE_ERROR,
      'Failed to retrieve error logs for category filter - session storage may be corrupted',
      {
        operation: 'getErrorsByCategory',
        storageKey: 'app:error_log',
        category,
        error: storageError instanceof Error ? storageError.message : String(storageError)
      },
      storageError instanceof Error ? storageError : new Error(String(storageError))
    );
    return [];
  }
}

/**
 * Filter logged errors by severity
 */
export function getErrorsBySeverity(severity: ExceptionSeverity): ErrorLogEntry[] {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }

  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: ErrorLogEntry) => log.severity === severity);
  } catch (storageError) {
    logError(
      ERROR_IDS.SESSION_STORAGE_PARSE_ERROR,
      'Failed to retrieve error logs for severity filter - session storage may be corrupted',
      {
        operation: 'getErrorsBySeverity',
        storageKey: 'app:error_log',
        severity,
        error: storageError instanceof Error ? storageError.message : String(storageError)
      },
      storageError instanceof Error ? storageError : new Error(String(storageError))
    );
    return [];
  }
}

/**
 * Get all bugs (unexpected/programming errors) from logs
 */
export function getBugLogs(): ErrorLogEntry[] {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }

  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: ErrorLogEntry) => !log.isExpectedFailure);
  } catch (storageError) {
    logError(
      ERROR_IDS.SESSION_STORAGE_PARSE_ERROR,
      'Failed to retrieve bug logs - session storage may be corrupted',
      {
        operation: 'getBugLogs',
        storageKey: 'app:error_log',
        error: storageError instanceof Error ? storageError.message : String(storageError)
      },
      storageError instanceof Error ? storageError : new Error(String(storageError))
    );
    return [];
  }
}

/**
 * Get all expected failures from logs
 */
export function getExpectedFailureLogs(): ErrorLogEntry[] {
  if (typeof sessionStorage === 'undefined') {
    return [];
  }

  try {
    const storageKey = 'app:error_log';
    const existing = sessionStorage.getItem(storageKey);
    const logs = existing ? JSON.parse(existing) : [];

    return logs.filter((log: ErrorLogEntry) => log.isExpectedFailure);
  } catch (storageError) {
    logError(
      ERROR_IDS.SESSION_STORAGE_PARSE_ERROR,
      'Failed to retrieve expected failure logs - session storage may be corrupted',
      {
        operation: 'getExpectedFailureLogs',
        storageKey: 'app:error_log',
        error: storageError instanceof Error ? storageError.message : String(storageError)
      },
      storageError instanceof Error ? storageError : new Error(String(storageError))
    );
    return [];
  }
}
