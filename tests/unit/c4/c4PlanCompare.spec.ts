/**
 * c4PlanCompare — a plan verification's verdicts lifted onto the C4 model:
 * the worst verdict per box and arrow, folded parts, roll-ups, and what no
 * diagram shows.
 */

import { describe, it, expect } from 'vitest';
import { buildC4Model } from '@/apps/embedded/data/c4/c4Model';
import { buildC4View } from '@/apps/embedded/data/c4/c4Views';
import { compareC4Plan, rollUpTotal, viewArrowVerdicts, worstVerdict } from '@/apps/embedded/data/c4/c4PlanCompare';
import { comparisonModel } from '@/apps/embedded/data/c4/useC4Model';
import type { PlanVerification, RelationshipVerdictItem, VerdictItem } from '@/apps/embedded/data/planVerification';
import { elementVerdictLabel, verdictRollUpChip, verdictRollUpLabel } from '@/apps/embedded/ui/verdictStyles';
import { addElement, addRelationship, derive, link, node, ref, sampleModel } from './fixture';

const { model, n } = sampleModel();
const c4 = buildC4Model(model);

function verification(elements: VerdictItem[], relationships: RelationshipVerdictItem[] = []): PlanVerification {
  return {
    plan: { id: 'plan', name: 'plan' },
    asBuilt: { id: 'built', name: 'built' },
    verdict: 'diverges',
    verdictText: '',
    elements,
    relationships,
    notes: [],
    dropped: 0,
  };
}

describe('compareC4Plan: verdicts per box', () => {
  it('gives each box the worst verdict behind it, and rolls it up to each ancestor', () => {
    const cmp = compareC4Plan(
      model,
      c4,
      verification([
        { id: ref(n.inspector), verdict: 'built', op: 'add' },
        { id: ref(n.lanes), verdict: 'probable', op: 'add' },
        { id: ref(n.hive), verdict: 'missing', op: 'add' },
        { id: ref(n.tooltip), verdict: 'divergent', op: 'update', fields: ['description'] },
      ]),
    );
    expect(cmp.elements.get(ref(n.inspector))?.verdict).toBe('built');
    expect(cmp.elements.get(ref(n.lanes))?.verdict).toBe('probable');
    expect(cmp.elements.get(ref(n.hive))?.verdict).toBe('missing');
    expect(cmp.elements.get(ref(n.tooltip))?.verdict).toBe('divergent');

    // Canvas holds Inspector, Lanes and Hive; Shell holds Canvas; the app holds Shell (and Tooltip).
    expect(cmp.rollUp.get(ref(n.canvas))).toMatchObject({ built: 1, probable: 1, missing: 1 });
    expect(rollUpTotal(cmp.rollUp.get(ref(n.shell)))).toBe(3);
    expect(rollUpTotal(cmp.rollUp.get(ref(n.app)))).toBe(4);
    expect(verdictRollUpLabel(cmp.rollUp.get(ref(n.canvas)))).toBe(
      '3 inside: 1 planned, not built, 1 probably built, 1 built as planned',
    );
    expect(verdictRollUpChip(cmp.rollUp.get(ref(n.canvas)))).toBe('3 inside · 1 ∅');
    expect(cmp.elements.has(ref(n.canvas))).toBe(false);
  });

  it('folds an element onto the box it is folded onto, and says so when that is all the box has', () => {
    const cmp = compareC4Plan(
      model,
      c4,
      verification([{ id: ref(n.test), verdict: 'unplanned' }]),
    );
    const transform = cmp.elements.get(ref(n.transform))!;
    expect(transform.items).toEqual([]);
    expect(transform.folded.map((i) => i.id)).toEqual([ref(n.test)]);
    expect(transform.verdict).toBe('unplanned');
    expect(elementVerdictLabel(transform)).toBe('unplanned additions');

    // With a planned element of its own, the box reads by that; the unplanned part stays listed.
    const both = compareC4Plan(
      model,
      c4,
      verification([
        { id: ref(n.transform), verdict: 'built', op: 'update' },
        { id: ref(n.test), verdict: 'unplanned' },
      ]),
    ).elements.get(ref(n.transform))!;
    expect(both.verdict).toBe('built');
    expect(elementVerdictLabel(both)).toBe('built as planned');
    expect(both.folded).toHaveLength(1);
  });

  it('finds an element whose id the report spells differently, and counts what no diagram shows', () => {
    const cmp = compareC4Plan(
      model,
      c4,
      verification([
        { id: 'application.applicationcomponent.tool_tip', verdict: 'built', op: 'add' },
        { id: ref(n.orphan), verdict: 'missing', op: 'add' },
        { id: 'application.applicationcomponent.not-in-the-model', verdict: 'missing', op: 'add' },
      ]),
    );
    expect(cmp.elements.get(ref(n.tooltip))?.verdict).toBe('built');
    expect(cmp.unshown.elements.map((i) => i.id)).toEqual([ref(n.orphan), 'application.applicationcomponent.not-in-the-model']);
    expect(cmp.tally.elements).toMatchObject({ built: 1, missing: 2 });
  });

  it('finds an element by the shortened id the CLI gives a long name, and its links', () => {
    const longName = 'Plan comparison renderer that names the pair tallies the verdicts and marks every card with a glyph never colour alone';
    const comp = node('application.applicationcomponent', longName, { type: 'internal' });
    const m = derive([...model.nodes, comp], [...model.links, link(comp, 'uses', n.tooltip)]);
    const slug = ref(comp).split('.')[2];
    expect(slug.length).toBeGreaterThan(100);
    // As the CLI cuts it: at a word within 100 characters, then a hash of the whole slug.
    const cut = slug.slice(0, 100);
    const shortened = `application.applicationcomponent.${cut.slice(0, cut.lastIndexOf('-'))}-1a2b3c4d`;
    const drawn = buildC4Model(m);
    const cmp = compareC4Plan(
      m,
      drawn,
      verification(
        [{ id: shortened, verdict: 'unplanned' }],
        [{ source: shortened, predicate: 'uses', target: ref(n.tooltip), verdict: 'unplanned' }],
      ),
    );
    expect(cmp.unshown).toEqual({ elements: [], relationships: [] });
    expect(cmp.elements.get(ref(comp))?.items.map((i) => i.id)).toEqual([shortened]);
    expect(cmp.links.size).toBe(1);
  });

  it('marks the as-built twin of a probable match too, so it never reads as untouched', () => {
    const cmp = compareC4Plan(
      model,
      c4,
      verification([{ id: ref(n.lanes), builtId: ref(n.hive), verdict: 'probable', op: 'add' }]),
    );
    expect(cmp.elements.get(ref(n.lanes))?.verdict).toBe('probable');
    expect(cmp.elements.get(ref(n.hive))?.verdict).toBe('probable');
    // Counted once per box above them.
    expect(cmp.rollUp.get(ref(n.canvas))?.probable).toBe(2);
  });

  it('orders verdicts worst first, with built-not-planned last', () => {
    expect(worstVerdict(['built', 'unplanned'])).toBe('built');
    expect(worstVerdict(['unplanned', 'unverifiable', 'probable'])).toBe('probable');
    expect(worstVerdict(['built', 'divergent', 'missing'])).toBe('missing');
    expect(worstVerdict([])).toBeNull();
  });
});

