/**
 * Graph Readability Service
 *
 * Provides quantitative layout quality measurement using greadability.js.
 * Calculates metrics for edge crossings, angular resolution, and layout stress.
 * Supports all diagram types: motivation, business process, and C4.
 */

import { Node, Edge } from '@xyflow/react';

// Import greadability.js ES module wrapper
// @ts-ignore
import { greadability as greadabilityFn } from '../../../vendor/greadability.esm.js';

/**
 * Node structure for greadability.js input.
 * Part of the public API for custom graph conversion scenarios.
 *
 * @remarks
 * Coordinates should be center positions (not top-left).
 * The `toGreadabilityGraph` function handles this conversion for React Flow nodes.
 */
export interface GreadabilityNode {
  /** X coordinate (center position) */
  x: number;
  /** Y coordinate (center position) */
  y: number;
  /** Array index, used internally by greadability.js */
  index?: number;
  /** Node identifier for lookup */
  id?: string;
  /** Node width for occlusion detection */
  width?: number;
  /** Node height for occlusion detection */
  height?: number;
}

/**
 * Link/edge structure for greadability.js input.
 * Part of the public API for custom graph conversion scenarios.
 *
 * @remarks
 * Source and target can be node IDs (strings), indices (numbers), or node objects.
 */
export interface GreadabilityLink {
  /** Source node (ID, index, or node object) */
  source: string | number | GreadabilityNode;
  /** Target node (ID, index, or node object) */
  target: string | number | GreadabilityNode;
  /** Edge identifier */
  id?: string;
}

interface GreadabilityResult {
  crossing: number;
  crossingAngle: number;
  angularResolutionMin: number;
  angularResolutionDev: number;
}

type GreadabilityFunction = (
  nodes: GreadabilityNode[],
  links: GreadabilityLink[],
  id?: (node: GreadabilityNode, index: number, nodeById: Record<string, GreadabilityNode>) => string | number
) => GreadabilityResult;

// Cast to proper type
const greadability: GreadabilityFunction = greadabilityFn as GreadabilityFunction;

/**
 * Supported diagram types for metrics calculation
 * Includes all 12 architecture layers plus C4 and cross-layer diagrams
 */
export type DiagramType =
  | 'motivation'
  | 'business'
  | 'security'
  | 'application'
  | 'technology'
  | 'api'
  | 'datamodel'
  | 'datastore'
  | 'ux'
  | 'navigation'
  | 'apm'
  | 'crosslayer'
  | 'c4'
  | 'spec-viewer'
  | 'model-viewer'
  | 'layer-specific';

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

/**
 * Core readability metrics from greadability.js
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

/**
 * Input graph structure for greadability.js
 */
export interface GreadabilityGraph {
  nodes: GreadabilityNode[];
  links: GreadabilityLink[];
}

/**
 * Default node dimensions when not specified
 */
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 110;

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
 * Quality classification result
 */
export type QualityClass = 'excellent' | 'good' | 'acceptable' | 'poor' | 'unacceptable';

/**
 * Layer-specific quality thresholds
 * These values are derived from baseline measurements on public datasets
 */
const QUALITY_THRESHOLDS: Record<DiagramType, QualityThresholds> = {
  // Motivation diagrams: Focus on goal hierarchy clarity
  motivation: {
    excellent: 0.85,
    good: 0.70,
    acceptable: 0.55,
    poor: 0.40,
  },
  // Business process diagrams: Focus on flow clarity and alignment
  business: {
    excellent: 0.80,
    good: 0.65,
    acceptable: 0.50,
    poor: 0.35,
  },
  // Security layer: High threshold for clarity and minimal crossings
  security: {
    excellent: 0.88,
    good: 0.73,
    acceptable: 0.58,
    poor: 0.43,
  },
  // Application layer: Component relationship clarity
  application: {
    excellent: 0.82,
    good: 0.67,
    acceptable: 0.52,
    poor: 0.37,
  },
  // Technology layer: Stack clarity
  technology: {
    excellent: 0.81,
    good: 0.66,
    acceptable: 0.51,
    poor: 0.36,
  },
  // API layer: Endpoint relationship clarity
  api: {
    excellent: 0.86,
    good: 0.71,
    acceptable: 0.56,
    poor: 0.41,
  },
  // Data model layer: Entity relationship clarity
  datamodel: {
    excellent: 0.79,
    good: 0.64,
    acceptable: 0.49,
    poor: 0.34,
  },
  // Datastore layer: Storage organization clarity
  datastore: {
    excellent: 0.80,
    good: 0.65,
    acceptable: 0.50,
    poor: 0.35,
  },
  // UX layer: User flow clarity
  ux: {
    excellent: 0.78,
    good: 0.63,
    acceptable: 0.48,
    poor: 0.33,
  },
  // Navigation layer: Page/screen flow clarity
  navigation: {
    excellent: 0.77,
    good: 0.62,
    acceptable: 0.47,
    poor: 0.32,
  },
  // APM/Observability layer: Metric relationship clarity
  apm: {
    excellent: 0.83,
    good: 0.68,
    acceptable: 0.53,
    poor: 0.38,
  },
  // Cross-layer diagrams: Multi-level clarity
  crosslayer: {
    excellent: 0.84,
    good: 0.69,
    acceptable: 0.54,
    poor: 0.39,
  },
  // C4 diagrams: Container and system clarity
  c4: {
    excellent: 0.85,
    good: 0.70,
    acceptable: 0.55,
    poor: 0.40,
  },
  // Spec viewer: Schema clarity
  'spec-viewer': {
    excellent: 0.84,
    good: 0.69,
    acceptable: 0.54,
    poor: 0.39,
  },
  // Model viewer: Overall model clarity
  'model-viewer': {
    excellent: 0.84,
    good: 0.69,
    acceptable: 0.54,
    poor: 0.39,
  },
  // Layer-specific diagrams: Default thresholds
  'layer-specific': {
    excellent: 0.83,
    good: 0.68,
    acceptable: 0.53,
    poor: 0.38,
  },
};

