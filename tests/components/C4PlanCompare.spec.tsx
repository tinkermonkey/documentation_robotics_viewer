// @vitest-environment happy-dom
/**
 * C4PlanCompare.spec.tsx — a plan compared with what was built on the
 * Architecture view's diagrams (`?changeset=` + `?built=`): the comparison bar
 * (pair, tally, legend), a verdict mark with a glyph and words on every
 * touched card (never colour alone), the verdict in each card's accessible
 * name, the roll-up on the box that holds them, the drawer's "Plan vs as
 * built" section, the switch from the plain overlay, and an older dr CLI.
 *
 * Both changesets are staged over the MSW model fixture; the verification is
 * the CLI's report shape, served by MSW. The layout is a stand-in grid.
 */

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type { C4View } from '@/apps/embedded/data/c4/c4Views';
import type { C4Layout } from '@/apps/embedded/data/c4/c4Layout';

vi.mock('@/apps/embedded/data/c4/c4Layout', async (original) => {
  const actual = await original<typeof import('@/apps/embedded/data/c4/c4Layout')>();
  return {
    ...actual,
    layoutC4View: async (view: C4View): Promise<C4Layout> => {
      const boxes = new Map<string, { x: number; y: number; width: number; height: number }>();
      view.elements.forEach((e, i) =>
        boxes.set(e.id, { x: 40 + (i % 6) * 280, y: 60 + Math.floor(i / 6) * 160, ...actual.C4_CARD }),
      );
      const centre = (id: string) => {
        const b = boxes.get(id)!;
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      };
      return {
        width: 1800,
        height: 200 + Math.ceil(view.elements.length / 6) * 160,
        boxes,
        boundary: view.scope ? { x: 20, y: 20, width: 1760, height: 120 } : null,
        edges: view.relationships.map((r) => ({ id: r.id, points: [centre(r.sourceId), centre(r.targetId)] })),
      };
    },
  };
});

import { ArchitectureCanvas } from '@/apps/embedded/ui/ArchitectureCanvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { buildC4Model, c4Ancestors } from '@/apps/embedded/data/c4/c4Model';
import { comparisonModel } from '@/apps/embedded/data/c4/useC4Model';
import type { ModelPayload } from '@/apps/embedded/data/useModel';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import { addElement, derive } from '../unit/c4/fixture';
import modelFixture from '../fixtures/model.json';

const payload = modelFixture as unknown as ModelPayload;
const model = derive(payload.nodes, payload.links);

const PLAN = 'cs-plan';
const BUILT = 'cs-plan-as-built';
const BUILT_REF = 'application.applicationcomponent.probe-built';
const MISSED_REF = 'application.applicationcomponent.probe-missed';
const EXTRA_REF = 'application.applicationcomponent.probe-extra';

const planChanges = [
  addElement('application.applicationcomponent', 'Probe Built', { type: 'internal' }, 1),
  addElement('application.applicationcomponent', 'Probe Missed', { type: 'internal' }, 2),
];
const builtChanges = [
  addElement('application.applicationcomponent', 'Probe Built', { type: 'internal' }, 1),
  addElement('application.applicationcomponent', 'Probe Extra', { type: 'internal' }, 2),
];

// Where the probes land: the container that holds them (unowned components go to the app container).
const drawn = buildC4Model(comparisonModel(model, { status: 'staged', changes: planChanges }, { status: 'staged', changes: builtChanges }));
const container = c4Ancestors(drawn, BUILT_REF)[1];

