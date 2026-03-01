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
        const node: AppNode = {
          id: nodeId,
          type: 'unified' as const,
          position: { x: topLeftX, y: topLeftY },
          data: this.extractNodeData(element, nodeType, layerType),
          width: element.visual.size.width,
          height: element.visual.size.height,
          style: { zIndex: 1 }, // Above layer containers (which have zIndex: -1)
        } as AppNode;

        nodes.push(node);
      }
    }

    // STEP 3: Create edges array
    const edges: AppEdge[] = [];
    const edgeIdSet = new Set<string>(); // Track edge IDs to prevent duplicates
    let relationshipCount = 0;

    // Create edges from layer relationships
    for (const layer of Object.values(model.layers)) {
      relationshipCount += layer.relationships.length;
      for (const relationship of layer.relationships) {
        const edge = this.createEdge(relationship, nodeMap);
        if (edge) {
          this.addEdgeIfUnique(edge, edges, edgeIdSet, 'layer relationship');
        }
      }
    }
    console.log(`[NodeTransformer] Processed ${relationshipCount} relationships`);

    // Create edges from cross-layer references using shared utility
    const crossLayerReferences = extractCrossLayerReferences(model, true, new Set(), new Set());
    const crossLayerEdges = referencesToEdges(crossLayerReferences, model, (elementId) => nodeMap.get(elementId));

    // Apply edge bundling to reduce visual clutter in dense cross-layer graphs
    const threshold = calculateOptimalThreshold(nodes.length, crossLayerEdges.length);
    const { bundledEdges } = applyEdgeBundling(crossLayerEdges as Edge[], { threshold });

    // Add bundled edges while checking for duplicates
    for (const edge of bundledEdges as AppEdge[]) {
      this.addEdgeIfUnique(edge, edges, edgeIdSet, 'bundled cross-layer reference');
    }

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
   * Add an edge to the edges array if it hasn't been seen before
   * Uses edgeIdSet to track duplicates and logs warnings for skipped edges
   * @param edge - The edge to potentially add
   * @param edges - The edges array to add to
   * @param edgeIdSet - Set tracking edge IDs that have been added
   * @param source - Description of where the edge came from (for logging)
   */
  private addEdgeIfUnique(
    edge: AppEdge,
    edges: AppEdge[],
    edgeIdSet: Set<string>,
    source: string
  ): void {
    if (!edgeIdSet.has(edge.id)) {
      edges.push(edge);
      edgeIdSet.add(edge.id);
    } else {
      console.warn(
        `[NodeTransformer] Skipped duplicate edge ID: ${edge.id} (source: ${source})`
      );
    }
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
   * Get node type for an element.
   * Uses specNodeId when available (new API path), falls back to type mapping.
   */
  private getNodeTypeForElement(element: ModelElement): string {
    if (element.type === 'LayerContainer' || element.type === 'layer-container') {
      return 'layerContainer';
    }

    if (element.specNodeId) {
      if (!nodeConfigLoader.getStyleConfig(element.specNodeId as NodeType)) {
        throw new Error(
          `[NodeTransformer] No style config for specNodeId "${element.specNodeId}" on element ${element.id}`
        );
      }
      return 'unified';
    }

    // Fallback: map element.type via typeMap (legacy path used by tests and changeset builder)
    const mappedType = nodeConfigLoader.mapElementType(element.type);
    if (!mappedType) {
      throw new Error(
        `[NodeTransformer] Cannot map element type "${element.type}" to NodeType enum. ` +
        `Add a mapping in nodeConfig.json typeMap section. Element ID: ${element.id}`
      );
    }
    return 'unified';
  }

  /**
   * Extract node data — unified for all element types.
   * Uses specNodeId when available; falls back to type mapping for legacy elements.
   */
  private extractNodeData(element: ModelElement, _nodeType: string, layerId: string): UnifiedNodeData {
    // getNodeTypeForElement already validated that one of these resolves — no third fallback needed
    const specNodeId = element.specNodeId ?? nodeConfigLoader.mapElementType(element.type) ?? element.type as NodeType;

    return {
      nodeType: specNodeId as NodeType,
      label: element.name || element.id,
      layerId,
      elementId: element.id,
      items: this.extractFieldItems(element),
      badges: this.extractBadges(element, specNodeId),
      detailLevel: element.detailLevel ?? 'standard',
      changesetOperation: element.changesetOperation,
      relationshipBadge: element.relationshipBadge,
    };
  }

  /**
   * Extract field items from element attributes or properties
   */
  private extractFieldItems(element: ModelElement): FieldItem[] | undefined {
    if (!element.properties || typeof element.properties !== 'object') {
      return undefined;
    }

    const items: FieldItem[] = [];

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
   * Extract badges for an element, switching on specNodeId for type-specific logic
   */
  private extractBadges(element: ModelElement, specNodeId: string): UnifiedNodeData['badges'] {
    const badges: UnifiedNodeData['badges'] = [];
    const props: Record<string, unknown> = element.properties || {};

    // ── Motivation badges ──────────────────────────────────────────────────────
    switch (specNodeId) {
      case NodeType.MOTIVATION_STAKEHOLDER:
        if (props.stakeholderType) {
          const stakeholderType = this.validateString(props.stakeholderType);
          if (stakeholderType !== undefined) {
            badges.push({ position: 'inline', content: stakeholderType, ariaLabel: `Type: ${stakeholderType}` });
          }
        }
        break;

      case NodeType.MOTIVATION_GOAL:
        if (props.priority) {
          badges.push({ position: 'top-right', content: `${props.priority}`, ariaLabel: `Priority: ${props.priority}` });
        }
        break;

      case NodeType.MOTIVATION_REQUIREMENT:
        if (props.status) {
          badges.push({ position: 'top-left', content: props.status === 'satisfied' ? '✓' : '○', ariaLabel: `Status: ${props.status}` });
        }
        break;

      case NodeType.MOTIVATION_DRIVER:
        if (props.category) {
          const category = this.validateString(props.category);
          if (category !== undefined) {
            badges.push({ position: 'top-right', content: category, ariaLabel: `Category: ${category}` });
          }
        }
        break;

      case NodeType.MOTIVATION_OUTCOME:
        if (props.status) {
          const status = this.validateString(props.status);
          if (status !== undefined) {
            badges.push({ position: 'top-right', content: status, ariaLabel: `Status: ${status}` });
          }
        }
        break;

      case NodeType.MOTIVATION_CONSTRAINT:
        if (props.negotiability) {
          const negotiability = this.validateString(props.negotiability);
          if (negotiability !== undefined) {
            badges.push({ position: 'top-right', content: negotiability, ariaLabel: `Negotiability: ${negotiability}` });
          }
        }
        break;

      case NodeType.MOTIVATION_ASSESSMENT:
        if (props.rating) {
          badges.push({ position: 'top-right', content: `${props.rating}/5`, ariaLabel: `Rating: ${props.rating} out of 5` });
        }
        break;
    }

    // ── Business badges (apply to all business.* types) ────────────────────────
    if (specNodeId.startsWith('business.')) {
      if (props.owner) {
        const owner = this.validateString(props.owner);
        if (owner !== undefined) {
          badges.push({ position: 'inline', content: owner, ariaLabel: `Owner: ${owner}` });
        }
      }

      if (props.criticality) {
        const criticality = String(props.criticality);
        const criticityColorClasses: Record<string, string> = {
          'high': 'bg-red-100 text-red-900',
          'medium': 'bg-orange-100 text-orange-900',
          'low': 'bg-green-100 text-green-900',
        };
        badges.push({
          position: 'inline',
          content: criticality,
          className: criticityColorClasses[criticality] || 'bg-gray-100 text-gray-900',
          ariaLabel: `Criticality: ${criticality}`,
        });
      }

      if ((specNodeId === NodeType.BUSINESS_FUNCTION || specNodeId === NodeType.BUSINESS_SERVICE) && props.domain) {
        const domain = this.validateString(props.domain);
        if (domain !== undefined) {
          badges.push({ position: 'inline', content: domain, ariaLabel: `Domain: ${domain}` });
        }
      }

      if (specNodeId === NodeType.BUSINESS_PROCESS) {
        const subprocessCount = props.subprocessCount ? Number(props.subprocessCount) : 0;
        if (subprocessCount > 0) {
          const expanded = this.validateBoolean(props.expanded) ?? false;
          badges.push({
            position: 'top-right',
            content: expanded ? '▼' : '▶',
            className: 'cursor-pointer text-lg leading-none',
            ariaLabel: expanded ? 'Collapse subprocesses' : 'Expand subprocesses',
          });
        }
      }
    }

    return badges;
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
   * Pre-calculate dimensions for all node types from JSON configuration.
   * CRITICAL: These dimensions MUST match the actual rendered component sizes
   * This ensures dagre layout and React Flow positioning are correct.
   * Reads all dimensions from nodeConfig.json via nodeConfigLoader.
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

        // Resolve NodeType: prefer specNodeId (new API path), fall back to typeMap
        const mappedType = element.specNodeId
          ? (element.specNodeId as NodeType)
          : nodeConfigLoader.mapElementType(element.type);

        if (!mappedType) {
          // Warning already logged by nodeConfigLoader.mapElementType()
          element.visual.size = { width: 180, height: 100 };
        } else {
          // Get style config from JSON
          const styleConfig = nodeConfigLoader.getStyleConfig(mappedType);

          if (!styleConfig) {
            console.warn(`[NodeTransformer] No style config found for NodeType: ${mappedType}`);
            element.visual.size = { width: 180, height: 100 };
          } else {
            const { dimensions } = styleConfig;

            // Base dimensions from config
            let width = dimensions.width;
            let height = dimensions.height;

            // Dynamic height calculation for nodes with field lists
            if (element.properties) {
              // Count only properties that will actually be rendered in field list
              // (excluding null/undefined values and internal properties starting with _)
              const fieldItems = Object.entries(element.properties)
                .filter(([key, value]) => value !== null && value !== undefined && !key.startsWith('_'))
                .length;

              if (fieldItems > 0) {
                const headerHeight = dimensions.headerHeight || 40;
                const itemHeight = dimensions.itemHeight || 24;
                height = headerHeight + fieldItems * itemHeight;
              }
            }

            element.visual.size = { width, height };
          }
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
   * Validate that a value is a boolean, return it or undefined
   */
  private validateBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  /**
   * Validate that a value is a string, return it or undefined
   */
  private validateString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

}