// Default thresholds for unknown diagram types
const DEFAULT_THRESHOLDS = {
  excellent: 0.83,
  good: 0.68,
  acceptable: 0.53,
  poor: 0.38,
};

/**
 * Classify quality score based on layer-specific thresholds.
 *
 * @param score - Overall quality score (0-1)
 * @param diagramType - Type of diagram
 * @returns Quality classification
 */
export function classifyQuality(score: number, diagramType: DiagramType): QualityClass {
  const thresholds = QUALITY_THRESHOLDS[diagramType] || DEFAULT_THRESHOLDS;

  if (score >= thresholds.excellent) return 'excellent';
  if (score >= thresholds.good) return 'good';
  if (score >= thresholds.acceptable) return 'acceptable';
  if (score >= thresholds.poor) return 'poor';
  return 'unacceptable';
}

/**
 * Get quality thresholds for a specific diagram type.
 *
 * @param diagramType - Type of diagram
 * @returns Quality thresholds
 */
export function getQualityThresholds(diagramType: DiagramType): QualityThresholds {
  return { ...QUALITY_THRESHOLDS[diagramType] };
}

/**
 * Default metric weights by diagram type
 * Weights are tuned based on what matters most for each diagram type
 */
const DEFAULT_WEIGHTS: Record<DiagramType, MetricWeights> = {
  // Motivation diagrams prioritize crossing minimization and angular clarity
  motivation: {
    crossingNumber: 0.30,
    crossingAngle: 0.15,
    angularResolutionMin: 0.20,
    angularResolutionDev: 0.15,
    edgeLengthUniformity: 0.10,
    nodeOcclusion: 0.10,
  },
  // Business process diagrams prioritize edge length uniformity and hierarchy
  business: {
    crossingNumber: 0.25,
    crossingAngle: 0.10,
    angularResolutionMin: 0.15,
    angularResolutionDev: 0.10,
    edgeLengthUniformity: 0.25,
    nodeOcclusion: 0.15,
  },
  // Security layer prioritizes crossing minimization and separation
  security: {
    crossingNumber: 0.35,
    crossingAngle: 0.12,
    angularResolutionMin: 0.18,
    angularResolutionDev: 0.12,
    edgeLengthUniformity: 0.15,
    nodeOcclusion: 0.08,
  },
  // Application layer emphasizes component relationships and clarity
  application: {
    crossingNumber: 0.28,
    crossingAngle: 0.12,
    angularResolutionMin: 0.18,
    angularResolutionDev: 0.12,
    edgeLengthUniformity: 0.20,
    nodeOcclusion: 0.10,
  },
  // Technology layer prioritizes technology stack clarity and relationships
  technology: {
    crossingNumber: 0.27,
    crossingAngle: 0.11,
    angularResolutionMin: 0.17,
    angularResolutionDev: 0.11,
    edgeLengthUniformity: 0.22,
    nodeOcclusion: 0.12,
  },
  // API layer emphasizes endpoint relationships and data flow
  api: {
    crossingNumber: 0.32,
    crossingAngle: 0.13,
    angularResolutionMin: 0.17,
    angularResolutionDev: 0.13,
    edgeLengthUniformity: 0.15,
    nodeOcclusion: 0.10,
  },
  // Data Model layer focuses on entity relationships and clarity
  datamodel: {
    crossingNumber: 0.25,
    crossingAngle: 0.15,
    angularResolutionMin: 0.15,
    angularResolutionDev: 0.15,
    edgeLengthUniformity: 0.20,
    nodeOcclusion: 0.10,
  },
  // Datastore layer emphasizes storage relationships and organization
  datastore: {
    crossingNumber: 0.28,
    crossingAngle: 0.12,
    angularResolutionMin: 0.16,
    angularResolutionDev: 0.12,
    edgeLengthUniformity: 0.22,
    nodeOcclusion: 0.10,
  },
  // UX layer prioritizes user flow clarity and interaction visibility
  ux: {
    crossingNumber: 0.20,
    crossingAngle: 0.10,
    angularResolutionMin: 0.15,
    angularResolutionDev: 0.10,
    edgeLengthUniformity: 0.30,
    nodeOcclusion: 0.15,
  },
  // Navigation layer emphasizes page/screen hierarchy and flow
  navigation: {
    crossingNumber: 0.22,
    crossingAngle: 0.10,
    angularResolutionMin: 0.15,
    angularResolutionDev: 0.10,
    edgeLengthUniformity: 0.28,
    nodeOcclusion: 0.15,
  },
  // APM/Observability layer prioritizes metric clarity and relationships
  apm: {
    crossingNumber: 0.30,
    crossingAngle: 0.12,
    angularResolutionMin: 0.15,
    angularResolutionDev: 0.12,
    edgeLengthUniformity: 0.18,
    nodeOcclusion: 0.13,
  },
  // Cross-layer diagrams prioritize clarity across multiple abstraction levels
  crosslayer: {
    crossingNumber: 0.32,
    crossingAngle: 0.14,
    angularResolutionMin: 0.16,
    angularResolutionDev: 0.14,
    edgeLengthUniformity: 0.12,
    nodeOcclusion: 0.12,
  },
  // C4 diagrams prioritize clear container relationships and minimal crossings
  c4: {
    crossingNumber: 0.30,
    crossingAngle: 0.15,
    angularResolutionMin: 0.15,
    angularResolutionDev: 0.10,
    edgeLengthUniformity: 0.15,
    nodeOcclusion: 0.15,
  },
  // Spec viewer prioritizes schema clarity and relationship visibility
  'spec-viewer': {
    crossingNumber: 0.28,
    crossingAngle: 0.12,
    angularResolutionMin: 0.16,
    angularResolutionDev: 0.12,
    edgeLengthUniformity: 0.20,
    nodeOcclusion: 0.12,
  },
  // Model viewer prioritizes overall model clarity and organization
  'model-viewer': {
    crossingNumber: 0.26,
    crossingAngle: 0.12,
    angularResolutionMin: 0.16,
    angularResolutionDev: 0.12,
    edgeLengthUniformity: 0.22,
    nodeOcclusion: 0.12,
  },
  // Layer-specific diagrams use default balanced weights
  'layer-specific': {
    crossingNumber: 0.25,
    crossingAngle: 0.12,
    angularResolutionMin: 0.16,
    angularResolutionDev: 0.12,
    edgeLengthUniformity: 0.20,
    nodeOcclusion: 0.15,
  },
};

