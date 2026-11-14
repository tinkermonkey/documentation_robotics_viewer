/**
 * useChangesets — thin wrapper over the kept React Query hook
 * `useGetapichangesets`.
 *
 * The `/api/changesets` payload is `{ version, changesets: { [id]: {...} } }`
 * (or an empty `{}` when a model has no changesets). Derives a stable, ordered
 * list of changeset summaries for the nav tree.
 */

import { useEffect, useMemo } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  getApiClient,
  useGetapichangesets,
  useGetapichangesetschangesetId,
} from '../../../core/services/generatedApiClient';
import { toChangeRows, type ChangeRecord, type ChangeRow } from './changesets';
import {
  reviewCounts,
  type ChangesetOrigin,
  type ChangesetReview,
  type ReviewCounts,
  type UnstagedChange,
} from './changesetReview';
import { websocketClient } from '../services/websocketClient';

/** Review progress the list reports per changeset (a dr CLI with changeset review). */
export interface ChangesetReviewProgress {
  decided: number;
  total: number;
  asked: number;
}

export interface ChangesetSummary {
  id: string;
  name: string;
  status: string;
  created: string;
  changesCount: number;
  description?: string;
  origin?: ChangesetOrigin;
  revision?: number;
  /** Absent from a dr CLI without changeset review. */
  review?: ChangesetReviewProgress;
}

interface ChangesetEntry {
  name?: string;
  status?: string;
  created?: string;
  changes_count?: number;
  description?: string;
  origin?: ChangesetOrigin;
  revision?: number;
  review?: ChangesetReviewProgress;
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
      description: entry.description,
      origin: entry.origin,
      revision: entry.revision,
      review: entry.review,
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
  description?: string;
  revision?: number;
  origin?: ChangesetOrigin;
  unstaged?: UnstagedChange[];
  review?: ChangesetReview;
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
  /** The raw change records (sequence order as served). */
  changes: ChangeRecord[];
  description?: string;
  /** The changeset's nextSequenceNumber; raised when DrBot restages. */
  revision?: number;
  origin?: ChangesetOrigin;
  /** Tombstones of unstaged / rewritten changes. */
  unstaged: UnstagedChange[];
  /**
   * The server-kept review. Undefined when the dr CLI predates changeset
   * review: verdicts then live in this browser (see useChangesetReview).
   */
  review?: ChangesetReview;
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
      changes: raw.changes ?? [],
      description: raw.description,
      revision: raw.revision,
      origin: raw.origin,
      unstaged: raw.unstaged ?? [],
      review: raw.review,
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
  /** Every sequence number left out, cascades included (a dr CLI with review). */
  dropped?: number[];
  /** Blocking links deleted with their elements. */
  linksDeleted?: number;
}

/**
 * A 422 commit refusal for deletes still in use: `{ error, blockers }`, keyed
 * by the delete's sequence number. Null for any other error.
 */
export function commitBlockers(error: unknown): Record<string, unknown[]> | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  try {
    const parsed = JSON.parse(error.body) as { blockers?: unknown };
    const b = parsed.blockers;
    return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown[]>) : null;
  } catch {
    return null;
  }
}

/** A 409 commit refusal whose message says the model drifted since staging. */
export function isDriftError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false;
  return /drift|changed since/i.test(error.serverMessage ?? error.body);
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
 * What to show when a changeset's detail can't be loaded, instead of a
 * "loading" message that never resolves. A refused token (401/403) usually
 * means this tab holds an older server's token: reloading picks up the stored
 * one.
 */
export function changesetLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "couldn't load the changeset: the server refused this tab's access token. Reload the page, or open the viewer again from its link.";
    }
    if (error.status === 404) return "couldn't load the changeset: the server has no changeset with this id.";
  }
  return `couldn't load the changeset: ${changesetActionErrorMessage(error)}`;
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

/**
 * Review counts for staged changesets whose list entry has none (a dr CLI
 * without review), worked out from each one's detail and the verdicts kept in
 * this browser, by the same definition the CLI uses (`reviewCounts`). The
 * details share the detail hook's cache. Keyed by changeset id; missing while
 * a detail loads.
 */
export function useLocalReviewCounts(
  changesetIds: string[],
  localDecisions: Record<string, ChangesetReview['decisions']>,
): Record<string, ReviewCounts> {
  const results = useQueries({
    queries: changesetIds.map((id) => ({
      queryKey: ['getapichangesetschangesetId', id],
      queryFn: () => getApiClient().getapichangesetschangesetId(id),
    })),
  });
  // A few staged changesets at most: cheap enough to work out per render.
  const out: Record<string, ReviewCounts> = {};
  changesetIds.forEach((id, i) => {
    const detail = results[i]?.data as ChangesetDetailPayload | undefined;
    if (!detail) return;
    out[id] = reviewCounts({
      changes: detail.changes ?? [],
      unstaged: detail.unstaged ?? [],
      review: { decisions: localDecisions[id] ?? {} },
    });
  });
  return out;
}
