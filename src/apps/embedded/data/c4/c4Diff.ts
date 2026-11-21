/**
 * c4Diff — what a changeset does to the C4 diagrams. Pure, no React.
 *
 * `diffC4(base, after, trace)` compares the C4 model of the model before a
 * changeset with the one after it (a staged changeset: the model, then the
 * model with it applied; an applied one: the model with it reverted, then the
 * model), using the overlay's trace (`overlayModel` in `modelOverlay.ts`) to
 * say which changes are behind each difference.
 *
 * Elements are matched across the two models by the model elements behind
 * them (UUID, else dotted id), not by C4 id: a rename changes the dotted id,
 * and with it the C4 id. Synthetic elements (the system, stand-in containers)
 * match by id. Ids in the diff are UNION ids: the after model's id, or, for an
 * element only the base has, its base id (`ghost:<id>` if the after model
 * reuses that id for something else). `unionIdOf` maps base ids to them.
 *
 * Element status, one per element, first that applies:
 *   added · removed · moved (its parent changed) · changed (a change to a
 *   model element behind it or folded onto it, or its name, description,
 *   technology, kind, sources or folded parts differ) · parts-changed (its
 *   children changed: one added, removed, or moved in or out)
 * Relationship status, per endpoint pair (union ids):
 *   added · removed · relabelled (its labels differ) · relinked (same labels,
 *   different model links behind it)
 *
 * `rollUp` counts, per element, the changed elements below it and the changed
 * arrows inside it, so a diagram above the change still shows it on the box
 * that holds it. Changes that reach no C4 element or arrow are `unshown`,
 * counted, never dropped; those that don't resolve or cancel out come through
 * from the trace (`unresolved`, `netted`).
 *
 * `unionC4` is the after model with the removed elements and arrows drawn back
 * in under their nearest surviving (or ghost) parent; `unionC4View` builds one
 * diagram of it with `buildC4View`'s scope and lifting rules, and a status per
 * drawn arrow.
 */

import type { OverlayTrace } from '../modelOverlay';
import type { C4Element, C4Model, C4Relationship } from './c4Model';
import { buildC4View, type C4Level, type C4View } from './c4Views';

export type C4ElementStatus = 'added' | 'removed' | 'moved' | 'changed' | 'parts-changed';
export type C4RelationshipStatus = 'added' | 'removed' | 'relabelled' | 'relinked';

export const C4_ELEMENT_STATUSES: readonly C4ElementStatus[] = ['added', 'removed', 'moved', 'changed', 'parts-changed'];
export const C4_RELATIONSHIP_STATUSES: readonly C4RelationshipStatus[] = ['added', 'removed', 'relabelled', 'relinked'];

export const GHOST_PREFIX = 'ghost:';

export interface C4ElementDiff {
  /** Union id. */
  id: string;
  status: C4ElementStatus;
  /** Its id in the base model (null: added). */
  baseId: string | null;
  /** Its id in the after model (null: removed). */
  afterId: string | null;
  /** Moved: the union id of its parent in the base model. */
  previousParentId?: string | null;
  /** Sequence numbers of the changes behind the difference, ascending. */
  sequences: number[];
}

export interface C4RelationshipDiff {
  /** `sourceId>targetId`, in union ids. */
  id: string;
  sourceId: string;
  targetId: string;
  status: C4RelationshipStatus;
  /** Labels after the changeset (removed: before it), most common first. */
  labels: string[];
  /** Labels before the changeset (empty: added). */
  baseLabels: string[];
  /** Model links behind the arrow, before and after. */
  linkIds: string[];
  sequences: number[];
}

export interface C4RollUp {
  /** Changed elements below this one. */
  elements: number;
  /** Changed arrows with both ends below this one. */
  relationships: number;
  /** The changes behind them, ascending. */
  sequences: number[];
}

