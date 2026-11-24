// @vitest-environment happy-dom
/**
 * commitProgress hooks over a real websocketClient on a mock WebSocket (#628):
 * `useCommitProgress` follows one changeset's commit while listening, and
 * `useOutsideCommitProgress` (the status bar) follows commits this tab didn't
 * start, until they go quiet.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';

import {
  OUTSIDE_PROGRESS_DONE_MS,
  OUTSIDE_PROGRESS_FAILED_MS,
  OUTSIDE_PROGRESS_SAFETY_MS,
  markOwnCommit,
  useCommitProgress,
  useOutsideCommitProgress,
} from '@/apps/embedded/data/commitProgress';
import { websocketClient } from '@/apps/embedded/services/websocketClient';
import {
  installMockWebSocket,
  latestSocket,
  resetMockWebSockets,
  restoreWebSocket,
  type MockWebSocket,
} from '../helpers/mockWebSocket';
import { renderHookWithClient } from '../helpers/renderHookWithClient';

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
  vi.useRealTimers();
  websocketClient.disconnect();
  restoreWebSocket(previousWs);
});

const send = (changesetId: string, applied: number, total: number, extra: Record<string, unknown> = {}) =>
  act(() => socket.simulateMessage({ type: 'changeset.commit.progress', changesetId, applied, total, ...extra }));

describe('useCommitProgress', () => {
  it("follows one changeset's frames while listening, plain or JSON-RPC, for this checkout only", () => {
    const { result, rerender } = renderHookWithClient(
      ({ listening }: { listening: boolean }) => useCommitProgress('cs-1', listening),
      { initialProps: { listening: false } },
    );
    send('cs-1', 1, 10);
    expect(result.current).toBeNull(); // not listening yet

    rerender({ listening: true });
    send('cs-1', 2, 10, { phase: 'applying' });
    expect(result.current).toEqual({ changesetId: 'cs-1', applied: 2, total: 10, phase: 'applying' });

    send('cs-2', 9, 10);
    send('cs-1', 5, 10, { project: 'other-project', checkout: 'main' });
    send('cs-1', 'x' as unknown as number, 10);
    expect(result.current?.applied).toBe(2);

    act(() =>
      socket.simulateMessage({
        jsonrpc: '2.0',
        method: 'changeset.commit.progress',
        params: { changesetId: 'cs-1', applied: 7, total: 10, phase: 'applying' },
      }),
    );
    expect(result.current?.applied).toBe(7);

    // Stopping keeps the last progress (a refusal shows where it stopped); a new commit starts clean.
    rerender({ listening: false });
    expect(result.current?.applied).toBe(7);
    rerender({ listening: true });
    expect(result.current).toBeNull();
  });
});

describe('useOutsideCommitProgress', () => {
  it("shows a commit this tab didn't start until it ends, through silent phases", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHookWithClient(() => useOutsideCommitProgress());
    const forget = markOwnCommit('mine');
    send('mine', 3, 10);
    expect(result.current).toBeNull();
    forget();

    send('from-cli', 3, 10, { phase: 'applying' });
    expect(result.current).toEqual({ changesetId: 'from-cli', applied: 3, total: 10, phase: 'applying' });
    // Saving a large model can be silent for a long while: it stays.
    send('from-cli', 10, 10, { phase: 'saving' });
    act(() => vi.advanceTimersByTime(30_000));
    expect(result.current?.phase).toBe('saving');
    // Done: it goes shortly after.
    send('from-cli', 10, 10, { phase: 'done' });
    act(() => vi.advanceTimersByTime(OUTSIDE_PROGRESS_DONE_MS - 1));
    expect(result.current?.phase).toBe('done');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();

    // Failed: shown stopped for a while, then gone.
    send('from-drbot', 2, 10, { phase: 'validating', failed: true });
    expect(result.current?.failed).toBe(true);
    act(() => vi.advanceTimersByTime(OUTSIDE_PROGRESS_FAILED_MS - 1));
    expect(result.current?.failed).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();

    // A commit whose last frame never comes: the safety cap.
    send('lost', 1, 10, { phase: 'applying' });
    act(() => vi.advanceTimersByTime(OUTSIDE_PROGRESS_SAFETY_MS - 1));
    expect(result.current?.changesetId).toBe('lost');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBeNull();
    unmount();
  });
});
