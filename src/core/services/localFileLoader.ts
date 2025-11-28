import JSZip from 'jszip';

/**
 * Service for loading spec files from local filesystem
 */
export class LocalFileLoader {
  /**
   * Load schemas from multiple JSON/YAML files
   */
  async loadFromFiles(files: FileList): Promise<Record<string, unknown>> {
    const schemas: Record<string, unknown> = {};

    // Check if this is a directory upload by looking for webkitRelativePath
    const isDirectoryUpload = files.length > 0 &&
      'webkitRelativePath' in files[0] &&
      (files[0] as any).webkitRelativePath !== '';

    // Check if this is a YAML instance model
    let hasManifest = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name === 'manifest.yaml' || file.name.endsWith('/manifest.yaml')) {
        hasManifest = true;
        break;
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.name.endsWith('.json')) {
        try {
          const content = await this.readFileAsText(file);
          const json = JSON.parse(content);
          const layerName = this.extractLayerName(file.name);
          schemas[layerName] = json;
        } catch (error) {
          console.error(`Failed to parse ${file.name}:`, error);
          throw new Error(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        try {
          const content = await this.readFileAsText(file);

          // Determine the key to use
          let key: string;

          if (isDirectoryUpload && hasManifest) {
            // For directory uploads with manifest, preserve path structure
            const relativePath = (file as any).webkitRelativePath || file.name;

            // Remove the top-level directory name (e.g., "model/")
            const parts = relativePath.split('/');
            if (parts.length > 1) {
              // Skip first part (directory name), keep the rest
              key = parts.slice(1).join('/');
            } else {
              key = relativePath;
            }

            // Special handling for manifest and projection-rules
            if (file.name === 'manifest.yaml') {
              key = 'manifest.yaml';
            } else if (file.name === 'projection-rules.yaml') {
              key = 'projection-rules.yaml';
            }
          } else {
            // For single file uploads, use simple keys
            key = file.name.includes('manifest') ? 'manifest.yaml' :
                  file.name.includes('projection') ? 'projection-rules.yaml' :
                  file.name;
          }

          schemas[key] = content;
          console.log(`Loaded YAML file with key: ${key}`);
        } catch (error) {
          console.error(`Failed to read ${file.name}:`, error);
          throw new Error(`Failed to read ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (file.name.endsWith('.zip')) {
        // If a ZIP file is included, extract it
        try {
          const zipSchemas = await this.loadFromZip(file);
          Object.assign(schemas, zipSchemas);
        } catch (error) {
          console.error(`Failed to extract ${file.name}:`, error);
          throw new Error(`Failed to extract ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    if (Object.keys(schemas).length === 0) {
      throw new Error('No valid files found');
    }

    return schemas;
  }

  /**
   * Load schemas from a ZIP file (JSON or YAML)
   */
  async loadFromZip(zipFile: File): Promise<Record<string, unknown>> {
    const zip = new JSZip();
    const arrayBuffer = await this.readFileAsArrayBuffer(zipFile);
    const loadedZip = await zip.loadAsync(arrayBuffer);
    const schemas: Record<string, unknown> = {};

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

      // Extract JSON files
      if (filename.endsWith('.json')) {
        try {
          const content = await file.async('text');
          const json = JSON.parse(content);
          const layerName = this.extractLayerName(filename);
          schemas[layerName] = json;
        } catch (error) {
          console.warn(`Failed to parse ${filename} in ZIP:`, error);
        }
      }
      // Extract YAML files
      else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
        try {
          const content = await file.async('text');

          if (hasManifest) {
            // For YAML instance models, preserve path structure
            let key = filename;
            const modelIndex = filename.indexOf('model/');
            if (modelIndex !== -1) {
              key = filename.substring(modelIndex + 6); // Skip 'model/'
            } else if (filename.includes('/')) {
              const parts = filename.split('/');
              if (parts[parts.length - 1] === 'manifest.yaml') {
                key = 'manifest.yaml';
              } else if (parts[parts.length - 1] === 'projection-rules.yaml') {
                key = 'projection-rules.yaml';
              } else {
                key = filename;
              }
            }

            schemas[key] = content; // Store as string
          } else {
            // Single YAML file
            const layerName = this.extractLayerName(filename);
            schemas[layerName] = content;
          }
        } catch (error) {
          console.warn(`Failed to extract ${filename} in ZIP:`, error);
        }
      }
    }

    if (Object.keys(schemas).length === 0) {
      throw new Error('No valid files found in ZIP archive');
    }

    return schemas;
  }

  /**
   * Read file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Read file as ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as ArrayBuffer);
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract layer name from filename
   * Examples:
   *   - security.json -> Security
   *   - data-model.json -> DataModel
   *   - api-layer.json -> API
   */
  private extractLayerName(filename: string): string {
    // Remove directory path and extension
    const basename = filename.split('/').pop()?.replace('.json', '') || filename;

    // Handle special cases
    const specialCases: Record<string, string> = {
      'api': 'API',
      'apm': 'APM',
      'ux': 'UX'
    };

    const normalized = basename.toLowerCase().replace(/[-_]/g, '');

    if (specialCases[normalized]) {
      return specialCases[normalized];
    }

    // Convert to PascalCase
    return basename
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Validate file types
   */
  validateFiles(files: FileList): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let hasValidFile = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.name.endsWith('.json') ||
          file.name.endsWith('.yaml') ||
          file.name.endsWith('.yml') ||
          file.name.endsWith('.zip')) {
        hasValidFile = true;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`File ${file.name} is too large (max 10MB)`);
        }
      } else {
        errors.push(`Invalid file type: ${file.name} (only .json, .yaml, and .zip are supported)`);
      }
    }

    if (!hasValidFile) {
      errors.push('No valid files found (must include .json, .yaml, or .zip files)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
