/**
 * Cross-layer reference processing utilities
 * Shared logic between web worker, tests, and main thread processing
 *
 * INTEGRATION STATUS: ✅ INTEGRATED
 * This module provides the core logic for cross-layer edge extraction. It's used by:
 *
 * Usage:
 * 1. Tests: tests/unit/crossLayerWorker.spec.ts
 *    - Unit tests verify error handling and validation
 *
 * 2. Web Worker: public/workers/crossLayerWorker.js
 *    - Mirrors this logic for background thread processing
 *    - Spawned by workerPool.ts for models with >50 elements
 *
 * 3. Main Thread Fallback: src/core/services/workerPool.ts
 *    - Called when worker unavailable or dataset is small
 *    - Provides synchronous processing on main thread
 *
 * 4. Tests: tests/integration/crossLayerErrorHandling.spec.ts
 *    - Integration tests verify error recovery scenarios
 *
 * Implementation: The processReferences function is exported for fallback processing
 * when the web worker is unavailable or the dataset is small enough that worker
 * overhead wouldn't benefit performance.
 */

import { LayerType, ReferenceType } from '../types';

export interface CrossLayerReference {
  sourceId: string;
  targetId: string;
  sourceLayer: LayerType;
  targetLayer: LayerType;
  relationshipType?: ReferenceType;
  sourceElementName?: string;
  targetElementName?: string;
}

export interface CrossLayerEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: {
    targetLayer: LayerType;
    sourceLayer: LayerType;
    relationshipType: ReferenceType;
    sourceElementName: string;
    targetElementName: string;
  };
}

export interface ProcessResult {
  crossLayerLinks: CrossLayerEdge[];
  filteredCount: number;
  invalidCount: number;
  error: null | {
    message: string;
    type: string;
    severity: string;
  };
}

const DEBUG = false; // Set to true for console logging in production

function debug(message: string, ...args: any[]) {
  if (DEBUG) {
    console.warn(`[crossLayerProcessor] ${message}`, ...args);
  }
}

/**
 * Helper to convert layer name strings to LayerType enum
 * Supports both lowercase (business) and PascalCase (Business) formats
 */
function normalizeLayerType(layerStr: string): LayerType | null {
  if (!layerStr) return null;

  // Try exact match first
  if (Object.values(LayerType).includes(layerStr as LayerType)) {
    return layerStr as LayerType;
  }

  // Try case-insensitive match by capitalizing first letter
  const normalized = layerStr.charAt(0).toUpperCase() + layerStr.slice(1).toLowerCase();
  if (Object.values(LayerType).includes(normalized as LayerType)) {
    return normalized as LayerType;
  }

  // Handle special cases for multi-word layer names
  const layerMap: Record<string, LayerType> = {
    'data-model': LayerType.DataModel,
    'datamodel': LayerType.DataModel,
    'apm': LayerType.ApmObservability,
    'observability': LayerType.ApmObservability,
    'federated-architecture': LayerType.FederatedArchitecture,
    'federatedarchitecture': LayerType.FederatedArchitecture,
  };

  const lowerStr = layerStr.toLowerCase();
  return layerMap[lowerStr] ?? null;
}

/**
 * Safely extracts and validates a reference object
 * Returns null if invalid, { filtered: true } if intentionally filtered (same layer)
 */
