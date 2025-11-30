/**
 * Motivation Layer Layout Algorithms
 * Implements various layout strategies for motivation graph visualization
 */

import { MotivationGraph, MotivationGraphNode } from '../../apps/embedded/types/motivationGraph';

export interface Position {
  x: number;
  y: number;
}

export interface LayoutOptions {
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  padding?: number;
  iterations?: number;
  centerForce?: number;
  linkDistance?: number;
  chargeStrength?: number;
}

export interface LayoutResult {
  nodePositions: Map<string, Position>;
  bounds: {
    width: number;
    height: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

const DEFAULT_OPTIONS: LayoutOptions = {
  width: 1200,
  height: 800,
  nodeWidth: 180,
  nodeHeight: 110,
  padding: 50,
  iterations: 150,
  centerForce: 0.1,
  linkDistance: 200,
  chargeStrength: -500,
};

/**
 * Force-Directed Layout using simplified physics simulation
 * Based on d3-force algorithm principles
 */
export function forceDirectedLayout(
  graph: MotivationGraph,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width = 1200, height = 800, padding = 50 } = opts;

  console.log('[ForceDirectedLayout] Starting layout with', graph.nodes.size, 'nodes and', graph.edges.size, 'edges');

  // Performance warning for large graphs
  // NOTE: For Phase 3+, this should be migrated to Web Worker for graphs >50 nodes
  if (graph.nodes.size > 50) {
    console.warn(
      `[ForceDirectedLayout] Large graph detected (${graph.nodes.size} nodes). ` +
      'Layout calculation runs on main thread and may impact performance. ' +
      'Consider using Web Worker implementation for graphs >50 nodes (planned for Phase 3+).'
    );
  }

  // Initialize node positions randomly
  const positions = new Map<string, Position>();
  const velocities = new Map<string, { vx: number; vy: number }>();

  for (const [nodeId] of graph.nodes) {
    // Random initial position within bounds
    positions.set(nodeId, {
      x: padding + Math.random() * (width - 2 * padding),
      y: padding + Math.random() * (height - 2 * padding),
    });
    velocities.set(nodeId, { vx: 0, vy: 0 });
  }

  // Simulation parameters
  const alpha = 1.0;
  const alphaDecay = 1 - Math.pow(0.001, 1 / opts.iterations!);
  const linkForce = 0.1;
  const chargeForce = opts.chargeStrength!;
  const centerForce = opts.centerForce!;
  const linkDistance = opts.linkDistance!;

  let currentAlpha = alpha;

  // Run simulation
  for (let iteration = 0; iteration < opts.iterations!; iteration++) {
    // Apply center force (pull nodes towards center)
    for (const [nodeId, pos] of positions) {
      const vel = velocities.get(nodeId)!;
      const dx = (width / 2) - pos.x;
      const dy = (height / 2) - pos.y;
      vel.vx += dx * centerForce * currentAlpha;
      vel.vy += dy * centerForce * currentAlpha;
    }

    // Apply charge force (repulsion between all nodes)
    const nodeIds = Array.from(graph.nodes.keys());
    for (let i = 0; i < nodeIds.length; i++) {
      const id1 = nodeIds[i];
      const pos1 = positions.get(id1)!;
      const vel1 = velocities.get(id1)!;

      for (let j = i + 1; j < nodeIds.length; j++) {
        const id2 = nodeIds[j];
        const pos2 = positions.get(id2)!;
        const vel2 = velocities.get(id2)!;

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        // Coulomb's law-style repulsion
        const force = (chargeForce * currentAlpha) / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        vel1.vx -= fx;
        vel1.vy -= fy;
        vel2.vx += fx;
        vel2.vy += fy;
      }
    }

    // Apply link force (attraction along edges)
    for (const edge of graph.edges.values()) {
      const pos1 = positions.get(edge.sourceId);
      const pos2 = positions.get(edge.targetId);

      if (!pos1 || !pos2) continue;

      const vel1 = velocities.get(edge.sourceId)!;
      const vel2 = velocities.get(edge.targetId)!;

      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Spring force
      const force = (distance - linkDistance) * linkForce * currentAlpha;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      vel1.vx += fx;
      vel1.vy += fy;
      vel2.vx -= fx;
      vel2.vy -= fy;
    }

    // Apply velocities and damping
    const damping = 0.6;
    for (const [nodeId, pos] of positions) {
      const vel = velocities.get(nodeId)!;
      pos.x += vel.vx;
      pos.y += vel.vy;
      vel.vx *= damping;
      vel.vy *= damping;
    }

    // Decay alpha
    currentAlpha *= (1 - alphaDecay);
  }

  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  }