/**
 * Convert React Flow nodes and edges to greadability.js input format.
 *
 * React Flow uses top-left positioning while greadability.js expects center
 * coordinates for accurate crossing detection.
 *
 * @param nodes - React Flow nodes with positions
 * @param edges - React Flow edges with source/target references
 * @returns Graph structure compatible with greadability.js
 */
export function toGreadabilityGraph(
  nodes: Node[],
  edges: Edge[]
): GreadabilityGraph {
  // Create a map of node IDs to center positions
  const nodeMap = new Map<string, GreadabilityNode>();

  const greadabilityNodes: GreadabilityNode[] = nodes.map((node, index) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;

    // Convert from top-left to center coordinates
    const centerX = node.position.x + width / 2;
    const centerY = node.position.y + height / 2;

    const gNode: GreadabilityNode = {
      x: centerX,
      y: centerY,
      index,
      id: node.id,
      width,
      height,
    };

    nodeMap.set(node.id, gNode);
    return gNode;
  });

  // Convert edges to links, filtering out edges with missing nodes
  const greadabilityLinks: GreadabilityLink[] = edges
    .filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target))
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      id: edge.id,
    }));

  return {
    nodes: greadabilityNodes,
    links: greadabilityLinks,
  };
}

/**
 * Calculate edge length statistics for the graph.
 *
 * @param nodes - Array of nodes with positions
 * @param edges - Array of edges with source/target references
 * @returns Edge length statistics
 */
export function calculateEdgeLengthStats(
  nodes: Node[],
  edges: Edge[]
): ExtendedMetrics['edgeLength'] {
  const nodePositions = new Map<string, { x: number; y: number }>();

  // Build position map
  nodes.forEach((node) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    nodePositions.set(node.id, {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    });
  });

  // Calculate edge lengths
  const lengths: number[] = [];
  edges.forEach((edge) => {
    const source = nodePositions.get(edge.source);
    const target = nodePositions.get(edge.target);
    if (source && target) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      lengths.push(Math.sqrt(dx * dx + dy * dy));
    }
  });

  if (lengths.length === 0) {
    return { min: 0, max: 0, mean: 0, stdDev: 0, variance: 0 };
  }

  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
    lengths.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, mean, stdDev, variance };
}

