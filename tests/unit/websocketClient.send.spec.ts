/**
 * Unit tests for WebSocketClient.send() method return value behavior
 * Tests that send() returns true when message sent successfully and false when not connected
 */

import { test, expect } from '@playwright/test';
import { WebSocketClient } from '../../src/apps/embedded/services/websocketClient';

test.describe('WebSocketClient.send() Return Value', () => {
  test('should return false when WebSocket is not connected', () => {
    const client = new WebSocketClient('ws://localhost:9001');
    // Client is not connected yet
    const result = client.send({
      type: 'test',
      data: {}
    });

    expect(result).toBe(false);
  });

  test('should return boolean type from send()', () => {
    const client = new WebSocketClient('ws://localhost:9001');
    const result = client.send({
      type: 'test',
      data: {}
    });

    expect(typeof result).toBe('boolean');
  });

  test('should accept message object with type property', () => {
    const client = new WebSocketClient('ws://localhost:9001');
    const message = {
      type: 'subscribe',
      topics: ['model', 'changesets']
    };

    // Should not throw even if not connected
    const result = client.send(message);
    expect(typeof result).toBe('boolean');
  });

  test('should accept JSON-RPC request format', () => {
    const client = new WebSocketClient('ws://localhost:9001');
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'test.method',
      params: { foo: 'bar' },
      id: 1
    };

    // Should not throw
    const result = client.send(jsonRpcRequest as any);
    expect(typeof result).toBe('boolean');
  });

  test('should accept JSON-RPC notification format', () => {
    const client = new WebSocketClient('ws://localhost:9001');
    const jsonRpcNotification = {
      jsonrpc: '2.0',
      method: 'test.notification',
      params: { foo: 'bar' }
    };

    // Should not throw
    const result = client.send(jsonRpcNotification as any);
    expect(typeof result).toBe('boolean');
  });

  test('should return consistent results for same message', () => {
    const client = new WebSocketClient('ws://localhost:9001');
    const message = {
      type: 'test',
      data: {}
    };

    const result1 = client.send(message);
    const result2 = client.send(message);

    // Both calls should return false since client is not connected
    expect(result1).toBe(result2);
    expect(result1).toBe(false);
  });

  test('should handle send() calls with various message structures', () => {
    const client = new WebSocketClient('ws://localhost:9001');

    const messages = [
      { type: 'ping' },
      { type: 'subscribe', topics: ['test'] },
      { type: 'custom', data: { nested: { obj: true } } },
      { jsonrpc: '2.0', method: 'test', id: 1 }
    ];

    messages.forEach((message) => {
      const result = client.send(message as any);
      expect(typeof result).toBe('boolean');
      // Not connected, so should be false
      expect(result).toBe(false);
    });
  });
});
