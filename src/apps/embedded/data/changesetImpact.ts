/**
 * changesetImpact — what a changeset touches outside itself: the Changesets
 * view's Impact tab and the inspector's blast-radius summary.
 *
 * The changeset is laid over the model first, so a STAGED changeset's new
 * elements and relationships are part of the graph before Apply:
 *   - `add`                 → the element is added (unless the model already has it)
 *   - `update` / `delete`   → the model's element, marked with the op
 *   - `relationship-add`    → the relationship is added; its ends are marked `relink`
 *   - `relationship-delete` → the relationship stays (it exists until Apply); its ends are marked `relink`
 * Every marked element is a reach origin, and heimdall-ui 0.11's multi-origin
 * `computeReach` gives the union of their reach, each element at its lowest hop
 * (same follow semantics as the Model inspector's "followed across layers").
 *
 * The result is the reached subgraph — the origins, what they reach, and the
 * links the reach travels — ready for `GraphCanvas layout="layer-lanes"`.
 */

import { useMemo } from 'react';
import {
  buildLayeredIndex,
  computeReach,
  type BuildLayeredIndexOptions,
  type GraphEdgeData,
  type GraphNodeData,
} from '@tinkermonkey/heimdall-ui';
import type { ModelDerived } from './useModel';
import { buildModelIndex, resolveEndpoint } from './modelGraph';
import { normalizeOp, type ChangeRecord } from './changesets';
import { isStructuralPredicate } from './predicates';
import { DOMAIN_COLORS, LAYER_ORDER, layerLabel } from '../ui/domain';
import { typeLabel, withCount } from './typeLabel';
import type { FollowDepth } from './followDepth';
import type { ChangesetDetail } from './useChangesets';

/** How a changeset marks an element. `relink`: only its relationships change. */
export type ImpactOp = 'add' | 'update' | 'delete' | 'relink';

export interface ImpactLayer {
  layerId: string;
  /** Elements reached in this layer, outside the changeset. */
  count: number;
  /** Their names, nearest hop first, then name. */
  names: string[];
}

export interface ChangesetImpact {
  /** Origins + reached elements (GraphNodeData, `domainColor` = layer slug). */
  nodes: GraphNodeData[];
  /** The links the reach travels (`label` = predicate, `attributes.category`). */
  edges: GraphEdgeData[];
  /** Element id → op, for every element the changeset marks. */
  opOf: Map<string, ImpactOp>;
  /** The marked elements found in the graph, in change order. */
  originIds: string[];
  /** Element id → hop (0 for origins). */
  hopOf: Map<string, number>;
  /** Elements reached outside the changeset. */
  outsideCount: number;
  /** `outsideCount` per layer, in layer order. */
  byLayer: ImpactLayer[];
  /** Changes whose element (or a relationship end) isn't in the model, so they're left out. */
  unresolved: number;
  /** Element id → the sequence numbers of the changes that touch it (its own, and links at its ends). */
  changesOf: Map<string, number[]>;
}

export const EMPTY_IMPACT: ChangesetImpact = {
  nodes: [],
  edges: [],
  opOf: new Map(),
  originIds: [],
  hopOf: new Map(),
  outsideCount: 0,
  byLayer: [],
  unresolved: 0,
  changesOf: new Map(),
};

/** Layers in spec order with labels and lane colors; shared by the index and the lanes view. */
export const IMPACT_LAYERING: BuildLayeredIndexOptions = {
  layerBy: 'domainColor',
  layers: LAYER_ORDER.map((id) => ({ id, label: layerLabel(id), color: DOMAIN_COLORS[id] })),
  linkCategoryBy: 'category',
  categoryOrder: ['structural', 'relational'],
};

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

function edgeCategory(predicate: string): string {
  return isStructuralPredicate(predicate) ? 'structural' : 'relational';
}

/**
 * The impact of `changes` on `model` at `follow` depth. Elements and
 * relationships whose ends can't be resolved are skipped, as everywhere else.
 */
