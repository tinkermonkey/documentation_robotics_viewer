/**
 * Exception Classification System
 *
 * Distinguishes between expected failures and bugs:
 * - Expected Failures: Validation errors, network timeouts, resource not found, etc.
 * - Bugs: Programming errors, assertion failures, invariant violations, etc.
 * - Transient: May recover with retry (network issues)
 * - Permanent: Won't recover without intervention (invalid data)
 */

/**
 * Exception category defines the type of failure
 */
export enum ExceptionCategory {
  // Expected Failures - User/system/environment issues
  VALIDATION_ERROR = 'validation_error',           // Invalid input data
  NOT_FOUND = 'not_found',                         // Resource doesn't exist
  NETWORK_ERROR = 'network_error',                 // Network unavailable or failed
  TIMEOUT = 'timeout',                             // Operation timed out
  UNAUTHORIZED = 'unauthorized',                   // Authentication/authorization failed
  RATE_LIMITED = 'rate_limited',                   // Rate limit exceeded
  RESOURCE_EXHAUSTED = 'resource_exhausted',       // Out of memory, disk space, etc.
  CONFLICT = 'conflict',                           // Data conflict (e.g., duplicate key)
  EXTERNAL_SERVICE_ERROR = 'external_service_error', // Third-party service failure

  // Bugs - Programming errors that shouldn't happen in production
  ASSERTION_FAILED = 'assertion_failed',           // Assertion/invariant violation
  INVALID_STATE = 'invalid_state',                 // Invalid state transition
  NOT_IMPLEMENTED = 'not_implemented',             // Feature not implemented
  TYPE_ERROR = 'type_error',                       // Unexpected type (indicates type safety issue)
  PARSE_ERROR = 'parse_error',                     // Failed to parse data (bad format)
  LOGIC_ERROR = 'logic_error',                     // Algorithm or logic error
  NULL_REFERENCE = 'null_reference',               // Null/undefined access
  INTERNAL_ERROR = 'internal_error',               // Unexpected internal error
}

/**
 * Exception severity indicates business impact
 */
export enum ExceptionSeverity {
  LOW = 'low',                    // Minor issue, feature degraded but functional
  MEDIUM = 'medium',              // Feature partially broken or error path
  HIGH = 'high',                  // Feature broken, user unable to complete task
  CRITICAL = 'critical',          // System broken, data corruption risk, security issue
}

/**
 * Recovery strategy hints for error handling
 */
export enum RecoveryStrategy {
  RETRY = 'retry',                // Safe to retry (transient failure)
  EXPONENTIAL_BACKOFF = 'exponential_backoff', // Retry with exponential backoff
  FALLBACK = 'fallback',          // Use fallback implementation
  USER_ACTION = 'user_action',    // User must take action to recover
  RELOAD = 'reload',              // Page/application reload required
  NONE = 'none',                  // No recovery possible, error terminal
}

/**
 * Classified exception with full context
 */
export interface ClassifiedException {
  // Core error info
  errorId: string;
  message: string;
  originalError?: Error;

  // Classification
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  isExpectedFailure: boolean;    // True if user/environment issue, false if bug
  isTransient: boolean;           // True if may succeed on retry

  // Recovery
  recoveryStrategy: RecoveryStrategy;
  canRetry: boolean;              // Whether safe to retry
  maxRetryAttempts?: number;      // Max retry attempts (for transient errors)
  retryDelayMs?: number;          // Initial retry delay

  // Context
  context?: Record<string, any>;
  userFacingMessage?: string;     // Message safe to show to users
  devMessage?: string;            // Detailed message for developers

  // Metadata
  timestamp: number;
  stackTrace?: string;
  affectedFeatures?: string[];    // Features broken by this error
  relatedErrorIds?: string[];     // Other error IDs that may be related
}

/**
 * Helper type for exception metadata
 */
export interface ExceptionMetadata {
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  isExpectedFailure: boolean;
  isTransient: boolean;
  recoveryStrategy: RecoveryStrategy;
  canRetry: boolean;
  userFacingMessage?: string;
  devMessage?: string;
  maxRetryAttempts?: number;
  affectedFeatures?: string[];
}
