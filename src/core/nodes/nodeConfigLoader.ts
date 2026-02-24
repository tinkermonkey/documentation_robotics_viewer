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
   * Logs warnings for missing or invalid configurations (both dev and production).
   * These configuration problems should never occur in either environment - if they do,
   * it indicates a serious build/deployment issue and must be visible.
   */
  private validateConfig(): void {
    const styleKeys = Object.keys(this.config.nodeStyles);
    const enumValues = Object.values(NodeType);
    const missingStyles: string[] = [];
    const invalidMappings: Array<[string, string]> = [];

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

    // Validate typeMap entries point to valid NodeType values
    for (const [key, mappedType] of Object.entries(this.config.typeMap)) {
      if (!isValidNodeType(mappedType)) {
        invalidMappings.push([key, mappedType]);
      }
    }

    // Report all validation issues (both dev and production)
    // Configuration problems indicate build/deployment failures and must always be visible
    if (missingStyles.length > 0) {
      console.error(
        `[NodeConfigLoader] Missing style config for NodeTypes: ${missingStyles.join(', ')}. ` +
        `This indicates a build/deployment issue. All NodeType enum values must have corresponding nodeStyles entries.`
      );
    }

    if (invalidMappings.length > 0) {
      const mappingDetails = invalidMappings.map(([k, v]) => `"${k}" -> "${v}"`).join(', ');
      console.error(
        `[NodeConfigLoader] Invalid typeMap entries: ${mappingDetails}. ` +
        `All typeMap values must reference valid NodeType enum values.`
      );
    }

    if (missingStyles.length === 0 && invalidMappings.length === 0) {
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
      console.error(
        `[NodeConfigLoader] Invalid NodeType: ${nodeType}. ` +
        `This indicates incomplete fixture data or type mapping configuration. ` +
        `Verify that all model elements have valid types mapped in nodeConfig.json typeMap.`
      );
      return undefined;
    }
    const config = this.config.nodeStyles[nodeType];
    if (!config) {
      console.error(
        `[NodeConfigLoader] No style config found for NodeType: ${nodeType}. ` +
        `This should have been caught during initialization. ` +
        `Verify nodeConfig.json contains a nodeStyles entry for this NodeType.`
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

    if (!isValidNodeType(mappedType)) {
      console.error(
        `[NodeConfigLoader] Type mapping "${elementType}" -> "${mappedType}" is invalid. ` +
        `The mapped value must be a valid NodeType enum value. ` +
        `This indicates a configuration error in nodeConfig.json.`
      );
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