/**
 * Check for node-node overlaps (occlusions).
 *
 * @param nodes - Array of nodes with positions and dimensions
 * @returns Number of overlapping node pairs
 */
export function calculateNodeOcclusion(nodes: Node[]): number {
  let overlaps = 0;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const aWidth = nodeA.measured?.width ?? nodeA.width ?? DEFAULT_NODE_WIDTH;
      const aHeight =
        nodeA.measured?.height ?? nodeA.height ?? DEFAULT_NODE_HEIGHT;
      const bWidth = nodeB.measured?.width ?? nodeB.width ?? DEFAULT_NODE_WIDTH;
      const bHeight =
        nodeB.measured?.height ?? nodeB.height ?? DEFAULT_NODE_HEIGHT;

      // Check for axis-aligned bounding box overlap
      const aLeft = nodeA.position.x;
      const aRight = nodeA.position.x + aWidth;
      const aTop = nodeA.position.y;
      const aBottom = nodeA.position.y + aHeight;

      const bLeft = nodeB.position.x;
      const bRight = nodeB.position.x + bWidth;
      const bTop = nodeB.position.y;
      const bBottom = nodeB.position.y + bHeight;

      const horizontalOverlap = aLeft < bRight && aRight > bLeft;
      const verticalOverlap = aTop < bBottom && aBottom > bTop;

      if (horizontalOverlap && verticalOverlap) {
        overlaps++;
      }
    }
  }

  return overlaps;
}

/**
 * Calculate detailed node overlap information including areas and specific pairs.
 *
 * @param nodes - Array of nodes with positions and dimensions
 * @returns Detailed overlap information
 */
export function calculateNodeOverlapDetails(nodes: Node[]): ExtendedMetrics['overlaps'] {
  const overlappingPairs: NodeOverlap[] = [];
  let totalOverlapArea = 0;
  let totalNodeArea = 0;

  // Calculate total node area
  nodes.forEach((node) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    totalNodeArea += width * height;
  });

  // Check all pairs for overlaps
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const aWidth = nodeA.measured?.width ?? nodeA.width ?? DEFAULT_NODE_WIDTH;
      const aHeight = nodeA.measured?.height ?? nodeA.height ?? DEFAULT_NODE_HEIGHT;
      const bWidth = nodeB.measured?.width ?? nodeB.width ?? DEFAULT_NODE_WIDTH;
      const bHeight = nodeB.measured?.height ?? nodeB.height ?? DEFAULT_NODE_HEIGHT;

      // Calculate bounding boxes
      const aLeft = nodeA.position.x;
      const aRight = nodeA.position.x + aWidth;
      const aTop = nodeA.position.y;
      const aBottom = nodeA.position.y + aHeight;

      const bLeft = nodeB.position.x;
      const bRight = nodeB.position.x + bWidth;
      const bTop = nodeB.position.y;
      const bBottom = nodeB.position.y + bHeight;

      // Check for overlap
      const horizontalOverlap = aLeft < bRight && aRight > bLeft;
      const verticalOverlap = aTop < bBottom && aBottom > bTop;

      if (horizontalOverlap && verticalOverlap) {
        // Calculate overlap area
        const overlapLeft = Math.max(aLeft, bLeft);
        const overlapRight = Math.min(aRight, bRight);
        const overlapTop = Math.max(aTop, bTop);
        const overlapBottom = Math.min(aBottom, bBottom);

        const overlapWidth = overlapRight - overlapLeft;
        const overlapHeight = overlapBottom - overlapTop;
        const overlapArea = overlapWidth * overlapHeight;

        overlappingPairs.push({
          node1: nodeA.id,
          node2: nodeB.id,
          area: overlapArea,
        });

        totalOverlapArea += overlapArea;
      }
    }
  }

  const areaPercentage = totalNodeArea > 0 ? (totalOverlapArea / totalNodeArea) * 100 : 0;

  return {
    pairs: overlappingPairs,
    totalArea: totalOverlapArea,
    areaPercentage,
  };
}

/**
 * Detect edge crossings and their locations.
 * Uses line segment intersection algorithm.
 *
 * @param nodes - Array of nodes with positions
 * @param edges - Array of edges
 * @returns Edge crossing information
 */
