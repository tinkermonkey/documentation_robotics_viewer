/**
 * Cross-Layer Edge Extraction Web Worker (FR-16)
 *
 * Processes model references in a background thread to extract cross-layer edges.
 * Used for models with >100 elements to prevent blocking the main thread.
 *
 * Accepts message:
 * {
 *   references: Array<{
 *     sourceId: string,
 *     targetId: string,
 *     sourceLayer: string,
 *     targetLayer: string,
 *     relationshipType: string,
 *     sourceElementName: string,
 *     targetElementName: string
 *   }>
 * }
 *
 * Posts message:
 * {
 *   crossLayerLinks: Array<{
 *     id: string,
 *     source: string,
 *     target: string,
 *     type: string,
 *     data: {
 *       targetLayer: string,
 *       sourceLayer: string,
 *       relationshipType: string,
 *       sourceElementName: string,
 *       targetElementName: string
 *     }
 *   }>
 * }
 */

self.onmessage = function(e) {
  const { references } = e.data;

  if (!references || !Array.isArray(references)) {
    self.postMessage({ crossLayerLinks: [] });
    return;
  }

  // Extract cross-layer links (different source and target layers)
  const crossLayerLinks = references
    .filter((ref) => {
      // Only include if source and target are in different layers
      return ref.sourceLayer && ref.targetLayer && ref.sourceLayer !== ref.targetLayer;
    })
    .map((ref) => ({
      id: `cross-layer-${ref.sourceId}-${ref.targetId}`,
      source: ref.sourceId,
      target: ref.targetId,
      type: 'crossLayer',
      data: {
        targetLayer: ref.targetLayer,
        sourceLayer: ref.sourceLayer,
        relationshipType: ref.relationshipType,
        sourceElementName: ref.sourceElementName,
        targetElementName: ref.targetElementName,
      },
    }));

  self.postMessage({ crossLayerLinks });
};
