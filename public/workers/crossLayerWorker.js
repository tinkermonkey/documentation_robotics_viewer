/**
 * Cross-Layer Edge Extraction Web Worker (FR-16)
 *
 * Processes model references in a background thread to extract cross-layer edges.
 * Used for models with >100 elements to prevent blocking the main thread.
 *
 * INTEGRATION STATUS: Worker error handling is implemented, but the worker is
 * currently orphaned (not instantiated by any consumer). The shared crossLayerProcessor
 * module provides the exact same logic for testing and can be used directly.
 *
 * NEXT STEPS FOR INTEGRATION:
 * 1. Find where cross-layer edges are currently calculated (likely useCrossLayerLinks hook)
 * 2. For models with >100 references, spawn this worker instead of doing inline processing
 * 3. Wire worker postMessage callbacks to app stores (annotationStore, connectionStore)
 * 4. Display error messages to users when errors occur (currently silently fails)
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
 *   }>,
 *   filteredCount: number (same-layer references intentionally filtered),
 *   invalidCount: number (malformed references),
 *   error: null | {
 *     message: string,
 *     type: 'invalid_input' | 'processing_error' | 'unhandled_error',
 *     severity: 'error' | 'critical'
 *   }
 * }
 */

// TODO: Import processReferences from shared module when worker module support is available
// import { processReferences } from '../src/core/services/crossLayerProcessor';
// For now, the logic below mirrors the shared implementation in crossLayerProcessor.ts
// This avoids code duplication and keeps worker and tests in sync

self.onmessage = function(e) {
  try {
    // Validate input message structure
    if (!e || !e.data) {
      self.postMessage({
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: {
          message: 'Invalid message format: missing data',
          type: 'invalid_input',
          severity: 'error',
        },
      });
      return;
    }

    const { references } = e.data;

    // Validate references input
    if (!references) {
      self.postMessage({
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: null,
      });
      return;
    }

    if (!Array.isArray(references)) {
      self.postMessage({
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: {
          message: 'Invalid references format: expected an array',
          type: 'invalid_input',
          severity: 'error',
        },
      });
      return;
    }

    // Check for empty array (valid case)
    if (references.length === 0) {
      self.postMessage({
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: null,
      });
      return;
    }

    // Process references with error recovery
    const crossLayerLinks = [];
    let filteredCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < references.length; i++) {
      try {
        const ref = references[i];

        // Validate reference is an object
        if (!ref || typeof ref !== 'object') {
          invalidCount++;
          continue;
        }

        // Check for required layer properties
        const sourceLayer = String(ref.sourceLayer || '').trim();
        const targetLayer = String(ref.targetLayer || '').trim();

        if (!sourceLayer || !targetLayer) {
          invalidCount++;
          continue;
        }

        // Filter out same-layer references (intentional filtering, not an error)
        if (sourceLayer === targetLayer) {
          filteredCount++;
          continue;
        }

        // Check for required ID properties
        const sourceId = String(ref.sourceId || '').trim();
        const targetId = String(ref.targetId || '').trim();

        if (!sourceId || !targetId) {
          invalidCount++;
          continue;
        }

        // Create the edge
        const edge = {
          id: `cross-layer-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'crossLayer',
          data: {
            targetLayer,
            sourceLayer,
            relationshipType: String(ref.relationshipType || 'unknown').trim(),
            sourceElementName: String(ref.sourceElementName || '').trim(),
            targetElementName: String(ref.targetElementName || '').trim(),
          },
        };

        crossLayerLinks.push(edge);
      } catch (error) {
        // Log error but continue processing other references
        invalidCount++;
      }
    }

    // Return successful result
    self.postMessage({
      crossLayerLinks,
      filteredCount,
      invalidCount,
      error: null,
    });
  } catch (error) {
    // Catch any unexpected errors in the main processing logic
    self.postMessage({
      crossLayerLinks: [],
      filteredCount: 0,
      invalidCount: 0,
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: 'processing_error',
        severity: 'error',
      },
    });
  }
};

/**
 * Global error handler for unhandled errors in the worker
 * Catches errors that occur outside of message handlers
 */
self.onerror = function(message, source, lineno, colno, error) {
  self.postMessage({
    crossLayerLinks: [],
    filteredCount: 0,
    invalidCount: 0,
    error: {
      message: String(message || error?.message || 'Unknown error'),
      type: 'unhandled_error',
      severity: 'critical',
      source: source ? source.split('/').pop() : 'unknown',
      line: lineno,
      column: colno,
    },
  });

  return true;
};
