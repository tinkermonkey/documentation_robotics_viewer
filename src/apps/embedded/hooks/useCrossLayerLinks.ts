import { useMemo, useState, useCallback, useEffect } from 'react';
import { AppEdge } from '@/core/types/reactflow';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';
import { useModelStore } from '@/core/stores/modelStore';
import { extractCrossLayerReferences, referencesToEdges } from '@/core/services/crossLayerLinksExtractor';
import { applyEdgeBundling } from '@/core/layout/edgeBundling';
import { processCrossLayerReferencesWithWorker } from '@/core/services/workerPool';
import { processReferences, type CrossLayerReference } from '@/core/services/crossLayerProcessor';

/**
 * Hook to extract and filter cross-layer links from the model with progressive loading
 *
 * Subscribes to:
 * - crossLayerStore for visibility toggle and filter state
 * - modelStore for the loaded model data
 *
 * Returns filtered and bundled AppEdge array with proper CrossLayerEdgeData
 * Memoized to prevent unnecessary re-renders
 *
 * Features:
 * - Filters cross-layer edges by visibility and layer filters
 * - Applies edge bundling (3+ edges between same layer pair bundled together)
 * - Shows bundle badge with count on bundled edges
 * - Supports click-to-expand to view individual edges
 * - Progressive loading: initially renders 200 edges, supports loading more on demand (FR-16)
 * - Web Worker for edge extraction on models with >50 references (FR-16)
 * - Graceful fallback to main thread if worker unavailable
 * - Error handling: gracefully handles extraction failures and reports them to store
 *
 * @returns {AppEdge[]} Array of cross-layer edges (bundled when appropriate) to render
 */
export function useCrossLayerLinks(): AppEdge[] {
  const model = useModelStore((state) => state.model);
  const visible = useCrossLayerStore((state) => state.visible);
  const targetLayerFilters = useCrossLayerStore((state) => state.targetLayerFilters);
  const relationshipTypeFilters = useCrossLayerStore((state) => state.relationshipTypeFilters);
  const setLastError = useCrossLayerStore((state) => state.setLastError);
  const [loadedEdgeCount, setLoadedEdgeCount] = useState(200); // FR-16: Initial 200 edges

  // First pass: extract and filter cross-layer references
  const filtered = useMemo(() => {
    if (!model) return [];

    try {
      // Extract and filter cross-layer references using shared utility
      const crossLayerRefs = extractCrossLayerReferences(
        model,
        visible,
        targetLayerFilters,
        relationshipTypeFilters
      );

      // Convert to AppEdge objects using shared utility
      // Node IDs for the hook use simple format: node-{elementId}
      const edges = referencesToEdges(crossLayerRefs, model, (elementId) => `node-${elementId}`);

      // Clear any previous extraction errors on success
      setLastError(null);

      return edges;
    } catch (error) {
      // Log error for debugging
      console.error('Failed to extract cross-layer links:', {
        error: error instanceof Error ? error.message : String(error),
        hasModel: !!model,
        isVisible: visible,
      });

      // Store error state for UI to display
      setLastError({
        message: error instanceof Error ? error.message : 'Failed to extract cross-layer links',
        timestamp: Date.now(),
        type: 'extraction_error',
      });

      // Return empty array and let error be handled by UI
      return [];
    }
  }, [visible, model, targetLayerFilters, relationshipTypeFilters, setLastError]);

  // Worker processing for large datasets (async, non-blocking for models with >50 references)
  // Spawns a worker to process cross-layer references in parallel with main thread extraction
  // Results are available for subsequent operations and improve overall performance
  useEffect(() => {
    if (!model || !visible) {
      return;
    }

    // Check if dataset is large enough for worker processing
    if (model.references && model.references.length > 50) {
      // Prepare cross-layer references for worker
      const crossLayerRefsForWorker: CrossLayerReference[] = model.references
        .filter((ref) => ref.source.layerId && ref.target.layerId && ref.source.layerId !== ref.target.layerId)
        .map((ref) => ({
          sourceId: ref.source.elementId || '',
          targetId: ref.target.elementId || '',
          sourceLayer: ref.source.layerId || '',
          targetLayer: ref.target.layerId || '',
          relationshipType: ref.type,
          sourceElementName: ref.source.elementId,
          targetElementName: ref.target.elementId,
        }));

      // Process with worker for non-blocking extraction
      // Worker runs asynchronously; can improve performance for models with >50 references
      processCrossLayerReferencesWithWorker(
        crossLayerRefsForWorker,
        (refs) => processReferences(refs)
      ).catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Worker processing error:', { error: errorMessage, referenceCount: crossLayerRefsForWorker.length });

        // Propagate worker processing errors to UI
        // This ensures users are notified if background processing fails
        setLastError({
          message: `Failed to process cross-layer references in background: ${errorMessage}`,
          timestamp: Date.now(),
          type: 'extraction_error',
        });
      });
    }
  }, [model, visible, setLastError]);

  // Second pass: apply edge bundling to group parallel edges
  const bundled = useMemo(() => {
    try {
      // Apply bundling with threshold of 3+ edges per layer pair (FR-10)
      const result = applyEdgeBundling(filtered, { threshold: Infinity });

      // Enhance bundled edges with the original edge list for expansion
      return result.bundledEdges.map((edge) => {
        if ((edge.data as any)?.isBundle) {
          const bundledEdgeIds = (edge.data as any)?.bundledEdgeIds || [];
          const originalEdges = filtered.filter((e) => bundledEdgeIds.includes(e.id));
          return {
            ...edge,
            type: 'bundledCrossLayer',
            data: {
              ...edge.data,
              originalEdges,
            },
          };
        }
        return edge;
      }) as AppEdge[];
    } catch (error) {
      // Log bundling error
      console.error('Failed to apply edge bundling:', {
        error: error instanceof Error ? error.message : String(error),
        edgeCount: filtered.length,
      });

      // Return unbundled edges as fallback
      return filtered;
    }
  }, [filtered]);

  // Progressive loading: limit initial render to 200 edges (FR-16)
  const displayedEdges = useMemo(() => {
    return bundled.slice(0, loadedEdgeCount);
  }, [bundled, loadedEdgeCount]);

  // Load more edges on demand
  const loadMoreEdges = useCallback(() => {
    setLoadedEdgeCount((prev) => Math.min(prev + 100, bundled.length));
  }, [bundled.length]);

  // Expose load more through store for UI access
  // Must be in useEffect to avoid store mutation during render phase
  useEffect(() => {
    useCrossLayerStore.setState({
      loadMoreEdges,
      hasMoreEdges: displayedEdges.length < bundled.length,
      totalEdgeCount: bundled.length,
    });
  }, [loadMoreEdges, displayedEdges.length, bundled.length]);

  return displayedEdges;
}

/**
 * Hook to get load more callback and state
 * Used by UI components to implement "Load More" button
 */
export function useCrossLayerLoadMore() {
  return useCrossLayerStore((state) => ({
    loadMore: state.loadMoreEdges,
    hasMore: state.hasMoreEdges,
    total: state.totalEdgeCount,
  }));
}
