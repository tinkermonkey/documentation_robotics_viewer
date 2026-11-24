/**
 * The browser history policy for graph moves (#619): whether a change of
 * "where you are" PUSHES a new history entry, REPLACES the current one, or
 * COALESCES into it (a replace that keeps the entry the step it was).
 *
 * Pure. The router calls it from its store → URL effect with what changed
 * since the URL was last written:
 *
 * - **destination**: a view, mode, layer, tab, changeset or deliberate
 *   navigation (`uiStore.navSeq`) change. Always a push.
 * - **move** (`uiStore.graphMove`, when its `seq` is new): what the user did
 *   in a graph. `select` (node, edge, lane, C4 box, reviewed change),
 *   `focus` (Impact focus) and `expand` (a lane or group opened) push;
 *   `dwell` (the viewport settled after a pan or zoom) and `fit` (a mount,
 *   resize, toolbar or fullscreen fit) replace; `recentre` (centerOnSelect)
 *   coalesces with the selection it centres on, else pushes.
 * - no move and no destination: a store change nobody chose here (a stale
 *   selection dropped, a restore). Replace.
 *
 * Rapid repeats coalesce: the same move on the same target within
 * `COALESCE_MS` of the push it repeats (a double-click) is one step.
 */

export type GraphMoveKind = 'select' | 'focus' | 'expand' | 'recentre' | 'dwell' | 'fit';

export interface GraphMove {
  /** Bumped by every move, so the router can tell a new move from one it has seen. */
  seq: number;
  kind: GraphMoveKind;
  /** What the move is about: the node, edge, box, change or group (null: a clear). */
  target: string | null;
  /** `Date.now()` when it was made. */
  at: number;
}

/** The last push the router made, to coalesce a repeat of it. */
export interface LastPush {
  kind: GraphMoveKind | 'destination';
  target: string | null;
  at: number;
}

export type HistoryStep = 'push' | 'replace' | 'coalesce';

/** A second click this soon after the push it repeats is the same step (a double-click). */
export const COALESCE_MS = 500;

/** Moves that are a step of their own. */
const STEP_MOVES: ReadonlySet<GraphMoveKind> = new Set(['select', 'focus', 'expand']);

export interface HistoryStepInput {
  destination: boolean;
  /** The graph move behind this change, or null when no new move was recorded. */
  move: GraphMove | null;
  /** What the current entry has selected (its node, edge, box or focus), if anything. */
  entrySelection: string | null;
  lastPush: LastPush | null;
}

export function decideHistoryStep({ destination, move, entrySelection, lastPush }: HistoryStepInput): HistoryStep {
  if (destination) return 'push';
  if (!move) return 'replace';
  if (move.kind === 'dwell' || move.kind === 'fit') return 'replace';
  const repeatsLastPush =
    !!lastPush &&
    lastPush.target === move.target &&
    (lastPush.kind === move.kind || (move.kind === 'recentre' && lastPush.kind !== 'recentre')) &&
    move.at - lastPush.at >= 0 &&
    move.at - lastPush.at <= COALESCE_MS;
  if (move.kind === 'recentre') {
    // centerOnSelect pans to the node just selected: that is the selection's step.
    return move.target !== null && (move.target === entrySelection || repeatsLastPush) ? 'coalesce' : 'push';
  }
  if (STEP_MOVES.has(move.kind)) return repeatsLastPush ? 'coalesce' : 'push';
  return 'replace';
}
