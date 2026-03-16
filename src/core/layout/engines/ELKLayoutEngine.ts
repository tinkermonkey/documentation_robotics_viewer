/**
 * ELK (Eclipse Layout Kernel) Layout Engine Adapter
 *
 * Wraps the ELK library to provide hierarchical, force-directed, stress, and box layouts
 * through the common LayoutEngine interface. ELK is particularly strong at layered
 * hierarchical layouts and is used extensively in diagram editors like Sprotty.
 *
 * Supported algorithms:
 * - layered: Hierarchical layout with layer-based node placement (similar to Sugiyama)
 * - force: Force-directed layout with physical simulation
 * - stress: Stress minimization layout
 * - box: Simple box layout
 */

import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkExtendedEdge, LayoutOptions } from 'elkjs/lib/elk.bundled.js';
import {
  BaseLayoutEngine,
  LayoutGraphInput,
  EngineLayoutResult,
  ParameterValidation,
  EngineCapabilities,
} from './LayoutEngine';

/**
 * ELK algorithm types
 */
export type ELKAlgorithm = 'layered' | 'force' | 'stress' | 'box';

/**
 * ELK layout direction
 */
export type ELKDirection = 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';

/**
 * ELK layering strategy (for layered algorithm)
 */
export type ELKLayeringStrategy =
  | 'NETWORK_SIMPLEX'
  | 'LONGEST_PATH'
  | 'INTERACTIVE'
  | 'STRETCH_WIDTH'
  | 'MIN_WIDTH';

/**
 * ELK edge routing strategy
 */
export type ELKEdgeRouting = 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES' | 'UNDEFINED';

/**
 * ELK-specific layout parameters
 */
export interface ELKParameters {
  /** Layout algorithm */
  algorithm?: ELKAlgorithm;

  /** Layout direction */
  direction?: ELKDirection;

  /** Node spacing */
  spacing?: number;

  /** Layering strategy (for layered algorithm) */
  layering?: ELKLayeringStrategy;

  /** Node-edge spacing */
  edgeNodeSpacing?: number;

  /** Edge-edge spacing */
  edgeSpacing?: number;

  /** Aspect ratio target */
  aspectRatio?: number;

  /** Interactive mode (preserve user positions) */
  interactive?: boolean;

  /** Enable orthogonal edge routing */
  orthogonalRouting?: boolean;

  /** Edge routing strategy (when orthogonalRouting is true) */
  edgeRouting?: ELKEdgeRouting;
}

/**
 * ELK Layout Engine
 *
 * Provides advanced hierarchical and force-directed layouts using the Eclipse Layout Kernel.
 * Particularly effective for layered diagrams, organizational charts, and complex hierarchies.
 */
export class ELKLayoutEngine extends BaseLayoutEngine {
  readonly name = 'ELK Layout Engine';
  readonly version = '1.0.0';
  readonly capabilities: EngineCapabilities = {
    hierarchical: true,
    forceDirected: true,
    orthogonal: true, // ELK supports orthogonal edge routing
    circular: false,
  };

  private elk: InstanceType<typeof ELK> | null = null;

  async initialize(): Promise<void> {
    await super.initialize();
    this.elk = new ELK();
    console.log('[ELKLayoutEngine] Initialized with ELK.js');
  }

  async calculateLayout(
    graph: LayoutGraphInput,
    parameters: Record<string, any> = {}
  ): Promise<EngineLayoutResult> {
    if (!this.elk) {
      throw new Error('ELK engine not initialized. Call initialize() first.');
    }

    const startTime = performance.now();
    const params = this.normalizeParameters(parameters);

    // Convert React Flow graph to ELK format
    const elkGraph = this.convertToELKGraph(graph, params);

    // Calculate layout using ELK
    const layoutedGraph = await this.elk.layout(elkGraph);

    // Convert ELK result back to React Flow format
    const result = this.convertFromELKGraph(layoutedGraph, graph);

    const calculationTime = performance.now() - startTime;

    console.log(
      `[ELKLayoutEngine] Layout calculated in ${calculationTime.toFixed(2)}ms for ${graph.nodes.length} nodes using ${params.algorithm} algorithm`
    );

    return {
      ...result,
      metadata: {
        calculationTime,
        usedWorker: false,
        algorithm: params.algorithm,
      },
    };
  }

  getParameters(): ELKParameters {
    return {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 50,
      layering: 'NETWORK_SIMPLEX',
      edgeNodeSpacing: 25,    // Increased to reserve channel space for Libavoid routing
      edgeSpacing: 15,        // Increased to reserve channel space for Libavoid routing
      aspectRatio: 1.6,
      interactive: false,
      orthogonalRouting: false,
      edgeRouting: 'UNDEFINED',
    };
  }

