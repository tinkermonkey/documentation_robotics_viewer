/**
 * Pathfinding utilities for elbow edge routing with obstacle avoidance
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
 * Check if a line segment intersects with a rectangle (node)
 */
export function lineIntersectsRect(
  p1: Point,
  p2: Point,
  rect: Rectangle
): boolean {
  // Expand rect slightly for clearance
  const padding = 10;
  const expandedRect = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  // Check if line is entirely outside the rectangle
  if (
    (p1.x < expandedRect.x && p2.x < expandedRect.x) ||
    (p1.x > expandedRect.x + expandedRect.width && p2.x > expandedRect.x + expandedRect.width) ||
    (p1.y < expandedRect.y && p2.y < expandedRect.y) ||
    (p1.y > expandedRect.y + expandedRect.height && p2.y > expandedRect.y + expandedRect.height)
  ) {
    return false;
  }

  // Check if either endpoint is inside the rectangle
  if (
    pointInRect(p1, expandedRect) ||
    pointInRect(p2, expandedRect)
  ) {
    return true;
  }

  // Check line-rectangle intersection using Liang-Barsky algorithm
  // For simplicity, we'll use a basic approach
  return (
    lineIntersectsLine(p1, p2, { x: expandedRect.x, y: expandedRect.y }, { x: expandedRect.x + expandedRect.width, y: expandedRect.y }) ||
    lineIntersectsLine(p1, p2, { x: expandedRect.x + expandedRect.width, y: expandedRect.y }, { x: expandedRect.x + expandedRect.width, y: expandedRect.y + expandedRect.height }) ||
    lineIntersectsLine(p1, p2, { x: expandedRect.x + expandedRect.width, y: expandedRect.y + expandedRect.height }, { x: expandedRect.x, y: expandedRect.y + expandedRect.height }) ||
    lineIntersectsLine(p1, p2, { x: expandedRect.x, y: expandedRect.y + expandedRect.height }, { x: expandedRect.x, y: expandedRect.y })
  );
}

/**
 * Check if point is inside rectangle
 */
function pointInRect(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if two line segments intersect
 */
function lineIntersectsLine(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): boolean {
  const det = (a2.x - a1.x) * (b2.y - b1.y) - (b2.x - b1.x) * (a2.y - a1.y);
  if (det === 0) return false;

  const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
  const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;

  return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1;
}

/**
 * Calculate a path avoiding obstacles
 */
export function calculateElbowPath(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourcePosition: string,
  targetPosition: string
): Point[] {
  // 1. Try simple 3-segment paths (Z-shape) with varying midpoints
  const simplePath = findSimplePath(start, end, obstacles, sourcePosition, targetPosition);
  if (simplePath) return simplePath;

  // 2. Try 5-segment paths (Channel routing)
  const channelPath = findChannelPath(start, end, obstacles, sourcePosition, targetPosition);
  if (channelPath) return channelPath;

  // 3. Fallback to a direct elbow path (even if it collides)
  return getSimpleElbow(start, end, sourcePosition, targetPosition, 0.5);
}

/**
 * Try to find a collision-free 3-segment path
 */
function findSimplePath(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourcePos: string,
  targetPos: string
): Point[] | null {
  const isHorizontal = sourcePos === 'left' || sourcePos === 'right';
  
  // Try different split percentages (0.1 to 0.9)
  // We prioritize 0.5 (center), then fan out
  const ratios = [0.5, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9];

  for (const ratio of ratios) {
    const path = getSimpleElbow(start, end, sourcePos, targetPos, ratio);
    if (!hasCollision(path, obstacles)) {
      return path;
    }
  }

  return null;
}

/**
 * Try to find a collision-free 5-segment path (Channel routing)
 * Useful when the direct vertical/horizontal path is blocked
 */
function findChannelPath(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourcePos: string,
  targetPos: string
): Point[] | null {
  const isHorizontal = sourcePos === 'left' || sourcePos === 'right';
  const margin = 20; // Distance to exit the node before turning

  // Define search range for the channel
  // We search for a clear channel perpendicular to the flow
  const minVal = isHorizontal ? Math.min(start.y, end.y) - 200 : Math.min(start.x, end.x) - 200;
  const maxVal = isHorizontal ? Math.max(start.y, end.y) + 200 : Math.max(start.x, end.x) + 200;
  const step = 20;

  // Sort search values by proximity to the center
  const center = (minVal + maxVal) / 2;
  const searchValues: number[] = [];
  for (let v = minVal; v <= maxVal; v += step) {
    searchValues.push(v);
  }
  searchValues.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

  for (const val of searchValues) {
    let path: Point[] = [];

    if (isHorizontal) {
      // Horizontal flow (Left/Right), so we look for a horizontal channel at Y = val
      // Path: Start -> (start.x + dir*margin, start.y) -> (start.x + dir*margin, val) -> (end.x - dir*margin, val) -> (end.x - dir*margin, end.y) -> End
      // Simplified 5-point:
      // Start -> (MidX1, StartY) -> (MidX1, ChannelY) -> (MidX2, ChannelY) -> (MidX2, EndY) -> End
      
      const exitDir = sourcePos === 'right' ? 1 : -1;
      const enterDir = targetPos === 'right' ? -1 : 1; // Target enters from opposite usually
      
      const p1 = start;
      const p2 = { x: start.x + exitDir * margin, y: start.y };
      const p3 = { x: start.x + exitDir * margin, y: val };
      const p4 = { x: end.x + enterDir * margin, y: val };
      const p5 = { x: end.x + enterDir * margin, y: end.y };
      const p6 = end;
      
      path = [p1, p2, p3, p4, p5, p6];
    } else {
      // Vertical flow (Top/Bottom), look for vertical channel at X = val
      const exitDir = sourcePos === 'bottom' ? 1 : -1;
      const enterDir = targetPos === 'bottom' ? -1 : 1;

      const p1 = start;
      const p2 = { x: start.x, y: start.y + exitDir * margin };
      const p3 = { x: val, y: start.y + exitDir * margin };
      const p4 = { x: val, y: end.y + enterDir * margin };
      const p5 = { x: end.x, y: end.y + enterDir * margin };
      const p6 = end;

      path = [p1, p2, p3, p4, p5, p6];
    }

    if (!hasCollision(path, obstacles)) {
      return path;
    }
  }

  return null;
}

/**
 * Generate a simple 3-segment elbow path
 */
function getSimpleElbow(
  start: Point,
  end: Point,
  sourcePos: string,
  targetPos: string,
  ratio: number
): Point[] {
  const isHorizontal = sourcePos === 'left' || sourcePos === 'right';

  if (isHorizontal) {
    const midX = start.x + (end.x - start.x) * ratio;
    return [
      start,
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      end
    ];
  } else {
    const midY = start.y + (end.y - start.y) * ratio;
    return [
      start,
      { x: start.x, y: midY },
      { x: end.x, y: midY },
      end
    ];
  }
}

/**
 * Check if a path has any collisions
 */
function hasCollision(path: Point[], obstacles: Rectangle[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i+1];
    
    for (const obstacle of obstacles) {
      if (lineIntersectsRect(p1, p2, obstacle)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Convert array of points to SVG path string
 */
export function pointsToSVGPath(points: Point[]): string {
  if (points.length < 2) return '';

  // Use rounded corners
  const radius = 8;
  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    // Calculate vectors
    // We can just draw lines for now, or implement rounding manually
    // For simplicity, let's stick to straight lines first to ensure correctness
    path += ` L ${pCurr.x},${pCurr.y}`;
  }
  
  path += ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;

  return path;
}
