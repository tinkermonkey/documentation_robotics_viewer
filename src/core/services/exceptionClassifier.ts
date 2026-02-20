/**
 * Exception Classifier Service
 * Analyzes errors and classifies them as expected failures or bugs
 * with severity levels and recovery strategies
 */

import type { ErrorId } from '@/constants/errorIds';
import {
  ClassifiedException,
  ExceptionCategory,
  ExceptionSeverity,
  RecoveryStrategy,
} from '@/core/types/exceptions';

/**
 * Detectable error patterns that indicate specific exception types
 */
const ERROR_PATTERNS = {
  // Network errors
  network: /network|fetch|offline|connection|timeout|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/i,
  timeout: /timeout|timed out|deadline|took too long/i,
  networkDetail: {
    unreachable: /unreachable|refused|reset|ECONNREFUSED|ECONNRESET|ENETUNREACH/i,
    dns: /dns|name.*not.*resolved|ERR_NAME_NOT_RESOLVED/i,
    timeout: /timeout|timed out|deadline/i,
  },

  // HTTP errors
  unauthorized: /401|unauthorized|forbidden|not authorized|credentials/i,
  notFound: /404|not found|does not exist|resource.*not.*found/i,
  rateLimited: /429|rate limit|too many requests|quota|throttle/i,
  conflict: /409|conflict|duplicate|already.*exists|constraint/i,
  serverError: /500|502|503|504|internal.*error|service.*unavailable|gateway/i,

  // Validation errors (careful: narrow patterns to avoid false matches)
  validation: /validation|must be|required|bad request|email.*valid|password.*valid|field.*invalid/i,
  parseError: /parse|syntax|unexpected token|json|xml|invalid.*format/i,
  typeError: /type|not a function|is not a|undefined|null|cannot read|cannot set/i,

  // Resource exhaustion
  resourceExhausted: /out of memory|quota|storage|disk|heap|too large|maximum/i,

  // Assertion errors (check before invalid state)
  assertionFailed: /assertion.*failed|assert.*failed/i,

  // State errors
  invalidState: /invalid state|invariant|unreachable|should not happen/i,

  // External service
  externalService: /third.?party|external|webhook|provider|service.*failed/i,
};

/**
 * Classify an exception based on error message, type, and context
 */
export function classifyException(
  errorId: ErrorId,
  message: string,
  originalError?: Error,
  context?: Record<string, unknown>
): ClassifiedException {
  const timestamp = Date.now();
  const stackTrace = originalError?.stack;

  // Analyze error characteristics
  const errorText = `${message} ${originalError?.message || ''}`.toLowerCase();

  // Detect error type
  const category = detectCategory(errorText, originalError);
  const severity = detectSeverity(category, context);
  const isExpectedFailure = isExpected(category);
  const isTransient = isTransientError(category, errorText);
  const recoveryStrategy = determineRecoveryStrategy(category, isTransient);
  const canRetry = isTransient && isRetryable(category);

  // Generate user-facing message
  const userFacingMessage = generateUserMessage(category, message);

  // Get affected features based on error context
  const affectedFeatures = detectAffectedFeatures(context, category);

  return {
    errorId,
    message,
    originalError,
    category,
    severity,
    isExpectedFailure,
    isTransient,
    recoveryStrategy,
    canRetry,
    maxRetryAttempts: getMaxRetryAttempts(category),
    retryDelayMs: getRetryDelay(category),
    context,
    userFacingMessage,
    devMessage: generateDevMessage(category, message, originalError),
    timestamp,
    stackTrace,
    affectedFeatures,
  };
}

/**
 * Detect the exception category from error message and type
 */