export interface C4Diff {
  /** Union id → status, for every element that differs. */
  elements: Map<string, C4ElementDiff>;
  /** Union pair id → status, for every arrow that differs. */
  relationships: Map<string, C4RelationshipDiff>;
  /** Union id → what changed below it (only elements with something below). */
  rollUp: Map<string, C4RollUp>;
  /** Base C4 id → union id. */
  unionIdOf: Map<string, string>;
  /** Union id → union id of its parent (the after model's; a removed element's base parent). */
  parentOf: Map<string, string | null>;
  /** Elements per status, then arrows per status. */
  tally: { elements: Record<C4ElementStatus, number>; relationships: Record<C4RelationshipStatus, number> };
  /** Changes that reach no C4 element or arrow. */
  unshown: number[];
  /** Changes whose element (or a relationship end) isn't in the model. */
  unresolved: number[];
  /** Changes that cancel out (add then delete). */
  netted: number[];
}

const asc = (a: number, b: number) => a - b;
const sortedUnique = (values: Iterable<number>) => [...new Set(values)].sort(asc);

function emptyTally(): C4Diff['tally'] {
  return {
    elements: { added: 0, removed: 0, moved: 0, changed: 0, 'parts-changed': 0 },
    relationships: { added: 0, removed: 0, relabelled: 0, relinked: 0 },
  };
}

/** True when the diff shows nothing: no element or arrow differs and no change went unshown. */
export function isEmptyC4Diff(diff: C4Diff): boolean {
  return diff.elements.size === 0 && diff.relationships.size === 0 && diff.unshown.length === 0;
}

/** `id`, then each ancestor in the union hierarchy. */
export function diffAncestors(diff: C4Diff, id: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let current: string | null | undefined = id;
  while (current && !seen.has(current)) {
    out.push(current);
    seen.add(current);
    current = diff.parentOf.get(current);
  }
  return out;
}

/** Model element UUID → the C4 elements it is, or is folded onto. */
function c4ElementsOf(model: C4Model, nodeId: string): string[] {
  const direct = model.elementOf.get(nodeId);
  return direct ? [direct] : (model.anchorsOf.get(nodeId) ?? []);
}

const sameSet = (a: Iterable<string>, b: Iterable<string>) => {
  const x = new Set(a);
  const y = new Set(b);
  return x.size === y.size && [...x].every((v) => y.has(v));
};

const labelOrder = (labels: Record<string, number>) =>
  Object.entries(labels)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([l]) => l);

function propsDiffer(a: C4Element, b: C4Element): boolean {
  return (
    a.name !== b.name ||
    (a.description ?? '') !== (b.description ?? '') ||
    (a.technology ?? '') !== (b.technology ?? '') ||
    a.kind !== b.kind ||
    a.shape !== b.shape ||
    !sameSet(
      a.sources.map((s) => s.id),
      b.sources.map((s) => s.id),
    ) ||
    JSON.stringify(Object.entries(a.folded).sort()) !== JSON.stringify(Object.entries(b.folded).sort())
  );
}

/** Pair each after element with the base element it is, by shared sources (synthetic ones by id). */
function matchElements(base: C4Model, after: C4Model): Map<string, string> {
  const baseByRef = new Map<string, string>();
  for (const element of base.elements) for (const s of element.sources) baseByRef.set(s.ref, element.id);
  const pairs: Array<{ afterId: string; baseId: string; score: number }> = [];
  for (const element of after.elements) {
    if (element.synthetic) {
      if (base.byId.get(element.id)?.synthetic) pairs.push({ afterId: element.id, baseId: element.id, score: Infinity });
      continue;
    }
    const scores = new Map<string, number>();
    for (const s of element.sources) {
      const baseId = base.elementOf.get(s.id) ?? baseByRef.get(s.ref);
      if (baseId) scores.set(baseId, (scores.get(baseId) ?? 0) + 1);
    }
    for (const [baseId, score] of scores) pairs.push({ afterId: element.id, baseId, score });
  }
  pairs.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.afterId === b.baseId) - Number(a.afterId === a.baseId) ||
      a.afterId.localeCompare(b.afterId) ||
      a.baseId.localeCompare(b.baseId),
  );
  const afterOf = new Map<string, string>(); // baseId → afterId
  const taken = new Set<string>();
  for (const { afterId, baseId } of pairs) {
    if (afterOf.has(baseId) || taken.has(afterId)) continue;
    afterOf.set(baseId, afterId);
    taken.add(afterId);
  }
  return afterOf;
}

