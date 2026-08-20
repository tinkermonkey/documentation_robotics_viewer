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
 * layer slug, and return deterministic results. Node positions are left
 * unset so `GraphCanvas`'s `layout="force"` engine places them; `gridLayout`
 * is kept as a pure, independently-tested utility (was previously used to
 * pin `layout="manual"` positions here and in `specGraph`).
 */

import type {
  GraphNodeData,
  GraphEdgeData as GraphEdge,
} from '@tinkermonkey/heimdall-ui';
import type { ModelDerived, ModelNode, ModelLink } from './useModel';
import { schemaForLayer, type SpecPayload, type SpecRelationshipSchema } from './specGraph';

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
 *
 * x/y are intentionally omitted so `GraphCanvas`'s `layout="force"` engine
 * places the nodes (explicit x/y would pin them, bypassing the layout).
 */
export function nodesForLayer(
  model: ModelDerived,
  layerId: string,
): GraphNodeData[] {
  const nodes = model.nodesByLayer[layerId] ?? [];
  return nodes.map((n) => ({
    id: n.id,
    label: n.name,
    kind: n.type,
    domainColor: layerId,
  }));
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

// ─── Card data: per-node intra/cross-layer connection summary ────────────────

/** One inter-layer connection enumerated on a card node. */
export interface CardCrossLink {
  predicate: string;
  targetId: string;
  targetName: string;
  targetLayer: string;
}

/** Per-node connection summary backing card-style graph nodes. */
export interface CardData {
  /** Count of links whose BOTH endpoints resolve into this node's layer. */
  intraCount: number;
  /** Inter-layer links touching this node, capped at `CARD_CROSS_LINK_CAP`. */
  crossLinks: CardCrossLink[];
  /** Total inter-layer link count (may exceed `crossLinks.length`). */
  crossTotal: number;
}

/** Max inter-layer connections enumerated per card; the rest count toward `crossTotal` only. */
export const CARD_CROSS_LINK_CAP = 5;

/**
 * `nodesForLayer` plus a per-node `CardData` side-channel map: intra-layer
 * connection count and enumerated inter-layer (cross-layer) connections.
 * Inter-layer connections aren't derivable from `edgesForLayer` (which only
 * returns links with both endpoints in the layer), so this makes a single
 * additional pass over `model.links`, classifying each resolved link as
 * intra-layer (both endpoints in `layerId`), cross-layer (exactly one
 * endpoint in `layerId`), or unrelated (neither).
 */
export function nodesWithCardData(
  model: ModelDerived,
  layerId: string,
  index: ModelIndex,
): { nodes: GraphNodeData[]; cardData: Map<string, CardData> } {
  const nodes = nodesForLayer(model, layerId);
  const layerNodeIds = new Set(nodes.map((n) => n.id));

  const cardData = new Map<string, CardData>();
  for (const id of layerNodeIds) {
    cardData.set(id, { intraCount: 0, crossLinks: [], crossTotal: 0 });
  }

  const addCrossLink = (
    ownerId: string,
    predicate: string,
    other: ModelNode,
  ) => {
    const data = cardData.get(ownerId)!;
    data.crossTotal += 1;
    if (data.crossLinks.length < CARD_CROSS_LINK_CAP) {
      data.crossLinks.push({
        predicate,
        targetId: other.id,
        targetName: other.name,
        targetLayer: other.layer_id,
      });
    }
  };

  for (const link of model.links) {
    const src = resolveEndpoint(index, link.source);
    const tgt = resolveEndpoint(index, link.target);
    if (!src || !tgt) continue;

    const srcInLayer = layerNodeIds.has(src.id);
    const tgtInLayer = layerNodeIds.has(tgt.id);
    if (!srcInLayer && !tgtInLayer) continue;

    if (srcInLayer && tgtInLayer) {
      cardData.get(src.id)!.intraCount += 1;
      cardData.get(tgt.id)!.intraCount += 1;
      continue;
    }

    if (srcInLayer) addCrossLink(src.id, link.type, tgt);
    else addCrossLink(tgt.id, link.type, src);
  }

  return { nodes, cardData };
}

// ─── Edge metadata: resolved endpoint identity + matching spec relationship ──

/** Identity + type of one edge endpoint, resolved from the model. */
export interface EdgeNodeInfo {
  id: string;
  name: string;
  type: string;
  layer: string;
}

/** Fully resolved detail for one model edge (link), for the edge inspector + tooltips. */
export interface EdgeMetadata {
  predicate: string;
  sourceNode: EdgeNodeInfo;
  targetNode: EdgeNodeInfo;
  /** The `/api/spec` relationship schema matching this edge's endpoint types + predicate, when declared. */
  specRelationship?: SpecRelationshipSchema;
}

function toEdgeNodeInfo(node: ModelNode): EdgeNodeInfo {
  return { id: node.id, name: node.name, type: node.type, layer: node.layer_id };
}

/**
 * Find the spec relationship schema matching a resolved edge's endpoint types
 * and predicate. Cross-layer relationship schemas are declared once, in the
 * SOURCE layer's schema file (verified against the live `/api/spec` fixture),
 * so the source layer is searched first; the destination layer is checked as
 * a defensive fallback in case a relationship is declared the other way.
 */
function findSpecRelationship(
  specRaw: SpecPayload | undefined,
  src: ModelNode,
  tgt: ModelNode,
  predicate: string,
): SpecRelationshipSchema | undefined {
  const sourceSpecNodeId = `${src.layer_id}.${src.type}`;
  const targetSpecNodeId = `${tgt.layer_id}.${tgt.type}`;

  const search = (layer: string): SpecRelationshipSchema | undefined => {
    const rels = schemaForLayer(specRaw, layer)?.relationshipSchemas ?? {};
    return Object.values(rels).find(
      (rel) =>
        rel.source_spec_node_id === sourceSpecNodeId &&
        rel.destination_spec_node_id === targetSpecNodeId &&
        rel.predicate === predicate,
    );
  };

  return search(src.layer_id) ?? search(tgt.layer_id);
}

/**
 * Resolve a link id to its full edge detail: both endpoints' identity + type,
 * the predicate, and the matching spec relationship schema (when the spec
 * declares one for this endpoint-type pair + predicate). Returns `undefined`
 * when the link id is unknown or either endpoint fails to resolve.
 */
export function edgeMetadata(
  model: ModelDerived,
  edgeId: string,
  index: ModelIndex,
  specRaw: SpecPayload | undefined,
): EdgeMetadata | undefined {
  const link = model.links.find((l) => l.id === edgeId);
  if (!link) return undefined;

  const src = resolveEndpoint(index, link.source);
  const tgt = resolveEndpoint(index, link.target);
  if (!src || !tgt) return undefined;

  return {
    predicate: link.type,
    sourceNode: toEdgeNodeInfo(src),
    targetNode: toEdgeNodeInfo(tgt),
    specRelationship: findSpecRelationship(specRaw, src, tgt, link.type),
  };
}

export type { ModelLink };
