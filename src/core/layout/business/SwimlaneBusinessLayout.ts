/**
 * Swimlane Business Layout Engine
 *
 * Organizes business processes into horizontal or vertical lanes grouped by
 * organizational role, domain, lifecycle phase, or capability.
 */

import dagre from 'dagre';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { BusinessGraph, BusinessNode } from '../../types/businessLayer';
import { BusinessLayoutEngine, LayoutOptions, LayoutResult } from './types';
import {
  BusinessProcessNodeData,
  BusinessFunctionNodeData,
  BusinessServiceNodeData,
  BusinessCapabilityNodeData,
} from '../../types/reactflow';
import { BusinessNodeTransformer } from '../../services/businessNodeTransformer';

/**
 * Grouping criteria for swimlane layout
 */
export type SwimlaneGroupBy = 'role' | 'domain' | 'lifecycle' | 'capability';

/**
 * Swimlane orientation
 */
export type SwimlaneOrientation = 'horizontal' | 'vertical';

/**
 * Constants for lane dimensions
 */
const LANE_HEIGHT = 300;
const LANE_WIDTH = 400;
const DEFAULT_LANE_SPACING = 200;

/**
 * Extended layout options for swimlane layout
 */
export interface SwimlaneLayoutOptions extends LayoutOptions {
  /** Grouping criteria */
  groupBy?: SwimlaneGroupBy;
  /** Lane orientation */
  orientation?: SwimlaneOrientation;
}

/**
 * Swimlane layout engine
 */
export class SwimlaneBusinessLayout implements BusinessLayoutEngine {
  private transformer: BusinessNodeTransformer;

  constructor() {
    this.transformer = new BusinessNodeTransformer();
  }

  getName(): string {
    return 'Swimlane Layout';
  }

  getDescription(): string {
    return 'Organize processes by organizational role, domain, lifecycle phase, or capability';
  }

  /**
   * Calculate swimlane layout
   */
  calculate(graph: BusinessGraph, options: LayoutOptions): LayoutResult {
    const startTime = performance.now();

    const swimlaneOptions = options as SwimlaneLayoutOptions;
    const groupBy = swimlaneOptions.groupBy || 'domain';
    const orientation = swimlaneOptions.orientation || 'horizontal';

    // Group nodes into lanes
    const lanes = this.groupNodesIntoLanes(graph, groupBy);

    // Calculate lane positions
    const lanePositions = this.calculateLanePositions(lanes, options, orientation);

    // Layout nodes within each lane
    const nodes = this.layoutNodesWithinLanes(graph, lanes, lanePositions, options, orientation);

    // Route edges
    const edges = this.routeEdges(graph, nodes);

    const calculationTime = performance.now() - startTime;

    // Calculate bounds
    const bounds = this.calculateBounds(nodes);

    return {
      nodes,
      edges,
      metadata: {
        calculationTime,
        bounds,
      },
    };
  }

  /**
   * Group nodes into lanes based on criteria
   */
  private groupNodesIntoLanes(
    graph: BusinessGraph,
    groupBy: SwimlaneGroupBy
  ): Map<string, BusinessNode[]> {
    const lanes = new Map<string, BusinessNode[]>();

    for (const node of graph.nodes.values()) {
      const laneKey = this.getLaneKey(node, groupBy);

      if (!lanes.has(laneKey)) {
        lanes.set(laneKey, []);
      }

      lanes.get(laneKey)!.push(node);
    }

    // Sort lanes by key
    const sortedLanes = new Map([...lanes.entries()].sort());

    return sortedLanes;
  }

  /**
   * Get lane key for a node based on grouping criteria
   */
  private getLaneKey(node: BusinessNode, groupBy: SwimlaneGroupBy): string {
    switch (groupBy) {
      case 'role':
        return node.metadata.owner || 'Unassigned';
      case 'domain':
        return node.metadata.domain || 'Unassigned';
      case 'lifecycle':
        return node.metadata.lifecycle || 'active';
      case 'capability':
        // Try to extract capability from properties
        return (node.properties.capability as string) || 'General';
      default:
        return 'Default';
    }
  }

  /**
   * Calculate position offsets for each lane
   */
  private calculateLanePositions(
    lanes: Map<string, BusinessNode[]>,
    options: LayoutOptions,
    orientation: SwimlaneOrientation
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const laneSpacing = options.spacing?.lane || DEFAULT_LANE_SPACING;

    let offset = 50; // Initial margin

    for (const laneKey of lanes.keys()) {
      if (orientation === 'horizontal') {
        // Horizontal lanes: stack vertically
        positions.set(laneKey, { x: 50, y: offset });
        offset += LANE_HEIGHT + laneSpacing;
      } else {
        // Vertical lanes: stack horizontally
        positions.set(laneKey, { x: offset, y: 50 });
        offset += LANE_WIDTH + laneSpacing;
      }
    }

    return positions;
  }