interface MergedRelationship {
  sourceId: string;
  targetId: string;
  labels: Record<string, number>;
  linkIds: Set<string>;
}

/** `relationships` with their ends renamed by `idOf`, merged per pair. */
function mapRelationships(relationships: readonly C4Relationship[], idOf: (id: string) => string): Map<string, MergedRelationship> {
  const out = new Map<string, MergedRelationship>();
  for (const rel of relationships) {
    const sourceId = idOf(rel.sourceId);
    const targetId = idOf(rel.targetId);
    if (sourceId === targetId) continue;
    const id = `${sourceId}>${targetId}`;
    let entry = out.get(id);
    if (!entry) out.set(id, (entry = { sourceId, targetId, labels: {}, linkIds: new Set() }));
    for (const [label, n] of Object.entries(rel.labels)) entry.labels[label] = (entry.labels[label] ?? 0) + n;
    for (const linkId of rel.linkIds) entry.linkIds.add(linkId);
  }
  return out;
}

export function diffC4(base: C4Model, after: C4Model, trace: OverlayTrace): C4Diff {
  // ── Match elements, give every element a union id ─────────────────────────
  const afterOf = base === after ? new Map(base.elements.map((e) => [e.id, e.id])) : matchElements(base, after);
  const unionIdOf = new Map<string, string>();
  for (const element of base.elements) {
    const matched = afterOf.get(element.id);
    unionIdOf.set(element.id, matched ?? (after.byId.has(element.id) ? `${GHOST_PREFIX}${element.id}` : element.id));
  }
  const baseOf = new Map<string, string>();
  for (const [baseId, afterId] of afterOf) baseOf.set(afterId, baseId);
  const fromBase = (id: string) => unionIdOf.get(id) ?? id;

  const parentOf = new Map<string, string | null>();
  for (const element of after.elements) parentOf.set(element.id, element.parentId);
  for (const element of base.elements) {
    const id = fromBase(element.id);
    if (!parentOf.has(id)) parentOf.set(id, element.parentId ? fromBase(element.parentId) : null);
  }

  // ── What each change touches ──────────────────────────────────────────────
  /** Union element id → sequences of changes to the model elements behind it or folded onto it. */
  const own = new Map<string, Set<number>>();
  const addOwn = (id: string, seq: number) => (own.get(id) ?? own.set(id, new Set()).get(id)!).add(seq);
  const endsOf = new Map<number, Set<string>>();
  const linkSeqs = new Map<string, Set<number>>();
  const relChanges: number[] = [];
  const shown = new Set<number>();
  for (const change of trace.changes) {
    const reached = new Set<string>();
    for (const nodeId of change.nodeIds) {
      for (const id of c4ElementsOf(after, nodeId)) reached.add(id);
      for (const id of c4ElementsOf(base, nodeId)) reached.add(fromBase(id));
    }
    if (change.kind === 'element') {
      for (const id of reached) addOwn(id, change.sequence);
      if (reached.size > 0) shown.add(change.sequence);
    } else {
      relChanges.push(change.sequence);
      endsOf.set(change.sequence, reached);
      for (const linkId of change.linkIds) (linkSeqs.get(linkId) ?? linkSeqs.set(linkId, new Set()).get(linkId)!).add(change.sequence);
    }
  }

  // ── Elements ──────────────────────────────────────────────────────────────
  const childrenIn = (model: C4Model, id: string, idOf: (x: string) => string) =>
    (model.childrenOf.get(id) ?? []).map(idOf);
  const elements = new Map<string, C4ElementDiff>();
  const statusSeqs = (id: string) => [...(own.get(id) ?? [])];
  for (const element of after.elements) {
    const baseId = baseOf.get(element.id) ?? null;
    const prior = baseId ? base.byId.get(baseId) : undefined;
    if (!prior) {
      elements.set(element.id, { id: element.id, status: 'added', baseId: null, afterId: element.id, sequences: statusSeqs(element.id) });
      continue;
    }
    const previousParentId = prior.parentId ? fromBase(prior.parentId) : null;
    let status: C4ElementStatus | null = null;
    if (previousParentId !== element.parentId) status = 'moved';
    else if ((own.get(element.id)?.size ?? 0) > 0 || propsDiffer(prior, element)) status = 'changed';
    else if (!sameSet(childrenIn(after, element.id, (x) => x), childrenIn(base, prior.id, fromBase))) status = 'parts-changed';
    if (!status) continue;
    elements.set(element.id, {
      id: element.id,
      status,
      baseId,
      afterId: element.id,
      ...(status === 'moved' ? { previousParentId } : {}),
      sequences: statusSeqs(element.id),
    });
  }
  for (const element of base.elements) {
    if (afterOf.has(element.id)) continue;
    const id = fromBase(element.id);
    elements.set(id, { id, status: 'removed', baseId: element.id, afterId: null, sequences: statusSeqs(id) });
  }

  // ── Relationships ─────────────────────────────────────────────────────────
  const afterRels = mapRelationships(after.relationships, (x) => x);
  const baseRels = mapRelationships(base.relationships, fromBase);
  const relationships = new Map<string, C4RelationshipDiff>();
  for (const id of new Set([...afterRels.keys(), ...baseRels.keys()])) {
    const a = afterRels.get(id);
    const b = baseRels.get(id);
    let status: C4RelationshipStatus | null;
    if (!b) status = 'added';
    else if (!a) status = 'removed';
    else if (!sameSet(Object.keys(a.labels), Object.keys(b.labels))) status = 'relabelled';
    else if (!sameSet(a.linkIds, b.linkIds)) status = 'relinked';
    else status = null;
    if (!status) continue;
    const linkIds = [...new Set([...(a?.linkIds ?? []), ...(b?.linkIds ?? [])])];
    const sequences = new Set<number>();
    for (const linkId of linkIds) for (const seq of linkSeqs.get(linkId) ?? []) sequences.add(seq);
    const { sourceId, targetId } = (a ?? b)!;
    if (sequences.size === 0 && (status === 'added' || status === 'removed')) {
      // Drawn or dropped with an end the changeset adds or removes.
      for (const end of [sourceId, targetId]) {
        const endDiff = elements.get(end);
        if (endDiff?.status === status) for (const seq of endDiff.sequences) sequences.add(seq);
      }
    }
    for (const seq of sequences) shown.add(seq);
    relationships.set(id, {
      id,
      sourceId,
      targetId,
      status,
      labels: labelOrder((a ?? b)!.labels),
      baseLabels: b ? labelOrder(b.labels) : [],
      linkIds,
      sequences: [...sequences].sort(asc),
    });
  }

  // A relationship change no arrow shows (structure, a fold) is behind its ends' difference.
  for (const seq of relChanges) {
    if (shown.has(seq)) continue;
    for (const end of endsOf.get(seq) ?? []) {
      const endDiff = elements.get(end);
      if (!endDiff) continue;
      if (!endDiff.sequences.includes(seq)) endDiff.sequences.push(seq);
      shown.add(seq);
    }
  }
  for (const diff of elements.values()) diff.sequences.sort(asc);

  // ── Roll-up onto ancestors ────────────────────────────────────────────────
  const ancestorsAbove = (id: string) => {
    const out: string[] = [];
    const seen = new Set<string>([id]);
    let current = parentOf.get(id) ?? null;
    while (current && !seen.has(current)) {
      out.push(current);
      seen.add(current);
      current = parentOf.get(current) ?? null;
    }
    return out;
  };
  const rollSets = new Map<string, { elements: number; relationships: number; sequences: Set<number> }>();
  const roll = (id: string) =>
    rollSets.get(id) ?? rollSets.set(id, { elements: 0, relationships: 0, sequences: new Set() }).get(id)!;
  for (const diff of elements.values()) {
    for (const ancestor of ancestorsAbove(diff.id)) {
      const entry = roll(ancestor);
      entry.elements++;
      for (const seq of diff.sequences) entry.sequences.add(seq);
    }
  }
  for (const diff of relationships.values()) {
    const targetAbove = new Set(ancestorsAbove(diff.targetId));
    for (const ancestor of ancestorsAbove(diff.sourceId)) {
      if (!targetAbove.has(ancestor)) continue;
      const entry = roll(ancestor);
      entry.relationships++;
      for (const seq of diff.sequences) entry.sequences.add(seq);
    }
  }
  const rollUp = new Map<string, C4RollUp>();
  for (const [id, entry] of rollSets) rollUp.set(id, { ...entry, sequences: [...entry.sequences].sort(asc) });

  const tally = emptyTally();
  for (const diff of elements.values()) tally.elements[diff.status]++;
  for (const diff of relationships.values()) tally.relationships[diff.status]++;

  return {
    elements,
    relationships,
    rollUp,
    unionIdOf,
    parentOf,
    tally,
    unshown: sortedUnique(trace.changes.map((c) => c.sequence).filter((seq) => !shown.has(seq))),
    unresolved: sortedUnique(trace.unresolved),
    netted: sortedUnique(trace.netted),
  };
}

