/**
 * Node Transformer Service
 * Coordinates transformation from MetaModel to React Flow nodes and edges
 */

import { MetaModel, Relationship, ModelElement } from '../types';
import { VerticalLayerLayout } from '../layout/verticalLayerLayout';
import { MarkerType } from '@xyflow/react';
import { elementStore } from '../stores/elementStore';
import { LayoutResult } from '../types/shapes';
import { AppNode, AppEdge } from '../types/reactflow';
import { FALLBACK_COLOR } from '../utils/layerColors';
// Import C4 node dimension constants to prevent drift
import {
  CONTAINER_NODE_WIDTH,
  CONTAINER_NODE_HEIGHT,
} from '../nodes/c4/ContainerNode';
import {
  COMPONENT_NODE_WIDTH,
  COMPONENT_NODE_HEIGHT,
} from '../nodes/c4/ComponentNode';
import {
  EXTERNAL_ACTOR_NODE_WIDTH,
  EXTERNAL_ACTOR_NODE_HEIGHT,
} from '../nodes/c4/ExternalActorNode';

/**
 * Result of transforming a model
 */
export interface NodeTransformResult {
  nodes: AppNode[];
  edges: AppEdge[];
  layout: LayoutResult;
}

/**
 * Transforms a MetaModel into React Flow nodes and edges with proper layout
 */
export class NodeTransformer {
  constructor(private layoutEngine: VerticalLayerLayout) {}

  /**
   * Transform a complete model into React Flow nodes and edges
   * @param model - The meta-model to transform
   * @returns Transform result with nodes, edges, and layout
   */
  async transformModel(model: MetaModel): Promise<NodeTransformResult> {
    // STEP 0: Pre-calculate dimensions for dynamic shapes
    this.precalculateDimensions(model);

    // STEP 1: Calculate layout for all layers
    const layout = this.layoutEngine.layout(model.layers);

    // STEP 2: Create nodes array
    const nodes: AppNode[] = [];
    const nodeMap = new Map<string, string>(); // elementId → nodeId

    // Create layer containers first (lower z-index)
    for (const [layerType, layerData] of Object.entries(layout.layers)) {
      const layer = model.layers[layerType];
      if (!layer) continue;

      // Constants from LayerContainerNode component
      const titleBarWidth = 40; // Width of the vertical title bar on the left
      const containerPadding = 30; // Equal margin on all sides

      // Position container to include title bar on the left
      // The title bar extends to the left of the content area
      const containerX = layerData.bounds.minX - containerPadding - titleBarWidth;
      const containerY = layerData.yOffset + layerData.bounds.minY - containerPadding;

      // Size container to include title bar + content + padding
      const containerWidth = titleBarWidth + layerData.bounds.width + (2 * containerPadding);
      const containerHeight = layerData.bounds.height + (2 * containerPadding);

      const containerNode = {
        id: `container-${layerType}`,
        type: 'layerContainer' as const,
        position: { x: containerX, y: containerY },
        data: {
          label: layerData.name,
          elementId: `container-${layerType}`,
          layerId: layerType,
          fill: layerData.color,
          stroke: layerData.color,
          layerType: layerType,
          color: layerData.color,
        },
        width: containerWidth,
        height: containerHeight,
        style: { zIndex: -1 },
        selectable: false,
        draggable: false,
      };

      nodes.push(containerNode as AppNode);
    }

    // Create element nodes
    for (const [layerType, layerData] of Object.entries(layout.layers)) {
      const layer = model.layers[layerType];
      if (!layer) continue;

      // Skip layers without elements
      if (!layer.elements || !Array.isArray(layer.elements)) {
        continue;
      }

      for (const element of layer.elements) {
        const position = layerData.positions[element.id];
        if (!position) continue;

        // Ensure visual.size exists with defaults to prevent NaN
        if (!element.visual) {
          element.visual = { size: { width: 180, height: 100 }, style: {} };
        }
        if (!element.visual.size) {
          element.visual.size = { width: 180, height: 100 };
        }
        if (typeof element.visual.size.width !== 'number' || isNaN(element.visual.size.width)) {
          element.visual.size.width = 180;
        }
        if (typeof element.visual.size.height !== 'number' || isNaN(element.visual.size.height)) {
          element.visual.size.height = 100;
        }

        // Convert from center position (dagre) to top-left position (React Flow)
        const halfWidth = element.visual.size.width / 2;
        const halfHeight = element.visual.size.height / 2;
        const topLeftX = position.x - halfWidth;
        const topLeftY = position.y - halfHeight + layerData.yOffset;

        // Store element in elementStore
        elementStore.set(element.id, element);

        // Create node ID
        const nodeId = `node-${element.id}`;
        nodeMap.set(element.id, nodeId);

        // Determine node type
        const nodeType = this.getNodeTypeForElement(element);

        // Create node with type-specific data
        const node = {
          id: nodeId,
          type: nodeType,
          position: { x: topLeftX, y: topLeftY },
          data: this.extractNodeData(element, nodeType),
          width: element.visual.size.width,
          height: element.visual.size.height,
          style: { zIndex: 1 }, // Above layer containers (which have zIndex: -1)
        };

        nodes.push(node as AppNode);
      }
    }

    // STEP 3: Create edges array
    const edges: AppEdge[] = [];
    let relationshipCount = 0;

    // Create edges from layer relationships
    for (const layer of Object.values(model.layers)) {
      relationshipCount += layer.relationships.length;
      for (const relationship of layer.relationships) {
        const edge = this.createEdge(relationship, nodeMap);
        if (edge) edges.push(edge);
      }
    }
    console.log(`[NodeTransformer] Processed ${relationshipCount} relationships`);

    // Create edges from cross-layer references
    for (const reference of model.references) {
      if (reference.source.elementId && reference.target.elementId) {
        const sourceNodeId = nodeMap.get(reference.source.elementId);
        const targetNodeId = nodeMap.get(reference.target.elementId);

        if (sourceNodeId && targetNodeId) {
          edges.push({
            id: `edge-ref-${reference.source.elementId}-${reference.target.elementId}`,
            source: sourceNodeId,
            target: targetNodeId,
            type: 'elbow',
            label: reference.type,
            labelStyle: { fill: '#555', fontWeight: 500, fontSize: 12 },
            labelBgStyle: { fill: '#fff', fillOpacity: 0.8, rx: 4, ry: 4 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: FALLBACK_COLOR,
            },
            style: { strokeDasharray: '5,5' }, // Dashed line for cross-layer references
            data: {
              pathOptions: {
                offset: 10, // 10px margin around nodes for routing
                borderRadius: 8, // Rounded corners for smoother paths
              },
            },
          } as AppEdge);
        }
      }
    }

    console.log(`[NodeTransformer] Created ${nodes.length} nodes and ${edges.length} edges`);

    return { nodes, edges, layout };
  }

