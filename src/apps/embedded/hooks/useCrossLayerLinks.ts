import { useMemo } from 'react';
import { AppEdge } from '@/core/types/reactflow';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { useModelStore } from '@/core/stores/modelStore';
import { extractCrossLayerReferences, referencesToEdges } from '@/core/services/crossLayerLinksExtractor';

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
    if (!model) return [];

    // Extract and filter cross-layer references using shared utility
    const crossLayerRefs = extractCrossLayerReferences(
      model,
      visible,
      targetLayerFilters,
      relationshipTypeFilters
    );

    // Convert to AppEdge objects using shared utility
    // Node IDs for the hook use simple format: node-{elementId}
    return referencesToEdges(model, crossLayerRefs, (elementId) => `node-${elementId}`);
  }, [visible, model, targetLayerFilters, relationshipTypeFilters]);
}
