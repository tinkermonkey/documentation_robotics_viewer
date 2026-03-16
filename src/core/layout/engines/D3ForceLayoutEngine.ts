/**
 * D3 Force Layout Engine Adapter
 *
 * Wraps the existing d3-force implementation with the common LayoutEngine interface.
 * Maintains backward compatibility with motivation layer usage.
 */

import {
  BaseLayoutEngine,
  LayoutGraphInput,
  LayoutResult,
  ParameterValidation,
  EngineCapabilities,
} from './LayoutEngine';

/**
 * D3 Force-specific layout parameters
 */
export interface D3ForceParameters {
  /** Number of simulation iterations */
  iterations?: number;

  /** Center force strength (pulls nodes to center) */
  centerForce?: number;

  /** Target distance between linked nodes */
  linkDistance?: number;

  /** Link force strength */
  linkStrength?: number;

  /** Repulsion strength between all nodes (negative value) */
  chargeStrength?: number;

  /** Collision detection radius multiplier */
  collisionRadius?: number;

  /** Velocity decay (damping factor) */
  velocityDecay?: number;

  /** Canvas width for centering */
  width?: number;

  /** Canvas height for centering */
  height?: number;
}

/**
 * D3 Force Layout Engine
 *
 * Implements force-directed layouts using a simplified physics simulation
 * based on d3-force algorithm principles.
 */
export class D3ForceLayoutEngine extends BaseLayoutEngine {
  readonly name = 'D3 Force Layout Engine';
  readonly version = '1.0.0';
  readonly capabilities: EngineCapabilities = {
    hierarchical: false,
    forceDirected: true,
    orthogonal: false,
    circular: false,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('[D3ForceLayoutEngine] Initialized');
  }

  async calculateLayout(
    graph: LayoutGraphInput,
    parameters: Record<string, any> = {}
  ): Promise<LayoutResult> {
    const startTime = performance.now();

    // Validate and normalize parameters
    const params = this.normalizeParameters(parameters);

    // Performance warning for large graphs
    if (graph.nodes.length > 50) {
      console.warn(
        `[D3ForceLayoutEngine] Large graph detected (${graph.nodes.length} nodes). ` +
          'Layout calculation runs on main thread and may impact performance.'
      );
    }

    // Initialize node positions randomly
    const positions = new Map<string, { x: number; y: number }>();
    const velocities = new Map<string, { vx: number; vy: number }>();

    const width = params.width || 1200;
    const height = params.height || 800;
    const padding = 50;

    for (const node of graph.nodes) {
      positions.set(node.id, {
        x: padding + Math.random() * (width - 2 * padding),
        y: padding + Math.random() * (height - 2 * padding),
      });
      velocities.set(node.id, { vx: 0, vy: 0 });
    }

    // Simulation parameters
    const iterations = params.iterations || 150;
    const alpha = 1.0;
    const alphaDecay = 1 - Math.pow(0.001, 1 / iterations);
    const linkForce = params.linkStrength || 0.1;
    const chargeForce = params.chargeStrength || -500;
    const centerForce = params.centerForce || 0.1;
    const linkDistance = params.linkDistance || 200;
    const velocityDecay = params.velocityDecay || 0.6;

    let currentAlpha = alpha;

    // Run simulation
    for (let iteration = 0; iteration < iterations; iteration++) {
      // Apply center force (pull nodes towards center)
      for (const [nodeId, pos] of positions) {
        const vel = velocities.get(nodeId)!;
        const dx = width / 2 - pos.x;
        const dy = height / 2 - pos.y;
        vel.vx += dx * centerForce * currentAlpha;
        vel.vy += dy * centerForce * currentAlpha;
      }

      // Apply charge force (repulsion between all nodes)
      const nodeIds = graph.nodes.map((n) => n.id);
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
      for (const edge of graph.edges) {
        const pos1 = positions.get(edge.source);
        const pos2 = positions.get(edge.target);

        if (!pos1 || !pos2) continue;

        const vel1 = velocities.get(edge.source)!;
        const vel2 = velocities.get(edge.target)!;

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
      for (const [nodeId, pos] of positions) {
        const vel = velocities.get(nodeId)!;
        pos.x += vel.vx;
        pos.y += vel.vy;
        vel.vx *= velocityDecay;
        vel.vy *= velocityDecay;
      }

      // Decay alpha
      currentAlpha *= 1 - alphaDecay;
    }

    // Convert to LayoutResult format
    const nodes = graph.nodes.map((node) => {
      const pos = positions.get(node.id) || { x: 0, y: 0 };
      return {
        id: node.id,
        position: {
          x: pos.x - node.width / 2, // Convert center to top-left
          y: pos.y - node.height / 2,
        },
        data: node.data,
      };
    });

    const edges = graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: edge.data,
    }));

    // Calculate bounds
    const nodesWithDimensions = nodes.map((node, index) => ({
      ...node,
      width: graph.nodes[index].width,
      height: graph.nodes[index].height,
    }));

    const bounds = this.calculateBounds(nodesWithDimensions);

    const calculationTime = performance.now() - startTime;

    console.log(
      `[D3ForceLayoutEngine] Layout calculated in ${calculationTime.toFixed(2)}ms for ${graph.nodes.length} nodes`
    );

    return {
      nodes,
      edges,
      bounds,
      metadata: {
        calculationTime,
        usedWorker: false,
      },
    };
  }

  getParameters(): D3ForceParameters {
    return {
      iterations: 150,
      centerForce: 0.1,
      linkDistance: 200,
      linkStrength: 0.1,
      chargeStrength: -500,
      collisionRadius: 1.5,
      velocityDecay: 0.6,
      width: 1200,
      height: 800,
    };
  }

  validateParameters(parameters: Record<string, any>): ParameterValidation {
    const schema = {
      iterations: { type: 'number', min: 1, max: 1000 },
      centerForce: { type: 'number', min: 0, max: 1 },
      linkDistance: { type: 'number', min: 10, max: 1000 },
      linkStrength: { type: 'number', min: 0, max: 1 },
      chargeStrength: { type: 'number', min: -2000, max: 0 },
      collisionRadius: { type: 'number', min: 0, max: 10 },
      velocityDecay: { type: 'number', min: 0, max: 1 },
      width: { type: 'number', min: 100, max: 10000 },
      height: { type: 'number', min: 100, max: 10000 },
    };

    return this.validateCommonParameters(parameters, schema);
  }

  /**
   * Normalize parameters to ensure all values are valid
   */
  private normalizeParameters(parameters: Record<string, any>): D3ForceParameters {
    const defaults = this.getParameters();
    const validated: D3ForceParameters = { ...defaults };

    // Override with provided parameters
    if (typeof parameters.iterations === 'number') validated.iterations = parameters.iterations;
    if (typeof parameters.centerForce === 'number') validated.centerForce = parameters.centerForce;
    if (typeof parameters.linkDistance === 'number')
      validated.linkDistance = parameters.linkDistance;
    if (typeof parameters.linkStrength === 'number')
      validated.linkStrength = parameters.linkStrength;
    if (typeof parameters.chargeStrength === 'number')
      validated.chargeStrength = parameters.chargeStrength;
    if (typeof parameters.collisionRadius === 'number')
      validated.collisionRadius = parameters.collisionRadius;
    if (typeof parameters.velocityDecay === 'number')
      validated.velocityDecay = parameters.velocityDecay;
    if (typeof parameters.width === 'number') validated.width = parameters.width;
    if (typeof parameters.height === 'number') validated.height = parameters.height;

    return validated;
  }
}