  /**
   * Create an edge from a relationship
   */
  private createEdge(
    relationship: Relationship,
    nodeMap: Map<string, string>
  ): AppEdge | null {
    const sourceNodeId = nodeMap.get(relationship.sourceId);
    const targetNodeId = nodeMap.get(relationship.targetId);

    if (!sourceNodeId || !targetNodeId) {
      // console.warn(`[NodeTransformer] Missing node for edge ${relationship.id}: source=${relationship.sourceId} (${!!sourceNodeId}), target=${relationship.targetId} (${!!targetNodeId})`);
      return null;
    }

    // Check for field-level connection
    const sourceHandle = relationship.properties?.sourceField
      ? `field-${relationship.properties.sourceField}-right`
      : undefined;
    const targetHandle = relationship.properties?.targetField
      ? `field-${relationship.properties.targetField}-left`
      : undefined;

    return {
      id: `edge-${relationship.id}`,
      source: sourceNodeId,
      target: targetNodeId,
      sourceHandle,
      targetHandle,
      type: 'elbow', // Use custom elbow edge for better routing and spacing
      animated: false,
      label: relationship.type, // Add predicate label
      labelStyle: { fill: '#555', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.8, rx: 4, ry: 4 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: FALLBACK_COLOR,
      },
      data: {
        pathOptions: {
          offset: 10, // 10px margin around nodes for routing
          borderRadius: 8, // Rounded corners for smoother paths
        },
      },
    } as AppEdge;
  }

  /**
   * Get node type for an element
   */
  private getNodeTypeForElement(element: ModelElement): string {
    const typeMap: Record<string, string> = {
      'data-model-component': 'dataModel',
      'DataModelComponent': 'dataModel',
      'Entity': 'dataModel',
      'Interface': 'dataModel',
      'Enum': 'dataModel',
      'api-endpoint': 'apiEndpoint',
      'APIEndpoint': 'apiEndpoint',
      'Endpoint': 'apiEndpoint',
      'role': 'role',
      'Role': 'role',
      'permission': 'permission',
      'Permission': 'permission',
      'Policy': 'permission',
      'business-process': 'businessProcess',
      'BusinessProcess': 'businessProcess',
      'json-schema-element': 'jsonSchema',
      'layer-container': 'layerContainer',
      // C4 node types
      'c4-container': 'c4Container',
      'C4Container': 'c4Container',
      'Container': 'c4Container',
      'c4-component': 'c4Component',
      'C4Component': 'c4Component',
      'c4-external-actor': 'c4ExternalActor',
      'C4ExternalActor': 'c4ExternalActor',
      'ExternalActor': 'c4ExternalActor',
      'ExternalSystem': 'c4ExternalActor',
    };

    return typeMap[element.type] || 'businessProcess';
  }

