/**
 * Layout Algorithm Type Enum
 * Defines the available layout algorithms for motivation graph visualization
 */

export enum LayoutAlgorithmType {
  Force = 'force',
  Hierarchical = 'hierarchical',
  Radial = 'radial',
  Manual = 'manual',
}

export type LayoutAlgorithm = LayoutAlgorithmType | 'force' | 'hierarchical' | 'radial' | 'manual';
