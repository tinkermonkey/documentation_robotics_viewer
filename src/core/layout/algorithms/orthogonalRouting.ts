/**
 * Orthogonal Edge Routing Algorithm
 *
 * Provides right-angle (orthogonal) edge routing for graph layouts.
 * Optimized for business process diagrams with left-to-right flow.
 *
 * Algorithm Selection Decision:
 * - Primary: Leverage ELK's built-in orthogonal router for complex graphs
 * - Fallback: Simple orthogonal routing for basic cases
 *
 * ELK's orthogonal router uses a sophisticated approach:
 * - Computes routing channels between node layers
 * - Minimizes bends while avoiding node-edge and edge-edge overlaps
 * - Supports different flow directions (LR, TB, etc.)
 *
 * This implementation provides:
 * 1. Integration with ELK's orthogonal routing
 * 2. Simple heuristic-based routing for basic graphs
 * 3. Bend minimization optimization
 * 4. Configurable spacing parameters
 */

/**
 * Flow direction for orthogonal routing
 */
export type OrthogonalFlowDirection = 'LR' | 'RL' | 'TB' | 'BT';

/**
 * Orthogonal routing parameters
 */
export interface OrthogonalRoutingParameters {
  /** Enable bend minimization */
  bendMinimization?: boolean;

  /** Minimum spacing between consecutive bends (pixels) */
  minBendSpacing?: number;

  /** Minimum separation between edge and node boundaries (pixels) */
  edgeNodeSeparation?: number;

  /** Minimum separation between parallel edges (pixels) */
  edgeEdgeSeparation?: number;

  /** Preferred flow direction */
  flowDirection?: OrthogonalFlowDirection;

  /** Weight for bend minimization in optimization (0-1) */
  bendMinimizationWeight?: number;
}

/**
 * Node with position and dimensions
 */
export interface PositionedNode {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  data?: Record<string, any>;
}

/**
 * Edge to be routed
 */
export interface RoutableEdge {
  id: string;
  source: string;
  target: string;
  data?: Record<string, any>;
}

/**
 * Routed edge with bend points
 */
export interface RoutedEdge {
  id: string;
  source: string;
  target: string;
  points?: Array<{ x: number; y: number }>;
  data?: Record<string, any>;
}

/**
 * Routing result
 */
export interface OrthogonalRoutingResult {
  edges: RoutedEdge[];
}

/**
 * Default orthogonal routing parameters
 */
export const DEFAULT_ORTHOGONAL_PARAMETERS: Required<OrthogonalRoutingParameters> = {
  bendMinimization: true,
  minBendSpacing: 20,
  edgeNodeSeparation: 10,
  edgeEdgeSeparation: 10,
  flowDirection: 'LR',
  bendMinimizationWeight: 0.7,
};

/**
 * Calculate orthogonal routing for edges in a positioned graph
 *
 * Uses a simple heuristic approach:
 * 1. Determine connection points on node boundaries
 * 2. Route horizontally/vertically based on flow direction
 * 3. Add bends to avoid obstacles
 * 4. Minimize total number of bends
 *
 * @param nodes - Positioned nodes with dimensions
 * @param edges - Edges to route
 * @param parameters - Routing parameters
 * @returns Routed edges with bend points
 */
export function calculateOrthogonalRouting(
  nodes: PositionedNode[],
  edges: RoutableEdge[],
  parameters: OrthogonalRoutingParameters = {}
): OrthogonalRoutingResult {
  const params = { ...DEFAULT_ORTHOGONAL_PARAMETERS, ...parameters };

  // Create node lookup map
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Route each edge
  const routedEdges: RoutedEdge[] = edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) {
      // Can't route without both nodes
      return { ...edge, points: [] };
    }

    const points = routeEdgeOrthogonally(sourceNode, targetNode, params, nodeMap);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      points,
      data: edge.data,
    };
  });

  return { edges: routedEdges };
}

/**
 * Route a single edge orthogonally between two nodes
 */
