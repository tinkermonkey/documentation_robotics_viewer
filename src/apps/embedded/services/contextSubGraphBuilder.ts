/**
 * Context Sub-Graph Builder Service
 * Builds 1-hop neighborhood data from the full model for a given node ID
 * using a radial layout algorithm for positioning
 */

import { MetaModel, ModelElement, Relationship, Reference, PredicateDefinition } from '@/core/types/model';
import { AppNode, AppEdge } from '@/core/types/reactflow';
import { NodeType } from '@/core/nodes/NodeType';
import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';
import type { UnifiedNodeData } from '@/core/nodes';
import { getLayerColor, FALLBACK_COLOR } from '@/core/utils/layerColors';

/**
 * Context sub-graph containing the focal node and its 1-hop neighbors
 */
export interface ContextSubGraph {
  nodes: AppNode[];
  edges: AppEdge[];
  focalNodeId: string;
}

/**
 * Internal structure to track node positions in radial layout
 */
interface PositionMap {
  [nodeId: string]: { x: number; y: number };
}

/**
 * Get all relationships involving an element (both incoming and outgoing)
 */
function getElementRelationships(elementId: string, model: MetaModel): Relationship[] {
  const relationships: Relationship[] = [];

  // Check all layers for relationships
  for (const layer of Object.values(model.layers)) {
    if (!layer.relationships) continue;
    for (const rel of layer.relationships) {
      if (rel.sourceId === elementId || rel.targetId === elementId) {
        relationships.push(rel);
      }
    }
  }

  return relationships;
}

/**
 * Get all references involving an element (both incoming and outgoing)
 */
function getElementReferences(elementId: string, model: MetaModel): Reference[] {
  const references: Reference[] = [];

  if (!model.references) return references;

  for (const ref of model.references) {
    if (ref.source.elementId === elementId || ref.target.elementId === elementId) {
      references.push(ref);
    }
  }

  return references;
}

/**
 * Find an element by ID across all layers
 */
function findElement(elementId: string, model: MetaModel): ModelElement | undefined {
  for (const layer of Object.values(model.layers)) {
    if (!layer.elements) continue;
    const element = layer.elements.find(e => e.id === elementId);
    if (element) return element;
  }
  return undefined;
}

/**
 * Calculate radial layout positions
 * Focal node at center (0, 0), neighbors evenly distributed on circle
 */
function buildRadialLayout(focalId: string, neighborIds: string[]): PositionMap {
  const positions: PositionMap = {};

  // Focal node at center
  positions[focalId] = { x: 0, y: 0 };

  // Empty neighborhood - just return focal
  if (neighborIds.length === 0) {
    return positions;
  }

  // Calculate radius based on number of neighbors
  const radius = Math.max(120, neighborIds.length * 40);

  // Distribute neighbors evenly around circle
  for (let i = 0; i < neighborIds.length; i++) {
    const angle = (2 * Math.PI * i) / neighborIds.length;
    positions[neighborIds[i]] = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  }

  return positions;
}

/**
 * Get the node type for an element using nodeConfigLoader
 */
function getNodeTypeForElement(element: ModelElement): NodeType | null {
  // Special case: LayerContainer remains separate for layout purposes
  if (element.type === 'LayerContainer' || element.type === 'layer-container') {
    return NodeType.LAYER_CONTAINER;
  }

  // Map element type to NodeType via config
  const mappedType = nodeConfigLoader.mapElementType(element.type);
  return mappedType as NodeType | null;
}

/**
 * Extract node data for an element
 */
function extractNodeData(
  element: ModelElement,
  nodeType: NodeType | null
): UnifiedNodeData {
  if (!nodeType) {
    throw new Error(`Cannot determine node type for element: ${element.id} (type: ${element.type})`);
  }

  const layerColor = getLayerColor(element.layerId, 'primary') || FALLBACK_COLOR;

  const data: UnifiedNodeData = {
    label: element.name,
    elementId: element.id,
    layerId: element.layerId,
    nodeType,
    detailLevel: 'minimal' as const,
    fill: layerColor,
    stroke: layerColor,
    modelElement: element,
  };

  return data;
}

/**
 * Build 1-hop context sub-graph for a focal node
 * Includes all elements connected by relationships or references (1 hop away)
 */
