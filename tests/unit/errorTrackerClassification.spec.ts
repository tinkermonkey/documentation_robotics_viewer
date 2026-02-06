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

  test.describe('Console Output', () => {
    test('should log expected failures differently than bugs', async () => {
      const consoleErrors: string[] = [];
      const originalError = console.error;
      console.error = (...args: any[]) => {
        consoleErrors.push(args[0]);
      };

      try {
        logError(
          ERROR_IDS.WS_CONNECTION_ERROR,
          'Network error',
          {},
          new Error('Connection failed')
        );

        const output = consoleErrors[consoleErrors.length - 1];
        expect(output).toContain('EXPECTED');
        expect(output).toContain('[WS_001:EXPECTED:HIGH]');
      } finally {
        console.error = originalError;
      }
    });

    test('should log bugs with CRITICAL indicator', async () => {
      const consoleErrors: string[] = [];
      const originalError = console.error;
      console.error = (...args: any[]) => {
        consoleErrors.push(args[0]);
      };

      try {
        logError(
          ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
          'Type error',
          {},
          new TypeError('not a function')
        );

        const output = consoleErrors[consoleErrors.length - 1];
        expect(output).not.toContain('EXPECTED');
        expect(output).toContain('BUG');
        expect(output).toContain('CRITICAL');
      } finally {
        console.error = originalError;
      }
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
});
