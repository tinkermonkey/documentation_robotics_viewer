/**
 * useChangesets — thin wrapper over the kept React Query hook
 * `useGetapichangesets`.
 *
 * The `/api/changesets` payload is `{ version, changesets: { [id]: {...} } }`
 * (or an empty `{}` when a model has no changesets). Derives a stable, ordered
 * list of changeset summaries for the nav tree.
 */

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  useGetapichangesets,
  useGetapichangesetschangesetId,
} from '../../../core/services/generatedApiClient';
import { toChangeRows, type ChangeRecord, type ChangeRow } from './changesets';
import { websocketClient } from '../services/websocketClient';

export interface ChangesetSummary {
  id: string;
  name: string;
  status: string;
  created: string;
  changesCount: number;
}

interface ChangesetEntry {
  name?: string;
  status?: string;
  created?: string;
  changes_count?: number;
  [key: string]: unknown;
}

interface ChangesetsPayload {
  version?: string;
  changesets?: Record<string, ChangesetEntry>;
  [key: string]: unknown;
}

export interface ChangesetsDerived {
  list: ChangesetSummary[];
}

const EMPTY_DERIVED: ChangesetsDerived = { list: [] };

export function useChangesets() {
  const query = useGetapichangesets();
  const raw = query.data as ChangesetsPayload | undefined;

  const derived = useMemo<ChangesetsDerived>(() => {
    const map = raw?.changesets;
    if (!map) return EMPTY_DERIVED;

    const list: ChangesetSummary[] = Object.entries(map).map(([id, entry]) => ({
      id,
      name: entry.name ?? id,
      status: entry.status ?? 'unknown',
      created: entry.created ?? '',
      changesCount: entry.changes_count ?? 0,
    }));

    // Newest first by created timestamp (stable for equal/empty timestamps).
    list.sort((a, b) => b.created.localeCompare(a.created));

    return { list };
  }, [raw]);

  return { ...query, derived };
}

// ─── Changeset detail ─────────────────────────────────────────────────────────

export interface ChangesetStats {
  additions: number;
  modifications: number;
  deletions: number;
}

interface ChangesetDetailPayload {
  id?: string;
  name?: string;
  status?: string;
  created?: string;
  modified?: string;
  baseSnapshot?: string;
  stats?: Partial<ChangesetStats>;
  changes?: ChangeRecord[];
  [key: string]: unknown;
}

export interface ChangesetDetail {
  id: string;
  name: string;
  status: string;
  created: string;
  modified: string;
  baseSnapshot: string;
  stats: ChangesetStats;
  /** Op-coded row view-models for the diff list (in API order). */
  rows: ChangeRow[];
  /** Total change count. */
  changesCount: number;
}

const EMPTY_STATS: ChangesetStats = { additions: 0, modifications: 0, deletions: 0 };

/**
 * useChangeset — detail hook over `GET /api/changesets/:id` (kept React Query
 * client, cached per id). Maps `stats` + `changes` into a render-ready detail
 * object. The query is disabled until `id` is non-null so entering the view
 * without a selection issues no request.
 */
export function useChangeset(id: string | null) {
  const query = useGetapichangesetschangesetId(id ?? '', {
    enabled: Boolean(id),
  });
  const raw = query.data as ChangesetDetailPayload | undefined;

  const detail = useMemo<ChangesetDetail | null>(() => {
    if (!raw) return null;
    return {
      id: raw.id ?? id ?? '',
      name: raw.name ?? raw.id ?? '',
      status: raw.status ?? 'unknown',
      created: raw.created ?? '',
      modified: raw.modified ?? '',
      baseSnapshot: raw.baseSnapshot ?? '',
      stats: {
        additions: raw.stats?.additions ?? 0,
        modifications: raw.stats?.modifications ?? 0,
        deletions: raw.stats?.deletions ?? 0,
      },
      rows: toChangeRows(raw.changes),
      changesCount: raw.changes?.length ?? 0,
    };
  }, [raw, id]);

  return { ...query, detail, emptyStats: EMPTY_STATS };
}

// ─── Commit / discard ─────────────────────────────────────────────────────────
// The mutations themselves are the generated `usePostapichangesetschangesetIdcommit`
// / `...discard` hooks, which refetch the changesets (and, for a commit, the model).

/** `commit` applies a staged changeset to the model; `discard` throws its changes away. */
export type ChangesetAction = 'commit' | 'discard';

/** `POST /api/changesets/:id/{commit,discard}` response. */
export interface ChangesetActionResult {
  id: string;
  name: string;
  status: string;
  /** Commit only: changes applied / skipped as already present / failed. */
  committed?: number;
  skipped?: number;
  failed?: number;
}

/**
 * Why a commit/discard was refused: the server's `{ error }` message (e.g. the
 * validation errors that blocked a commit), else the raw response, else the
 * error's own message (a network failure).
 */
export function changesetActionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.serverMessage ?? (error.body.trim() || error.message);
  return error instanceof Error ? error.message : String(error);
}

/**
 * Refetch the changesets when the `dr visualize` server announces a changeset
 * change. It broadcasts `{ type: 'changesets.updated', ids, active }` after
 * any write under `documentation-robotics/changesets/` — a changeset created,
 * activated or staged into from the CLI or by DrBot — and after a commit or
 * discard from the viewer. Without it the cached list would stay stale for its
 * 5-minute `staleTime`, so a changeset DrBot just made wouldn't show up for
 * review. A model change arrives through useLiveModelUpdates. Mount once
 * (AppShell).
 */
export function useLiveChangesetUpdates() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refetch = () => {
      queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
      queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId'] });
    };
    websocketClient.on(CHANGESETS_UPDATED_EVENT, refetch);
    return () => websocketClient.off(CHANGESETS_UPDATED_EVENT, refetch);
  }, [queryClient]);
}

/** The server's changeset-change broadcast (see the CLI's `broadcastChangesetsUpdated`). */
export const CHANGESETS_UPDATED_EVENT = 'changesets.updated';