  /**
   * Extract node data based on element type
   */
  private extractNodeData(element: ModelElement, nodeType: string): any {
    const baseData = {
      label: element.name,
      elementId: element.id,
      layerId: element.layerId,
      fill: element.visual.style.backgroundColor || '#ffffff',
      stroke: element.visual.style.borderColor || '#000000',
      modelElement: element,
    };

    // Add type-specific data
    if (nodeType === 'dataModel') {
      return {
        ...baseData,
        fields: element.properties.fields || [],
        componentType: element.properties.componentType || 'entity',
      };
    } else if (nodeType === 'jsonSchema') {
      // JSON Schema elements store properties in schemaInfo.properties
      // We need to transform them to the format expected by BaseFieldListNode
      const schemaProperties = (element as any).schemaInfo?.properties || [];
      const properties = schemaProperties.map((prop: any) => ({
        id: prop.name,
        name: prop.name,
        type: prop.type || 'any',
        required: prop.required || false,
      }));

      return {
        ...baseData,
        schemaElementId: element.id,
        expanded: false,
        properties,
      };
    } else if (nodeType === 'apiEndpoint') {
      return {
        ...baseData,
        path: element.properties.path || '/api/endpoint',
        method: element.properties.method || 'GET',
        operationId: element.properties.operationId,
      };
    } else if (nodeType === 'role') {
      return {
        ...baseData,
        level: element.properties.level,
        inheritsFrom: element.properties.inheritsFrom,
      };
    } else if (nodeType === 'permission') {
      return {
        ...baseData,
        scope: element.properties.scope || 'resource',
        resource: element.properties.resource,
        action: element.properties.action,
      };
    } else if (nodeType === 'c4Container') {
      return {
        ...baseData,
        containerType: element.properties.containerType || 'other',
        technology: element.properties.technology || [],
        description: element.properties.description || element.description,
      };
    } else if (nodeType === 'c4Component') {
      return {
        ...baseData,
        role: element.properties.role,
        technology: element.properties.technology || [],
        description: element.properties.description || element.description,
        interfaces: element.properties.interfaces || [],
      };
    } else if (nodeType === 'c4ExternalActor') {
      return {
        ...baseData,
        actorType: element.properties.actorType || 'user',
        description: element.properties.description || element.description,
      };
    }

    return baseData;
  }

  /**
   * Pre-calculate dimensions for all node types
   * CRITICAL: These dimensions MUST match the actual rendered component sizes
   * This ensures dagre layout and React Flow positioning are correct
   */
  private precalculateDimensions(model: MetaModel): void {
    for (const layer of Object.values(model.layers)) {
      // Skip layers without elements
      if (!layer.elements || !Array.isArray(layer.elements)) {
        continue;
      }

      for (const element of layer.elements) {
        // Get node type to determine dimensions
        const nodeType = this.getNodeTypeForElement(element);

        switch (nodeType) {
          case 'jsonSchema':
            // JSONSchemaNode: width 280, height dynamic
            const schemaHeaderHeight = 36;
            const propertyHeight = 24;
            // JSON Schema elements store properties in schemaInfo.properties
            const properties = (element as any).schemaInfo?.properties || [];
            const schemaHeight = properties.length > 0
              ? schemaHeaderHeight + properties.length * propertyHeight
              : schemaHeaderHeight + 60; // "No properties" message

            element.visual.size = {
              width: 280,
              height: schemaHeight,
            };
            break;

          case 'dataModel':
            // DataModelNode: width 280, height dynamic
            const modelHeaderHeight = 36;
            const fieldHeight = 24;
            const fields = (element.properties.fields as any[]) || [];
            const modelHeight = fields.length > 0
              ? modelHeaderHeight + fields.length * fieldHeight
              : modelHeaderHeight + 60; // "No properties" message

            element.visual.size = {
              width: 280,
              height: modelHeight,
            };
            break;

          case 'role':
            // RoleNode: fixed dimensions from RoleNode.tsx
            element.visual.size = {
              width: 160,
              height: 90,
            };
            break;

          case 'permission':
            // PermissionNode: fixed dimensions from PermissionNode.tsx
            element.visual.size = {
              width: 180,
              height: 90,
            };
            break;

          case 'apiEndpoint':
            // APIEndpointNode: fixed dimensions from APIEndpointNode.tsx
            element.visual.size = {
              width: 250,
              height: 80,
            };
            break;

          case 'businessProcess':
            // BusinessProcessNode: fixed dimensions from BusinessProcessNode.tsx
            element.visual.size = {
              width: 180,
              height: 100,
            };
            break;

          case 'c4Container':
            // C4 ContainerNode: uses imported constants from ContainerNode.tsx
            element.visual.size = {
              width: CONTAINER_NODE_WIDTH,
              height: CONTAINER_NODE_HEIGHT,
            };
            break;

          case 'c4Component':
            // C4 ComponentNode: uses imported constants from ComponentNode.tsx
            element.visual.size = {
              width: COMPONENT_NODE_WIDTH,
              height: COMPONENT_NODE_HEIGHT,
            };
            break;

          case 'c4ExternalActor':
            // C4 ExternalActorNode: uses imported constants from ExternalActorNode.tsx
            element.visual.size = {
              width: EXTERNAL_ACTOR_NODE_WIDTH,
              height: EXTERNAL_ACTOR_NODE_HEIGHT,
            };
            break;

          default:
            // Default fallback dimensions
            element.visual.size = element.visual.size || {
              width: 200,
              height: 100,
            };
            break;
        }
      }
    }
  }
}
