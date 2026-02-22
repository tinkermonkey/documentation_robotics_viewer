/**
 * Pure function to extract and filter cross-layer links from a model
 * This logic is separated from React hooks for better testability
 */

import { MetaModel, Reference, ReferenceType } from '@/core/types/model';
import { LayerType } from '@/core/types/layers';
import { AppEdge, createCrossLayerEdgeData } from '@/core/types/reactflow';
import { MarkerType } from '@xyflow/react';
import { FALLBACK_COLOR, normalizeLayerKey } from '@/core/utils/layerColors';

/**
 * Extract cross-layer references from model, applying visibility and filter constraints
 * @param model - The loaded model data
 * @param visible - Whether cross-layer links should be shown
 * @param targetLayerFilters - Set of target layers to include (empty = all)
 * @param relationshipTypeFilters - Set of relationship types to include (empty = all)
 * @returns Array of filtered cross-layer references
 */
export function extractCrossLayerReferences(
  model: MetaModel | null,
  visible: boolean,
  targetLayerFilters: Set<LayerType>,
  relationshipTypeFilters: Set<ReferenceType>
): Reference[] {
  if (!visible || !model?.references) return [];

  // Extract cross-layer references from model.references
  // Filter out references within the same layer
  let crossLayerRefs = model.references.filter(
    (ref) => ref.source.layerId && ref.target.layerId && ref.source.layerId !== ref.target.layerId
  );

  // Apply target layer filters
  if (targetLayerFilters.size > 0) {
    crossLayerRefs = crossLayerRefs.filter((ref) => {
      if (!ref.target.layerId) return false;
      const normalizedLayerId = normalizeLayerKey(ref.target.layerId);
      return normalizedLayerId && targetLayerFilters.has(normalizedLayerId);
    });
  }

  // Apply relationship type filters
  if (relationshipTypeFilters.size > 0) {
    crossLayerRefs = crossLayerRefs.filter((ref) => relationshipTypeFilters.has(ref.type));
  }

  return crossLayerRefs;
}

/**
 * Convert a reference to a React Flow edge object
 * @param reference - The reference to convert
 * @param index - Index for unique ID generation
 * @param model - The model containing element information
 * @param nodeIdResolver - Function to resolve element ID to node ID (handles nodeMap lookups)
 * @returns The edge object or null if validation fails
 */
export function referenceToEdge(
  reference: Reference,
  index: number,
  model: MetaModel,
  nodeIdResolver: (elementId: string) => string | undefined
): AppEdge | null {
  // Skip if we don't have element IDs or layer IDs
  if (!reference.source.elementId || !reference.target.elementId) return null;
  if (!reference.source.layerId || !reference.target.layerId) return null;

  // Normalize layer IDs to LayerType enum
  const sourceLayer = normalizeLayerKey(reference.source.layerId);
  const targetLayer = normalizeLayerKey(reference.target.layerId);

  // Skip if layers cannot be normalized to valid LayerType values
  if (!sourceLayer || !targetLayer) return null;

  // Resolve node IDs (handles both direct format and nodeMap lookups)
  const sourceNodeId = nodeIdResolver(reference.source.elementId);
  const targetNodeId = nodeIdResolver(reference.target.elementId);

  if (!sourceNodeId || !targetNodeId) return null;

  // Get element names for breadcrumb/tooltip display
  const sourceElement = model.layers[reference.source.layerId]?.elements.find((e) => e.id === reference.source.elementId);
  const targetElement = model.layers[reference.target.layerId]?.elements.find((e) => e.id === reference.target.elementId);

  // Create edge data using factory function with validation
  let edgeData;
  try {
    edgeData = createCrossLayerEdgeData(
      sourceLayer,
      targetLayer,
      reference.type,
      {
        sourceElementName: sourceElement?.name || reference.source.elementId,
        targetElementName: targetElement?.name || reference.target.elementId,
      }
    );
  } catch (error) {
    // Skip edges that fail validation (e.g., same source and target layer)
    console.warn('Failed to create cross-layer edge:', {
      error: error instanceof Error ? error.message : String(error),
      sourceLayer,
      targetLayer,
    });
    return null;
  }

  return {
    id: `edge-ref-${reference.source.elementId}-${reference.target.elementId}-${index}`,
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
    data: edgeData,
  } as AppEdge;
}

/**
 * Convert filtered references to React Flow edges
 * @param references - Array of filtered references
 * @param model - The model containing element information
 * @param nodeIdResolver - Function to resolve element ID to node ID
 * @returns Array of edge objects
 */
export function referencesToEdges(
  references: Reference[],
  model: MetaModel,
  nodeIdResolver: (elementId: string) => string | undefined
): AppEdge[] {
  return references
    .map((ref, index) => referenceToEdge(ref, index, model, nodeIdResolver))
    .filter((edge): edge is AppEdge => edge !== null);
}