function detectCategory(
  errorText: string,
  originalError?: Error
): ExceptionCategory {
  // Check native error types first (most reliable)
  if (originalError instanceof TypeError) {
    return ExceptionCategory.TYPE_ERROR;
  }
  if (originalError instanceof SyntaxError) {
    return ExceptionCategory.PARSE_ERROR;
  }
  if (originalError instanceof RangeError) {
    return ExceptionCategory.RESOURCE_EXHAUSTED;
  }

  // Network errors (check early as they're common)
  if (ERROR_PATTERNS.network.test(errorText)) {
    if (ERROR_PATTERNS.networkDetail.timeout.test(errorText)) {
      return ExceptionCategory.TIMEOUT;
    }
    if (ERROR_PATTERNS.networkDetail.dns.test(errorText)) {
      return ExceptionCategory.NETWORK_ERROR;
    }
    return ExceptionCategory.NETWORK_ERROR;
  }

  // Timeout (separate from network)
  if (ERROR_PATTERNS.timeout.test(errorText)) {
    return ExceptionCategory.TIMEOUT;
  }

  // HTTP status code errors
  if (ERROR_PATTERNS.unauthorized.test(errorText)) {
    return ExceptionCategory.UNAUTHORIZED;
  }
  if (ERROR_PATTERNS.notFound.test(errorText)) {
    return ExceptionCategory.NOT_FOUND;
  }
  if (ERROR_PATTERNS.rateLimited.test(errorText)) {
    return ExceptionCategory.RATE_LIMITED;
  }
  if (ERROR_PATTERNS.conflict.test(errorText)) {
    return ExceptionCategory.CONFLICT;
  }
  if (ERROR_PATTERNS.serverError.test(errorText)) {
    return ExceptionCategory.EXTERNAL_SERVICE_ERROR;
  }

  // Assertion failures (check before state errors)
  if (ERROR_PATTERNS.assertionFailed.test(errorText)) {
    return ExceptionCategory.ASSERTION_FAILED;
  }

  // Validation errors (but exclude state/assertion errors)
  if (ERROR_PATTERNS.validation.test(errorText) &&
      !ERROR_PATTERNS.invalidState.test(errorText) &&
      !ERROR_PATTERNS.assertionFailed.test(errorText)) {
    return ExceptionCategory.VALIDATION_ERROR;
  }

  // State errors (likely bugs) - check after validation to avoid conflicts
  if (ERROR_PATTERNS.invalidState.test(errorText)) {
    return ExceptionCategory.INVALID_STATE;
  }

  // Parse errors (pattern check after native type check)
  if (ERROR_PATTERNS.parseError.test(errorText)) {
    return ExceptionCategory.PARSE_ERROR;
  }

  // Type errors (likely bugs)
  if (ERROR_PATTERNS.typeError.test(errorText)) {
    return ExceptionCategory.TYPE_ERROR;
  }

  // Resource exhaustion
  if (ERROR_PATTERNS.resourceExhausted.test(errorText)) {
    return ExceptionCategory.RESOURCE_EXHAUSTED;
  }

  // External service errors
  if (ERROR_PATTERNS.externalService.test(errorText)) {
    return ExceptionCategory.EXTERNAL_SERVICE_ERROR;
  }

  // Default to internal error for unknown/unexpected errors
  return ExceptionCategory.INTERNAL_ERROR;
}

/**
 * Determine severity based on category and context
 */
function detectSeverity(
  category: ExceptionCategory,
  context?: Record<string, unknown>
): ExceptionSeverity {
  // Check context for severity override first
  if (context?.isCritical) {
    return ExceptionSeverity.CRITICAL;
  }

  // Critical severities
  if (
    category === ExceptionCategory.ASSERTION_FAILED ||
    category === ExceptionCategory.INVALID_STATE ||
    category === ExceptionCategory.NULL_REFERENCE ||
    category === ExceptionCategory.TYPE_ERROR
  ) {
    return ExceptionSeverity.CRITICAL;
  }

  // High severity - blocks user action
  if (
    category === ExceptionCategory.UNAUTHORIZED ||
    category === ExceptionCategory.NETWORK_ERROR ||
    category === ExceptionCategory.TIMEOUT ||
    category === ExceptionCategory.EXTERNAL_SERVICE_ERROR
  ) {
    return ExceptionSeverity.HIGH;
  }

  // Medium severity - feature degraded
  if (
    category === ExceptionCategory.VALIDATION_ERROR ||
    category === ExceptionCategory.NOT_FOUND ||
    category === ExceptionCategory.PARSE_ERROR ||
    category === ExceptionCategory.CONFLICT
  ) {
    return ExceptionSeverity.MEDIUM;
  }

  // Low severity - warnings
  if (
    category === ExceptionCategory.RATE_LIMITED ||
    category === ExceptionCategory.RESOURCE_EXHAUSTED
  ) {
    return ExceptionSeverity.LOW;
  }

  return ExceptionSeverity.MEDIUM;
}

