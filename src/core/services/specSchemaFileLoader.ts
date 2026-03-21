/**
 * Spec Schema File Loader
 *
 * Stateless service for loading spec schema files from .dr/spec/ directory.
 * These are static assets bundled with the app.
 *
 * Key features:
 * - Parallel fetching of spec files using Promise.all()
 * - Centralized layer name mapping (removes hardcoded lists)
 * - Graceful error handling for missing files
 * - Returns manifest.json and base.json for version validation and predicate catalog
 */

import { getSpecLayerNames } from '../types/layers';

/**
 * Load spec schemas from .dr/spec/ directory in parallel.
 * Returns spec files including manifest.json for version validation.
 *
 * @returns Record mapping filename to parsed JSON object
 * @example
 * ```typescript
 * const specFiles = await loadSpecSchemaFiles();
 * // {
 * //   'manifest.json': {...},
 * //   'base.json': {...},
 * //   'motivation.json': {...},
 * //   'business.json': {...},
 * //   ...
 * // }
 * ```
 */
export async function loadSpecSchemaFiles(): Promise<Record<string, unknown>> {
  const specFiles: Record<string, unknown> = {};

  // Build list of fetch promises for all spec files
  const fetchPromises: Promise<{
    filename: string;
    data?: unknown;
    error?: Error;
  }>[] = [];

  // Fetch manifest.json for spec version validation
  fetchPromises.push(
    fetch('/.dr/spec/manifest.json')
      .then(async (response) => ({
        filename: 'manifest.json',
        data: response.ok ? await response.json() : undefined,
      }))
      .catch((error) => ({
        filename: 'manifest.json',
        error: error as Error,
      }))
  );

  // Fetch base.json for predicate catalog
  fetchPromises.push(
    fetch('/.dr/spec/base.json')
      .then(async (response) => ({
        filename: 'base.json',
        data: response.ok ? await response.json() : undefined,
      }))
      .catch((error) => ({
        filename: 'base.json',
        error: error as Error,
      }))
  );

  // Fetch layer-specific spec schemas
  const layerNames = getSpecLayerNames();
  for (const layerName of layerNames) {
    fetchPromises.push(
      fetch(`/.dr/spec/${layerName}.json`)
        .then(async (response) => ({
          filename: `${layerName}.json`,
          data: response.ok ? await response.json() : undefined,
        }))
        .catch((error) => ({
          filename: `${layerName}.json`,
          error: error as Error,
        }))
    );
  }

  // Execute all fetches in parallel
  const results = await Promise.all(fetchPromises);

  // Process results
  for (const result of results) {
    if (result.error) {
      console.warn(`Failed to load ${result.filename}:`, result.error);
    } else if (result.data !== undefined) {
      specFiles[result.filename] = result.data;
    }
  }

  return specFiles;
}