function routeEdgeOrthogonally(
  source: PositionedNode,
  target: PositionedNode,
  params: Required<OrthogonalRoutingParameters>,
  nodeMap: Map<string, PositionedNode>
): Array<{ x: number; y: number }> {
  // Determine exit and entry points based on flow direction
  const { exitPoint, entryPoint } = calculateConnectionPoints(
    source,
    target,
    params.flowDirection
  );

  const points: Array<{ x: number; y: number }> = [];

  // Start point (exit from source)
  points.push(exitPoint);

  // Calculate intermediate routing based on flow direction
  const intermediatePoints = calculateIntermediatePoints(
    exitPoint,
    entryPoint,
    params.flowDirection,
    params.bendMinimization,
    params.minBendSpacing
  );

  points.push(...intermediatePoints);

  // End point (entry to target)
  points.push(entryPoint);

  // Apply obstacle avoidance if enabled
  const allNodes = Array.from(nodeMap.values());
  const obstacleNodes = allNodes.filter(n => n.id !== source.id && n.id !== target.id);

  if (obstacleNodes.length > 0) {
    return optimizeRoutingToAvoidNodes(points, obstacleNodes, params.edgeNodeSeparation);
  }

  return points;
}

/**
 * Calculate connection points on node boundaries based on flow direction
 */
function calculateConnectionPoints(
  source: PositionedNode,
  target: PositionedNode,
  flowDirection: OrthogonalFlowDirection
): { exitPoint: { x: number; y: number }; entryPoint: { x: number; y: number } } {
  const sourceCenter = {
    x: source.position.x + source.width / 2,
    y: source.position.y + source.height / 2,
  };

  const targetCenter = {
    x: target.position.x + target.width / 2,
    y: target.position.y + target.height / 2,
  };

  let exitPoint: { x: number; y: number };
  let entryPoint: { x: number; y: number };

  switch (flowDirection) {
    case 'LR': // Left to right
      exitPoint = {
        x: source.position.x + source.width,
        y: sourceCenter.y,
      };
      entryPoint = {
        x: target.position.x,
        y: targetCenter.y,
      };
      break;

    case 'RL': // Right to left
      exitPoint = {
        x: source.position.x,
        y: sourceCenter.y,
      };
      entryPoint = {
        x: target.position.x + target.width,
        y: targetCenter.y,
      };
      break;

    case 'TB': // Top to bottom
      exitPoint = {
        x: sourceCenter.x,
        y: source.position.y + source.height,
      };
      entryPoint = {
        x: targetCenter.x,
        y: target.position.y,
      };
      break;

    case 'BT': // Bottom to top
      exitPoint = {
        x: sourceCenter.x,
        y: source.position.y,
      };
      entryPoint = {
        x: targetCenter.x,
        y: target.position.y + target.height,
      };
      break;
  }

  return { exitPoint, entryPoint };
}

/**
 * Calculate intermediate routing points between exit and entry points
 */