export function detectEdgeCrossings(
  nodes: Node[],
  edges: Edge[]
): ExtendedMetrics['crossings'] {
  const crossings: EdgeCrossing[] = [];

  // Build node position map (center coordinates)
  const nodePositions = new Map<string, Coordinate>();
  nodes.forEach((node) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    nodePositions.set(node.id, {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    });
  });

  // Check all edge pairs for crossings
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const edge1 = edges[i];
      const edge2 = edges[j];

      const e1Source = nodePositions.get(edge1.source);
      const e1Target = nodePositions.get(edge1.target);
      const e2Source = nodePositions.get(edge2.source);
      const e2Target = nodePositions.get(edge2.target);

      if (!e1Source || !e1Target || !e2Source || !e2Target) continue;

      // Check if line segments intersect
      const intersection = getLineIntersection(
        e1Source,
        e1Target,
        e2Source,
        e2Target
      );

      if (intersection) {
        crossings.push({
          edge1: edge1.id,
          edge2: edge2.id,
          location: intersection,
        });
      }
    }
  }

  return {
    count: crossings.length,
    locations: crossings,
  };
}

/**
 * Calculate intersection point of two line segments.
 * Returns null if segments don't intersect.
 *
 * @param p1 - First point of line 1
 * @param p2 - Second point of line 1
 * @param p3 - First point of line 2
 * @param p4 - Second point of line 2
 * @returns Intersection point or null
 */
function getLineIntersection(
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): Coordinate | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = p3.x, y3 = p3.y;
  const x4 = p4.x, y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Lines are parallel or coincident
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // Check if intersection is within both line segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  return null;
}

/**
 * Calculate alignment metrics for nodes.
 *
 * @param nodes - Array of nodes with positions
 * @param tolerance - Tolerance in pixels for near-alignment detection
 * @returns Alignment metrics
 */
export function calculateAlignment(
  nodes: Node[],
  tolerance: number = 5
): AlignmentMetrics {
  if (nodes.length < 2) {
    return { horizontal: 0, vertical: 0, tolerance };
  }

  // Group nodes by horizontal and vertical positions
  const yGroups = new Map<number, number>();
  const xGroups = new Map<number, number>();

  nodes.forEach((node) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    const centerY = node.position.y + height / 2;
    const centerX = node.position.x + width / 2;

    // Find or create horizontal alignment group
    let foundYGroup = false;
    for (const [groupY, count] of yGroups.entries()) {
      if (Math.abs(centerY - groupY) <= tolerance) {
        yGroups.set(groupY, count + 1);
        foundYGroup = true;
        break;
      }
    }
    if (!foundYGroup) {
      yGroups.set(centerY, 1);
    }

    // Find or create vertical alignment group
    let foundXGroup = false;
    for (const [groupX, count] of xGroups.entries()) {
      if (Math.abs(centerX - groupX) <= tolerance) {
        xGroups.set(groupX, count + 1);
        foundXGroup = true;
        break;
      }
    }
    if (!foundXGroup) {
      xGroups.set(centerX, 1);
    }
  });

  // Calculate alignment scores based on largest groups
  const maxYGroupSize = Math.max(...Array.from(yGroups.values()));
  const maxXGroupSize = Math.max(...Array.from(xGroups.values()));

  const horizontalScore = maxYGroupSize / nodes.length;
  const verticalScore = maxXGroupSize / nodes.length;

  return {
    horizontal: horizontalScore,
    vertical: verticalScore,
    tolerance,
  };
}

/**
 * Calculate symmetry metrics for the layout.
 *
 * @param nodes - Array of nodes with positions
 * @returns Symmetry metrics
 */
export function calculateSymmetry(nodes: Node[]): SymmetryMetrics {
  if (nodes.length < 2) {
    return { horizontal: 0, vertical: 0, radial: 0 };
  }

  // Calculate bounding box center
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const centers: Coordinate[] = nodes.map((node) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    const centerX = node.position.x + width / 2;
    const centerY = node.position.y + height / 2;

    minX = Math.min(minX, centerX);
    maxX = Math.max(maxX, centerX);
    minY = Math.min(minY, centerY);
    maxY = Math.max(maxY, centerY);

    return { x: centerX, y: centerY };
  });

  const layoutCenterX = (minX + maxX) / 2;
  const layoutCenterY = (minY + maxY) / 2;

  // Calculate horizontal symmetry
  let horizontalSymmetryScore = 0;
  centers.forEach((center) => {
    const mirrorY = 2 * layoutCenterY - center.y;
    const minDistance = Math.min(
      ...centers.map((c) => Math.sqrt(Math.pow(c.x - center.x, 2) + Math.pow(c.y - mirrorY, 2)))
    );
    const tolerance = 20; // pixels
    if (minDistance < tolerance) {
      horizontalSymmetryScore++;
    }
  });

  // Calculate vertical symmetry
  let verticalSymmetryScore = 0;
  centers.forEach((center) => {
    const mirrorX = 2 * layoutCenterX - center.x;
    const minDistance = Math.min(
      ...centers.map((c) => Math.sqrt(Math.pow(c.x - mirrorX, 2) + Math.pow(c.y - center.y, 2)))
    );
    const tolerance = 20; // pixels
    if (minDistance < tolerance) {
      verticalSymmetryScore++;
    }
  });

  // Calculate radial symmetry (simplified)
  let radialSymmetryScore = 0;
  centers.forEach((center) => {
    const distanceFromCenter = Math.sqrt(
      Math.pow(center.x - layoutCenterX, 2) + Math.pow(center.y - layoutCenterY, 2)
    );
    const sameDistanceCount = centers.filter((c) => {
      const dist = Math.sqrt(
        Math.pow(c.x - layoutCenterX, 2) + Math.pow(c.y - layoutCenterY, 2)
      );
      return Math.abs(dist - distanceFromCenter) < 20;
    }).length;

    if (sameDistanceCount > 1) {
      radialSymmetryScore += 1 / sameDistanceCount;
    }
  });

  return {
    horizontal: horizontalSymmetryScore / nodes.length,
    vertical: verticalSymmetryScore / nodes.length,
    radial: Math.min(radialSymmetryScore / nodes.length, 1),
  };
}

