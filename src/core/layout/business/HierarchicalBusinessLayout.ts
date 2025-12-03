/**
 * Hierarchical Business Layout Engine
 *
 * Uses dagre to create hierarchical layouts for business layer graphs.
 * Supports top-down (TB), left-right (LR), bottom-up (BT), and right-left (RL) orientations.
 */

import dagre from 'dagre';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { BusinessGraph, BusinessNode, BusinessEdge } from '../../types/businessLayer';
import { BusinessLayoutEngine, LayoutOptions, LayoutResult } from './types';
import {
  BusinessProcessNodeData,
  BusinessFunctionNodeData,
  BusinessServiceNodeData,
  BusinessCapabilityNodeData,
} from '../../types/reactflow';
import { BusinessNodeTransformer } from '../../services/businessNodeTransformer';

/**
 * Hierarchical layout engine using dagre
 */
export class HierarchicalBusinessLayout implements BusinessLayoutEngine {
  private transformer: BusinessNodeTransformer;

  constructor() {
    this.transformer = new BusinessNodeTransformer();
  }

  getName(): string {
    return 'Hierarchical Layout';
  }

  getDescription(): string {
    return 'Top-down or left-right hierarchical layout showing process decomposition hierarchy';
  }

  /**
   * Calculate hierarchical layout using dagre
   * Uses Web Worker for large graphs (>100 nodes)
   */
  async calculate(graph: BusinessGraph, options: LayoutOptions): Promise<LayoutResult> {
    const startTime = performance.now();
    const nodeCount = graph.nodes.size;

    // Use Web Worker for large layouts to keep UI responsive
    if (nodeCount > 100) {
      return this.calculateInWorker(graph, options, startTime);
    }

    // Use regular dagre for smaller graphs
    return this.calculateWithDagre(graph, options, startTime);
  }