export function changesetImpact(
  model: ModelDerived,
  changes: readonly ChangeRecord[] | undefined,
  follow: FollowDepth,
  /**
   * Reach from these elements only (dotted ids or UUIDs; an element the
   * changeset adds by its dotted id) instead of every changed element: one
   * element's neighbourhood, or the Impact tab's focus. Ops still mark every
   * changed element.
   */
  focus?: readonly string[],
): ChangesetImpact {
  if (!changes || changes.length === 0 || model.nodes.length === 0) return EMPTY_IMPACT;

  const index = buildModelIndex(model);
  /** Endpoint (dotted id or UUID) → id of an element the changeset adds. */
  const added = new Map<string, string>();
  const nodes = new Map<string, GraphNodeData>();
  for (const n of model.nodes) {
    nodes.set(n.id, { id: n.id, label: n.name, kind: n.type, domainColor: n.layer_id });
  }

  const edges: GraphEdgeData[] = [];
  const edgeKeys = new Set<string>();
  const addEdge = (id: string, sourceId: string, targetId: string, predicate: string) => {
    const key = `${sourceId}|${predicate}|${targetId}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ id, sourceId, targetId, label: predicate, attributes: { category: edgeCategory(predicate) } });
  };
  model.links.forEach((link, i) => {
    const src = resolveEndpoint(index, link.source);
    const tgt = resolveEndpoint(index, link.target);
    if (src && tgt) addEdge(link.id ?? `link-${i}`, src.id, tgt.id, link.type);
  });

  let unresolved = 0;
  const changesOf = new Map<string, number[]>();
  const touch = (id: string, change: ChangeRecord) => {
    if (change.sequenceNumber === undefined) return;
    const list = changesOf.get(id) ?? changesOf.set(id, []).get(id)!;
    if (!list.includes(change.sequenceNumber)) list.push(change.sequenceNumber);
  };
  /** Net element op so far, in change order (see `netOp`). */
  const elementOp = new Map<string, ImpactOp>();
  const order: string[] = [];
  /** Elements this changeset created (absent from the model). */
  const createdHere = new Set<string>();
  const resolve = (ref: string | undefined) =>
    ref ? resolveEndpoint(index, ref)?.id ?? added.get(ref) : undefined;

  // Elements first, so relationships can end on an element the changeset adds.
  for (const change of changes) {
    if ((change.type ?? '').includes('relationship')) continue;
    const op = normalizeOp(change.type);
    const obj = (change.after ?? change.before ?? {}) as Record<string, unknown>;
    let id = resolve(change.elementId) ?? resolve(str(obj.id));
    if (!id && op === 'add') {
      const layer = str(obj.layer_id) ?? change.layerName;
      const name = str(obj.name);
      if (!layer || !name) {
        unresolved++;
        continue;
      }
      id = str(obj.id) ?? change.elementId ?? `${layer}.${name}`;
      nodes.set(id, { id, label: name, kind: str(obj.type) ?? 'element', domainColor: layer });
      createdHere.add(id);
      added.set(id, id);
      if (change.elementId) added.set(change.elementId, id);
    }
    if (!id) {
      unresolved++;
      continue;
    }
    touch(id, change);
    if (op !== 'delete' && change.after) {
      const name = str((change.after as Record<string, unknown>).name);
      const node = nodes.get(id);
      if (node && name) nodes.set(id, { ...node, label: name });
    }
    const net = netOp(elementOp.get(id), op);
    if (!elementOp.has(id)) order.push(id);
    if (net) {
      elementOp.set(id, net);
    } else {
      // Added then deleted: no net change, and the element never existed.
      elementOp.delete(id);
      order.splice(order.indexOf(id), 1);
      if (createdHere.has(id)) nodes.delete(id);
    }
  }

  // Relationships, netted per (source, predicate, target): added then deleted
  // (or deleted then re-added) is no change at all.
  const relNet = new Map<string, { op: 'add' | 'delete' | null; id: string; src: string; tgt: string; predicate: string }>();
  changes.forEach((change, i) => {
    if (!(change.type ?? '').includes('relationship')) return;
    const rel = (change.after ?? change.before ?? {}) as Record<string, unknown>;
    const src = resolve(str(rel.source));
    const tgt = resolve(str(rel.target));
    const predicate = str(rel.predicate) ?? str(rel.type);
    if (!src || !tgt || !predicate || !nodes.has(src) || !nodes.has(tgt)) {
      unresolved++;
      return;
    }
    touch(src, change);
    touch(tgt, change);
    const key = `${src}|${predicate}|${tgt}`;
    const op = normalizeOp(change.type) === 'add' ? 'add' : 'delete';
    const prev = relNet.get(key);
    const next = !prev || prev.op === null ? op : prev.op === op ? op : null;
    relNet.set(key, { op: next, id: `changeset:${change.elementId ?? i}`, src, tgt, predicate });
  });

  const opOf = new Map(elementOp);
  for (const { op, id, src, tgt, predicate } of relNet.values()) {
    if (!op) continue;
    if (op === 'add') addEdge(id, src, tgt, predicate);
    for (const end of [src, tgt]) {
      // An element's own change outranks a relationship change at its ends.
      if (opOf.has(end)) continue;
      opOf.set(end, 'relink');
      order.push(end);
    }
  }

  const layered = buildLayeredIndex([...nodes.values()], edges, IMPACT_LAYERING);
  const originIds = (
    focus ? [...new Set(focus.map((ref) => resolve(ref) ?? (nodes.has(ref) ? ref : undefined)))] : order
  ).filter((id): id is string => !!id && layered.nodeById.has(id));
  if (originIds.length === 0) return { ...EMPTY_IMPACT, unresolved, changesOf };
  const reach = computeReach(layered, originIds, { follow });

  const hopOf = new Map<string, number>();
  for (const [instanceId, hop] of reach.hopOf) {
    const node = layered.nodeById.get(instanceId);
    if (node) hopOf.set(node.nodeId, Math.min(hop, hopOf.get(node.nodeId) ?? Infinity));
  }
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  const reachedEdges: GraphEdgeData[] = [];
  for (const linkId of reach.linkHop.keys()) {
    for (const edgeId of layered.linkById.get(linkId)?.edgeIds ?? []) {
      const edge = edgeById.get(edgeId);
      if (edge && hopOf.has(edge.sourceId) && hopOf.has(edge.targetId)) reachedEdges.push(edge);
    }
  }

  const perLayer = new Map<string, { id: string; hop: number; name: string }[]>();
  const reachedNodes: GraphNodeData[] = [];
  for (const [id, hop] of hopOf) {
    const node = nodes.get(id);
    if (!node) continue;
    reachedNodes.push(node);
    if (opOf.has(id)) continue;
    const layer = node.domainColor ?? '';
    (perLayer.get(layer) ?? perLayer.set(layer, []).get(layer)!).push({ id, hop, name: node.label });
  }
  const layerIds = [...LAYER_ORDER, ...[...perLayer.keys()].filter((l) => !LAYER_ORDER.includes(l as never))];
  const byLayer = layerIds
    .filter((l) => perLayer.has(l))
    .map((layerId) => {
      const list = perLayer.get(layerId)!.sort((a, b) => a.hop - b.hop || a.name.localeCompare(b.name));
      return { layerId, count: list.length, names: list.map((e) => e.name) };
    });

  return {
    nodes: reachedNodes,
    edges: reachedEdges,
    opOf,
    originIds,
    hopOf,
    outsideCount: byLayer.reduce((sum, l) => sum + l.count, 0),
    byLayer,
    unresolved,
    changesOf,
  };
}

/** The impact of a changeset's detail rows, recomputed when the model, the changeset or `follow` changes. */
export function useChangesetImpact(
  model: ModelDerived,
  detail: ChangesetDetail | null,
  follow: FollowDepth,
  focus?: readonly string[] | null,
): ChangesetImpact {
  const focusKey = focus ? focus.join('\n') : null;
  return useMemo(
    () =>
      detail
        ? changesetImpact(model, detail.rows.map((r) => r.raw), follow, focusKey === null ? undefined : focusKey.split('\n'))
        : EMPTY_IMPACT,
    [model, detail, follow, focusKey],
  );
}

// ─── Narrowing the impact: filters, search, grouped lanes ───────────────────

/** Facet values the Impact tab leaves out (empty sets: everything shows). */
export interface ImpactFilter {
  /** Only the changed elements, without what they reach. */
  changesOnly: boolean;
  ops: ReadonlySet<ImpactOp>;
  layers: ReadonlySet<string>;
  types: ReadonlySet<string>;
  categories: ReadonlySet<string>;
}

export const NO_IMPACT_FILTER: ImpactFilter = {
  changesOnly: false,
  ops: new Set(),
  layers: new Set(),
  types: new Set(),
  categories: new Set(),
};

export interface ImpactFacet {
  value: string;
  count: number;
}

export interface ImpactFacets {
  /** Changed elements per op. */
  ops: ImpactFacet[];
  /** Elements per layer, in layer order. */
  layers: ImpactFacet[];
  /** Elements per type, most first. */
  types: ImpactFacet[];
  /** Links per category. */
  categories: ImpactFacet[];
}

function tally(values: Iterable<string>): Map<string, number> {
  const out = new Map<string, number>();
  for (const v of values) out.set(v, (out.get(v) ?? 0) + 1);
  return out;
}

/** Counts for each filter facet, over the whole (unfiltered) impact. */
export function impactFacets(impact: ChangesetImpact): ImpactFacets {
  const ops = tally(impact.originIds.map((id) => impact.opOf.get(id)).filter((o): o is ImpactOp => !!o));
  const layers = tally(impact.nodes.map((n) => n.domainColor ?? ''));
  const types = tally(impact.nodes.map((n) => n.kind ?? 'element'));
  const categories = tally(impact.edges.map((e) => String(e.attributes?.category ?? 'relational')));
  const opOrder: ImpactOp[] = ['add', 'update', 'delete', 'relink'];
  const layerOrder = [...LAYER_ORDER, ...[...layers.keys()].filter((l) => !LAYER_ORDER.includes(l as never))];
  return {
    ops: opOrder.filter((o) => ops.has(o)).map((value) => ({ value, count: ops.get(value)! })),
    layers: layerOrder.filter((l) => layers.has(l)).map((value) => ({ value, count: layers.get(value)! })),
    types: [...types].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
    categories: [...categories].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
  };
}

/** The impact narrowed to a filter: elements outside it and links to them go. */
export function filterImpact(impact: ChangesetImpact, filter: ImpactFilter): ChangesetImpact {
  const keep = new Set<string>();
  for (const n of impact.nodes) {
    const op = impact.opOf.get(n.id);
    if (filter.changesOnly && !op) continue;
    if (op && filter.ops.has(op)) continue;
    if (filter.layers.has(n.domainColor ?? '')) continue;
    if (filter.types.has(n.kind ?? 'element')) continue;
    keep.add(n.id);
  }
  return {
    ...impact,
    nodes: impact.nodes.filter((n) => keep.has(n.id)),
    edges: impact.edges.filter(
      (e) =>
        keep.has(e.sourceId) &&
        keep.has(e.targetId) &&
        !filter.categories.has(String(e.attributes?.category ?? 'relational')),
    ),
    originIds: impact.originIds.filter((id) => keep.has(id)),
  };
}

export interface ImpactMatch {
  id: string;
  label: string;
  kind: string;
  layerId: string;
  op?: ImpactOp;
  hop: number;
}

/** Elements whose name contains `query` (any case): changed ones first, then nearest. */
export function searchImpact(impact: ChangesetImpact, query: string): ImpactMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return impact.nodes
    .filter((n) => n.label.toLowerCase().includes(q))
    .map((n) => ({
      id: n.id,
      label: n.label,
      kind: n.kind ?? 'element',
      layerId: n.domainColor ?? '',
      op: impact.opOf.get(n.id),
      hop: impact.hopOf.get(n.id) ?? 0,
    }))
    .sort((a, b) => Number(!!b.op) - Number(!!a.op) || a.hop - b.hop || a.label.localeCompare(b.label));
}

export const GROUP_PREFIX = 'group:';

export interface GroupedImpact {
  impact: ChangesetImpact;
  /** Group node id → the element ids it stands for. */
  groups: Map<string, string[]>;
  /** Per layer: elements shown (a group counts once) and elements in all. */
  laneCounts: Map<string, { shown: number; total: number }>;
}

/** A type's full plural display name in a layer ("Application Components"). */
export type TypeNameOf = (layerId: string, type: string) => string;

/** Without the spec to hand: the type id made readable (`typeLabel`'s fallback). */
const typeIdPlural: TypeNameOf = (layerId, type) => typeLabel(type, layerId).plural;

/**
 * Large lanes grouped by type: in a layer with more than `threshold`
 * elements, every type with two or more elements (other than those in
 * `keep`, and types in `expanded` as `layer|type`) becomes one group node,
 * its links merged, labelled "Application Components · 12". A group whose
 * members share an op carries it.
 */
export function groupLargeLanes(
  impact: ChangesetImpact,
  options: {
    threshold: number;
    keep?: ReadonlySet<string>;
    expanded?: ReadonlySet<string>;
    /**
     * A type's full plural name (`typeLabel` over the spec's title): lanes here
     * mix layers, so never the short form. Defaults to the type id made readable.
     */
    typeName?: TypeNameOf;
  },
): GroupedImpact {
  const typeName = options.typeName ?? typeIdPlural;
  const keep = options.keep ?? new Set<string>();
  const expanded = options.expanded ?? new Set<string>();
  const byLayer = new Map<string, GraphNodeData[]>();
  for (const n of impact.nodes) {
    const l = n.domainColor ?? '';
    (byLayer.get(l) ?? byLayer.set(l, []).get(l)!).push(n);
  }
  const groupOf = new Map<string, string>();
  const groups = new Map<string, string[]>();
  const groupNodes: GraphNodeData[] = [];
  const laneCounts = new Map<string, { shown: number; total: number }>();
  for (const [layer, list] of byLayer) {
    let shown = list.length;
    if (list.length > options.threshold) {
      const byType = new Map<string, GraphNodeData[]>();
      for (const n of list) {
        const type = n.kind ?? 'element';
        if (keep.has(n.id) || expanded.has(`${layer}|${type}`)) continue;
        (byType.get(type) ?? byType.set(type, []).get(type)!).push(n);
      }
      for (const [type, members] of byType) {
        if (members.length < 2) continue;
        const id = `${GROUP_PREFIX}${layer}|${type}`;
        groups.set(id, members.map((m) => m.id));
        for (const m of members) groupOf.set(m.id, id);
        groupNodes.push({ id, label: withCount(typeName(layer, type), members.length), kind: type, domainColor: layer });
        shown -= members.length - 1;
      }
    }
    laneCounts.set(layer, { shown, total: list.length });
  }
  if (groups.size === 0) return { impact, groups, laneCounts };

  const at = (id: string) => groupOf.get(id) ?? id;
  const opOf = new Map(impact.opOf);
  const hopOf = new Map(impact.hopOf);
  for (const [gid, members] of groups) {
    const ops = new Set(members.map((m) => impact.opOf.get(m)));
    const [only] = [...ops];
    if (ops.size === 1 && only) opOf.set(gid, only);
    hopOf.set(gid, Math.min(...members.map((m) => impact.hopOf.get(m) ?? Infinity)));
  }
  const seen = new Set<string>();
  const edges: GraphEdgeData[] = [];
  for (const e of impact.edges) {
    const sourceId = at(e.sourceId);
    const targetId = at(e.targetId);
    if (sourceId === targetId) continue;
    const key = `${sourceId}|${e.label}|${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push(sourceId === e.sourceId && targetId === e.targetId ? e : { ...e, id: `${e.id}@${key}`, sourceId, targetId });
  }
  return {
    impact: {
      ...impact,
      nodes: [...impact.nodes.filter((n) => !groupOf.has(n.id)), ...groupNodes],
      edges,
      opOf,
      hopOf,
      originIds: [...new Set(impact.originIds.map(at))],
    },
    groups,
    laneCounts,
  };
}
