/**
 * Pathfinding utilities for elbow edge routing with obstacle avoidance.
 *
 * Implements A* pathfinding through a Hanan grid built from node bounding boxes,
 * producing obstacle-avoiding orthogonal paths with rounded corners.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Parameters for getControlPoints — the unified routing entry point.
 */
export interface ControlPointsParams {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: string;
  targetPosition: string;
  obstacles: Rectangle[];
  sourceRect?: Rectangle;
  targetRect?: Rectangle;
}

// ---------------------------------------------------------------------------
// Public helpers (still used by edge components and tests)
// ---------------------------------------------------------------------------

/**
 * Check if a line segment intersects with a rectangle (node).
 * Expands the rect by 10px for clearance.
 */
export function lineIntersectsRect(
  p1: Point,
  p2: Point,
  rect: Rectangle
): boolean {
  const padding = 10;
  const r = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  if (
    (p1.x < r.x && p2.x < r.x) ||
    (p1.x > r.x + r.width && p2.x > r.x + r.width) ||
    (p1.y < r.y && p2.y < r.y) ||
    (p1.y > r.y + r.height && p2.y > r.y + r.height)
  ) {
    return false;
  }

  if (pointInRect(p1, r) || pointInRect(p2, r)) return true;

  return (
    lineIntersectsLine(p1, p2, { x: r.x, y: r.y }, { x: r.x + r.width, y: r.y }) ||
    lineIntersectsLine(p1, p2, { x: r.x + r.width, y: r.y }, { x: r.x + r.width, y: r.y + r.height }) ||
    lineIntersectsLine(p1, p2, { x: r.x + r.width, y: r.y + r.height }, { x: r.x, y: r.y + r.height }) ||
    lineIntersectsLine(p1, p2, { x: r.x, y: r.y + r.height }, { x: r.x, y: r.y })
  );
}

function pointInRect(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function lineIntersectsLine(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y);
  if (det === 0) return false;
  const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
  const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
  return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1;
}

// ---------------------------------------------------------------------------
// A* routing internals
// ---------------------------------------------------------------------------

interface AStarNode {
  point: Point;
  g: number;
  f: number;
  parent: AStarNode | null;
  direction: 'horizontal' | 'vertical' | null;
}

function pointKey(p: Point): string {
  return `${Math.round(p.x)},${Math.round(p.y)}`;
}

function heuristicCost(from: Point, to: Point): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

/**
 * Build a Hanan grid from expanded node bounding boxes.
 * The grid guarantees that any two grid points sharing an x or y coordinate
 * can be connected by a straight horizontal/vertical segment that avoids nodes.
 */
