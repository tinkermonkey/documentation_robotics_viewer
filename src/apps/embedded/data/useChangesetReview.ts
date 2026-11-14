/**
 * useChangesetReview — a changeset's review model plus the way to record a
 * verdict, against whichever review store the dr CLI offers.
 *
 * - **server**: the detail carries `review` (CONTRACT §1). A verdict goes to
 *   `PUT /api/changesets/:id/review` (the generated client's
 *   `putapichangesetschangesetIdreview`), through a mutation of our own so its
 *   callbacks live at hook level: `onMutate` cancels in-flight detail fetches
 *   and writes the verdict optimistically into the cached detail (the row flips
 *   at once); `onError` puts back only `review` (never the whole snapshot, which
 *   would wipe a websocket refetch that landed meanwhile) and refetches. PUTs
 *   for one changeset share a mutation `scope`, so they run one at a time, in
 *   order. The detail is refetched once the last queued PUT settles.
 * - **local**: an older dr CLI (no `review`, or the PUT answers 404/405 without
 *   a `{ error }`). Verdicts live in localStorage (`localReviewStore`). Drop is
 *   not offered: that commit applies every change, so a drop couldn't be kept.
 *
 * `canDrop` says which. Canvas and inspector each call this; they share the
 * query cache (server) or the store (local), so they always agree.
 */

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, getApiClient } from '../../../core/services/generatedApiClient';
import { useLocalReviewStore, localReview } from '../stores/localReviewStore';
import { buildReviewModel, type ChangesetReview, type DecisionInput, type ReviewModel } from './changesetReview';
import { changesetActionErrorMessage, type ChangesetDetail } from './useChangesets';
import { useModel } from './useModel';
import { dottedId } from './modelGraph';

export type ReviewMode = 'server' | 'local';

/** The mutation key of a changeset's review PUTs (to count the queued ones). */
export function reviewMutationKey(changesetId: string) {
  return ['putapichangesetschangesetIdreview', changesetId];
}

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

/** Undo `decisions` in `current`, restoring each one's entry from `previous`. */
export function revertDecisions(
  current: ChangesetReview | undefined,
  previous: ChangesetReview | undefined,
  decisions: DecisionInput[],
): ChangesetReview {
  const next = { ...(current?.decisions ?? {}) };
  for (const d of decisions) {
    const key = String(d.sequence);
    const before = previous?.decisions[key];
    if (before) next[key] = before;
    else delete next[key];
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
  const unsupported = useLocalReviewStore((s) => Boolean(s.unsupported[id]));
  const localDecisions = useLocalReviewStore((s) => s.byChangeset);
  const applyLocal = useLocalReviewStore((s) => s.apply);
  const seedLocal = useLocalReviewStore((s) => s.seed);
  const markUnsupported = useLocalReviewStore((s) => s.markUnsupported);
  const blockersSeen = useLocalReviewStore((s) => s.blockersSeen[id]);
  const setBlockersSeen = useLocalReviewStore((s) => s.setBlockersSeen);
  const [error, setError] = useState<string | null>(null);
  const { derived: modelData } = useModel();

  const detailKey = useMemo(() => ['getapichangesetschangesetId', id], [id]);
  const mutationKey = useMemo(() => reviewMutationKey(id), [id]);
  const put = useMutation<ChangesetReview, unknown, DecisionInput[], { previousReview?: ChangesetReview }>({
    mutationKey,
    // One PUT at a time per changeset, in the order they were made.
    scope: { id: `changeset-review:${id}` },
    mutationFn: (decisions) =>
      getApiClient().putapichangesetschangesetIdreview(id, { decisions }) as Promise<ChangesetReview>,
    onMutate: async (decisions) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const current = queryClient.getQueryData<Record<string, unknown>>(detailKey);
      const previousReview = current?.review as ChangesetReview | undefined;
      if (current) {
        queryClient.setQueryData(detailKey, {
          ...current,
          review: mergeDecisions(previousReview, decisions, current.revision as number | undefined),
        });
      }
      return { previousReview };
    },
    onSuccess: (data) => {
      // A later queued PUT already wrote its own optimistic verdicts: keep them.
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      const current = queryClient.getQueryData<Record<string, unknown>>(detailKey);
      if (current && data && typeof data === 'object') queryClient.setQueryData(detailKey, { ...current, review: data });
    },
    onError: (err, decisions, context) => {
      const current = queryClient.getQueryData<Record<string, unknown>>(detailKey);
      // Put back only this PUT's verdicts: the rest of the cached detail (and
      // the verdicts of PUTs queued behind it) may be newer.
      if (current && context) {
        queryClient.setQueryData(detailKey, {
          ...current,
          review: revertDecisions(current.review as ChangesetReview | undefined, context.previousReview, decisions),
        });
      }
      if (isMissingRoute(err)) {
        // An older dr CLI: keep reviewing in this browser from here on.
        seedLocal(id, context?.previousReview);
        applyLocal(id, decisions);
        markUnsupported(id);
        return;
      }
      setError(changesetActionErrorMessage(err));
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      queryClient.invalidateQueries({ queryKey: detailKey });
      queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
    },
  });

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
            acknowledgedBlockers: blockersSeen,
          })
        : null,
    [detail, review, nameIndex, blockersSeen],
  );

  const decide = useCallback(
    (decisions: DecisionInput[]) => {
      if (!detail || decisions.length === 0) return;
      setError(null);
      // Remember which links each kept delete had, so new ones re-open it.
      for (const d of decisions) {
        const item = model?.bySeq.get(d.sequence);
        if (item?.kind !== 'delete') continue;
        setBlockersSeen(id, d.sequence, d.verdict === 'keep' ? item.blockers.map((b) => b.relationshipId) : null);
      }
      if (mode === 'local') {
        applyLocal(id, decisions);
        return;
      }
      put.mutate(decisions);
    },
    [detail, mode, id, put, applyLocal, model, setBlockersSeen],
  );

  return { model, mode, canDrop: mode === 'server', decide, pending: put.isPending, error };
}
