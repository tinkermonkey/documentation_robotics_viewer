/**
 * c4PlanCompare — a plan's verification lifted onto the C4 diagrams. Pure.
 *
 * The diagram is the model as the plan leaves it (the plan applied), with the
 * as-built changeset's elements laid over it, so what was built but not
 * planned has a place too (`useC4PlanComparison` builds that model). The
 * verdicts come from the dr CLI's plan verification (`planVerification.ts`);
 * nothing here matches plan and build itself.
 *
 * Each verdict is about a model element (by dotted id) or a model
 * relationship (its ends and predicate). An element goes to the C4 element it
 * is, or the ones it is folded onto (a test onto what it tests); a
 * relationship to every C4 arrow that has its model link behind it. A box or
 * arrow then shows the worst verdict behind it, in `PLAN_VERDICTS` order
 * (planned but not built, built differently, probable, can't be checked,
 * built as planned), and "built, not planned" only when nothing planned is
 * behind it. `rollUp` counts the marked boxes below each box per verdict, so a
 * diagram above them still says what is inside.
 *
 * What reaches no C4 element or arrow (a layer the rules don't draw, a link
 * between elements folded onto one box) is counted in `unshown`, never
 * dropped.
 */

import { buildModelIndex, dottedId, slugifyName } from '../modelGraph';
import type { ModelDerived } from '../useModel';
import { PLAN_VERDICTS, type PlanVerdict, type PlanVerification, type RelationshipVerdictItem, type VerdictItem } from '../planVerification';
import { c4Ancestors, type C4Model } from './c4Model';
import type { C4View } from './c4Views';

export interface C4ElementVerdict {
  /** The worst verdict behind the box. */
  verdict: PlanVerdict;
  /** The model elements that are this box. */
  items: VerdictItem[];
  /** The model elements folded onto it (tests, features, schemas…). */
  folded: VerdictItem[];
}

export type VerdictCounts = Record<PlanVerdict, number>;

export interface C4PlanComparison {
  /** C4 element id → its verdict, for every box something planned or built is behind. */
  elements: Map<string, C4ElementVerdict>;
  /** Model link id → the relationship verdicts behind it. */
  links: Map<string, RelationshipVerdictItem[]>;
  /** C4 element id → the marked boxes below it, per verdict (only boxes with some). */
  rollUp: Map<string, VerdictCounts>;
  /** Model elements and relationships per verdict: the report's own counts. */
  tally: { elements: VerdictCounts; relationships: VerdictCounts };
  /** What no diagram shows: element items, and relationship items. */
  unshown: { elements: VerdictItem[]; relationships: RelationshipVerdictItem[] };
}

export const zeroCounts = (): VerdictCounts => ({ missing: 0, divergent: 0, probable: 0, unverifiable: 0, built: 0, unplanned: 0 });

/** The worst of `verdicts` in `PLAN_VERDICTS` order; null for none. */
export function worstVerdict(verdicts: Iterable<PlanVerdict>): PlanVerdict | null {
  const seen = new Set(verdicts);
  return PLAN_VERDICTS.find((v) => seen.has(v)) ?? null;
}

