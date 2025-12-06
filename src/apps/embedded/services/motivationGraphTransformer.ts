/**
 * MotivationGraphTransformer Service
 *
 * Converts MotivationGraph intermediate representation to ReactFlow nodes and edges.
 * Applies layout algorithms and maps element/relationship types to custom components.
 */

import { Node, Edge } from '@xyflow/react';
import {
  MotivationGraph,
  MotivationGraphNode,
  MotivationGraphEdge,
  MotivationElementType,
  MotivationRelationshipType,
} from '../types/motivationGraph';
import { LayoutAlgorithmType } from '../types/layoutAlgorithm';
import {
  StakeholderNodeData,
  GoalNodeData,
  RequirementNodeData,
  ConstraintNodeData,
  DriverNodeData,
  OutcomeNodeData,
  MotivationEdgeData,
} from '../../../core/types/reactflow';
import {
  forceDirectedLayout,
  hierarchicalLayout,
  radialLayout,
  manualLayout,
  LayoutOptions,
  LayoutResult,
} from '../../../core/layout/motivationLayouts';
import {
  STAKEHOLDER_NODE_WIDTH,
  STAKEHOLDER_NODE_HEIGHT,
  GOAL_NODE_WIDTH,
  GOAL_NODE_HEIGHT,
  REQUIREMENT_NODE_WIDTH,
  REQUIREMENT_NODE_HEIGHT,
  CONSTRAINT_NODE_WIDTH,
  CONSTRAINT_NODE_HEIGHT,
  DRIVER_NODE_WIDTH,
  DRIVER_NODE_HEIGHT,
  OUTCOME_NODE_WIDTH,
  OUTCOME_NODE_HEIGHT,
} from '../../../core/nodes/motivation';
import { semanticZoomController, NodeDetailLevel } from '../../../core/layout/semanticZoomController';
import { applyEdgeBundling, calculateOptimalThreshold } from '../../../core/layout/edgeBundling';
import { GoalCoverage } from './coverageAnalyzer';

/**
 * Path highlighting configuration
 */
export interface PathHighlighting {
  mode: 'none' | 'direct' | 'upstream' | 'downstream' | 'between';
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  selectedNodeIds: string[];
}

/**
 * Transformer configuration options
 */
export interface TransformerOptions {
  layoutAlgorithm?: LayoutAlgorithmType | 'force' | 'hierarchical' | 'radial' | 'manual';
  layoutOptions?: LayoutOptions;
  selectedElementTypes?: Set<MotivationElementType>;
  selectedRelationshipTypes?: Set<MotivationRelationshipType>;
  centerNodeId?: string; // For radial layout
  existingPositions?: Map<string, { x: number; y: number }>; // For manual layout
  pathHighlighting?: PathHighlighting; // Path tracing highlights
  focusContextEnabled?: boolean; // Dim non-focused elements
  zoomLevel?: number; // Current zoom level for semantic zoom (default: 1.0)
  enableEdgeBundling?: boolean; // Apply edge bundling for performance (default: true)
  goalCoverages?: Map<string, GoalCoverage>; // Goal coverage data for indicators
}

/**
 * Transform result
 */
export interface TransformResult {
  nodes: Node[];
  edges: Edge[];
  bounds: {
    width: number;
    height: number;
  };
}

/**
 * Node dimensions map for layout calculation
 */
const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  [MotivationElementType.Stakeholder]: { width: STAKEHOLDER_NODE_WIDTH, height: STAKEHOLDER_NODE_HEIGHT },
  [MotivationElementType.Goal]: { width: GOAL_NODE_WIDTH, height: GOAL_NODE_HEIGHT },
  [MotivationElementType.Requirement]: { width: REQUIREMENT_NODE_WIDTH, height: REQUIREMENT_NODE_HEIGHT },
  [MotivationElementType.Constraint]: { width: CONSTRAINT_NODE_WIDTH, height: CONSTRAINT_NODE_HEIGHT },
  [MotivationElementType.Driver]: { width: DRIVER_NODE_WIDTH, height: DRIVER_NODE_HEIGHT },
  [MotivationElementType.Outcome]: { width: OUTCOME_NODE_WIDTH, height: OUTCOME_NODE_HEIGHT },
  // Default dimensions for other types
  [MotivationElementType.Assessment]: { width: 180, height: 110 },
  [MotivationElementType.Principle]: { width: 180, height: 110 },
  [MotivationElementType.Meaning]: { width: 180, height: 110 },
  [MotivationElementType.Value]: { width: 180, height: 110 },
};

