/**
 * changesetPurpose.spec.ts — the purpose and allowed moves the dr CLI reports
 * per changeset, read safely, and the inbox sorted by them.
 */

import { describe, expect, it } from 'vitest';
import {
  canDo,
  inboxGroups,
  purposeFields,
  purposeLabel,
  purposeLifecycle,
  recordsOf,
  scopeLabel,
  toActions,
  toPurpose,
  toScope,
} from '@/apps/embedded/data/changesetPurpose';

describe('changesetPurpose', () => {
  it('reads a known purpose and ignores an unknown one', () => {
    expect(toPurpose('plan')).toBe('plan');
    expect(toPurpose('verification')).toBe('verification');
    expect(toPurpose('migration')).toBeUndefined();
    expect(toPurpose(undefined)).toBeUndefined();
    expect(toPurpose(3)).toBeUndefined();
    expect(purposeFields({ purpose: 'nonsense', verifies: '', actions: 'commit' })).toEqual({});
    expect(purposeFields({ purpose: 'verification', verifies: 'cs-plan', actions: ['discard'] })).toEqual({
      purpose: 'verification',
      verifies: 'cs-plan',
      actions: ['discard'],
    });
    expect(toScope({ since: 'origin/main', codeCommit: 'abcdef1234' })).toEqual({
      since: 'origin/main',
      codeCommit: 'abcdef1234',
    });
    expect(toScope({ codeCommit: 'abc' })).toBeUndefined();
    expect(scopeLabel(toScope({ since: 'origin/main', codeCommit: 'abcdef1234' }))).toBe(
      'changes since origin/main, at abcdef1',
    );
    expect(purposeLifecycle('verification', 'add-export')).toMatch(/compared with plan "add-export".*isn't applied/);
    expect(purposeLifecycle(undefined)).toBeUndefined();
  });

  it('reads an upgrade record: never applied, reviewed, restored from by hand, discarded', () => {
    expect(toPurpose('upgrade-record')).toBe('upgrade-record');
    expect(purposeLabel('upgrade-record')).toBe('upgrade record');
    expect(purposeLifecycle('upgrade-record')).toMatch(/spec upgrade dropped.*isn't applied.*restore.*discard/);
    expect(canDo({ status: 'staged', actions: ['discard'] }, 'commit')).toBe(false);
  });

  it('keeps known actions, drops unknown ones, and reads no array as an older dr CLI', () => {
    expect(toActions(['commit', 'discard'])).toEqual(['commit', 'discard']);
    expect(toActions(['discard', 'archive'])).toEqual(['discard']);
    expect(toActions([])).toEqual([]);
    expect(toActions(undefined)).toBeUndefined();
    expect(toActions('commit')).toBeUndefined();
  });

  it("offers Apply and Discard from the server's actions, or from a staged status on an older dr CLI", () => {
    const record = { status: 'staged', actions: toActions(['discard']) };
    expect(canDo(record, 'commit')).toBe(false);
    expect(canDo(record, 'discard')).toBe(true);
    expect(canDo({ status: 'staged', actions: [] }, 'discard')).toBe(false);
    // An older dr CLI: no actions, so a staged changeset offers both, a settled one neither.
    expect(canDo({ status: 'staged' }, 'commit')).toBe(true);
    expect(canDo({ status: 'staged' }, 'discard')).toBe(true);
    expect(canDo({ status: 'committed' }, 'commit')).toBe(false);
  });

  it('sorts the inbox by purpose and pairs each verification record with its plan', () => {
    const list = [
      { id: 'plan', name: 'add-export', status: 'staged', purpose: 'plan' as const },
      { id: 'rec', name: 'add-export-as-built', status: 'staged', purpose: 'verification' as const, verifies: 'plan' },
      { id: 'orphan', name: 'old-as-built', status: 'staged', purpose: 'verification' as const, verifies: 'gone' },
      { id: 'boot', name: 'extract-abc', status: 'staged', purpose: 'bootstrap' as const },
      { id: 'rec2', name: 'reconcile-1', status: 'staged', purpose: 'reconcile' as const },
      { id: 'chat', name: 'from-chat', status: 'staged', purpose: 'chat' as const },
      { id: 'upg', name: 'upgrade-0.13.0-drops', status: 'staged', purpose: 'upgrade-record' as const },
      { id: 'old', name: 'no-purpose', status: 'staged' },
      { id: 'done', name: 'landed', status: 'committed', purpose: 'plan' as const },
    ];
    const g = inboxGroups(list);
    expect(g.review.map((c) => c.id)).toEqual(['plan', 'chat', 'old']);
    expect(g.land.map((c) => c.id)).toEqual(['boot', 'rec2']);
    expect(g.records.map((r) => [r.record.id, r.plan?.id])).toEqual([
      ['rec', 'plan'],
      ['orphan', undefined],
    ]);
    expect(g.upgrades.map((c) => c.id)).toEqual(['upg']);
    expect(g.history.map((c) => c.id)).toEqual(['done']);
    expect(recordsOf('plan', list).map((c) => c.id)).toEqual(['rec']);
  });
});