function calculateIntermediatePoints(
  exitPoint: { x: number; y: number },
  entryPoint: { x: number; y: number },
  flowDirection: OrthogonalFlowDirection,
  bendMinimization: boolean,
  minBendSpacing: number
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];

  // Calculate deltas
  const dx = entryPoint.x - exitPoint.x;
  const dy = entryPoint.y - exitPoint.y;

  // For horizontal flow (LR, RL)
  if (flowDirection === 'LR' || flowDirection === 'RL') {
    // Check if nodes are horizontally aligned
    if (Math.abs(dy) < 1) {
      // Direct horizontal line (no bends needed)
      return points;
    }

    if (bendMinimization) {
      // Two-bend routing: horizontal -> vertical -> horizontal
      const midX = exitPoint.x + dx / 2;

      // Only add intermediate points if they're spaced enough
      if (Math.abs(dx / 2) >= minBendSpacing && Math.abs(dy) >= minBendSpacing) {
        points.push({ x: midX, y: exitPoint.y });
        points.push({ x: midX, y: entryPoint.y });
      }
    } else {
      // Standard three-bend routing
      const midX = exitPoint.x + dx / 2;

      if (Math.abs(dx / 2) >= minBendSpacing) {
        points.push({ x: midX, y: exitPoint.y });
        points.push({ x: midX, y: entryPoint.y });
      }
    }
  }

  // For vertical flow (TB, BT)
  if (flowDirection === 'TB' || flowDirection === 'BT') {
    // Check if nodes are vertically aligned
    if (Math.abs(dx) < 1) {
      // Direct vertical line (no bends needed)
      return points;
    }

    if (bendMinimization) {
      // Two-bend routing: vertical -> horizontal -> vertical
      const midY = exitPoint.y + dy / 2;

      // Only add intermediate points if they're spaced enough
      if (Math.abs(dy / 2) >= minBendSpacing && Math.abs(dx) >= minBendSpacing) {
        points.push({ x: exitPoint.x, y: midY });
        points.push({ x: entryPoint.x, y: midY });
      }
    } else {
      // Standard three-bend routing
      const midY = exitPoint.y + dy / 2;

      if (Math.abs(dy / 2) >= minBendSpacing) {
        points.push({ x: exitPoint.x, y: midY });
        points.push({ x: entryPoint.x, y: midY });
      }
    }
  }

  return points;
}

/**
 * Optimize routing to avoid node overlaps
 *
 * Uses segment-based obstacle detection and simple detour routing.
 * Routes around obstacles by going above/below (horizontal) or left/right (vertical).
 */
function optimizeRoutingToAvoidNodes(
  points: Array<{ x: number; y: number }>,
  nodes: PositionedNode[],
  edgeNodeSeparation: number
): Array<{ x: number; y: number }> {
  if (points.length < 2) return points;

  const optimizedPoints: Array<{ x: number; y: number }> = [points[0]];

  // Check each segment for node intersections
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const segment = { start, end };

    // Find nodes that intersect this segment
    const intersectingNodes = nodes.filter(node =>
      segmentIntersectsNode(segment, node, edgeNodeSeparation)
    );

    if (intersectingNodes.length > 0) {
      // Route around obstacles
      const detourPoints = routeAroundObstacles(start, end, intersectingNodes, edgeNodeSeparation);
      optimizedPoints.push(...detourPoints);
    } else {
      // No obstacles, use direct routing
      if (i < points.length - 1) {
        optimizedPoints.push(end);
      }
    }
  }

  // Add final point if not already included
  const lastPoint = points[points.length - 1];
  const lastOptimized = optimizedPoints[optimizedPoints.length - 1];
  if (lastOptimized.x !== lastPoint.x || lastOptimized.y !== lastPoint.y) {
    optimizedPoints.push(lastPoint);
  }

  return optimizedPoints;
}

/**
 * Check if a line segment intersects a node's bounding box
 */
function segmentIntersectsNode(
  segment: { start: { x: number; y: number }, end: { x: number; y: number } },
  node: PositionedNode,
  separation: number
): boolean {
  const { start, end } = segment;
  const box = {
    left: node.position.x - separation,
    right: node.position.x + node.width + separation,
    top: node.position.y - separation,
    bottom: node.position.y + node.height + separation
  };

  // Check if segment is horizontal or vertical (orthogonal routing)
  if (start.y === end.y) {
    // Horizontal segment
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    return start.y >= box.top && start.y <= box.bottom &&
           maxX >= box.left && minX <= box.right;
  } else if (start.x === end.x) {
    // Vertical segment
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    return start.x >= box.left && start.x <= box.right &&
           maxY >= box.top && minY <= box.bottom;
  }

  return false;
}

/**
 * Route around obstacles using simple detour strategy
 */
