# Exception Classification - Quick Start Guide

## TL;DR

Errors are now automatically classified into:
- **Expected Failures**: User/environment issues (network, validation, not found)
- **Bugs**: Programming errors (type errors, null references, invalid state)

Each error gets severity, recovery strategy, and retry guidance.

## How to Use

### Basic Usage

```typescript
import { logError } from '@/apps/embedded/services/errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';

// Log error with automatic classification
const classified = logError(
  ERROR_IDS.WS_CONNECTION_ERROR,
  'Failed to connect to WebSocket',
  { userId: '123', feature: 'sync' },
  originalError // optional
);

// Check if error is a bug vs expected failure
if (!classified.isExpectedFailure) {
  // This is a bug - alert developers
  console.error('BUG:', classified.category, classified.message);
} else {
  // Expected failure - show user-friendly message
  showUserMessage(classified.userFacingMessage);
}
```

### Retry Logic

```typescript
import { shouldRetry, getRetryDelay } from '@/apps/embedded/services/errorTracker';

let attempt = 0;
while (attempt < 5) {
  try {
    await operation();
    break;
  } catch (error) {
    const classified = logError(ERROR_IDS.WS_CONNECTION_ERROR, '...', {}, error);

    if (!shouldRetry(classified, attempt)) {
      throw error;
    }

    const delay = getRetryDelay(classified, attempt);
    await sleep(delay);
    attempt++;
  }
}
```

### Error Categories

**Network Issues** (Expected, Transient):
- Network timeouts
- Connection refused
- DNS failures
- Offline

**HTTP Errors** (Expected):
- 401 Unauthorized
- 404 Not Found
- 429 Rate Limited
- 503 Service Unavailable

**Input Issues** (Expected, User Action):
- Validation errors
- Malformed data
- Missing fields

**Programming Errors** (Bugs):
- Type errors (not a function, undefined, null)
- Assertion failures
- Invalid state transitions
- Null references

## Properties of ClassifiedException

```typescript
interface ClassifiedException {
  // Identification
  errorId: string;              // Unique error ID
  message: string;              // Error message

  // Classification
  category: ExceptionCategory;  // Error type
  severity: ExceptionSeverity;  // Impact level
  isExpectedFailure: boolean;   // User/env issue vs bug
  isTransient: boolean;         // May succeed on retry

  // Recovery
  recoveryStrategy: RecoveryStrategy; // How to recover
  canRetry: boolean;            // Safe to retry
  maxRetryAttempts?: number;    // Max retries
  retryDelayMs?: number;        // Initial retry delay (ms)

  // Messages
  userFacingMessage?: string;   // Show to users
  devMessage?: string;          // For developers

  // Context
  affectedFeatures?: string[];  // Broken features
  context?: Record<string, any>; // Additional context
  timestamp: number;            // When occurred
  stackTrace?: string;          // Stack trace if available
}
```

## Decision Tree

```
Error Occurs
    ↓
Is it a BUG? (type error, null reference, invalid state)
    ├─ YES → severity: CRITICAL, isExpectedFailure: false
    │        recoveryStrategy: NONE
    │        Action: Log and alert developers
    │
    └─ NO → Is it TRANSIENT? (network, timeout, external service)
             ├─ YES → isTransient: true, canRetry: true
             │        recoveryStrategy: EXPONENTIAL_BACKOFF
             │        Action: Retry with exponential backoff
             │
             └─ NO → Is it PERMANENT? (validation, not found, unauthorized)
                     └─ YES → isTransient: false, canRetry: false
                              recoveryStrategy: USER_ACTION
                              Action: Show user message, require action
```

## Common Patterns

### Network Error with Fallback

```typescript
try {
  await fetchFromPrimary();
} catch (error) {
  const classified = logError(ERROR_IDS.WS_CONNECTION_ERROR, '...', {}, error);

  if (classified.isTransient) {
    // Try fallback or cached data
    return getCachedData();
  }
  throw error;
}
```

### Validation Error