/**
 * Calculate hierarchy clarity metric for hierarchical layouts.
 *
 * @param nodes - Array of nodes with positions
 * @param edges - Array of edges (used to detect hierarchy)
 * @param layoutType - Type of layout being used
 * @returns Hierarchy clarity metric or undefined for non-hierarchical layouts
 */
export function calculateHierarchyClarity(
  nodes: Node[],
  _edges: Edge[],
  layoutType: LayoutType
): ExtendedMetrics['hierarchyClarity'] | undefined {
  // Only calculate for hierarchical layouts
  if (layoutType !== 'hierarchical') {
    return undefined;
  }

  if (nodes.length < 2) {
    return undefined;
  }

  // Detect levels based on Y-coordinates (assumes top-down hierarchy)
  const tolerance = 20; // pixels
  const levels: HierarchyLevel[] = [];

  nodes.forEach((node) => {
    // const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH; // unused
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
    const centerY = node.position.y + height / 2;

    // Find existing level or create new one
    let foundLevel = false;
    for (const level of levels) {
      if (Math.abs(level.yPosition - centerY) <= tolerance) {
        level.nodeIds.push(node.id);
        // Update average Y position
        level.yPosition =
          (level.yPosition * (level.nodeIds.length - 1) + centerY) /
          level.nodeIds.length;
        foundLevel = true;
        break;
      }
    }

    if (!foundLevel) {
      levels.push({
        level: levels.length,
        yPosition: centerY,
        nodeIds: [node.id],
      });
    }
  });

  // Sort levels by Y position
  levels.sort((a, b) => a.yPosition - b.yPosition);
  levels.forEach((level, index) => {
    level.level = index;
  });

  // Calculate spacing between levels
  const spacings: number[] = [];
  for (let i = 0; i < levels.length - 1; i++) {
    spacings.push(levels[i + 1].yPosition - levels[i].yPosition);
  }

  if (spacings.length === 0) {
    return {
      score: 1,
      levels,
      avgLevelSpacing: 0,
      levelSpacingStdDev: 0,
    };
  }

  const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
  const variance =
    spacings.reduce((sum, s) => sum + Math.pow(s - avgSpacing, 2), 0) /
    spacings.length;
  const stdDev = Math.sqrt(variance);

  // Score based on consistency of spacing (lower stdDev = higher score)
  // Normalize by average spacing to make it relative
  const coefficientOfVariation = avgSpacing > 0 ? stdDev / avgSpacing : 0;
  const score = Math.max(0, 1 - Math.min(coefficientOfVariation, 1));

  return {
    score,
    levels,
    avgLevelSpacing: avgSpacing,
    levelSpacingStdDev: stdDev,
  };
}

/**
 * Calculate aspect ratio of the layout bounding box.
 *
 * @param nodes - Array of nodes with positions
 * @returns Aspect ratio (width/height), or 1 if empty
 */
export function calculateAspectRatio(nodes: Node[]): number {
  if (nodes.length === 0) return 1;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const width = node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
    const height = node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;

    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x + width);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y + height);
  });

  const layoutWidth = maxX - minX;
  const layoutHeight = maxY - minY;

  if (layoutHeight === 0) return 1;
  return layoutWidth / layoutHeight;
}

/**
 * Calculate graph density.
 *
 * @param nodeCount - Number of nodes
 * @param edgeCount - Number of edges
 * @returns Density value 0-1
 */
export function calculateDensity(nodeCount: number, edgeCount: number): number {
  if (nodeCount <= 1) return 0;
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
  return edgeCount / maxEdges;
}

/**
 * Get metric weights for a specific diagram type.
 *
 * @param diagramType - Type of diagram
 * @returns Metric weights for computing overall score
 */
