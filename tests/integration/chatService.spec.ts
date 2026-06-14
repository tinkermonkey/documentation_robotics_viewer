// @vitest-environment happy-dom
/**
 * chatService.spec.ts — drives server notifications through the REAL chain:
 *
 *   MockWebSocket.onmessage → websocketClient.handleMessage → 'message' emit
 *     → jsonRpcHandler message listener → handleNotification
 *       → chatService notification handler → chatStore mutation
 *
 * Only the WebSocket transport is mocked; `chatService`, `jsonRpcHandler`,
 * `websocketClient`, and `chatStore` all run for real. The singleton
 * `chatService` is imported (registering its 5 notification handlers once at
 * module load); `chatService.reset()` + the global store reset run between
 * tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatService, chatService } from '@/apps/embedded/services/chatService';
import { jsonRpcHandler } from '@/apps/embedded/services/jsonRpcHandler';
import { useChatStore } from '@/apps/embedded/stores/chatStore';
import { websocketClient } from '@/apps/embedded/services/websocketClient';
import type { ChatMessage } from '@/apps/embedded/types/chat';
import {
  installMockWebSocket,
  restoreWebSocket,
  resetMockWebSockets,
  latestSocket,
  MockWebSocket,
} from '../helpers/mockWebSocket';

/** The genuine onNotification, captured before any spy replaces it. */
const realOnNotification = jsonRpcHandler.onNotification.bind(jsonRpcHandler);

let previousWs: typeof globalThis.WebSocket | undefined;
let socket: MockWebSocket;

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Push a JSON-RPC notification frame through the real transport chain. */
function notify(method: string, params: Record<string, unknown>): void {
  socket.simulateMessage({ jsonrpc: '2.0', method, params });
}

/** Seed a streaming assistant message so handlers have a target. */
function seedStreamingAssistant(id = 'assistant-1'): ChatMessage {
  const store = useChatStore.getState();
  const msg: ChatMessage = {
    id,
    role: 'assistant',
    conversationId: 'conv-1',
    timestamp: new Date().toISOString(),
    parts: [],
    isStreaming: true,
  };
  store.addMessage(msg);
  return msg;
}

beforeEach(async () => {
  resetMockWebSockets();
  previousWs = installMockWebSocket();
  websocketClient.connect();
  socket = latestSocket()!;
  socket.simulateOpen();
  // Ensure the singleton jsonRpcHandler's message listener is attached.
  await flush();
  chatService.reset();
});

afterEach(() => {
  websocketClient.disconnect();
  restoreWebSocket(previousWs);
  vi.useRealTimers();
});

describe('chatService — notification handler registration', () => {
  it('registers exactly 5 notification handlers, one per chat method', () => {
    // Capture the unsubscribe functions returned so the fresh service's handlers
    // can be torn down — otherwise they leak onto the singleton jsonRpcHandler
    // and double every subsequent notification.
    const unsubscribes: Array<() => void> = [];
    const spy = vi
      .spyOn(jsonRpcHandler, 'onNotification')
      .mockImplementation((method, handler) => {
        const unsub = realOnNotification(method, handler);
        unsubscribes.push(unsub);
        return unsub;
      });

    new ChatService();

    const methods = spy.mock.calls.map((c) => c[0]);
    expect(methods).toEqual([
      'chat.response.chunk',
      'chat.tool.invoke',
      'chat.thinking',
      'chat.usage',
      'chat.error',
    ]);
    // No method registered twice.
    expect(new Set(methods).size).toBe(methods.length);

    spy.mockRestore();
    unsubscribes.forEach((u) => u());
  });
});