/**
 * MotivationGraphTransformer class
 */
export class MotivationGraphTransformer {
  private options: TransformerOptions;
  private layoutCache: Map<string, LayoutResult> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(options: TransformerOptions = {}) {
    this.options = options;
  }

  /**
   * Transform MotivationGraph to ReactFlow format
   */
  transform(graph: MotivationGraph): TransformResult {
    console.log('[MotivationGraphTransformer] Transforming graph with', graph.nodes.size, 'nodes');

    // Apply semantic zoom filtering if zoom level specified
    const zoomLevel = this.options.zoomLevel !== undefined ? this.options.zoomLevel : 1.0;
    const semanticFilteredGraph = this.applySemanticZoomFiltering(graph, zoomLevel);

    // Apply user filters if specified
    const filteredGraph = this.applyFilters(semanticFilteredGraph);

    // Apply layout algorithm (with caching)
    const layoutResult = this.applyLayoutWithCache(filteredGraph);

    // Get detail level from zoom
    const detailLevel = semanticZoomController.getNodeDetailLevel(zoomLevel);

    // Convert to ReactFlow nodes
    const nodes = this.createReactFlowNodes(filteredGraph, layoutResult, detailLevel);

    // Convert to ReactFlow edges
    let edges = this.createReactFlowEdges(filteredGraph, zoomLevel);

    // Apply edge bundling if enabled and threshold exceeded
    const enableEdgeBundling = this.options.enableEdgeBundling !== false; // Default true
    if (enableEdgeBundling) {
      const threshold = calculateOptimalThreshold(filteredGraph.nodes.size, edges.length);
      const bundlingResult = applyEdgeBundling(edges, { threshold });
      edges = bundlingResult.bundledEdges;

      if (bundlingResult.wasBundled) {
        console.log(
          `[MotivationGraphTransformer] Edge bundling reduced ${bundlingResult.reductionCount} edges`
        );
      }
    }

    console.log('[MotivationGraphTransformer] Transformation complete:', {
      nodes: nodes.length,
      edges: edges.length,
      bounds: layoutResult.bounds,
      cacheHitRate: this.getCacheHitRate(),
    });

    return {
      nodes,
      edges,
      bounds: {
        width: layoutResult.bounds.width,
        height: layoutResult.bounds.height,
      },
    };
  }

