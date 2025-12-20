/**
 * Vertical Layer Layout Engine
 * Arranges layers in a vertical stack with internal dagre-based layout
 */

import dagre from 'dagre';
import { Layer, LayerType } from '../types';
import { LayoutResult } from '../types/shapes';
import { getLayerColor } from '../utils/layerColors';

/**
 * Layout engine for vertically stacking layers
 * Each layer is internally laid out using dagre, then stacked vertically
 */
export class VerticalLayerLayout {
  /**
   * Define the vertical order of layers (top to bottom)
   */
  private layerOrder: string[] = [
    LayerType.Motivation,
    LayerType.Business,
    LayerType.Security,
    LayerType.Application,
    LayerType.Technology,
    LayerType.Api,
    LayerType.DataModel,
    LayerType.Datastore,
    LayerType.Ux,
    LayerType.Navigation,
    LayerType.ApmObservability,
    LayerType.FederatedArchitecture
  ];

  /**
   * Spacing between layers in pixels
   * Increased to 200px to accommodate schema elements with expandable sections
   */
  private layerSpacing = 200;

/**
 * Layout all layers vertically
 * @param layers - Record of layers keyed by LayerType
 * @returns Complete layout result with positions and metadata
 */
layout(layers: Record<string, Layer>): LayoutResult {
  const result: LayoutResult = {
    layers: {},
    totalHeight: 0,
    totalWidth: 0
  };

  console.log('[VerticalLayerLayout] Layout called with layers:', Object.keys(layers));

  // Build the actual layer order from the layers that exist, falling back to predefined order for missing ones
  const actualLayerOrder = this.buildLayerOrder(layers);
  console.log('[VerticalLayerLayout] Actual layer order:', actualLayerOrder);

  let currentY = 0;

  // Process each layer in order
  for (const layerType of actualLayerOrder) {
    const layer = layers[layerType];

    console.log(`[VerticalLayerLayout] Processing layer ${layerType}:`, {
      exists: !!layer,
      hasElements: layer ? !!layer.elements : false,
      elementCount: layer?.elements?.length || 0
    });

    // Skip if layer doesn't exist, has no elements array, or is empty
    if (!layer || !layer.elements || !Array.isArray(layer.elements) || layer.elements.length === 0) {
      continue;
    }

      // Layout elements within this layer
      const layerLayout = this.layoutLayer(layer);

      // Store the layout result for this layer
      result.layers[layerType] = {
        yOffset: currentY,
        positions: layerLayout.positions,
        bounds: layerLayout.bounds,
        color: getLayerColor(layerType, 'primary'),
        name: layerType
      };

      // Update vertical offset for next layer
      currentY += layerLayout.bounds.height + this.layerSpacing;

      // Track maximum width
      result.totalWidth = Math.max(result.totalWidth, layerLayout.bounds.width);
    }

    result.totalHeight = currentY - this.layerSpacing; // Remove last spacing

    return result;
  }

  /**
   * Layout elements within a single layer using dagre
   * @param layer - The layer to layout
   * @returns Positions and bounds for the layer
   */
  private layoutLayer(layer: Layer): {
    positions: Record<string, { x: number; y: number }>;
    bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  } {
    // Create dagre graph
    const g = new dagre.graphlib.Graph();

    // Configure graph for top-to-bottom layout
    // TB rankdir arranges nodes horizontally within each rank (row)
    g.setGraph({
      rankdir: 'TB',    // Top to bottom - creates horizontal rows
      nodesep: 80,      // Horizontal spacing between nodes in the same rank
      ranksep: 150,     // Vertical spacing between ranks (rows)
      marginx: 30,
      marginy: 30,
      align: 'UL',      // Align to upper-left for consistent layout
      ranker: 'tight-tree'  // Use tight-tree ranker for compact layout
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes (elements) to the graph
    layer.elements.forEach(element => {
      g.setNode(element.id, {
        width: element.visual.size.width,
        height: element.visual.size.height,
        label: element.name
      });
    });

    // Add edges (relationships) to the graph
    layer.relationships.forEach(relationship => {
      g.setEdge(relationship.sourceId, relationship.targetId, {
        label: relationship.type
      });
    });

    // Run dagre layout algorithm
    dagre.layout(g);

    // Extract positions from dagre results
    const positions: Record<string, { x: number; y: number }> = {};
    const bounds = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    };

    g.nodes().forEach(nodeId => {
      const node = g.node(nodeId);

      // Safety check: skip if node is undefined
      if (!node) {
        console.warn(`Layout: Node ${nodeId} is undefined in dagre graph, skipping`);
        return;
      }

      // Dagre gives center positions, store them as-is
      positions[nodeId] = {
        x: node.x,
        y: node.y
      };

      // Update bounds to include full node extent
      const halfWidth = node.width / 2;
      const halfHeight = node.height / 2;
      bounds.minX = Math.min(bounds.minX, node.x - halfWidth);
      bounds.maxX = Math.max(bounds.maxX, node.x + halfWidth);
      bounds.minY = Math.min(bounds.minY, node.y - halfHeight);
      bounds.maxY = Math.max(bounds.maxY, node.y + halfHeight);
    });

    // Calculate final dimensions
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    return {
      positions,
      bounds: {
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        width: Math.max(width, 0),
        height: Math.max(height, 0)
      }
    };
  }


  /**
   * Get the configured layer order
   */
  getLayerOrder(): string[] {
    return [...this.layerOrder];
  }

  /**
   * Set custom layer order
   * @param order - Array of layer type strings
   */
  setLayerOrder(order: string[]): void {
    this.layerOrder = order;
  }

  /**
   * Build the actual layer order from the layers provided, maintaining the predefined order
   * Uses actual layer IDs from the model (lowercase) that match the keys in the layers record
   */
  private buildLayerOrder(layers: Record<string, Layer>): string[] {
    const layerKeys = Object.keys(layers);
    
    // Predefined order of layer types (original lowercase API IDs)
    const preferredOrder = [
      'motivation',
      'business',
      'security',
      'application',
      'technology',
      'api',
      'data_model',
      'datastore',
      'ux',
      'navigation',
      'apm',
      'apm_observability',
      'federated_architecture'
    ];

    // Sort layer keys according to preferred order
    const result = layerKeys.sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.toLowerCase());
      const bIndex = preferredOrder.indexOf(b.toLowerCase());
      
      // If in preferred order, use that; otherwise keep original order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });

    return result;
  }

  /**
   * Get the spacing between layers
   */
  getLayerSpacing(): number {
    return this.layerSpacing;
  }

  /**
   * Set the spacing between layers
   * @param spacing - Spacing in pixels
   */
  setLayerSpacing(spacing: number): void {
    this.layerSpacing = spacing;
  }
}