const report = {
  plannedChangeset: { id: PLAN, name: 'probe-plan' },
  asBuiltChangeset: { id: BUILT, name: 'probe-plan-as-built' },
  verdict: 'incomplete',
  verdictText: 'The build is incomplete: 1 planned element is missing.',
  elements: {
    matched: [{ planned: BUILT_REF, built: BUILT_REF, op: 'add', match: 'exact' }],
    divergent: [],
    missing: [{ planned: MISSED_REF, layer: 'application', type: 'applicationcomponent', name: 'Probe Missed', op: 'add', reason: 'no as-built element' }],
    unverifiable: [],
    unplanned: [{ id: EXTRA_REF, layer: 'application', type: 'applicationcomponent', name: 'Probe Extra', change: 'added' }],
    deletionsNotDone: [],
  },
  relationships: { matched: [], divergent: [], missing: [], unverifiable: [], unplanned: [], deletionsNotDone: [] },
  notes: [],
};

function serve({ verification = true }: { verification?: boolean } = {}) {
  const detail = (id: string, name: string, purpose: string, changes: unknown[], extra: Record<string, unknown> = {}) => ({
    id,
    name,
    status: 'staged',
    created: '2026-11-23T00:00:00Z',
    purpose,
    revision: 1,
    changes,
    ...extra,
  });
  mswServer.use(
    http.get('*/api/projects/:project/checkouts/:checkout/changesets', () =>
      HttpResponse.json({
        version: '1',
        changesets: {
          [PLAN]: { name: 'probe-plan', status: 'staged', created: '2026-11-23T00:00:00Z', changes_count: 2, purpose: 'plan' },
          [BUILT]: {
            name: 'probe-plan-as-built',
            status: 'staged',
            created: '2026-11-23T00:00:00Z',
            changes_count: 2,
            purpose: 'verification',
            verifies: PLAN,
          },
        },
      }),
    ),
    http.get(`*/api/projects/:project/checkouts/:checkout/changesets/${PLAN}`, () => HttpResponse.json(detail(PLAN, 'probe-plan', 'plan', planChanges))),
    http.get(`*/api/projects/:project/checkouts/:checkout/changesets/${BUILT}`, () =>
      HttpResponse.json(detail(BUILT, 'probe-plan-as-built', 'verification', builtChanges, { verifies: PLAN })),
    ),
    http.get(`*/api/projects/:project/checkouts/:checkout/changesets/${PLAN}/verification`, ({ request }) =>
      verification && new URL(request.url).searchParams.get('against') === BUILT
        ? HttpResponse.json(report)
        : new HttpResponse('404 Not Found', { status: 404 }),
    ),
  );
}

const card = (id: string) => document.querySelector<HTMLElement>(`[data-testid="c4-card"][data-c4-id="${CSS.escape(id)}"]`);

