/**
 * localReviewStore — changeset review verdicts kept in this browser, for a dr
 * CLI that predates changeset review (no `review` in the changeset detail, or
 * `PUT /api/changesets/:id/review` answers 404/405).
 *
 * Verdicts are keyed by changeset id + sequence number and persist in
 * localStorage (`dr-viewer-local-review`). `unsupported` (not persisted)
 * records the changesets whose review PUT the server refused as unknown, so
 * the review falls back here for the rest of the session.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChangesetReview, DecisionInput, ReviewDecision } from '../data/changesetReview';

export const LOCAL_REVIEW_KEY = 'dr-viewer-local-review';

interface LocalReviewState {
  /** changeset id → sequence (as a string) → decision. */
  byChangeset: Record<string, Record<string, ReviewDecision>>;
  /** Changesets whose server refused the review endpoint this session. */
  unsupported: Record<string, true>;
  apply: (changesetId: string, decisions: DecisionInput[]) => void;
  /** Seed a changeset's local review (e.g. from a cached server review on fallback). */
  seed: (changesetId: string, review: ChangesetReview | undefined) => void;
  markUnsupported: (changesetId: string) => void;
  clear: (changesetId: string) => void;
}

export const useLocalReviewStore = create<LocalReviewState>()(
  persist(
    (set) => ({
      byChangeset: {},
      unsupported: {},
      apply: (changesetId, decisions) =>
        set((s) => {
          const current = { ...(s.byChangeset[changesetId] ?? {}) };
          const now = new Date().toISOString();
          for (const d of decisions) {
            const key = String(d.sequence);
            if (d.verdict === null) delete current[key];
            else current[key] = { verdict: d.verdict, ...(d.note ? { note: d.note } : {}), decidedAt: now };
          }
          return { byChangeset: { ...s.byChangeset, [changesetId]: current } };
        }),
      seed: (changesetId, review) =>
        set((s) =>
          s.byChangeset[changesetId] || !review
            ? s
            : { byChangeset: { ...s.byChangeset, [changesetId]: { ...review.decisions } } },
        ),
      markUnsupported: (changesetId) =>
        set((s) => ({ unsupported: { ...s.unsupported, [changesetId]: true } })),
      clear: (changesetId) =>
        set((s) => {
          const next = { ...s.byChangeset };
          delete next[changesetId];
          return { byChangeset: next };
        }),
    }),
    {
      name: LOCAL_REVIEW_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byChangeset: s.byChangeset }),
    },
  ),
);

/** The local review of one changeset, in the server's shape. */
export function localReview(
  byChangeset: LocalReviewState['byChangeset'],
  changesetId: string,
): ChangesetReview {
  return { decisions: byChangeset[changesetId] ?? {} };
}