// ─── The union model and its diagrams ───────────────────────────────────────

const byName = (a: C4Element, b: C4Element) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

/** The after model's elements plus the removed ones (as ghosts), with `relationships` as given. */
function unionOf(base: C4Model, after: C4Model, diff: C4Diff, relationships: C4Relationship[]): C4Model {
  const ghosts: C4Element[] = [];
  for (const element of base.elements) {
    const id = diff.unionIdOf.get(element.id) ?? element.id;
    if (diff.elements.get(id)?.status !== 'removed') continue;
    ghosts.push({ ...element, id, parentId: diff.parentOf.get(id) ?? null });
  }
  const elements = ghosts.length > 0 ? [...after.elements, ...ghosts].sort(byName) : after.elements;
  const byId = new Map(elements.map((e) => [e.id, e]));
  const childrenOf = new Map<string, string[]>();
  for (const element of elements) {
    if (!element.parentId) continue;
    (childrenOf.get(element.parentId) ?? childrenOf.set(element.parentId, []).get(element.parentId)!).push(element.id);
  }
  const elementOf = new Map(after.elementOf);
  for (const [nodeId, id] of base.elementOf) if (!elementOf.has(nodeId)) elementOf.set(nodeId, diff.unionIdOf.get(id) ?? id);
  const anchorsOf = new Map(after.anchorsOf);
  for (const [nodeId, ids] of base.anchorsOf) {
    if (!anchorsOf.has(nodeId) && !elementOf.has(nodeId)) anchorsOf.set(nodeId, ids.map((id) => diff.unionIdOf.get(id) ?? id));
  }
  return { ...after, elements, byId, childrenOf, relationships, elementOf, anchorsOf };
}

