/**
 * modelOverlay — the model as a changeset leaves it (a STAGED changeset,
 * applied forward) or as it was before (an APPLIED changeset, reversed).
 * Pure: `ModelDerived` + change rows in, `ModelDerived` out.
 *
 * Changes are netted in change order (sequence number), per element and per
 * relationship (source, predicate, target):
 *   - element add + update → add; add + delete → nothing; update + delete →
 *     delete; delete + add → update (a re-created element)
 *   - relationship add + delete (or delete + add) → nothing
 * Element and relationship ends resolve by UUID or dotted id, as
 * `modelGraph.ts` does, and by the ids of elements the changeset itself adds.
 * What doesn't resolve is counted (`unresolved`), never dropped silently.
 *
 * Reverting is applying the inverse: the changes in reverse order, each with
 * its op inverted (add ↔ delete) and `before` / `after` swapped. A deleted
 * element comes back from its `before`, with its UUID, but only the links the
 * changeset deleted with changes of their own come back with it: links a
 * delete took implicitly at commit are not in the changeset to restore.
 * Applying, a deleted element's links go with it.
 *
 * `netChanges` is the shared first step (resolve + net); the Changesets Impact
 * tab (`changesetImpact.ts`) lays the netted changes over the model its own way.
 */

import type { ModelDerived, ModelLink, ModelNode } from './useModel';
import { buildModelIndex, dottedId, resolveEndpoint, type ModelIndex } from './modelGraph';
import { normalizeOp, type ChangeRecord } from './changesets';

export type OverlayMode = 'apply' | 'revert';

/** How a changeset marks an element. `relink`: only its relationships change. */
export type ImpactOp = 'add' | 'update' | 'delete' | 'relink';

/** An element's net op over a changeset. */
export type ElementOp = 'add' | 'update' | 'delete';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * The net op after `next` follows `prev` for one element, or null when they
 * cancel out: add + update stays add, add + delete is nothing, update +
 * delete is delete, delete + add is a re-created element (update).
 */
export function netOp(prev: ImpactOp | undefined, next: ImpactOp): ImpactOp | null {
  if (!prev || prev === 'relink') return next;
  if (prev === 'add') return next === 'delete' ? null : 'add';
  if (prev === 'delete') return next === 'delete' ? 'delete' : 'update';
  return next === 'delete' ? 'delete' : 'update';
}

const isRelationship = (change: ChangeRecord) => (change.type ?? '').includes('relationship');

/** A change's sequence number, or its 1-based position when it has none. */
export function sequenceOf(change: ChangeRecord, position: number): number {
  return typeof change.sequenceNumber === 'number' ? change.sequenceNumber : position + 1;
}

/**
 * The changes in change order: by sequence number when every change has one,
 * else as given. Each keeps its sequence (or position) as `sequenceNumber`.
 */
export function inChangeOrder(changes: readonly ChangeRecord[]): ChangeRecord[] {
  const numbered = changes.map((c, i) =>
    typeof c.sequenceNumber === 'number' ? c : { ...c, sequenceNumber: sequenceOf(c, i) },
  );
  if (changes.every((c) => typeof c.sequenceNumber === 'number')) {
    return numbered.map((c, i) => ({ c, i })).sort((a, b) => a.c.sequenceNumber! - b.c.sequenceNumber! || a.i - b.i).map(({ c }) => c);
  }
  return numbered;
}

/** The inverse of a list of changes: reversed, ops inverted, before/after swapped. Sequences are kept. */
export function invertChanges(changes: readonly ChangeRecord[]): ChangeRecord[] {
  return inChangeOrder(changes)
    .reverse()
    .map((change) => {
      const op = normalizeOp(change.type);
      const inverse = op === 'add' ? 'delete' : op === 'delete' ? 'add' : 'update';
      const type = isRelationship(change) ? `relationship-${inverse === 'update' ? 'update' : inverse}` : inverse;
      return { ...change, type, before: change.after ?? null, after: change.before ?? null };
    });
}

// ─── Resolve + net ──────────────────────────────────────────────────────────

