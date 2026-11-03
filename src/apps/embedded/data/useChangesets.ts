/**
 * useChangesets — thin wrapper over the kept React Query hook
 * `useGetapichangesets`.
 *
 * The `/api/changesets` payload is `{ version, changesets: { [id]: {...} } }`
 * (or an empty `{}` when a model has no changesets). Derives a stable, ordered
 * list of changeset summaries for the nav tree.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getApiClient,
  useGetapichangesets,
  useGetapichangesetschangesetId,
} from '../../../core/services/generatedApiClient';
import { toChangeRows, type ChangeRecord, type ChangeRow } from './changesets';

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
 * The server's message from a failed commit/discard. The generated client throws
 * `Error("POST <path> failed: <status> <body>")`, and the body is `{ error }`
 * (e.g. the validation errors that blocked a commit).
 */
export function changesetActionErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const match = /failed: \d+ ([\s\S]*)$/.exec(text);
  if (match) {
    try {
      const body = JSON.parse(match[1]) as { error?: unknown };
      if (typeof body.error === 'string' && body.error) return body.error;
    } catch {
      // Not JSON: fall through to the raw text.
    }
    if (match[1].trim()) return match[1].trim();
  }
  return text;
}

/**
 * Commit or discard a staged changeset (the user's review step for changes DrBot
 * staged under `dr visualize --with-changesets`, which never lets DrBot commit).
 * On success, refetches the changeset list + detail and, since a commit changes the
 * model, the model and layer queries. Uses `getApiClient()` directly because the
 * generated mutation hooks don't know which queries to invalidate.
 */
export function useChangesetAction(action: ChangesetAction) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changesetId: string): Promise<ChangesetActionResult> => {
      const client = getApiClient();
      return (
        action === 'commit'
          ? client.postapichangesetschangesetIdcommit(changesetId)
          : client.postapichangesetschangesetIddiscard(changesetId)
      ) as Promise<ChangesetActionResult>;
    },
    onSuccess: (_result, changesetId) => {
      queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
      queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId', changesetId] });
      if (action === 'commit') {
        queryClient.invalidateQueries({ queryKey: ['getapimodel'] });
        queryClient.invalidateQueries({ queryKey: ['getapilayerslayerName'] });
      }
    },
  });
}

/**
 * Refetch the changesets and the model when a DrBot reply finishes
 * (`isStreaming` goes true → false). DrBot stages its changes in a changeset
 * (`dr visualize --with-changesets`), and nothing else tells the viewer: the
 * cached list would otherwise stay stale for its 5-minute `staleTime`, so a
 * changeset DrBot just made wouldn't show up for review.
 */
export function useRefreshAfterChatReply(isStreaming: boolean) {
  const queryClient = useQueryClient();
  const wasStreaming = useRef(isStreaming);
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) {
      queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
      queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId'] });
      queryClient.invalidateQueries({ queryKey: ['getapimodel'] });
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming, queryClient]);
}