export function getMetricWeights(diagramType: DiagramType): MetricWeights {
  return { ...DEFAULT_WEIGHTS[diagramType] };
}

/**
 * Normalize edge length uniformity to a 0-1 score.
 * Higher score means more uniform edge lengths.
 *
 * Uses the coefficient of variation (CV = stdDev / mean) to measure uniformity.
 * A CV of 0 (all edges same length) yields a score of 1.
 * A CV >= 1 (high variation) yields a score of 0.
 *
 * @param edgeLengthStats - Edge length statistics containing mean and stdDev
 * @returns Uniformity score 0-1, where 1 means perfectly uniform edge lengths
 *
 * @example
 * ```typescript
 * // Uniform edges
 * normalizeEdgeLengthUniformity({ mean: 100, stdDev: 0 }); // Returns 1.0
 *
 * // Moderate variation
 * normalizeEdgeLengthUniformity({ mean: 200, stdDev: 100 }); // Returns 0.5
 *
 * // High variation
 * normalizeEdgeLengthUniformity({ mean: 100, stdDev: 200 }); // Returns 0.0
 * ```
 */
function normalizeEdgeLengthUniformity(
  edgeLengthStats: ExtendedMetrics['edgeLength']
): number {
  if (edgeLengthStats.mean === 0) return 1; // No edges or all zero-length
  // Coefficient of variation (CV) = stdDev / mean
  // Lower CV means more uniform, so we invert: 1 - normalized CV
  const cv = edgeLengthStats.stdDev / edgeLengthStats.mean;
  // Cap CV at 1 for normalization
  return Math.max(0, 1 - Math.min(cv, 1));
}

/**
 * Normalize node occlusion to a 0-1 score.
 * Higher score means fewer overlaps.
 *
 * Calculates the ratio of actual overlaps to maximum possible overlaps
 * (which is n*(n-1)/2 for n nodes) and inverts it.
 *
 * @param occlusions - Number of overlapping node pairs detected
 * @param nodeCount - Total number of nodes in the graph
 * @returns Occlusion score 0-1, where 1 means no overlaps and 0 means all nodes overlap
 *
 * @example
 * ```typescript
 * // No overlaps
 * normalizeOcclusionScore(0, 10); // Returns 1.0
 *
 * // Half of possible pairs overlap
 * normalizeOcclusionScore(3, 4); // Returns 0.5 (max overlaps = 6)
 *
 * // All pairs overlap
 * normalizeOcclusionScore(10, 5); // Returns 0.0 (max overlaps = 10)
 * ```
 */
function normalizeOcclusionScore(
  occlusions: number,
  nodeCount: number
): number {
  if (nodeCount <= 1) return 1; // No overlaps possible
  const maxOverlaps = (nodeCount * (nodeCount - 1)) / 2;
  return Math.max(0, 1 - occlusions / maxOverlaps);
}

/**
 * Calculate the overall quality score from individual metrics.
 *
 * @param metrics - Readability metrics from greadability.js
 * @param extendedMetrics - Extended metrics
 * @param weights - Metric weights
 * @param nodeCount - Number of nodes
 * @returns Overall score 0-1
 */
export function calculateOverallScore(
  metrics: ReadabilityMetrics,
  extendedMetrics: ExtendedMetrics,
  weights: MetricWeights,
  nodeCount: number
): number {
  const edgeLengthScore = normalizeEdgeLengthUniformity(
    extendedMetrics.edgeLength
  );
  const occlusionScore = normalizeOcclusionScore(
    extendedMetrics.nodeNodeOcclusion,
    nodeCount
  );

  // Calculate weighted score with NaN guards
  const score = (
    (weights.crossingNumber || 0) * (metrics.crossingNumber || 0) +
    (weights.crossingAngle || 0) * (metrics.crossingAngle || 0) +
    (weights.angularResolutionMin || 0) * (metrics.angularResolutionMin || 0) +
    (weights.angularResolutionDev || 0) * (metrics.angularResolutionDev || 0) +
    (weights.edgeLengthUniformity || 0) * (isNaN(edgeLengthScore) ? 0 : edgeLengthScore) +
    (weights.nodeOcclusion || 0) * (isNaN(occlusionScore) ? 0 : occlusionScore)
  );

  // Return 0 instead of NaN if calculation fails
  return isNaN(score) ? 0 : score;
}

/**
 * Calculate complete layout quality metrics for a React Flow graph.
 *
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @param layoutType - Layout algorithm used
 * @param diagramType - Type of diagram
 * @param customWeights - Optional custom weights (defaults based on diagram type)
 * @returns Complete layout quality report
 */
