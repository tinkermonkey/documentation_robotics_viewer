/**
 * Graph Readability Service
 *
 * Provides quantitative layout quality measurement using greadability.js.
 * Calculates metrics for edge crossings, angular resolution, and layout stress.
 * Supports all diagram types: motivation, business process, and C4.
 */

import { Node, Edge } from '@xyflow/react';

// Import greadability.js ES module wrapper
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
 */
export type DiagramType = 'motivation' | 'business' | 'c4';

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
  };

  /**
   * Node overlap detection (0 = no overlaps, higher = more overlaps)
   */
  nodeNodeOcclusion: number;

  /**
   * Aspect ratio of the layout bounding box (width/height)
   */
  aspectRatio: number;

  /**
   * Density of the graph (edges / possible edges)
   */
  density: number;
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
  // C4 diagrams prioritize clear container relationships and minimal crossings
  c4: {
    crossingNumber: 0.30,
    crossingAngle: 0.15,
    angularResolutionMin: 0.15,
    angularResolutionDev: 0.10,
    edgeLengthUniformity: 0.15,
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
    return { min: 0, max: 0, mean: 0, stdDev: 0 };
  }

  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
    lengths.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, mean, stdDev };
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

  return (
    weights.crossingNumber * metrics.crossingNumber +
    weights.crossingAngle * metrics.crossingAngle +
    weights.angularResolutionMin * metrics.angularResolutionMin +
    weights.angularResolutionDev * metrics.angularResolutionDev +
    weights.edgeLengthUniformity * edgeLengthScore +
    weights.nodeOcclusion * occlusionScore
  );
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
  const aspectRatio = calculateAspectRatio(nodes);
  const density = calculateDensity(nodes.length, edges.length);

  const extendedMetrics: ExtendedMetrics = {
    ...metrics,
    edgeLength,
    nodeNodeOcclusion,
    aspectRatio,
    density,
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

  return {
    overallScore,
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
