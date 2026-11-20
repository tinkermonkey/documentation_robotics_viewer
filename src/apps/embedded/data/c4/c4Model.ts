/**
 * c4Model — a DR model read as a C4 model: people, the software system,
 * external systems, containers and components, with the relationships between
 * them. Pure: `/api/model` in, `C4Model` out, by the rules in `c4Rules.ts`.
 *
 * Every element and relationship keeps the model elements and links it came
 * from (`sources`, `linkIds`), so a box opens what is behind it and nothing is
 * drawn that the model doesn't hold. Model elements that are not C4 elements
 * are folded onto the ones they test, realize or access (`anchorsOf`); what no
 * rule places is counted in `unplaced`, never dropped silently.
 *
 * What the model does not say, this does not guess:
 *  - The system has no element of its own in the DR spec, so it is one
 *    synthetic box named by the caller (`systemName`).
 *  - A component with no owner goes into the one application container the
 *    model has. With none, a synthetic container stands in; with several, the
 *    unowned components go to an "Unassigned" container and an issue says so.
 */

import type { ModelDerived, ModelNode } from '../useModel';
import { buildModelIndex, dottedId, resolveEndpoint, type ModelIndex } from '../modelGraph';
import {
  C4_RULES,
  FOLD_DEPTH,
  MERGE_BY_NAME,
  checkRules,
  type AttributeGuard,
  type C4Kind,
  type C4RuleSet,
  type DerivedLeg,
  type SpecCatalog,
} from './c4Rules';

export type { C4Kind } from './c4Rules';

export const C4_SYSTEM_ID = 'system';
/** The stand-in application container of a model that has none. */
export const C4_APP_CONTAINER_ID = 'container:app';
/** Where unowned components go when the model has several application containers. */
export const C4_UNASSIGNED_ID = 'container:unassigned';

export const DEFAULT_SYSTEM_NAME = 'Software system';

/** A model element behind a C4 element. */
export interface C4Source {
  /** The element's UUID, as `/api/model` sends it. */
  id: string;
  /** Its dotted id, `layer.type.slug`. */
  ref: string;
  name: string;
  layerId: string;
  type: string;
}

export interface C4Element {
  /** The dotted id of its first source, or a `C4_*_ID` for a synthetic element. */
  id: string;
  kind: C4Kind;
  name: string;
  description?: string;
  /** Technology line: an attribute of the source, then the system software serving it. */
  technology?: string;
  shape?: 'datastore';
  parentId: string | null;
  sources: C4Source[];
  /** Model elements folded onto this one, counted by spec node type id. */
  folded: Record<string, number>;
  /** Not a model element: the system, or a stand-in container. */
  synthetic?: boolean;
}

export interface C4Relationship {
  /** `sourceId>targetId`. */
  id: string;
  sourceId: string;
  targetId: string;
  /** Arrow label → how many model links carry it. */
  labels: Record<string, number>;
  /** The model links behind the arrow. */
  linkIds: string[];
  /** Ids of the derived rules that produced it (empty for a direct link). */
  derivedBy: string[];
}

export interface C4Model {
  systemId: string;
  elements: C4Element[];
  byId: Map<string, C4Element>;
  /** Children per parent id, A–Z. */
  childrenOf: Map<string, string[]>;
  relationships: C4Relationship[];
  /** Model element UUID → the C4 element it is. */
  elementOf: Map<string, string>;
  /** Model element UUID → the C4 elements it is folded onto. */
  anchorsOf: Map<string, string[]>;
  /** Model elements no rule placed. */
  unplaced: { total: number; byType: Record<string, number> };
  /** Rules the spec doesn't support, and placements the model left open. */
  issues: string[];
}

export interface BuildC4Options {
  /** The system's name (the model's project name, when the caller has it). */
  systemName?: string;
  /** The loaded spec's catalog; rules it doesn't support are left out and reported. */
  catalog?: SpecCatalog | null;
  rules?: C4RuleSet;
  index?: ModelIndex;
}

interface ResolvedLink {
  id: string;
  predicate: string;
  source: ModelNode;
  target: ModelNode;
}

const typeOf = (node: ModelNode): string => `${node.layer_id}.${node.type}`;

function passes(node: ModelNode, guard: AttributeGuard | undefined): boolean {
  if (!guard) return true;
  const raw = node.attributes?.[guard.attribute];
  // An attribute the element doesn't carry satisfies no guard: an actor of
  // unknown type is neither a person nor an external system.
  if (typeof raw !== 'string' && typeof raw !== 'number') return false;
  const value = String(raw);
  if (guard.in && !guard.in.includes(value)) return false;
  if (guard.notIn && guard.notIn.includes(value)) return false;
  return true;
}

