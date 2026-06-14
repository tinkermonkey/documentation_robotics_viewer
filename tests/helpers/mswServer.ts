/**
 * MSW server backing the REST surface (`/api/*`) for hook/integration tests.
 *
 * Handlers are fed by the captured fixtures in `tests/fixtures/`. The
 * annotations surface is STATEFUL within a test run (an in-memory store seeded
 * from the fixture) so create/patch/delete/reply mutations can be observed
 * through real cache invalidation + refetch. `resetMswState()` re-seeds it
 * between tests.
 *
 * Paths are matched with a wildcard origin (`*\/api/...`) because the generated
 * API client builds absolute URLs from `window.location.origin` (happy-dom's
 * default), which differs from the test file's perspective.
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import model from '../fixtures/model.json';
import spec from '../fixtures/spec.json';
import changesets from '../fixtures/changesets.json';
import changesetDetail from '../fixtures/changeset-detail.json';
import annotationsFixture from '../fixtures/annotations.json';

interface AnnotationRecord {
  id: string;
  elementId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  resolved: boolean;
}

interface ReplyRecord {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

// ── Stateful annotation store (re-seeded per test) ──────────────────────────

let annotationStore: AnnotationRecord[] = [];
let replyStore: Record<string, ReplyRecord[]> = {};
let idCounter = 0;

export function resetMswState(): void {
  annotationStore = (annotationsFixture.annotations as AnnotationRecord[]).map((a) => ({
    ...a,
    tags: [...a.tags],
  }));
  replyStore = {};
  for (const [annId, replies] of Object.entries(
    annotationsFixture.replies as Record<string, ReplyRecord[]>,
  )) {
    replyStore[annId] = replies.map((r) => ({ ...r }));
  }
  idCounter = 0;
}

resetMswState();

/** Snapshot of the current in-memory annotation list (for assertions). */
export function currentAnnotations(): AnnotationRecord[] {
  return annotationStore;
}

export const handlers = [
  http.get('*/api/model', () => HttpResponse.json(model)),

  http.get('*/api/spec', () => HttpResponse.json(spec)),

  http.get('*/api/changesets', () => HttpResponse.json(changesets)),

  http.get('*/api/changesets/:id', ({ params }) => {
    // The single committed fixture is returned for any id; the detail hook keys
    // its cache by id, which is what the test verifies.
    return HttpResponse.json({ ...changesetDetail, id: params.id });
  }),

  // ── Annotations: list (filtered by elementId) ─────────────────────────────
  http.get('*/api/annotations', ({ request }) => {
    const url = new URL(request.url);
    const elementId = url.searchParams.get('elementId');
    const annotations = elementId
      ? annotationStore.filter((a) => a.elementId === elementId)
      : annotationStore;
    return HttpResponse.json({ annotations });
  }),

  // ── Annotations: create ───────────────────────────────────────────────────
  http.post('*/api/annotations', async ({ request }) => {
    const body = (await request.json()) as Partial<AnnotationRecord>;
    const record: AnnotationRecord = {
      id: `ann-created-${++idCounter}`,
      elementId: body.elementId ?? '',
      author: body.author ?? 'You',
      content: body.content ?? '',
      createdAt: new Date().toISOString(),
      tags: body.tags ?? [],
      resolved: false,
    };
    annotationStore.push(record);
    return HttpResponse.json(record);
  }),

  // ── Annotations: patch ────────────────────────────────────────────────────
  http.patch('*/api/annotations/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<AnnotationRecord>;
    const record = annotationStore.find((a) => a.id === params.id);
    if (!record) {
      return HttpResponse.json({ error: 'not found' }, { status: 404 });
    }
    if (body.content !== undefined) record.content = body.content;
    if (body.tags !== undefined) record.tags = body.tags;
    if (body.resolved !== undefined) record.resolved = body.resolved;
    record.updatedAt = new Date().toISOString();
    return HttpResponse.json(record);
  }),

  // ── Annotations: delete ───────────────────────────────────────────────────
  http.delete('*/api/annotations/:id', ({ params }) => {
    const idx = annotationStore.findIndex((a) => a.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'not found' }, { status: 404 });
    }
    annotationStore.splice(idx, 1);
    return HttpResponse.json({ deleted: true });
  }),

  // ── Annotations: replies (list + create) ──────────────────────────────────
  http.get('*/api/annotations/:id/replies', ({ params }) => {
    const replies = replyStore[params.id as string] ?? [];
    return HttpResponse.json({ replies });
  }),

  http.post('*/api/annotations/:id/replies', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ReplyRecord>;
    const record: ReplyRecord = {
      id: `reply-created-${++idCounter}`,
      author: body.author ?? 'You',
      content: body.content ?? '',
      createdAt: new Date().toISOString(),
    };
    (replyStore[params.id as string] ??= []).push(record);
    return HttpResponse.json(record);
  }),
];

export const mswServer = setupServer(...handlers);