function toRelationships(merged: Map<string, MergedRelationship>): C4Relationship[] {
  return [...merged].map(([id, m]) => ({
    id,
    sourceId: m.sourceId,
    targetId: m.targetId,
    labels: m.labels,
    linkIds: [...m.linkIds],
    derivedBy: [],
  }));
}

/**
 * The model to draw: the after model plus the elements and arrows the
 * changeset removes, in union ids, each removed element under its base parent.
 * The after model itself when nothing was removed.
 */
export function unionC4(base: C4Model, after: C4Model, diff: C4Diff): C4Model {
  const removedElements = [...diff.elements.values()].some((d) => d.status === 'removed');
  const removedRels = [...diff.relationships.values()].filter((d) => d.status === 'removed');
  if (!removedElements && removedRels.length === 0) return after;
  const baseRels = mapRelationships(base.relationships, (id) => diff.unionIdOf.get(id) ?? id);
  const ghostRels = toRelationships(
    new Map(removedRels.flatMap((d) => (baseRels.has(d.id) ? [[d.id, baseRels.get(d.id)!] as const] : []))),
  );
  return unionOf(base, after, diff, [...after.relationships, ...ghostRels]);
}

/** A drawn arrow's difference, in view ids. */
export interface C4ViewRelationshipDiff {
  status: C4RelationshipStatus;
  /** Labels before the changeset (empty: added). */
  baseLabels: string[];
  sequences: number[];
}

/** One diagram of the union model, with a status per drawn arrow. View element ids are union ids: read `diff.elements` / `diff.rollUp` for theirs. */
export interface C4DiffView extends C4View {
  relationshipDiff: Map<string, C4ViewRelationshipDiff>;
}

