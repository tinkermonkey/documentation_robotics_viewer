// @vitest-environment happy-dom
/**
 * useLiveModelUpdates — the server's `model.updated` broadcast (sent after any
 * write to the model files) refetches the model and changesets, over a real
 * websocketClient on a mock WebSocket.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLiveModelUpdates } from '@/apps/embedded/data/useModel';
import { websocketClient } from '@/apps/embedded/services/websocketClient';
import {
  installMockWebSocket,
  latestSocket,
  resetMockWebSockets,
  restoreWebSocket,
  type MockWebSocket,
} from '../helpers/mockWebSocket';
import { createTestQueryClient, renderHookWithClient } from '../helpers/renderHookWithClient';

let previousWs: typeof globalThis.WebSocket | undefined;
let socket: MockWebSocket;

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
});

describe('useLiveModelUpdates', () => {
  it('refetches the model and changesets when the server announces a model change', () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { unmount } = renderHookWithClient(() => useLiveModelUpdates(), { client });

    socket.simulateMessage({ jsonrpc: '2.0', method: 'chat.response.chunk', params: {} });
    expect(invalidate).not.toHaveBeenCalled();

    socket.simulateMessage({ type: 'model.updated', data: {}, timestamp: '2026-11-03T00:00:00Z' });
    expect(invalidate.mock.calls.map(([f]) => f?.queryKey)).toEqual([
      ['getapimodel'],
      ['getapilayerslayerName'],
      ['getapichangesets'],
      ['getapichangesetschangesetId'],
    ]);

    invalidate.mockClear();
    unmount();
    socket.simulateMessage({ type: 'model.updated' });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
