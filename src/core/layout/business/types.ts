/**
 * Business Layout Engine Types
 *
 * Defines the interface and types for business layer layout algorithms.
 */

import { Node, Edge } from '@xyflow/react';
import { BusinessGraph } from '../../types/businessLayer';

/**
 * Layout algorithm options
 */
export interface LayoutOptions {
  /** Layout algorithm to use */
  algorithm: 'hierarchical' | 'swimlane' | 'matrix' | 'force' | 'manual';

  /** Direction for hierarchical layout */
  direction?: 'TB' | 'LR' | 'BT' | 'RL';

  /** Spacing configuration */
  spacing?: {
    /** Horizontal spacing between nodes in the same rank */
    node: number;
    /** Vertical spacing between ranks */
    rank: number;
    /** Spacing between swimlanes */
    lane: number;
  };

  /** Enable animated transitions */
  animate?: boolean;

  /** Animation duration in ms */
  animationDuration?: number;
}

/**
 * Result of layout calculation
 */
export interface LayoutResult {
  /** React Flow nodes with calculated positions */
  nodes: Node[];

  /** React Flow edges */
  edges: Edge[];

  /** Layout metadata */
  metadata?: {
    /** Time taken to calculate layout (ms) */
    calculationTime: number;

    /** Whether Web Worker was used for calculation */
    usedWorker?: boolean;

    /** Total bounds of the layout */
    bounds: {
      width: number;
      height: number;
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
  };
}

/**
 * Business Layout Engine Interface
 *
 * All layout engines must implement this interface.
 */
export interface BusinessLayoutEngine {
  /**
   * Calculate layout for a business graph
   *
   * @param graph - The business graph to layout
   * @param options - Layout configuration options
   * @returns Layout result with positioned nodes and edges (may be async for large graphs)
   */
  calculate(graph: BusinessGraph, options: LayoutOptions): LayoutResult | Promise<LayoutResult>;

  /**
   * Get the name of this layout engine
   */
  getName(): string;

  /**
   * Get a description of this layout algorithm
   */
  getDescription(): string;
}

/**
 * Default layout options
 */
export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  algorithm: 'hierarchical',
  direction: 'TB',
  spacing: {
    node: 80,
    rank: 120,
    lane: 200,
  },
  animate: true,
  animationDuration: 800,
};