  validateParameters(parameters: Record<string, any>): ParameterValidation {
    const schema = {
      algorithm: { type: 'string', values: ['layered', 'force', 'stress', 'box'] },
      direction: { type: 'string', values: ['RIGHT', 'DOWN', 'LEFT', 'UP'] },
      spacing: { type: 'number', min: 0, max: 500 },
      layering: {
        type: 'string',
        values: ['NETWORK_SIMPLEX', 'LONGEST_PATH', 'INTERACTIVE', 'STRETCH_WIDTH', 'MIN_WIDTH'],
      },
      edgeNodeSpacing: { type: 'number', min: 0, max: 200 },
      edgeSpacing: { type: 'number', min: 0, max: 100 },
      aspectRatio: { type: 'number', min: 0.1, max: 10 },
      interactive: { type: 'boolean' },
      orthogonalRouting: { type: 'boolean' },
      edgeRouting: { type: 'string', values: ['ORTHOGONAL', 'POLYLINE', 'SPLINES', 'UNDEFINED'] },
    };

    return this.validateCommonParameters(parameters, schema);
  }

  async cleanup(): Promise<void> {
    await super.cleanup();
    this.elk = null;
    console.log('[ELKLayoutEngine] Cleaned up');
  }

  /**
   * Derive preferred port side from edge direction
   * Based on hierarchy direction, determines which port side to use
   */
  private getPreferredPortSide(
    direction: ELKDirection
  ): { source: 'top' | 'bottom' | 'left' | 'right'; target: 'top' | 'bottom' | 'left' | 'right' } {
    // In hierarchical layouts, data flows in the direction specified
    // Source uses the side facing the target, target uses the opposite side
    switch (direction) {
      case 'DOWN':
        return { source: 'bottom', target: 'top' };
      case 'UP':
        return { source: 'top', target: 'bottom' };
      case 'RIGHT':
        return { source: 'right', target: 'left' };
      case 'LEFT':
        return { source: 'left', target: 'right' };
      default:
        return { source: 'bottom', target: 'top' };
    }
  }

  /**
   * Convert React Flow graph to ELK graph format
   */
  private convertToELKGraph(graph: LayoutGraphInput, params: ELKParameters): ElkNode {
    const layoutOptions: LayoutOptions = {
      'elk.algorithm': params.algorithm || 'layered',
      'elk.direction': params.direction || 'DOWN',
      'elk.spacing.nodeNode': String(params.spacing || 50),
      'elk.spacing.edgeNode': String(params.edgeNodeSpacing || 25),  // Default: 25 per spec
      'elk.spacing.edgeEdge': String(params.edgeSpacing || 15),      // Default: 15 per spec
      'elk.aspectRatio': String(params.aspectRatio || 1.6),
      // Use UNDEFINED routing to allow ELK to provide fallback routing if Libavoid WASM fails
      'elk.edgeRouting': 'UNDEFINED',
      // Increase spacing values to reserve channel space for Libavoid routes
      'elk.spacing.edgeNodeBetweenLayers': '35',
    };

    // Add orthogonal routing options
    // NOTE: When orthogonalRouting is enabled, this overrides the default UNDEFINED routing.
    // This allows ELK to handle routing internally. When orthogonalRouting is disabled
    // (the default), ELK uses UNDEFINED routing as a fallback if Libavoid WASM fails to load.
    if (params.orthogonalRouting) {
      // edgeRouting parameter is only used when orthogonalRouting is true
      layoutOptions['elk.edgeRouting'] = params.edgeRouting || 'ORTHOGONAL';
      // Additional orthogonal routing options for better quality
      layoutOptions['elk.layered.unnecessaryBendpoints'] = 'false';
      layoutOptions['elk.layered.spacing.edgeNodeBetweenLayers'] = String(
        params.edgeNodeSpacing || 20
      );
    }

    // Add layered-specific options
    if (params.algorithm === 'layered') {
      layoutOptions['elk.layered.layering.strategy'] = params.layering || 'NETWORK_SIMPLEX';
      layoutOptions['elk.layered.crossingMinimization.strategy'] = 'LAYER_SWEEP';
      layoutOptions['elk.layered.nodePlacement.strategy'] = 'NETWORK_SIMPLEX';
    }

    // Add force-specific options
    if (params.algorithm === 'force') {
      layoutOptions['elk.force.repulsion'] = '5.0';
      layoutOptions['elk.force.temperature'] = '0.001';
    }

    // Create a map of node IDs for validation
    const nodeIds = new Set(graph.nodes.map(n => n.id));

    // Filter out edges that reference non-existent nodes
    const validEdges = graph.edges.filter(edge => {
      const sourceExists = nodeIds.has(edge.source);
      const targetExists = nodeIds.has(edge.target);

      if (!sourceExists || !targetExists) {
        console.warn(
          `[ELKLayoutEngine] Skipping edge ${edge.id}: ` +
          `source ${edge.source} exists=${sourceExists}, ` +
          `target ${edge.target} exists=${targetExists}`
        );
        return false;
      }

      return true;
    });

    console.log(
      `[ELKLayoutEngine] Validated ${validEdges.length}/${graph.edges.length} edges ` +
      `(filtered out ${graph.edges.length - validEdges.length} invalid edges)`
    );

    // Get preferred port sides based on direction
    const portSidePreference = this.getPreferredPortSide(params.direction || 'DOWN');

    // Create a flat graph structure (all nodes as direct children)
    // ELK can handle flat graphs without hierarchical containers
    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions,
      children: graph.nodes.map((node) => ({
        id: node.id,
        width: node.width || 100, // Default width if not specified
        height: node.height || 50, // Default height if not specified
        // Declare four ports for this node: top, bottom, left, right
        ports: [
          { id: `${node.id}-top`, layoutOptions: { 'port.side': 'NORTH' } },
          { id: `${node.id}-bottom`, layoutOptions: { 'port.side': 'SOUTH' } },
          { id: `${node.id}-left`, layoutOptions: { 'port.side': 'WEST' } },
          { id: `${node.id}-right`, layoutOptions: { 'port.side': 'EAST' } },
        ],
        layoutOptions: {
          // Set port constraints to FIXED_SIDE so ELK assigns which side each edge uses
          // but does not fix the exact position
          'elk.portConstraints': 'FIXED_SIDE',
        },
      })),
      edges: validEdges.map((edge) => ({
        id: edge.id,
        // Reference port IDs in sources and targets
        sources: [`${edge.source}-${portSidePreference.source}`],
        targets: [`${edge.target}-${portSidePreference.target}`],
      })),
    };