describe('chatService — chat.response.chunk', () => {
  it('appends streamed text to the current streaming assistant message', () => {
    const { id } = seedStreamingAssistant();

    notify('chat.response.chunk', { content: 'Hello' });
    notify('chat.response.chunk', { content: ', world' });

    const msg = useChatStore.getState().messages.find((m) => m.id === id)!;
    // Consecutive text chunks coalesce into a single text part.
    expect(msg.parts).toHaveLength(1);
    expect(msg.parts[0]).toMatchObject({ type: 'text', content: 'Hello, world' });
  });

  it('targets the streaming assistant message, not an earlier non-streaming one', () => {
    const store = useChatStore.getState();
    store.addMessage({
      id: 'user-1',
      role: 'user',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{ type: 'text', content: 'hi', timestamp: new Date().toISOString() }],
    });
    const { id } = seedStreamingAssistant('assistant-2');

    notify('chat.response.chunk', { content: 'reply' });

    expect(useChatStore.getState().messages.find((m) => m.id === 'user-1')!.parts).toHaveLength(1);
    const assistant = useChatStore.getState().messages.find((m) => m.id === id)!;
    expect(assistant.parts[0]).toMatchObject({ type: 'text', content: 'reply' });
  });

  it('does not throw when no streaming message exists (logs a warning instead)', () => {
    expect(() => notify('chat.response.chunk', { content: 'orphan' })).not.toThrow();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});

describe('chatService — chat.tool.invoke', () => {
  it('adds a tool invocation keyed by tool_use_id, mapping executing→executing', () => {
    const { id } = seedStreamingAssistant();

    notify('chat.tool.invoke', {
      conversationId: 'conv-1',
      tool_use_id: 'tu-1',
      toolName: 'search',
      toolInput: { q: 'x' },
      status: 'executing',
    });

    const msg = useChatStore.getState().messages.find((m) => m.id === id)!;
    expect(msg.parts).toHaveLength(1);
    expect(msg.parts[0]).toMatchObject({
      type: 'tool_invocation',
      toolUseId: 'tu-1',
      toolName: 'search',
      status: { state: 'executing' },
    });
  });

  it('updates an existing tool (by tool_use_id) in place: completed→result', () => {
    const { id } = seedStreamingAssistant();

    notify('chat.tool.invoke', {
      tool_use_id: 'tu-1',
      toolName: 'search',
      toolInput: { q: 'x' },
      status: 'executing',
    });
    notify('chat.tool.invoke', {
      tool_use_id: 'tu-1',
      toolName: 'search',
      toolInput: { q: 'x' },
      status: 'completed',
      result: { hits: 3 },
    });

    const msg = useChatStore.getState().messages.find((m) => m.id === id)!;
    // Still ONE tool part — updated, not duplicated.
    const tools = msg.parts.filter((p) => p.type === 'tool_invocation');
    expect(tools).toHaveLength(1);
    expect(tools[0]).toMatchObject({
      toolUseId: 'tu-1',
      status: { state: 'completed', result: { hits: 3 } },
    });
  });

  it('maps failed→{ state: failed, error }', () => {
    const { id } = seedStreamingAssistant();

    notify('chat.tool.invoke', {
      tool_use_id: 'tu-9',
      toolName: 'broken',
      toolInput: {},
      status: 'failed',
      error: 'boom',
    });

    const msg = useChatStore.getState().messages.find((m) => m.id === id)!;
    expect(msg.parts[0]).toMatchObject({
      type: 'tool_invocation',
      status: { state: 'failed', error: 'boom' },
    });
  });
});

describe('chatService — chat.thinking / chat.usage', () => {
  it('appends a thinking part with the provided content', () => {
    const { id } = seedStreamingAssistant();

    notify('chat.thinking', { content: 'let me reason' });

    const msg = useChatStore.getState().messages.find((m) => m.id === id)!;
    expect(msg.parts[0]).toMatchObject({ type: 'thinking', content: 'let me reason' });
  });

  it('appends a usage part mapping snake_case token counts to camelCase', () => {
    const { id } = seedStreamingAssistant();

    notify('chat.usage', {
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150,
      total_cost_usd: 0.012,
    });

    const msg = useChatStore.getState().messages.find((m) => m.id === id)!;
    expect(msg.parts[0]).toMatchObject({
      type: 'usage',
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      totalCostUsd: 0.012,
    });
  });
});

describe('chatService — chat.error', () => {
  it('sets the store error, stops streaming, and appends an error part', () => {
    const store = useChatStore.getState();
    store.setStreaming(true);
    const { id } = seedStreamingAssistant();

    notify('chat.error', { message: 'server exploded', code: 'BOOM' });

    const state = useChatStore.getState();
    expect(state.error).toBe('server exploded');
    expect(state.isStreaming).toBe(false);
    const msg = state.messages.find((m) => m.id === id)!;
    expect(msg.parts[0]).toMatchObject({
      type: 'error',
      code: 'BOOM',
      message: 'server exploded',
    });
  });
});

describe('chatService — sendMessage -32001 (SDK unavailable) path', () => {
  it('surfaces gracefully: sets store error, stops streaming, no unhandled throw escapes', async () => {
    // sendMessage adds the optimistic user + streaming assistant messages and
    // awaits the chat.send JSON-RPC response; reply with -32001.
    const promise = chatService.sendMessage('hi there');
    await flush(); // let the request frame flush to the socket

    // Find the outbound chat.send request id and reject it with -32001.
    const req = socket.sent.find(
      (f): f is { id: string | number; method: string } =>
        typeof f === 'object' && f !== null && (f as { method?: string }).method === 'chat.send',
    )!;
    expect(req).toBeTruthy();
    socket.simulateMessage({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Anthropic SDK not installed' },
      id: req.id,
    });

    await expect(promise).rejects.toThrow(/Anthropic SDK not installed/);

    const state = useChatStore.getState();
    expect(state.isStreaming).toBe(false);
    expect(state.error).toMatch(/Anthropic SDK not installed/);
    // An optimistic user + a streaming assistant message were added; the
    // assistant message carries an error part from the catch branch.
    const assistant = state.messages.find((m) => m.role === 'assistant')!;
    expect(assistant.parts.some((p) => p.type === 'error')).toBe(true);
    expect(assistant.isStreaming).toBe(true); // catch branch never clears the flag
  });
});

describe('chatService — sendMessage success path', () => {
  it('clears the assistant isStreaming flag and store.isStreaming when chat.send resolves', async () => {
    // sendMessage adds the optimistic user + streaming assistant messages, marks
    // store.isStreaming = true, then awaits the chat.send JSON-RPC response.
    const promise = chatService.sendMessage('hello there');
    await flush(); // let the request frame flush to the socket

    // While the request is in flight the assistant message streams.
    const inFlight = useChatStore.getState();
    expect(inFlight.isStreaming).toBe(true);
    const streamingAssistant = inFlight.messages.find((m) => m.role === 'assistant')!;
    expect(streamingAssistant.isStreaming).toBe(true);

    // Find the outbound chat.send request id and resolve it with a success result.
    const req = socket.sent.find(
      (f): f is { id: string | number; method: string } =>
        typeof f === 'object' && f !== null && (f as { method?: string }).method === 'chat.send',
    )!;
    expect(req).toBeTruthy();
    socket.simulateMessage({
      jsonrpc: '2.0',
      result: {
        conversationId: 'conv-1',
        status: 'completed',
        totalCostUsd: 0.0042,
        timestamp: new Date().toISOString(),
      },
      id: req.id,
    });

    const result = await promise;
    expect(result).toMatchObject({ status: 'completed', totalCostUsd: 0.0042 });

    // Success path clears streaming on both the assistant message and the store.
    const state = useChatStore.getState();
    expect(state.isStreaming).toBe(false);
    expect(state.error).toBeNull();
    const assistant = state.messages.find((m) => m.role === 'assistant')!;
    expect(assistant.isStreaming).toBe(false);
  });
});
