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
  const opOf = new Map<string, ImpactOp>();
  const order: string[] = [];
  const mark = (id: string, op: ImpactOp) => {
    if (!opOf.has(id)) order.push(id);
    // An element's own change outranks a relationship change at its ends.
    if (op === 'relink' && opOf.has(id)) return;
    opOf.set(id, op);
  };
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
      added.set(id, id);
      if (change.elementId) added.set(change.elementId, id);
    }
    if (!id) {
      unresolved++;
      continue;
    }
    if (op === 'update' && change.after) {
      const name = str((change.after as Record<string, unknown>).name);
      const node = nodes.get(id);
      if (node && name) nodes.set(id, { ...node, label: name });
    }
    mark(id, op);
  }

  changes.forEach((change, i) => {
    if (!(change.type ?? '').includes('relationship')) return;
    const rel = (change.after ?? change.before ?? {}) as Record<string, unknown>;
    const src = resolve(str(rel.source));
    const tgt = resolve(str(rel.target));
    const predicate = str(rel.predicate) ?? str(rel.type);
    if (!src || !tgt || !predicate) {
      unresolved++;
      return;
    }
    if (normalizeOp(change.type) === 'add') addEdge(`changeset:${change.elementId ?? i}`, src, tgt, predicate);
    mark(src, 'relink');
    mark(tgt, 'relink');
  });

  const layered = buildLayeredIndex([...nodes.values()], edges, IMPACT_LAYERING);
  const originIds = order.filter((id) => layered.nodeById.has(id));
  if (originIds.length === 0) return { ...EMPTY_IMPACT, unresolved };
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
  };
}

/** The impact of a changeset's detail rows, recomputed when the model, the changeset or `follow` changes. */
export function useChangesetImpact(
  model: ModelDerived,
  detail: ChangesetDetail | null,
  follow: FollowDepth,
): ChangesetImpact {
  return useMemo(
    () => (detail ? changesetImpact(model, detail.rows.map((r) => r.raw), follow) : EMPTY_IMPACT),
    [model, detail, follow],
  );
}
