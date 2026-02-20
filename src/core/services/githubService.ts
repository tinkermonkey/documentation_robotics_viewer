import JSZip from 'jszip';
import { Release } from '../types';

/**
 * Service for interacting with GitHub releases via backend server
 * Uses server proxy to avoid CORS issues
 *
 * NOTE: This service requires a separate backend server that is not included
 * with the embedded viewer. The local reference server has been removed.
 * If GitHub release downloading is needed, use the DR CLI server (port 8080)
 * or implement a custom backend service.
 */
export class GitHubService {
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:8080') {
    this.serverUrl = serverUrl;
  }

  /**
   * Get all available releases (spec releases only)
   */
  async getAvailableReleases(): Promise<Release[]> {
    const url = `${this.serverUrl}/api/github/releases`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to fetch releases');
      }

      return await response.json();
    } catch (error) {
      // Note: Core services use console.error for logging to avoid dependencies on embedded services.
      // For structured error tracking with Sentry integration, use errorTracker from embedded layer.
      console.error('GitHubService.getAvailableReleases error:', { url, error });
      // Provide helpful error for network failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Unable to connect to backend server at ${this.serverUrl}. ` +
          'GitHub release downloading requires a custom backend server. ' +
          'This functionality is optional and not provided by the embedded viewer.'
        );
      }
      throw error;
    }
  }

  /**
   * Get the latest spec release (already filtered by server)
   */
  async getLatestSpecRelease(): Promise<Release> {
    const url = `${this.serverUrl}/api/github/releases/latest`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            'No spec releases found in the repository. ' +
            'Releases must have tags starting with "spec-v" or "v". ' +
            'Please use "Load Demo Data" instead, or create a spec release.'
          );
        }
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to fetch latest release');
      }

      return await response.json();
    } catch (error) {
      // Note: Core services use console.error for logging to avoid dependencies on embedded services.
      // For structured error tracking with Sentry integration, use errorTracker from embedded layer.
      console.error('GitHubService.getLatestSpecRelease error:', { url, error });
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Unable to connect to backend server at ${this.serverUrl}. ` +
          'GitHub release downloading requires a custom backend server. ' +
          'This functionality is optional and not provided by the embedded viewer.'
        );
      }
      throw error;
    }
  }

  /**
   * Download and extract schema files from a release via server
   */
  async downloadSchemas(version: string = 'latest'): Promise<Record<string, unknown>> {
    try {
      // Get the release info first
      const release = version === 'latest'
        ? await this.getLatestSpecRelease()
        : await this.getReleaseByTag(version);

      console.log('Found release:', release.tag_name, 'with', release.assets.length, 'assets');

      // Download ZIP via server proxy
      const url = `${this.serverUrl}/api/github/download/${release.tag_name}`;
      console.log('Downloading schemas via server:', url);

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to download schemas');
      }

      // Get the ZIP data as array buffer
      const zipData = await response.arrayBuffer();

      // Extract JSON files from ZIP
      const schemas = await this.extractSchemasFromZip(zipData);

      console.log('Extracted schemas for layers:', Object.keys(schemas).join(', '));

      return schemas;
    } catch (error) {
      // Note: Core services use console.error for logging to avoid dependencies on embedded services.
      // For structured error tracking with Sentry integration, use errorTracker from embedded layer.
      console.error('GitHubService.downloadSchemas error:', { version, error });
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Unable to connect to backend server at ${this.serverUrl}. ` +
          'GitHub release downloading requires a custom backend server. ' +
          'This functionality is optional and not provided by the embedded viewer.'
        );
      }
      throw error;
    }
  }

  /**
   * Get a specific release by tag
   */
  private async getReleaseByTag(tag: string): Promise<Release> {
    const url = `${this.serverUrl}/api/github/releases/${tag}`;

    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Release not found: ${tag}`);
      }
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to fetch release ${tag}`);
    }

    return await response.json();
  }

  /**
   * Extract JSON and YAML files from ZIP archive
   *
   * For JSON Schema files: parses and returns as objects with layer name keys
   * For YAML instance models: returns as strings with full path keys for grouping
   */
  private async extractSchemasFromZip(zipData: ArrayBuffer): Promise<Record<string, unknown>> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(zipData);
    const schemas: Record<string, unknown> = {};
    const skippedFiles: string[] = [];

    // Check if this is a YAML instance model by looking for manifest.yaml
    let hasManifest = false;
    for (const filename of Object.keys(loadedZip.files)) {
      if (filename.includes('manifest.yaml') || filename.endsWith('/manifest.yaml')) {
        hasManifest = true;
        break;
      }
    }

    // Extract all JSON and YAML files
    for (const [filename, file] of Object.entries(loadedZip.files)) {
      if (file.dir) continue;

      // Handle JSON files (schema definitions)
      if (filename.endsWith('.json')) {
        try {
          const content = await file.async('text');
          const json = JSON.parse(content);

          // Extract layer name from filename for JSON schemas
          const layerName = this.extractLayerName(filename);
          schemas[layerName] = json;
        } catch (error) {
          console.warn(`Failed to parse JSON ${filename}:`, error);
          skippedFiles.push(filename);
        }
      }
      // Handle YAML files (instance models)
      else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        try {
          const content = await file.async('text');

          if (hasManifest) {
            // For YAML instance models, preserve full path for layer grouping
            // Remove any leading directory prefix up to 'model/' or root
            let key = filename;
            const modelIndex = filename.indexOf('model/');
            if (modelIndex !== -1) {
              key = filename.substring(modelIndex + 6); // Skip 'model/'
            } else if (filename.includes('/')) {
              // If no 'model/' but has directories, use filename from first directory
              const parts = filename.split('/');
              key = parts[parts.length - 1]; // Just the filename

              // But if it's manifest or projection-rules, use that name directly
              if (parts[parts.length - 1] === 'manifest.yaml') {
                key = 'manifest.yaml';
              } else if (parts[parts.length - 1] === 'projection-rules.yaml') {
                key = 'projection-rules.yaml';
              } else {
                // For layer files, preserve the layer directory name
                key = filename;
              }
            }

            schemas[key] = content; // Store as string for YAML parser
          } else {
            // Single YAML file, treat as layer
            const layerName = this.extractLayerName(filename);
            schemas[layerName] = content;
          }
        } catch (error) {
          console.warn(`Failed to extract YAML ${filename}:`, error);
          skippedFiles.push(filename);
        }
      }
    }

    // Log summary of extraction results
    if (skippedFiles.length > 0) {
      console.warn(`ZIP extraction completed with ${skippedFiles.length} skipped file(s): ${skippedFiles.join(', ')}`);
    }

    return schemas;
  }

  /**
   * Extract layer name from filename
   * Examples:
   *   - security.json -> Security
   *   - 01MotivationLayer.schema -> Motivation
   *   - 02BusinessLayer.schema -> Business
   *   - data-model.json -> DataModel
   *   - api-layer.json -> API
   */
  private extractLayerName(filename: string): string {
    // Remove directory path
    let basename = filename.split('/').pop() || filename;

    // Remove all extensions (.json, .schema.json, etc.)
    basename = basename.replace(/\.(schema\.)?json$/i, '');
    basename = basename.replace(/\.schema$/i, '');

    // Remove number prefix with optional dash (e.g., "01-", "02-", "10-")
    basename = basename.replace(/^\d+-?/, '');

    // Remove "-layer" or "Layer" suffix
    basename = basename.replace(/[-_]?layer$/i, '');

    // If the name already looks like PascalCase (e.g., "Motivation", "Business"),
    // return it as-is
    if (/^[A-Z][a-z]+([A-Z][a-z]+)*$/.test(basename)) {
      return basename;
    }

    // Convert to PascalCase (handle kebab-case, snake_case, etc.)
    return basename
      .split(/[-_]/)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Cache schemas to localStorage for offline use
   */
  cacheSchemas(version: string, schemas: Record<string, unknown>): void {
    try {
      const cacheKey = `schemas_${version}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        version,
        timestamp: Date.now(),
        schemas
      }));
    } catch (error) {
      console.warn('Failed to cache schemas:', error);
    }
  }

  /**
   * Load cached schemas from localStorage
   */
  loadCachedSchemas(version: string): Record<string, unknown> | null {
    try {
      const cacheKey = `schemas_${version}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);

        // Check if cache is less than 24 hours old
        const age = Date.now() - data.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge) {
          return data.schemas;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached schemas:', error);
    }

    return null;
  }
}
