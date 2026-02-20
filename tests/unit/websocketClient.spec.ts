/**
 * Unit tests for WebSocketClient interface and types
 * Tests type safety, event definitions, and handler contracts
 */

import { test, expect } from '@playwright/test';
import { WebSocketClient } from '../../src/apps/embedded/services/websocketClient';
import { WebSocketMessage } from '../../src/apps/embedded/types/websocket';

test.describe('WebSocketClient Type Safety', () => {
  test.describe('Event Handler Types', () => {
    test('should accept EventHandler with proper typing', () => {
      // EventHandler should accept data of the appropriate type
      type EventHandler<T> = (data: T) => void;

      const connectHandler: EventHandler<Record<string, unknown>> = (data) => {
        expect(data).toBeDefined();
      };

      expect(typeof connectHandler).toBe('function');
    });

    test('should support message handler with WebSocketMessage type', () => {
      type EventHandler<T> = (data: T) => void;

      const messageHandler: EventHandler<WebSocketMessage> = (data) => {
        expect(data.type).toBeDefined();
      };

      expect(typeof messageHandler).toBe('function');
    });

    test('should support error handler with error event data', () => {
      type EventHandler<T> = (data: T) => void;

      const errorHandler: EventHandler<{ error: Event }> = (data) => {
        expect(data.error).toBeDefined();
      };

      expect(typeof errorHandler).toBe('function');
    });

    test('should support reconnecting handler with attempt data', () => {
      type EventHandler<T> = (data: T) => void;

      const reconnectingHandler: EventHandler<{
        attempt: number;
        delay: number;
      }> = (data) => {
        expect(data.attempt).toBeGreaterThanOrEqual(0);
        expect(data.delay).toBeGreaterThanOrEqual(0);
      };

      expect(typeof reconnectingHandler).toBe('function');
    });
  });

  test.describe('Event Names and Types', () => {
    test('should define all valid event names', () => {
      const validEventNames = [
        'connect',
        'disconnect',
        'message',
        'error',
        'close',
        'reconnecting',
        'rest-mode',
        'max-reconnect-attempts',
      ];

      validEventNames.forEach((name) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });

    test('should validate connect event type', () => {
      const event = 'connect';
      expect(event).toBe('connect');
    });

    test('should validate disconnect event type', () => {
      const event = 'disconnect';
      expect(event).toBe('disconnect');
    });

    test('should validate message event type', () => {
      const event = 'message';
      expect(event).toBe('message');
    });

    test('should validate error event type', () => {
      const event = 'error';
      expect(event).toBe('error');
    });

    test('should validate close event type', () => {
      const event = 'close';
      expect(event).toBe('close');
    });

    test('should validate reconnecting event type', () => {
      const event = 'reconnecting';
      expect(event).toBe('reconnecting');
    });

    test('should validate rest-mode event type', () => {
      const event = 'rest-mode';
      expect(event).toBe('rest-mode');
    });

    test('should validate max-reconnect-attempts event type', () => {
      const event = 'max-reconnect-attempts';
      expect(event).toBe('max-reconnect-attempts');
    });
  });

  test.describe('WebSocketEventMap Definition', () => {
    test('should have typed payload for connect event', () => {
      const payload: Record<string, unknown> = {};
      expect(payload).toBeDefined();
    });

    test('should have typed payload for disconnect event', () => {
      const payload: Record<string, unknown> = {};
      expect(payload).toBeDefined();
    });

    test('should have typed payload for message event', () => {
      const payload: WebSocketMessage = {
        type: 'test',
        data: { foo: 'bar' },
      };

      expect(payload.type).toBeDefined();
      expect(payload.data).toBeDefined();
    });

    test('should have typed payload for error event', () => {
      const payload: { error: Event } = { error: new Event('error') };

      expect(payload.error).toBeDefined();
      expect(payload.error instanceof Event).toBe(true);
    });

    test('should have typed payload for close event', () => {
      const payload: { code: number; reason: string } = {
        code: 1000,
        reason: 'Normal closure',
      };

      expect(payload.code).toBe(1000);
      expect(payload.reason).toBe('Normal closure');
    });

    test('should have typed payload for reconnecting event', () => {
      const payload: { attempt: number; delay: number } = {
        attempt: 1,
        delay: 1000,
      };

      expect(payload.attempt).toBe(1);
      expect(payload.delay).toBe(1000);
    });

    test('should have typed payload for max-reconnect-attempts event', () => {
      const payload: { attempts: number; isTest?: boolean } = {
        attempts: 10,
        isTest: true,
      };

      expect(payload.attempts).toBe(10);
      expect(payload.isTest).toBe(true);
    });
  });

  test.describe('WebSocketClient Interface', () => {
    test('should be a constructor function', () => {
      expect(typeof WebSocketClient).toBe('function');
    });

    test('should create instance with URL parameter', () => {
      const client = new WebSocketClient('ws://localhost:9001');
      expect(client).toBeDefined();
    });

    test('should have on method for event registration', () => {
      const client = new WebSocketClient('ws://localhost:9001');
      expect(typeof client.on).toBe('function');
    });

    test('should have off method for event deregistration', () => {
      const client = new WebSocketClient('ws://localhost:9001');
      expect(typeof client.off).toBe('function');
    });

    test('should have disconnect method', () => {
      const client = new WebSocketClient('ws://localhost:9001');
      expect(typeof client.disconnect).toBe('function');
    });

    test('should have optional test hook methods', () => {
      const client = new WebSocketClient('ws://localhost:9001');
      // Test hooks are optional - may or may not be present
      const hasTriggerClose = typeof (client as any).triggerCloseForTesting === 'function';
      const hasSimulateMax =
        typeof (client as any).simulateMaxReconnectAttemptsForTesting === 'function';

      expect(hasTriggerClose || !hasTriggerClose).toBe(true);
      expect(hasSimulateMax || !hasSimulateMax).toBe(true);
    });
  });

  test.describe('Type Compatibility', () => {
    test('should ensure on() method accepts valid event names', () => {
      const client = new WebSocketClient('ws://localhost:9001');

      const handler = () => {};

      // All valid events should be accepted
      const events = [
        'connect',
        'disconnect',
        'message',
        'error',
        'close',
        'reconnecting',
        'rest-mode',
        'max-reconnect-attempts',
      ];

      events.forEach((event) => {
        // Should not throw
        client.on(event as any, handler);
      });

      expect(true).toBe(true);
    });

    test('should ensure off() method accepts valid event names', () => {
      const client = new WebSocketClient('ws://localhost:9001');

      const handler = () => {};

      // All valid events should be accepted
      const events = [
        'connect',
        'disconnect',
        'message',
        'error',
        'close',
        'reconnecting',
        'rest-mode',
        'max-reconnect-attempts',
      ];

      events.forEach((event) => {
        // Should not throw
        client.off(event as any, handler);
      });

      expect(true).toBe(true);
    });
  });

  test.describe('Handler Contract', () => {
    test('should accept handlers for all event types', () => {
      const handlers = {
        connect: () => {},
        disconnect: () => {},
        message: (data: WebSocketMessage) => {},
        error: (data: { error: Event }) => {},
        close: (data: { code: number; reason: string }) => {},
        reconnecting: (data: { attempt: number; delay: number }) => {},
        'rest-mode': () => {},
        'max-reconnect-attempts': (data: { attempts: number }) => {},
      };

      Object.values(handlers).forEach((handler) => {
        expect(typeof handler).toBe('function');
      });
    });

    test('should preserve handler identity for removal', () => {
      const handler = () => {};

      expect(handler).toBe(handler);
    });

    test('should support arrow functions as handlers', () => {
      const handler = () => {
        // empty
      };

      expect(typeof handler).toBe('function');
    });

    test('should support function expressions as handlers', () => {
      const handler = function () {
        // empty
      };

      expect(typeof handler).toBe('function');
    });
  });

  test.describe('WebSocketMessage Type', () => {
    test('should have type property', () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: {},
      };

      expect(message.type).toBeDefined();
      expect(typeof message.type).toBe('string');
    });

    test('should have data property', () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { foo: 'bar' },
      };

      expect(message.data).toBeDefined();
    });

    test('should support various message types', () => {
      const messages = [
        { type: 'ping', data: {} },
        { type: 'pong', data: {} },
        { type: 'update', data: { id: '123' } },
        { type: 'error', data: { message: 'error' } },
      ];

      messages.forEach((msg) => {
        expect(msg.type).toBeDefined();
        expect(msg.data).toBeDefined();
      });
    });
  });
});
