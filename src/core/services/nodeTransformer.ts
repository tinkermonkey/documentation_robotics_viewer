/**
 * Node Transformer Service
 * Coordinates transformation from MetaModel to React Flow nodes and edges
 */

import { MetaModel, Relationship, ModelElement } from '../types';
import { VerticalLayerLayout } from '../layout/verticalLayerLayout';
import { LayoutEngine } from '../layout/engines';
import { MarkerType, Edge } from '@xyflow/react';
import { elementStore } from '../stores/elementStore';
import { applyEdgeBundling, calculateOptimalThreshold } from '../layout/edgeBundling';
import { LayoutResult, LayerLayoutResult } from '../types/shapes';
import { AppNode, AppEdge } from '../types/reactflow';
import { FALLBACK_COLOR } from '../utils/layerColors';
import { nodeConfigLoader } from '../nodes/nodeConfigLoader';
import { NodeType } from '../nodes/NodeType';
import type { UnifiedNodeData } from '../nodes/components/UnifiedNode';
import type { FieldItem } from '../nodes/components/FieldList';
// C4 node dimensions are loaded from nodeConfigLoader
import { extractCrossLayerReferences, referencesToEdges } from './crossLayerLinksExtractor';

/**
 * Result of transforming a model
 */
export interface NodeTransformResult {
  nodes: AppNode[];
  edges: AppEdge[];
  layout: LayoutResult;
}

/**
 * Extended ModelElement interface for data layer elements
 * Adds optional properties that may be present on schema/data model elements
 */
interface DataLayerModelElement extends ModelElement {
  detailLevel?: 'minimal' | 'standard' | 'detailed';
  changesetOperation?: 'add' | 'update' | 'delete';
  relationshipBadge?: any;
  schemaInfo?: {
    properties?: Record<string, any> | any[];
    required?: string[];
  };
}

/**
 * Transforms a MetaModel into React Flow nodes and edges with proper layout
 */
export class NodeTransformer {
  constructor(private layoutEngine: VerticalLayerLayout | LayoutEngine) {}

