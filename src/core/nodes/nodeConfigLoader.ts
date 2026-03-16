import nodeConfigData from './nodeConfig.json' with { type: 'json' };
import type { NodeConfig, NodeStyleConfig } from './nodeConfig.types';
import { NodeType } from './NodeType';

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
    this.config = this.loadAndValidateConfig();
    this.initialized = true;
  }

  /**
   * Load and validate configuration with runtime type checking.
   * Throws an error if configuration is invalid to prevent initialization
   * of the application in a broken state.
   */
  private loadAndValidateConfig(): NodeConfig {
    // Runtime validation: ensure JSON data has the expected structure
    if (!nodeConfigData || typeof nodeConfigData !== 'object') {
      throw new Error(
        '[NodeConfigLoader] Configuration data is not a valid object. ' +
        'Verify nodeConfig.json was loaded correctly.'
      );
    }

    const config = nodeConfigData as NodeConfig;

    // Validate required top-level properties
    if (!config.version) {
      throw new Error(
        '[NodeConfigLoader] Configuration missing "version" property. ' +
        'Verify nodeConfig.json has a valid version field.'
      );
    }

    if (!config.nodeStyles || typeof config.nodeStyles !== 'object') {
      throw new Error(
        '[NodeConfigLoader] Configuration missing or invalid "nodeStyles" property. ' +
        'Verify nodeConfig.json contains a nodeStyles object.'
      );
    }

    if (!config.typeMap || typeof config.typeMap !== 'object') {
      throw new Error(
        '[NodeConfigLoader] Configuration missing or invalid "typeMap" property. ' +
        'Verify nodeConfig.json contains a typeMap object.'
      );
    }

    if (!config.changesetColors || typeof config.changesetColors !== 'object') {
      throw new Error(
        '[NodeConfigLoader] Configuration missing or invalid "changesetColors" property. ' +
        'Verify nodeConfig.json contains a changesetColors object.'
      );
    }

    // Validate changesetColors has required operations
    const requiredOps = ['add', 'update', 'delete'] as const;
    for (const op of requiredOps) {
      if (!config.changesetColors[op]) {
        throw new Error(
          `[NodeConfigLoader] Changeset colors missing "${op}" operation configuration. ` +
          'Verify nodeConfig.json changesetColors has entries for add, update, and delete.'
        );
      }
    }

    // Validate nodeStyles coverage for all NodeType enum values
    this.validateStylesCoverage(config);

    console.log(
      `[NodeConfigLoader] Configuration loaded successfully: ` +
      `${Object.keys(config.nodeStyles).length} node styles, ` +
      `${Object.keys(config.typeMap).length} type mappings`
    );

    return config;
  }

  /**
   * Validate that all required NodeType enum values have corresponding nodeStyles entries.
   * Throws an error if any required configuration is missing.
   */
  private validateStylesCoverage(config: NodeConfig): void {
    const styleKeys = Object.keys(config.nodeStyles) as NodeType[];
    const enumValues = Object.values(NodeType);
    const missingStyles: string[] = [];

    // Validate nodeStyles coverage
    for (const nodeType of enumValues) {
      // LAYER_CONTAINER is included in nodeStyles for consistency, but validation allows it to be skipped
      // if needed due to its minimal/optional styling requirements in some contexts
      if (nodeType === NodeType.LAYER_CONTAINER) {
        continue;
      }

      if (!styleKeys.includes(nodeType)) {
        missingStyles.push(nodeType);
      }
    }

    // Fail fast if any required styles are missing
    if (missingStyles.length > 0) {
      throw new Error(
        `[NodeConfigLoader] Missing style configuration for NodeTypes: ${missingStyles.join(', ')}. ` +
        'This indicates a build/deployment issue. All NodeType enum values must have corresponding ' +
        'nodeStyles entries in nodeConfig.json.'
      );
    }

    // Validate that each style config has required properties
    for (const [nodeType, styleConfig] of Object.entries(config.nodeStyles)) {
      if (!styleConfig.layout || !styleConfig.icon || !styleConfig.typeLabel) {
        throw new Error(
          `[NodeConfigLoader] Style config for NodeType "${nodeType}" is missing required properties ` +
          '(layout, icon, or typeLabel). Verify all node style entries are complete in nodeConfig.json.'
        );
      }

      if (!styleConfig.colors || !styleConfig.dimensions) {
        throw new Error(
          `[NodeConfigLoader] Style config for NodeType "${nodeType}" is missing required sub-objects ` +
          '(colors or dimensions). Verify all node style entries are complete in nodeConfig.json.'
        );
      }

      if (!styleConfig.colors.fill || !styleConfig.colors.stroke) {
        throw new Error(
          `[NodeConfigLoader] Colors config for NodeType "${nodeType}" is missing required fields ` +
          '(fill or stroke). Verify nodeConfig.json color entries are complete.'
        );
      }

      if (!styleConfig.dimensions.width || !styleConfig.dimensions.height) {
        throw new Error(
          `[NodeConfigLoader] Dimensions config for NodeType "${nodeType}" is missing required fields ` +
          '(width or height). Verify nodeConfig.json dimension entries are complete.'
        );
      }
    }
  }

  /**
   * Get styling configuration for a node type.
   * This method should never return undefined for a valid NodeType because
   * coverage is validated during initialization. If it does, it indicates
   * a configuration corruption issue.
   * @param nodeType - The NodeType enum value
   * @returns Style configuration (guaranteed if nodeType is valid)
   */
  getStyleConfig(nodeType: NodeType): NodeStyleConfig | undefined {
    const config = this.config.nodeStyles[nodeType];
    if (!config) {
      console.error(
        `[NodeConfigLoader] No style config found for NodeType: "${nodeType}". ` +
        `This should have been caught during initialization and indicates a critical error. ` +
        `Verify nodeConfig.json contains a nodeStyles entry for this NodeType and that ` +
        `the NodeType enum value matches a nodeStyles key.`
      );
    }
    return config;
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
      console.warn(
        `[NodeConfigLoader] No type mapping found for element type: "${elementType}". ` +
        `Add an entry to nodeConfig.json typeMap to support this element type.`
      );
      return undefined;
    }

    return mappedType;
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
   * @returns True if configuration has been loaded and validated
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get type map for debugging/inspection
   * @returns Complete type map
   */
  getTypeMap(): Record<string, NodeType> {
    return { ...this.config.typeMap };
  }

  /**
   * Get all node styles for debugging/inspection
   * @returns Complete node styles map
   */
  getNodeStyles(): Record<NodeType, NodeStyleConfig> {
    return { ...this.config.nodeStyles };
  }
}

// Export singleton instance
export const nodeConfigLoader = new NodeConfigLoader();

// Export type for testing and advanced use cases
export type { NodeConfigLoader };
