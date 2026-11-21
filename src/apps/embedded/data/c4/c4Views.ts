/**
 * c4Views — one C4 diagram out of a `C4Model`: a level and a scope in, the
 * boxes and arrows to draw out. Pure.
 *
 *  - Context:    the system as one box, with the people and external systems.
 *  - Container:  the system's containers inside its boundary, same outside.
 *  - Component:  the parts of one container or component inside its boundary,
 *                and the elements outside it that they are linked to.
 *
 * An element outside the scope is lifted to its nearest ancestor that is not
 * also an ancestor of the scope, so a diagram of `Graph Canvas` shows
 * `Changeset Canvas` once, not each of its parts. Relationships are lifted
 * with their ends and merged per pair, keeping their labels, a link count and
 * the model links behind them.
 *
 * Context and Container diagrams show every person and external system, linked
 * or not: an actor the model names but never connects is still context, and
 * the missing arrow is itself information. A Component diagram shows only what
 * its parts are linked to, capped at `OUTSIDE_CAP` (the most linked first).
 */

import { C4_SYSTEM_ID, c4Ancestors, type C4Element, type C4Model } from './c4Model';
import type { C4Level } from './c4Level';

export { C4_LEVELS, parseC4Level, type C4Level } from './c4Level';

/** Outside elements drawn on a Component diagram before the rest are summed up. */
export const OUTSIDE_CAP = 12;

export interface C4ViewElement {
  id: string;
  element: C4Element;
  /** Inside the boundary (or, on a Context diagram, the system itself). */
  inScope: boolean;
  /** Has parts of its own, so it opens as a diagram. */
  drillable: boolean;
  childCount: number;
}

export interface C4ViewRelationship {
  /** `sourceId>targetId`, in view element ids. */
  id: string;
  sourceId: string;
  targetId: string;
  /** Arrow labels, most common first. */
  labels: string[];
  /** Model links behind the arrow. */
  count: number;
  linkIds: string[];
}

export interface C4View {
  level: C4Level;
  /** The element whose parts are shown; null on a Context diagram. */
  scope: C4Element | null;
  elements: C4ViewElement[];
  relationships: C4ViewRelationship[];
  /** The scope's ancestors, outermost first, then the scope: the breadcrumb. */
  trail: C4Element[];
  /** Outside elements left off a Component diagram by `OUTSIDE_CAP`. */
  hiddenOutside: number;
  /** On a Component diagram: each linked outside element and the links it has into the scope (its rank). */
  outsideDegree?: ReadonlyMap<string, number>;
}

export interface C4ViewOptions {
  /**
   * Rank a Component diagram's outside elements by these link counts instead of the view's own, so two
   * views of the same scope (a changeset's before and after) leave the same outsiders off.
   */
  outsideDegree?: ReadonlyMap<string, number>;
}

/** The level a scope id stands for (null: Context; the system: Container). */
export function levelOfScope(scopeId: string | null): C4Level {
  if (!scopeId) return 'context';
  return scopeId === C4_SYSTEM_ID ? 'container' : 'component';
}

/** Whether `id` has parts, so it can be a diagram's scope. */
export function isDrillable(model: C4Model, id: string): boolean {
  return (model.childrenOf.get(id)?.length ?? 0) > 0;
}

/**
 * The scope a Component diagram opens on when none is given: the container
 * holding the most components.
 */
