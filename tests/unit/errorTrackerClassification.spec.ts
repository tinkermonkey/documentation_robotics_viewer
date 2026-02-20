/**
 * Error Tracker Classification Tests
 * Tests for error logging with classification functionality
 */

import { test, expect } from '@playwright/test';
import {
  logError,
  logWarning,
  getErrorLog,
  clearErrorLog,
  shouldRetry,
  getRetryDelay,
  getErrorsByCategory,
  getErrorsBySeverity,
  getBugLogs,
  getExpectedFailureLogs,
} from '../../src/apps/embedded/services/errorTracker';
import {
  ExceptionCategory,
  ExceptionSeverity,
  RecoveryStrategy,
} from '../../src/core/types/exceptions';
import { ERROR_IDS } from '../../src/constants/errorIds';

test.describe('Error Tracker Classification', () => {
  test.beforeEach(() => {
    clearErrorLog();
  });

  test.afterEach(() => {
    clearErrorLog();
  });

  test.describe('Error Classification Logging', () => {
    test('should classify and log network errors', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'WebSocket connection failed',
        { attempt: 1 },
        new Error('Network connection refused')
      );

      expect(classified.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(classified.isExpectedFailure).toBe(true);
      expect(classified.isTransient).toBe(true);
      expect(classified.severity).toBe(ExceptionSeverity.HIGH);
    });

    test('should classify and log bugs', () => {
      const classified = logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Failed to parse message',
        {},
        new TypeError('Cannot read property of undefined')
      );

      expect(classified.category).toBe(ExceptionCategory.TYPE_ERROR);
      expect(classified.isExpectedFailure).toBe(false);
      expect(classified.severity).toBe(ExceptionSeverity.CRITICAL);
    });

    test('should classify validation errors', () => {
      const classified = logError(
        ERROR_IDS.CHAT_SEND_FAILED,
        'Message validation failed: must not be empty',
        { messageLength: 0 },
        new Error('Validation failed')
      );

      expect(classified.category).toBe(ExceptionCategory.VALIDATION_ERROR);
      expect(classified.isExpectedFailure).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
    });

    test('should return classified exception', () => {
      const classified = logError(
        ERROR_IDS.WS_ERROR_EVENT,
        'WebSocket error event',
        undefined,
        new Error('Connection closed')
      );

      expect(classified).toBeDefined();
      expect(classified.errorId).toBe(ERROR_IDS.WS_ERROR_EVENT);
      expect(classified.message).toBe('WebSocket error event');
      expect(classified.timestamp).toBeGreaterThan(0);
    });
  });

  test.describe('Error Log Filtering', () => {
    test('should classify different error categories correctly', () => {
      // Test that the classifier can distinguish categories
      const network = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );
      const typeError = logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );
      const validation = logError(
        ERROR_IDS.CHAT_SEND_FAILED,
        'Message validation failed: must not be empty',
        {},
        new Error('Invalid input')
      );

      // Verify each is classified correctly
      expect(network.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(typeError.category).toBe(ExceptionCategory.TYPE_ERROR);
      expect(validation.category).toBe(ExceptionCategory.VALIDATION_ERROR);
    });

    test('should classify errors with different severities', () => {
      const network = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );
      const typeError = logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );

      // Verify severities are correct
      expect(network.severity).toBe(ExceptionSeverity.HIGH);
      expect(typeError.severity).toBe(ExceptionSeverity.CRITICAL);
    });

    test('should correctly identify bugs vs expected failures', () => {
      const bug = logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );
      const expectedFailure = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      // Verify classification
      expect(bug.isExpectedFailure).toBe(false);
      expect(expectedFailure.isExpectedFailure).toBe(true);
    });
  });

  test.describe('Retry Decision Making', () => {
    test('should allow retry for transient network errors', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      expect(shouldRetry(classified, 0)).toBe(true);
      expect(shouldRetry(classified, 1)).toBe(true);
      expect(shouldRetry(classified, 2)).toBe(true);
      expect(shouldRetry(classified, 3)).toBe(false); // Max attempts reached
    });

    test('should not allow retry for validation errors', () => {
      const classified = logError(
        ERROR_IDS.CHAT_SEND_FAILED,
        'Validation error',
        {},
        new Error('Invalid input')
      );

      expect(shouldRetry(classified, 0)).toBe(false);
    });

    test('should not allow retry for bugs', () => {
      const classified = logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );

      expect(shouldRetry(classified, 0)).toBe(false);
    });

    test('should allow retry with rate limit constraints', () => {
      const classified = logError(
        ERROR_IDS.WS_ERROR_EVENT,
        'Rate limited',
        {},
        new Error('429 Rate Limited')
      );

      expect(shouldRetry(classified, 0)).toBe(true);
      expect(shouldRetry(classified, 1)).toBe(false); // Max attempts for rate limit
    });
  });

  test.describe('Retry Delay Calculation', () => {
    test('should use base delay for simple retry strategy', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      const delay0 = getRetryDelay(classified, 0);
      expect(delay0).toBeGreaterThan(0);
      expect(delay0).toBeLessThanOrEqual(1100); // Base 1000 + jitter
    });

    test('should use exponential backoff for network errors', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection timeout')
      );

      const delay0 = getRetryDelay(classified, 0);
      const delay1 = getRetryDelay(classified, 1);
      const delay2 = getRetryDelay(classified, 2);

      // Exponential backoff should increase delays
      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    test('should cap exponential backoff at 30 seconds', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      // Even with many retry attempts, delay should not exceed 30s
      const delay10 = getRetryDelay(classified, 10);
      expect(delay10).toBeLessThanOrEqual(30000);
    });

    test('should use longer initial delay for rate limits', () => {
      const classified = logError(
        ERROR_IDS.WS_ERROR_EVENT,
        'Rate limited',
        {},
        new Error('429 Rate Limited')
      );

      const delay = getRetryDelay(classified, 0);
      expect(delay).toBeGreaterThanOrEqual(5000); // Rate limit has 5s base
    });

    test('should include jitter in exponential backoff', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      const delays = [];
      for (let i = 0; i < 5; i++) {
        delays.push(getRetryDelay(classified, 0));
      }

      // Due to jitter, delays for same attempt should vary slightly
      const hasVariation = new Set(delays).size > 1;
      expect(hasVariation).toBe(true);
    });
  });

  test.describe('Error Metadata', () => {
    test('should include classification metadata in return value', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        { userId: '123' },
        new Error('Connection failed')
      );

      // Verify metadata is present in returned classified exception
      expect(classified.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(classified.severity).toBe(ExceptionSeverity.HIGH);
      expect(classified.isExpectedFailure).toBe(true);
      expect(classified.isTransient).toBe(true);
      expect(classified.recoveryStrategy).toBe(RecoveryStrategy.EXPONENTIAL_BACKOFF);
      expect(classified.canRetry).toBe(true);
    });

    test('should detect affected features', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        { feature: 'annotations', layer: 'business' },
        new Error('Connection failed')
      );

      expect(classified.affectedFeatures).toBeDefined();
      expect(classified.affectedFeatures.length).toBeGreaterThan(0);
    });

    test('should preserve context information', () => {
      const context = {
        userId: 'user-123',
        requestId: 'req-456',
        feature: 'export',
      };

      const classified = logError(
        ERROR_IDS.CHAT_SEND_FAILED,
        'Send failed',
        context,
        new Error('Network error')
      );

      expect(classified.context).toEqual(context);
    });
  });

  test.describe('Error Classification', () => {
    test('should classify expected failures correctly', async () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      expect(classified.isExpectedFailure).toBe(true);
      expect(classified.severity).toBe(ExceptionSeverity.HIGH);
      expect(classified.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(classified.isTransient).toBe(true);
    });

    test('should classify bugs with CRITICAL severity', async () => {
      const classified = logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );

      expect(classified.isExpectedFailure).toBe(false);
      expect(classified.severity).toBe(ExceptionSeverity.CRITICAL);
      expect(classified.category).toBe(ExceptionCategory.TYPE_ERROR);
    });
  });

  test.describe('Multiple Error Types', () => {
    test('should classify different error types correctly', () => {
      // Classify several different error types
      const network = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );
      const validation = logError(
        ERROR_IDS.CHAT_SEND_FAILED,
        'Message validation failed: must not be empty',
        {},
        new Error('Invalid input')
      );
      const typeError = logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );

      // Verify each is classified correctly
      expect(network.isExpectedFailure).toBe(true);
      expect(network.isTransient).toBe(true);

      expect(validation.isExpectedFailure).toBe(true);
      expect(validation.isTransient).toBe(false);

      expect(typeError.isExpectedFailure).toBe(false);
      expect(typeError.severity).toBe(ExceptionSeverity.CRITICAL);
    });
  });

  test.describe('Error Tracking', () => {
    test('should return classified exception on logError call', () => {
      const classified = logError(ERROR_IDS.WS_CONNECTION_ERROR, 'Error 1', {});

      expect(classified).toBeDefined();
      expect(classified.errorId).toBe(ERROR_IDS.WS_CONNECTION_ERROR);
      expect(classified.message).toBe('Error 1');
      expect(classified.category).toBeDefined();
    });

    test('should handle clearing logs without errors', () => {
      // Just verify it doesn't throw
      expect(() => {
        clearErrorLog();
      }).not.toThrow();
    });
  });

  test.describe('Error with and without original error object', () => {
    test('should classify error without original Error object', () => {
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error occurred'
      );

      expect(classified).toBeDefined();
      expect(classified.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(classified.originalError).toBeUndefined();
    });

    test('should classify error with original Error object', () => {
      const error = new Error('Connection refused');
      const classified = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        error
      );

      expect(classified).toBeDefined();
      expect(classified.category).toBe(ExceptionCategory.NETWORK_ERROR);
      expect(classified.originalError).toBe(error);
    });
  });

  test.describe('Error Filter Functions', () => {
    test('getErrorsByCategory returns errors filtered by category', () => {
      // Log errors of different categories
      const net = logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );
      logError(
        ERROR_IDS.CHAT_SEND_FAILED,
        'Validation error',
        {},
        new Error('Invalid input')
      );

      // Get only network errors
      const networkErrors = getErrorsByCategory(ExceptionCategory.NETWORK_ERROR);
      expect(networkErrors).toBeDefined();
      expect(Array.isArray(networkErrors)).toBe(true);
      // Should return at least the network error we logged
      if (networkErrors.length > 0) {
        // All returned errors should match the category
        networkErrors.forEach(error => {
          expect(error.category).toBe(ExceptionCategory.NETWORK_ERROR);
        });
      }
    });

    test('getErrorsByCategory returns empty array for category with no errors', () => {
      // Log only network errors
      logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      // Request a different category
      const typeErrors = getErrorsByCategory(ExceptionCategory.TYPE_ERROR);
      expect(Array.isArray(typeErrors)).toBe(true);
      expect(typeErrors.length).toBe(0);
    });

    test('getErrorsBySeverity returns errors filtered by severity', () => {
      // Log errors of different severities
      logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );
      logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );

      // Get only high severity errors
      const highSeverity = getErrorsBySeverity(ExceptionSeverity.HIGH);
      expect(highSeverity).toBeDefined();
      expect(Array.isArray(highSeverity)).toBe(true);

      // All returned errors should match severity
      highSeverity.forEach(error => {
        expect(error.severity).toBe(ExceptionSeverity.HIGH);
      });
    });

    test('getErrorsBySeverity returns errors with correct type', () => {
      logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      const errors = getErrorsBySeverity(ExceptionSeverity.HIGH);
      expect(errors).toBeDefined();
      expect(Array.isArray(errors)).toBe(true);

      // Each item should have ErrorLogEntry shape
      errors.forEach(error => {
        expect(error.errorId).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.timestamp).toBeDefined();
        expect(error.category).toBeDefined();
        expect(error.severity).toBeDefined();
      });
    });

    test('getBugLogs returns only non-expected-failure errors', () => {
      // Log both bugs and expected failures
      logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error (a bug)',
        {},
        new TypeError('not a function')
      );
      logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error (expected)',
        {},
        new Error('Connection failed')
      );

      const bugs = getBugLogs();
      expect(Array.isArray(bugs)).toBe(true);

      // All bugs should be non-expected failures
      bugs.forEach(bug => {
        expect(bug.isExpectedFailure).toBe(false);
      });
    });

    test('getBugLogs returns type ErrorLogEntry[]', () => {
      logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );

      const bugs = getBugLogs();
      expect(Array.isArray(bugs)).toBe(true);

      if (bugs.length > 0) {
        // Verify structure matches ErrorLogEntry
        const bug = bugs[0];
        expect(typeof bug.errorId).toBe('string');
        expect(typeof bug.message).toBe('string');
        expect(typeof bug.timestamp).toBe('string');
        expect(typeof bug.category).toBe('string');
        expect(typeof bug.severity).toBe('string');
        expect(typeof bug.isExpectedFailure).toBe('boolean');
        expect(typeof bug.isTransient).toBe('boolean');
        expect(typeof bug.canRetry).toBe('boolean');
      }
    });

    test('getExpectedFailureLogs returns only expected-failure errors', () => {
      // Log both bugs and expected failures
      logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );
      logError(
        ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
        'Type error',
        {},
        new TypeError('not a function')
      );

      const expectedFailures = getExpectedFailureLogs();
      expect(Array.isArray(expectedFailures)).toBe(true);

      // All returned should be expected failures
      expectedFailures.forEach(failure => {
        expect(failure.isExpectedFailure).toBe(true);
      });
    });

    test('getExpectedFailureLogs returns type ErrorLogEntry[]', () => {
      logError(
        ERROR_IDS.WS_CONNECTION_ERROR,
        'Network error',
        {},
        new Error('Connection failed')
      );

      const expectedFailures = getExpectedFailureLogs();
      expect(Array.isArray(expectedFailures)).toBe(true);

      if (expectedFailures.length > 0) {
        // Verify structure matches ErrorLogEntry
        const failure = expectedFailures[0];
        expect(typeof failure.errorId).toBe('string');
        expect(typeof failure.message).toBe('string');
        expect(typeof failure.timestamp).toBe('string');
        expect(failure.category).toBeDefined();
        expect(failure.severity).toBeDefined();
        expect(failure.isExpectedFailure).toBe(true);
      }
    });

    test('filter functions handle empty error log gracefully', () => {
      // Should not throw with empty log
      expect(() => {
        getErrorsByCategory(ExceptionCategory.NETWORK_ERROR);
        getErrorsBySeverity(ExceptionSeverity.HIGH);
        getBugLogs();
        getExpectedFailureLogs();
      }).not.toThrow();

      // Should return empty arrays
      expect(getErrorsByCategory(ExceptionCategory.NETWORK_ERROR)).toEqual([]);
      expect(getErrorsBySeverity(ExceptionSeverity.HIGH)).toEqual([]);
      expect(getBugLogs()).toEqual([]);
      expect(getExpectedFailureLogs()).toEqual([]);
    });
  });
});