  /**
   * Transform a complete model into React Flow nodes and edges
   * @param model - The meta-model to transform
   * @param layoutParameters - Optional parameters for the layout engine
   * @returns Transform result with nodes, edges, and layout
   */
  async transformModel(
    model: MetaModel,
    layoutParameters?: Record<string, any>,
    measuredNodeSizes?: Map<string, { width: number; height: number }>
  ): Promise<NodeTransformResult> {
    // STEP 0: Pre-calculate dimensions for dynamic shapes (override with DOM-measured sizes if provided)
    this.precalculateDimensions(model, measuredNodeSizes);

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

    // Create edges from cross-layer references using shared utility
    const crossLayerReferences = extractCrossLayerReferences(model, true, new Set(), new Set());
    const crossLayerEdges = referencesToEdges(crossLayerReferences, model, (elementId) => nodeMap.get(elementId));

    // Apply edge bundling to reduce visual clutter in dense cross-layer graphs
    const threshold = calculateOptimalThreshold(nodes.length, crossLayerEdges.length);
    const { bundledEdges } = applyEdgeBundling(crossLayerEdges as Edge[], { threshold });
    edges.push(...(bundledEdges as AppEdge[]));

    console.log(`[NodeTransformer] Created ${nodes.length} nodes and ${edges.length} edges`);

    // STEP 4: Dev-mode validation - warn about missing elements
    if (typeof window !== 'undefined' && (window as any).__DEV__ !== false) {
      const expectedCount = Object.values(model.layers)
        .reduce((sum, layer) => sum + (layer.elements?.length || 0), 0);
      if (nodes.length < expectedCount) {
        console.warn(
          `[NodeTransformer] Rendered ${nodes.length} of ${expectedCount} elements. ` +
          `${expectedCount - nodes.length} elements may be missing from the graph.`
        );
      }
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
   * Motivation and Business layer nodes use the unified node type with configuration-driven styling
   * C4 layer nodes also use the unified node type with field-based rendering
   */
  private getNodeTypeForElement(element: ModelElement): string {
    // For motivation layer elements, use unified node type
    if (element.layerId?.toLowerCase() === 'motivation') {
      const mappedType = nodeConfigLoader.mapElementType(element.type);
      if (mappedType && mappedType.startsWith('motivation.')) {
        return 'unified';
      }
    }

    // For business layer elements, use unified node type with config lookup
    if (element.layerId?.toLowerCase() === 'business') {
      const mappedType = nodeConfigLoader.mapElementType(element.type);
      if (mappedType && mappedType.startsWith('business.')) {
        return 'unified';
      }
    }

    // For C4 layer elements, use unified node type with config lookup
    if (element.layerId?.toLowerCase() === 'c4' || element.type?.startsWith('c4.') || element.type?.startsWith('c4-')) {
      const mappedType = nodeConfigLoader.mapElementType(element.type);
      if (mappedType && mappedType.startsWith('c4.')) {
        return 'unified';
      }
      // Fallback: check if type itself indicates C4 element and has been registered
      if (element.type && (element.type.startsWith('c4.') || element.type.startsWith('c4-'))) {
        return 'unified';
      }
    }

    // For data layer elements, use unified node type with config lookup
    if (element.layerId?.toLowerCase() === 'data' || element.type?.startsWith('data.')) {
      const mappedType = nodeConfigLoader.mapElementType(element.type);
      if (mappedType && (mappedType === NodeType.DATA_JSON_SCHEMA || mappedType === NodeType.DATA_MODEL)) {
        return 'unified';
      }
    }

    // Special handling for JSONSchema elements (legacy support)
    if (element.type === 'JSONSchema' || element.type === 'json-schema' || element.type === 'json-schema-element') {
      return 'unified';
    }

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
      // C4 type fallback mappings for robustness
      'c4.container': 'unified',
      'c4-container': 'unified',
      'c4.component': 'unified',
      'c4-component': 'unified',
      'c4.external-actor': 'unified',
      'c4-external-actor': 'unified',
    };

    const mapped = typeMap[element.type];
    if (!mapped) {
      console.warn(`[NodeTransformer] Unknown element type "${element.type}" for "${element.name}". Falling back to businessProcess.`);
    }
    return mapped || 'businessProcess';
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

    // Handle unified node type for motivation, business, C4, and data layers
    if (nodeType === 'unified') {
      const mappedType = nodeConfigLoader.mapElementType(element.type);
      if (mappedType && mappedType.startsWith('motivation.')) {
        return this.extractMotivationNodeData(element, mappedType as NodeType);
      }
      if (mappedType && mappedType.startsWith('business.')) {
        return this.extractBusinessNodeData(element, mappedType as NodeType);
      }
      if (mappedType && mappedType.startsWith('c4.')) {
        return this.extractC4NodeData(element, mappedType as NodeType);
      }
      if (mappedType && mappedType.startsWith('data.')) {
        return this.extractDataNodeData(element, mappedType as NodeType);
      }
      // Special handling for legacy JSONSchema elements
      if (element.type === 'JSONSchema' || element.type === 'json-schema' || element.type === 'json-schema-element') {
        return this.extractDataNodeData(element, NodeType.DATA_JSON_SCHEMA);
      }
    }

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
   * Extract unified node data for motivation layer elements
   */
  private extractMotivationNodeData(element: ModelElement, nodeType: NodeType): UnifiedNodeData {
    return {
      nodeType,
      label: element.name || element.id,
      items: this.extractFieldItems(element),
      badges: this.extractMotivationBadges(element, nodeType),
      detailLevel: (element as any).detailLevel || 'standard',
      changesetOperation: (element as any).changesetOperation,
      relationshipBadge: (element as any).relationshipBadge,
      // Keep original data for compatibility
      elementId: element.id,
      layerId: element.layerId,
      modelElement: element,
    } as any;
  }

  /**
   * Extract unified node data for business layer elements
   */
  private extractBusinessNodeData(element: ModelElement, nodeType: NodeType): UnifiedNodeData {
    return {
      nodeType,
      label: element.name || element.id,
      items: this.extractFieldItems(element),
      badges: this.extractBusinessBadges(element, nodeType),
      detailLevel: (element as any).detailLevel || 'standard',
      changesetOperation: (element as any).changesetOperation,
      // Keep original data for compatibility
      elementId: element.id,
      layerId: element.layerId,
      modelElement: element,
    } as any;
  }

  /**
   * Extract field items from element attributes or properties
   */
  private extractFieldItems(element: ModelElement): any[] | undefined {
    if (!element.properties || typeof element.properties !== 'object') {
      return undefined;
    }

    const items: any[] = [];

    // Map common motivation node properties to field items
    const propertyMap: Record<string, string> = {
      description: 'Description',
      priority: 'Priority',
      status: 'Status',
      category: 'Category',
      scope: 'Scope',
      negotiability: 'Negotiability',
      validationStatus: 'Validation Status',
      assumptionType: 'Type',
      stakeholderType: 'Type',
      owner: 'Owner',
      criticality: 'Criticality',
    };

    for (const [key, value] of Object.entries(element.properties)) {
      if (value === null || value === undefined) continue;
      if (key.startsWith('_')) continue; // Skip internal properties

      const label = propertyMap[key] || this.formatFieldLabel(key);
      items.push({
        id: key,
        label,
        value: String(value),
        required: false,
      });
    }

    return items.length > 0 ? items : undefined;
  }

  /**
   * Extract badges for motivation nodes based on type and data
   */
  private extractMotivationBadges(element: ModelElement, nodeType: NodeType): any[] {
    const badges: any[] = [];
    const props: Record<string, unknown> = element.properties || {};

    switch (nodeType) {
      case NodeType.MOTIVATION_STAKEHOLDER:
        if (props.stakeholderType) {
          badges.push({
            position: 'inline' as const,
            content: props.stakeholderType,
            ariaLabel: `Type: ${props.stakeholderType}`,
          });
        }
        break;

      case NodeType.MOTIVATION_GOAL:
        if (props.priority) {
          badges.push({
            position: 'top-right' as const,
            content: `${props.priority}`,
            ariaLabel: `Priority: ${props.priority}`,
          });
        }
        break;

      case NodeType.MOTIVATION_REQUIREMENT:
        if (props.status) {
          badges.push({
            position: 'top-left' as const,
            content: props.status === 'satisfied' ? '✓' : '○',
            ariaLabel: `Status: ${props.status}`,
          });
        }
        break;

      case NodeType.MOTIVATION_DRIVER:
        if (props.category) {
          badges.push({
            position: 'top-right' as const,
            content: props.category,
            ariaLabel: `Category: ${props.category}`,
          });
        }
        break;

      case NodeType.MOTIVATION_OUTCOME:
        if (props.status) {
          badges.push({
            position: 'top-right' as const,
            content: props.status,
            ariaLabel: `Status: ${props.status}`,
          });
        }
        break;

      case NodeType.MOTIVATION_CONSTRAINT:
        if (props.negotiability) {
          badges.push({
            position: 'top-right' as const,
            content: props.negotiability,
            ariaLabel: `Negotiability: ${props.negotiability}`,
          });
        }
        break;

      case NodeType.MOTIVATION_ASSESSMENT:
        if (props.rating) {
          badges.push({
            position: 'top-right' as const,
            content: `${props.rating}/5`,
            ariaLabel: `Rating: ${props.rating} out of 5`,
          });
        }
        break;
    }

    return badges.length > 0 ? badges : [];
  }

  /**
   * Extract badges for business nodes based on type and data
   */
  private extractBusinessBadges(element: ModelElement, nodeType: NodeType): any[] {
    const badges: any[] = [];
    const props: Record<string, unknown> = element.properties || {};

    // Owner badge (common to all business node types)
    if (props.owner) {
      badges.push({
        position: 'inline' as const,
        content: props.owner,
        ariaLabel: `Owner: ${props.owner}`,
      });
    }

    // Criticality badge (color-coded, common to all business node types)
    if (props.criticality) {
      const criticality = String(props.criticality);
      const criticityColorClasses: Record<string, string> = {
        'high': 'bg-red-100',
        'medium': 'bg-orange-100',
        'low': 'bg-green-100',
      };
      badges.push({
        position: 'inline' as const,
        content: criticality,
        className: `text-xs px-2 py-0.5 rounded ${criticityColorClasses[criticality] || 'bg-gray-100'}`,
        ariaLabel: `Criticality: ${criticality}`,
      });
    }

    // Domain badge (only for Function and Service nodes)
    if ((nodeType === NodeType.BUSINESS_FUNCTION || nodeType === NodeType.BUSINESS_SERVICE) && props.domain) {
      badges.push({
        position: 'inline' as const,
        content: props.domain,
        ariaLabel: `Domain: ${props.domain}`,
      });
    }

    // Special handling for BusinessProcess expand/collapse
    const subprocessCount = props.subprocessCount ? Number(props.subprocessCount) : 0;
    if (nodeType === NodeType.BUSINESS_PROCESS && subprocessCount > 0) {
      badges.push({
        position: 'top-right' as const,
        content: (props.expanded as boolean) ? '▼' : '▶',
        className: 'cursor-pointer text-lg leading-none',
        ariaLabel: (props.expanded as boolean) ? 'Collapse subprocesses' : 'Expand subprocesses',
      });
    }

    return badges;
  }

  /**
   * Extract unified node data for C4 layer elements
   */
  private extractC4NodeData(element: ModelElement, nodeType: NodeType): UnifiedNodeData {
    // Import FieldItem type from FieldList
    type FieldItemType = {
      id: string;
      label: string;
      value: string;
      required?: boolean;
    };

    const items: FieldItemType[] = [];

    // Add description as first field item if present
    const description = (element.properties?.description as string | undefined) || element.description || undefined;
    if (description) {
      items.push({
        id: 'description',
        label: 'Description',
        value: String(description),
        required: false,
      });
    }

    // Add technologies as field item if present (comma-separated)
    if (element.properties?.technology && Array.isArray(element.properties.technology) && element.properties.technology.length > 0) {
      items.push({
        id: 'technologies',
        label: 'Technologies',
        value: (element.properties.technology as string[]).join(', '),
        required: false,
      });
    }

    // Add role for components
    if (nodeType === NodeType.C4_COMPONENT && element.properties?.role) {
      const roleValue = String(element.properties.role);
      items.push({
        id: 'role',
        label: 'Role',
        value: roleValue,
        required: false,
      });
    }

    // Add containerType for containers
    if (nodeType === NodeType.C4_CONTAINER && element.properties?.containerType) {
      const containerTypeValue = String(element.properties.containerType);
      items.push({
        id: 'containerType',
        label: 'Type',
        value: containerTypeValue,
        required: false,
      });
    }

    // Add actorType for external actors
    if (nodeType === NodeType.C4_EXTERNAL_ACTOR && element.properties?.actorType) {
      const actorTypeValue = String(element.properties.actorType);
      items.push({
        id: 'actorType',
        label: 'Type',
        value: actorTypeValue,
        required: false,
      });
    }

    // Add interfaces for components if present
    if (nodeType === NodeType.C4_COMPONENT && element.properties?.interfaces && Array.isArray(element.properties.interfaces) && element.properties.interfaces.length > 0) {
      items.push({
        id: 'interfaces',
        label: 'Interfaces',
        value: (element.properties.interfaces as string[]).join(', '),
        required: false,
      });
    }

    const unifiedData: UnifiedNodeData = {
      nodeType,
      label: element.name || element.id,
      items: items.length > 0 ? items : undefined,
      badges: [],
      detailLevel: ((element as any).detailLevel as 'minimal' | 'standard' | 'detailed' | undefined) || 'standard',
      changesetOperation: (element as any).changesetOperation as 'add' | 'update' | 'delete' | undefined,
      relationshipBadge: (element as any).relationshipBadge,
    } as any;

    return unifiedData;
  }

  /**
   * Create a field item from property data
   * Handles both object and array property formats with consistent structure
   */
  private createFieldItemFromProperty(
    key: string,
    prop: any,
    requiredFields: string[] | undefined
  ): FieldItem {
    const propType = prop?.type || prop?.dataType || 'unknown';
    const description = prop?.description || prop?.tooltip || '';
    const isRequired = Array.isArray(requiredFields) ? requiredFields.includes(key) : false;

    return {
      id: key,
      label: key,
      value: propType,
      required: isRequired,
      tooltip: description ? String(description) : undefined,
    };
  }

  /**
   * Extract unified node data for data layer elements (JSONSchema, DataModel)
   */
  private extractDataNodeData(element: DataLayerModelElement, nodeType: NodeType): UnifiedNodeData {
    const items: FieldItem[] = [];

    // Extract schema properties or model attributes as field items
    // Handle both direct properties and schemaInfo.properties (for JSONSchema)
    const properties = element.properties || element.schemaInfo?.properties || {};
    const requiredFields = element.required || element.schemaInfo?.required;

    // Handle object format (key-value pairs)
    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      Object.entries(properties).forEach(([key, prop]: [string, any]) => {
        if (key.startsWith('_')) return; // Skip internal properties
        items.push(this.createFieldItemFromProperty(key, prop, requiredFields));
      });
    }

    // Handle array format (for some schema definitions)
    if (Array.isArray(properties)) {
      properties.forEach((prop: any) => {
        const propName = prop.name || prop.id || 'unknown';
        items.push(this.createFieldItemFromProperty(propName, prop, requiredFields));
      });
    }

    // Extract badges if available
    const badges = extractBadges(element) || [];

    const unifiedData: UnifiedNodeData = {
      nodeType,
      label: element.name || element.id,
      items: items.length > 0 ? items : undefined,
      badges: badges.length > 0 ? badges : undefined,
      detailLevel: element.detailLevel || 'standard',
      changesetOperation: element.changesetOperation,
      relationshipBadge: element.relationshipBadge,
      // Keep original data for compatibility
      elementId: element.id,
      layerId: element.layerId,
      modelElement: element,
    } as any;

    return unifiedData;
  }

  /**
   * Format field labels (camelCase → Title Case)
   */
  private formatFieldLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Pre-calculate dimensions for all node types
   * CRITICAL: These dimensions MUST match the actual rendered component sizes
   * This ensures dagre layout and React Flow positioning are correct
   */
  private precalculateDimensions(
    model: MetaModel,
    measuredNodeSizes?: Map<string, { width: number; height: number }>
  ): void {
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
          case 'businessService':
          case 'businessFunction':
          case 'businessCapability':
            // Business layer nodes are now handled by unified node type
            // Dimensions will be loaded from nodeConfigLoader in the unified case
            element.visual.size = { width: 180, height: 100 };
            break;

          case 'unified':
            // Unified node type - get dimensions from configuration
            const mappedType = nodeConfigLoader.mapElementType(element.type);
            if (mappedType && mappedType.startsWith('motivation.')) {
              const styleConfig = nodeConfigLoader.getStyleConfig(mappedType);
              if (styleConfig?.dimensions) {
                element.visual.size = {
                  width: styleConfig.dimensions.width,
                  height: styleConfig.dimensions.height,
                };
              } else {
                // Fallback for motivation nodes
                element.visual.size = { width: 180, height: 100 };
              }
            } else if (mappedType && mappedType.startsWith('business.')) {
              // Business layer nodes with configuration
              const styleConfig = nodeConfigLoader.getStyleConfig(mappedType);
              if (styleConfig?.dimensions) {
                element.visual.size = {
                  width: styleConfig.dimensions.width,
                  height: styleConfig.dimensions.height,
                };
              } else {
                // Fallback for business nodes based on type
                const businessFallbackDimensions: Record<string, { width: number; height: number }> = {
                  'business.function': { width: 180, height: 100 },
                  'business.service': { width: 180, height: 90 },
                  'business.capability': { width: 160, height: 70 },
                  'business.process': { width: 200, height: 80 },
                };
                element.visual.size = businessFallbackDimensions[mappedType] || { width: 180, height: 100 };
              }
            } else if (mappedType && mappedType.startsWith('c4.')) {
              // C4 unified nodes use configuration-based dimensions with dynamic height
              const styleConfig = nodeConfigLoader.getStyleConfig(mappedType);
              if (styleConfig?.dimensions) {
                // Calculate height based on field items
                const headerHeight = styleConfig.dimensions.headerHeight || 40;
                const itemHeight = styleConfig.dimensions.itemHeight || 24;

                // Count field items
                let itemCount = 0;
                if (element.properties?.description || element.description) itemCount++;
                if (element.properties?.technology && Array.isArray(element.properties.technology) && element.properties.technology.length > 0) itemCount++;
                if (mappedType === NodeType.C4_COMPONENT && element.properties?.role) itemCount++;
                if (mappedType === NodeType.C4_CONTAINER && element.properties?.containerType) itemCount++;
                if (mappedType === NodeType.C4_EXTERNAL_ACTOR && element.properties?.actorType) itemCount++;
                if (mappedType === NodeType.C4_COMPONENT && element.properties?.interfaces && Array.isArray(element.properties.interfaces) && element.properties.interfaces.length > 0) itemCount++;

                const calculatedHeight = itemCount > 0 ? headerHeight + itemCount * itemHeight : styleConfig.dimensions.height;

                element.visual.size = {
                  width: styleConfig.dimensions.width,
                  height: calculatedHeight,
                };
              } else {
                // Fallback to original C4 node dimensions
                const fallbackDimensions: Record<string, { width: number; height: number }> = {
                  'c4.container': { width: 280, height: 180 },
                  'c4.component': { width: 240, height: 140 },
                  'c4.externalActor': { width: 160, height: 120 },
                };
                element.visual.size = fallbackDimensions[mappedType] || { width: 200, height: 100 };
              }
            } else {
              // Default fallback
              element.visual.size = { width: 180, height: 100 };
            }
            break;

          default:
            // Default fallback dimensions
            element.visual.size = element.visual.size || {
              width: 200,
              height: 100,
            };
            break;
        }

        // Override with DOM-measured sizes from pass 1 (two-pass layout)
        const measured = measuredNodeSizes?.get(`node-${element.id}`);
        if (measured) {
          element.visual.size = { width: measured.width, height: measured.height };
        }
      }
    }
  }

  /**
   * Convert MetaModel to LayoutGraphInput for new layout engines
   * @unused - Reserved for future layout engine integration
   */
  // @ts-ignore - Reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private __modelToGraphInput(model: MetaModel): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Collect all nodes from all layers
    for (const [layerId, layer] of Object.entries(model.layers)) {
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
  // @ts-ignore - Reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private __layoutResultToLayerLayout(result: any, model: MetaModel): any {
    const layers: any = {};

    console.log(`[NodeTransformer] Converting layout result with ${result.nodes.length} nodes to layer layout`);

    // Group nodes by layer
    for (const [layerId, _layer] of Object.entries(model.layers)) {
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