  // Add node dimensions to bounds
  minX -= opts.nodeWidth! / 2;
  minY -= opts.nodeHeight! / 2;
  maxX += opts.nodeWidth! / 2;
  maxY += opts.nodeHeight! / 2;

  const bounds = {
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
    minX,
    minY,
    maxX,
    maxY,
  };

  console.log('[ForceDirectedLayout] Layout complete. Bounds:', bounds);

  return {
    nodePositions: positions,
    bounds,
  };
}

/**
 * Hierarchical Layout
 * Organizes elements in a tree structure based on refinement relationships
 * Uses dagre for automatic hierarchical positioning
 */
export function hierarchicalLayout(
  graph: MotivationGraph,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width = 1200, height = 800, padding = 50 } = opts;

  console.log('[HierarchicalLayout] Starting hierarchical layout with', graph.nodes.size, 'nodes');

  // Import dagre dynamically
  const dagre = require('dagre');
  const g = new dagre.graphlib.Graph();

  // Configure graph
  g.setGraph({
    rankdir: 'TB', // Top to bottom
    align: 'UL', // Upper left alignment
    nodesep: 80, // Horizontal spacing between nodes
    ranksep: 120, // Vertical spacing between ranks
    marginx: padding,
    marginy: padding,
  });

  // Default to 'default' for edge labels
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre graph
  for (const [nodeId, graphNode] of graph.nodes) {
    const elementType = graphNode.element.type;
    const dimensions = getNodeDimensions(elementType);

    g.setNode(nodeId, {
      width: dimensions.width,
      height: dimensions.height,
      label: graphNode.element.name,
    });
  }

  // Add edges to dagre graph
  // Prioritize refinement relationships for hierarchy
  const refinementEdges: Array<{ source: string; target: string }> = [];
  const otherEdges: Array<{ source: string; target: string }> = [];

  for (const edge of graph.edges.values()) {
    if (edge.type === 'refines') {
      refinementEdges.push({ source: edge.sourceId, target: edge.targetId });
    } else {
      otherEdges.push({ source: edge.sourceId, target: edge.targetId });
    }
  }

  // Add refinement edges first (these define the hierarchy)
  for (const edge of refinementEdges) {
    g.setEdge(edge.source, edge.target);
  }

  // Optionally add other edges (commented out to keep hierarchy clean)
  // for (const edge of otherEdges) {
  //   g.setEdge(edge.source, edge.target);
  // }

  // Run dagre layout
  dagre.layout(g);

  // Extract positions from dagre
  const positions = new Map<string, Position>();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const [nodeId] of graph.nodes) {
    const node = g.node(nodeId);
    if (node) {
      // Dagre returns center positions
      positions.set(nodeId, {
        x: node.x,
        y: node.y,
      });

      const dimensions = getNodeDimensions(graph.nodes.get(nodeId)!.element.type);
      minX = Math.min(minX, node.x - dimensions.width / 2);
      minY = Math.min(minY, node.y - dimensions.height / 2);
      maxX = Math.max(maxX, node.x + dimensions.width / 2);
      maxY = Math.max(maxY, node.y + dimensions.height / 2);
    }
  }

  const bounds = {
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
    minX,
    minY,
    maxX,
    maxY,
  };

  console.log('[HierarchicalLayout] Layout complete. Bounds:', bounds);

  return {
    nodePositions: positions,
    bounds,
  };
}

/**
 * Get node dimensions based on element type
 */
function getNodeDimensions(elementType: string): { width: number; height: number } {
  // Import from motivation node constants
  // For now, use default dimensions - will be refined based on actual node sizes
  const dimensionMap: Record<string, { width: number; height: number }> = {
    stakeholder: { width: 180, height: 110 },
    goal: { width: 180, height: 110 },
    requirement: { width: 180, height: 110 },
    constraint: { width: 180, height: 110 },
    driver: { width: 180, height: 110 },
    outcome: { width: 180, height: 110 },
    principle: { width: 180, height: 110 },
    assumption: { width: 180, height: 110 },
    valueStream: { width: 180, height: 110 },
    assessment: { width: 180, height: 110 },
  };

  return dimensionMap[elementType] || { width: 180, height: 110 };
}

/**
 * Radial Layout
 * Positions nodes in concentric circles around a central node (typically a stakeholder)
 * Uses BFS to determine distance levels from center
 */
