/**
 * Hierarchical Business Layout Engine
 *
 * Creates hierarchical layouts for business layer graphs using a simple row-based grid.
 */

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
   * Calculate layout using a simple row-based grid (for <=100 nodes)
   */
  private calculateWithDagre(
    graph: BusinessGraph,
    options: LayoutOptions,
    startTime: number
  ): LayoutResult {
    const nodesep = options.spacing?.node ?? 80;
    const ranksep = options.spacing?.rank ?? 120;
    const marginx = 30;
    const marginy = 30;
    const maxRowWidth = 1800;

    const nodes: Node[] = [];
    let curX = marginx;
    let curY = marginy;
    let rowMaxHeight = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const [, businessNode] of graph.nodes.entries()) {
      const { width, height } = this.getNodeDimensions(businessNode);

      if (curX > marginx && curX + width > maxRowWidth) {
        curX = marginx;
        curY += rowMaxHeight + ranksep;
        rowMaxHeight = 0;
      }

      const x = curX;
      const y = curY;

      nodes.push({
        id: `node-${businessNode.id}`,
        type: this.getNodeType(businessNode),
        position: { x, y },
        data: this.extractNodeData(businessNode),
        width,
        height,
      });

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + height);

      curX += width + nodesep;
      rowMaxHeight = Math.max(rowMaxHeight, height);
    }

    const edges = this.convertEdges(graph);
    const calculationTime = performance.now() - startTime;
    const hasNodes = minX !== Infinity;

    return {
      nodes,
      edges,
      metadata: {
        calculationTime,
        usedWorker: false,
        bounds: {
          minX: hasNodes ? minX : 0,
          maxX: hasNodes ? maxX : 0,
          minY: hasNodes ? minY : 0,
          maxY: hasNodes ? maxY : 0,
          width: hasNodes ? maxX - minX : 0,
          height: hasNodes ? maxY - minY : 0,
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
