// @vitest-environment happy-dom
/**
 * useLiveAnnotationUpdates — the server's `annotation.*` broadcasts (sent by
 * the REST routes and by the file watcher, e.g. after an MCP `annotation_reply`)
 * refetch the affected annotation lists and replies, over a real
 * websocketClient on a mock WebSocket.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryObserver } from '@tanstack/react-query';

import {
  annotationsKey,
  repliesKey,
  useLiveAnnotationUpdates,
} from '@/apps/embedded/data/useAnnotations';
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

const ELEMENT = 'application.applicationcomponent.viewer';
const ANNOTATION = 'ann-1';
const REF = { project: 'test-project', checkout: 'main' };
const LISTS = ['annotations', 'test-project', 'main'];
const T = '2026-11-11T00:00:00Z';

function setup() {
  const client = createTestQueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const remove = vi.spyOn(client, 'removeQueries');
  const hook = renderHookWithClient(() => useLiveAnnotationUpdates(), { client });
  const invalidatedKeys = () => invalidate.mock.calls.map(([f]) => f?.queryKey);
  return { ...hook, client, invalidate, remove, invalidatedKeys };
}

describe('useLiveAnnotationUpdates', () => {
  it('refetches the element list when a comment is added', () => {
    const { invalidatedKeys } = setup();
    socket.simulateMessage({
      type: 'annotation.added',
      annotationId: ANNOTATION,
      elementId: ELEMENT,
      timestamp: T,
    });
    expect(invalidatedKeys()).toEqual([annotationsKey(REF, ELEMENT)]);
  });

  it('refetches every element list when a comment is updated (no elementId)', () => {
    const { invalidatedKeys } = setup();
    socket.simulateMessage({ type: 'annotation.updated', annotationId: ANNOTATION, timestamp: T });
    expect(invalidatedKeys()).toEqual([LISTS]);
  });

  it('refetches the replies when a reply is added', () => {
    const { invalidatedKeys } = setup();
    socket.simulateMessage({
      type: 'annotation.reply.added',
      annotationId: ANNOTATION,
      replyId: 'reply-1',
      timestamp: T,
    });
    expect(invalidatedKeys()).toEqual([repliesKey(REF, ANNOTATION)]);
  });

  it('refetches every list, then drops the unobserved replies, when a comment is deleted', async () => {
    const { invalidatedKeys, remove } = setup();
    socket.simulateMessage({ type: 'annotation.deleted', annotationId: ANNOTATION, timestamp: T });
    expect(invalidatedKeys()).toEqual([LISTS]);
    // Only after the lists have refetched, and only if no thread still shows them.
    expect(remove).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(remove.mock.calls.map(([f]) => f)).toEqual([
        { queryKey: repliesKey(REF, ANNOTATION), type: 'inactive' },
      ]),
    );
  });

  it('keeps a deleted comment\'s replies while a thread still observes them (no 404 refetch)', async () => {
    const { client } = setup();
    const fetchReplies = vi.fn(async () => []);
    client.setQueryData(repliesKey(REF, ANNOTATION), []);
    // An active observer: the inspector's open thread, not yet unmounted.
    const thread = new QueryObserver(client, {
      queryKey: repliesKey(REF, ANNOTATION),
      queryFn: fetchReplies,
      staleTime: Infinity,
    });
    const stop = thread.subscribe(() => {});

    socket.simulateMessage({ type: 'annotation.deleted', annotationId: ANNOTATION, timestamp: T });
    await new Promise((r) => setTimeout(r, 20));
    expect(client.getQueryCache().find({ queryKey: repliesKey(REF, ANNOTATION) })).toBeDefined();
    expect(fetchReplies).not.toHaveBeenCalled();
    stop();
  });

  it('ignores an annotation event stamped for another checkout', () => {
    const { invalidate } = setup();
    socket.simulateMessage({
      type: 'annotation.added',
      annotationId: ANNOTATION,
      elementId: ELEMENT,
      project: 'test-project',
      checkout: 'feature-x',
      timestamp: T,
    });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("the checkout's ['annotations', project, checkout] prefix matches its element lists but not replies or another checkout", async () => {
    const { client } = setup();
    client.setQueryData(annotationsKey(REF, ELEMENT), []);
    client.setQueryData(annotationsKey(REF, 'other.element'), []);
    client.setQueryData(repliesKey(REF, ANNOTATION), []);
    client.setQueryData(annotationsKey({ project: 'test-project', checkout: 'feature-x' }, ELEMENT), []);
    socket.simulateMessage({ type: 'annotation.updated', annotationId: ANNOTATION, timestamp: T });
    const cache = client.getQueryCache();
    expect(
      cache.find({ queryKey: annotationsKey({ project: 'test-project', checkout: 'feature-x' }, ELEMENT) })?.state.isInvalidated,
    ).toBe(false);
    expect(cache.find({ queryKey: annotationsKey(REF, ELEMENT) })?.state.isInvalidated).toBe(true);
    expect(cache.find({ queryKey: annotationsKey(REF, 'other.element') })?.state.isInvalidated).toBe(true);
    expect(cache.find({ queryKey: repliesKey(REF, ANNOTATION) })?.state.isInvalidated).toBe(false);
  });

  it('ignores unrelated messages and stops listening on unmount', () => {
    const { invalidate, remove, unmount } = setup();
    socket.simulateMessage({ type: 'changesets.updated', ids: [], active: null });
    expect(invalidate).not.toHaveBeenCalled();

    unmount();
    socket.simulateMessage({ type: 'annotation.added', annotationId: ANNOTATION, elementId: ELEMENT });
    socket.simulateMessage({ type: 'annotation.updated', annotationId: ANNOTATION });
    socket.simulateMessage({ type: 'annotation.reply.added', annotationId: ANNOTATION, replyId: 'r' });
    socket.simulateMessage({ type: 'annotation.deleted', annotationId: ANNOTATION });
    expect(invalidate).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
