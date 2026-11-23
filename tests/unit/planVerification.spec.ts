/**
 * planVerification — reading the dr CLI's plan verification report, pairing a
 * plan with what was built, and telling an older CLI from a failure.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  asBuiltChoices,
  defaultAsBuilt,
  fetchPlanVerification,
  isVerificationUnavailable,
  toPlanVerification,
  verdictCounts,
  verificationUrl,
  VerificationRequestError,
} from '@/apps/embedded/data/planVerification';

const NEW = 'application.applicationcomponent.new-comp';
const OTHER = 'application.applicationcomponent.other-comp';

/** A report as the CLI sends it (trimmed to what the viewer reads, plus fields it ignores). */
export function report(overrides: Record<string, unknown> = {}) {
  return {
    plannedChangeset: { id: 'plan-1', name: 'the-plan' },
    asBuiltChangeset: { id: 'built-1', name: 'the-plan-as-built' },
    planned: { label: 'the-plan', elements: 5, relationships: 2 },
    against: { label: 'the-plan-as-built', kind: 'changeset' },
    verdict: 'diverges',
    verdictText: 'The build diverges from the plan.',
    summary: {},
    elements: {
      matched: [
        { planned: NEW, built: NEW, op: 'add', match: 'exact' },
        { planned: 'application.applicationservice.loose', built: 'application.applicationservice.loose-svc', op: 'add', match: 'probable', reason: 'same source file' },
      ],
      divergent: [{ planned: OTHER, built: OTHER, op: 'update', match: 'exact', fields: [{ field: 'description', planned: 'a', built: 'b' }] }],
      missing: [{ planned: 'application.applicationcomponent.missed', layer: 'application', type: 'applicationcomponent', name: 'Missed', op: 'add', reason: 'no as-built element' }],
      unverifiable: [{ planned: 'motivation.requirement.r', layer: 'motivation', type: 'requirement', name: 'R', op: 'add', reason: 'extraction cannot see requirements' }],
      unplanned: [{ id: 'application.applicationcomponent.extra', layer: 'application', type: 'applicationcomponent', name: 'Extra', change: 'added' }],
      deletionsNotDone: [],
    },
    relationships: {
      matched: [{ planned: { source: NEW, predicate: 'uses', target: OTHER }, built: { source: NEW, predicate: 'uses', target: OTHER }, op: 'add', match: 'exact' }],
      divergent: [],
      missing: [{ planned: { source: NEW, predicate: 'depends-on', target: OTHER }, reason: 'not built' }],
      unverifiable: [],
      unplanned: [{ source: 'application.applicationcomponent.extra', predicate: 'uses', target: OTHER, change: 'added' }],
      deletionsNotDone: [],
    },
    notes: [],
    ...overrides,
  };
}

describe('planVerification: reading the report', () => {
  it('gives every planned element and link its verdict, and every unplanned one', () => {
    const v = toPlanVerification(report())!;
    expect(v.plan).toEqual({ id: 'plan-1', name: 'the-plan' });
    expect(v.asBuilt).toEqual({ id: 'built-1', name: 'the-plan-as-built' });
    expect(v.verdict).toBe('diverges');
    expect(v.elements.map((e) => `${e.id}:${e.verdict}`)).toEqual([
      `${NEW}:built`,
      'application.applicationservice.loose:probable',
      `${OTHER}:divergent`,
      'application.applicationcomponent.missed:missing',
      'motivation.requirement.r:unverifiable',
      'application.applicationcomponent.extra:unplanned',
    ]);
    expect(v.elements[5].change).toBe('added');
    expect(v.elements[1]).toMatchObject({ builtId: 'application.applicationservice.loose-svc', reason: 'same source file' });
    expect(v.elements[2].fields).toEqual(['description']);
    expect(v.relationships.map((r) => `${r.predicate}:${r.verdict}`)).toEqual(['uses:built', 'depends-on:missing', 'uses:unplanned']);
    expect(verdictCounts(v).elements).toEqual({ missing: 1, divergent: 1, probable: 1, unverifiable: 1, built: 1, unplanned: 1 });
  });

  it('reads a planned delete that was not done as planned, not built', () => {
    const v = toPlanVerification(
      report({
        elements: { matched: [], deletionsNotDone: [{ planned: OTHER, built: OTHER }] },
        relationships: {},
      }),
    )!;
    expect(v.elements).toEqual([{ id: OTHER, verdict: 'missing' }]);
  });

  it('drops a malformed item and counts it, and refuses a payload that is not a report', () => {
    const v = toPlanVerification(
      report({
        elements: { matched: [{ built: NEW }, 'nonsense', { planned: NEW, op: 'add', match: 'exact' }], unplanned: [{ name: 'no id' }] },
        relationships: { missing: [{ planned: { source: NEW } }] },
      }),
    )!;
    expect(v.elements.map((e) => e.id)).toEqual([NEW]);
    expect(v.dropped).toBe(4);
    expect(toPlanVerification(null)).toBeNull();
    expect(toPlanVerification({ verdict: 'match' })).toBeNull();
    expect(toPlanVerification(report({ verdict: 'great' }))).toBeNull();
    expect(toPlanVerification(report({ asBuiltChangeset: undefined }))).toBeNull();
  });
});

