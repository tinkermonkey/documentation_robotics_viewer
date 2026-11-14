/**
 * tier1.spec.ts — the pure helpers behind the origin badges / filter and the
 * Tier 1 panel (data/tier1.ts).
 */

import { describe, expect, it } from 'vitest';

import {
  NO_ORIGIN,
  formatBytes,
  formatProbability,
  formatResetDate,
  formatUsd,
  originDetails,
  originFilterOptions,
  originLabel,
  originOf,
  originSummary,
  passesOriginFilter,
  sourceBreakdown,
  spendColor,
  spendPercent,
  splitCode,
  toTier1Status,
} from '@/apps/embedded/data/tier1';
import type { ChangeRecord } from '@/apps/embedded/data/changesets';
import tier1 from '../fixtures/tier1.json';

const TIER1 = {
  by: 'tier1',
  rule: 'tier1:dr-qset-2',
  provider: 'cloudflare-workers-ai',
  model: '@cf/cloudflare/clef',
  upstream: 'workers-ai',
  p: { layer: 0.923, type: 0.81 },
  confirmed: 'agent',
};

const rec = (origin?: unknown): ChangeRecord => ({ type: 'add', elementId: 'x', ...(origin ? { origin } : {}) });

describe('originOf', () => {
  it('reads a well-formed origin and ignores a missing or malformed one', () => {
    expect(originOf(rec(TIER1))?.by).toBe('tier1');
    expect(originOf(rec())).toBeUndefined();
    expect(originOf(undefined)).toBeUndefined();
    expect(originOf(rec('tier1'))).toBeUndefined();
    expect(originOf(rec({ rule: 'x' }))).toBeUndefined();
    expect(originOf(rec({ by: '' }))).toBeUndefined();
  });

  it('keeps an origin from a newer CLI under its own name', () => {
    expect(originOf(rec({ by: 'tier2' }))?.by).toBe('tier2');
    expect(originLabel('tier2')).toBe('tier2');
  });
});

describe('originDetails', () => {
  it('lists rule, provider, model, upstream, probabilities and confirmation in order', () => {
    expect(originDetails(TIER1 as never)).toEqual([
      { key: 'Rule', value: 'tier1:dr-qset-2' },
      { key: 'Provider', value: 'cloudflare-workers-ai' },
      { key: 'Model', value: '@cf/cloudflare/clef' },
      { key: 'Upstream', value: 'workers-ai' },
      { key: 'Layer', value: '92%' },
      { key: 'Type', value: '81%' },
      { key: 'Confirmed', value: 'by the agent (acceptTier1)' },
    ]);
  });

  it('says the type was not asked when its probability is null', () => {
    const rows = originDetails({ by: 'tier1', p: { layer: 0.5, type: null }, confirmed: 'auto' });
    expect(rows).toContainEqual({ key: 'Type', value: 'not asked' });
    expect(rows).toContainEqual({ key: 'Confirmed', value: 'automatically (stage mode)' });
  });

  it('shows only what a Tier 0 origin carries', () => {
    expect(originDetails({ by: 'tier0', rule: 'node-mapping:Route' })).toEqual([{ key: 'Rule', value: 'node-mapping:Route' }]);
    expect(originDetails({ by: 'agent' })).toEqual([]);
    expect(originSummary({ by: 'tier0', rule: 'edge:CALLS' })).toBe('Decided by a Tier 0 rule · rule edge:CALLS');
  });

  it('formats probabilities as whole percentages', () => {
    expect(formatProbability(1)).toBe('100%');
    expect(formatProbability(0.005)).toBe('<1%');
    expect(formatProbability(0)).toBe('0%');
    expect(formatProbability(Number.NaN)).toBe('—');
  });
});