export interface NetElement {
  /** The model element's UUID, or (an element the changeset adds) its `after.id` / dotted id. */
  id: string;
  op: ElementOp;
  /** The element's state after its last change (null when it ends deleted). */
  after: Record<string, unknown> | null;
  /** Sequences of the changes to it, in order. */
  sequences: number[];
  /** In the model before the changes (false: the changeset creates it). */
  inModel: boolean;
}

export interface NetRelationship {
  /** Resolved source / target element ids (as `NetElement.id`). */
  sourceId: string;
  targetId: string;
  predicate: string;
  /** Null when the changes cancel out. */
  op: 'add' | 'delete' | null;
  /** The id a new link gets: `changeset:<elementId or position>` of its last change. */
  linkId: string;
  sequences: number[];
}

export interface NetChanges {
  /** Element id → its net change, in first-change order. Elements whose changes cancel out are left out. */
  elements: Map<string, NetElement>;
  /** Per (source, predicate, target) key, including cancelled ones (`op: null`). */
  relationships: Map<string, NetRelationship>;
  /** Elements the changeset creates that survive netting, as GraphNode-ready model nodes. */
  created: Map<string, ModelNode>;
  /** Element id → its name after the last change that names it (even one later netted away). */
  nameOf: Map<string, string>;
  /** Sequences of changes whose element (or a relationship end) doesn't resolve. */
  unresolved: number[];
  /** Sequences of changes that net out (add then delete, and the like). */
  netted: number[];
  /** Element id → sequences of the changes that touch it (its own, and links at its ends). */
  changesOf: Map<string, number[]>;
  /** Resolve an endpoint (UUID or dotted id, or an id the changeset adds) to an element id. */
  resolve: (ref: string | undefined) => string | undefined;
  index: ModelIndex;
}

const relKey = (src: string, predicate: string, tgt: string) => `${src}|${predicate}|${tgt}`;

function toNode(obj: Record<string, unknown>, id: string, fallbackLayer?: string): ModelNode | null {
  const layer = str(obj.layer_id) ?? fallbackLayer;
  const name = str(obj.name);
  if (!layer || !name) return null;
  const { path: _path, ...rest } = obj;
  return {
    ...rest,
    id,
    type: str(obj.type) ?? 'element',
    layer_id: layer,
    name,
    attributes: (obj.attributes as Record<string, unknown> | undefined) ?? {},
  } as ModelNode;
}

/**
 * Resolve `changes` against `model` and net them per element and per
 * relationship, in the order given (callers sort with `inChangeOrder`).
 */
