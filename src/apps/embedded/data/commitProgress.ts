/**
 * commitProgress — how far a changeset commit in flight has got (#628).
 *
 * The dr CLI (documentation_robotics#1361) sends `changeset.commit.progress`
 * while `POST .../changesets/:id/commit` runs: `{ changesetId, applied, total,
 * phase?, layer? }`, throttled, plus the first and last. It is a plain `{type}`
 * frame stamped with `project` + `checkout`, like `changesets.updated`; a
 * JSON-RPC notification (`{ method, params }`) carrying the same fields is
 * read too, so either form the server settles on works. Progress is advisory:
 * the commit's HTTP response is still the outcome, and an older dr CLI sends
 * nothing (the bar is then indeterminate).
 *
 * The CLI's phases run `validating` → `applying` → `saving` → `reloading` →
 * `done`; a success ends with `done` and `applied == total`, a failure with
 * `failed: true` in the phase it stopped in. A separate `dr changeset commit`
 * process sends none.
 *
 * Nothing from the wire reaches React unchecked (as `tier1.ts` and
 * `changesetDrift.ts`): `toCommitProgress` keeps a frame only with a non-empty
 * string `changesetId` and non-negative integer `applied` / `total`, clamps
 * `applied` to `total`, keeps `phase` / `layer` only as non-empty strings
 * (an unknown phase is shown as the server words it) and `failed` only as
 * `true`.
 *
 * The hooks listen on the shared `websocketClient` for the route's checkout.
 * `useCommitProgress` follows one changeset (the summary card's own Apply);
 * `useOutsideCommitProgress` follows any commit in the checkout that this tab
 * didn't start (`markOwnCommit`), for the status bar.
 */

import { useEffect, useRef, useState } from 'react';
import { websocketClient } from '../services/websocketClient';
import { isForCheckout, useCheckoutRef } from './checkoutScope';

export const COMMIT_PROGRESS_EVENT = 'changeset.commit.progress';

/** How long the status bar keeps an outside commit's progress after its last frame. */
export const OUTSIDE_PROGRESS_STALE_MS = 5000;
/** How long it keeps one that finished (`phase: done`). */
export const OUTSIDE_PROGRESS_DONE_MS = 1500;

/** The phase a successful commit ends with. */
export const DONE_PHASE = 'done';

export interface CommitProgress {
  changesetId: string;
  /** Changes written so far, never more than `total`. */
  applied: number;
  /** The changes that will land (after drops, plus links deleted with their elements). */
  total: number;
  /** e.g. validating, applying, saving, reloading: as the server words it. */
  phase?: string;
  /** The layer being written, when the server says. */
  layer?: string;
  /** The commit failed in `phase` (the HTTP response still says why). */
  failed?: true;
}

