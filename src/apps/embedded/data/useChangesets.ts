/**
 * useChangesets — thin wrapper over the kept React Query hook
 * `useGetapichangesets`.
 *
 * The `/api/changesets` payload is `{ version, changesets: { [id]: {...} } }`
 * (or an empty `{}` when a model has no changesets). Derives a stable, ordered
 * list of changeset summaries for the nav tree.
 */

import { useMemo } from 'react';
import {
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
