# Exception Classification System

## Overview

A comprehensive exception classification system that distinguishes between **expected failures** (user/environment issues) and **bugs** (programming errors). This enables smarter error handling, better diagnostics, and appropriate recovery strategies.

## Problem Solved

The original error handling system logged errors but didn't differentiate between:
- **Expected failures**: Validation errors, network timeouts, resource not found, unauthorized access
- **Bugs**: Type errors, null references, assertion failures, invalid state transitions

This made it difficult to:
- Prioritize bug fixes vs operational issues
- Implement appropriate recovery strategies
- Route errors to the right team (developers vs operations)
- Set up proper alerting and monitoring

## Solution: Exception Classification

### Core Components

#### 1. **Exception Types** (`src/core/types/exceptions.ts`)

Defines three enums for exception metadata:

**ExceptionCategory** - Type of failure:
- Network errors, timeouts, unauthorized, not found, rate limited
- Validation errors, parse errors, type errors, null references
- Assertion failures, invalid state, logic errors
- Resource exhaustion, conflicts, external service errors

**ExceptionSeverity** - Business impact:
- `LOW`: Minor issue, feature degraded
- `MEDIUM`: Feature partially broken
- `HIGH`: Feature broken, user unable to complete task
- `CRITICAL`: System broken, data corruption risk, security issue

**RecoveryStrategy** - How to handle the error:
- `RETRY`: Safe to retry immediately
- `EXPONENTIAL_BACKOFF`: Retry with exponential backoff (for transient errors)
- `FALLBACK`: Use fallback implementation
- `USER_ACTION`: User must take action (re-login, fix input, etc.)
- `RELOAD`: Page/application reload required
- `NONE`: No recovery possible

#### 2. **Exception Classifier** (`src/core/services/exceptionClassifier.ts`)

Analyzes errors and produces classified exceptions with full context:

```typescript
interface ClassifiedException {
  errorId: string;
  message: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  isExpectedFailure: boolean;  // User/env issue vs bug
  isTransient: boolean;         // May succeed on retry
  recoveryStrategy: RecoveryStrategy;
  canRetry: boolean;
  maxRetryAttempts?: number;
  retryDelayMs?: number;
  userFacingMessage?: string;   // Safe to show users
  devMessage?: string;          // For developers
  affectedFeatures?: string[];  // Features broken by this error
  timestamp: number;
  stackTrace?: string;
  context?: Record<string, any>;
}
```

**Pattern Matching** - Detects exceptions by:
- Error message content (regex patterns)
- Error type (TypeError, SyntaxError, RangeError, etc.)
- HTTP status codes (401, 404, 429, 503, etc.)
- Network indicators (ECONNREFUSED, DNS, offline, timeout)

**Example Classifications**:
```typescript
// Expected Failures
Network timeout → TIMEOUT (transient, can retry with exponential backoff)
404 Not Found → NOT_FOUND (expected, user action required)
Validation error → VALIDATION_ERROR (expected, user action required)

// Bugs
TypeError: "not a function" → TYPE_ERROR (bug, no recovery)
Assertion failed → ASSERTION_FAILED (bug, no recovery)
Invalid state transition → INVALID_STATE (bug, no recovery)
```

#### 3. **Enhanced Error Tracker** (`src/apps/embedded/services/errorTracker.ts`)

Updated `logError()` to automatically classify exceptions:

```typescript
// Before
logError(errorId, message, context);

// After - returns ClassifiedException
const classified = logError(
  ERROR_IDS.WS_CONNECTION_ERROR,
  'Network connection failed',
  { userId: '123', feature: 'sync' },
  originalError // Optional original Error object
);

// Access classification
console.log(classified.category);        // 'network_error'
console.log(classified.isExpectedFailure); // true
console.log(classified.recoveryStrategy);  // 'exponential_backoff'
```

**New Utility Functions**:
- `shouldRetry(classified, attempt)`: Check if safe to retry
- `getRetryDelay(classified, attempt)`: Calculate backoff delay with jitter
- `getErrorsByCategory(category)`: Filter logs by category
- `getErrorsBySeverity(severity)`: Filter logs by severity
- `getBugLogs()`: Get all bugs (unexpected failures)
- `getExpectedFailureLogs()`: Get all expected failures

**Sentry Integration**:
- Automatically tags errors in Sentry for filtering:
  - `error_id`: Unique error identifier
  - `error_category`: Exception category
  - `error_severity`: Severity level
  - `is_expected`: Whether expected failure or bug
  - `is_transient`: Whether error is transient

### Usage Examples

#### Example 1: Network Error with Retry Logic

```typescript
try {
  await fetchData();
} catch (error) {
  const classified = logError(
    ERROR_IDS.WS_CONNECTION_ERROR,
    'Failed to fetch data',
    { userId, feature: 'sync' },
    error
  );

  if (shouldRetry(classified, attemptNumber)) {
    const delay = getRetryDelay(classified, attemptNumber);
    await sleep(delay);
    // Retry...
  } else {
    // Show user-facing error message
    showError(classified.userFacingMessage);
  }
}
```

#### Example 2: Validation Error

```typescript
const email = formData.email;
if (!isValidEmail(email)) {
  logError(
    ERROR_IDS.CHAT_SEND_FAILED,
    'Validation failed: email must be valid',
    { field: 'email', value: email }
  );
  // Returns ClassifiedException with:
  // - category: VALIDATION_ERROR (expected failure)
  // - recoveryStrategy: USER_ACTION
  // - isTransient: false
  // - maxRetryAttempts: undefined
}
```

#### Example 3: Bug Detection