export function validateAndSanitizeReference(
  ref: unknown,
  index: number
): CrossLayerReference | null | { filtered: boolean } {
  try {
    // Check if ref is a valid object
    if (!ref || typeof ref !== 'object') {
      debug(`Skipping invalid reference at index ${index}: not an object`);
      return null;
    }

    // Check for required layer properties
    const sourceLayerStr = String((ref as any).sourceLayer || '').trim();
    const targetLayerStr = String((ref as any).targetLayer || '').trim();

    if (!sourceLayerStr || !targetLayerStr) {
      debug(
        `Skipping reference at index ${index}: missing or invalid layer information`
      );
      return null;
    }

    // Normalize and validate layer types
    const sourceLayer = normalizeLayerType(sourceLayerStr);
    const targetLayer = normalizeLayerType(targetLayerStr);

    if (!sourceLayer) {
      debug(`Skipping reference at index ${index}: invalid source layer type "${sourceLayerStr}"`);
      return null;
    }

    if (!targetLayer) {
      debug(`Skipping reference at index ${index}: invalid target layer type "${targetLayerStr}"`);
      return null;
    }

    // Only include cross-layer references (different source and target layers)
    if (sourceLayer === targetLayer) {
      debug(`Filtering same-layer reference at index ${index}`);
      return { filtered: true }; // Intentionally filtered, not an error
    }

    // Check for required ID properties
    const sourceId = String((ref as any).sourceId || '').trim();
    const targetId = String((ref as any).targetId || '').trim();

    if (!sourceId || !targetId) {
      debug(
        `Skipping reference at index ${index}: missing or invalid element IDs`
      );
      return null;
    }

    // Extract and normalize relationship type
    const relationshipTypeStr = String((ref as any).relationshipType || 'custom').trim();
    let relationshipType: ReferenceType | undefined = undefined;

    if (relationshipTypeStr && relationshipTypeStr !== 'custom' && relationshipTypeStr !== 'unknown') {
      // Try to find a matching ReferenceType
      const normalizedType = Object.values(ReferenceType).find(
        (type) => type.toLowerCase() === relationshipTypeStr.toLowerCase()
      );
      if (normalizedType) {
        relationshipType = normalizedType;
      } else {
        // If no match, use custom type
        relationshipType = ReferenceType.Custom;
      }
    } else if (relationshipTypeStr === 'custom' || !relationshipTypeStr) {
      relationshipType = ReferenceType.Custom;
    }

    // Return sanitized reference
    return {
      sourceId,
      targetId,
      sourceLayer,
      targetLayer,
      relationshipType,
      sourceElementName: String((ref as any).sourceElementName || '').trim(),
      targetElementName: String((ref as any).targetElementName || '').trim(),
    };
  } catch (error) {
    debug(`Error validating reference at index ${index}:`, error);
    return null;
  }
}

/**
 * Converts a validated reference to a cross-layer edge
 */
export function referenceToEdge(ref: CrossLayerReference): CrossLayerEdge | null {
  try {
    return {
      id: `cross-layer-${ref.sourceId}-${ref.targetId}`,
      source: ref.sourceId,
      target: ref.targetId,
      type: 'elbow',
      data: {
        targetLayer: ref.targetLayer,
        sourceLayer: ref.sourceLayer,
        relationshipType: ref.relationshipType || ReferenceType.Custom,
        sourceElementName: ref.sourceElementName || '',
        targetElementName: ref.targetElementName || '',
      },
    };
  } catch (error) {
    debug(`Error converting reference to edge:`, error);
    return null;
  }
}

/**
 * Process an array of references and extract cross-layer edges
 * Separates intentionally filtered items (same-layer) from invalid/error items
 */
export function processReferences(references: unknown[]): ProcessResult {
  try {
    // Validate input
    if (!Array.isArray(references)) {
      return {
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: {
          message: 'Invalid references format: expected an array',
          type: 'invalid_input',
          severity: 'error',
        },
      };
    }

    // Handle empty array
    if (references.length === 0) {
      return {
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: null,
      };
    }

    // Process references with error recovery
    const crossLayerLinks: CrossLayerEdge[] = [];
    let filteredCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < references.length; i++) {
      try {
        const validatedRef = validateAndSanitizeReference(references[i], i);

        if (validatedRef === null) {
          // Invalid reference
          invalidCount++;
        } else if ('filtered' in validatedRef) {
          // Intentionally filtered (same-layer)
          filteredCount++;
        } else {
          // Valid reference - convert to edge
          const edge = referenceToEdge(validatedRef);
          if (edge) {
            crossLayerLinks.push(edge);
          } else {
            invalidCount++;
          }
        }
      } catch (error) {
        // Log error but continue processing other references
        debug(`Error processing reference at index ${i}:`, error);
        invalidCount++;
      }
    }

    // Log processing summary if there were any issues
    if (filteredCount > 0 || invalidCount > 0) {
      debug(
        `Processed ${references.length} references: ${crossLayerLinks.length} valid, ${filteredCount} filtered (same-layer), ${invalidCount} invalid`
      );
    }

    // Return successful result
    return {
      crossLayerLinks,
      filteredCount,
      invalidCount,
      error: null,
    };
  } catch (error) {
    // Catch any unexpected errors in the main processing logic
    return {
      crossLayerLinks: [],
      filteredCount: 0,
      invalidCount: 0,
      error: {
        message: error instanceof Error ? error.message : String(error),
        type: 'processing_error',
        severity: 'error',
      },
    };
  }
}