export function defaultComponentScope(model: C4Model): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const id of model.childrenOf.get(C4_SYSTEM_ID) ?? []) {
    const count = model.childrenOf.get(id)?.length ?? 0;
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The scope actually drawn for a requested level and scope: an unknown or
 * part-less scope falls back to the default, and to the Container diagram when
 * the model has no components at all.
 */
export function resolveScope(model: C4Model, level: C4Level, scopeId: string | null): string | null {
  if (level === 'context') return null;
  if (level === 'container') return C4_SYSTEM_ID;
  if (scopeId && scopeId !== C4_SYSTEM_ID && isDrillable(model, scopeId)) return scopeId;
  return defaultComponentScope(model) ?? C4_SYSTEM_ID;
}

const toViewElement = (model: C4Model, element: C4Element, inScope: boolean): C4ViewElement => {
  const childCount = model.childrenOf.get(element.id)?.length ?? 0;
  return { id: element.id, element, inScope, drillable: childCount > 0, childCount };
};

export function buildC4View(
  model: C4Model,
  level: C4Level,
  scopeId: string | null = null,
  options: C4ViewOptions = {},
): C4View {
  const resolved = resolveScope(model, level, scopeId);
  const actualLevel = levelOfScope(resolved);
  const scope = resolved ? (model.byId.get(resolved) ?? null) : null;

  const insideIds = resolved ? (model.childrenOf.get(resolved) ?? []) : [C4_SYSTEM_ID];
  const inside = new Set(insideIds);
  const scopeChain = new Set(resolved ? c4Ancestors(model, resolved) : []);

  /** The view element a model-wide element shows as, or null when it is the scope (or above it). */
  const lift = (id: string): string | null => {
    const chain = c4Ancestors(model, id);
    const within = chain.find((x) => inside.has(x));
    if (within) return within;
    let best: string | null = null;
    for (const x of chain) {
      if (scopeChain.has(x)) break;
      best = x;
    }
    return best;
  };

  const merged = new Map<string, { sourceId: string; targetId: string; labels: Map<string, number>; linkIds: Set<string> }>();
  const degree = new Map<string, number>();
  for (const rel of model.relationships) {
    const a = lift(rel.sourceId);
    const b = lift(rel.targetId);
    if (!a || !b || a === b) continue;
    if (!inside.has(a) && !inside.has(b)) continue; // an arrow between two outsiders says nothing about the scope
    const id = `${a}>${b}`;
    let entry = merged.get(id);
    if (!entry) merged.set(id, (entry = { sourceId: a, targetId: b, labels: new Map(), linkIds: new Set() }));
    for (const [label, n] of Object.entries(rel.labels)) entry.labels.set(label, (entry.labels.get(label) ?? 0) + n);
    for (const linkId of rel.linkIds) entry.linkIds.add(linkId);
    for (const end of [a, b]) if (!inside.has(end)) degree.set(end, (degree.get(end) ?? 0) + rel.linkIds.length);
  }

  // Outside elements: everyone at the top two levels, the linked ones (capped) below.
  let outsideIds: string[];
  let hiddenOutside = 0;
  if (actualLevel === 'component') {
    const rank = options.outsideDegree ?? degree;
    const ranked = [...rank.keys()].sort(
      (a, b) => (rank.get(b) ?? 0) - (rank.get(a) ?? 0) || a.localeCompare(b),
    );
    outsideIds = ranked.slice(0, OUTSIDE_CAP);
    hiddenOutside = ranked.length - outsideIds.length;
  } else {
    outsideIds = model.elements
      .filter((e) => e.kind === 'person' || e.kind === 'external-system')
      .map((e) => e.id);
  }
  const shown = new Set([...insideIds, ...outsideIds]);

  const elements: C4ViewElement[] = [];
  for (const id of insideIds) {
    const element = model.byId.get(id);
    if (element) elements.push(toViewElement(model, element, true));
  }
  for (const id of outsideIds) {
    const element = model.byId.get(id);
    if (element) elements.push(toViewElement(model, element, false));
  }

  const relationships: C4ViewRelationship[] = [];
  for (const [id, entry] of merged) {
    if (!shown.has(entry.sourceId) || !shown.has(entry.targetId)) continue;
    const labels = [...entry.labels.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([l]) => l);
    relationships.push({
      id,
      sourceId: entry.sourceId,
      targetId: entry.targetId,
      labels,
      count: entry.linkIds.size,
      linkIds: [...entry.linkIds],
    });
  }
  relationships.sort((a, b) => a.id.localeCompare(b.id));

  const trail = resolved
    ? c4Ancestors(model, resolved)
        .reverse()
        .map((id) => model.byId.get(id))
        .filter((e): e is C4Element => !!e)
    : [];

  return {
    level: actualLevel,
    scope,
    elements,
    relationships,
    trail,
    hiddenOutside,
    ...(actualLevel === 'component' ? { outsideDegree: degree } : {}),
  };
}

/** A stable key for a view's content: same key, same drawing. */
export function c4ViewKey(view: C4View): string {
  return [
    view.level,
    view.scope?.id ?? '',
    view.elements.map((e) => `${e.id}${e.inScope ? '' : '~'}`).join(','),
    view.relationships.map((r) => `${r.id}:${r.labels.join('/')}:${r.count}`).join(','),
  ].join('|');
}

/** One row of the nav tree's Architecture section. */
export interface C4NavRow {
  id: string;
  name: string;
  /** 0 for a container, 1 for its drillable parts, and so on. */
  depth: number;
  childCount: number;
}

/** Every element that opens as a Component diagram, as the model nests them, A–Z per parent. */
export function c4NavRows(model: C4Model): C4NavRow[] {
  const rows: C4NavRow[] = [];
  const walk = (parentId: string, depth: number) => {
    for (const id of model.childrenOf.get(parentId) ?? []) {
      const childCount = model.childrenOf.get(id)?.length ?? 0;
      if (childCount === 0) continue;
      rows.push({ id, name: model.byId.get(id)?.name ?? id, depth, childCount });
      walk(id, depth + 1);
    }
  };
  walk(C4_SYSTEM_ID, 0);
  return rows;
}
