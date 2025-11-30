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

/**
 * Transformer configuration options
 */
export interface TransformerOptions {
  layoutAlgorithm?: 'force' | 'hierarchical' | 'radial' | 'manual';
  layoutOptions?: LayoutOptions;
  selectedElementTypes?: Set<MotivationElementType>;
  selectedRelationshipTypes?: Set<MotivationRelationshipType>;
  centerNodeId?: string; // For radial layout
  existingPositions?: Map<string, { x: number; y: number }>; // For manual layout
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

  constructor(options: TransformerOptions = {}) {
    this.options = options;
  }

  /**
   * Transform MotivationGraph to ReactFlow format
   */
  transform(graph: MotivationGraph): TransformResult {
    console.log('[MotivationGraphTransformer] Transforming graph with', graph.nodes.size, 'nodes');

    // Apply filters if specified
    const filteredGraph = this.applyFilters(graph);

    // Apply layout algorithm
    const layoutResult = this.applyLayout(filteredGraph);

    // Convert to ReactFlow nodes
    const nodes = this.createReactFlowNodes(filteredGraph, layoutResult);

    // Convert to ReactFlow edges
    const edges = this.createReactFlowEdges(filteredGraph);

    console.log('[MotivationGraphTransformer] Transformation complete:', {
      nodes: nodes.length,
      edges: edges.length,
      bounds: layoutResult.bounds,
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
        if (!centerNodeId) {
          console.warn('[MotivationGraphTransformer] No center node for radial layout, using force-directed');
          return forceDirectedLayout(graph, this.options.layoutOptions);
        }
        return radialLayout(graph, centerNodeId, this.options.layoutOptions);
      }

      case 'manual': {
        if (!this.options.existingPositions) {
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
    layoutResult: LayoutResult
  ): Node[] {
    const nodes: Node[] = [];

    for (const [nodeId, graphNode] of graph.nodes) {
      const position = layoutResult.nodePositions.get(nodeId);
      if (!position) {
        console.warn('[MotivationGraphTransformer] No position found for node', nodeId);
        continue;
      }

      const elementType = graphNode.element.type as MotivationElementType;
      const nodeType = this.getReactFlowNodeType(elementType);
      const nodeData = this.createNodeData(graphNode);

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
          stageCount: element.properties?.stageCount || element.properties?.stages?.length || 0,
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
  private createReactFlowEdges(graph: MotivationGraph): Edge[] {
    const edges: Edge[] = [];

    for (const [edgeId, graphEdge] of graph.edges) {
      const edgeType = this.getReactFlowEdgeType(graphEdge.type);

      const edgeData: MotivationEdgeData = {
        relationshipType: this.mapRelationshipType(graphEdge.type),
        label: graphEdge.relationship.properties?.label,
        weight: graphEdge.weight,
        changesetOperation: graphEdge.changesetOperation,
      };

      edges.push({
        id: edgeId,
        source: graphEdge.sourceId,
        target: graphEdge.targetId,
        type: edgeType,
        data: edgeData,
        animated: false,
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