/**
 * Determine if an exception is an expected failure vs a bug
 */
function isExpected(category: ExceptionCategory): boolean {
  // These are expected failures (user/environment issues)
  const expectedCategories = [
    ExceptionCategory.VALIDATION_ERROR,
    ExceptionCategory.NOT_FOUND,
    ExceptionCategory.NETWORK_ERROR,
    ExceptionCategory.TIMEOUT,
    ExceptionCategory.UNAUTHORIZED,
    ExceptionCategory.RATE_LIMITED,
    ExceptionCategory.RESOURCE_EXHAUSTED,
    ExceptionCategory.CONFLICT,
    ExceptionCategory.EXTERNAL_SERVICE_ERROR,
    ExceptionCategory.PARSE_ERROR, // Bad data format from external source
  ];

  return expectedCategories.includes(category);
}

/**
 * Determine if an error is transient (may recover with retry)
 */
function isTransientError(category: ExceptionCategory, errorText: string): boolean {
  // These errors may be transient
  const transientCategories = [
    ExceptionCategory.NETWORK_ERROR,
    ExceptionCategory.TIMEOUT,
    ExceptionCategory.RATE_LIMITED,
    ExceptionCategory.EXTERNAL_SERVICE_ERROR, // Service may recover
  ];

  // Check if error indicates resource exhaustion (possibly transient)
  if (category === ExceptionCategory.RESOURCE_EXHAUSTED) {
    // Only transient if it looks like a temporary spike
    return !errorText.includes('permanent') && !errorText.includes('quota');
  }

  return transientCategories.includes(category);
}

/**
 * Determine recovery strategy based on exception type
 */
function determineRecoveryStrategy(
  category: ExceptionCategory,
  isTransient: boolean
): RecoveryStrategy {
  // Bugs -> no recovery possible
  if (
    category === ExceptionCategory.ASSERTION_FAILED ||
    category === ExceptionCategory.INVALID_STATE ||
    category === ExceptionCategory.NOT_IMPLEMENTED ||
    category === ExceptionCategory.TYPE_ERROR ||
    category === ExceptionCategory.NULL_REFERENCE ||
    category === ExceptionCategory.LOGIC_ERROR
  ) {
    return RecoveryStrategy.NONE;
  }

  // Network and transient errors -> retry with backoff
  if (category === ExceptionCategory.NETWORK_ERROR && isTransient) {
    return RecoveryStrategy.EXPONENTIAL_BACKOFF;
  }
  if (category === ExceptionCategory.TIMEOUT && isTransient) {
    return RecoveryStrategy.EXPONENTIAL_BACKOFF;
  }
  if (category === ExceptionCategory.EXTERNAL_SERVICE_ERROR && isTransient) {
    return RecoveryStrategy.EXPONENTIAL_BACKOFF;
  }

  // Rate limiting -> exponential backoff with longer delay
  if (category === ExceptionCategory.RATE_LIMITED) {
    return RecoveryStrategy.EXPONENTIAL_BACKOFF;
  }

  // User action required
  if (category === ExceptionCategory.UNAUTHORIZED) {
    return RecoveryStrategy.USER_ACTION; // Re-login
  }
  if (category === ExceptionCategory.VALIDATION_ERROR) {
    return RecoveryStrategy.USER_ACTION; // Fix input
  }
  if (category === ExceptionCategory.NOT_FOUND) {
    return RecoveryStrategy.USER_ACTION; // Check resource ID
  }

  // Fall back for graceful degradation
  if (category === ExceptionCategory.CONFLICT) {
    return RecoveryStrategy.FALLBACK;
  }

  // Parse errors don't recover
  if (category === ExceptionCategory.PARSE_ERROR) {
    return RecoveryStrategy.NONE;
  }

  // Default: no recovery
  return RecoveryStrategy.NONE;
}

/**
 * Determine if an error should be retried
 */
function isRetryable(category: ExceptionCategory): boolean {
  const retryableCategories = [
    ExceptionCategory.NETWORK_ERROR,
    ExceptionCategory.TIMEOUT,
    ExceptionCategory.RATE_LIMITED,
    ExceptionCategory.EXTERNAL_SERVICE_ERROR,
    ExceptionCategory.RESOURCE_EXHAUSTED,
  ];

  return retryableCategories.includes(category);
}