describe('origin filter', () => {
  const records = [
    rec({ by: 'tier1' }),
    rec({ by: 'tier0' }),
    rec({ by: 'tier0' }),
    rec({ by: 'agent' }),
    rec(),
    rec({ by: 'tier2' }),
  ];

  it('offers All, the deciders in a fixed order, then No origin, with counts', () => {
    expect(originFilterOptions(records)).toEqual([
      { value: 'all', label: 'All', count: 6 },
      { value: 'tier0', label: 'Tier 0', count: 2 },
      { value: 'tier1', label: 'Tier 1', count: 1 },
      { value: 'agent', label: 'Agent', count: 1 },
      { value: 'tier2', label: 'tier2', count: 1 },
      { value: NO_ORIGIN, label: 'No origin', count: 1 },
    ]);
  });

  it('offers nothing when no change carries an origin', () => {
    expect(originFilterOptions([rec(), rec()])).toEqual([]);
  });

  it('matches by decider, or the changes without one', () => {
    expect(records.filter((r) => passesOriginFilter(r, 'tier0'))).toHaveLength(2);
    expect(records.filter((r) => passesOriginFilter(r, NO_ORIGIN))).toHaveLength(1);
    expect(records.filter((r) => passesOriginFilter(r, 'all'))).toHaveLength(6);
  });
});

describe('toTier1Status', () => {
  it('accepts every documented state', () => {
    for (const body of Object.values(tier1)) expect(toTier1Status(body)?.state).toBe(body.state);
  });

  it('rejects a body that is not a Tier 1 status', () => {
    expect(toTier1Status(null)).toBeNull();
    expect(toTier1Status('<html>')).toBeNull();
    expect(toTier1Status({ state: 'sleeping', month: tier1.on.month })).toBeNull();
    expect(toTier1Status({ state: 'on' })).toBeNull();
  });

  it('fills the collections a partial body leaves out', () => {
    const s = toTier1Status({ state: 'on', month: { spentUsd: 1, capUsd: 20 } })!;
    expect(s.credentials).toEqual({});
    expect(s.bySource).toEqual({});
    expect(s.warnings).toEqual([]);
    expect(s.nearCap).toBe(false);
  });
});

describe('spend', () => {
  it('works out the share of the cap', () => {
    expect(spendPercent({ spentUsd: 16.42, capUsd: 20 })).toBeCloseTo(82.1);
    expect(spendPercent({ spentUsd: 25, capUsd: 20 })).toBe(100);
    expect(spendPercent({ spentUsd: 0, capUsd: 0 })).toBe(0);
    expect(spendPercent({ spentUsd: 0.01, capUsd: 0 })).toBe(100);
  });

  it('colours the bar by state', () => {
    expect(spendColor(tier1.on as never)).toBe('emerald');
    expect(spendColor(tier1.onNearCap as never)).toBe('amber');
    expect(spendColor(tier1.capped as never)).toBe('rose');
  });

  it('formats dollars, the reset date (UTC) and bytes', () => {
    expect(formatUsd(3.5)).toBe('$3.50');
    expect(formatResetDate('2026-12-01T00:00:00.000Z')).toMatch(/Dec/);
    expect(formatResetDate('2026-12-01T00:00:00.000Z')).toMatch(/\b1\b/);
    expect(formatResetDate('not a date')).toBe('not a date');
    expect(formatBytes(6815230)).toBe('6.5 MB');
    expect(formatBytes(512)).toBe('512 B');
  });

  it('orders the sources extract, index, classify, probe', () => {
    expect(sourceBreakdown(tier1.onNearCap.bySource).map((s) => s.source)).toEqual(['extract', 'classify', 'probe']);
  });
});

describe('splitCode', () => {
  it('splits backtick spans into code', () => {
    expect(splitCode('Enable it with `dr analyzer tier1 enable`.')).toEqual([
      { code: false, text: 'Enable it with ' },
      { code: true, text: 'dr analyzer tier1 enable' },
      { code: false, text: '.' },
    ]);
  });

  it('leaves an unpaired backtick as text', () => {
    expect(splitCode('a ` b')).toEqual([{ code: false, text: 'a ` b' }]);
  });
});