export function netChanges(model: ModelDerived, changes: readonly ChangeRecord[], index = buildModelIndex(model)): NetChanges {
  /** Endpoint (dotted id or UUID) → id of an element the changeset adds. */
  const added = new Map<string, string>();
  const resolve = (ref: string | undefined) => (ref ? (resolveEndpoint(index, ref)?.id ?? added.get(ref)) : undefined);

  const unresolved: number[] = [];
  const netted: number[] = [];
  const changesOf = new Map<string, number[]>();
  const touch = (id: string, seq: number | undefined) => {
    if (seq === undefined) return;
    const list = changesOf.get(id) ?? changesOf.set(id, []).get(id)!;
    if (!list.includes(seq)) list.push(seq);
  };
  const elements = new Map<string, NetElement>();
  const created = new Map<string, ModelNode>();
  const nameOf = new Map<string, string>();

  changes.forEach((change, position) => {
    if (isRelationship(change)) return;
    const seq = sequenceOf(change, position);
    const op = normalizeOp(change.type);
    const obj = (change.after ?? change.before ?? {}) as Record<string, unknown>;
    let id = resolve(change.elementId) ?? resolve(str(obj.id));
    // A new element, or one the changeset added, deleted and now adds again.
    if (op === 'add' && (!id || (!index.byUuid.has(id) && !created.has(id)))) {
      const fallbackId = str(obj.id) ?? change.elementId ?? `${str(obj.layer_id) ?? change.layerName}.${str(obj.name)}`;
      const node = toNode(obj, fallbackId, change.layerName);
      if (node) {
        id = node.id;
        created.set(id, node);
        added.set(id, id);
        added.set(dottedId(node), id);
        if (change.elementId) added.set(change.elementId, id);
      }
    }
    if (!id) {
      unresolved.push(seq);
      return;
    }
    touch(id, change.sequenceNumber);
    if (op !== 'delete' && change.after) {
      const name = str(change.after.name);
      if (name) nameOf.set(id, name);
    }
    const prev = elements.get(id);
    const net = netOp(prev?.op, op);
    const sequences = [...(prev?.sequences ?? []), seq];
    if (net && net !== 'relink') {
      const after = net === 'delete' ? null : ({ ...(prev?.after ?? {}), ...(change.after ?? {}) } as Record<string, unknown>);
      // A Map keeps an element at its first change; one netted out and changed again goes last.
      elements.set(id, { id, op: net, after, sequences, inModel: index.byUuid.has(id) });
    } else {
      // Added then deleted: no net change, and the element never existed.
      elements.delete(id);
      netted.push(...sequences);
      if (created.has(id)) created.delete(id);
    }
  });

  // Elements the changeset creates take their latest state.
  for (const [id, node] of created) {
    const net = elements.get(id);
    if (net?.after) created.set(id, toNode(net.after, id, node.layer_id) ?? node);
  }

  const exists = (id: string) => index.byUuid.has(id) || created.has(id);
  const relationships = new Map<string, NetRelationship>();
  changes.forEach((change, position) => {
    if (!isRelationship(change)) return;
    const seq = sequenceOf(change, position);
    const rel = (change.after ?? change.before ?? {}) as Record<string, unknown>;
    const src = resolve(str(rel.source));
    const tgt = resolve(str(rel.target));
    const predicate = str(rel.predicate) ?? str(rel.type);
    if (!src || !tgt || !predicate || !exists(src) || !exists(tgt)) {
      unresolved.push(seq);
      return;
    }
    touch(src, change.sequenceNumber);
    touch(tgt, change.sequenceNumber);
    const key = relKey(src, predicate, tgt);
    const op = normalizeOp(change.type) === 'add' ? 'add' : 'delete';
    const prev = relationships.get(key);
    const next = !prev || prev.op === null ? op : prev.op === op ? op : null;
    const sequences = next === null ? [] : [...(prev?.op ? prev.sequences : []), seq];
    if (next === null) netted.push(...(prev?.sequences ?? []), seq);
    relationships.set(key, {
      sourceId: src,
      targetId: tgt,
      predicate,
      op: next,
      linkId: `changeset:${change.elementId ?? position}`,
      sequences,
    });
  });

  return { elements, relationships, created, nameOf, unresolved, netted, changesOf, resolve, index };
}

// ─── The model after the changes ────────────────────────────────────────────

/** One netted change as the overlay applied it: what it touches in the model. */
export interface OverlayChange {
  sequence: number;
  kind: 'element' | 'relationship';
  /** Element ids: the element itself, or a relationship's two ends. */
  nodeIds: string[];
  /** A relationship's model link ids (in the model before or after; empty for an element). */
  linkIds: string[];
}

/** What the overlay did, for `diffC4`: every change that survived netting, and what didn't. */
export interface OverlayTrace {
  changes: OverlayChange[];
  /** Sequences of changes whose element or a relationship end doesn't resolve. */
  unresolved: number[];
  /** Sequences of changes that cancel out. */
  netted: number[];
}

export interface ModelOverlay {
  /** The model after the changes; `model` itself when they change nothing. */
  model: ModelDerived;
  trace: OverlayTrace;
}

export const EMPTY_TRACE: OverlayTrace = { changes: [], unresolved: [], netted: [] };

function derive(nodes: ModelNode[], links: ModelLink[]): ModelDerived {
  const countsByLayer: Record<string, number> = {};
  const nodesByLayer: Record<string, ModelNode[]> = {};
  for (const node of nodes) {
    const layer = node.layer_id;
    if (!layer) continue;
    countsByLayer[layer] = (countsByLayer[layer] ?? 0) + 1;
    (nodesByLayer[layer] ??= []).push(node);
  }
  return { nodes, links, countsByLayer, nodesByLayer, relCount: links.length };
}

/**
 * `model` with `changes` applied (`apply`, a staged changeset) or reversed
 * (`revert`, an applied one), and the trace of what each change touched.
 *
 * When nothing nets to a change, `model` comes back as is, so caches keyed on
 * `model.nodes` (the C4 model's) still hit. Otherwise `nodes` is always a new
 * array, even when only links changed: those caches must miss then.
 */
