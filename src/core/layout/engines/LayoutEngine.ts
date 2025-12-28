/**
 * Layout Engine Abstraction Layer
 *
 * Defines the common interface for all layout engines (dagre, d3-force, ELK, Graphviz).
 * Supports runtime switching between engines and provides consistent parameter handling.
 */

/**
 * Layout engine type enumeration
 */
export type LayoutEngineType = 'dagre' | 'd3-force' | 'elk' | 'graphviz' | 'custom';

/**
 * Engine capabilities for different layout algorithm types
 */
export interface EngineCapabilities {
  /** Supports hierarchical/tree layouts */
  hierarchical: boolean;

  /** Supports force-directed layouts */
  forceDirected: boolean;

  /** Supports orthogonal edge routing */
  orthogonal: boolean;

  /** Supports circular/radial layouts */
  circular: boolean;
}

/**
 * Common graph input format for layout engines
 */
export interface LayoutGraphInput {
  /** Nodes to layout */
  nodes: Array<{
    id: string;
    width: number;
    height: number;
    data?: Record<string, any>;
  }>;

  /** Edges between nodes */
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: Record<string, any>;
  }>;
}

/**
 * Common layout result format (React Flow compatible)
 */
export interface LayoutResult {
  /** Positioned nodes */
  nodes: Array<{
    id: string;
    position: {
      x: number;
      y: number;
    };
    data?: Record<string, any>;
  }>;

  /** Edges with optional routing points */
  edges: Array<{
    id: string;
    source: string;
    target: string;
    points?: Array<{ x: number; y: number }>;
    data?: Record<string, any>;
  }>;

  /** Calculated bounds of the layout */
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };

  /** Optional metadata */
  metadata?: {
    calculationTime?: number;
    usedWorker?: boolean;
    [key: string]: any;
  };
}

/**
 * Parameter validation result
 */
export interface ParameterValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Common layout engine interface
 *
 * All layout engines must implement this interface to be compatible
 * with the layout engine registry and factory system.
 */
export interface LayoutEngine {
  /** Engine name */
  readonly name: string;

  /** Engine version */
  readonly version: string;

  /** Engine capabilities */
  readonly capabilities: EngineCapabilities;

  /**
   * Initialize the layout engine
   * Called once before first use
   */
  initialize(): Promise<void>;

  /**
   * Calculate layout for the given graph
   *
   * @param graph - Input graph with nodes and edges
   * @param parameters - Engine-specific layout parameters
   * @returns Layout result with positioned nodes and edges
   */
  calculateLayout(
    graph: LayoutGraphInput,
    parameters: Record<string, any>
  ): Promise<LayoutResult>;

  /**
   * Get default parameters for this engine
   *
   * @returns Default parameter object
   */
  getParameters(): Record<string, any>;

  /**
   * Validate layout parameters
   *
   * @param parameters - Parameters to validate
   * @returns Validation result with errors if invalid
   */
  validateParameters(parameters: Record<string, any>): ParameterValidation;

  /**
   * Optional cleanup when engine is no longer needed
   */
  cleanup?(): Promise<void>;
}

/**
 * Base class for layout engines providing common functionality
 */
export abstract class BaseLayoutEngine implements LayoutEngine {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly capabilities: EngineCapabilities;

  protected initialized: boolean = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  abstract calculateLayout(
    graph: LayoutGraphInput,
    parameters: Record<string, any>
  ): Promise<LayoutResult>;

  abstract getParameters(): Record<string, any>;

  abstract validateParameters(parameters: Record<string, any>): ParameterValidation;

  async cleanup(): Promise<void> {
    this.initialized = false;
  }

  /**
   * Helper to calculate bounds from positioned nodes
   */
  protected calculateBounds(
    nodes: Array<{ id: string; position: { x: number; y: number }; width?: number; height?: number }>
  ): LayoutResult['bounds'] {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const width = node.width || 0;
      const height = node.height || 0;

      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + width);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + height);
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  /**
   * Helper to validate common parameters
   */
  protected validateCommonParameters(
    parameters: Record<string, any>,
    schema: Record<string, { type: string; min?: number; max?: number; values?: any[] }>
  ): ParameterValidation {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(parameters)) {
      const def = schema[key];
      if (!def) {
        errors.push(`Unknown parameter: ${key}`);
        continue;
      }

      if (def.type === 'number') {
        if (typeof value !== 'number') {
          errors.push(`Parameter ${key} must be a number`);
        } else if (def.min !== undefined && value < def.min) {
          errors.push(`Parameter ${key} must be >= ${def.min}`);
        } else if (def.max !== undefined && value > def.max) {
          errors.push(`Parameter ${key} must be <= ${def.max}`);
        }
      } else if (def.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`Parameter ${key} must be a string`);
        } else if (def.values && !def.values.includes(value)) {
          errors.push(`Parameter ${key} must be one of: ${def.values.join(', ')}`);
        }
      } else if (def.type === 'boolean') {
        if (typeof value !== 'boolean') {
          errors.push(`Parameter ${key} must be a boolean`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