export function buildContextSubGraph(
  focalElementId: string,
  model: MetaModel,
  predicateCatalog?: Map<string, PredicateDefinition>
): ContextSubGraph {
  // Find the focal element
  const focalElement = findElement(focalElementId, model);
  if (!focalElement) {
    throw new Error(`Focal element not found: ${focalElementId}`);
  }

  const nodes: AppNode[] = [];
  const edges: AppEdge[] = [];
  const processedNodes = new Set<string>();

  // Collect all neighbors (1-hop away)
  const neighborSet = new Set<string>();

  // Get relationships
  const relationships = getElementRelationships(focalElementId, model);
  for (const rel of relationships) {
    if (rel.sourceId !== focalElementId) {
      neighborSet.add(rel.sourceId);
    }
    if (rel.targetId !== focalElementId) {
      neighborSet.add(rel.targetId);
    }
  }

  // Get references (cross-layer)
  const references = getElementReferences(focalElementId, model);
  for (const ref of references) {
    if (ref.source.elementId && ref.source.elementId !== focalElementId) {
      neighborSet.add(ref.source.elementId);
    }
    if (ref.target.elementId && ref.target.elementId !== focalElementId) {
      neighborSet.add(ref.target.elementId);
    }
  }

  // Convert to array and filter out invalid elements
  const validNeighbors: string[] = [];
  for (const neighborId of neighborSet) {
    if (findElement(neighborId, model)) {
      validNeighbors.push(neighborId);
    }
  }

  // Calculate radial layout
  const allNodeIds = [focalElementId, ...validNeighbors];
  const positions = buildRadialLayout(focalElementId, validNeighbors);

  // Create nodes
  for (const nodeId of allNodeIds) {
    const element = findElement(nodeId, model);
    if (!element) continue;

    const isFocal = nodeId === focalElementId;
    const position = positions[nodeId] || { x: 0, y: 0 };

    // Get node type and dimensions
    const nodeType = getNodeTypeForElement(element);
    if (!nodeType) {
      console.warn(`[ContextSubGraphBuilder] Cannot determine node type for element: ${element.id}`);
      continue;
    }

    const config = nodeConfigLoader.getStyleConfig(nodeType);
    const dimensions = config?.dimensions || { width: 120, height: 80 };

    // Extract node data
    const nodeData = extractNodeData(element, nodeType);

    // Build React Flow node
    const node: AppNode = {
      id: nodeId,
      data: nodeData,
      position,
      type: 'unified',
      width: dimensions.width,
      height: dimensions.height,
      draggable: false,
      selectable: true,
      style: {
        opacity: isFocal ? 1 : 0.8,
        zIndex: isFocal ? 10 : 1,
      },
    };

    nodes.push(node);
    processedNodes.add(nodeId);
  }

  // Create edges for all relationships
  for (const rel of relationships) {
    const sourceId = rel.sourceId;
    const targetId = rel.targetId;

    // Only create edge if both source and target are in our graph
    if (processedNodes.has(sourceId) && processedNodes.has(targetId)) {
      // Use relationship ID for deterministic, unique edge IDs
      const edgeId = `edge-rel-${rel.id}`;

      // Get predicate label
      let label = rel.predicate || rel.type;
      if (predicateCatalog && rel.predicate) {
        const predicateDef = predicateCatalog.get(rel.predicate);
        if (predicateDef) {
          label = predicateDef.predicate;
        }
      }

      const edge: AppEdge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        label,
        animated: false,
        style: {
          stroke: '#9ca3af',
          strokeWidth: 1.5,
        },
      };

      edges.push(edge);
    }
  }

  // Create edges for all references (cross-layer)
  for (const ref of references) {
    const sourceId = ref.source.elementId;
    const targetId = ref.target.elementId;

    // Only create edge if both source and target are in our graph
    if (sourceId && targetId && processedNodes.has(sourceId) && processedNodes.has(targetId)) {
      // Use reference ID for deterministic, unique edge IDs
      const edgeId = `edge-ref-${ref.id}`;

      // Get reference type as label
      let label = ref.predicate || ref.type;

      const edge: AppEdge = {
        id: edgeId,
        source: sourceId,
        target: targetId,
        label,
        animated: false,
        style: {
          stroke: '#d1d5db',
          strokeWidth: 1,
          strokeDasharray: '5,5',
        },
      };

      edges.push(edge);
    }
  }

  return {
    nodes,
    edges,
    focalNodeId: focalElementId,
  };
}
