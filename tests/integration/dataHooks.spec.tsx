// @vitest-environment happy-dom
/**
 * dataHooks.spec.tsx — the data-layer hooks against MSW-served fixtures.
 *
 * The REAL hooks + the REAL generated fetch client run; only `/api/*` is
 * intercepted by MSW (see tests/helpers/mswServer.ts). Each test gets a fresh
 * React Query client (retries off, no cache bleed) via `renderHookWithClient`.
 * Annotations CRUD is verified against MSW's in-memory store, asserting that a
 * mutation invalidates + refetches the affected element's list.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';

import { useModel } from '@/apps/embedded/data/useModel';
import { useSpec } from '@/apps/embedded/data/useSpec';
import { useChangesets, useChangeset } from '@/apps/embedded/data/useChangesets';
import {
  useAnnotations,
  useReplies,
  useCreateAnnotation,
  useUpdateAnnotation,
  useDeleteAnnotation,
} from '@/apps/embedded/data/useAnnotations';
import {
  renderHookWithClient,
  createTestQueryClient,
} from '../helpers/renderHookWithClient';

import model from '../fixtures/model.json';

const ELEMENT_ID = 'motivation.goal.visualize-multi-layer-architecture-models';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useModel — maps the /api/model fixture', () => {
  it('exposes raw nodes/links and derives per-layer counts + relCount', async () => {
    const { result } = renderHookWithClient(() => useModel());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.derived.nodes).toHaveLength(model.nodes.length); // 285
    expect(result.current.derived.relCount).toBe(model.links.length); // 445

    // Counts reconcile with the raw node layer_ids.
    const expectedCounts: Record<string, number> = {};
    for (const n of model.nodes) {
      expectedCounts[n.layer_id] = (expectedCounts[n.layer_id] ?? 0) + 1;
    }
    expect(result.current.derived.countsByLayer).toEqual(expectedCounts);

    // Total of per-layer counts equals total node count.
    const summed = Object.values(result.current.derived.countsByLayer).reduce(
      (a, b) => a + b,
      0,
    );
    expect(summed).toBe(model.nodes.length);
  });
});

describe('useSpec — maps the /api/spec fixture', () => {
  it('derives per-layer node-type info from nodeSchemas keys, plus the version', async () => {
    const { result } = renderHookWithClient(() => useSpec());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.derived.version).toBe('0.1.0');
    // At least one layer schema was derived, and each typeCount matches its ids.
    const byLayer = result.current.derived.byLayer;
    expect(Object.keys(byLayer).length).toBeGreaterThan(0);
    for (const info of Object.values(byLayer)) {
      expect(info.typeCount).toBe(info.typeIds.length);
      expect(info.typeTitles).toHaveLength(info.typeIds.length);
    }
    // raw payload is passed through for the Schema-view transforms.
    expect(result.current.raw?.schemas).toBeTruthy();
  });
});

describe('useChangesets — maps the /api/changesets fixture', () => {
  it('lists changeset summaries newest-first', async () => {
    const { result } = renderHookWithClient(() => useChangesets());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const list = result.current.derived.list;
    expect(list.length).toBe(3);
    // Sorted by created descending.
    const created = list.map((c) => c.created);
    const sorted = [...created].sort((a, b) => b.localeCompare(a));
    expect(created).toEqual(sorted);
    // Each summary carries the mapped fields.
    expect(list[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      status: expect.any(String),
      changesCount: expect.any(Number),
    });
  });
});

describe('useChangeset — detail hook', () => {
  it('is disabled (no fetch) until an id is provided', async () => {
    const { result } = renderHookWithClient(() => useChangeset(null));
    // Disabled query never enters loading/success; detail is null.
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.detail).toBeNull();
  });

  it('maps stats + change rows when an id is provided', async () => {
    const { result } = renderHookWithClient(() =>
      useChangeset('changeset-1774309821523-1gs13ct6s'),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.detail).not.toBeNull();
    expect(result.current.detail!.stats).toEqual({
      additions: 27,
      modifications: 7,
      deletions: 4,
    });
    expect(result.current.detail!.changesCount).toBe(38);
    expect(result.current.detail!.rows.length).toBe(38);
  });
});

describe('useAnnotations — GET filtered by elementId', () => {
  it('is disabled (no request) when elementId is null', async () => {
    const { result } = renderHookWithClient(() => useAnnotations(null));
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('returns only annotations for the requested element', async () => {
    const { result } = renderHookWithClient(() => useAnnotations(ELEMENT_ID));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.length).toBe(2); // two seeded for this element
    expect(data.every((a) => a.elementId === ELEMENT_ID)).toBe(true);
  });
});

describe('useReplies — lazy', () => {
  it('does NOT fetch on initial render when disabled', () => {
    const { result } = renderHookWithClient(() => useReplies('ann-fixture-0001', false));
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('fetches replies when enabled', async () => {
    const { result } = renderHookWithClient(() => useReplies('ann-fixture-0001', true));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0]).toMatchObject({ content: expect.any(String) });
  });
});

describe('annotations mutations — invalidate + refetch', () => {
  it('create adds an annotation and the element list refetches with it', async () => {
    const client = createTestQueryClient();
    const list = renderHookWithClient(() => useAnnotations(ELEMENT_ID), { client });
    const create = renderHookWithClient(() => useCreateAnnotation(), { client });

    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    expect(list.result.current.data!).toHaveLength(2);

    await create.result.current.mutateAsync({
      elementId: ELEMENT_ID,
      content: 'A brand new annotation',
      tags: ['new'],
    });

    // onSuccess invalidates annotationsKey(elementId) → the list refetches.
    await waitFor(() => expect(list.result.current.data!).toHaveLength(3));
    expect(
      list.result.current.data!.some((a) => a.content === 'A brand new annotation'),
    ).toBe(true);
  });

  it('patch updates content/resolved and the list reflects it after refetch', async () => {
    const client = createTestQueryClient();
    const list = renderHookWithClient(() => useAnnotations(ELEMENT_ID), { client });
    const patch = renderHookWithClient(() => useUpdateAnnotation(), { client });

    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));

    await patch.result.current.mutateAsync({
      id: 'ann-fixture-0001',
      elementId: ELEMENT_ID,
      content: 'edited content',
      resolved: true,
    });

    await waitFor(() => {
      const edited = list.result.current.data!.find((a) => a.id === 'ann-fixture-0001');
      expect(edited?.content).toBe('edited content');
      expect(edited?.resolved).toBe(true);
    });
  });

  it('delete removes an annotation and the list refetches without it', async () => {
    const client = createTestQueryClient();
    const list = renderHookWithClient(() => useAnnotations(ELEMENT_ID), { client });
    const del = renderHookWithClient(() => useDeleteAnnotation(), { client });

    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    expect(list.result.current.data!).toHaveLength(2);

    await del.result.current.mutateAsync({
      id: 'ann-fixture-0001',
      elementId: ELEMENT_ID,
    });

    await waitFor(() => expect(list.result.current.data!).toHaveLength(1));
    expect(
      list.result.current.data!.some((a) => a.id === 'ann-fixture-0001'),
    ).toBe(false);
  });
});