/**
 * One diagram of what the changeset does: `buildC4View`'s level, scope and
 * lifting rules over the union model, drawn once with the after model's arrows
 * and once with the base model's, then merged. An arrow only the after side
 * draws is added, only the base side removed; one both draw is relabelled or
 * relinked when its labels or links differ. A Component diagram shows the
 * outside elements either side links to. `scopeId` is a union id.
 */
export function unionC4View(
  base: C4Model,
  after: C4Model,
  diff: C4Diff,
  level: C4Level,
  scopeId: string | null = null,
): C4DiffView {
  if (base === after) return { ...buildC4View(after, level, scopeId), relationshipDiff: new Map() };
  const afterSide = unionOf(base, after, diff, after.relationships);
  const baseSide = unionOf(base, after, diff, toRelationships(mapRelationships(base.relationships, (id) => diff.unionIdOf.get(id) ?? id)));
  let viewA = buildC4View(afterSide, level, scopeId);
  let viewB = buildC4View(baseSide, level, scopeId);
  // A Component diagram caps its outsiders by link count, and each side would rank its own: a change
  // that moves one outsider into the top few and another out would mark their unchanged arrows added
  // and removed. Rank both sides by their combined links, so both leave the same outsiders off.
  if (viewA.outsideDegree && viewB.outsideDegree) {
    const outsideDegree = new Map(viewA.outsideDegree);
    for (const [id, n] of viewB.outsideDegree) outsideDegree.set(id, (outsideDegree.get(id) ?? 0) + n);
    viewA = buildC4View(afterSide, level, scopeId, { outsideDegree });
    viewB = buildC4View(baseSide, level, scopeId, { outsideDegree });
  }

  const shownIds = new Set(viewA.elements.map((e) => e.id));
  const elements = [...viewA.elements, ...viewB.elements.filter((e) => !shownIds.has(e.id))];

  const seqsOf = (linkIds: Iterable<string>) => {
    const links = new Set(linkIds);
    const out = new Set<number>();
    for (const rel of diff.relationships.values()) {
      if (rel.linkIds.some((l) => links.has(l))) for (const seq of rel.sequences) out.add(seq);
    }
    return [...out].sort(asc);
  };
  const baseById = new Map(viewB.relationships.map((r) => [r.id, r]));
  const relationshipDiff = new Map<string, C4ViewRelationshipDiff>();
  const relationships = [...viewA.relationships];
  for (const rel of viewA.relationships) {
    const prior = baseById.get(rel.id);
    let status: C4RelationshipStatus | null;
    if (!prior) status = 'added';
    else if (!sameSet(rel.labels, prior.labels)) status = 'relabelled';
    else if (!sameSet(rel.linkIds, prior.linkIds)) status = 'relinked';
    else status = null;
    if (!status) continue;
    // An arrow drawn with an end the changeset adds carries that end's changes.
    let sequences = seqsOf([...rel.linkIds, ...(prior?.linkIds ?? [])]);
    if (sequences.length === 0 && status === 'added') {
      sequences = sortedUnique([rel.sourceId, rel.targetId].flatMap((end) => (diff.elements.get(end)?.status === 'added' ? diff.elements.get(end)!.sequences : [])));
    }
    relationshipDiff.set(rel.id, { status, baseLabels: prior?.labels ?? [], sequences });
  }
  const drawn = new Set(viewA.relationships.map((r) => r.id));
  for (const rel of viewB.relationships) {
    if (drawn.has(rel.id)) continue;
    relationships.push(rel);
    let sequences = seqsOf(rel.linkIds);
    if (sequences.length === 0) {
      sequences = sortedUnique([rel.sourceId, rel.targetId].flatMap((end) => (diff.elements.get(end)?.status === 'removed' ? diff.elements.get(end)!.sequences : [])));
    }
    relationshipDiff.set(rel.id, { status: 'removed', baseLabels: rel.labels, sequences });
  }
  relationships.sort((a, b) => a.id.localeCompare(b.id));

  return {
    ...viewA,
    elements,
    relationships,
    hiddenOutside: viewA.hiddenOutside,
    relationshipDiff,
  };
}
