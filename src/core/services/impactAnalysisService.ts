/**
 * Impact Analysis Service
 *
 * Analyzes the downstream impact of changes to business processes.
 * Traces all affected processes, edges, and paths when a process changes.
 */

import { BusinessGraph } from '../types/businessLayer';

/**
 * Impact path (sequence of node IDs)
 */
export interface ImpactPath {
  path: string[];
  length: number;
}

/**
 * Impact analysis result
 */
export interface ImpactAnalysisResult {
  /** Set of all impacted process IDs (including changed nodes) */
  impactedProcesses: Set<string>;

  /** Set of all impacted edge IDs */
  impactedEdges: Set<string>;

  /** All paths from changed nodes to downstream nodes */
  impactPaths: ImpactPath[];

  /** Summary statistics */
  summary: {
    /** Number of directly changed nodes */
    directImpact: number;

    /** Number of indirectly impacted nodes (downstream) */
    indirectImpact: number;

    /** Total number of impacted nodes */
    totalImpact: number;

    /** Maximum path length */
    maxPathLength: number;
  };

  /**
   * Convert result to JSON-serializable format
   * Converts Sets to arrays for proper serialization
   */
  toJSON(): {
    impactedProcesses: string[];
    impactedEdges: string[];
    impactPaths: ImpactPath[];
    summary: ImpactAnalysisResult['summary'];
  };
}

/**
 * Analyze downstream impact of changes to selected nodes
 *
 * @param changedNodeIds - Set of node IDs that have changed
 * @param businessGraph - The complete business graph
 * @returns Impact analysis result with affected processes, edges, and paths
 */
export function analyzeImpact(
  changedNodeIds: Set<string>,
  businessGraph: BusinessGraph
): ImpactAnalysisResult {
  const impactedProcesses = new Set<string>(changedNodeIds);
  const impactedEdges = new Set<string>();
  const impactPaths: ImpactPath[] = [];

  // Trace downstream impact for each changed node
  for (const nodeId of changedNodeIds) {
    const downstream = traceDownstream(nodeId, businessGraph, new Set());

    // Add all downstream nodes to impacted set
    downstream.nodes.forEach((id) => impactedProcesses.add(id));

    // Add all downstream edges to impacted set
    downstream.edges.forEach((id) => impactedEdges.add(id));

    // Add all paths
    downstream.paths.forEach((path) => {
      impactPaths.push({ path, length: path.length });
    });
  }

  // Calculate summary statistics
  const directImpact = changedNodeIds.size;
  const totalImpact = impactedProcesses.size;
  const indirectImpact = totalImpact - directImpact;
  const maxPathLength = impactPaths.length > 0
    ? Math.max(...impactPaths.map((p) => p.length))
    : 0;

  const result: ImpactAnalysisResult = {
    impactedProcesses,
    impactedEdges,
    impactPaths,
    summary: {
      directImpact,
      indirectImpact,
      totalImpact,
      maxPathLength,
    },
    toJSON() {
      return {
        impactedProcesses: Array.from(this.impactedProcesses),
        impactedEdges: Array.from(this.impactedEdges),
        impactPaths: this.impactPaths,
        summary: this.summary,
      };
    },
  };

  return result;
}

/**
 * Trace all downstream nodes and edges reachable from a starting node
 *
 * Uses depth-first search to find all nodes reachable by following outgoing edges.
 *
 * @param nodeId - Starting node ID
 * @param graph - Business graph
 * @param visited - Set of already visited nodes (for cycle detection)
 * @returns Object containing affected nodes, edges, and paths
 */
function traceDownstream(
  nodeId: string,
  graph: BusinessGraph,
  visited: Set<string>
): {
  nodes: Set<string>;
  edges: Set<string>;
  paths: string[][];
} {
  // Prevent infinite loops from circular dependencies
  if (visited.has(nodeId)) {
    return { nodes: new Set(), edges: new Set(), paths: [] };
  }

  visited.add(nodeId);

  const nodes = new Set<string>([nodeId]);
  const edges = new Set<string>();
  const paths: string[][] = [];

  // Find all outgoing edges from this node
  const outgoingEdges = Array.from(graph.edges.values()).filter(
    (edge) => edge.source === nodeId
  );

  // If this is a leaf node (no outgoing edges), return path with just this node
  if (outgoingEdges.length === 0) {
    paths.push([nodeId]);
    return { nodes, edges, paths };
  }

  // Recursively trace each downstream node
  for (const edge of outgoingEdges) {
    edges.add(edge.id);

    const downstream = traceDownstream(edge.target, graph, new Set(visited));

    // Add all downstream nodes
    downstream.nodes.forEach((id) => nodes.add(id));

    // Add all downstream edges
    downstream.edges.forEach((id) => edges.add(id));

    // Build paths by prepending current node to downstream paths
    if (downstream.paths.length === 0) {
      // Target is a leaf node
      paths.push([nodeId, edge.target]);
    } else {
      // Prepend current node to all downstream paths
      downstream.paths.forEach((path) => {
        paths.push([nodeId, ...path]);
      });
    }
  }

  return { nodes, edges, paths };
}