export function radialLayout(
  graph: MotivationGraph,
  centerNodeId: string,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width = 1200, height = 800, padding = 50 } = opts;

  console.log('[RadialLayout] Starting radial layout centered on', centerNodeId);

  const positions = new Map<string, Position>();

  // Verify center node exists
  if (!graph.nodes.has(centerNodeId)) {
    console.warn('[RadialLayout] Center node not found, falling back to force-directed');
    return forceDirectedLayout(graph, options);
  }

  // BFS to calculate distance from center node
  const distances = new Map<string, number>();
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; distance: number }> = [
    { nodeId: centerNodeId, distance: 0 },
  ];

  distances.set(centerNodeId, 0);
  visited.add(centerNodeId);

  while (queue.length > 0) {
    const { nodeId, distance } = queue.shift()!;

    // Get all neighbors (both incoming and outgoing)
    const neighbors = new Set<string>();
    const node = graph.nodes.get(nodeId);

    if (node) {
      node.adjacency.incoming.forEach((n) => neighbors.add(n));
      node.adjacency.outgoing.forEach((n) => neighbors.add(n));
    }

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        distances.set(neighbor, distance + 1);
        queue.push({ nodeId: neighbor, distance: distance + 1 });
      }
    }
  }

  // Group nodes by distance (level)
  const levels = new Map<number, string[]>();
  for (const [nodeId, distance] of distances) {
    if (!levels.has(distance)) {
      levels.set(distance, []);
    }
    levels.get(distance)!.push(nodeId);
  }

  // Calculate positions
  const centerX = width / 2;
  const centerY = height / 2;
  const maxLevel = Math.max(...Array.from(levels.keys()));
  const radiusIncrement = Math.min(width, height) / (2 * (maxLevel + 1)) - padding;

  // Position center node
  positions.set(centerNodeId, { x: centerX, y: centerY });

  // Position nodes at each level
  for (const [level, nodeIds] of levels) {
    if (level === 0) continue; // Skip center node

    const radius = level * radiusIncrement;
    const angleStep = (2 * Math.PI) / nodeIds.length;

    nodeIds.forEach((nodeId, index) => {
      const angle = index * angleStep;
      positions.set(nodeId, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  }

  // Handle disconnected nodes (not reachable from center)
  const disconnectedNodes: string[] = [];
  for (const [nodeId] of graph.nodes) {
    if (!positions.has(nodeId)) {
      disconnectedNodes.push(nodeId);
    }
  }

  if (disconnectedNodes.length > 0) {
    console.log('[RadialLayout]', disconnectedNodes.length, 'disconnected nodes found');

    // Position disconnected nodes in a separate ring or corner
    const disconnectedRadius = (maxLevel + 1) * radiusIncrement;
    const angleStep = (2 * Math.PI) / disconnectedNodes.length;

    disconnectedNodes.forEach((nodeId, index) => {
      const angle = index * angleStep;
      positions.set(nodeId, {
        x: centerX + disconnectedRadius * Math.cos(angle),
        y: centerY + disconnectedRadius * Math.sin(angle),
      });
    });
  }

  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [nodeId, pos] of positions) {
    const dimensions = getNodeDimensions(graph.nodes.get(nodeId)!.element.type);
    minX = Math.min(minX, pos.x - dimensions.width / 2);
    minY = Math.min(minY, pos.y - dimensions.height / 2);
    maxX = Math.max(maxX, pos.x + dimensions.width / 2);
    maxY = Math.max(maxY, pos.y + dimensions.height / 2);
  }

  const bounds = {
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
    minX,
    minY,
    maxX,
    maxY,
  };

  console.log('[RadialLayout] Layout complete. Levels:', levels.size, 'Bounds:', bounds);

  return {
    nodePositions: positions,
    bounds,
  };
}

/**
 * Manual Layout
 * Preserves user-adjusted positions from previous layout
 */
export function manualLayout(
  graph: MotivationGraph,
  existingPositions: Map<string, Position>,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const positions = new Map<string, Position>(existingPositions);

  // Add any new nodes with default positions
  for (const [nodeId] of graph.nodes) {
    if (!positions.has(nodeId)) {
      positions.set(nodeId, {
        x: opts.width! / 2,
        y: opts.height! / 2,
      });
    }
  }

  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  }

  const bounds = {
    width: maxX - minX + 2 * opts.padding!,
    height: maxY - minY + 2 * opts.padding!,
    minX,
    minY,
    maxX,
    maxY,
  };

  return {
    nodePositions: positions,
    bounds,
  };
}