    return elkGraph;
  }

  /**
   * Parse port side from port ID string
   * Port IDs follow the pattern: "{nodeId}-{side}"
   * where side is one of: top, bottom, left, right
   */
  private derivePortSide(
    portId: string | undefined
  ): 'top' | 'bottom' | 'left' | 'right' | undefined {
    if (!portId) return undefined;

    const parts = portId.split('-');
    const lastPart = parts[parts.length - 1]?.toLowerCase();

    if (lastPart === 'top' || lastPart === 'bottom' || lastPart === 'left' || lastPart === 'right') {
      return lastPart as 'top' | 'bottom' | 'left' | 'right';
    }

    return undefined;
  }

  /**
   * Strip port suffix from port ID to recover original node ID
   * Handles node IDs that contain hyphens by validating against known node IDs.
   * Port IDs follow the pattern: "{nodeId}-{side}"
   * where side is one of: top, bottom, left, right
   * Example: "node-service.validate-order-bottom" -> "node-service.validate-order"
   *
   * @param portId The port ID to strip
   * @param nodeIds Set of valid original node IDs to validate against
   * @returns The original node ID, or undefined if portId is undefined
   */
  private stripPortSuffix(portId: string | undefined, nodeIds: Set<string>): string | undefined {
    if (!portId) return undefined;

    // First try without stripping anything
    if (nodeIds.has(portId)) {
      return portId;
    }

    const parts = portId.split('-');
    const lastPart = parts[parts.length - 1]?.toLowerCase();

    // If the last segment is a valid port side, try removing it
    if (lastPart === 'top' || lastPart === 'bottom' || lastPart === 'left' || lastPart === 'right') {
      const strippedId = parts.slice(0, -1).join('-');
      // Only return the stripped ID if it matches a known node ID
      if (nodeIds.has(strippedId)) {
        return strippedId;
      }
    }

    // If no valid strip found, return the entire ID (likely a malformed port ID)
    return portId;
  }

  /**
   * Convert ELK graph result back to React Flow format
   */
  private convertFromELKGraph(elkGraph: ElkNode, originalGraph: LayoutGraphInput): EngineLayoutResult {
    // Create a map of original node data and a set of node IDs for port suffix validation
    const nodeDataMap = new Map(originalGraph.nodes.map((n) => [n.id, n.data]));
    const edgeDataMap = new Map(originalGraph.edges.map((e) => [e.id, e.data]));
    const nodeIds = new Set(originalGraph.nodes.map((n) => n.id));

    // Convert nodes with positions from ELK
    const nodes = (elkGraph.children || []).map((elkNode) => {
      const nodeData = nodeDataMap.get(elkNode.id);

      // Warn if node data is missing, as this can result in missing node labels
      if (!nodeData) {
        console.warn(`Missing node data for ELK node: ${elkNode.id}`);
      }

      return {
        id: elkNode.id,
        position: {
          x: elkNode.x || 0,
          y: elkNode.y || 0,
        },
        data: nodeData || { label: elkNode.id },
      };
    });

    // Convert edges (preserve original edge data, add routing points if available)
    const edges = (elkGraph.edges || [])
      .map((elkEdge) => {
        const edgeData = edgeDataMap.get(elkEdge.id);

        // Warn if edge data is missing
        if (!edgeData) {
          console.warn(`Missing edge data for ELK edge: ${elkEdge.id}`);
        }

        // Extract port IDs from ELK edge (format: "{nodeId}-{side}")
        const sourcePortId = (elkEdge as ElkExtendedEdge).sources?.[0];
        const targetPortId = (elkEdge as ElkExtendedEdge).targets?.[0];

        // Strip port suffix to get node IDs
        // Handles node IDs with hyphens: "node-service.validate-order-bottom" -> "node-service.validate-order"
        const source = this.stripPortSuffix(sourcePortId, nodeIds);
        const target = this.stripPortSuffix(targetPortId, nodeIds);

        // Skip edges with undefined source or target to avoid creating phantom edges
        if (!source || !target) {
          console.warn(
            `[ELKLayoutEngine] Skipping edge ${elkEdge.id}: ` +
            `source=${source}, target=${target} (undefined port IDs)`
          );
          return null;
        }

        // Derive port sides from port IDs
        const sourceSide = this.derivePortSide(sourcePortId);
        const targetSide = this.derivePortSide(targetPortId);

        const edge: EngineLayoutResult['edges'][0] = {
          id: elkEdge.id,
          source,
          target,
          sourceSide,
          targetSide,
          data: edgeData,
        };

        // Add routing points if available
        if (elkEdge.sections && elkEdge.sections.length > 0) {
          const section = elkEdge.sections[0];
          const points: Array<{ x: number; y: number }> = [];

          if (section.startPoint) {
            points.push({ x: section.startPoint.x, y: section.startPoint.y });
          }

          if (section.bendPoints) {
            section.bendPoints.forEach((bp) => {
              points.push({ x: bp.x, y: bp.y });
            });
          }

          if (section.endPoint) {
            points.push({ x: section.endPoint.x, y: section.endPoint.y });
          }

          if (points.length > 0) {
            edge.points = points;
          }
        }

        return edge;
      })
      .filter((edge) => edge !== null) as EngineLayoutResult['edges'];

    // Calculate bounds
    const nodesWithDimensions = nodes.map((node) => {
      const originalNode = originalGraph.nodes.find((n) => n.id === node.id);
      return {
        ...node,
        width: originalNode?.width || 0,
        height: originalNode?.height || 0,
      };
    });

    const bounds = this.calculateBounds(nodesWithDimensions);

    return {
      nodes,
      edges,
      bounds,
    };
  }

  /**
   * Normalize parameters to ensure all values are valid
   */
  private normalizeParameters(parameters: Record<string, any>): ELKParameters {
    const defaults = this.getParameters();
    const validated: ELKParameters = { ...defaults };

    if (parameters.algorithm) validated.algorithm = parameters.algorithm;
    if (parameters.direction) validated.direction = parameters.direction;
    if (typeof parameters.spacing === 'number') validated.spacing = parameters.spacing;
    if (parameters.layering) validated.layering = parameters.layering;
    if (typeof parameters.edgeNodeSpacing === 'number')
      validated.edgeNodeSpacing = parameters.edgeNodeSpacing;
    if (typeof parameters.edgeSpacing === 'number') validated.edgeSpacing = parameters.edgeSpacing;
    if (typeof parameters.aspectRatio === 'number')
      validated.aspectRatio = parameters.aspectRatio;
    if (typeof parameters.interactive === 'boolean')
      validated.interactive = parameters.interactive;
    if (typeof parameters.orthogonalRouting === 'boolean')
      validated.orthogonalRouting = parameters.orthogonalRouting;
    if (parameters.edgeRouting) validated.edgeRouting = parameters.edgeRouting;

    return validated;
  }
}