/**
 * Analyze upstream dependencies for a node
 *
 * Finds all nodes that affect the given node (reverse of downstream).
 *
 * @param nodeId - Target node ID
 * @param businessGraph - The complete business graph
 * @returns Set of upstream node IDs
 */
export function analyzeUpstream(
  nodeId: string,
  businessGraph: BusinessGraph
): Set<string> {
  const upstreamNodes = new Set<string>();

  const traceUpstream = (currentNodeId: string, visited: Set<string>) => {
    if (visited.has(currentNodeId)) {
      return;
    }

    visited.add(currentNodeId);

    // Find all incoming edges to this node
    const incomingEdges = Array.from(businessGraph.edges.values()).filter(
      (edge) => edge.target === currentNodeId
    );

    for (const edge of incomingEdges) {
      upstreamNodes.add(edge.source);
      traceUpstream(edge.source, visited);
    }
  };

  traceUpstream(nodeId, new Set());

  return upstreamNodes;
}

/**
 * Find all paths between two nodes
 *
 * @param sourceId - Starting node ID
 * @param targetId - Ending node ID
 * @param businessGraph - The complete business graph
 * @param maxDepth - Maximum path length (default: 10)
 * @returns Array of paths (each path is an array of node IDs)
 */
export function findPathsBetween(
  sourceId: string,
  targetId: string,
  businessGraph: BusinessGraph,
  maxDepth: number = 10
): string[][] {
  const paths: string[][] = [];

  const dfs = (currentId: string, currentPath: string[], visited: Set<string>) => {
    // Prevent cycles
    if (visited.has(currentId)) {
      return;
    }

    // Prevent infinite loops
    if (currentPath.length > maxDepth) {
      return;
    }

    // Add current node to path
    const newPath = [...currentPath, currentId];
    const newVisited = new Set(visited);
    newVisited.add(currentId);

    // Check if we reached the target
    if (currentId === targetId) {
      paths.push(newPath);
      return;
    }

    // Find all outgoing edges from current node
    const outgoingEdges = Array.from(businessGraph.edges.values()).filter(
      (edge) => edge.source === currentId
    );

    // Recursively explore each downstream node
    for (const edge of outgoingEdges) {
      dfs(edge.target, newPath, newVisited);
    }
  };

  dfs(sourceId, [], new Set());

  return paths;
}

/**
 * Isolate a node and its immediate neighbors
 *
 * Returns the set of node IDs that should be visible when isolating a node.
 *
 * @param nodeId - Node to isolate
 * @param businessGraph - The complete business graph
 * @param includeSecondDegree - Whether to include second-degree neighbors
 * @returns Set of visible node IDs (includes the node itself and neighbors)
 */
export function isolateNode(
  nodeId: string,
  businessGraph: BusinessGraph,
  includeSecondDegree: boolean = false
): Set<string> {
  const visibleNodes = new Set<string>([nodeId]);

  // Find immediate neighbors (first degree)
  const firstDegreeNeighbors = new Set<string>();

  for (const edge of businessGraph.edges.values()) {
    if (edge.source === nodeId) {
      firstDegreeNeighbors.add(edge.target);
      visibleNodes.add(edge.target);
    }
    if (edge.target === nodeId) {
      firstDegreeNeighbors.add(edge.source);
      visibleNodes.add(edge.source);
    }
  }

  // Optionally include second-degree neighbors
  if (includeSecondDegree) {
    for (const neighborId of firstDegreeNeighbors) {
      for (const edge of businessGraph.edges.values()) {
        if (edge.source === neighborId) {
          visibleNodes.add(edge.target);
        }
        if (edge.target === neighborId) {
          visibleNodes.add(edge.source);
        }
      }
    }
  }

  return visibleNodes;
}
