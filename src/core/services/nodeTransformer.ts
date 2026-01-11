/**
 * Node Transformer Service
 * Coordinates transformation from MetaModel to React Flow nodes and edges
 */

import { MetaModel, Relationship, ModelElement } from '../types';
import { VerticalLayerLayout } from '../layout/verticalLayerLayout';
import { LayoutEngine } from '../layout/engines';
import { MarkerType } from '@xyflow/react';
import { elementStore } from '../stores/elementStore';
import { LayoutResult, LayerLayoutResult } from '../types/shapes';
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
// Import Business node dimension constants
import {
  BUSINESS_SERVICE_NODE_WIDTH,
  BUSINESS_SERVICE_NODE_HEIGHT,
} from '../nodes/business/BusinessServiceNode';
import {
  BUSINESS_FUNCTION_NODE_WIDTH,
  BUSINESS_FUNCTION_NODE_HEIGHT,
} from '../nodes/business/BusinessFunctionNode';
import {
  BUSINESS_CAPABILITY_NODE_WIDTH,
  BUSINESS_CAPABILITY_NODE_HEIGHT,
} from '../nodes/business/BusinessCapabilityNode';
import { GraphElementValidator } from './validation/graphElementValidator';

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
  private validator: GraphElementValidator;

  constructor(private layoutEngine: VerticalLayerLayout | LayoutEngine) {
    this.validator = new GraphElementValidator();
  }

  /**
   * Transform a complete model into React Flow nodes and edges
   * @param model - The meta-model to transform
   * @param layoutParameters - Optional parameters for the layout engine
   * @returns Transform result with nodes, edges, and layout
   */
  async transformModel(model: MetaModel, layoutParameters?: Record<string, any>): Promise<NodeTransformResult> {
    // STEP 0: Pre-calculate dimensions for dynamic shapes
    this.precalculateDimensions(model);

    // STEP 1: Calculate layout for all layers
    let layout: any;

    // Check if layoutEngine is defined and which interface it uses
    if (!this.layoutEngine) {
      throw new Error('Layout engine is not defined');
    }

    // Check if using new LayoutEngine interface or old VerticalLayerLayout
    if ('calculateLayout' in this.layoutEngine && typeof this.layoutEngine.calculateLayout === 'function') {
      // New layout engine interface - layout each layer separately
      console.log('[NodeTransformer] Using new layout engine interface with per-layer layout');
      const parameters = layoutParameters || this.layoutEngine.getParameters();
      layout = await this.layoutLayersSeparately(model, parameters);
    } else if ('layout' in this.layoutEngine && typeof this.layoutEngine.layout === 'function') {
      // Old VerticalLayerLayout interface
      console.log('[NodeTransformer] Using old VerticalLayerLayout interface');
      layout = this.layoutEngine.layout(model.layers);
    } else {
      throw new Error('Layout engine does not have a valid layout method');
    }

    // STEP 2: Create nodes array
    const nodes: AppNode[] = [];
    const nodeMap = new Map<string, string>(); // elementId → nodeId

    // Create layer containers first (lower z-index)
    for (const [layerType, layerData] of Object.entries(layout.layers) as [string, LayerLayoutResult][]) {
      const layer = model.layers[layerType];
      if (!layer) continue;

      // Constants from LayerContainerNode component
      const titleBarWidth = 40; // Width of the vertical title bar on the left
      const containerPadding = 30; // Equal margin on all sides

      // Validate bounds before using them
      const boundsWidth = (typeof layerData.bounds.width === 'number' && !isNaN(layerData.bounds.width)) ? layerData.bounds.width : 0;
      const boundsHeight = (typeof layerData.bounds.height === 'number' && !isNaN(layerData.bounds.height)) ? layerData.bounds.height : 0;
      const boundsMinX = (typeof layerData.bounds.minX === 'number' && !isNaN(layerData.bounds.minX)) ? layerData.bounds.minX : 0;
      const boundsMinY = (typeof layerData.bounds.minY === 'number' && !isNaN(layerData.bounds.minY)) ? layerData.bounds.minY : 0;
      const yOffset = (typeof layerData.yOffset === 'number' && !isNaN(layerData.yOffset)) ? layerData.yOffset : 0;

      if (boundsWidth !== layerData.bounds.width || boundsHeight !== layerData.bounds.height) {
        console.warn(`[NodeTransformer] Invalid bounds for layer ${layerType}:`, layerData.bounds);
      }

      // Position container to include title bar on the left
      // The title bar extends to the left of the content area
      const containerX = boundsMinX - containerPadding - titleBarWidth;
      const containerY = yOffset + boundsMinY - containerPadding;

      // Size container to include title bar + content + padding
      const containerWidth = titleBarWidth + boundsWidth + (2 * containerPadding);
      const containerHeight = boundsHeight + (2 * containerPadding);

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
    for (const [layerType, layerData] of Object.entries(layout.layers) as [string, LayerLayoutResult][]) {
      const layer = model.layers[layerType];
      if (!layer) continue;

      // Skip layers without elements
      if (!layer.elements || !Array.isArray(layer.elements)) {
        console.warn(`[NodeTransformer] Layer ${layerType} has no elements or invalid elements array - skipping`);
        continue;
      }

      for (const element of layer.elements) {
        const position = layerData.positions[element.id];
        if (!position) {
          console.warn(`[NodeTransformer] No layout position for element ${element.id} (${element.name}) - skipping render`);
          continue;
        }

        // Ensure visual properties exist with defaults to prevent NaN
        if (!element.visual) {
          element.visual = { 
            position: { x: 0, y: 0 }, 
            size: { width: 180, height: 100 }, 
            style: {} 
          };
        }
        if (!element.visual.position) {
          element.visual.position = { x: 0, y: 0 };
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

        // Validate position values before calculation
        const posX = (typeof position.x === 'number' && !isNaN(position.x)) ? position.x : 0;
        const posY = (typeof position.y === 'number' && !isNaN(position.y)) ? position.y : 0;
        const layerY = (typeof layerData.yOffset === 'number' && !isNaN(layerData.yOffset)) ? layerData.yOffset : 0;

        if (posX !== position.x || posY !== position.y) {
          console.warn(`[NodeTransformer] Invalid position for element ${element.id}: x=${position.x}, y=${position.y}`);
        }

        // Convert from center position (dagre) to top-left position (React Flow)
        const halfWidth = element.visual.size.width / 2;
        const halfHeight = element.visual.size.height / 2;
        const topLeftX = posX - halfWidth;
        const topLeftY = posY - halfHeight + layerY;

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

    // STEP 4: Validate that all elements are rendered
    const validationReport = this.validator.validate(model, nodes, edges);
    if (!validationReport.isValid) {
      console.warn('[NodeTransformer] Validation detected missing elements:');
      console.warn(this.validator.getDiagnosticMessage(validationReport));

      // Log details about missing elements for debugging
      if (validationReport.missingNodes.length > 0) {
        console.warn(`[NodeTransformer] Missing ${validationReport.missingNodes.length} nodes - reasons:`);
        const reasonCounts = new Map<string, number>();
        validationReport.missingNodes.forEach((node) => {
          reasonCounts.set(node.reason, (reasonCounts.get(node.reason) || 0) + 1);
        });
        reasonCounts.forEach((count, reason) => {
          console.warn(`  - ${reason}: ${count} nodes`);
        });
      }

      if (validationReport.missingEdges.length > 0) {
        console.warn(`[NodeTransformer] Missing ${validationReport.missingEdges.length} edges - reasons:`);
        const reasonCounts = new Map<string, number>();
        validationReport.missingEdges.forEach((edge) => {
          reasonCounts.set(edge.reason, (reasonCounts.get(edge.reason) || 0) + 1);
        });
        reasonCounts.forEach((count, reason) => {
          console.warn(`  - ${reason}: ${count} edges`);
        });
      }
    } else {
      console.log('[NodeTransformer] ✓ All elements validated successfully');
    }

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
      console.warn(`[NodeTransformer] Cannot create edge ${relationship.id} (${relationship.type}): ${!sourceNodeId ? 'source' : 'target'} node missing (sourceId=${relationship.sourceId}, targetId=${relationship.targetId})`);
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
      'Process': 'businessProcess',
      'business-service': 'businessService',
      'BusinessService': 'businessService',
      'Service': 'businessService',
      'business-function': 'businessFunction',
      'BusinessFunction': 'businessFunction',
      'Function': 'businessFunction',
      'business-capability': 'businessCapability',
      'BusinessCapability': 'businessCapability',
      'Capability': 'businessCapability',
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
    } else if (nodeType === 'businessService' || nodeType === 'businessFunction' || nodeType === 'businessCapability') {
      return {
        ...baseData,
        owner: element.properties.owner,
        criticality: element.properties.criticality,
        lifecycle: element.properties.lifecycle,
        domain: element.properties.domain,
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
        // Ensure visual object exists (guard against missing visual data from server)
        if (!element.visual) {
          element.visual = {
            position: { x: 0, y: 0 },
            size: { width: 200, height: 100 },
            style: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' }
          };
        }

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

          case 'businessService':
            // BusinessServiceNode: uses imported constants from BusinessServiceNode.tsx
            element.visual.size = {
              width: BUSINESS_SERVICE_NODE_WIDTH,
              height: BUSINESS_SERVICE_NODE_HEIGHT,
            };
            break;

          case 'businessFunction':
            // BusinessFunctionNode: uses imported constants from BusinessFunctionNode.tsx
            element.visual.size = {
              width: BUSINESS_FUNCTION_NODE_WIDTH,
              height: BUSINESS_FUNCTION_NODE_HEIGHT,
            };
            break;

          case 'businessCapability':
            // BusinessCapabilityNode: uses imported constants from BusinessCapabilityNode.tsx
            element.visual.size = {
              width: BUSINESS_CAPABILITY_NODE_WIDTH,
              height: BUSINESS_CAPABILITY_NODE_HEIGHT,
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

  /**
   * Convert MetaModel to LayoutGraphInput for new layout engines
   * @unused - Reserved for future layout engine integration
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error - Method is reserved for future use
  private _modelToGraphInput(_model: MetaModel): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Collect all nodes from all layers
    for (const [layerId, layer] of Object.entries(_model.layers)) {
      for (const element of layer.elements) {
        nodes.push({
          id: element.id,
          width: element.visual?.size?.width || 200,
          height: element.visual?.size?.height || 100,
          data: {
            layer: layerId,
            type: element.type,
            ...element.properties,
          },
        });
      }

      // Add relationships as edges
      for (const rel of (layer as any).relationships) {
        edges.push({
          id: `${rel.sourceId}-${rel.targetId}`,
          source: rel.sourceId,
          target: rel.targetId,
          data: {
            type: rel.type,
            ...rel.properties,
          },
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Layout each layer separately using the selected engine, then stack vertically
   */
  private async layoutLayersSeparately(model: MetaModel, parameters: Record<string, any>): Promise<any> {
    const layerOrder = [
      'Motivation',
      'Business',
      'Security',
      'Application',
      'Technology',
      'Api',
      'DataModel',
      'Datastore',
      'Ux',
      'Navigation',
      'ApmObservability',
      'FederatedArchitecture'
    ];

    const layerSpacing = 200; // Spacing between layers
    let currentY = 0;
    const layers: any = {};

    console.log('[NodeTransformer] Starting per-layer layout for', Object.keys(model.layers).length, 'layers');

    // Process each layer in order
    for (const layerType of layerOrder) {
      const layer = model.layers[layerType];

      // Skip if layer doesn't exist or has no elements
      if (!layer || !layer.elements || !Array.isArray(layer.elements) || layer.elements.length === 0) {
        continue;
      }

      console.log(`[NodeTransformer] Laying out layer ${layerType} with ${layer.elements.length} elements`);

      // Create graph input for this layer only
      const layerGraph = this.layerToGraphInput(layer, layerType);

      // Calculate layout for this layer
      const layerResult = await (this.layoutEngine as any).calculateLayout(layerGraph, parameters);

      console.log(`[NodeTransformer] Layer ${layerType} layout: ${layerResult.nodes.length} nodes, bounds:`, layerResult.bounds);

      // Extract positions from layout result
      const positions: Record<string, { x: number; y: number }> = {};
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      for (const node of layerResult.nodes) {
        // Validate position values
        if (typeof node.position.x !== 'number' || isNaN(node.position.x) || !isFinite(node.position.x)) {
          console.warn(`[NodeTransformer] Invalid X position for node ${node.id} in layer ${layerType}: ${node.position.x}`);
          continue;
        }
        if (typeof node.position.y !== 'number' || isNaN(node.position.y) || !isFinite(node.position.y)) {
          console.warn(`[NodeTransformer] Invalid Y position for node ${node.id} in layer ${layerType}: ${node.position.y}`);
          continue;
        }

        positions[node.id] = {
          x: node.position.x,
          y: node.position.y,
        };

        // Calculate bounds
        const element = layer.elements.find(e => e.id === node.id);
        const width = element?.visual?.size?.width || 180;
        const height = element?.visual?.size?.height || 100;

        minX = Math.min(minX, node.position.x - width / 2);
        maxX = Math.max(maxX, node.position.x + width / 2);
        minY = Math.min(minY, node.position.y - height / 2);
        maxY = Math.max(maxY, node.position.y + height / 2);
      }

      console.log(`[NodeTransformer] Layer ${layerType}: ${Object.keys(positions).length} valid positions out of ${layerResult.nodes.length} nodes`);

      // Store layer layout
      layers[layerType] = {
        yOffset: currentY,
        positions,
        bounds: {
          minX,
          maxX,
          minY,
          maxY,
          width: maxX - minX,
          height: maxY - minY,
        },
      };

      // Update Y offset for next layer
      currentY += (maxY - minY) + layerSpacing;
    }

    return {
      layers,
      totalHeight: currentY - layerSpacing,
    };
  }

  /**
   * Convert a single layer to graph input format
   */
  private layerToGraphInput(layer: any, layerType: string): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Add all elements as nodes
    for (const element of layer.elements) {
      nodes.push({
        id: element.id,
        width: element.visual?.size?.width || 200,
        height: element.visual?.size?.height || 100,
        data: {
          layer: layerType,
          type: element.type,
          ...element.properties,
        },
      });
    }

    // Add relationships as edges
    for (const rel of layer.relationships) {
      edges.push({
        id: `${rel.sourceId}-${rel.targetId}`,
        source: rel.sourceId,
        target: rel.targetId,
        data: {
          type: rel.type,
          ...rel.properties,
        },
      });
    }

    return { nodes, edges };
  }

  /**
   * Convert LayoutResult back to old layer-based layout format
   * @unused - Reserved for future layout engine integration
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error - Method is reserved for future use
  private _layoutResultToLayerLayout(result: any, _model: MetaModel): any {
    const layers: any = {};

    console.log(`[NodeTransformer] Converting layout result with ${result.nodes.length} nodes to layer layout`);

    // Group nodes by layer
    for (const [layerId, _layer] of Object.entries(_model.layers)) {
      const layerNodes = result.nodes.filter((n: any) => n.data?.layer === layerId);

      if (layerNodes.length === 0) continue;

      console.log(`[NodeTransformer] Layer ${layerId}: ${layerNodes.length} nodes`);

      // Calculate bounds for this layer
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      const elements: any[] = [];
      const positions: Record<string, { x: number; y: number }> = {};

      for (const node of layerNodes) {
        const width = node.data?.width || 200;
        const height = node.data?.height || 100;

        minX = Math.min(minX, node.position.x);
        maxX = Math.max(maxX, node.position.x + width);
        minY = Math.min(minY, node.position.y);
        maxY = Math.max(maxY, node.position.y + height);

        elements.push({
          id: node.id,
          x: node.position.x,
          y: node.position.y,
        });

        // Also create positions map for element ID lookup
        positions[node.id] = {
          x: node.position.x,
          y: node.position.y,
        };
      }

      // Log sample positions for debugging
      const samplePositions = Object.entries(positions).slice(0, 3);
      console.log(`[NodeTransformer] Sample positions for ${layerId}:`, samplePositions);

      layers[layerId] = {
        yOffset: 0,
        bounds: {
          minX,
          maxX,
          minY,
          maxY,
          width: maxX - minX,
          height: maxY - minY,
        },
        elements,
        positions,
      };
    }

    return {
      layers,
      bounds: result.bounds,
    };
  }
}
