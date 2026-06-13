/**
 * modelGraph — pure transforms of the `/api/model` payload into per-layer
 * Heimdall `GraphCanvas` view models (nodes + edges).
 *
 * The model's `links[]` reference endpoints by a *canonical dotted id*
 * (`{layer_id}.{type}.{slug(name)}`) for authored elements and occasionally by
 * raw node UUID. `nodes[].id` is always a UUID. To resolve every link to a node
 * we index each node under BOTH its UUID and its derived dotted id, then map
 * link endpoints to the node UUID (the id `GraphCanvas` selection operates on).
 *
 * All functions are pure: they accept the derived `/api/model` payload and a
 * layer slug, and return deterministic results (stable node positions via the
 * design's centered-staggered-grid layout) so `layout="manual"` is stable.
 */

import type {
  GraphNodeData,
  GraphEdgeData as GraphEdge,
} from '@tinkermonkey/heimdall-ui';
import type { ModelDerived, ModelNode, ModelLink } from './useModel';

/**
 * Slugify an element name to match the model's canonical dotted-id segment.
 *
 * Rules (reverse-engineered + verified against all 445 live links):
 *  - insert a hyphen at lower→Upper camel boundaries ("WebSocket" → "web-socket")
 *    but NOT at digit→Upper boundaries ("E2E" stays "e2e")
 *  - drop dots entirely so "2.1" → "21"
 *  - lowercase, collapse any other non-alphanumeric run to a single hyphen, trim
 */
export function slugifyName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\./g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Canonical dotted id for a node: `{layer_id}.{type}.{slug(name)}`. */
export function dottedId(node: ModelNode): string {
  return `${node.layer_id}.${node.type}.${slugifyName(node.name)}`;
}

/**
 * Index nodes by BOTH UUID and canonical dotted id so link endpoints (which use
 * either form) resolve to a single node. Built once per model payload.
 */
export interface ModelIndex {
  /** endpoint id (UUID or dotted) -> node */
  byEndpoint: Map<string, ModelNode>;
  /** node UUID -> node */
  byUuid: Map<string, ModelNode>;
}

export function buildModelIndex(model: ModelDerived): ModelIndex {
  const byEndpoint = new Map<string, ModelNode>();
  const byUuid = new Map<string, ModelNode>();
  for (const node of model.nodes) {
    byUuid.set(node.id, node);
    byEndpoint.set(node.id, node);
    byEndpoint.set(dottedId(node), node);
  }
  return { byEndpoint, byUuid };
}

/** Resolve a link endpoint (UUID or dotted id) to its node, or undefined. */
export function resolveEndpoint(
  index: ModelIndex,
  endpoint: string,
): ModelNode | undefined {
  return index.byEndpoint.get(endpoint);
}

// ─── Layout: centered staggered grid (verbatim from the design) ──────────────

const COL_GAP = 196;
const ROW_GAP = 88;

interface Pos {
  x: number;
  y: number;
}

/**
 * Deterministic, non-overlapping grid that recenters its bounding box on the
 * origin. `cols = clamp(2, 4, ceil(sqrt(n)))`; odd rows are nudged right for a
 * staggered look. Returns a map of node id -> {x, y}.
 */
export function gridLayout(ids: string[]): Map<string, Pos> {
  const n = ids.length || 1;
  const cols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(n))));
  const pos = new Map<string, Pos>();

  ids.forEach((id, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    pos.set(id, {
      x: c * COL_GAP + (r % 2) * (COL_GAP * 0.18),
      y: r * ROW_GAP,
    });
  });

  if (pos.size === 0) return pos;
  const xs = [...pos.values()].map((p) => p.x);
  const ys = [...pos.values()].map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  for (const p of pos.values()) {
    p.x -= cx;
    p.y -= cy;
  }
  return pos;
}

// ─── Per-layer node + edge builders ──────────────────────────────────────────

/**
 * Nodes for a layer as `GraphNodeData[]`, mapped:
 *   id -> node.id (UUID)
 *   label -> node.name
 *   kind -> node.type
 *   domainColor -> the layer slug (drives the domain swatch CSS)
 *   x/y -> deterministic centered-staggered-grid position
 */
export function nodesForLayer(
  model: ModelDerived,
  layerId: string,
): GraphNodeData[] {
  const nodes = model.nodesByLayer[layerId] ?? [];
  const pos = gridLayout(nodes.map((n) => n.id));
  return nodes.map((n) => {
    const p = pos.get(n.id);
    return {
      id: n.id,
      label: n.name,
      kind: n.type,
      domainColor: layerId,
      x: p ? p.x : 0,
      y: p ? p.y : 0,
    };
  });
}

/**
 * Edges for a layer as `GraphEdge[]`: links whose BOTH endpoints resolve to
 * nodes that live in this layer. Endpoints are mapped to node UUIDs so they
 * line up with `nodesForLayer` ids.
 */
export function edgesForLayer(
  model: ModelDerived,
  layerId: string,
  index: ModelIndex,
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const link of model.links) {
    const src = resolveEndpoint(index, link.source);
    const tgt = resolveEndpoint(index, link.target);
    if (!src || !tgt) continue;
    if (src.layer_id !== layerId || tgt.layer_id !== layerId) continue;
    edges.push({
      id: link.id,
      sourceId: src.id,
      targetId: tgt.id,
      label: link.type,
    });
  }
  return edges;
}

export type { ModelLink };
