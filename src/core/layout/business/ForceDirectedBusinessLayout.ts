/**
 * Force-Directed Business Layout Engine
 *
 * Uses d3-force physics simulation to create organic clustering of related processes.
 * Nodes are attracted to connected nodes and repelled from unconnected nodes.
 */

import { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter } from 'd3-force';
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
 * D3 Force Node (for internal force simulation)
 */
interface ForceNode {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  businessNode: BusinessNode;
}

/**
 * D3 Force Link (for internal force simulation)
 */
interface ForceLink {
  source: string | ForceNode;
  target: string | ForceNode;
  edgeType?: string;
}

/**
 * Force-directed layout engine
 */
export class ForceDirectedBusinessLayout implements BusinessLayoutEngine {
  private transformer: BusinessNodeTransformer;

  constructor() {
    this.transformer = new BusinessNodeTransformer();
  }

  getName(): string {
    return 'Force-Directed Layout';
  }

  getDescription(): string {
    return 'Organic clustering of related processes using physics-based simulation';
  }

  /**
   * Calculate force-directed layout using d3-force
   */
  calculate(graph: BusinessGraph, _options: LayoutOptions): LayoutResult {
    const startTime = performance.now();

    // Convert to d3-force compatible format
    const forceNodes: ForceNode[] = Array.from(graph.nodes.values()).map((node) => ({
      id: node.id,
      businessNode: node,
    }));

    const forceLinks: ForceLink[] = Array.from(graph.edges.values()).map((edge) => ({
      source: edge.source,
      target: edge.target,
      edgeType: edge.type,
    }));

    // Create force simulation
    const simulation = forceSimulation(forceNodes)
      .force(
        'link',
        forceLink(forceLinks)
          .id((d: any) => d.id)
          .distance(this.getLinkDistance)
          .strength(this.getLinkStrength)
      )
      .force('charge', forceManyBody().strength(-300))
      .force('collision', forceCollide().radius(this.getCollisionRadius))
      .force('center', forceCenter(500, 400))
      .stop();

    // Run simulation to completion (alpha < 0.01 or max 300 iterations)
    let iterations = 0;
    while (iterations < 300 && simulation.alpha() > 0.01) {
      simulation.tick();
      iterations++;
    }

    // Extract positions from d3 nodes
    const nodes = this.convertToReactFlowNodes(forceNodes);

    // Create edges
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
   * Get link distance based on edge type
   */
  private getLinkDistance(link: any): number {
    // Hierarchy edges should be shorter to keep parents/children close
    if (link.edgeType === 'composes' || link.edgeType === 'aggregates') {
      return 100;
    }
    // Flow and dependency edges can be longer
    if (link.edgeType === 'flows_to' || link.edgeType === 'depends_on') {
      return 180;
    }
    // Default distance
    return 150;
  }

  /**
   * Get link strength based on edge type
   */
  private getLinkStrength(link: any): number {
    // Hierarchy edges should be stronger
    if (link.edgeType === 'composes' || link.edgeType === 'aggregates') {
      return 1.5;
    }
    // Other edges have default strength
    return 1;
  }

  /**
   * Get collision radius for a node
   */
  private getCollisionRadius(node: any): number {
    const dimensions = node.businessNode.dimensions || { width: 200, height: 100 };
    // Use average of width and height, plus padding
    return (dimensions.width + dimensions.height) / 4 + 20;
  }

  /**
   * Convert force simulation nodes to React Flow nodes
   */
  private convertToReactFlowNodes(forceNodes: ForceNode[]): Node[] {
    const nodes: Node[] = [];

    for (const forceNode of forceNodes) {
      const businessNode = forceNode.businessNode;
      const dimensions = this.getNodeDimensions(businessNode);

      // Use force simulation positions (already centered)
      const x = (forceNode.x || 0) - dimensions.width / 2;
      const y = (forceNode.y || 0) - dimensions.height / 2;

      const node: Node = {
        id: `node-${forceNode.id}`,
        type: this.getNodeType(businessNode),
        position: { x, y },
        data: this.extractNodeData(businessNode),
        width: dimensions.width,
        height: dimensions.height,
      };

      nodes.push(node);
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

      // Use different edge styling based on type
      const isHierarchyEdge =
        businessEdge.type === 'composes' || businessEdge.type === 'aggregates';

      const edge: Edge = {
        id: `edge-${businessEdge.id}`,
        source: `node-${businessEdge.source}`,
        target: `node-${businessEdge.target}`,
        type: 'smoothstep', // Use smoothstep for organic look in force layout
        label: businessEdge.label || businessEdge.type,
        labelStyle: {
          fill: isHierarchyEdge ? '#1565C0' : '#555',
          fontWeight: isHierarchyEdge ? 600 : 500,
          fontSize: 12,
        },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8, rx: 4, ry: 4 },
        style: {
          stroke: isHierarchyEdge ? '#1565C0' : '#6b7280',
          strokeWidth: isHierarchyEdge ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isHierarchyEdge ? '#1565C0' : '#6b7280',
        },
        data: {
          edgeType: businessEdge.type,
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
    return this.transformer.getNodeType();
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
