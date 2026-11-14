/**
 * tier1.spec.ts — the pure helpers behind the origin badges / filter and the
 * Tier 1 panel (data/tier1.ts), and the hook's "older server" test.
 */

import { describe, expect, it } from 'vitest';

import {
  ALL_ORIGINS,
  NO_ORIGIN,
  deciderKey,
  deciderLabel,
  formatBytes,
  formatCount,
  formatPercent,
  formatProbability,
  formatResetDate,
  formatUsd,
  nearCapWarningText,
  originDetails,
  originFilterOptions,
  originOf,
  originSummary,
  passesOriginFilter,
  percentUsed,
  sourceBreakdown,
  spendColor,
  splitCode,
  toTier1Status,
} from '@/apps/embedded/data/tier1';
import { isTier1Unavailable } from '@/apps/embedded/data/useTier1';
import { ApiError } from '@/core/services/generatedApiClient';
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
    expect(originOf(rec(TIER1))).toEqual(TIER1);
    expect(originOf(rec())).toBeUndefined();
    expect(originOf(undefined)).toBeUndefined();
    expect(originOf(rec('tier1'))).toBeUndefined();
    expect(originOf(rec({ rule: 'x' }))).toBeUndefined();
    expect(originOf(rec({ by: '' }))).toBeUndefined();
    expect(originOf(rec({ by: { x: 1 } }))).toBeUndefined();
  });

  it('drops every field that is not of its documented type', () => {
    const o = originOf(
      rec({
        by: 'tier1',
        rule: { x: 1 },
        provider: 42,
        model: ['clef'],
        upstream: null,
        confirmed: 'maybe',
        p: { layer: 'high', type: 0.5 },
        extra: { y: 2 },
      }),
    );
    expect(o).toEqual({ by: 'tier1' });
  });

  it('keeps a numeric layer probability with a null or bad type probability as not asked', () => {
    expect(originOf(rec({ by: 'tier1', p: { layer: 0.9, type: null } }))?.p).toEqual({ layer: 0.9, type: null });
    expect(originOf(rec({ by: 'tier1', p: { layer: 0.9, type: 'x' } }))?.p).toEqual({ layer: 0.9, type: null });
    expect(originOf(rec({ by: 'tier1', p: { layer: Number.NaN, type: 0.5 } }))?.p).toBeUndefined();
  });

  it('keeps an origin from a newer CLI under its own name', () => {
    expect(originOf(rec({ by: 'tier2' }))?.by).toBe('tier2');
    expect(deciderLabel('tier2')).toBe('tier2');
  });
});

