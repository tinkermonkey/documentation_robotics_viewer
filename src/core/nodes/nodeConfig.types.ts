/**
 * Dimensions configuration for a node type
 */
export interface NodeDimensions {
  width: number;
  height: number;
  headerHeight?: number;
  itemHeight?: number;
}

/**
 * Color configuration for a node type
 */
export interface NodeColors {
  fill: string;
  stroke: string;
  header?: string;
  handle?: string;
}

/**
 * Complete styling configuration for a single node type
 */
export interface NodeStyleConfig {
  layout: 'centered' | 'left' | 'table';
  icon: string;
  typeLabel: string;
  colors: NodeColors;
  dimensions: NodeDimensions;
}

/**
 * Changeset operation color configuration
 */
export interface ChangesetColors {
  border: string;
  bg: string;
  opacity?: number;
}

/**
 * Complete node configuration structure
 */
export interface NodeConfig {
  version: string;
  typeMap: Record<string, string>; // Maps element type strings to NodeType enum values
  nodeStyles: Record<string, NodeStyleConfig>; // Maps NodeType to styling config
  changesetColors: {
    add: ChangesetColors;
    update: ChangesetColors;
    delete: ChangesetColors;
  };
}
