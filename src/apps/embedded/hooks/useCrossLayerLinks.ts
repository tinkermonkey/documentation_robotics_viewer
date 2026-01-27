import { useMemo } from 'react';
import { AppEdge } from '@/core/types/reactflow';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { useModelStore } from '@/core/stores/modelStore';
import { MarkerType } from '@xyflow/react';
import { FALLBACK_COLOR } from '@/core/utils/layerColors';

/**
 * Hook to extract and filter cross-layer links from the model
 *
 * Subscribes to:
 * - crossLayerStore for visibility toggle and filter state
 * - modelStore for the loaded model data
 *
 * Returns filtered AppEdge array with proper CrossLayerEdgeData
 * Memoized to prevent unnecessary re-renders
 *
 * @returns {AppEdge[]} Array of cross-layer edges to render
 */
export function useCrossLayerLinks(): AppEdge[] {
  const model = useModelStore((state) => state.model);
  const visible = useCrossLayerStore((state) => state.visible);
  const targetLayerFilters = useCrossLayerStore((state) => state.targetLayerFilters);
  const relationshipTypeFilters = useCrossLayerStore((state) => state.relationshipTypeFilters);

  return useMemo(() => {
    if (!visible || !model?.references) return [];

    // Extract cross-layer references from model.references
    // Filter out references within the same layer
    let crossLayerRefs = model.references.filter(
      (ref) => ref.source.layerId && ref.target.layerId && ref.source.layerId !== ref.target.layerId
    );

    // Apply target layer filters
    if (targetLayerFilters.size > 0) {
      crossLayerRefs = crossLayerRefs.filter((ref) =>
        ref.target.layerId && targetLayerFilters.has(ref.target.layerId as any)
      );
    }

    // Apply relationship type filters
    if (relationshipTypeFilters.size > 0) {
      crossLayerRefs = crossLayerRefs.filter((ref) =>
        relationshipTypeFilters.has(ref.type)
      );
    }

    // Convert to AppEdge objects
    return crossLayerRefs
      .map((ref, index) => {
        // Skip if we don't have element IDs
        if (!ref.source.elementId || !ref.target.elementId) return null;

        // Get element names for breadcrumb/tooltip display
        const sourceElement = ref.source.layerId
          ? model.layers[ref.source.layerId]?.elements.find((e) => e.id === ref.source.elementId)
          : undefined;
        const targetElement = ref.target.layerId
          ? model.layers[ref.target.layerId]?.elements.find((e) => e.id === ref.target.elementId)
          : undefined;

        // Create node IDs matching the format in nodeTransformer
        const sourceNodeId = `node-${ref.source.elementId}`;
        const targetNodeId = `node-${ref.target.elementId}`;

        return {
          id: `edge-ref-${ref.source.elementId}-${ref.target.elementId}-${index}`,
          source: sourceNodeId,
          target: targetNodeId,
          type: 'crossLayer',
          label: ref.type,
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
            targetLayer: ref.target.layerId,
            relationshipType: ref.type,
            sourceElementName: sourceElement?.name || ref.source.elementId,
            targetElementName: targetElement?.name || ref.target.elementId,
          },
        } as AppEdge;
      })
      .filter((edge): edge is AppEdge => edge !== null);
  }, [visible, model, targetLayerFilters, relationshipTypeFilters]);
}
