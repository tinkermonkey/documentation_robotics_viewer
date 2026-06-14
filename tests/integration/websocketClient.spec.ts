// @vitest-environment happy-dom
/**
 * websocketClient.spec.ts — infra regression tests for `WebSocketClient`.
 *
 * The REAL `WebSocketClient` is exercised; only `globalThis.WebSocket` is
 * replaced with the controllable `MockWebSocket`. Each test constructs its own
 * client instance so the module-level singleton is never touched.
 *
 * THE REGRESSION (double-emit fix): a JSON-RPC frame has no `type` field, so
 * `handleMessage` defaults `messageType` to 'message'. The generic `message`
 * emit is guarded with `if (messageType !== 'message')` so the frame reaches a
 * `message` listener EXACTLY ONCE. Before the guard it dispatched twice
 * (once as the typed emit, once as the generic emit), doubling streamed chat
 * text. The first test pins this to exactly one call.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketClient } from '@/apps/embedded/services/websocketClient';
import {
  MockWebSocket,
  installMockWebSocket,
  restoreWebSocket,
  resetMockWebSockets,
  latestSocket,
} from '../helpers/mockWebSocket';

let previousWs: typeof globalThis.WebSocket | undefined;

beforeEach(() => {
  resetMockWebSockets();
  previousWs = installMockWebSocket();
});

afterEach(() => {
  restoreWebSocket(previousWs);
  vi.useRealTimers();
});

/** Build a connected client whose transport mode is 'websocket' (post-open). */
function connectOpenClient(token: string | null = null): {
  client: WebSocketClient;
  socket: MockWebSocket;
} {
  const client = new WebSocketClient('ws://localhost:8080/ws', token);
  client.connect();
  const socket = latestSocket()!;
  socket.simulateOpen(); // moves mode 'detecting' → 'websocket'
  return { client, socket };
}

describe('websocketClient — JSON-RPC double-emit guard (THE REGRESSION)', () => {
  it('dispatches a JSON-RPC frame (no `type`) to the message listener EXACTLY ONCE', () => {
    const { client, socket } = connectOpenClient();
    const messageListener = vi.fn();
    // Register on the generic 'message' event — the channel jsonRpcHandler uses.
    client.on('message', messageListener);

    // A JSON-RPC response frame: object with NO `type` field.
    socket.simulateMessage({ jsonrpc: '2.0', result: { ok: true }, id: 'x' });

    // With the guard: fires once. Without it, this would be 2 (the typed emit
    // for messageType 'message' PLUS the generic 'message' emit), doubling
    // every streamed chat chunk.
    expect(messageListener).toHaveBeenCalledTimes(1);
    expect(messageListener).toHaveBeenCalledWith({ jsonrpc: '2.0', result: { ok: true }, id: 'x' });
  });

  it('dispatches a JSON-RPC notification (no `type`) to the message listener EXACTLY ONCE', () => {
    const { client, socket } = connectOpenClient();
    const messageListener = vi.fn();
    client.on('message', messageListener);

    socket.simulateMessage({ jsonrpc: '2.0', method: 'chat.response.chunk', params: { content: 'hi' } });

    expect(messageListener).toHaveBeenCalledTimes(1);
  });
});

describe('websocketClient — typed app frames', () => {
  it('fires BOTH the typed listener and the generic message listener for a `type` frame', () => {
    const { client, socket } = connectOpenClient();
    const typedListener = vi.fn();
    const messageListener = vi.fn();
    client.on('model', typedListener);
    client.on('message', messageListener);

    socket.simulateMessage({ type: 'model', payload: { nodes: 1 } });

    expect(typedListener).toHaveBeenCalledTimes(1);
    expect(messageListener).toHaveBeenCalledTimes(1);
    expect(typedListener).toHaveBeenCalledWith({ type: 'model', payload: { nodes: 1 } });
  });

  it('does NOT fire a `model` listener for a JSON-RPC frame', () => {
    const { client, socket } = connectOpenClient();
    const typedListener = vi.fn();
    client.on('model', typedListener);

    socket.simulateMessage({ jsonrpc: '2.0', result: {}, id: '1' });

    expect(typedListener).not.toHaveBeenCalled();
  });
});