describe('planVerification: fetching', () => {
  const respond = (status: number, body: unknown) =>
    vi.fn(async () =>
      typeof body === 'string'
        ? new Response(body, { status })
        : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    ) as unknown as typeof fetch;

  it('asks for the plan against the as-built, both ids encoded', async () => {
    expect(verificationUrl('plan 1', 'built/1')).toBe('/api/changesets/plan%201/verification?against=built%2F1');
    const fetcher = respond(200, report());
    const v = await fetchPlanVerification('plan-1', 'built-1', fetcher);
    expect(v.verdict).toBe('diverges');
    expect(fetcher).toHaveBeenCalledWith('/api/changesets/plan-1/verification?against=built-1', expect.anything());
  });

  it('reads a route the server does not have as an older dr CLI, not a failure', async () => {
    for (const fetcher of [respond(404, '404 Not Found'), respond(200, '<!doctype html>'), respond(405, ''), respond(501, '')]) {
      const error = await fetchPlanVerification('plan-1', 'built-1', fetcher).catch((e) => e);
      expect(error).toBeInstanceOf(VerificationRequestError);
      expect(isVerificationUnavailable(error)).toBe(true);
    }
  });

  it("passes the server's own error on: a changeset that is gone, a bad request", async () => {
    const gone = await fetchPlanVerification('plan-1', 'built-1', respond(404, { error: 'As-built changeset not found: built-1' })).catch((e) => e);
    expect(isVerificationUnavailable(gone)).toBe(false);
    expect(gone.message).toBe('As-built changeset not found: built-1');
    const bad = await fetchPlanVerification('plan-1', 'plan-1', respond(400, { error: 'against names the plan itself' })).catch((e) => e);
    expect(bad.status).toBe(400);
  });
});

describe('planVerification: pairing a plan with what was built', () => {
  const list = [
    { id: 'plan-1', name: 'plan', status: 'staged', purpose: 'plan' as const },
    { id: 'rec-b', name: 'plan-as-built-b', status: 'committed', purpose: 'verification' as const, verifies: 'plan-1' },
    { id: 'rec-a', name: 'plan-as-built-a', status: 'staged', purpose: 'verification' as const, verifies: 'plan-1' },
    { id: 'rec-other', name: 'other-as-built', status: 'staged', purpose: 'verification' as const, verifies: 'plan-2' },
    { id: 'sync', name: 'model-sync', status: 'committed', purpose: 'reconcile' as const },
    { id: 'gone', name: 'gone', status: 'discarded', purpose: 'reconcile' as const },
    { id: 'chat', name: 'drbot', status: 'staged', purpose: 'chat' as const },
  ];

  it("offers the plan's own records first (staged before applied), then other as-built changesets", () => {
    const { records, others } = asBuiltChoices('plan-1', list);
    expect(records.map((c) => c.id)).toEqual(['rec-a', 'rec-b']);
    expect(others.map((c) => c.id)).toEqual(['rec-other', 'sync']);
    expect(defaultAsBuilt('plan-1', list)?.id).toBe('rec-a');
  });

  it('has no default for a plan without a record, but still offers the others by hand (staged, then A–Z)', () => {
    expect(defaultAsBuilt('plan-2-without', list)).toBeNull();
    expect(asBuiltChoices('plan-2-without', list).others.map((c) => c.id)).toEqual(['rec-other', 'rec-a', 'sync', 'rec-b']);
  });
});