function isCount(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

function text(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
}

/** The progress payload of a frame: the frame itself, or a JSON-RPC notification's params. */
function payloadOf(message: unknown): Record<string, unknown> | null {
  if (!message || typeof message !== 'object') return null;
  const m = message as Record<string, unknown>;
  if (m.type === COMMIT_PROGRESS_EVENT) return m;
  if (m.method === COMMIT_PROGRESS_EVENT && m.params && typeof m.params === 'object') {
    return m.params as Record<string, unknown>;
  }
  return null;
}

/** A validated `changeset.commit.progress`, or null for anything else or anything malformed. */
export function toCommitProgress(message: unknown): CommitProgress | null {
  const p = payloadOf(message);
  if (!p) return null;
  const changesetId = text(p.changesetId);
  if (!changesetId || !isCount(p.applied) || !isCount(p.total)) return null;
  const out: CommitProgress = { changesetId, applied: Math.min(p.applied, p.total), total: p.total };
  const phase = text(p.phase);
  if (phase) out.phase = phase;
  const layer = text(p.layer);
  if (layer) out.layer = layer;
  if (p.failed === true) out.failed = true;
  return out;
}

/**
 * The progress to show after `next` arrives. Frames may land out of order: a
 * late frame of the same phase never moves `applied` backwards. A frame for
 * another changeset leaves `prev` as it is.
 */
export function mergeCommitProgress(
  prev: CommitProgress | null,
  next: CommitProgress,
  changesetId?: string,
): CommitProgress | null {
  if (changesetId !== undefined && next.changesetId !== changesetId) return prev;
  if (!prev || prev.changesetId !== next.changesetId) return next;
  if (prev.phase === next.phase && prev.total === next.total && next.applied < prev.applied) return prev;
  return next;
}

/** "1,200": counts as the viewer writes them elsewhere. */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

function changes(n: number): string {
  return `${formatCount(n)} change${n === 1 ? '' : 's'}`;
}

/**
 * What the bar says. With progress: "Applying 340 of 1,200 changes · saving".
 * Without (before the first frame, or an older dr CLI): "Applying 1,200 changes…".
 */
export function commitProgressLabel(progress: CommitProgress | null, expected: number): string {
  if (!progress || progress.total === 0) return `Applying ${changes(expected)}…`;
  if (progress.phase === DONE_PHASE && !progress.failed) return `Applied ${changes(progress.total)}`;
  const base = `Applying ${formatCount(progress.applied)} of ${changes(progress.total)}`;
  return progress.phase ? `${base} · ${progress.phase}` : base;
}

/** The progress as a whole percent, 0 when nothing is known. */
export function commitProgressPercent(progress: CommitProgress | null): number {
  if (!progress || progress.total === 0) return 0;
  return Math.round((progress.applied / progress.total) * 100);
}

/** Which quarter the commit has reached: 0 (started) … 4 (all applied). */
function quarterOf(p: CommitProgress): number {
  return p.total === 0 ? 0 : Math.floor((p.applied / p.total) * 4);
}

/**
 * What the polite live region should say for `next`, or null to stay quiet.
 * It speaks at the first frame, when the phase changes and at each quarter of
 * the way, never on every frame (a large commit sends many).
 */
export function commitProgressAnnouncement(
  lastAnnounced: CommitProgress | null,
  next: CommitProgress,
): string | null {
  const speak =
    !lastAnnounced ||
    lastAnnounced.changesetId !== next.changesetId ||
    lastAnnounced.phase !== next.phase ||
    quarterOf(next) > quarterOf(lastAnnounced);
  if (!speak) return null;
  const pct = commitProgressPercent(next);
  return `${commitProgressLabel(next, next.total)}, ${pct}%`;
}

// ─── Commits this tab started ─────────────────────────────────────────────────

const ownCommits = new Set<string>();

/**
 * Note a commit this tab started (its summary card shows the progress), so the
 * status bar leaves it out. Returns the call that forgets it again.
 */
export function markOwnCommit(changesetId: string): () => void {
  ownCommits.add(changesetId);
  return () => {
    ownCommits.delete(changesetId);
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Calls `onProgress` with each validated progress frame for the route's checkout. */
function useProgressFrames(enabled: boolean, onProgress: (p: CommitProgress) => void) {
  const ref = useCheckoutRef();
  const handler = useRef(onProgress);
  handler.current = onProgress;
  useEffect(() => {
    if (!enabled || !ref) return;
    const listener = (message: unknown) => {
      const payload = payloadOf(message);
      if (!payload || !isForCheckout(payload, ref)) return;
      const progress = toCommitProgress(message);
      if (progress) handler.current(progress);
    };
    // A plain frame arrives under its type; a JSON-RPC notification has no
    // type and arrives only as 'message' (a plain frame comes there too, and
    // `payloadOf` lets only the notification through on that channel).
    const fromMessage = (message: unknown) => {
      if (message && typeof message === 'object' && (message as { type?: unknown }).type) return;
      listener(message);
    };
    websocketClient.on(COMMIT_PROGRESS_EVENT, listener);
    websocketClient.on('message', fromMessage);
    return () => {
      websocketClient.off(COMMIT_PROGRESS_EVENT, listener);
      websocketClient.off('message', fromMessage);
    };
  }, [enabled, ref]);
}

/**
 * One changeset's commit progress while `listening` (Apply pressed, the
 * response not in yet). Starting to listen clears what an earlier commit left;
 * stopping keeps the last progress, so a refusal can show where it stopped.
 * Null until the server reports (always, on an older dr CLI).
 */
export function useCommitProgress(changesetId: string, listening: boolean): CommitProgress | null {
  const [progress, setProgress] = useState<CommitProgress | null>(null);
  useEffect(() => {
    if (listening) setProgress(null);
  }, [listening, changesetId]);
  useProgressFrames(listening, (next) => setProgress((prev) => mergeCommitProgress(prev, next, changesetId)));
  return progress;
}

/**
 * The latest progress of a commit this tab didn't start (the CLI, MCP or
 * DrBot), for the status bar; null once no frame has come for
 * `OUTSIDE_PROGRESS_STALE_MS` (`OUTSIDE_PROGRESS_DONE_MS` after `done`). A
 * failed one stays, marked `failed`, until then.
 */
export function useOutsideCommitProgress(): CommitProgress | null {
  const [progress, setProgress] = useState<CommitProgress | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useProgressFrames(true, (next) => {
    if (ownCommits.has(next.changesetId)) return;
    setProgress((prev) => mergeCommitProgress(prev, next));
    clearTimeout(timer.current);
    const finished = next.phase === DONE_PHASE && !next.failed;
    timer.current = setTimeout(() => setProgress(null), finished ? OUTSIDE_PROGRESS_DONE_MS : OUTSIDE_PROGRESS_STALE_MS);
  });
  return progress;
}
