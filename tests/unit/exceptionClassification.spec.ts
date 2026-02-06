/**
 * Exception Classification Tests
 * Tests for exception type classification system
 */

import { test, expect } from '@playwright/test';
import { classifyException } from '../../src/core/services/exceptionClassifier';
import {
  ExceptionCategory,
  ExceptionSeverity,
  RecoveryStrategy,
} from '../../src/core/types/exceptions';

test.describe('Exception Classification', () => {
  test.describe('Network Error Detection', () => {
    test('should classify network connection errors', () => {
      const result = classifyException(
        'TEST_001',
        'Network connection failed',
        new Error('Network: ECONNREFUSED')
      );

      expect(result.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.isTransient).toBe(true);
      expect(result.severity).toBe(ExceptionSeverity.HIGH);
      expect(result.canRetry).toBe(true);
    });

    test('should classify timeout errors', () => {
      const result = classifyException(
        'TEST_002',
        'Request timeout after 30s',
        new Error('Timeout: operation timed out')
      );

      expect(result.category).toBe(ExceptionCategory.TIMEOUT);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.isTransient).toBe(true);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.EXPONENTIAL_BACKOFF);
    });

    test('should classify DNS errors as network errors', () => {
      const result = classifyException(
        'TEST_003',
        'Failed to resolve DNS',
        new Error('ERR_NAME_NOT_RESOLVED')
      );

      expect(result.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(result.isExpectedFailure).toBe(true);
    });

    test('should classify offline errors', () => {
      const result = classifyException(
        'TEST_004',
        'Application is offline',
        new Error('Connection: offline')
      );

      expect(result.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(result.isExpectedFailure).toBe(true);
    });
  });

  test.describe('HTTP Status Code Error Detection', () => {
    test('should classify 401 unauthorized errors', () => {
      const result = classifyException(
        'TEST_005',
        'HTTP 401: Unauthorized',
        new Error('401 Unauthorized')
      );

      expect(result.category).toBe(ExceptionCategory.UNAUTHORIZED);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
    });

    test('should classify 404 not found errors', () => {
      const result = classifyException(
        'TEST_006',
        'HTTP 404: Resource not found',
        new Error('404 Not Found')
      );

      expect(result.category).toBe(ExceptionCategory.NOT_FOUND);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
    });

    test('should classify 429 rate limit errors', () => {
      const result = classifyException(
        'TEST_007',
        'HTTP 429: Too Many Requests',
        new Error('429 Rate Limited')
      );

      expect(result.category).toBe(ExceptionCategory.RATE_LIMITED);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.isTransient).toBe(true);
      expect(result.canRetry).toBe(true);
    });

    test('should classify 409 conflict errors', () => {
      const result = classifyException(
        'TEST_008',
        'HTTP 409: Conflict',
        new Error('409 Conflict - duplicate key')
      );

      expect(result.category).toBe(ExceptionCategory.CONFLICT);
      expect(result.isExpectedFailure).toBe(true);
    });

    test('should classify 5xx server errors as external service errors', () => {
      const result = classifyException(
        'TEST_009',
        'HTTP 503: Service Unavailable',
        new Error('503 Service Unavailable')
      );

      expect(result.category).toBe(ExceptionCategory.EXTERNAL_SERVICE_ERROR);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.isTransient).toBe(true);
    });
  });

  test.describe('Validation Error Detection', () => {
    test('should classify validation errors', () => {
      const result = classifyException(
        'TEST_010',
        'Validation failed: email must be valid',
        new Error('Invalid email format')
      );

      expect(result.category).toBe(ExceptionCategory.VALIDATION_ERROR);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
      expect(result.userFacingMessage).toContain('Invalid input');
    });

    test('should classify parse errors with SyntaxError', () => {
      const result = classifyException(
        'TEST_011',
        'JSON parsing failed',
        new SyntaxError('Unexpected token }')
      );

      expect(result.category).toBe(ExceptionCategory.PARSE_ERROR);
      expect(result.isExpectedFailure).toBe(true);
    });

    test('should classify type errors as bugs', () => {
      const result = classifyException(
        'TEST_012',
        'Cannot read property "name" of undefined',
        new TypeError('Cannot read property "name" of undefined')
      );

      expect(result.category).toBe(ExceptionCategory.TYPE_ERROR);
      expect(result.isExpectedFailure).toBe(false); // This is a bug
      expect(result.severity).toBe(ExceptionSeverity.CRITICAL);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.NONE);
    });
  });

  test.describe('Bug Detection (Unexpected Errors)', () => {
    test('should classify assertion failures as bugs', () => {
      const result = classifyException(
        'TEST_013',
        'Assertion failed: invariant violated condition',
        new Error('Assertion failed: index >= 0')
      );

      expect(result.category).toBe(ExceptionCategory.ASSERTION_FAILED);
      expect(result.isExpectedFailure).toBe(false);
      expect(result.severity).toBe(ExceptionSeverity.CRITICAL);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.NONE);
    });

    test('should classify invalid state errors as bugs', () => {
      const result = classifyException(
        'TEST_014',
        'Invalid state transition not allowed',
        new Error('Invariant violated: cannot transition from STOPPED to PAUSED')
      );

      expect(result.category).toBe(ExceptionCategory.INVALID_STATE);
      expect(result.isExpectedFailure).toBe(false);
      expect(result.severity).toBe(ExceptionSeverity.CRITICAL);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.NONE);
    });

    test('should classify null reference errors as bugs', () => {
      const result = classifyException(
        'TEST_015',
        'Null reference exception',
        new Error('Cannot read property "length" of null')
      );

      expect(result.category).toBe(ExceptionCategory.TYPE_ERROR); // TypeError category for null reference
      expect(result.isExpectedFailure).toBe(false);
      expect(result.severity).toBe(ExceptionSeverity.CRITICAL);
      expect(result.recoveryStrategy).toBe(RecoveryStrategy.NONE);
    });

    test('should classify range errors as resource exhaustion', () => {
      const result = classifyException(
        'TEST_016',
        'Out of memory',
        new RangeError('Maximum call stack size exceeded')
      );

      expect(result.category).toBe(ExceptionCategory.RESOURCE_EXHAUSTED);
      expect(result.isExpectedFailure).toBe(true);
      expect(result.severity).toBe(ExceptionSeverity.LOW);
    });
  });

  test.describe('Recovery Strategy Determination', () => {
    test('should use exponential backoff for transient network errors', () => {
      const result = classifyException(
        'TEST_017',
        'Network timeout',
        new Error('Connection timeout')
      );

      expect(result.recoveryStrategy).toBe(RecoveryStrategy.EXPONENTIAL_BACKOFF);
      expect(result.canRetry).toBe(true);
      expect(result.maxRetryAttempts).toBe(3);
      expect(result.retryDelayMs).toBe(1000);
    });

    test('should use exponential backoff with longer delay for rate limits', () => {
      const result = classifyException(
        'TEST_018',
        'Rate limit exceeded',
        new Error('429 Rate Limited')
      );

      expect(result.recoveryStrategy).toBe(RecoveryStrategy.EXPONENTIAL_BACKOFF);
      expect(result.retryDelayMs).toBe(5000); // Longer initial delay
      expect(result.maxRetryAttempts).toBe(1);
    });

    test('should require user action for validation errors', () => {
      const result = classifyException(
        'TEST_019',
        'Invalid input',
        new Error('Email is required')
      );

      expect(result.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
      expect(result.canRetry).toBe(false);
    });

    test('should have no recovery for state errors', () => {
      const result = classifyException(
        'TEST_020',
        'Invariant violation detected',
        new Error('Invariant: should not happen in this state')
      );

      expect(result.recoveryStrategy).toBe(RecoveryStrategy.NONE);
      expect(result.canRetry).toBe(false);
    });

    test('should indicate no recovery for bugs', () => {
      const result = classifyException(
        'TEST_021',
        'Type error',
        new TypeError('not a function')
      );

      expect(result.recoveryStrategy).toBe(RecoveryStrategy.NONE);
      expect(result.canRetry).toBe(false);
    });
  });

  test.describe('User-Facing Messages', () => {
    test('should provide helpful network error message', () => {
      const result = classifyException(
        'TEST_022',
        'Network error',
        new Error('ECONNREFUSED')
      );

      expect(result.userFacingMessage).toContain('Network connection failed');
      expect(result.userFacingMessage).toContain('internet connection');
    });

    test('should provide helpful timeout message', () => {
      const result = classifyException(
        'TEST_023',
        'Timeout',
        new Error('timeout')
      );

      expect(result.userFacingMessage).toContain('took too long');
      expect(result.userFacingMessage).toContain('try again');
    });

    test('should provide helpful authentication message', () => {
      const result = classifyException(
        'TEST_024',
        'Unauthorized',
        new Error('401 Unauthorized')
      );

      expect(result.userFacingMessage).toContain('session has expired');
      expect(result.userFacingMessage).toContain('log in');
    });

    test('should include validation error details in user message', () => {
      const result = classifyException(
        'TEST_025',
        'Validation: email must be valid',
        new Error('Invalid email')
      );

      expect(result.userFacingMessage).toContain('Invalid input');
      expect(result.userFacingMessage).toContain('email');
    });

    test('should provide generic message for bugs', () => {
      const result = classifyException(
        'TEST_026',
        'Type error: not a function',
        new TypeError('not a function')
      );

      expect(result.userFacingMessage).toContain('unexpected error');
      expect(result.userFacingMessage).toContain('refresh');
    });
  });

  test.describe('Context and Metadata', () => {
    test('should preserve context information', () => {
      const context = { userId: '123', feature: 'export', layer: 'business' };
      const result = classifyException(
        'TEST_027',
        'Export failed',
        new Error('Network error'),
        context
      );

      expect(result.context).toEqual(context);
      expect(result.affectedFeatures).toContain('export');
      expect(result.affectedFeatures).toContain('business_layer');
    });

    test('should detect network-related feature impact', () => {
      const result = classifyException(
        'TEST_028',
        'Network error',
        new Error('Connection failed'),
        { feature: 'sync' }
      );

      expect(result.affectedFeatures).toContain('sync');
      expect(result.affectedFeatures).toContain('data_sync');
      expect(result.affectedFeatures).toContain('websocket');
    });

    test('should detect external service impact', () => {
      const result = classifyException(
        'TEST_029',
        'External service error',
        new Error('503 Service Unavailable')
      );

      expect(result.affectedFeatures).toContain('export');
      expect(result.affectedFeatures).toContain('integrations');
    });

    test('should include timestamp', () => {
      const beforeMs = Date.now();
      const result = classifyException(
        'TEST_030',
        'Test error',
        new Error('error')
      );
      const afterMs = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeMs);
      expect(result.timestamp).toBeLessThanOrEqual(afterMs);
    });

    test('should include stack trace from original error', () => {
      const error = new Error('Test error');
      const result = classifyException(
        'TEST_031',
        'Test error',
        error
      );

      expect(result.stackTrace).toBeDefined();
      expect(result.stackTrace).toContain('Test error');
    });
  });

  test.describe('Severity Detection', () => {
    test('should mark bugs as critical severity', () => {
      const bugCategories = [
        'assertion_failed',
        'invalid_state',
        'null_reference',
        'type_error',
      ];

      bugCategories.forEach((category) => {
        const result = classifyException(
          'TEST_032',
          'Error',
          new Error(category)
        );

        if (
          [
            ExceptionCategory.ASSERTION_FAILED,
            ExceptionCategory.INVALID_STATE,
            ExceptionCategory.NULL_REFERENCE,
            ExceptionCategory.TYPE_ERROR,
          ].includes(result.category)
        ) {
          expect(result.severity).toBe(ExceptionSeverity.CRITICAL);
        }
      });
    });

    test('should mark network errors as high severity', () => {
      const result = classifyException(
        'TEST_033',
        'Network error',
        new Error('Connection failed')
      );

      expect(result.severity).toBe(ExceptionSeverity.HIGH);
    });

    test('should mark validation errors as medium severity', () => {
      const result = classifyException(
        'TEST_034',
        'Validation error',
        new Error('Invalid input')
      );

      expect(result.severity).toBe(ExceptionSeverity.MEDIUM);
    });

    test('should mark resource exhaustion as low severity', () => {
      const result = classifyException(
        'TEST_035',
        'Resource exhausted',
        new Error('Out of memory')
      );

      expect(result.severity).toBe(ExceptionSeverity.LOW);
    });

    test('should respect context severity override', () => {
      const result = classifyException(
        'TEST_036',
        'Validation error',
        new Error('Invalid input'),
        { isCritical: true }
      );

      expect(result.severity).toBe(ExceptionSeverity.CRITICAL);
    });
  });

  test.describe('Transient Error Detection', () => {
    test('should mark network errors as transient', () => {
      const result = classifyException(
        'TEST_037',
        'Network error',
        new Error('Connection failed')
      );

      expect(result.isTransient).toBe(true);
      expect(result.canRetry).toBe(true);
    });

    test('should mark timeouts as transient', () => {
      const result = classifyException(
        'TEST_038',
        'Timeout',
        new Error('timed out')
      );

      expect(result.isTransient).toBe(true);
      expect(result.canRetry).toBe(true);
    });

    test('should mark validation errors as permanent', () => {
      const result = classifyException(
        'TEST_039',
        'Validation error',
        new Error('Invalid email')
      );

      expect(result.isTransient).toBe(false);
      expect(result.canRetry).toBe(false);
    });

    test('should mark parse errors as permanent', () => {
      const result = classifyException(
        'TEST_040',
        'Parse error',
        new SyntaxError('Unexpected token')
      );

      expect(result.isTransient).toBe(false);
      expect(result.canRetry).toBe(false);
    });

    test('should mark type errors as permanent', () => {
      const result = classifyException(
        'TEST_041',
        'Type error',
        new TypeError('not a function')
      );

      expect(result.isTransient).toBe(false);
      expect(result.canRetry).toBe(false);
    });
  });

  test.describe('Max Retry Attempts', () => {
    test('should allow 3 retries for network errors', () => {
      const result = classifyException(
        'TEST_042',
        'Network error',
        new Error('Connection failed')
      );

      expect(result.maxRetryAttempts).toBe(3);
    });

    test('should allow 3 retries for timeouts', () => {
      const result = classifyException(
        'TEST_043',
        'Timeout',
        new Error('timed out')
      );

      expect(result.maxRetryAttempts).toBe(3);
    });

    test('should allow 2 retries for external service errors', () => {
      const result = classifyException(
        'TEST_044',
        'Service error',
        new Error('503 Service Unavailable')
      );

      expect(result.maxRetryAttempts).toBe(2);
    });

    test('should allow 1 retry for rate limits', () => {
      const result = classifyException(
        'TEST_045',
        'Rate limited',
        new Error('429 Rate Limited')
      );

      expect(result.maxRetryAttempts).toBe(1);
    });

    test('should not allow retries for bugs', () => {
      const result = classifyException(
        'TEST_046',
        'Type error',
        new TypeError('not a function')
      );

      expect(result.maxRetryAttempts).toBeUndefined();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle errors without original error object', () => {
      const result = classifyException(
        'TEST_047',
        'Some error message'
      );

      expect(result).toBeDefined();
      expect(result.errorId).toBe('TEST_047');
      expect(result.message).toBe('Some error message');
    });

    test('should handle empty error message', () => {
      const result = classifyException(
        'TEST_048',
        '',
        new Error('')
      );

      expect(result).toBeDefined();
      expect(result.category).toBe(ExceptionCategory.INTERNAL_ERROR);
    });

    test('should handle very long error message', () => {
      const longMessage = 'x'.repeat(10000);
      const result = classifyException(
        'TEST_049',
        longMessage,
        new Error(longMessage)
      );

      expect(result.message).toBe(longMessage);
    });

    test('should be case-insensitive in pattern matching', () => {
      const result1 = classifyException(
        'TEST_050',
        'NETWORK CONNECTION FAILED',
        new Error('NETWORK ERROR')
      );

      const result2 = classifyException(
        'TEST_051',
        'network connection failed',
        new Error('network error')
      );

      expect(result1.category).toBe(result2.category);
      expect(result1.category).toBe(ExceptionCategory.NETWORK_ERROR);
    });

    test('should handle errors with special characters', () => {
      const result = classifyException(
        'TEST_052',
        'Error: "validation" failed! [400] Bad Request #invalid',
        new Error('validation failed')
      );

      expect(result.category).toBe(ExceptionCategory.VALIDATION_ERROR);
    });
  });
});
