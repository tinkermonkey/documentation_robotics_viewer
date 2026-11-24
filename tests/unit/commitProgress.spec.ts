/**
 * commitProgress — the guard, merge and wording behind the commit progress bar
 * (#628): nothing unchecked from `changeset.commit.progress` reaches React.
 */
import { describe, expect, it } from 'vitest';
import {
  commitProgressAnnouncement,
  commitProgressLabel,
  commitProgressPercent,
  mergeCommitProgress,
  toCommitProgress,
  type CommitProgress,
} from '@/apps/embedded/data/commitProgress';

const frame = (fields: Record<string, unknown>) => ({ type: 'changeset.commit.progress', ...fields });
const p = (applied: number, total: number, extra: Partial<CommitProgress> = {}): CommitProgress => ({
  changesetId: 'cs',
  applied,
  total,
  ...extra,
});

describe('toCommitProgress', () => {
  it('reads a plain frame and a JSON-RPC notification alike', () => {
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 3, total: 10, phase: 'applying', layer: 'api' }))).toEqual(
      p(3, 10, { phase: 'applying', layer: 'api' }),
    );
    expect(
      toCommitProgress({ jsonrpc: '2.0', method: 'changeset.commit.progress', params: { changesetId: 'cs', applied: 0, total: 0 } }),
    ).toEqual(p(0, 0));
  });

  it('drops anything else and anything malformed', () => {
    expect(toCommitProgress(null)).toBeNull();
    expect(toCommitProgress('x')).toBeNull();
    expect(toCommitProgress({ type: 'changesets.updated', changesetId: 'cs', applied: 1, total: 2 })).toBeNull();
    expect(toCommitProgress({ method: 'chat.response.chunk', params: { changesetId: 'cs', applied: 1, total: 2 } })).toBeNull();
    expect(toCommitProgress(frame({ applied: 1, total: 2 }))).toBeNull();
    expect(toCommitProgress(frame({ changesetId: '  ', applied: 1, total: 2 }))).toBeNull();
    expect(toCommitProgress(frame({ changesetId: 7, applied: 1, total: 2 }))).toBeNull();
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: -1, total: 2 }))).toBeNull();
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 1.5, total: 2 }))).toBeNull();
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: '1', total: 2 }))).toBeNull();
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 1, total: Number.NaN }))).toBeNull();
  });

  it('clamps applied to total and keeps phase and layer only as text', () => {
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 12, total: 10 }))).toEqual(p(10, 10));
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 1, total: 2, phase: 3, layer: { x: 1 } }))).toEqual(p(1, 2));
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 1, total: 2, phase: ' compacting ' }))).toEqual(
      p(1, 2, { phase: 'compacting' }),
    );
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 1, total: 2, failed: true }))).toEqual(p(1, 2, { failed: true }));
    expect(toCommitProgress(frame({ changesetId: 'cs', applied: 1, total: 2, failed: 'yes' }))).toEqual(p(1, 2));
  });
});

describe('mergeCommitProgress', () => {
  it('ignores another changeset when following one', () => {
    const prev = p(3, 10);
    expect(mergeCommitProgress(prev, { ...p(9, 10), changesetId: 'other' }, 'cs')).toBe(prev);
    expect(mergeCommitProgress(null, { ...p(9, 10), changesetId: 'other' }, 'cs')).toBeNull();
  });

  it('never moves applied backwards within a phase, but follows a new phase or a new commit', () => {
    const prev = p(6, 10, { phase: 'applying' });
    expect(mergeCommitProgress(prev, p(4, 10, { phase: 'applying' }))).toBe(prev);
    expect(mergeCommitProgress(prev, p(7, 10, { phase: 'applying' }))).toEqual(p(7, 10, { phase: 'applying' }));
    expect(mergeCommitProgress(prev, p(0, 10, { phase: 'saving' }))).toEqual(p(0, 10, { phase: 'saving' }));
    expect(mergeCommitProgress(prev, { ...p(1, 4), changesetId: 'next' })).toEqual({ ...p(1, 4), changesetId: 'next' });
  });
});

describe('wording', () => {
  it('labels determinate and indeterminate progress with grouped counts', () => {
    expect(commitProgressLabel(p(340, 1200), 1200)).toBe('Applying 340 of 1,200 changes');
    expect(commitProgressLabel(p(340, 1200, { phase: 'saving' }), 1200)).toBe('Applying 340 of 1,200 changes · saving');
    expect(commitProgressLabel(null, 1200)).toBe('Applying 1,200 changes…');
    expect(commitProgressLabel(null, 1)).toBe('Applying 1 change…');
    expect(commitProgressLabel(p(0, 0), 5)).toBe('Applying 5 changes…');
    expect(commitProgressLabel(p(1200, 1200, { phase: 'done' }), 1200)).toBe('Applied 1,200 changes');
    expect(commitProgressLabel(p(3, 10, { phase: 'done', failed: true }), 10)).toBe('Applying 3 of 10 changes · done');
    expect(commitProgressPercent(p(1, 3))).toBe(33);
    expect(commitProgressPercent(null)).toBe(0);
  });

  it('announces the start, each phase and each quarter, not every frame', () => {
    const first = p(1, 100, { phase: 'applying' });
    expect(commitProgressAnnouncement(null, first)).toBe('Applying 1 of 100 changes · applying, 1%');
    expect(commitProgressAnnouncement(first, p(20, 100, { phase: 'applying' }))).toBeNull();
    expect(commitProgressAnnouncement(first, p(25, 100, { phase: 'applying' }))).toMatch(/25 of 100.*25%/);
    expect(commitProgressAnnouncement(p(25, 100, { phase: 'applying' }), p(49, 100, { phase: 'applying' }))).toBeNull();
    expect(commitProgressAnnouncement(p(25, 100, { phase: 'applying' }), p(26, 100, { phase: 'saving' }))).toMatch(/saving/);
    expect(commitProgressAnnouncement(p(99, 100), p(100, 100))).toMatch(/100%/);
    expect(commitProgressAnnouncement(p(99, 100), { ...p(1, 100), changesetId: 'other' })).not.toBeNull();
  });
});
