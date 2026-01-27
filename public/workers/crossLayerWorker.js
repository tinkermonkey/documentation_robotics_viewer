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

/**
 * Safely extracts and validates a reference object
 * @param {*} ref - The reference to validate
 * @param {number} index - The index in the array (for error reporting)
 * @returns {Object|null} Validated reference or null if invalid
 */
function validateAndSanitizeReference(ref, index) {
  try {
    // Check if ref is a valid object
    if (!ref || typeof ref !== 'object') {
      console.warn(`[crossLayerWorker] Skipping invalid reference at index ${index}: not an object`);
      return null;
    }

    // Check for required layer properties
    const sourceLayer = String(ref.sourceLayer || '').trim();
    const targetLayer = String(ref.targetLayer || '').trim();

    if (!sourceLayer || !targetLayer) {
      console.warn(`[crossLayerWorker] Skipping reference at index ${index}: missing or invalid layer information`);
      return null;
    }

    // Only include cross-layer references (different source and target layers)
    if (sourceLayer === targetLayer) {
      return null; // Same layer, skip
    }

    // Check for required ID properties
    const sourceId = String(ref.sourceId || '').trim();
    const targetId = String(ref.targetId || '').trim();

    if (!sourceId || !targetId) {
      console.warn(`[crossLayerWorker] Skipping reference at index ${index}: missing or invalid element IDs`);
      return null;
    }

    // Return sanitized reference
    return {
      sourceId,
      targetId,
      sourceLayer,
      targetLayer,
      relationshipType: String(ref.relationshipType || 'unknown').trim(),
      sourceElementName: String(ref.sourceElementName || '').trim(),
      targetElementName: String(ref.targetElementName || '').trim(),
    };
  } catch (error) {
    console.warn(`[crossLayerWorker] Error validating reference at index ${index}:`, error);
    return null;
  }
}

/**
 * Converts a validated reference to a cross-layer edge
 * @param {Object} ref - The validated reference
 * @returns {Object|null} The edge object or null if conversion fails
 */
function referenceToEdge(ref) {
  try {
    return {
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
    };
  } catch (error) {
    console.warn(`[crossLayerWorker] Error converting reference to edge:`, error);
    return null;
  }
}

self.onmessage = function(e) {
  try {
    // Validate input message structure
    if (!e || !e.data) {
      self.postMessage({
        crossLayerLinks: [],
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
        error: null,
      });
      return;
    }

    if (!Array.isArray(references)) {
      self.postMessage({
        crossLayerLinks: [],
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
        error: null,
      });
      return;
    }

    // Process references with error recovery
    const crossLayerLinks = [];
    let skippedCount = 0;

    for (let i = 0; i < references.length; i++) {
      try {
        const validatedRef = validateAndSanitizeReference(references[i], i);

        if (validatedRef) {
          const edge = referenceToEdge(validatedRef);
          if (edge) {
            crossLayerLinks.push(edge);
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      } catch (error) {
        // Log error but continue processing other references
        console.warn(`[crossLayerWorker] Error processing reference at index ${i}:`, error);
        skippedCount++;
      }
    }

    // Log processing summary if there were skipped items
    if (skippedCount > 0) {
      console.warn(
        `[crossLayerWorker] Processed ${references.length} references, skipped ${skippedCount}, extracted ${crossLayerLinks.length} cross-layer edges`
      );
    }

    // Return successful result
    self.postMessage({
      crossLayerLinks,
      error: null,
    });
  } catch (error) {
    // Catch any unexpected errors in the main processing logic
    self.postMessage({
      crossLayerLinks: [],
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
    error: {
      message: String(message || error?.message || 'Unknown error'),
      type: 'unhandled_error',
      severity: 'critical',
      source: source ? source.split('/').pop() : 'unknown',
      line: lineno,
      column: colno,
    },
  });

  // Return true to prevent the default error handling
  return true;
};
