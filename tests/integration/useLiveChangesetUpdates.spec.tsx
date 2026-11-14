// @vitest-environment happy-dom
/**
 * useLiveChangesetUpdates — the server's `changesets.updated` broadcast (sent
 * after any write under documentation-robotics/changesets/, and after a commit
 * or discard) refetches the changesets, over a real websocketClient on a mock
 * WebSocket.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLiveChangesetUpdates } from '@/apps/embedded/data/useChangesets';
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

describe('useLiveChangesetUpdates', () => {
  it('refetches the changesets when the server announces a changeset change', () => {
    const client = createTestQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { unmount } = renderHookWithClient(() => useLiveChangesetUpdates(), { client });

    socket.simulateMessage({ jsonrpc: '2.0', method: 'chat.response.complete', params: {} });
    expect(invalidate).not.toHaveBeenCalled();

    socket.simulateMessage({
      type: 'changesets.updated',
      ids: ['changeset-1'],
      active: 'changeset-1',
      timestamp: '2026-11-09T00:00:00Z',
    });
    expect(invalidate.mock.calls.map(([f]) => f?.queryKey)).toEqual([
      ['getapichangesets'],
      ['getapichangesetschangesetId'],
      ['getapitier1'],
    ]);

    invalidate.mockClear();
    unmount();
    socket.simulateMessage({ type: 'changesets.updated', ids: [], active: null });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
