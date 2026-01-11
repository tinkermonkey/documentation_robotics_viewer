/**
 * Layout Quality Report Types
 *
 * Contains types for layout quality metrics and reporting.
 */

import type { DiagramType } from './diagram';
import type { LayoutType } from './diagram';

/**
 * Quality score thresholds by diagram type
 * Based on empirical testing with public datasets
 */
export interface QualityThresholds {
  excellent: number; // >= this score
  good: number; // >= this score
  acceptable: number; // >= this score
  poor: number; // >= this score
  // < poor = unacceptable
}

/**
 * Core readability metrics
 * All values are normalized 0-1 where higher is better
 */
export interface ReadabilityMetrics {
  /**
   * Edge crossing metric (0-1, higher is better)
   * Measures the fraction of edges that cross, normalized by max possible crossings
   */
  crossingNumber: number;

  /**
   * Edge crossing angle metric (0-1, higher is better)
   * Measures how close crossing angles are to the ideal 70 degrees
   */
  crossingAngle: number;

  /**
   * Angular resolution minimum metric (0-1, higher is better)
   * Measures deviation from ideal minimum angle between adjacent edges at nodes
   */
  angularResolutionMin: number;

  /**
   * Angular resolution deviation metric (0-1, higher is better)
   * Measures average deviation of angles between incident edges
   */
  angularResolutionDev: number;
}

/**
 * Coordinate for crossing or overlap location
 */
export interface Coordinate {
  x: number;
  y: number;
}

/**
 * Information about an edge crossing
 */
export interface EdgeCrossing {
  /** First edge ID */
  edge1: string;
  /** Second edge ID */
  edge2: string;
  /** Approximate crossing location */
  location: Coordinate;
}

/**
 * Information about node overlap
 */
export interface NodeOverlap {
  /** First node ID */
  node1: string;
  /** Second node ID */
  node2: string;
  /** Overlapping area in square pixels */
  area: number;
}

/**
 * Hierarchical level information
 */
export interface HierarchyLevel {
  /** Level number (0 = root) */
  level: number;
  /** Y-coordinate of this level */
  yPosition: number;
  /** Node IDs at this level */
  nodeIds: string[];
}

/**
 * Symmetry detection results
 */
export interface SymmetryMetrics {
  /** Horizontal symmetry score 0-1 */
  horizontal: number;
  /** Vertical symmetry score 0-1 */
  vertical: number;
  /** Radial symmetry score 0-1 */
  radial: number;
}

/**
 * Alignment detection results
 */
export interface AlignmentMetrics {
  /** Horizontal alignment score 0-1 */
  horizontal: number;
  /** Vertical alignment score 0-1 */
  vertical: number;
  /** Tolerance in pixels for near-alignment */
  tolerance: number;
}

/**
 * Extended metrics including computed values beyond greadability.js
 */
export interface ExtendedMetrics extends ReadabilityMetrics {
  /**
   * Edge length statistics
   */
  edgeLength: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
    variance: number;
  };

  /**
   * Node overlap detection (0 = no overlaps, higher = more overlaps)
   */
  nodeNodeOcclusion: number;

  /**
   * Detailed overlap information
   */
  overlaps: {
    /** Array of specific overlapping node pairs with areas */
    pairs: NodeOverlap[];
    /** Total overlapping area in square pixels */
    totalArea: number;
    /** Percentage of total node area involved in overlaps */
    areaPercentage: number;
  };

  /**
   * Edge crossing information
   */
  crossings: {
    /** Total number of edge crossings */
    count: number;
    /** Array of crossing locations for visualization */
    locations: EdgeCrossing[];
  };

  /**
   * Aspect ratio of the layout bounding box (width/height)
   */
  aspectRatio: number;

  /**
   * Density of the graph (edges / possible edges)
   */
  density: number;

  /**
   * Alignment metrics
   */
  alignment: AlignmentMetrics;

  /**
   * Symmetry metrics
   */
  symmetry: SymmetryMetrics;

  /**
   * Hierarchy clarity metric (only for hierarchical layouts)
   */
  hierarchyClarity?: {
    /** Hierarchy clarity score 0-1 */
    score: number;
    /** Detected hierarchical levels */
    levels: HierarchyLevel[];
    /** Average spacing between levels */
    avgLevelSpacing: number;
    /** Standard deviation of level spacing */
    levelSpacingStdDev: number;
  };
}

/**
 * Quality classification result
 */
export type QualityClass = 'excellent' | 'good' | 'acceptable' | 'poor' | 'unacceptable';

/**
 * Complete layout quality report
 */
export interface LayoutQualityReport {
  /**
   * Overall normalized score 0-1 (higher is better)
   * Computed as weighted combination of individual metrics
   */
  overallScore: number;

  /**
   * Quality classification based on layer-specific thresholds
   */
  qualityClass: QualityClass;

  /**
   * Individual readability metrics from greadability.js
   */
  metrics: ReadabilityMetrics;

  /**
   * Extended metrics computed separately
   */
  extendedMetrics: ExtendedMetrics;

  /**
   * ISO timestamp when report was generated
   */
  timestamp: string;

  /**
   * Layout algorithm used
   */
  layoutType: LayoutType;

  /**
   * Type of diagram visualized
   */
  diagramType: DiagramType;

  /**
   * Number of nodes in the graph
   */
  nodeCount: number;

  /**
   * Number of edges in the graph
   */
  edgeCount: number;

  /**
   * Computation time in milliseconds
   */
  computationTimeMs: number;
}

/**
 * Metric weights for computing overall score
 * Values should sum to 1.0
 */
export interface MetricWeights {
  crossingNumber: number;
  crossingAngle: number;
  angularResolutionMin: number;
  angularResolutionDev: number;
  edgeLengthUniformity: number;
  nodeOcclusion: number;
}