```typescript
if (!user || !user.profile) {
  logError(
    ERROR_IDS.INTERNAL_ERROR,
    'Null reference: user profile missing',
    { userId, context: 'initialization' },
    error
  );
  // Returns ClassifiedException with:
  // - category: NULL_REFERENCE or TYPE_ERROR (bug)
  // - isExpectedFailure: false (this is a bug)
  // - severity: CRITICAL
  // - recoveryStrategy: NONE
  // - isTransient: false
}
```

### Key Features

1. **Automatic Classification**: No need to manually tag errors - classifier analyzes message and type
2. **User-Facing Messages**: Safe messages generated for users without exposing implementation details
3. **Recovery Strategies**: Clear guidance on how to recover from each error type
4. **Transient vs Permanent**: Distinguishes errors that may succeed on retry vs permanent failures
5. **Severity Assessment**: Categorizes impact on users and system
6. **Feature Impact**: Tracks which features are affected by errors
7. **Sentry Integration**: Automatic tagging for production monitoring
8. **Exponential Backoff**: Jitter-based backoff calculation prevents thundering herd

### Error Pattern Detection

The classifier uses regex patterns to detect specific error types:

```
Network Errors:
  - Pattern: /network|fetch|offline|connection|timeout/
  - Examples: "Network connection failed", "Connection timeout", "ECONNREFUSED"

HTTP Errors:
  - 401: /401|unauthorized|forbidden|not authorized/
  - 404: /404|not found|does not exist/
  - 429: /429|rate limit|too many requests/
  - 5xx: /500|502|503|504|internal.*error|service.*unavailable/

Validation Errors:
  - Pattern: /validation|must be|required|bad request/
  - Examples: "Validation failed", "Email must be valid", "Field is required"

Type Errors:
  - Native TypeError instances
  - Pattern: /type|not a function|cannot read|undefined|null/

State Errors:
  - Pattern: /invariant|unreachable|should not happen/
  - Examples: "Invariant violation", "Should not happen"
```

### Test Coverage

Comprehensive test suite with 80+ tests covering:

**Exception Classification** (`tests/unit/exceptionClassification.spec.ts`):
- Network, timeout, HTTP status code detection
- Validation, parse, type error detection
- Bug detection (assertion, null reference, invalid state)
- Recovery strategy determination
- User-facing message generation
- Transient vs permanent error classification
- Retry attempt limiting
- Severity assessment

**Error Tracker Integration** (`tests/unit/errorTrackerClassification.spec.ts`):
- Classification logging with error tracking
- Retry decision making
- Exponential backoff delay calculation
- Error metadata preservation
- Feature impact detection
- Context information tracking

All tests passing (813+ tests in full suite).

## Architecture

```
Exception Classification System
├── Exception Types (src/core/types/exceptions.ts)
│   ├── ExceptionCategory enum
│   ├── ExceptionSeverity enum
│   ├── RecoveryStrategy enum
│   └── ClassifiedException interface
├── Exception Classifier (src/core/services/exceptionClassifier.ts)
│   ├── classifyException()
│   ├── detectCategory()
│   ├── detectSeverity()
│   ├── determineRecoveryStrategy()
│   └── Pattern detection
└── Error Tracker Integration (src/apps/embedded/services/errorTracker.ts)
    ├── logError() with classification
    ├── Retry utilities
    ├── Filter functions
    └── Sentry tagging
```

## Benefits

1. **For Developers**:
   - Quickly identify bugs vs operational issues
   - Prioritize bug fixes (CRITICAL vs LOW)
   - Understand error context and recovery options

2. **For Operations**:
   - Set up appropriate alerting based on severity
   - Distinguish bugs from transient failures
   - Implement automated recovery for transient errors

3. **For Users**:
   - Clear, user-friendly error messages
   - Guidance on what to do (retry, re-login, etc.)
   - No exposure to implementation details

4. **For Monitoring**:
   - Sentry tags for filtering and grouping errors
   - Expected failures distinguished from bugs
   - Severity levels for prioritization

## Integration Points

### Existing Error Handling
The system integrates seamlessly with existing error handling:
- Works with existing error IDs (`ERROR_IDS`)
- Enhances `logError()` with classification return value
- Backward compatible - existing code continues to work

### WebSocket Client
Network errors are automatically classified with retry logic

### Chat Service
Service errors are classified and can trigger recovery actions

### Store Error Handling
Annotation store can use classification to determine rollback strategies

### React Error Boundaries
Error boundaries can use severity to decide on UI handling

## Future Enhancements

1. **Custom Classifiers**: Allow services to provide custom classification logic
2. **ML-Based Detection**: Use ML for pattern matching beyond regex
3. **Error Correlation**: Detect related errors and dependency chains
4. **Automatic Recovery**: Implement auto-recovery for certain error types
5. **Error Analytics**: Dashboard for error trends and patterns
6. **Context Propagation**: Automatically track error context through async chains

## Files Modified/Created

### New Files
- `src/core/types/exceptions.ts` - Exception type definitions
- `src/core/services/exceptionClassifier.ts` - Classification logic
- `tests/unit/exceptionClassification.spec.ts` - Classifier tests (80 tests)
- `tests/unit/errorTrackerClassification.spec.ts` - Integration tests (50 tests)
- `EXCEPTION_CLASSIFICATION.md` - This documentation

### Modified Files
- `src/apps/embedded/services/errorTracker.ts` - Enhanced with classification

## Testing

Run the full test suite:
```bash
npm test
```

Run only exception classification tests:
```bash
npm test -- exceptionClassification
npm test -- errorTrackerClassification
```

All 813+ tests pass successfully.