describe('compareC4Plan: verdicts per arrow', () => {
  it('marks an arrow by the links behind it, also when lifted, and counts a link no arrow draws', () => {
    const cmp = compareC4Plan(
      model,
      c4,
      verification(
        [],
        [
          { source: ref(n.inspector), predicate: 'uses', target: ref(n.tooltip), verdict: 'missing' },
          { source: ref(n.apiClient), predicate: 'depends-on', target: ref(n.transform), verdict: 'built' },
          { source: ref(n.lanes), predicate: 'uses', target: ref(n.hive), verdict: 'built' },
        ],
      ),
    );
    expect(cmp.unshown.relationships.map((r) => r.source)).toEqual([ref(n.lanes)]);

    // On the app's Component diagram Inspector → Tooltip is lifted to Shell → Tooltip.
    const app = buildC4View(c4, 'component', ref(n.app));
    const arrows = viewArrowVerdicts(app, cmp);
    expect(arrows.get(`${ref(n.shell)}>${ref(n.tooltip)}`)?.verdict).toBe('missing');
    expect(arrows.get(`${ref(n.apiClient)}>${ref(n.transform)}`)?.verdict).toBe('built');
  });
});

describe('comparisonModel: the model a comparison is drawn on', () => {
  it('applies a staged plan, then lays a staged as-built over it, one element for what both add', () => {
    const plan = { status: 'staged', changes: [addElement('application.applicationcomponent', 'Search Box', { type: 'internal' }), addRelationship(n.shell, 'composes', 'application.applicationcomponent.search-box')] };
    const built = {
      status: 'staged',
      changes: [
        addElement('application.applicationcomponent', 'Search Box', { type: 'internal' }),
        addElement('application.applicationcomponent', 'Search Index', { type: 'internal' }),
      ],
    };
    const drawn = comparisonModel(model, plan, built);
    const names = drawn.nodes.map((node) => node.name);
    expect(names.filter((name) => name === 'Search Box')).toHaveLength(1);
    expect(names).toContain('Search Index');

    const cmp = compareC4Plan(
      drawn,
      buildC4Model(drawn),
      verification([
        { id: 'application.applicationcomponent.search-box', verdict: 'built', op: 'add' },
        { id: 'application.applicationcomponent.search-index', verdict: 'unplanned' },
      ]),
    );
    expect(cmp.elements.get('application.applicationcomponent.search-box')?.verdict).toBe('built');
    expect(cmp.elements.get('application.applicationcomponent.search-index')?.verdict).toBe('unplanned');
    expect(cmp.unshown.elements).toEqual([]);
  });

  it('leaves an applied plan and an applied as-built as the model already holds them', () => {
    expect(comparisonModel(model, { status: 'committed', changes: [] }, { status: 'committed', changes: [] })).toBe(model);
  });
});