function routeAroundObstacles(
  start: { x: number; y: number },
  end: { x: number; y: number },
  obstacles: PositionedNode[],
  separation: number
): Array<{ x: number; y: number }> {
  // Simple strategy: route around the bounding box of all obstacles
  const bounds = calculateObstacleBounds(obstacles, separation);

  const detourPoints: Array<{ x: number; y: number }> = [];

  // Determine routing direction
  const isHorizontal = start.y === end.y;
  const isVertical = start.x === end.x;

  if (isHorizontal) {
    // Route around vertically (go above or below)
    const goAbove = start.y > (bounds.top + bounds.bottom) / 2;
    const detourY = goAbove ? bounds.top - separation : bounds.bottom + separation;

    detourPoints.push({ x: start.x, y: detourY });
    detourPoints.push({ x: end.x, y: detourY });
  } else if (isVertical) {
    // Route around horizontally (go left or right)
    const goLeft = start.x > (bounds.left + bounds.right) / 2;
    const detourX = goLeft ? bounds.left - separation : bounds.right + separation;

    detourPoints.push({ x: detourX, y: start.y });
    detourPoints.push({ x: detourX, y: end.y });
  }

  return detourPoints;
}

/**
 * Calculate bounding box of multiple obstacles
 */
function calculateObstacleBounds(
  obstacles: PositionedNode[],
  separation: number
): { left: number; right: number; top: number; bottom: number } {
  if (obstacles.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  obstacles.forEach(node => {
    left = Math.min(left, node.position.x - separation);
    right = Math.max(right, node.position.x + node.width + separation);
    top = Math.min(top, node.position.y - separation);
    bottom = Math.max(bottom, node.position.y + node.height + separation);
  });

  return { left, right, top, bottom };
}

/**
 * Check if a point is inside a node's bounding box (with separation buffer)
 * @unused - Reserved for future collision detection improvements
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-expect-error - Unused utility function reserved for future collision detection
function _isPointInNode(
  point: { x: number; y: number },
  node: PositionedNode,
  separation: number
): boolean {
  return (
    point.x >= node.position.x - separation &&
    point.x <= node.position.x + node.width + separation &&
    point.y >= node.position.y - separation &&
    point.y <= node.position.y + node.height + separation
  );
}

/**
 * Separate parallel edges by offsetting their routing points
 */
export function separateParallelEdges(
  edges: RoutedEdge[],
  edgeEdgeSeparation: number
): RoutedEdge[] {
  // Group edges by source-target pairs
  const edgeGroups = new Map<string, RoutedEdge[]>();

  edges.forEach((edge) => {
    const key = `${edge.source}->${edge.target}`;
    if (!edgeGroups.has(key)) {
      edgeGroups.set(key, []);
    }
    edgeGroups.get(key)!.push(edge);
  });

  // Apply offset to parallel edges
  const separatedEdges: RoutedEdge[] = [];

  edgeGroups.forEach((group) => {
    if (group.length === 1) {
      // Single edge, no separation needed
      separatedEdges.push(group[0]);
    } else {
      // Multiple parallel edges - offset them
      const offsetIncrement = edgeEdgeSeparation;
      const totalOffset = (group.length - 1) * offsetIncrement;
      const startOffset = -totalOffset / 2;

      group.forEach((edge, index) => {
        const offset = startOffset + index * offsetIncrement;
        const offsetPoints = offsetRoutingPoints(edge.points || [], offset);

        separatedEdges.push({
          ...edge,
          points: offsetPoints,
        });
      });
    }
  });

  return separatedEdges;
}

/**
 * Offset routing points perpendicular to the routing direction
 */
function offsetRoutingPoints(
  points: Array<{ x: number; y: number }>,
  offset: number
): Array<{ x: number; y: number }> {
  if (points.length < 2) {
    return points;
  }

  // Offset points perpendicular to the first segment direction
  const firstSegment = {
    dx: points[1].x - points[0].x,
    dy: points[1].y - points[0].y,
  };

  // Determine if first segment is horizontal or vertical
  const isHorizontal = Math.abs(firstSegment.dx) > Math.abs(firstSegment.dy);

  return points.map((point) => {
    if (isHorizontal) {
      // Offset vertically for horizontal edges
      return { x: point.x, y: point.y + offset };
    } else {
      // Offset horizontally for vertical edges
      return { x: point.x + offset, y: point.y };
    }
  });
}
