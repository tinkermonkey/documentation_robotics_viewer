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
 * Calculate a 3-segment elbow path avoiding obstacles
 */
export function calculateElbowPath(
  start: Point,
  end: Point,
  obstacles: Rectangle[],
  sourcePosition: 'top' | 'bottom' | 'left' | 'right',
  targetPosition: 'top' | 'bottom' | 'left' | 'right'
): Point[] {
  // Determine if we need horizontal-first or vertical-first routing
  const horizontalFirst =
    sourcePosition === 'left' ||
    sourcePosition === 'right' ||
    targetPosition === 'left' ||
    targetPosition === 'right';

  // Try direct elbow path first
  const midPoint = horizontalFirst
    ? { x: (start.x + end.x) / 2, y: start.y }
    : { x: start.x, y: (start.y + end.y) / 2 };

  const segments = horizontalFirst
    ? [
        start,
        { x: midPoint.x, y: start.y },
        { x: midPoint.x, y: end.y },
        end,
      ]
    : [
        start,
        { x: start.x, y: midPoint.y },
        { x: end.x, y: midPoint.y },
        end,
      ];

  // Check if path intersects any obstacles
  let hasCollision = false;
  for (let i = 0; i < segments.length - 1; i++) {
    for (const obstacle of obstacles) {
      if (lineIntersectsRect(segments[i], segments[i + 1], obstacle)) {
        hasCollision = true;
        break;
      }
    }
    if (hasCollision) break;
  }

  // If no collision, return the simple path
  if (!hasCollision) {
    return segments;
  }

  // If collision detected, try alternative routing
  // For now, we'll try offsetting the midpoint
  const offset = 50;
  const alternativeMidPoint = horizontalFirst
    ? { x: midPoint.x, y: start.y + (end.y > start.y ? offset : -offset) }
    : { x: start.x + (end.x > start.x ? offset : -offset), y: midPoint.y };

  const alternativeSegments = horizontalFirst
    ? [
        start,
        { x: alternativeMidPoint.x, y: start.y },
        { x: alternativeMidPoint.x, y: alternativeMidPoint.y },
        { x: alternativeMidPoint.x, y: end.y },
        end,
      ]
    : [
        start,
        { x: start.x, y: alternativeMidPoint.y },
        { x: alternativeMidPoint.x, y: alternativeMidPoint.y },
        { x: end.x, y: alternativeMidPoint.y },
        end,
      ];

  return alternativeSegments;
}

/**
 * Convert array of points to SVG path string
 */
export function pointsToSVGPath(points: Point[]): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`;
  }

  return path;
}
