/**
 * Force-Directed Business Layout Engine
 *
 * Arranges business processes using a simple row-based grid layout.
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
 * Force-directed layout engine (uses grid layout)
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
   * Calculate layout using a simple row-based grid
   */
  calculate(graph: BusinessGraph, _options: LayoutOptions): LayoutResult {
    const startTime = performance.now();
    const nodesep = 80;
    const ranksep = 120;
    const marginx = 30;
    const marginy = 30;
    const maxRowWidth = 1800;

    const nodes: Node[] = [];
    let curX = marginx;
    let curY = marginy;
    let rowMaxHeight = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    for (const businessNode of graph.nodes.values()) {
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
        type: this.getNodeType(),
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

    const edges = this.routeEdges(graph, nodes);
    const calculationTime = performance.now() - startTime;
    const hasNodes = minX !== Infinity;

    return {
      nodes,
      edges,
      metadata: {
        calculationTime,
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
   * Get node type for React Flow (delegates to BusinessNodeTransformer)
   */
  private getNodeType(): string {
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