  /**
   * Layout nodes within each lane using dagre
   */
  private layoutNodesWithinLanes(
    graph: BusinessGraph,
    lanes: Map<string, BusinessNode[]>,
    lanePositions: Map<string, { x: number; y: number }>,
    options: LayoutOptions,
    orientation: SwimlaneOrientation
  ): Node[] {
    const nodes: Node[] = [];

    for (const [laneKey, laneNodes] of lanes.entries()) {
      const lanePosition = lanePositions.get(laneKey) || { x: 0, y: 0 };

      // Create a dagre graph for this lane
      const dagreGraph = new dagre.graphlib.Graph();

      // Configure based on orientation
      dagreGraph.setGraph({
        rankdir: orientation === 'horizontal' ? 'LR' : 'TB',
        nodesep: options.spacing?.node || 80,
        ranksep: options.spacing?.rank || 120,
        marginx: 20,
        marginy: 20,
      });

      dagreGraph.setDefaultEdgeLabel(() => ({}));

      // Add nodes to dagre graph
      for (const node of laneNodes) {
        const dimensions = this.getNodeDimensions(node);
        dagreGraph.setNode(node.id, {
          width: dimensions.width,
          height: dimensions.height,
        });
      }

      // Add edges within this lane
      for (const edge of graph.edges.values()) {
        const sourceInLane = laneNodes.find((n) => n.id === edge.source);
        const targetInLane = laneNodes.find((n) => n.id === edge.target);

        if (sourceInLane && targetInLane) {
          dagreGraph.setEdge(edge.source, edge.target);
        }
      }

      // Run dagre layout
      dagre.layout(dagreGraph);

      // Convert to React Flow nodes with lane offset
      for (const node of laneNodes) {
        const dagreNode = dagreGraph.node(node.id);

        if (!dagreNode) {
          // Node not in dagre graph (disconnected), place at lane start
          const dimensions = this.getNodeDimensions(node);
          const x = lanePosition.x;
          const y = lanePosition.y;

          nodes.push({
            id: `node-${node.id}`,
            type: this.getNodeType(node),
            position: { x, y },
            data: this.extractNodeData(node),
            width: dimensions.width,
            height: dimensions.height,
          });
          continue;
        }

        const dimensions = this.getNodeDimensions(node);

        // Dagre gives center positions, convert to top-left and apply lane offset
        const x = lanePosition.x + dagreNode.x - dimensions.width / 2;
        const y = lanePosition.y + dagreNode.y - dimensions.height / 2;

        nodes.push({
          id: `node-${node.id}`,
          type: this.getNodeType(node),
          position: { x, y },
          data: this.extractNodeData(node),
          width: dimensions.width,
          height: dimensions.height,
        });
      }
    }

    return nodes;
  }

  /**
   * Route edges between nodes
   */
  private routeEdges(graph: BusinessGraph, nodes: Node[]): Edge[] {
    const edges: Edge[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const businessEdge of graph.edges.values()) {
      const sourceNode = nodeMap.get(`node-${businessEdge.source}`);
      const targetNode = nodeMap.get(`node-${businessEdge.target}`);

      if (!sourceNode || !targetNode) {
        continue;
      }

      const edge: Edge = {
        id: `edge-${businessEdge.id}`,
        source: `node-${businessEdge.source}`,
        target: `node-${businessEdge.target}`,
        type: 'elbow', // Use ElbowEdge for clean orthogonal routing
        label: businessEdge.label || businessEdge.type,
        labelStyle: { fill: '#555', fontWeight: 500, fontSize: 12 },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8, rx: 4, ry: 4 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6b7280',
        },
        data: {
          edgeType: businessEdge.type,
          pathOptions: {
            offset: 10,
            borderRadius: 8,
          },
        },
      };

      edges.push(edge);
    }

    return edges;
  }

  /**
   * Calculate layout bounds
   */
  private calculateBounds(nodes: Node[]): {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    if (nodes.length === 0) {
      return { width: 0, height: 0, minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || 200;
      const height = node.height || 100;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + height);
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  /**
   * Get node type for React Flow (delegates to BusinessNodeTransformer)
   */
  private getNodeType(node: BusinessNode): string {
    return this.transformer.getNodeType(node);
  }

  /**
   * Get node dimensions (delegates to BusinessNodeTransformer)
   */
  private getNodeDimensions(node: BusinessNode): { width: number; height: number } {
    return this.transformer.getNodeDimensions(node);
  }

  /**
   * Extract node data for React Flow using BusinessNodeTransformer
   */
  private extractNodeData(
    node: BusinessNode
  ):
    | BusinessProcessNodeData
    | BusinessFunctionNodeData
    | BusinessServiceNodeData
    | BusinessCapabilityNodeData {
    return this.transformer.extractNodeData(node);
  }
}