```typescript
if (!validateInput(data)) {
  logError(
    ERROR_IDS.CHAT_SEND_FAILED,
    `Validation failed: ${getValidationError(data)}`,
    { field: 'message', value: data }
  );
  // Classification: VALIDATION_ERROR, expected, user action required
  showError('Please check your input and try again');
  return;
}
```

### Bug Detection and Alerting

```typescript
if (!user?.profile) {
  const classified = logError(
    ERROR_IDS.INTERNAL_ERROR,
    'User profile missing',
    { userId, context: 'initialization' }
  );

  if (!classified.isExpectedFailure && classified.severity === 'critical') {
    // Alert developers
    notifyDevs('Critical bug detected', classified);
  }
}
```

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| LOW | Minor issue, feature still works | Log |
| MEDIUM | Feature partially broken | Log + Show user |
| HIGH | Feature blocked, unable to complete task | Log + Alert + User action |
| CRITICAL | System broken, data risk, security issue | Log + Alert developers + Immediate action |

## Recovery Strategies

| Strategy | When Used | Action |
|----------|-----------|--------|
| RETRY | Transient errors | Try again immediately |
| EXPONENTIAL_BACKOFF | Network/service errors | Retry with increasing delays |
| FALLBACK | Non-critical failures | Use backup implementation |
| USER_ACTION | Validation, auth errors | Ask user to fix and retry |
| RELOAD | State corruption | Reload page/app |
| NONE | Bugs | No recovery possible |

## Sentry Tags

Errors are automatically tagged in Sentry for filtering:

```
error_id: WS_001
error_category: network_error
error_severity: high
is_expected: true
is_transient: true
```

Filter in Sentry:
```
is_expected:false      # Show only bugs
is_expected:true       # Show only expected failures
is_transient:true      # Show only transient errors
error_severity:critical # Show only critical issues
```

## Real-World Examples

### WebSocket Error
```typescript
try {
  ws.connect();
} catch (error) {
  const classified = logError(ERROR_IDS.WS_CONNECTION_ERROR, '...', {}, error);
  // Returns: network_error, expected, transient, use exponential backoff
  // Action: Retry with delays
}
```

### API Validation Error
```typescript
const result = await createAnnotation({ text: '' });
if (!result.ok) {
  logError(ERROR_IDS.CHAT_SEND_FAILED, 'Text is required', {});
  // Returns: validation_error, expected, permanent, user action
  // Action: Show "Text is required" to user
}
```

### Type Error in Processing
```typescript
try {
  processData(data.items);  // Might be undefined
} catch (error) {
  const classified = logError(ERROR_IDS.INTERNAL_ERROR, '...', {}, error);
  // Returns: type_error, BUG, critical, no recovery
  // Action: Alert developers, show reload message to user
}
```

## Checklist for Error Handling

- [ ] Use `logError()` with ERROR_IDS constant
- [ ] Check `isExpectedFailure` to determine handling
- [ ] For transient errors, use `shouldRetry()` and `getRetryDelay()`
- [ ] Show `userFacingMessage` to users (never show dev message)
- [ ] For bugs, log with severity and context
- [ ] Track `affectedFeatures` to understand impact
- [ ] Include relevant context for debugging

## Testing

When writing tests for error handling:

```typescript
test('should retry on transient error', () => {
  const error = new Error('Connection timeout');
  const classified = classifyException(
    'TEST_001',
    'Network error',
    error
  );

  expect(classified.isTransient).toBe(true);
  expect(classified.canRetry).toBe(true);
  expect(classified.recoveryStrategy).toBe(RecoveryStrategy.EXPONENTIAL_BACKOFF);
});

test('should not retry on validation error', () => {
  const classified = classifyException(
    'TEST_002',
    'Validation failed',
    new Error('Invalid email')
  );

  expect(classified.isExpectedFailure).toBe(true);
  expect(classified.canRetry).toBe(false);
  expect(classified.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
});
```

## Files

- Main: `src/core/services/exceptionClassifier.ts`
- Integration: `src/apps/embedded/services/errorTracker.ts`
- Types: `src/core/types/exceptions.ts`
- Tests: `tests/unit/exceptionClassification.spec.ts`
- Docs: `EXCEPTION_CLASSIFICATION.md` (detailed)