describe('originDetails', () => {
  it('lists rule, provider, model, upstream, probabilities and confirmation in order', () => {
    expect(originDetails(originOf(rec(TIER1))!)).toEqual([
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

  it('formats probabilities as whole percentages, clamped to 0–100%', () => {
    expect(formatProbability(1)).toBe('100%');
    expect(formatProbability(0.005)).toBe('<1%');
    expect(formatProbability(0)).toBe('0%');
    expect(formatProbability(1.7)).toBe('100%');
    expect(formatProbability(-0.2)).toBe('0%');
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
      { value: ALL_ORIGINS, label: 'All', count: 6 },
      { value: 'by:tier0', label: 'Tier 0', count: 2 },
      { value: 'by:tier1', label: 'Tier 1', count: 1 },
      { value: 'by:agent', label: 'Agent', count: 1 },
      { value: 'by:tier2', label: 'tier2', count: 1 },
      { value: NO_ORIGIN, label: 'No origin', count: 1 },
    ]);
  });

  it('keeps deciders named "all" or "none" apart from the fixed keys', () => {
    const odd = [rec({ by: 'all' }), rec({ by: 'none' }), rec()];
    const options = originFilterOptions(odd);
    expect(options.map((o) => o.value)).toEqual([ALL_ORIGINS, 'by:all', 'by:none', NO_ORIGIN]);
    expect(odd.filter((r) => passesOriginFilter(r, NO_ORIGIN))).toHaveLength(1);
    expect(odd.filter((r) => passesOriginFilter(r, deciderKey('none')))).toHaveLength(1);
    expect(odd.filter((r) => passesOriginFilter(r, ALL_ORIGINS))).toHaveLength(3);
  });

  it('cuts a long decider name short in the filter', () => {
    const [, opt] = originFilterOptions([rec({ by: 'a-very-long-decider-name-from-the-future' })]);
    expect(opt.label).toBe('a-very-long-decider…');
    expect(opt.value).toBe('by:a-very-long-decider-name-from-the-future');
  });

  it('offers nothing when no change carries an origin', () => {
    expect(originFilterOptions([rec(), rec()])).toEqual([]);
  });

  it('matches by decider, or the changes without one', () => {
    expect(records.filter((r) => passesOriginFilter(r, 'by:tier0'))).toHaveLength(2);
    expect(records.filter((r) => passesOriginFilter(r, NO_ORIGIN))).toHaveLength(1);
    expect(records.filter((r) => passesOriginFilter(r, ALL_ORIGINS))).toHaveLength(6);
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
    expect(toTier1Status({ state: 'on', month: { spentUsd: '1', capUsd: 20 } })).toBeNull();
  });

  it('fills a partial body with renderable defaults', () => {
    const s = toTier1Status({ state: 'on', month: { spentUsd: 1, capUsd: 20 } })!;
    expect(s.month).toEqual({ spentUsd: 1, capUsd: 20, remainingUsd: 19, resetsAt: '', cards: 0 });
    expect(s.credentials).toEqual({});
    expect(s.bySource).toEqual({});
    expect(s.cache).toEqual({ entries: 0, bytes: 0, files: 0, lastCompaction: null });
    expect(s.warnings).toEqual([]);
    expect(s.nearCap).toBe(false);
    expect(s.summary).toBe('');
    expect(s.note).toBe('');
    expect(s.reason).toBeUndefined();
  });

  it('drops malformed credentials, per-source rows, warnings and strings', () => {
    const s = toTier1Status({
      ...tier1.onNearCap,
      reason: { x: 1 },
      summary: 7,
      note: null,
      provider: { name: 'x' },
      credentials: { ok: { set: true, from: 'ENV' }, nul: null, bad: { set: 'yes', from: 'ENV' }, obj: { set: true, from: { v: 1 } } },
      bySource: { extract: { cards: { n: 1 }, costUsd: 1, lastAt: 'x' }, index: { cards: 3, costUsd: 0.5, lastAt: 9 }, probe: null },
      warnings: ['ok', { w: 1 }, ''],
      month: { ...tier1.onNearCap.month, cards: 'many', remainingUsd: undefined, resetsAt: 5 },
    })!;
    expect(s.credentials).toEqual({ ok: { set: true, from: 'ENV' } });
    expect(s.bySource).toEqual({ index: { cards: 3, costUsd: 0.5, lastAt: '' } });
    expect(s.warnings).toEqual(['ok']);
    expect(s.reason).toBeUndefined();
    expect(s.provider).toBeUndefined();
    expect(s.summary).toBe('');
    expect(s.note).toBe('');
    expect(s.month.cards).toBe(0);
    expect(s.month.remainingUsd).toBeCloseTo(3.58);
    expect(s.month.resetsAt).toBe('');
  });

  it('keeps percentUsed when sent (clamped), null for a cap of $0, and leaves it out otherwise', () => {
    const month = { spentUsd: 1, capUsd: 20 };
    expect(toTier1Status({ state: 'on', month: { ...month, percentUsed: 5 } })!.month.percentUsed).toBe(5);
    expect(toTier1Status({ state: 'on', month: { ...month, percentUsed: 140 } })!.month.percentUsed).toBe(100);
    expect(toTier1Status({ state: 'on', month: { ...month, percentUsed: null } })!.month.percentUsed).toBeNull();
    expect('percentUsed' in toTier1Status({ state: 'on', month })!.month).toBe(false);
  });
});

describe('spend', () => {
  it("uses the server's percentUsed, else rounds down as the CLI does", () => {
    expect(percentUsed({ spentUsd: 16.42, capUsd: 20, percentUsed: 82.1 })).toBe(82.1);
    expect(percentUsed({ spentUsd: 16.42, capUsd: 20 })).toBe(82);
    expect(percentUsed({ spentUsd: 16.42, capUsd: 20, percentUsed: null })).toBe(82);
    expect(percentUsed({ spentUsd: 25, capUsd: 20 })).toBe(100);
    expect(percentUsed({ spentUsd: 0, capUsd: 0, percentUsed: null })).toBe(0);
    expect(percentUsed({ spentUsd: 0.01, capUsd: 0 })).toBe(0);
    expect(formatPercent(82.1)).toBe('82.1%');
    expect(formatPercent(82)).toBe('82%');
  });

  it('colours the bar by state, and never red for a cap of $0', () => {
    expect(spendColor(toTier1Status(tier1.on)!)).toBe('emerald');
    expect(spendColor(toTier1Status(tier1.onNearCap)!)).toBe('amber');
    expect(spendColor(toTier1Status(tier1.capped)!)).toBe('rose');
    expect(
      spendColor({ state: 'capped', nearCap: false, month: { spentUsd: 0, capUsd: 0, remainingUsd: 0, resetsAt: '', cards: 0 } }),
    ).toBe('emerald');
  });

  it('finds the 80% warning in the summary', () => {
    expect(nearCapWarningText('Tier 1 is on. This month: … Tier 1 has used 82% of the cap. To raise it: `x`.')).toBe(
      'Tier 1 has used 82% of the cap. To raise it: `x`.',
    );
    expect(nearCapWarningText('Tier 1 is on.')).toBeNull();
  });

  it('formats dollars (thousands, sub-cent), counts, the reset date (UTC) and bytes', () => {
    expect(formatUsd(3.5)).toBe('$3.50');
    expect(formatUsd(1234.5)).toBe('$1,234.50');
    expect(formatUsd(0.0031)).toBe('<$0.01');
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatCount(11730)).toBe('11,730');
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

  it('leaves an unpaired backtick as text, and yields nothing for a non-string', () => {
    expect(splitCode('a ` b')).toEqual([{ code: false, text: 'a ` b' }]);
    expect(splitCode(undefined)).toEqual([]);
    expect(splitCode({ x: 1 })).toEqual([]);
  });
});

describe('isTier1Unavailable', () => {
  const api = (status: number) => new ApiError('GET /api/tier1', status, '');

  it('treats a missing route or a non-JSON body as an older server', () => {
    expect(isTier1Unavailable(api(404))).toBe(true);
    expect(isTier1Unavailable(api(405))).toBe(true);
    expect(isTier1Unavailable(api(501))).toBe(true);
    expect(isTier1Unavailable(new SyntaxError('Unexpected token <'))).toBe(true);
  });

  it('treats anything else as an error worth showing', () => {
    expect(isTier1Unavailable(api(401))).toBe(false);
    expect(isTier1Unavailable(api(403))).toBe(false);
    expect(isTier1Unavailable(api(500))).toBe(false);
    expect(isTier1Unavailable(api(502))).toBe(false);
    expect(isTier1Unavailable(new TypeError('Failed to fetch'))).toBe(false);
    expect(isTier1Unavailable(new Error('x'))).toBe(false);
    expect(isTier1Unavailable(undefined)).toBe(false);
  });
});