const sourceOf = (node: ModelNode): C4Source => ({
  id: node.id,
  ref: dottedId(node),
  name: node.name,
  layerId: node.layer_id,
  type: node.type,
});

const byName = (a: C4Element, b: C4Element) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

export function buildC4Model(model: ModelDerived, options: BuildC4Options = {}): C4Model {
  const index = options.index ?? buildModelIndex(model);
  const { rules, issues } = checkRules(options.rules ?? C4_RULES, options.catalog ?? null);

  const links: ResolvedLink[] = [];
  for (const link of model.links) {
    const source = resolveEndpoint(index, link.source);
    const target = resolveEndpoint(index, link.target);
    if (source && target) links.push({ id: link.id, predicate: link.type, source, target });
  }

  // ── 1. Elements ───────────────────────────────────────────────────────────
  const byId = new Map<string, C4Element>();
  const elementOf = new Map<string, string>();
  const mergeKeys = new Map<string, string>();

  for (const node of model.nodes) {
    const type = typeOf(node);
    const rule = rules.elements.find((r) => r.type === type && passes(node, r.when));
    if (!rule) continue;
    const mergeKey = MERGE_BY_NAME.includes(rule.kind) ? `${rule.kind}:${node.name.trim().toLowerCase()}` : null;
    const existing = mergeKey ? mergeKeys.get(mergeKey) : undefined;
    if (existing) {
      byId.get(existing)!.sources.push(sourceOf(node));
      elementOf.set(node.id, existing);
      continue;
    }
    const id = dottedId(node);
    if (byId.has(id)) {
      // Two elements with one dotted id (same layer, type and name): one box.
      byId.get(id)!.sources.push(sourceOf(node));
      elementOf.set(node.id, id);
      continue;
    }
    const attribute = rule.technologyFrom ? node.attributes?.[rule.technologyFrom] : undefined;
    const technology =
      typeof attribute === 'string' && attribute ? `${attribute}${rule.technologySuffix ?? ''}` : undefined;
    byId.set(id, {
      id,
      kind: rule.kind,
      name: node.name,
      description: node.description || undefined,
      technology,
      shape: rule.shape,
      parentId: null,
      sources: [sourceOf(node)],
      folded: {},
    });
    elementOf.set(node.id, id);
    if (mergeKey) mergeKeys.set(mergeKey, id);
  }

  // ── 2. Identity: two elements that are one ────────────────────────────────
  for (const link of links) {
    const rule = rules.identities.find((r) => r.predicate === link.predicate);
    if (!rule) continue;
    const from = elementOf.get(link.source.id);
    const into = elementOf.get(link.target.id);
    if (!from || !into || from === into) continue;
    const a = byId.get(from)!;
    const b = byId.get(into)!;
    if (a.kind !== rule.kind || b.kind !== rule.kind) continue;
    b.sources.push(...a.sources);
    for (const [nodeId, elementId] of elementOf) if (elementId === from) elementOf.set(nodeId, into);
    byId.delete(from);
  }

  // ── 3. Containment ────────────────────────────────────────────────────────
  const system: C4Element = {
    id: C4_SYSTEM_ID,
    kind: 'system',
    name: options.systemName?.trim() || DEFAULT_SYSTEM_NAME,
    parentId: null,
    sources: [],
    folded: {},
    synthetic: true,
  };
  for (const element of byId.values()) if (element.kind === 'container') element.parentId = C4_SYSTEM_ID;

  /** `id`, its parent, its parent's parent, … (components only; stops at the container). */
  const chain = (id: string): string[] => {
    const out: string[] = [];
    const seen = new Set<string>();
    let current: C4Element | undefined = byId.get(id);
    while (current && !seen.has(current.id)) {
      out.push(current.id);
      seen.add(current.id);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return out;
  };
  const ends = (link: ResolvedLink, parent: 'source' | 'target') => {
    const parentNode = parent === 'source' ? link.source : link.target;
    const childNode = parent === 'source' ? link.target : link.source;
    const parentEl = byId.get(elementOf.get(parentNode.id) ?? '');
    const childEl = byId.get(elementOf.get(childNode.id) ?? '');
    if (!parentEl || !childEl || parentEl === childEl) return null;
    if (parentEl.kind !== 'component' || childEl.kind !== 'component') return null;
    return { parentEl, childEl };
  };

  for (const rule of rules.containment) {
    const matching = links.filter(
      (l) => l.predicate === rule.predicate && typeOf(l.source) === rule.sourceType && typeOf(l.target) === rule.targetType,
    );
    if (rule.mode === 'strict') {
      for (const link of matching) {
        const pair = ends(link, rule.parent);
        if (!pair || pair.childEl.parentId) continue;
        if (chain(pair.parentEl.id).includes(pair.childEl.id)) continue; // would close a cycle
        pair.childEl.parentId = pair.parentEl.id;
      }
      continue;
    }
    // shared: every parent that claims the child, then their nearest common ancestor
    const claims = new Map<string, Set<string>>();
    for (const link of matching) {
      const pair = ends(link, rule.parent);
      if (!pair || pair.childEl.parentId) continue;
      let set = claims.get(pair.childEl.id);
      if (!set) claims.set(pair.childEl.id, (set = new Set()));
      set.add(pair.parentEl.id);
    }
    for (const [childId, parents] of claims) {
      const chains = [...parents].map(chain);
      const common = chains[0].find((id) => chains.every((c) => c.includes(id)));
      if (!common || chain(common).includes(childId)) continue;
      byId.get(childId)!.parentId = common;
    }
  }

  // Components nothing owns go to the application container.
  const appContainers = [...byId.values()].filter((e) => e.kind === 'container' && !e.shape);
  const unowned = [...byId.values()].filter((e) => e.kind === 'component' && !e.parentId);
  if (unowned.length > 0) {
    let home: C4Element;
    if (appContainers.length === 1) {
      home = appContainers[0];
    } else if (appContainers.length === 0) {
      home = {
        id: C4_APP_CONTAINER_ID,
        kind: 'container',
        name: system.name,
        parentId: C4_SYSTEM_ID,
        sources: [],
        folded: {},
        synthetic: true,
      };
      byId.set(home.id, home);
      issues.push('the model has no application container, so its components sit in a stand-in one');
    } else {
      home = {
        id: C4_UNASSIGNED_ID,
        kind: 'container',
        name: 'Unassigned',
        parentId: C4_SYSTEM_ID,
        sources: [],
        folded: {},
        synthetic: true,
      };
      byId.set(home.id, home);
      issues.push(
        `the model has ${appContainers.length} application containers and nothing says which one ${unowned.length} components belong to`,
      );
    }
    for (const element of unowned) element.parentId = home.id;
  }
  byId.set(C4_SYSTEM_ID, system);

  // ── 4. Folds ──────────────────────────────────────────────────────────────
  const anchors = new Map<string, Set<string>>();
  const technology = new Map<string, Set<string>>();
  const technologyNodes = new Set<string>();
  const resolve = (node: ModelNode): string[] => {
    const direct = elementOf.get(node.id);
    return direct ? [direct] : [...(anchors.get(node.id) ?? [])];
  };
  const nodeById = new Map(model.nodes.map((n) => [n.id, n]));

  for (let depth = 1; depth <= FOLD_DEPTH; depth++) {
    const additions: Array<[string, string]> = [];
    for (const link of links) {
      for (const rule of rules.folds) {
        if (rule.predicate !== link.predicate) continue;
        const folded = rule.folded === 'source' ? link.source : link.target;
        const other = rule.folded === 'source' ? link.target : link.source;
        if (elementOf.has(folded.id)) continue;
        if (rule.types && !rule.types.includes(typeOf(folded))) continue;
        if (rule.technology) {
          const target = depth === 1 ? elementOf.get(other.id) : undefined;
          if (!target) continue;
          let names = technology.get(target);
          if (!names) technology.set(target, (names = new Set()));
          names.add(folded.name);
          technologyNodes.add(folded.id);
          continue;
        }
        if (technologyNodes.has(other.id)) continue; // nothing folds through system software
        for (const target of resolve(other)) {
          if (!anchors.get(folded.id)?.has(target)) additions.push([folded.id, target]);
        }
      }
    }
    if (additions.length === 0) break;
    for (const [nodeId, target] of additions) {
      let set = anchors.get(nodeId);
      if (!set) anchors.set(nodeId, (set = new Set()));
      set.add(target);
    }
  }
  /** Depth-1 anchors only are trusted to stand for a node in a derived rule. */
  const directAnchors = new Map<string, Set<string>>();
  for (const link of links) {
    for (const rule of rules.folds) {
      if (rule.predicate !== link.predicate || rule.technology) continue;
      const folded = rule.folded === 'source' ? link.source : link.target;
      const other = rule.folded === 'source' ? link.target : link.source;
      const target = elementOf.get(other.id);
      if (!target || elementOf.has(folded.id)) continue;
      if (rule.types && !rule.types.includes(typeOf(folded))) continue;
      let set = directAnchors.get(folded.id);
      if (!set) directAnchors.set(folded.id, (set = new Set()));
      set.add(target);
    }
  }

  for (const [nodeId, targets] of anchors) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    const type = typeOf(node);
    for (const target of targets) {
      const element = byId.get(target);
      if (element) element.folded[type] = (element.folded[type] ?? 0) + 1;
    }
  }
  for (const [elementId, names] of technology) {
    const element = byId.get(elementId);
    if (!element) continue;
    const list = [...names].sort((a, b) => a.localeCompare(b));
    element.technology = [element.technology, ...list].filter(Boolean).join(', ');
  }

  // ── 5. Relationships ──────────────────────────────────────────────────────
  const relationships = new Map<string, C4Relationship>();
  const addRelationship = (sourceId: string, targetId: string, label: string, linkIds: string[], rule?: string) => {
    if (sourceId === targetId) return;
    const id = `${sourceId}>${targetId}`;
    let rel = relationships.get(id);
    if (!rel) relationships.set(id, (rel = { id, sourceId, targetId, labels: {}, linkIds: [], derivedBy: [] }));
    rel.labels[label] = (rel.labels[label] ?? 0) + 1;
    for (const linkId of linkIds) if (!rel.linkIds.includes(linkId)) rel.linkIds.push(linkId);
    if (rule && !rel.derivedBy.includes(rule)) rel.derivedBy.push(rule);
  };

  for (const link of links) {
    const rule = rules.relationships.find((r) => r.predicate === link.predicate);
    if (!rule) continue;
    const source = elementOf.get(link.source.id);
    const target = elementOf.get(link.target.id);
    if (!source || !target) continue;
    if (rule.direction === 'flip') addRelationship(target, source, rule.label ?? link.predicate, [link.id]);
    else addRelationship(source, target, rule.label ?? link.predicate, [link.id]);
  }

  // ── 6. Derived relationships ──────────────────────────────────────────────
  const linksAt = new Map<string, ResolvedLink[]>();
  for (const link of links) {
    for (const nodeId of [link.source.id, link.target.id]) {
      let list = linksAt.get(nodeId);
      if (!list) linksAt.set(nodeId, (list = []));
      list.push(link);
    }
  }
  const farEnds = (via: ModelNode, leg: DerivedLeg): Array<{ elementId: string; linkId: string }> => {
    const out: Array<{ elementId: string; linkId: string }> = [];
    for (const link of linksAt.get(via.id) ?? []) {
      if (link.predicate !== leg.predicate) continue;
      const viaNode = leg.viaEnd === 'source' ? link.source : link.target;
      if (viaNode.id !== via.id) continue;
      const far = leg.viaEnd === 'source' ? link.target : link.source;
      const direct = elementOf.get(far.id);
      const targets = direct ? [direct] : [...(directAnchors.get(far.id) ?? [])];
      for (const elementId of targets) {
        const element = byId.get(elementId);
        if (!element || (leg.kinds && !leg.kinds.includes(element.kind))) continue;
        out.push({ elementId, linkId: link.id });
      }
    }
    return out;
  };
  for (const rule of rules.derived) {
    for (const via of model.nodes) {
      if (!rule.via.includes(typeOf(via)) || elementOf.has(via.id)) continue;
      const from = farEnds(via, rule.from);
      if (from.length === 0) continue;
      const to = farEnds(via, rule.to);
      for (const a of from) {
        for (const b of to) addRelationship(a.elementId, b.elementId, rule.label, [a.linkId, b.linkId], rule.id);
      }
    }
  }

  // ── Result ────────────────────────────────────────────────────────────────
  const elements = [...byId.values()].sort(byName);
  const childrenOf = new Map<string, string[]>();
  for (const element of elements) {
    if (!element.parentId) continue;
    let list = childrenOf.get(element.parentId);
    if (!list) childrenOf.set(element.parentId, (list = []));
    list.push(element.id);
  }

  const unplaced = { total: 0, byType: {} as Record<string, number> };
  for (const node of model.nodes) {
    if (elementOf.has(node.id) || anchors.has(node.id) || technologyNodes.has(node.id)) continue;
    unplaced.total++;
    const type = typeOf(node);
    unplaced.byType[type] = (unplaced.byType[type] ?? 0) + 1;
  }

  const anchorsOf = new Map<string, string[]>();
  for (const [nodeId, targets] of anchors) anchorsOf.set(nodeId, [...targets]);

  return {
    systemId: C4_SYSTEM_ID,
    elements,
    byId,
    childrenOf,
    relationships: [...relationships.values()],
    elementOf,
    anchorsOf,
    unplaced,
    issues,
  };
}

/** `id`, then each ancestor up to the system. */
export function c4Ancestors(model: C4Model, id: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let current = model.byId.get(id);
  while (current && !seen.has(current.id)) {
    out.push(current.id);
    seen.add(current.id);
    current = current.parentId ? model.byId.get(current.parentId) : undefined;
  }
  return out;
}

/** True when the model yields nothing to draw beyond the synthetic system. */
export function isEmptyC4(model: C4Model): boolean {
  return model.elements.every((e) => e.synthetic);
}
