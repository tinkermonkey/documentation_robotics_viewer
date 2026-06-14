// @vitest-environment happy-dom
/**
 * jsonRpcHandler.spec.ts — request/response correlation, notification dispatch,
 * and timeout handling for the REAL `JsonRpcHandler`.
 *
 * The handler is wired to the module-level singleton `websocketClient` (it
 * attaches a `message` listener on construction, via a dynamic import). We
 * exercise the full real path: install a `MockWebSocket`, connect + open the
 * singleton transport, then feed JSON-RPC frames through the socket's
 * `onmessage`. The singleton client's `handleMessage` emits to the handler's
 * `message` listener exactly as in production.
 *
 * A fresh `JsonRpcHandler` is built per test (isolated pending-request maps).
 * Because both listener attachment AND request sending await an `import()` of
 * `./websocketClient`, tests flush the microtask queue (`flush()`) after those
 * calls before injecting frames.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JsonRpcHandler, JsonRpcErrorResult } from '@/apps/embedded/services/jsonRpcHandler';
import { websocketClient } from '@/apps/embedded/services/websocketClient';
import {
  installMockWebSocket,
  restoreWebSocket,
  resetMockWebSockets,
  latestSocket,
  MockWebSocket,
} from '../helpers/mockWebSocket';

let previousWs: typeof globalThis.WebSocket | undefined;
let socket: MockWebSocket;

/**
 * Flush pending async work, including a settled dynamic `import()` — which
 * resolves on a macrotask, so a real `setTimeout(0)` is required (microtask
 * flushing alone is insufficient).
 */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Build a handler whose message listener has finished attaching. */
async function makeHandler(): Promise<JsonRpcHandler> {
  const handler = new JsonRpcHandler();
  await flush();
  return handler;
}

/** Send a request, flush the outbound import, and return [promise, requestId]. */
async function send<T = unknown>(
  handler: JsonRpcHandler,
  method: string,
  params?: Record<string, unknown>,
  timeout?: number,
): Promise<{ promise: Promise<T>; id: string | number }> {
  const promise = handler.sendRequest<T>(method, params, timeout);
  await flush(); // let _sendRequestMessage's import resolve + call .send()
  const sent = socket.sent.filter(
    (f): f is { id: string | number; method: string } =>
      typeof f === 'object' && f !== null && 'id' in f && 'method' in f,
  );
  return { promise, id: sent[sent.length - 1]!.id };
}

beforeEach(() => {
  resetMockWebSockets();
  previousWs = installMockWebSocket();
  websocketClient.connect();
  socket = latestSocket()!;
  socket.simulateOpen();
});

afterEach(() => {
  websocketClient.disconnect();
  restoreWebSocket(previousWs);
  vi.useRealTimers();
});

describe('jsonRpcHandler — sendRequest correlation', () => {
  it('resolves when a response with the matching id arrives', async () => {
    const handler = await makeHandler();
    const { promise, id } = await send(handler, 'demo.method', { a: 1 });

    socket.simulateMessage({ jsonrpc: '2.0', result: { value: 42 }, id });

    await expect(promise).resolves.toEqual({ value: 42 });
  });

  it('rejects with a JsonRpcErrorResult when an error response arrives', async () => {
    const handler = await makeHandler();
    const { promise, id } = await send(handler, 'demo.fail');

    socket.simulateMessage({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'SDK unavailable' },
      id,
    });

    const err = await promise.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(JsonRpcErrorResult);
    expect((err as JsonRpcErrorResult).code).toBe(-32001);
    expect((err as JsonRpcErrorResult).rpcError.message).toBe('SDK unavailable');
  });

  it('ignores a response whose id matches no pending request', async () => {
    const handler = await makeHandler();
    const { promise, id } = await send(handler, 'demo.method');

    socket.simulateMessage({ jsonrpc: '2.0', result: { stray: true }, id: 'no-such-id' });
    expect(handler.getPendingRequestCount()).toBe(1);

    socket.simulateMessage({ jsonrpc: '2.0', result: { ok: true }, id });
    await expect(promise).resolves.toEqual({ ok: true });
    expect(handler.getPendingRequestCount()).toBe(0);
  });

  it('ignores a late/duplicate response after the request already settled', async () => {
    const handler = await makeHandler();
    const { promise, id } = await send(handler, 'demo.method');

    socket.simulateMessage({ jsonrpc: '2.0', result: { first: true }, id });
    await expect(promise).resolves.toEqual({ first: true });

    expect(() =>
      socket.simulateMessage({ jsonrpc: '2.0', result: { second: true }, id }),
    ).not.toThrow();
    expect(handler.getPendingRequestCount()).toBe(0);
  });
});

describe('jsonRpcHandler — onNotification dispatch', () => {
  it('dispatches a notification to handlers registered for its method', async () => {
    const handler = await makeHandler();
    const cb = vi.fn();
    handler.onNotification('chat.response.chunk', cb);

    socket.simulateMessage({
      jsonrpc: '2.0',
      method: 'chat.response.chunk',
      params: { content: 'hello' },
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith({ content: 'hello' });
  });

  it('does not invoke handlers for a different method, and unsubscribe stops dispatch', async () => {
    const handler = await makeHandler();
    const cb = vi.fn();
    const unsubscribe = handler.onNotification('chat.usage', cb);

    socket.simulateMessage({ jsonrpc: '2.0', method: 'chat.thinking', params: {} });
    expect(cb).not.toHaveBeenCalled();

    socket.simulateMessage({ jsonrpc: '2.0', method: 'chat.usage', params: { t: 1 } });
    expect(cb).toHaveBeenCalledTimes(1);

    unsubscribe();
    socket.simulateMessage({ jsonrpc: '2.0', method: 'chat.usage', params: { t: 2 } });
    expect(cb).toHaveBeenCalledTimes(1); // still 1 — unsubscribed
  });
});

describe('jsonRpcHandler — timeout', () => {
  it('rejects after the request timeout elapses with no response', async () => {
    const handler = await makeHandler();
    // Use a small real timeout so we exercise the real setTimeout path without
    // fighting the dynamic-import microtasks that fake timers would stall.
    const { promise } = await send(handler, 'demo.slow', undefined, 20);

    const err = await promise.catch((e: unknown) => e);
    expect((err as Error).message).toMatch(
      /JSON-RPC request timeout for method 'demo.slow' after 20ms/,
    );
    expect(handler.getPendingRequestCount()).toBe(0);
  });
});