  /**
   * Calculate layout using Web Worker (for >100 nodes)
   */
  private async calculateInWorker(
    graph: BusinessGraph,
    options: LayoutOptions,
    startTime: number
  ): Promise<LayoutResult> {
    return new Promise((resolve, reject) => {
      const worker = new Worker('/workers/layoutWorker.js');

      // Prepare data for worker (serialize BusinessGraph)
      const workerData = {
        nodes: Array.from(graph.nodes.values()).map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          dimensions: this.getNodeDimensions(node),
        })),
        edges: Array.from(graph.edges.values()).map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          label: edge.label,
        })),
      };

      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Layout worker timeout'));
      }, 30000); // 30 second timeout

      worker.onmessage = (e) => {
        clearTimeout(timeout);

        const { success, positions, bounds, error } = e.data;

        if (!success) {
          worker.terminate();
          reject(new Error(error || 'Unknown worker error'));
          return;
        }

        // Convert positions to React Flow nodes
        const result = this.createReactFlowResult(graph, positions, bounds);

        // Add calculation time
        const calculationTime = performance.now() - startTime;
        if (result.metadata) {
          result.metadata.calculationTime = calculationTime;
          result.metadata.usedWorker = true;
        }

        worker.terminate();
        resolve(result);
      };

      worker.onerror = (error: ErrorEvent) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error(error.message || 'Web Worker error'));
      };

      // Send data to worker
      worker.postMessage({ graph: workerData, options });
    });
  }

  /**
   * Calculate layout with dagre on main thread (for <=100 nodes)
   */
  private calculateWithDagre(
    graph: BusinessGraph,
    options: LayoutOptions,
    startTime: number
  ): LayoutResult {
    // Create dagre graph
    const dagreGraph = this.convertToDAG(graph, options);

    // Run dagre layout
    dagre.layout(dagreGraph);

    // Convert back to React Flow format
    const result = this.convertToReactFlow(dagreGraph, graph);

    // Add calculation time to metadata
    const calculationTime = performance.now() - startTime;
    if (result.metadata) {
      result.metadata.calculationTime = calculationTime;
      result.metadata.usedWorker = false;
    }

    return result;
  }

  /**
   * Convert BusinessGraph to dagre graph
   */
  private convertToDAG(graph: BusinessGraph, options: LayoutOptions): dagre.graphlib.Graph {
    const g = new dagre.graphlib.Graph();

    // Configure graph layout
    g.setGraph({
      rankdir: options.direction || 'TB',
      nodesep: options.spacing?.node || 80,
      ranksep: options.spacing?.rank || 120,
      marginx: 30,
      marginy: 30,
      align: 'UL', // Upper-left alignment for consistent layout
      ranker: 'tight-tree', // Use tight-tree ranker for compact hierarchical layout
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to dagre graph
    for (const [nodeId, node] of graph.nodes.entries()) {
      const dimensions = this.getNodeDimensions(node);

      g.setNode(nodeId, {
        width: dimensions.width,
        height: dimensions.height,
        label: node.name,
      });
    }

    // Add edges to dagre graph
    for (const edge of graph.edges.values()) {
      g.setEdge(edge.source, edge.target, {
        label: edge.label || edge.type,
        weight: this.getEdgeWeight(edge),
      });
    }

    return g;
  }

  /**
   * Convert dagre graph to React Flow nodes and edges
   */
  private convertToReactFlow(
    dagreGraph: dagre.graphlib.Graph,
    businessGraph: BusinessGraph
  ): LayoutResult {
    const nodes: Node[] = [];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Convert nodes
    for (const [nodeId, businessNode] of businessGraph.nodes.entries()) {
      const dagreNode = dagreGraph.node(nodeId);

      if (!dagreNode) {
        continue;
      }

      const dimensions = this.getNodeDimensions(businessNode);

      // Dagre gives center positions, convert to top-left for React Flow
      const x = dagreNode.x - dimensions.width / 2;
      const y = dagreNode.y - dimensions.height / 2;

      // Track bounds
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + dimensions.width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + dimensions.height);

      const node: Node = {
        id: `node-${nodeId}`,
        type: this.getNodeType(businessNode),
        position: { x, y },
        data: this.extractNodeData(businessNode),
        width: dimensions.width,
        height: dimensions.height,
      };

      nodes.push(node);
    }

    // Convert edges using shared method
    const edges = this.convertEdges(businessGraph);

    return {
      nodes,
      edges,
      metadata: {
        calculationTime: 0, // Will be set by caller
        bounds: {
          width: maxX - minX,
          height: maxY - minY,
          minX,
          maxX,
          minY,
          maxY,
        },
      },
    };
  }

  /**
   * Convert business graph edges to React Flow edges
   * Shared method to avoid duplication between convertToReactFlow and createReactFlowResult
   */
  private convertEdges(businessGraph: BusinessGraph): Edge[] {
    const edges: Edge[] = [];

    for (const [edgeId, businessEdge] of businessGraph.edges.entries()) {
      const edge: Edge = {
        id: `edge-${edgeId}`,
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
            offset: 10, // 10px margin around nodes for routing
            borderRadius: 8, // Rounded corners for smoother paths
          },
        },
      };

      edges.push(edge);
    }

    return edges;
  }

  /**
   * Get node type for React Flow
   */
  private getNodeType(node: BusinessNode): string {
    switch (node.type) {
      case 'process':
        return 'businessProcess';
      case 'function':
        return 'businessFunction';
      case 'service':
        return 'businessService';
      case 'capability':
        return 'businessCapability';
      default:
        return 'businessProcess';
    }
  }

  /**
   * Get node dimensions based on type
   */
  private getNodeDimensions(node: BusinessNode): { width: number; height: number } {
    // Use pre-calculated dimensions if available
    if (node.dimensions) {
      return node.dimensions;
    }

    // Default dimensions by type (must match component sizes)
    switch (node.type) {
      case 'process':
        return { width: 200, height: 80 };
      case 'function':
        return { width: 180, height: 100 };
      case 'service':
        return { width: 180, height: 90 };
      case 'capability':
        return { width: 160, height: 70 };
      default:
        return { width: 200, height: 100 };
    }
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

  /**
   * Get edge weight for layout (higher weight = closer together)
   */
  private getEdgeWeight(edge: BusinessEdge): number {
    // Hierarchy edges get higher weight to keep parents/children close
    if (edge.type === 'composes' || edge.type === 'aggregates') {
      return 10;
    }

    // Other relationship types get default weight
    return 1;
  }

  /**
   * Create React Flow result from worker positions
   */
  private createReactFlowResult(
    businessGraph: BusinessGraph,
    positions: Record<string, { x: number; y: number }>,
    bounds: { width: number; height: number; minX: number; maxX: number; minY: number; maxY: number }
  ): LayoutResult {
    const nodes: Node[] = [];

    // Convert nodes with positions from worker
    for (const [nodeId, businessNode] of businessGraph.nodes.entries()) {
      const position = positions[nodeId];

      if (!position) {
        console.warn(`No position found for node ${nodeId}`);
        continue;
      }

      const dimensions = this.getNodeDimensions(businessNode);

      const node: Node = {
        id: `node-${nodeId}`,
        type: this.getNodeType(businessNode),
        position,
        data: this.extractNodeData(businessNode),
        width: dimensions.width,
        height: dimensions.height,
      };

      nodes.push(node);
    }

    // Convert edges using shared method
    const edges = this.convertEdges(businessGraph);

    return {
      nodes,
      edges,
      metadata: {
        calculationTime: 0, // Will be set by caller
        bounds,
      },
    };
  }
}
