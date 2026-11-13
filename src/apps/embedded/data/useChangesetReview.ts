/**
 * useChangesetReview — a changeset's review model plus the way to record a
 * verdict, against whichever review store the dr CLI offers.
 *
 * - **server**: the detail carries `review` (CONTRACT §1). A verdict goes to
 *   `PUT /api/changesets/:id/review` (generated `usePutapichangesetschangesetIdreview`),
 *   written optimistically into the cached detail so the row flips at once; the
 *   server's `review` replaces it on success, and a refusal rolls it back.
 * - **local**: an older dr CLI (no `review`, or the PUT answers 404/405 without
 *   a `{ error }`). Verdicts live in localStorage (`localReviewStore`). Drop is
 *   not offered: that commit applies every change, so a drop couldn't be kept.
 *
 * `canDrop` says which. Canvas and inspector each call this; they share the
 * query cache (server) or the store (local), so they always agree.
 */

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  usePutapichangesetschangesetIdreview,
} from '../../../core/services/generatedApiClient';
import { useLocalReviewStore, localReview } from '../stores/localReviewStore';
import { buildReviewModel, type ChangesetReview, type DecisionInput, type ReviewModel } from './changesetReview';
import { changesetActionErrorMessage, type ChangesetDetail } from './useChangesets';
import { useModel } from './useModel';
import { dottedId } from './modelGraph';

export type ReviewMode = 'server' | 'local';

type MutateCallbacks = { onSuccess?: (data: unknown) => void; onError?: (error: unknown) => void };

/**
 * The generated mutation hooks are typed without variables (`void`); the ones
 * whose operation has a request body take it as the mutation variable.
 */
export function mutateWithBody(mutate: unknown): (body: unknown, callbacks?: MutateCallbacks) => void {
  return mutate as (body: unknown, callbacks?: MutateCallbacks) => void;
}

/** A 404/405 with no `{ error }`: the route doesn't exist on this server. */
export function isMissingRoute(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 405) && !error.serverMessage;
}

/** Merge decisions into a review the way the server does (null clears). */
export function mergeDecisions(
  review: ChangesetReview | undefined,
  decisions: DecisionInput[],
  revision: number | undefined,
): ChangesetReview {
  const next = { ...(review?.decisions ?? {}) };
  const now = new Date().toISOString();
  for (const d of decisions) {
    const key = String(d.sequence);
    if (d.verdict === null) delete next[key];
    else {
      next[key] = {
        verdict: d.verdict,
        ...(d.note ? { note: d.note } : {}),
        ...(revision !== undefined ? { atRevision: revision } : {}),
        decidedAt: now,
      };
    }
  }
  const revs = Object.values(next)
    .map((d) => d.atRevision)
    .filter((r): r is number => r !== undefined);
  return { decisions: next, ...(revs.length ? { lastReviewedRevision: Math.max(...revs) } : {}) };
}

export interface ChangesetReviewState {
  model: ReviewModel | null;
  mode: ReviewMode;
  canDrop: boolean;
  /** Record verdicts (null clears). */
  decide: (decisions: DecisionInput[]) => void;
  pending: boolean;
  /** The last refusal, until the next decision. */
  error: string | null;
}

export function useChangesetReview(detail: ChangesetDetail | null): ChangesetReviewState {
  const id = detail?.id ?? '';
  const queryClient = useQueryClient();
  const put = usePutapichangesetschangesetIdreview(id);
  const unsupported = useLocalReviewStore((s) => Boolean(s.unsupported[id]));
  const localDecisions = useLocalReviewStore((s) => s.byChangeset);
  const applyLocal = useLocalReviewStore((s) => s.apply);
  const seedLocal = useLocalReviewStore((s) => s.seed);
  const markUnsupported = useLocalReviewStore((s) => s.markUnsupported);
  const [error, setError] = useState<string | null>(null);
  const { derived: modelData } = useModel();

  const mode: ReviewMode = detail?.review !== undefined && !unsupported ? 'server' : 'local';
  const serverReview = detail?.review;
  const review = useMemo(
    () => (mode === 'server' ? serverReview : localReview(localDecisions, id)),
    [mode, serverReview, localDecisions, id],
  );

  const nameIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of modelData.nodes) m.set(dottedId(n), n.name);
    return m;
  }, [modelData.nodes]);

  const model = useMemo(
    () =>
      detail
        ? buildReviewModel({
            changes: detail.changes,
            unstaged: detail.unstaged,
            review,
            nameOf: (dotted) => nameIndex.get(dotted),
          })
        : null,
    [detail, review, nameIndex],
  );

  const decide = useCallback(
    (decisions: DecisionInput[]) => {
      if (!detail || decisions.length === 0) return;
      setError(null);
      if (mode === 'local') {
        applyLocal(id, decisions);
        return;
      }
      const key = ['getapichangesetschangesetId', id];
      const previous = queryClient.getQueryData<Record<string, unknown>>(key);
      if (previous) {
        queryClient.setQueryData(key, {
          ...previous,
          review: mergeDecisions(previous.review as ChangesetReview | undefined, decisions, detail.revision),
        });
      }
      mutateWithBody(put.mutate)(
        { decisions },
        {
          onSuccess: (data: unknown) => {
            const current = queryClient.getQueryData<Record<string, unknown>>(key);
            if (current && data && typeof data === 'object') queryClient.setQueryData(key, { ...current, review: data });
          },
          onError: (err: unknown) => {
            if (isMissingRoute(err)) {
              // An older dr CLI: keep reviewing in this browser from here on.
              seedLocal(id, previous?.review as ChangesetReview | undefined);
              applyLocal(id, decisions);
              markUnsupported(id);
              if (previous) queryClient.setQueryData(key, previous);
              return;
            }
            if (previous) queryClient.setQueryData(key, previous);
            setError(changesetActionErrorMessage(err));
          },
        },
      );
    },
    [detail, mode, id, queryClient, put, applyLocal, seedLocal, markUnsupported],
  );

  return { model, mode, canDrop: mode === 'server', decide, pending: put.isPending, error };
}