  /**
   * Apply semantic zoom filtering based on zoom level
   */
  private applySemanticZoomFiltering(graph: MotivationGraph, zoomLevel: number): MotivationGraph {
    const visibleTypes = semanticZoomController.getVisibleElementTypes(zoomLevel);

    // Filter nodes by visible types
    const filteredNodes = new Map<string, MotivationGraphNode>();
    for (const [nodeId, node] of graph.nodes) {
      const elementType = node.element.type as MotivationElementType;
      if (visibleTypes.has(elementType)) {
        filteredNodes.set(nodeId, node);
      }
    }

    // Filter edges - only include if both source and target are visible
    const filteredEdges = new Map<string, MotivationGraphEdge>();
    for (const [edgeId, edge] of graph.edges) {
      if (filteredNodes.has(edge.sourceId) && filteredNodes.has(edge.targetId)) {
        filteredEdges.set(edgeId, edge);
      }
    }

    console.log(
      `[SemanticZoom] Filtered ${graph.nodes.size} nodes to ${filteredNodes.size} at zoom ${zoomLevel.toFixed(2)}`
    );

    return {
      ...graph,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }

  /**
   * Apply element and relationship filters
   */
  private applyFilters(graph: MotivationGraph): MotivationGraph {
    const { selectedElementTypes, selectedRelationshipTypes } = this.options;

    // If no filters specified, return original graph
    if (!selectedElementTypes && !selectedRelationshipTypes) {
      return graph;
    }

    // Filter nodes
    const filteredNodes = new Map<string, MotivationGraphNode>();
    for (const [nodeId, node] of graph.nodes) {
      const elementType = node.element.type as MotivationElementType;
      if (!selectedElementTypes || selectedElementTypes.has(elementType)) {
        filteredNodes.set(nodeId, node);
      }
    }

    // Filter edges
    const filteredEdges = new Map<string, MotivationGraphEdge>();
    for (const [edgeId, edge] of graph.edges) {
      // Only include edge if both source and target are in filtered nodes
      if (!filteredNodes.has(edge.sourceId) || !filteredNodes.has(edge.targetId)) {
        continue;
      }

      // Check relationship type filter
      if (!selectedRelationshipTypes || selectedRelationshipTypes.has(edge.type)) {
        filteredEdges.set(edgeId, edge);
      }
    }

    return {
      ...graph,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }

  /**
   * Apply layout algorithm with caching
   */
  private applyLayoutWithCache(graph: MotivationGraph): LayoutResult {
    // Generate cache key based on graph structure and layout algorithm
    const cacheKey = this.generateLayoutCacheKey(graph);

    // Check cache
    const cachedLayout = this.layoutCache.get(cacheKey);
    if (cachedLayout) {
      this.cacheHits++;
      console.log(`[LayoutCache] Cache hit for layout (hit rate: ${this.getCacheHitRate()}%)`);
      return cachedLayout;
    }

    // Cache miss - compute layout
    this.cacheMisses++;
    const layoutResult = this.applyLayout(graph);

    // Store in cache (limit cache size to 10 entries)
    if (this.layoutCache.size >= 10) {
      // Remove oldest entry
      const firstKey = this.layoutCache.keys().next().value;
      if (firstKey) this.layoutCache.delete(firstKey);
    }
    this.layoutCache.set(cacheKey, layoutResult);

    return layoutResult;
  }

  /**
   * Generate cache key for layout
   */
  private generateLayoutCacheKey(graph: MotivationGraph): string {
    const algorithm = this.options.layoutAlgorithm || 'force';
    const nodeIds = Array.from(graph.nodes.keys()).sort().join(',');
    const edgeIds = Array.from(graph.edges.keys()).sort().join(',');
    return `${algorithm}:${nodeIds}:${edgeIds}`;
  }

  /**
   * Get cache hit rate percentage
   */
  private getCacheHitRate(): string {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return '0.0';
    return ((this.cacheHits / total) * 100).toFixed(1);
  }

  /**
   * Clear layout cache
   */
  clearLayoutCache(): void {
    this.layoutCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Apply layout algorithm to graph
   */
  private applyLayout(graph: MotivationGraph): LayoutResult {
    const algorithm = this.options.layoutAlgorithm || 'force';

    console.log('[MotivationGraphTransformer] Applying', algorithm, 'layout');

    switch (algorithm) {
      case 'force':
        return forceDirectedLayout(graph, this.options.layoutOptions);

      case 'hierarchical':
        return hierarchicalLayout(graph, this.options.layoutOptions);

      case 'radial': {
        // For radial layout, we need a center node
        const centerNodeId = this.options.centerNodeId || this.findDefaultCenterNode(graph);
        if (!centerNodeId || !graph.nodes.has(centerNodeId)) {
          console.warn('[MotivationGraphTransformer] No valid center node for radial layout, using force-directed');
          return forceDirectedLayout(graph, this.options.layoutOptions);
        }
        return radialLayout(graph, centerNodeId, this.options.layoutOptions);
      }

      case 'manual': {
        if (!this.options.existingPositions || this.options.existingPositions.size === 0) {
          console.warn('[MotivationGraphTransformer] No existing positions for manual layout, using force-directed');
          return forceDirectedLayout(graph, this.options.layoutOptions);
        }
        return manualLayout(graph, this.options.existingPositions, this.options.layoutOptions);
      }

      default:
        return forceDirectedLayout(graph, this.options.layoutOptions);
    }
  }

  /**
   * Find a default center node for radial layout
   * Prioritizes stakeholders with highest degree centrality
   */
  private findDefaultCenterNode(graph: MotivationGraph): string | undefined {
    let maxCentrality = -1;
    let centerNodeId: string | undefined;

    for (const [nodeId, graphNode] of graph.nodes) {
      // Prefer stakeholders
      const isStakeholder = graphNode.element.type === MotivationElementType.Stakeholder;
      const centrality = graphNode.metrics.degreeCentrality;

      if (isStakeholder && centrality > maxCentrality) {
        maxCentrality = centrality;
        centerNodeId = nodeId;
      }
    }

    // If no stakeholders, use any node with highest centrality
    if (!centerNodeId) {
      for (const [nodeId, graphNode] of graph.nodes) {
        const centrality = graphNode.metrics.degreeCentrality;
        if (centrality > maxCentrality) {
          maxCentrality = centrality;
          centerNodeId = nodeId;
        }
      }
    }

    return centerNodeId;
  }

  /**
   * Create ReactFlow nodes from graph nodes
   */
  private createReactFlowNodes(
    graph: MotivationGraph,
    layoutResult: LayoutResult,
    detailLevel: NodeDetailLevel
  ): Node[] {
    const nodes: Node[] = [];

    const pathHighlighting = this.options.pathHighlighting;
    const focusContextEnabled = this.options.focusContextEnabled;

    for (const [nodeId, graphNode] of graph.nodes) {
      const position = layoutResult.nodePositions.get(nodeId);
      if (!position) {
        console.warn('[MotivationGraphTransformer] No position found for node', nodeId);
        continue;
      }

      const elementType = graphNode.element.type as MotivationElementType;
      const nodeType = this.getReactFlowNodeType(elementType);
      const nodeData = this.createNodeData(graphNode);

      // Set detail level on node data
      nodeData.detailLevel = detailLevel;

      // Apply path highlighting and focus context
      const isHighlighted = pathHighlighting?.highlightedNodeIds?.has(nodeId) || false;
      const isSelected = pathHighlighting?.selectedNodeIds?.includes(nodeId) || false;

      // Calculate relationship count for badge display on dimmed nodes
      const totalRelationships = graphNode.metrics.degreeCentrality;

      if (pathHighlighting && pathHighlighting.mode !== 'none') {
        // Apply highlighting/dimming
        if (isHighlighted) {
          // Highlighted nodes: keep normal appearance
          nodeData.opacity = 1.0;
        } else {
          // Dim non-highlighted nodes and show relationship count badge
          nodeData.opacity = 0.3;
          nodeData.relationshipBadge = {
            count: totalRelationships,
            incoming: graphNode.metrics.inDegree,
            outgoing: graphNode.metrics.outDegree
          };
        }

        // Selected nodes get emphasized border
        if (isSelected) {
          nodeData.strokeWidth = 3;
        }
      } else if (focusContextEnabled && pathHighlighting?.highlightedNodeIds?.size) {
        // Focus mode without path tracing
        if (isHighlighted) {
          nodeData.opacity = 1.0;
        } else {
          // Dim non-highlighted nodes and show relationship count badge
          nodeData.opacity = 0.3;
          nodeData.relationshipBadge = {
            count: totalRelationships,
            incoming: graphNode.metrics.inDegree,
            outgoing: graphNode.metrics.outDegree
          };
        }
      } else {
        // No highlighting - normal appearance
        nodeData.opacity = 1.0;
      }

      // Add coverage indicator for goals
      if (elementType === MotivationElementType.Goal && this.options.goalCoverages) {
        const coverage = this.options.goalCoverages.get(nodeId);
        if (coverage) {
          (nodeData as GoalNodeData).coverageIndicator = {
            status: coverage.status,
            requirementCount: coverage.requirementCount,
            constraintCount: coverage.constraintCount,
          };
        }
      }

      // Convert from center position to top-left position (ReactFlow convention)
      const dimensions = NODE_DIMENSIONS[elementType] || { width: 180, height: 110 };
      const topLeftPosition = {
        x: position.x - dimensions.width / 2,
        y: position.y - dimensions.height / 2,
      };

      nodes.push({
        id: nodeId,
        type: nodeType,
        position: topLeftPosition,
        data: nodeData,
        draggable: true,
        selectable: true,
      } as Node);
    }

    return nodes;
  }

  /**
   * Map MotivationElementType to ReactFlow node type
   */
  private getReactFlowNodeType(elementType: MotivationElementType): string {
    switch (elementType) {
      case MotivationElementType.Stakeholder:
        return 'stakeholder';
      case MotivationElementType.Goal:
        return 'goal';
      case MotivationElementType.Requirement:
        return 'requirement';
      case MotivationElementType.Constraint:
        return 'constraint';
      case MotivationElementType.Driver:
        return 'driver';
      case MotivationElementType.Outcome:
        return 'outcome';
      case MotivationElementType.Principle:
        return 'principle';
      case MotivationElementType.Assumption:
        return 'assumption';
      case MotivationElementType.ValueStream:
        return 'valueStream';
      case MotivationElementType.Assessment:
        return 'assessment';
      default:
        // Fallback to goal for any unknown types
        return 'goal';
    }
  }

  /**
   * Create node data based on element type
   */
  private createNodeData(graphNode: MotivationGraphNode): any {
    const element = graphNode.element;
    const elementType = element.type as MotivationElementType;

    // Base data
    const baseData = {
      label: element.name,
      elementId: element.id,
      layerId: element.layerId || 'Motivation',
      fill: element.visual?.style?.backgroundColor || this.getDefaultFill(elementType),
      stroke: element.visual?.style?.borderColor || this.getDefaultStroke(elementType),
      modelElement: element,
      changesetOperation: graphNode.changesetOperation,
    };

    // Type-specific data
    switch (elementType) {
      case MotivationElementType.Stakeholder:
        return {
          ...baseData,
          stakeholderType: element.properties?.stakeholderType || element.properties?.type,
          interests: element.properties?.interests,
        } as StakeholderNodeData;

      case MotivationElementType.Goal:
        return {
          ...baseData,
          priority: element.properties?.priority,
          status: element.properties?.status,
        } as GoalNodeData;

      case MotivationElementType.Requirement:
        return {
          ...baseData,
          requirementType: element.properties?.requirementType,
          priority: element.properties?.priority,
          status: element.properties?.status,
        } as RequirementNodeData;

      case MotivationElementType.Constraint:
        return {
          ...baseData,
          negotiability: element.properties?.negotiability,
        } as ConstraintNodeData;

      case MotivationElementType.Driver:
        return {
          ...baseData,
          category: element.properties?.category,
        } as DriverNodeData;

      case MotivationElementType.Outcome:
        return {
          ...baseData,
          achievementStatus: element.properties?.achievementStatus || element.properties?.status,
        } as OutcomeNodeData;

      case MotivationElementType.Principle:
        return {
          ...baseData,
          scope: element.properties?.scope,
        };

      case MotivationElementType.Assumption:
        return {
          ...baseData,
          validationStatus: element.properties?.validationStatus || element.properties?.status,
        };

      case MotivationElementType.ValueStream:
        return {
          ...baseData,
          stageCount: element.properties?.stageCount || (element.properties?.stages as any[])?.length || 0,
        };

      case MotivationElementType.Assessment:
        return {
          ...baseData,
          rating: element.properties?.rating || element.properties?.score || 0,
        };

      default:
        return baseData;
    }
  }

  /**
   * Get default fill color for element type
   */
  private getDefaultFill(elementType: MotivationElementType): string {
    switch (elementType) {
      case MotivationElementType.Stakeholder:
        return '#f3e8ff';
      case MotivationElementType.Goal:
        return '#d1fae5';
      case MotivationElementType.Requirement:
        return '#dbeafe';
      case MotivationElementType.Constraint:
        return '#fee2e2';
      case MotivationElementType.Driver:
        return '#ffedd5';
      case MotivationElementType.Outcome:
        return '#cffafe';
      default:
        return '#f3f4f6';
    }
  }

  /**
   * Get default stroke color for element type
   */
  private getDefaultStroke(elementType: MotivationElementType): string {
    switch (elementType) {
      case MotivationElementType.Stakeholder:
        return '#7c3aed';
      case MotivationElementType.Goal:
        return '#059669';
      case MotivationElementType.Requirement:
        return '#2563eb';
      case MotivationElementType.Constraint:
        return '#dc2626';
      case MotivationElementType.Driver:
        return '#ea580c';
      case MotivationElementType.Outcome:
        return '#0891b2';
      default:
        return '#6b7280';
    }
  }

  /**
   * Create ReactFlow edges from graph edges
   */
  private createReactFlowEdges(graph: MotivationGraph, zoomLevel: number): Edge[] {
    const edges: Edge[] = [];

    const pathHighlighting = this.options.pathHighlighting;
    const showEdgeLabels = semanticZoomController.shouldShowEdgeLabels(zoomLevel);

    for (const [edgeId, graphEdge] of graph.edges) {
      const edgeType = this.getReactFlowEdgeType(graphEdge.type);

      // Only show labels at detail zoom level
      const labelValue = graphEdge.relationship.properties?.label;
      const edgeLabel = showEdgeLabels && typeof labelValue === 'string' ? labelValue : undefined;

      const edgeData: MotivationEdgeData = {
        relationshipType: this.mapRelationshipType(graphEdge.type),
        label: edgeLabel,
        weight: graphEdge.weight,
        changesetOperation: graphEdge.changesetOperation,
      };

      // Apply path highlighting
      const isHighlighted = pathHighlighting?.highlightedEdgeIds?.has(edgeId) || false;
      let style: Record<string, any> = {};

      if (pathHighlighting && pathHighlighting.mode !== 'none') {
        if (isHighlighted) {
          // Highlighted edges: increase stroke width and make opaque
          style = {
            strokeWidth: 3,
            opacity: 1.0,
            stroke: '#3b82f6', // Blue for highlighted paths
          };
        } else {
          // Dim non-highlighted edges
          style = {
            strokeWidth: 1,
            opacity: 0.2,
          };
        }
      }

      edges.push({
        id: edgeId,
        source: graphEdge.sourceId,
        target: graphEdge.targetId,
        type: edgeType,
        data: edgeData,
        animated: false,
        style,
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
        },
      } as Edge<MotivationEdgeData>);
    }

    return edges;
  }

  /**
   * Map MotivationRelationshipType to ReactFlow edge type
   */
  private getReactFlowEdgeType(relType: MotivationRelationshipType): string {
    switch (relType) {
      case MotivationRelationshipType.Influence:
        return 'influence';
      case MotivationRelationshipType.Constrains:
      case MotivationRelationshipType.ConstrainedBy:
        return 'constrains';
      case MotivationRelationshipType.Realizes:
        return 'realizes';
      case MotivationRelationshipType.Refines:
        return 'refines';
      case MotivationRelationshipType.Conflicts:
        return 'conflicts';
      default:
        return 'influence'; // Default to influence edge
    }
  }

  /**
   * Map relationship type for edge data
   */
  private mapRelationshipType(
    relType: MotivationRelationshipType
  ): 'influence' | 'constrains' | 'realizes' | 'refines' | 'conflicts' | 'custom' {
    switch (relType) {
      case MotivationRelationshipType.Influence:
        return 'influence';
      case MotivationRelationshipType.Constrains:
      case MotivationRelationshipType.ConstrainedBy:
        return 'constrains';
      case MotivationRelationshipType.Realizes:
        return 'realizes';
      case MotivationRelationshipType.Refines:
        return 'refines';
      case MotivationRelationshipType.Conflicts:
        return 'conflicts';
      default:
        return 'custom';
    }
  }
}
