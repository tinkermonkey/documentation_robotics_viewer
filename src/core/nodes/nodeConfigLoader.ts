import nodeConfigData from './nodeConfig.json' with { type: 'json' };
import type { NodeConfig, NodeStyleConfig } from './nodeConfig.types';
import { NodeType, isValidNodeType } from './NodeType';

/**
 * NodeConfigLoader
 *
 * Singleton utility for loading and accessing node configuration.
 * Validates configuration on initialization and provides type-safe
 * access to node styling, dimensions, and type mappings.
 */
class NodeConfigLoader {
  private config: NodeConfig;
  private initialized = false;

  constructor() {
    this.config = nodeConfigData as NodeConfig;
    this.validateConfig();
    this.initialized = true;
  }

  /**
   * Validate that all required NodeType enum values have corresponding nodeStyles entries.
   * Also validates that all typeMap entries reference valid NodeType values.
   * Logs warnings for missing or invalid configurations in development mode.
   */
  private validateConfig(): void {
    const styleKeys = Object.keys(this.config.nodeStyles);
    const enumValues = Object.values(NodeType);
    const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

    // Validate nodeStyles coverage
    for (const nodeType of enumValues) {
      // LAYER_CONTAINER is included in nodeStyles for consistency, but validation allows it to be skipped
      // if needed due to its minimal/optional styling requirements in some contexts
      if (nodeType === NodeType.LAYER_CONTAINER) {
        continue;
      }

      if (!styleKeys.includes(nodeType)) {
        if (isDev) {
          console.warn(`[NodeConfigLoader] Missing style config for NodeType: ${nodeType}`);
        }
      }
    }

    // Validate typeMap entries point to valid NodeType values
    for (const [key, mappedType] of Object.entries(this.config.typeMap)) {
      if (!isValidNodeType(mappedType)) {
        if (isDev) {
          console.warn(`[NodeConfigLoader] Invalid typeMap entry: "${key}" -> "${mappedType}"`);
        }
      }
    }

    // Log info about loaded configuration in development mode
    if (isDev) {
      console.log(
        `[NodeConfigLoader] Loaded configuration with ${styleKeys.length} node styles and ${Object.keys(this.config.typeMap).length} type mappings`
      );
    }
  }

  /**
   * Get styling configuration for a node type
   * @param nodeType - The NodeType enum value
   * @returns Style configuration or undefined if not found
   */
  getStyleConfig(nodeType: NodeType | string): NodeStyleConfig | undefined {
    if (!isValidNodeType(nodeType)) {
      console.warn(`[NodeConfigLoader] Invalid NodeType: ${nodeType}`);
      return undefined;
    }
    return this.config.nodeStyles[nodeType];
  }

  /**
   * Map an element type string to a NodeType enum value.
   * Uses the configuration's typeMap for flexible type name mapping.
   * @param elementType - The element type string from the model
   * @returns NodeType enum value or undefined if not found
   */
  mapElementType(elementType: string): NodeType | undefined {
    const mappedType = this.config.typeMap[elementType];
    if (!mappedType) {
      return undefined;
    }

    if (!isValidNodeType(mappedType)) {
      console.warn(`[NodeConfigLoader] Type mapping "${elementType}" -> "${mappedType}" is invalid`);
      return undefined;
    }

    return mappedType as NodeType;
  }

  /**
   * Get changeset operation colors
   * @param operation - The changeset operation type ('add', 'update', or 'delete')
   * @returns Color configuration for the operation
   */
  getChangesetColors(operation: 'add' | 'update' | 'delete') {
    return this.config.changesetColors[operation];
  }

  /**
   * Get all changeset colors
   * @returns Complete changeset colors configuration
   */
  getAllChangesetColors() {
    return this.config.changesetColors;
  }

  /**
   * Get the configuration version
   * @returns Version string
   */
  getVersion(): string {
    return this.config.version;
  }

  /**
   * Check if loader is initialized
   * @returns True if validation completed successfully
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get type map for debugging/inspection
   * @returns Complete type map
   */
  getTypeMap(): Record<string, string> {
    return { ...this.config.typeMap };
  }

  /**
   * Get all node styles for debugging/inspection
   * @returns Complete node styles map
   */
  getNodeStyles(): Record<string, NodeStyleConfig> {
    return { ...this.config.nodeStyles };
  }
}

// Export singleton instance
export const nodeConfigLoader = new NodeConfigLoader();

// Export type for testing and advanced use cases
export type { NodeConfigLoader };