export function overlayModel(
  model: ModelDerived,
  changes: readonly ChangeRecord[] | undefined,
  mode: OverlayMode,
): ModelOverlay {
  if (!changes || changes.length === 0) return { model, trace: EMPTY_TRACE };
  const ordered = mode === 'apply' ? inChangeOrder(changes) : invertChanges(changes);
  const net = netChanges(model, ordered);
  const rels = [...net.relationships.values()].filter((r) => r.op);
  const trace: OverlayTrace = { changes: [], unresolved: [...net.unresolved].sort((a, b) => a - b), netted: [...net.netted].sort((a, b) => a - b) };
  if (net.elements.size === 0 && rels.length === 0) return { model, trace };

  // Nodes: deleted ones go, updated ones take their latest state, created ones join.
  const deleted = new Set<string>();
  const nodes: ModelNode[] = [];
  for (const node of model.nodes) {
    const change = net.elements.get(node.id);
    if (change?.op === 'delete') {
      deleted.add(node.id);
      continue;
    }
    nodes.push(change?.after ? (toNode({ ...node, ...change.after }, node.id, node.layer_id) ?? node) : node);
  }
  for (const [id, node] of net.created) if (net.elements.has(id)) nodes.push(node);

  // Links: those at a deleted element go; an end named by a dotted id that a
  // rename would break is pinned to the UUID; relationship changes land.
  const linkIdsOf = new Map<string, string[]>();
  const keyOfLink = (link: ModelLink) => {
    const src = net.resolve(link.source);
    const tgt = net.resolve(link.target);
    return src && tgt ? relKey(src, link.type, tgt) : null;
  };
  const removeKeys = new Set(rels.filter((r) => r.op === 'delete').map((r) => relKey(r.sourceId, r.predicate, r.targetId)));
  const present = new Set<string>();
  const links: ModelLink[] = [];
  for (const link of model.links) {
    const key = keyOfLink(link);
    if (key && removeKeys.has(key)) {
      (linkIdsOf.get(key) ?? linkIdsOf.set(key, []).get(key)!).push(link.id);
      continue;
    }
    const src = net.resolve(link.source);
    const tgt = net.resolve(link.target);
    if ((src && deleted.has(src)) || (tgt && deleted.has(tgt))) continue;
    if (key) present.add(key);
    const pin = (end: string, id: string | undefined) => (id && net.elements.has(id) ? id : end);
    const source = pin(link.source, src);
    const target = pin(link.target, tgt);
    links.push(source === link.source && target === link.target ? link : { ...link, source, target });
  }
  for (const rel of rels) {
    if (rel.op !== 'add') continue;
    const key = relKey(rel.sourceId, rel.predicate, rel.targetId);
    if (deleted.has(rel.sourceId) || deleted.has(rel.targetId)) continue;
    if (present.has(key)) {
      (linkIdsOf.get(key) ?? linkIdsOf.set(key, []).get(key)!).push(
        ...model.links.filter((l) => keyOfLink(l) === key).map((l) => l.id),
      );
      continue;
    }
    present.add(key);
    links.push({ id: rel.linkId, source: rel.sourceId, target: rel.targetId, type: rel.predicate });
    linkIdsOf.set(key, [rel.linkId]);
  }

  for (const element of net.elements.values()) {
    for (const sequence of element.sequences) trace.changes.push({ sequence, kind: 'element', nodeIds: [element.id], linkIds: [] });
  }
  for (const rel of rels) {
    const key = relKey(rel.sourceId, rel.predicate, rel.targetId);
    for (const sequence of rel.sequences) {
      trace.changes.push({ sequence, kind: 'relationship', nodeIds: [rel.sourceId, rel.targetId], linkIds: linkIdsOf.get(key) ?? [] });
    }
  }
  trace.changes.sort((a, b) => a.sequence - b.sequence);

  return { model: derive(nodes, links), trace };
}

/** `model` with `changes` applied forward (`apply`) or reversed (`revert`). */
export function modelOverlay(
  model: ModelDerived,
  changes: readonly ChangeRecord[] | undefined,
  mode: OverlayMode,
): ModelDerived {
  return overlayModel(model, changes, mode).model;
}