async function renderCompare(level: 'container' | 'component', scope: string | null = null) {
  renderWithProviders(<ArchitectureCanvas />);
  act(() => useUiStore.getState().showC4(level, scope, { changesetId: PLAN, builtId: BUILT }));
  await waitFor(() => expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', level));
}

describe('C4 plan comparison', () => {
  it('the bar names the pair, says the verdict and tallies it, with a legend', async () => {
    serve();
    await renderCompare('component', container);
    const bar = screen.getByTestId('c4-compare-bar');
    expect(within(bar).getByTestId('c4-compare-plan')).toHaveTextContent('probe-plan');
    expect(await within(bar).findByTestId('c4-compare-verdict')).toHaveTextContent('1 planned element is missing');
    expect(within(bar).getByTestId('c4-compare-tally')).toHaveTextContent(
      'Elements: 1 planned, not built · 1 built as planned · 1 built, not planned',
    );
    expect(within(bar).getByTestId('c4-compare-legend')).toHaveTextContent('built differently');
    expect(screen.queryByTestId('c4-changeset-bar')).toBeNull();
  });

  it('marks every touched card with a glyph and words, never colour alone, and says it in the accessible name', async () => {
    serve();
    await renderCompare('component', container);
    await screen.findByTestId('c4-compare-tally');
    const expected: [string, string, string][] = [
      [BUILT_REF, '✓', 'built as planned'],
      [MISSED_REF, '∅', 'planned, not built'],
      [EXTRA_REF, '+', 'built, not planned'],
    ];
    for (const [id, glyph, words] of expected) {
      const el = await waitFor(() => card(id)!);
      expect(el.dataset.status).toMatch(/^v-/);
      const chip = within(el).getByTestId('c4-card-status');
      expect(chip).toHaveTextContent(`${glyph} ${words}`);
      expect(within(el).getByTestId('c4-card-mark').style.border).toMatch(/solid|dotted|groove/);
      expect(within(el).getAllByRole('button')[0].getAttribute('aria-label')).toContain(words);
    }
  });

  it('rolls the verdicts up onto the box that holds them, one level up', async () => {
    serve();
    await renderCompare('container');
    await screen.findByTestId('c4-compare-tally');
    const holder = await waitFor(() => card(container)!);
    expect(within(holder).getByTestId('c4-card-rollup')).toHaveTextContent('3 inside · 1 ∅');
    expect(within(holder).getAllByRole('button')[0].getAttribute('aria-label')).toContain(
      '3 inside: 1 planned, not built, 1 built as planned, 1 built, not planned',
    );
  });

  it("the drawer lists the verdicts behind the selected box", async () => {
    serve();
    await renderCompare('component', container);
    await screen.findByTestId('c4-compare-tally');
    fireEvent.click(within(await waitFor(() => card(MISSED_REF)!)).getAllByRole('button')[0]);
    const section = await screen.findByTestId('c4-verdicts');
    expect(within(section).getByTestId('c4-verdict-box')).toHaveTextContent('This box: planned, not built');
    expect(within(section).getByTestId('c4-verdict-row')).toHaveTextContent('planned, not built');
    expect(within(section).getByTestId('c4-verdict-row')).toHaveTextContent('no as-built element');
  });

  it('the changeset bar offers the comparison for a plan with a verification record, and Show the plan only goes back', async () => {
    serve();
    renderWithProviders(<ArchitectureCanvas />);
    act(() => useUiStore.getState().showC4('container', null, { changesetId: PLAN }));
    fireEvent.click(await screen.findByTestId('c4-bar-compare'));
    expect(useUiStore.getState().c4BuiltId).toBe(BUILT);
    await screen.findByTestId('c4-compare-bar');
    fireEvent.click(screen.getByTestId('c4-compare-plan-only'));
    expect(useUiStore.getState()).toMatchObject({ c4ChangesetId: PLAN, c4BuiltId: null });
    await screen.findByTestId('c4-changeset-bar');
  });

  it("never offers to compare a plan with an as-built changeset that isn't its own record", async () => {
    serve();
    // The record verifies another plan: it stays in the comparison's picker, never the bar's default.
    mswServer.use(
      http.get('*/api/projects/:project/checkouts/:checkout/changesets', () =>
        HttpResponse.json({
          version: '1',
          changesets: {
            [PLAN]: { name: 'probe-plan', status: 'staged', created: '2026-11-23T00:00:00Z', changes_count: 2, purpose: 'plan' },
            [BUILT]: { name: 'other-as-built', status: 'staged', created: '2026-11-23T00:00:00Z', changes_count: 2, purpose: 'verification', verifies: 'another-plan' },
          },
        }),
      ),
    );
    renderWithProviders(<ArchitectureCanvas />);
    act(() => useUiStore.getState().showC4('container', null, { changesetId: PLAN }));
    await screen.findByTestId('c4-bar-tally');
    expect(screen.queryByTestId('c4-bar-compare')).toBeNull();
  });

  it('with a dr CLI that has no verification route, says so and draws the plan without verdicts', async () => {
    serve({ verification: false });
    await renderCompare('component', container);
    expect(await screen.findByTestId('c4-compare-unavailable')).toHaveTextContent("can't compare a plan");
    const el = await waitFor(() => card(BUILT_REF)!);
    expect(el.dataset.status).toBeUndefined();
  });
});
