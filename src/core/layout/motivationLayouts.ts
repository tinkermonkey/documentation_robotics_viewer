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
 * Hierarchical Layout (for future phases)
 * Organizes goals in a tree structure based on refinement relationships
 */
export function hierarchicalLayout(
  graph: MotivationGraph,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const positions = new Map<string, Position>();

  // TODO: Implement hierarchical layout using dagre or custom algorithm
  // For now, fall back to force-directed
  console.warn('[HierarchicalLayout] Not implemented yet, using force-directed layout');
  return forceDirectedLayout(graph, options);
}

/**
 * Radial Layout (for future phases)
 * Positions nodes in concentric circles around a central stakeholder
 */
export function radialLayout(
  graph: MotivationGraph,
  centerNodeId: string,
  options: LayoutOptions = {}
): LayoutResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const positions = new Map<string, Position>();

  // TODO: Implement radial layout
  // For now, fall back to force-directed
  console.warn('[RadialLayout] Not implemented yet, using force-directed layout');
  return forceDirectedLayout(graph, options);
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
