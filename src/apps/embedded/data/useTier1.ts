/**
 * useTier1 — Tier 1's state and this month's spend from the dr CLI's
 * `GET /api/tier1` (generated `useGetapitier1`), for the Tier 1 panel.
 *
 * Read-only: the endpoint never sends a request to a provider and never writes
 * a file, and it never carries a credential's value (only whether each one is
 * set and where from). Tier 1 is changed with `dr analyzer tier1 ...` alone.
 *
 * An older dr CLI has no such route: a 404 (or 405/501, or a body that isn't a
 * Tier1Status) reads as `unavailable`, and the panel stays hidden. Such a
 * failure isn't retried within the fetch (other failures — a refused token, a
 * 500 — are retried once, then read as `error` with the server's message).
 * The query is asked again whenever it's stale and wanted: the inbox
 * mounting, the server's `changesets.updated` broadcast (an extraction stages
 * a changeset as it spends; see useLiveChangesetUpdates) and the window
 * regaining focus. That is what picks up a server upgraded to one with the
 * route.
 */

import { useMemo } from 'react';
import { ApiError, useGetapitier1 } from '../../../core/services/generatedApiClient';
import { toTier1Status, type Tier1Status } from './tier1';
import { changesetActionErrorMessage } from './useChangesets';

export type Tier1View =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; status: Tier1Status };

/** The server has no `/api/tier1`: an older dr CLI, or something else answering. */
export function isTier1Unavailable(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 404 || error.status === 405 || error.status === 501;
  // A 200 whose body isn't JSON (an HTML fallback page).
  return error instanceof SyntaxError;
}

export function useTier1(): Tier1View {
  const query = useGetapitier1({
    retry: (failures: number, error: unknown) => !isTier1Unavailable(error) && failures < 1,
  });

  return useMemo<Tier1View>(() => {
    if (query.error) {
      return isTier1Unavailable(query.error)
        ? { kind: 'unavailable' }
        : { kind: 'error', message: changesetActionErrorMessage(query.error) };
    }
    if (query.data === undefined) return { kind: 'loading' };
    const status = toTier1Status(query.data);
    return status ? { kind: 'ready', status } : { kind: 'unavailable' };
  }, [query.data, query.error]);
}
