/**
 * Matrix Business Layout Engine
 *
 * Arranges business domains in a grid matrix with nodes clustered within cells.
 * Provides a cross-functional view showing interactions between business domains.
 */

import { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter } from 'd3-force';
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
 * D3 Force Node (for internal force simulation)
 */
interface ForceNode {
  id: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  businessNode: BusinessNode;
}

/**
 * D3 Force Link (for internal force simulation)
 */
interface ForceLink {
  source: string | ForceNode;
  target: string | ForceNode;
}

/**
 * Matrix layout engine
 */
export class MatrixBusinessLayout implements BusinessLayoutEngine {
  private transformer: BusinessNodeTransformer;

  constructor() {
    this.transformer = new BusinessNodeTransformer();
  }

  getName(): string {
    return 'Matrix Layout';
  }

  getDescription(): string {
    return 'Cross-functional view showing interactions between business domains in a grid';
  }

  /**
   * Calculate matrix layout
   */
  calculate(graph: BusinessGraph, options: LayoutOptions): LayoutResult {
    const startTime = performance.now();

    // Extract unique domains
    const domains = this.extractDomains(graph);

    // Calculate grid dimensions
    const gridSize = Math.ceil(Math.sqrt(domains.length));

    // Assign domains to grid cells
    const domainCells = this.assignDomainsToGrid(domains, gridSize);

    // Layout nodes within each cell using force simulation
    const nodes = this.layoutNodesInCells(graph, domainCells, gridSize);

    // Route edges
    const edges = this.routeEdges(graph, nodes);

    const calculationTime = performance.now() - startTime;

    // Calculate bounds
    const bounds = this.calculateBounds(nodes, gridSize);

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
   * Extract unique domains from graph
   */
  private extractDomains(graph: BusinessGraph): string[] {
    const domains = new Set<string>();

    for (const node of graph.nodes.values()) {
      const domain = node.metadata.domain || 'General';
      domains.add(domain);
    }

    // Sort domains alphabetically for consistent layout
    return Array.from(domains).sort();
  }

  /**
   * Assign domains to grid cells
   */
  private assignDomainsToGrid(
    domains: string[],
    gridSize: number
  ): Map<string, { row: number; col: number }> {
    const assignments = new Map<string, { row: number; col: number }>();

    domains.forEach((domain, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      assignments.set(domain, { row, col });
    });

    return assignments;
  }

  /**
   * Layout nodes within grid cells using force simulation
   */
  private layoutNodesInCells(
    graph: BusinessGraph,
    domainCells: Map<string, { row: number; col: number }>,
    gridSize: number
  ): Node[] {
    const cellWidth = 500;
    const cellHeight = 500;
    const cellPadding = 50;

    const nodes: Node[] = [];

    // Group nodes by domain
    const nodesByDomain = new Map<string, BusinessNode[]>();
    for (const node of graph.nodes.values()) {
      const domain = node.metadata.domain || 'General';
      if (!nodesByDomain.has(domain)) {
        nodesByDomain.set(domain, []);
      }
      nodesByDomain.get(domain)!.push(node);
    }

    // Layout each domain's nodes within its cell
    for (const [domain, domainNodes] of nodesByDomain.entries()) {
      const cell = domainCells.get(domain);
      if (!cell) continue;

      const baseX = cell.col * cellWidth;
      const baseY = cell.row * cellHeight;

      // For small groups, use simple grid layout
      if (domainNodes.length <= 4) {
        domainNodes.forEach((node, index) => {
          const dimensions = this.getNodeDimensions(node);
          const x = baseX + cellPadding + (index % 2) * (cellWidth / 2 - cellPadding * 2);
          const y = baseY + cellPadding + Math.floor(index / 2) * (cellHeight / 2 - cellPadding * 2);

          nodes.push({
            id: `node-${node.id}`,
            type: this.getNodeType(node),
            position: { x, y },
            data: this.extractNodeData(node),
            width: dimensions.width,
            height: dimensions.height,
          });
        });
      } else {
        // For larger groups, use force simulation within cell
        const cellNodes = this.layoutCellWithForce(
          domainNodes,
          graph,
          baseX + cellWidth / 2,
          baseY + cellHeight / 2,
          cellWidth - cellPadding * 2,
          cellHeight - cellPadding * 2
        );
        nodes.push(...cellNodes);
      }
    }

    return nodes;
  }

  /**
   * Layout nodes within a cell using force simulation
   */
  private layoutCellWithForce(
    domainNodes: BusinessNode[],
    graph: BusinessGraph,
    centerX: number,
    centerY: number,
    maxWidth: number,
    maxHeight: number
  ): Node[] {
    // Create force nodes
    const forceNodes: ForceNode[] = domainNodes.map((node) => ({
      id: node.id,
      businessNode: node,
    }));

    // Create force links within this domain
    const forceLinks: ForceLink[] = [];
    for (const edge of graph.edges.values()) {
      const sourceInDomain = domainNodes.find((n) => n.id === edge.source);
      const targetInDomain = domainNodes.find((n) => n.id === edge.target);

      if (sourceInDomain && targetInDomain) {
        forceLinks.push({
          source: edge.source,
          target: edge.target,
        });
      }
    }

    // Run force simulation
    const simulation = forceSimulation(forceNodes)
      .force(
        'link',
        forceLink(forceLinks)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('collision', forceCollide().radius(60))
      .force('center', forceCenter(0, 0))
      .stop();

    // Run simulation to completion
    for (let i = 0; i < 300 && simulation.alpha() > 0.01; i++) {
      simulation.tick();
    }

    // Convert to React Flow nodes with bounds checking
    const nodes: Node[] = [];
    for (const forceNode of forceNodes) {
      const dimensions = this.getNodeDimensions(forceNode.businessNode);

      // Clamp positions to cell bounds
      let x = centerX + (forceNode.x || 0);
      let y = centerY + (forceNode.y || 0);

      // Ensure node stays within cell
      x = Math.max(centerX - maxWidth / 2, Math.min(x, centerX + maxWidth / 2 - dimensions.width));
      y = Math.max(centerY - maxHeight / 2, Math.min(y, centerY + maxHeight / 2 - dimensions.height));

      nodes.push({
        id: `node-${forceNode.id}`,
        type: this.getNodeType(forceNode.businessNode),
        position: { x, y },
        data: this.extractNodeData(forceNode.businessNode),
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    return nodes;
  }

  /**
   * Route edges with visual distinction for cross-domain connections
   */
  private routeEdges(graph: BusinessGraph, nodes: Node[]): Edge[] {
    const edges: Edge[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Get business node map for domain lookup
    const businessNodeMap = new Map<string, BusinessNode>();
    for (const node of graph.nodes.values()) {
      businessNodeMap.set(`node-${node.id}`, node);
    }

    for (const businessEdge of graph.edges.values()) {
      const sourceNode = nodeMap.get(`node-${businessEdge.source}`);
      const targetNode = nodeMap.get(`node-${businessEdge.target}`);

      if (!sourceNode || !targetNode) {
        continue;
      }

      // Check if edge crosses domains
      const sourceBusinessNode = businessNodeMap.get(sourceNode.id);
      const targetBusinessNode = businessNodeMap.get(targetNode.id);
      const sourceDomain = sourceBusinessNode?.metadata.domain || 'General';
      const targetDomain = targetBusinessNode?.metadata.domain || 'General';
      const isCrossDomain = sourceDomain !== targetDomain;

      const edge: Edge = {
        id: `edge-${businessEdge.id}`,
        source: `node-${businessEdge.source}`,
        target: `node-${businessEdge.target}`,
        type: 'elbow',
        label: businessEdge.label || businessEdge.type,
        labelStyle: {
          fill: isCrossDomain ? '#e11d48' : '#555',
          fontWeight: isCrossDomain ? 600 : 500,
          fontSize: 12,
        },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.8, rx: 4, ry: 4 },
        style: {
          stroke: isCrossDomain ? '#e11d48' : '#6b7280',
          strokeWidth: isCrossDomain ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isCrossDomain ? '#e11d48' : '#6b7280',
        },
        data: {
          edgeType: businessEdge.type,
          isCrossDomain,
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
  private calculateBounds(
    nodes: Node[],
    gridSize: number
  ): {
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

    const cellWidth = 500;
    const cellHeight = 500;

    const width = gridSize * cellWidth;
    const height = gridSize * cellHeight;

    return {
      width,
      height,
      minX: 0,
      maxX: width,
      minY: 0,
      maxY: height,
    };
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
    if (node.dimensions) {
      return node.dimensions;
    }

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
}
