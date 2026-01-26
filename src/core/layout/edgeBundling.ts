/**
 * Edge Bundling Utilities
 *
 * Provides edge bundling algorithms to reduce visual clutter in dense graphs.
 * When the visible edge count exceeds a threshold, parallel edges are grouped
 * and displayed with aggregated count labels.
 */

import { Edge } from '@xyflow/react';

/**
 * Edge bundle representing a group of parallel edges
 */
export interface EdgeBundle {
  /** Bundle identifier */
  id: string;

  /** Source node ID */
  sourceId: string;

  /** Target node ID */
  targetId: string;

  /** Number of edges in bundle */
  count: number;

  /** Edge IDs in bundle */
  edgeIds: string[];

  /** Representative edge (for styling) */
  representativeEdge: Edge;
}

/**
 * Bundling result
 */
export interface BundlingResult {
  /** Bundled edges to display */
  bundledEdges: Edge[];

  /** Number of edges reduced */
  reductionCount: number;

  /** Whether bundling was applied */
  wasBundled: boolean;
}

/**
 * Edge bundling options
 */
export interface EdgeBundlingOptions {
  /** Maximum visible edges before bundling (default: 100) */
  threshold?: number;

  /** Whether to bundle bidirectional edges separately (default: false) */
  bundleBidirectional?: boolean;

  /** Custom edge ID generator */
  edgeIdGenerator?: (bundle: EdgeBundle) => string;
}

/**
 * Default bundling options
 */
const DEFAULT_OPTIONS: Required<EdgeBundlingOptions> = {
  threshold: 100,
  bundleBidirectional: false,
  edgeIdGenerator: (bundle) => `bundle-${bundle.sourceId}-${bundle.targetId}`,
};

/**
 * Apply edge bundling to a set of edges
 *
 * Groups parallel edges (same source and target) into single edges with count labels.
 * Only applies bundling if edge count exceeds threshold.
 *
 * @param edges - Original edges
 * @param options - Bundling options
 * @returns Bundling result with potentially reduced edge set
 */
export function applyEdgeBundling(
  edges: Edge[],
  options: EdgeBundlingOptions = {}
): BundlingResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check if bundling is needed
  if (edges.length <= opts.threshold) {
    return {
      bundledEdges: edges,
      reductionCount: 0,
      wasBundled: false,
    };
  }

  console.log(`[EdgeBundling] Bundling ${edges.length} edges (threshold: ${opts.threshold})`);

  // Group edges by source-target pair
  const edgeGroups = groupEdgesBySourceTarget(edges);

  // Create bundles for groups with multiple edges
  const bundles: EdgeBundle[] = [];
  const singleEdges: Edge[] = [];

  for (const [key, groupEdges] of edgeGroups) {
    if (groupEdges.length > 1) {
      // Create bundle
      const [sourceId, targetId] = key.split('->');
      const bundle: EdgeBundle = {
        id: opts.edgeIdGenerator({
          id: '',
          sourceId,
          targetId,
          count: groupEdges.length,
          edgeIds: groupEdges.map((e) => e.id),
          representativeEdge: groupEdges[0],
        }),
        sourceId,
        targetId,
        count: groupEdges.length,
        edgeIds: groupEdges.map((e) => e.id),
        representativeEdge: groupEdges[0],
      };
      bundles.push(bundle);
    } else {
      // Single edge - keep as is
      singleEdges.push(groupEdges[0]);
    }
  }

  // Convert bundles to edges
  const bundledEdges = bundles.map((bundle) => createBundleEdge(bundle));

  const allEdges = [...bundledEdges, ...singleEdges];
  const reductionCount = edges.length - allEdges.length;

  console.log(
    `[EdgeBundling] Created ${bundles.length} bundles, reduced ${reductionCount} edges`
  );

  return {
    bundledEdges: allEdges,
    reductionCount,
    wasBundled: true,
  };
}

/**
 * Group edges by source-target pair
 */
function groupEdgesBySourceTarget(edges: Edge[]): Map<string, Edge[]> {
  const groups = new Map<string, Edge[]>();

  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    const group = groups.get(key);
    if (group) {
      group.push(edge);
    }
  }

  return groups;
}

/**
 * Create a single edge representing a bundle
 */
function createBundleEdge(bundle: EdgeBundle): Edge {
  const representativeEdge = bundle.representativeEdge;

  return {
    ...representativeEdge,
    id: bundle.id,
    data: {
      ...representativeEdge.data,
      isBundle: true,
      bundleCount: bundle.count,
      bundledEdgeIds: bundle.edgeIds,
    },
    label: `${bundle.count} relationships`,
    style: {
      ...representativeEdge.style,
      strokeWidth: Math.min(2 + bundle.count * 0.5, 6), // Thicker for more edges
    },
    animated: false,
  };
}

/**
 * Check if an edge is a bundle
 */
export function isEdgeBundle(edge: Edge): boolean {
  return Boolean((edge.data as any)?.isBundle);
}

/**
 * Get edge count from bundle
 */
export function getEdgeBundleCount(edge: Edge): number {
  return (edge.data as any)?.bundleCount || 1;
}

/**
 * Get original edge IDs from bundle
 */
export function getBundledEdgeIds(edge: Edge): string[] {
  return (edge.data as any)?.bundledEdgeIds || [edge.id];
}

/**
 * Calculate optimal bundling threshold based on graph size
 *
 * For larger graphs, use more aggressive bundling.
 *
 * @param nodeCount - Number of nodes in graph
 * @param edgeCount - Number of edges in graph
 * @returns Recommended threshold
 */
export function calculateOptimalThreshold(nodeCount: number, _edgeCount: number): number {
  // For small graphs (< 50 nodes), don't bundle
  if (nodeCount < 50) {
    return Infinity;
  }

  // For medium graphs (50-200 nodes), bundle at 100 edges
  if (nodeCount < 200) {
    return 100;
  }

  // For large graphs (200-500 nodes), bundle at 75 edges
  if (nodeCount < 500) {
    return 75;
  }

  // For very large graphs (500+ nodes), bundle at 50 edges
  return 50;
}

/**
 * Unbundle edges back to original set
 *
 * Useful for exporting or detailed analysis.
 *
 * @param bundledEdges - Edges potentially containing bundles
 * @param originalEdges - Original edge set
 * @returns Unbundled edges
 */
export function unbundleEdges(bundledEdges: Edge[], originalEdges: Edge[]): Edge[] {
  const originalEdgeMap = new Map(originalEdges.map((e) => [e.id, e]));
  const unbundledEdges: Edge[] = [];

  for (const edge of bundledEdges) {
    if (isEdgeBundle(edge)) {
      // Expand bundle to original edges
      const edgeIds = getBundledEdgeIds(edge);
      for (const edgeId of edgeIds) {
        const originalEdge = originalEdgeMap.get(edgeId);
        if (originalEdge) {
          unbundledEdges.push(originalEdge);
        }
      }
    } else {
      // Not a bundle, include as-is
      unbundledEdges.push(edge);
    }
  }

  return unbundledEdges;
}