export function calculateLayoutQuality(
  nodes: Node[],
  edges: Edge[],
  layoutType: LayoutType,
  diagramType: DiagramType,
  customWeights?: Partial<MetricWeights>
): LayoutQualityReport {
  const startTime = performance.now();

  // Convert to greadability format
  const graph = toGreadabilityGraph(nodes, edges);

  // Calculate core metrics using greadability.js
  let greadabilityResult: GreadabilityResult;
  try {
    // Only call greadability if we have nodes and links
    if (graph.nodes.length > 0 && graph.links.length > 0) {
      greadabilityResult = greadability(graph.nodes, graph.links, (node) =>
        String(node.id)
      );
    } else {
      // Default perfect scores for empty or trivial graphs
      greadabilityResult = {
        crossing: 1,
        crossingAngle: 1,
        angularResolutionMin: 1,
        angularResolutionDev: 1,
      };
    }
  } catch (error) {
    // Handle edge cases where greadability might fail
    console.warn('greadability.js calculation failed, using defaults:', error);
    greadabilityResult = {
      crossing: 1,
      crossingAngle: 1,
      angularResolutionMin: 1,
      angularResolutionDev: 1,
    };
  }

  const metrics: ReadabilityMetrics = {
    crossingNumber: greadabilityResult.crossing,
    crossingAngle: greadabilityResult.crossingAngle,
    angularResolutionMin: greadabilityResult.angularResolutionMin,
    angularResolutionDev: greadabilityResult.angularResolutionDev,
  };

  // Calculate extended metrics
  const edgeLength = calculateEdgeLengthStats(nodes, edges);
  const nodeNodeOcclusion = calculateNodeOcclusion(nodes);
  const overlaps = calculateNodeOverlapDetails(nodes);
  const crossings = detectEdgeCrossings(nodes, edges);
  const aspectRatio = calculateAspectRatio(nodes);
  const density = calculateDensity(nodes.length, edges.length);
  const alignment = calculateAlignment(nodes);
  const symmetry = calculateSymmetry(nodes);
  const hierarchyClarity = calculateHierarchyClarity(nodes, edges, layoutType);

  const extendedMetrics: ExtendedMetrics = {
    ...metrics,
    edgeLength,
    nodeNodeOcclusion,
    overlaps,
    crossings,
    aspectRatio,
    density,
    alignment,
    symmetry,
    hierarchyClarity,
  };

  // Calculate overall score
  const weights = {
    ...getMetricWeights(diagramType),
    ...customWeights,
  };
  const overallScore = calculateOverallScore(
    metrics,
    extendedMetrics,
    weights,
    nodes.length
  );

  const computationTimeMs = performance.now() - startTime;

  // Classify quality based on layer-specific thresholds
  const qualityClass = classifyQuality(overallScore, diagramType);

  return {
    overallScore,
    qualityClass,
    metrics,
    extendedMetrics,
    timestamp: new Date().toISOString(),
    layoutType,
    diagramType,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    computationTimeMs,
  };
}

/**
 * Compare two layout quality reports and determine improvement.
 *
 * @param current - Current layout report
 * @param baseline - Baseline layout report
 * @returns Comparison result with improvement percentages
 */
export function compareLayoutQuality(
  current: LayoutQualityReport,
  baseline: LayoutQualityReport
): {
  overallImprovement: number;
  metricChanges: Record<keyof ReadabilityMetrics, number>;
  improved: boolean;
} {
  const overallImprovement =
    ((current.overallScore - baseline.overallScore) /
      (baseline.overallScore || 1)) *
    100;

  const metricChanges: Record<keyof ReadabilityMetrics, number> = {
    crossingNumber:
      ((current.metrics.crossingNumber - baseline.metrics.crossingNumber) /
        (baseline.metrics.crossingNumber || 1)) *
      100,
    crossingAngle:
      ((current.metrics.crossingAngle - baseline.metrics.crossingAngle) /
        (baseline.metrics.crossingAngle || 1)) *
      100,
    angularResolutionMin:
      ((current.metrics.angularResolutionMin -
        baseline.metrics.angularResolutionMin) /
        (baseline.metrics.angularResolutionMin || 1)) *
      100,
    angularResolutionDev:
      ((current.metrics.angularResolutionDev -
        baseline.metrics.angularResolutionDev) /
        (baseline.metrics.angularResolutionDev || 1)) *
      100,
  };

  return {
    overallImprovement,
    metricChanges,
    improved: overallImprovement > 0,
  };
}

/**
 * Simplified calculateMetrics function for backward compatibility with tests
 * @param nodes - Array of nodes
 * @param edges - Array of edges
 * @returns Layout quality report with metrics and overall score
 */
export function calculateMetrics(nodes: Node[], edges: Edge[]): LayoutQualityReport {
  // Use default layout and diagram types for test compatibility
  // Using 'motivation' as default diagram type since it has appropriate weights defined
  const report = calculateLayoutQuality(
    nodes,
    edges,
    'hierarchical',
    'motivation',
    undefined
  );

  return report;
}
