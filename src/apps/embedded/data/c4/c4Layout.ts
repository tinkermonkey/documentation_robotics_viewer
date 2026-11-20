/**
 * c4Layout — where the boxes and arrows of one C4 view go.
 *
 * A proof of concept for a nested layout Heimdall doesn't have yet: the boxes
 * in scope sit inside one boundary rectangle, the outside elements around it,
 * and arrows run at right angles, crossing the boundary where they must. ELK
 * (elkjs) does the work for now. Nothing outside this module sees ELK's
 * types, so a native Heimdall engine can replace it behind `layoutC4View`.
 *
 * elkjs is imported lazily (it is about 1.6 MB), so it loads only when the
 * Architecture view first draws a diagram.
 */

import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk-api';
import type { C4View } from './c4Views';

export interface C4Point {
  x: number;
  y: number;
}

/** A rectangle by its top-left corner. */
export interface C4Box extends C4Point {
  width: number;
  height: number;
}

export interface C4EdgeRoute {
  /** The view relationship's id. */
  id: string;
  /** Polyline from the source box's edge to the target's. */
  points: C4Point[];
  /** Where the label goes (top-left and size), when the arrow has one. */
  label?: C4Box;
}

export interface C4Layout {
  width: number;
  height: number;
  /** View element id → its box. */
  boxes: Map<string, C4Box>;
  /** The scope's boundary rectangle; null on a Context diagram. */
  boundary: C4Box | null;
  edges: C4EdgeRoute[];
}

/** The size every card is laid out at. `C4Diagram` draws them at exactly this size. */
export const C4_CARD = { width: 232, height: 116 } as const;

/** Room at the top of the boundary for its title. */
const BOUNDARY_TITLE = 44;
const BOUNDARY_PAD = 28;
const BOUNDARY_ID = '__c4_boundary__';

const LABEL_CHAR = 6.4;
const LABEL_HEIGHT = 18;
const LABEL_MAX = 200;

/** The text an arrow is labelled with: its labels, and a count past one link. */
export function c4EdgeLabel(labels: readonly string[], count: number): string {
  const text = labels.slice(0, 2).join(', ') + (labels.length > 2 ? ', …' : '');
  return count > 1 ? `${text} · ${count}` : text;
}

function labelSize(text: string): { width: number; height: number } {
  return { width: Math.min(LABEL_MAX, Math.ceil(text.length * LABEL_CHAR) + 12), height: LABEL_HEIGHT };
}

type ElkLike = { layout: (graph: ElkNode) => Promise<ElkNode> };
let elkPromise: Promise<ElkLike> | null = null;

function loadElk(): Promise<ElkLike> {
  if (!elkPromise) {
    elkPromise = import('elkjs/lib/elk.bundled.js').then((mod) => {
      const Elk = (mod as unknown as { default: new () => ElkLike }).default;
      return new Elk();
    });
    // A failed load (offline, a chunk that 404s) must not be remembered.
    elkPromise.catch(() => {
      elkPromise = null;
    });
  }
  return elkPromise;
}

export async function layoutC4View(view: C4View): Promise<C4Layout> {
  if (view.elements.length === 0) {
    return { width: 0, height: 0, boxes: new Map(), boundary: null, edges: [] };
  }
  const card = (id: string): ElkNode => ({ id, width: C4_CARD.width, height: C4_CARD.height });
  const inside = view.elements.filter((e) => e.inScope).map((e) => card(e.id));
  const outside = view.elements.filter((e) => !e.inScope).map((e) => card(e.id));
  const bounded = view.scope !== null && inside.length > 0;

  const children: ElkNode[] = bounded
    ? [
        {
          id: BOUNDARY_ID,
          children: inside,
          layoutOptions: {
            'elk.padding': `[top=${BOUNDARY_TITLE + BOUNDARY_PAD},left=${BOUNDARY_PAD},bottom=${BOUNDARY_PAD},right=${BOUNDARY_PAD}]`,
          },
        },
        ...outside,
      ]
    : [...inside, ...outside];

  const edges: ElkExtendedEdge[] = view.relationships.map((rel) => {
    const text = c4EdgeLabel(rel.labels, rel.count);
    return {
      id: rel.id,
      sources: [rel.sourceId],
      targets: [rel.targetId],
      labels: text ? [{ text, ...labelSize(text) }] : [],
    };
  });

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '44',
      'elk.layered.spacing.nodeNodeBetweenLayers': '72',
      'elk.layered.spacing.edgeNodeBetweenLayers': '28',
      'elk.spacing.edgeNode': '24',
      'elk.spacing.edgeEdge': '14',
      'elk.spacing.edgeLabel': '6',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.separateConnectedComponents': 'true',
      'elk.spacing.componentComponent': '56',
      'elk.padding': '[top=24,left=24,bottom=24,right=24]',
    },
    children,
    edges,
  };

  const elk = await loadElk();
  const out = await elk.layout(graph);

  const boxes = new Map<string, C4Box>();
  let boundary: C4Box | null = null;
  /** Absolute origin of every node that can own edges (edge coordinates are relative to their container). */
  const origins = new Map<string, C4Point>([['root', { x: 0, y: 0 }]]);
  const walk = (node: ElkNode, ox: number, oy: number) => {
    for (const child of node.children ?? []) {
      const box = { x: ox + (child.x ?? 0), y: oy + (child.y ?? 0), width: child.width ?? 0, height: child.height ?? 0 };
      origins.set(child.id, { x: box.x, y: box.y });
      if (child.id === BOUNDARY_ID) boundary = box;
      else boxes.set(child.id, box);
      walk(child, box.x, box.y);
    }
  };
  walk(out, 0, 0);

  const routes: C4EdgeRoute[] = [];
  const collect = (node: ElkNode) => {
    for (const edge of (node.edges ?? []) as Array<ElkExtendedEdge & { container?: string }>) {
      const origin = origins.get(edge.container ?? node.id) ?? { x: 0, y: 0 };
      const points: C4Point[] = [];
      for (const section of edge.sections ?? []) {
        for (const p of [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]) {
          points.push({ x: origin.x + p.x, y: origin.y + p.y });
        }
      }
      const l = edge.labels?.[0];
      const label =
        l && l.x !== undefined && l.y !== undefined
          ? { x: origin.x + l.x, y: origin.y + l.y, width: l.width ?? 0, height: l.height ?? 0 }
          : undefined;
      if (points.length >= 2) routes.push({ id: edge.id, points, label });
    }
    for (const child of node.children ?? []) collect(child);
  };
  collect(out);

  return { width: out.width ?? 0, height: out.height ?? 0, boxes, boundary, edges: routes };
}