/** A dotted id reduced to letters and digits per part, for ids whose slug the viewer spells differently. */
function looseRef(ref: string): string {
  const [layer, type, ...rest] = ref.split('.');
  return `${layer}.${type}.${rest.join('.').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

/**
 * A slug the dr CLI shortened: past 100 characters it is cut at a word and
 * ended with `-<8 hex>`, a hash of the whole slug, which the viewer can't
 * rebuild from a name. The cut part is a prefix of the full slug.
 */
const SHORTENED = /^(.{50,100})-[0-9a-f]{8}$/;

/**
 * Finds the model element (UUID) a report's dotted id names: exactly, then by
 * a loose spelling, then (a shortened id) by the one element of that layer
 * and type whose slug starts with the cut part. Ambiguous ids resolve to
 * nothing rather than to a guess.
 */
function refResolver(model: ModelDerived): (ref: string) => string | undefined {
  const exact = new Map<string, string>();
  const loose = new Map<string, string | null>();
  const byType = new Map<string, { slug: string; id: string }[]>();
  for (const node of model.nodes) {
    const ref = dottedId(node);
    exact.set(ref, node.id);
    // The loose key only when it names one element.
    const key = looseRef(`${node.layer_id}.${node.type}.${slugifyName(node.name)}`);
    loose.set(key, loose.has(key) ? null : node.id);
    const type = `${node.layer_id}.${node.type}`;
    (byType.get(type) ?? byType.set(type, []).get(type)!).push({ slug: slugifyName(node.name), id: node.id });
  }
  const shortened = (ref: string): string | undefined => {
    const [layer, type, ...rest] = ref.split('.');
    const cut = SHORTENED.exec(rest.join('.'))?.[1];
    if (!cut) return undefined;
    const hits = (byType.get(`${layer}.${type}`) ?? []).filter((n) => n.slug.length > cut.length && n.slug.startsWith(cut));
    return hits.length === 1 ? hits[0].id : undefined;
  };
  return (ref) => exact.get(ref) ?? loose.get(looseRef(ref)) ?? shortened(ref) ?? undefined;
}

export function compareC4Plan(model: ModelDerived, c4: C4Model, verification: PlanVerification): C4PlanComparison {
  const uuidOf = refResolver(model);
  const elements = new Map<string, C4ElementVerdict>();
  const unshown: C4PlanComparison['unshown'] = { elements: [], relationships: [] };

  const entry = (id: string) => {
    let e = elements.get(id);
    if (!e) elements.set(id, (e = { verdict: 'built', items: [], folded: [] }));
    return e;
  };

  for (const item of verification.elements) {
    // The planned element and, when the build named it differently (a probable or
    // divergent match), its as-built twin: both are drawn, so both carry the verdict.
    const uuids = [...new Set([uuidOf(item.id), item.builtId ? uuidOf(item.builtId) : undefined].filter((u): u is string => !!u))];
    const owns = new Set(uuids.map((u) => c4.elementOf.get(u)).filter((id): id is string => !!id));
    const anchors = new Set(
      uuids.filter((u) => !c4.elementOf.has(u)).flatMap((u) => c4.anchorsOf.get(u) ?? []),
    );
    for (const own of owns) entry(own).items.push(item);
    for (const anchor of anchors) if (!owns.has(anchor)) entry(anchor).folded.push(item);
    if (owns.size === 0 && anchors.size === 0) unshown.elements.push(item);
  }
  for (const e of elements.values()) {
    e.verdict = worstVerdict([...e.items, ...e.folded].map((i) => i.verdict)) ?? 'built';
  }

  // Relationships: the model links behind each verdict (ends resolved as the elements
  // are, so a shortened id finds its link too), then the C4 arrows that carry them.
  const index = buildModelIndex(model);
  const linkIdsOf = new Map<string, string[]>();
  for (const link of model.links) {
    const src = index.byEndpoint.get(link.source)?.id;
    const tgt = index.byEndpoint.get(link.target)?.id;
    if (!src || !tgt) continue;
    const key = `${src}|${link.type}|${tgt}`;
    (linkIdsOf.get(key) ?? linkIdsOf.set(key, []).get(key)!).push(link.id);
  }
  const drawnLinks = new Set(c4.relationships.flatMap((r) => r.linkIds));
  const links = new Map<string, RelationshipVerdictItem[]>();
  for (const item of verification.relationships) {
    const keys = [item, ...(item.built ? [item.built] : [])].map(
      (t) => `${uuidOf(t.source) ?? `?${t.source}`}|${t.predicate}|${uuidOf(t.target) ?? `?${t.target}`}`,
    );
    const ids = [...new Set(keys.flatMap((k) => linkIdsOf.get(k) ?? []))].filter((id) => drawnLinks.has(id));
    if (ids.length === 0) {
      unshown.relationships.push(item);
      continue;
    }
    for (const id of ids) (links.get(id) ?? links.set(id, []).get(id)!).push(item);
  }

  // Roll-up: each marked box counts once on every box above it.
  const rollUp = new Map<string, VerdictCounts>();
  for (const [id, e] of elements) {
    for (const ancestor of c4Ancestors(c4, id).slice(1)) {
      const counts = rollUp.get(ancestor) ?? rollUp.set(ancestor, zeroCounts()).get(ancestor)!;
      counts[e.verdict]++;
    }
  }

  const tally = { elements: zeroCounts(), relationships: zeroCounts() };
  for (const item of verification.elements) tally.elements[item.verdict]++;
  for (const item of verification.relationships) tally.relationships[item.verdict]++;

  return { elements, links, rollUp, tally, unshown };
}

/** Per arrow of `view`: the worst verdict of the model links behind it, and those verdicts. */
export function viewArrowVerdicts(
  view: Pick<C4View, 'relationships'>,
  comparison: C4PlanComparison,
): Map<string, { verdict: PlanVerdict; items: RelationshipVerdictItem[] }> {
  const out = new Map<string, { verdict: PlanVerdict; items: RelationshipVerdictItem[] }>();
  for (const rel of view.relationships) {
    const items = [...new Set(rel.linkIds.flatMap((id) => comparison.links.get(id) ?? []))];
    const verdict = worstVerdict(items.map((i) => i.verdict));
    if (verdict) out.set(rel.id, { verdict, items });
  }
  return out;
}

/** The marked boxes below `id`, all verdicts together. */
export function rollUpTotal(counts: VerdictCounts | undefined): number {
  if (!counts) return 0;
  return PLAN_VERDICTS.reduce((n, v) => n + counts[v], 0);
}