/**
 * Get maximum retry attempts for a category
 */
function getMaxRetryAttempts(category: ExceptionCategory): number | undefined {
  switch (category) {
    case ExceptionCategory.NETWORK_ERROR:
    case ExceptionCategory.TIMEOUT:
      return 3;
    case ExceptionCategory.EXTERNAL_SERVICE_ERROR:
      return 2;
    case ExceptionCategory.RATE_LIMITED:
      return 1; // Usually need to wait longer
    case ExceptionCategory.RESOURCE_EXHAUSTED:
      return 2;
    default:
      return undefined;
  }
}

/**
 * Get initial retry delay for a category (in milliseconds)
 */
function getRetryDelay(category: ExceptionCategory): number | undefined {
  switch (category) {
    case ExceptionCategory.NETWORK_ERROR:
      return 500;
    case ExceptionCategory.TIMEOUT:
      return 1000;
    case ExceptionCategory.EXTERNAL_SERVICE_ERROR:
      return 1000;
    case ExceptionCategory.RATE_LIMITED:
      return 5000; // Longer initial delay for rate limits
    case ExceptionCategory.RESOURCE_EXHAUSTED:
      return 2000;
    default:
      return undefined;
  }
}

/**
 * Generate user-facing error message
 */
function generateUserMessage(category: ExceptionCategory, message: string): string {
  switch (category) {
    case ExceptionCategory.NETWORK_ERROR:
      return 'Network connection failed. Please check your internet connection.';
    case ExceptionCategory.TIMEOUT:
      return 'The operation took too long. Please try again.';
    case ExceptionCategory.UNAUTHORIZED:
      return 'Your session has expired. Please log in again.';
    case ExceptionCategory.NOT_FOUND:
      return 'The requested resource was not found.';
    case ExceptionCategory.RATE_LIMITED:
      return 'Too many requests. Please wait before trying again.';
    case ExceptionCategory.RESOURCE_EXHAUSTED:
      return 'System resources are temporarily exhausted. Please try again.';
    case ExceptionCategory.VALIDATION_ERROR:
      return `Invalid input: ${message}`;
    case ExceptionCategory.CONFLICT:
      return 'This resource has been modified by someone else. Please refresh and try again.';
    case ExceptionCategory.EXTERNAL_SERVICE_ERROR:
      return 'External service is temporarily unavailable. Please try again.';
    case ExceptionCategory.PARSE_ERROR:
      return 'Unable to process the response. Please try again or contact support.';
    case ExceptionCategory.ASSERTION_FAILED:
    case ExceptionCategory.INVALID_STATE:
    case ExceptionCategory.TYPE_ERROR:
    case ExceptionCategory.NULL_REFERENCE:
    case ExceptionCategory.INTERNAL_ERROR:
      return 'An unexpected error occurred. Please refresh the page or contact support.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Generate developer-facing error message
 */
function generateDevMessage(
  category: ExceptionCategory,
  message: string,
  originalError?: Error
): string {
  const categoryLabel = Object.entries(ExceptionCategory)
    .find(([, v]) => v === category)?.[0] || 'UNKNOWN';

  const parts = [
    `[${categoryLabel}] ${message}`,
    originalError?.message ? `Original: ${originalError.message}` : '',
  ];

  return parts.filter(Boolean).join(' | ');
}

/**
 * Detect affected features based on context and error category
 */
function detectAffectedFeatures(
  context?: Record<string, unknown>,
  category?: ExceptionCategory
): string[] {
  const features: string[] = [];

  if (context?.feature && typeof context.feature === 'string') {
    features.push(context.feature);
  }
  if (context?.layer && typeof context.layer === 'string') {
    features.push(`${context.layer}_layer`);
  }

  // Add category-based feature impact
  if (category === ExceptionCategory.NETWORK_ERROR) {
    features.push('data_sync', 'websocket', 'api_calls');
  } else if (category === ExceptionCategory.EXTERNAL_SERVICE_ERROR) {
    features.push('export', 'integrations');
  }

  return [...new Set(features)]; // Remove duplicates
}
