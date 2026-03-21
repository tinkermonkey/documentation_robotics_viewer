import { getSpecLayerNames } from '../types/layers';

/**
 * Load spec schemas from .dr/spec/ directory in parallel, including manifest.json and base.json.
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
