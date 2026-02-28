/**
 * Vertical Layer Layout Engine
 * Arranges layers in a vertical stack with internal grid-based layout
 */

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
   * Layout elements within a single layer using a simple row-based grid
   * @param layer - The layer to layout
   * @returns Positions and bounds for the layer
   */
  private layoutLayer(layer: Layer): {
    positions: Record<string, { x: number; y: number }>;
    bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  } {
    const nodesep = 80;
    const ranksep = 150;
    const marginx = 30;
    const marginy = 30;
    const maxRowWidth = 1800;

    const positions: Record<string, { x: number; y: number }> = {};
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

    let curX = marginx;
    let curY = marginy;
    let rowMaxHeight = 0;

    for (const element of layer.elements) {
      const w = element.visual?.size?.width;
      const h = element.visual?.size?.height;
      const width = (typeof w === 'number' && !isNaN(w) && w > 0) ? w : 200;
      const height = (typeof h === 'number' && !isNaN(h) && h > 0) ? h : 100;

      if (curX > marginx && curX + width > maxRowWidth) {
        curX = marginx;
        curY += rowMaxHeight + ranksep;
        rowMaxHeight = 0;
      }

      const cx = curX + width / 2;
      const cy = curY + height / 2;
      positions[element.id] = { x: cx, y: cy };

      bounds.minX = Math.min(bounds.minX, cx - width / 2);
      bounds.maxX = Math.max(bounds.maxX, cx + width / 2);
      bounds.minY = Math.min(bounds.minY, cy - height / 2);
      bounds.maxY = Math.max(bounds.maxY, cy + height / 2);

      curX += width + nodesep;
      rowMaxHeight = Math.max(rowMaxHeight, height);
    }

    const hasValidBounds = bounds.minX !== Infinity;

    return {
      positions,
      bounds: {
        minX: hasValidBounds ? bounds.minX : 0,
        minY: hasValidBounds ? bounds.minY : 0,
        maxX: hasValidBounds ? bounds.maxX : 0,
        maxY: hasValidBounds ? bounds.maxY : 0,
        width: hasValidBounds ? bounds.maxX - bounds.minX : 0,
        height: hasValidBounds ? bounds.maxY - bounds.minY : 0,
      },
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
