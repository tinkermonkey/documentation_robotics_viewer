/**
 * Unit tests for WebSocketClient.send() method return value behavior
 * Tests that send() returns true when message sent successfully and false when not connected
 */

import { test, expect } from '@playwright/test';
import { WebSocketClient } from '../../src/apps/embedded/services/websocketClient';
import type { JsonRpcRequest, JsonRpcNotification } from '../../src/apps/embedded/types/chat';

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
    const jsonRpcRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'test.method',
      params: { foo: 'bar' },
      id: 1
    };

    // Should not throw
    const result = client.send(jsonRpcRequest);
    expect(typeof result).toBe('boolean');
  });

  test('should accept JSON-RPC notification format', () => {
    const client = new WebSocketClient('ws://localhost:9001');
    const jsonRpcNotification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method: 'test.notification',
      params: { foo: 'bar' }
    };

    // Should not throw
    const result = client.send(jsonRpcNotification);
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

    const messages: Array<{ type?: string; [key: string]: unknown }> = [
      { type: 'ping' },
      { type: 'subscribe', topics: ['test'] },
      { type: 'custom', data: { nested: { obj: true } } }
    ];

    messages.forEach((message) => {
      const result = client.send(message);
      expect(typeof result).toBe('boolean');
      // Not connected, so should be false
      expect(result).toBe(false);
    });

    // Also test JSON-RPC format
    const jsonRpcRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'test',
      id: 1
    };
    const result = client.send(jsonRpcRequest);
    expect(typeof result).toBe('boolean');
    expect(result).toBe(false);
  });

  test('should return true when WebSocket is connected and open', () => {
    const client = new WebSocketClient('ws://localhost:9001');

    // Create a mock WebSocket with OPEN state
    const mockSendCalls: string[] = [];
    const mockWebSocket = {
      readyState: 1, // WebSocket.OPEN
      send: (data: string) => {
        mockSendCalls.push(data);
      },
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    (client as any).ws = mockWebSocket;

    const message = {
      type: 'test',
      data: { foo: 'bar' }
    };

    const result = client.send(message);

    expect(result).toBe(true);
    expect(mockSendCalls.length).toBe(1);
    expect(mockSendCalls[0]).toBe(JSON.stringify(message));
  });

  test('should successfully send JSON-RPC request when connected', () => {
    const client = new WebSocketClient('ws://localhost:9001');

    // Create a mock WebSocket with OPEN state
    const mockSendCalls: string[] = [];
    const mockWebSocket = {
      readyState: 1, // WebSocket.OPEN
      send: (data: string) => {
        mockSendCalls.push(data);
      },
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    (client as any).ws = mockWebSocket;

    const jsonRpcRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'test.method',
      params: { key: 'value' },
      id: 42
    };

    const result = client.send(jsonRpcRequest);

    expect(result).toBe(true);
    expect(mockSendCalls.length).toBe(1);
    expect(mockSendCalls[0]).toBe(JSON.stringify(jsonRpcRequest));
  });

  test('should handle ws.send() throwing an exception', () => {
    const client = new WebSocketClient('ws://localhost:9001');

    // Create a mock WebSocket that throws on send
    const mockWebSocket = {
      readyState: 1, // WebSocket.OPEN
      send: () => {
        throw new Error('Failed to send message');
      },
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    (client as any).ws = mockWebSocket;

    const message = {
      type: 'test',
      data: { foo: 'bar' }
    };

    // Should not throw, but return false
    const result = client.send(message);

    expect(result).toBe(false);
  });

  test('should return false when send() throws exception', () => {
    const client = new WebSocketClient('ws://localhost:9001');

    // Create a mock WebSocket with OPEN state but failing send
    const mockWebSocket = {
      readyState: 1, // WebSocket.OPEN
      send: () => {
        throw new Error('Network error');
      },
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    (client as any).ws = mockWebSocket;

    const jsonRpcRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'test.method',
      params: { key: 'value' },
      id: 123
    };

    const result = client.send(jsonRpcRequest);

    // Should gracefully return false instead of throwing
    expect(result).toBe(false);
  });

  test('should catch exception when JSON.stringify throws', () => {
    const client = new WebSocketClient('ws://localhost:9001');

    // Create a mock WebSocket with OPEN state
    const mockWebSocket = {
      readyState: 1, // WebSocket.OPEN
      send: () => {
        // Would not be called if JSON.stringify throws first
      },
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    (client as any).ws = mockWebSocket;

    // Create a message with a circular reference (will cause JSON.stringify to throw)
    const message: any = {
      type: 'test',
      data: {}
    };
    message.data.self = message; // Create circular reference

    const result = client.send(message);

    // Should gracefully return false instead of throwing
    expect(result).toBe(false);
  });

  test('should handle multiple consecutive send failures', () => {
    const client = new WebSocketClient('ws://localhost:9001');

    const mockWebSocket = {
      readyState: 1, // WebSocket.OPEN
      send: () => {
        throw new Error('Send failed');
      },
      close: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    (client as any).ws = mockWebSocket;

    const message = { type: 'test', data: {} };

    // All attempts should gracefully fail
    const result1 = client.send(message);
    const result2 = client.send(message);
    const result3 = client.send(message);

    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(result3).toBe(false);
  });
});
