/**
 * Dagre Layout Engine Adapter
 *
 * Wraps the existing dagre implementation with the common LayoutEngine interface.
 * Maintains backward compatibility with current usage throughout the codebase.
 */

import dagre from 'dagre';
import {
  BaseLayoutEngine,
  LayoutGraphInput,
  LayoutResult,
  ParameterValidation,
  EngineCapabilities,
} from './LayoutEngine';

/**
 * Dagre-specific layout parameters
 */
export interface DagreParameters {
  /** Layout direction: TB (top-bottom), LR (left-right), BT (bottom-top), RL (right-left) */
  rankdir?: 'TB' | 'LR' | 'BT' | 'RL';

  /** Alignment: UL (upper-left), UR (upper-right), DL (down-left), DR (down-right) */
  align?: 'UL' | 'UR' | 'DL' | 'DR';

  /** Horizontal spacing between nodes in the same rank */
  nodesep?: number;

  /** Vertical spacing between ranks */
  ranksep?: number;

  /** Horizontal margin */
  marginx?: number;

  /** Vertical margin */
  marginy?: number;

  /** Ranker algorithm: network-simplex, tight-tree, longest-path */
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';

  /** Edge separation (spacing between edges) */
  edgesep?: number;
}

/**
 * Dagre Layout Engine
 *
 * Implements hierarchical layouts using the dagre library.
 * Optimized for tree-like structures and directed graphs.
 */
export class DagreLayoutEngine extends BaseLayoutEngine {
  readonly name = 'Dagre Layout Engine';
  readonly version = '1.0.0';
  readonly capabilities: EngineCapabilities = {
    hierarchical: true,
    forceDirected: false,
    orthogonal: false,
    circular: false,
  };

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('[DagreLayoutEngine] Initialized');
  }

  async calculateLayout(
    graph: LayoutGraphInput,
    parameters: Record<string, any> = {}
  ): Promise<LayoutResult> {
    const startTime = performance.now();

    // Validate and normalize parameters
    const params = this.normalizeParameters(parameters);

    // Create dagre graph
    const g = new dagre.graphlib.Graph();

    // Configure graph layout
    g.setGraph({
      rankdir: params.rankdir || 'TB',
      align: params.align || 'UL',
      nodesep: params.nodesep || 80,
      ranksep: params.ranksep || 120,
      marginx: params.marginx || 30,
      marginy: params.marginy || 30,
      ranker: params.ranker || 'tight-tree',
      edgesep: params.edgesep || 10,
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes
    for (const node of graph.nodes) {
      g.setNode(node.id, {
        width: node.width,
        height: node.height,
        label: node.data?.label || node.id,
      });
    }

    // Add edges
    for (const edge of graph.edges) {
      g.setEdge(edge.source, edge.target, {
        label: edge.data?.label || '',
      });
    }

    // Run dagre layout
    dagre.layout(g);

    // Convert to LayoutResult format
    const nodes = graph.nodes.map((inputNode) => {
      const dagreNode = g.node(inputNode.id);

      if (!dagreNode) {
        console.warn(`[DagreLayoutEngine] Node ${inputNode.id} not found in dagre output`);
        return {
          id: inputNode.id,
          position: { x: 0, y: 0 },
          data: inputNode.data,
        };
      }

      // Dagre returns center positions, convert to top-left for React Flow
      return {
        id: inputNode.id,
        position: {
          x: dagreNode.x - inputNode.width / 2,
          y: dagreNode.y - inputNode.height / 2,
        },
        data: inputNode.data,
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
      `[DagreLayoutEngine] Layout calculated in ${calculationTime.toFixed(2)}ms for ${graph.nodes.length} nodes`
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

  getParameters(): DagreParameters {
    return {
      rankdir: 'TB',
      align: 'UL',
      nodesep: 80,
      ranksep: 120,
      marginx: 30,
      marginy: 30,
      ranker: 'tight-tree',
      edgesep: 10,
    };
  }

  validateParameters(parameters: Record<string, any>): ParameterValidation {
    const schema = {
      rankdir: { type: 'string', values: ['TB', 'LR', 'BT', 'RL'] },
      align: { type: 'string', values: ['UL', 'UR', 'DL', 'DR'] },
      nodesep: { type: 'number', min: 0, max: 500 },
      ranksep: { type: 'number', min: 0, max: 500 },
      marginx: { type: 'number', min: 0, max: 200 },
      marginy: { type: 'number', min: 0, max: 200 },
      ranker: { type: 'string', values: ['network-simplex', 'tight-tree', 'longest-path'] },
      edgesep: { type: 'number', min: 0, max: 100 },
    };

    return this.validateCommonParameters(parameters, schema);
  }

  /**
   * Normalize parameters to ensure all values are valid
   */
  private normalizeParameters(parameters: Record<string, any>): DagreParameters {
    const defaults = this.getParameters();
    const validated: DagreParameters = { ...defaults };

    // Override with provided parameters
    if (parameters.rankdir) validated.rankdir = parameters.rankdir;
    if (parameters.align) validated.align = parameters.align;
    if (typeof parameters.nodesep === 'number') validated.nodesep = parameters.nodesep;
    if (typeof parameters.ranksep === 'number') validated.ranksep = parameters.ranksep;
    if (typeof parameters.marginx === 'number') validated.marginx = parameters.marginx;
    if (typeof parameters.marginy === 'number') validated.marginy = parameters.marginy;
    if (parameters.ranker) validated.ranker = parameters.ranker;
    if (typeof parameters.edgesep === 'number') validated.edgesep = parameters.edgesep;

    return validated;
  }
}