function buildCandidateGrid(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourceRect?: Rectangle,
  targetRect?: Rectangle
): Point[] {
  const margin = 20;
  const xs = new Set<number>();
  const ys = new Set<number>();

  xs.add(Math.round(start.x));
  ys.add(Math.round(start.y));
  xs.add(Math.round(end.x));
  ys.add(Math.round(end.y));

  const allRects = [...obstacles];
  if (sourceRect) allRects.push(sourceRect);
  if (targetRect) allRects.push(targetRect);

  for (const rect of allRects) {
    xs.add(Math.round(rect.x - margin));
    xs.add(Math.round(rect.x + rect.width + margin));
    ys.add(Math.round(rect.y - margin));
    ys.add(Math.round(rect.y + rect.height + margin));
  }

  const points: Point[] = [];
  for (const x of xs) {
    for (const y of ys) {
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * Pre-compute orthogonal neighbors for each candidate grid point.
 * Reduces the A* inner loop from O(|candidates|) to O(|xs| + |ys|) per iteration.
 */
function buildAdjacencyMap(candidates: Point[]): Map<string, Point[]> {
  const byX = new Map<number, Point[]>();
  const byY = new Map<number, Point[]>();

  for (const p of candidates) {
    if (!byX.has(p.x)) byX.set(p.x, []);
    byX.get(p.x)!.push(p);
    if (!byY.has(p.y)) byY.set(p.y, []);
    byY.get(p.y)!.push(p);
  }

  const adjacency = new Map<string, Point[]>();
  for (const p of candidates) {
    const neighbors: Point[] = [];
    for (const q of byX.get(p.x) ?? []) {
      if (q.y !== p.y) neighbors.push(q); // vertical move
    }
    for (const q of byY.get(p.y) ?? []) {
      if (q.x !== p.x) neighbors.push(q); // horizontal move
    }
    adjacency.set(pointKey(p), neighbors);
  }
  return adjacency;
}

/**
 * A* search through the candidate Hanan grid.
 * Uses a pre-computed adjacency map so each iteration only visits true orthogonal
 * neighbors (O(|xs| + |ys|)) rather than scanning all candidates (O(|xs| * |ys|)).
 * Direction changes incur a penalty to bias toward fewer bends.
 */
function getAStarPath(
  start: Point,
  end: Point,
  candidates: Point[],
  obstacles: Rectangle[],
  sourceRect?: Rectangle,
  targetRect?: Rectangle
): Point[] | null {
  const startKey = pointKey(start);
  const endKey = pointKey(end);

  // Pre-build adjacency map so the inner loop is O(neighbors) not O(all candidates)
  const adjacencyMap = buildAdjacencyMap(candidates);

  const openSet = new Map<string, AStarNode>();
  const closedSet = new Set<string>();

  openSet.set(startKey, {
    point: start,
    g: 0,
    f: heuristicCost(start, end),
    parent: null,
    direction: null,
  });

  let iterations = 0;
  const MAX_ITERATIONS = 2000;

  while (openSet.size > 0 && iterations++ < MAX_ITERATIONS) {
    // Pick the node with the lowest f score
    let currentKey = '';
    let current: AStarNode | null = null;
    let lowestF = Infinity;
    for (const [key, node] of openSet) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentKey = key;
        current = node;
      }
    }

    if (!current) break;

    if (currentKey === endKey) {
      const path: Point[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(node.point);
        node = node.parent;
      }
      return path;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    // Only visit true orthogonal neighbors via the adjacency map
    const neighbors = adjacencyMap.get(currentKey) ?? [];
    for (const candidate of neighbors) {
      const neighborKey = pointKey(candidate);
      if (closedSet.has(neighborKey)) continue;

      const dx = candidate.x - current.point.x;
      const dy = candidate.y - current.point.y;
      // Adjacency map guarantees orthogonality, so one of dx/dy is always 0
      const direction: 'horizontal' | 'vertical' = dx !== 0 ? 'horizontal' : 'vertical';

      // Check against obstacles
      let blocked = false;
      for (const obs of obstacles) {
        if (lineIntersectsRect(current.point, candidate, obs)) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;

      // Avoid routing back through the source/target node (for intermediate moves)
      const isFromStart = currentKey === startKey;
      const isToEnd = neighborKey === endKey;
      if (!isFromStart && sourceRect && lineIntersectsRect(current.point, candidate, sourceRect)) continue;
      if (!isToEnd && targetRect && lineIntersectsRect(current.point, candidate, targetRect)) continue;

      const turnPenalty = current.direction !== null && current.direction !== direction ? 100 : 0;
      const g = current.g + Math.abs(dx) + Math.abs(dy) + turnPenalty;

      const existing = openSet.get(neighborKey);
      if (!existing || g < existing.g) {
        openSet.set(neighborKey, {
          point: candidate,
          g,
          f: g + heuristicCost(candidate, end),
          parent: current,
          direction,
        });
      }
    }
  }

  return null;
}

/**
 * Remove collinear intermediate waypoints to tighten the path.
 */
function reducePoints(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    const collinear =
      (Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1) ||
      (Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1);
    if (!collinear) result.push(curr);
  }
  result.push(points[points.length - 1]);
  return result;
}

// ---------------------------------------------------------------------------
// Simple / channel routing (fast paths kept from old implementation)
// ---------------------------------------------------------------------------

function getSimpleElbow(start: Point, end: Point, sourcePos: string, ratio: number): Point[] {
  const isHorizontal = sourcePos === 'left' || sourcePos === 'right';
  if (isHorizontal) {
    const midX = start.x + (end.x - start.x) * ratio;
    return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
  } else {
    const midY = start.y + (end.y - start.y) * ratio;
    return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
  }
}

function hasCollision(path: Point[], obstacles: Rectangle[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    for (const obstacle of obstacles) {
      if (lineIntersectsRect(path[i], path[i + 1], obstacle)) return true;
    }
  }
  return false;
}

function findSimplePath(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourcePos: string
): Point[] | null {
  const ratios = [0.5, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9];
  for (const ratio of ratios) {
    const path = getSimpleElbow(start, end, sourcePos, ratio);
    if (!hasCollision(path, obstacles)) return path;
  }
  return null;
}

function findChannelPath(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourcePos: string,
  targetPos: string
): Point[] | null {
  const isHorizontal = sourcePos === 'left' || sourcePos === 'right';
  const margin = 20;
  const minVal = isHorizontal ? Math.min(start.y, end.y) - 200 : Math.min(start.x, end.x) - 200;
  const maxVal = isHorizontal ? Math.max(start.y, end.y) + 200 : Math.max(start.x, end.x) + 200;
  const step = 20;
  const center = (minVal + maxVal) / 2;

  const searchValues: number[] = [];
  for (let v = minVal; v <= maxVal; v += step) searchValues.push(v);
  searchValues.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

  for (const val of searchValues) {
    let path: Point[];
    if (isHorizontal) {
      const exitDir = sourcePos === 'right' ? 1 : -1;
      const enterDir = targetPos === 'right' ? -1 : 1;
      path = [
        start,
        { x: start.x + exitDir * margin, y: start.y },
        { x: start.x + exitDir * margin, y: val },
        { x: end.x + enterDir * margin, y: val },
        { x: end.x + enterDir * margin, y: end.y },
        end,
      ];
    } else {
      const exitDir = sourcePos === 'bottom' ? 1 : -1;
      const enterDir = targetPos === 'bottom' ? -1 : 1;
      path = [
        start,
        { x: start.x, y: start.y + exitDir * margin },
        { x: val, y: start.y + exitDir * margin },
        { x: val, y: end.y + enterDir * margin },
        { x: end.x, y: end.y + enterDir * margin },
        end,
      ];
    }
    if (!hasCollision(path, obstacles)) return path;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Unified edge routing entry point.
 *
 * Strategy (fastest to slowest):
 * 1. Simple 3-segment elbow (tries 7 ratio variants)
 * 2. 5-segment channel routing (scans ±200 px perpendicular channel)
 * 3. A* through Hanan grid built from expanded node bounding boxes
 * 4. Fallback direct elbow (may have collisions)
 */
export function getControlPoints(params: ControlPointsParams): Point[] {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, obstacles, sourceRect, targetRect } = params;
  // Round to integers so start/end coordinates match the Hanan grid (which uses Math.round throughout)
  const start: Point = { x: Math.round(sourceX), y: Math.round(sourceY) };
  const end: Point = { x: Math.round(targetX), y: Math.round(targetY) };

  const simple = findSimplePath(start, end, obstacles, sourcePosition);
  if (simple) return simple;

  const channel = findChannelPath(start, end, obstacles, sourcePosition, targetPosition);
  if (channel) return channel;

  const candidates = buildCandidateGrid(start, end, obstacles, sourceRect, targetRect);
  const astarResult = getAStarPath(start, end, candidates, obstacles, sourceRect, targetRect);
  if (astarResult) return reducePoints(astarResult);

  return getSimpleElbow(start, end, sourcePosition, 0.5);
}

/**
 * Convert a polyline to an SVG path string with rounded corners.
 * Each interior bend is replaced with a quadratic Bézier arc of the given radius.
 */
export function pointsToSVGPath(points: Point[], cornerRadius: number = 8): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const d1x = curr.x - prev.x;
    const d1y = curr.y - prev.y;
    const d2x = next.x - curr.x;
    const d2y = next.y - curr.y;

    const len1 = Math.sqrt(d1x * d1x + d1y * d1y);
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y);

    if (len1 < 0.01 || len2 < 0.01) {
      path += ` L ${curr.x},${curr.y}`;
      continue;
    }

    const r = Math.min(cornerRadius, len1 / 2, len2 / 2);
    const p1 = { x: curr.x - (d1x / len1) * r, y: curr.y - (d1y / len1) * r };
    const p2 = { x: curr.x + (d2x / len2) * r, y: curr.y + (d2y / len2) * r };

    path += ` L ${p1.x},${p1.y}`;
    path += ` Q ${curr.x},${curr.y} ${p2.x},${p2.y}`;
  }

  path += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;
  return path;
}

/**
 * @deprecated Use `getControlPoints()` instead. Retained for backward compatibility.
 */
export function calculateElbowPath(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourcePosition: string,
  targetPosition: string
): Point[] {
  return getControlPoints({
    sourceX: start.x,
    sourceY: start.y,
    targetX: end.x,
    targetY: end.y,
    sourcePosition,
    targetPosition,
    obstacles,
  });
}
