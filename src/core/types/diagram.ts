/**
 * Diagram Type Definitions
 *
 * Core types for diagram classification and layout type selection.
 */

/**
 * Supported diagram types for visualization and refinement.
 * Includes all 12 architecture layers plus spec and model viewers.
 */
export type DiagramType =
  | 'motivation'
  | 'business'
  | 'security'
  | 'application'
  | 'technology'
  | 'api'
  | 'datamodel'
  | 'dataset'
  | 'ux'
  | 'navigation'
  | 'apm'
  | 'c4'
  | 'spec-viewer';

/**
 * Supported layout algorithm types
 */
export type LayoutType =
  | 'force-directed'
  | 'hierarchical'
  | 'radial'
  | 'swimlane'
  | 'matrix'
  | 'manual';
