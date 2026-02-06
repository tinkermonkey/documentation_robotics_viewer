/**
 * Error Tracking Tests
 * Tests for error tracking IDs and Sentry integration
 */

import { test, expect } from '@playwright/test';
import { logError, logWarning } from '../../src/apps/embedded/services/errorTracker';
import { ERROR_IDS } from '../../src/constants/errorIds';

test.describe('Error Tracking', () => {
  test.describe('Error ID Constants', () => {
    test('should have all required JSON-RPC error IDs', () => {
      expect(ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED).toBeDefined();
      expect(ERROR_IDS.JSONRPC_ATTACH_LISTENER_FAILED).toBeDefined();
      expect(ERROR_IDS.JSONRPC_ATTACH_LISTENER_BACKGROUND_FAILED).toBeDefined();
      expect(ERROR_IDS.JSONRPC_SEND_REQUEST_FAILED).toBeDefined();
      expect(ERROR_IDS.JSONRPC_SEND_NOTIFICATION_FAILED).toBeDefined();
      expect(ERROR_IDS.JSONRPC_NOTIFICATION_HANDLER_ERROR).toBeDefined();
      expect(ERROR_IDS.JSONRPC_HANDLE_NOTIFICATION_ERROR).toBeDefined();
    });

    test('should have all required Chat Service error IDs', () => {
      expect(ERROR_IDS.CHAT_GET_STATUS_FAILED).toBeDefined();
      expect(ERROR_IDS.CHAT_SEND_FAILED).toBeDefined();
      expect(ERROR_IDS.CHAT_CANCEL_FAILED).toBeDefined();
    });

    test('should have all required WebSocket error IDs', () => {
      expect(ERROR_IDS.WS_CONNECTION_ERROR).toBeDefined();
      expect(ERROR_IDS.WS_MESSAGE_PARSE_FAILED).toBeDefined();
      expect(ERROR_IDS.WS_ERROR_EVENT).toBeDefined();
      expect(ERROR_IDS.WS_EVENT_HANDLER_ERROR).toBeDefined();
      expect(ERROR_IDS.WS_MAX_RECONNECT_ATTEMPTS).toBeDefined();
    });

    test('should have unique error IDs', () => {
      const ids = Object.values(ERROR_IDS);
      const uniqueIds = new Set(ids);
      expect(ids).toHaveLength(uniqueIds.size);
    });

    test('should have consistent ID format', () => {
      Object.values(ERROR_IDS).forEach((id) => {
        // Format should be CATEGORY_SEQUENCE (e.g., JSONRPC_001)
        expect(id).toMatch(/^[A-Z_]+_\d{3}$/);
      });
    });
  });

  test.describe('Error Logging Functions', () => {
    test('should accept logError calls without throwing', () => {
      const testContext = { testKey: 'testValue' };

      // Should not throw
      expect(() => {
        logError(ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED, 'Test error message', testContext);
      }).not.toThrow();

      // Should accept error without context
      expect(() => {
        logError(ERROR_IDS.CHAT_GET_STATUS_FAILED, 'Error without context');
      }).not.toThrow();
    });

    test('should accept logWarning calls without throwing', () => {
      const testContext = { warningKey: 'warningValue' };

      // Should not throw
      expect(() => {
        logWarning('Test warning message', testContext);
      }).not.toThrow();

      // Should accept warning without context
      expect(() => {
        logWarning('Warning without context');
      }).not.toThrow();
    });
  });
});