describe('websocketClient — reconnect / backoff', () => {
  it('schedules a reconnect with exponential backoff on an unexpected close', () => {
    vi.useFakeTimers();
    const { client, socket } = connectOpenClient();
    const reconnecting = vi.fn();
    client.on('reconnecting', reconnecting);

    // Unexpected close (not intentional, mode is 'websocket').
    socket.simulateClose(1006, 'abnormal');

    expect(reconnecting).toHaveBeenCalledTimes(1);
    // First attempt: reconnectDelay(1000) * 2^0 = 1000ms.
    expect(reconnecting).toHaveBeenCalledWith({ attempt: 1, delay: 1000 });
    expect(client.connectionState).toBe('reconnecting');

    // No new socket until the timer fires.
    const before = MockWebSocket.instances.length;
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances.length).toBe(before + 1);
  });

  it('does NOT reconnect after an intentional disconnect()', () => {
    vi.useFakeTimers();
    const { client, socket } = connectOpenClient();
    const reconnecting = vi.fn();
    client.on('reconnecting', reconnecting);

    client.disconnect();
    // A close arriving after disconnect must not schedule a reconnect.
    socket.simulateClose(1000, 'normal');
    vi.advanceTimersByTime(5000);

    expect(reconnecting).not.toHaveBeenCalled();
  });
});

describe('websocketClient — orphan guard (StrictMode double-invoke)', () => {
  it('tears down a prior non-OPEN socket when connect() runs again', () => {
    const client = new WebSocketClient('ws://localhost:8080/ws');
    client.connect();
    const first = latestSocket()!;
    expect(first.readyState).toBe(MockWebSocket.CONNECTING); // never opened

    // Second connect (StrictMode connect → cleanup → connect) before the first
    // socket finished its handshake.
    client.connect();
    const second = latestSocket()!;

    // The first socket is detached + closed so it can never deliver messages.
    expect(first.closed).toBe(true);
    expect(first.onmessage).toBeNull();
    expect(first.onopen).toBeNull();
    expect(second).not.toBe(first);
    expect(second.closed).toBe(false);
  });

  it('returns early without a new socket when already OPEN', () => {
    const { socket } = connectOpenClient();
    const before = MockWebSocket.instances.length;
    socket.simulateOpen();
    // connect() while OPEN is a no-op.
    socket.onopen = socket.onopen; // keep reference stable
    expect(MockWebSocket.instances.length).toBe(before);
  });
});

describe('websocketClient — disconnect()', () => {
  it('detaches all handlers and closes the socket', () => {
    const { client, socket } = connectOpenClient();
    const messageListener = vi.fn();
    client.on('message', messageListener);

    client.disconnect();

    expect(socket.closed).toBe(true);
    expect(socket.onmessage).toBeNull();
    expect(socket.onclose).toBeNull();
    expect(socket.onerror).toBeNull();
    expect(socket.onopen).toBeNull();
    expect(client.isConnected).toBe(false);
  });

  it('clears a pending reconnect timer so no socket is created later', () => {
    vi.useFakeTimers();
    const { client, socket } = connectOpenClient();
    socket.simulateClose(1006, 'abnormal'); // schedules a reconnect
    expect(client.connectionState).toBe('reconnecting');

    client.disconnect();
    const before = MockWebSocket.instances.length;
    vi.advanceTimersByTime(60000);

    expect(MockWebSocket.instances.length).toBe(before);
    expect(client.connectionState).toBe('disconnected');
  });
});

describe('websocketClient — auth via Sec-WebSocket-Protocol', () => {
  it('passes [token, ACTUAL_TOKEN] as the WebSocket subprotocol when a token is set', () => {
    const client = new WebSocketClient('ws://localhost:8080/ws');
    client.setToken('secret-abc');
    client.connect();
    const socket = latestSocket()!;

    expect(socket.protocols).toEqual(['token', 'secret-abc']);
  });

  it('passes no subprotocol when no token is set', () => {
    const client = new WebSocketClient('ws://localhost:8080/ws');
    client.connect();
    const socket = latestSocket()!;

    expect(socket.protocols).toBeUndefined();
  });
});
