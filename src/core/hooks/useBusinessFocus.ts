import { useMemo } from 'react';
import type { BusinessGraph } from '../types/businessLayer';

export type FocusMode = 'none' | 'selected' | 'radial' | 'upstream' | 'downstream';

export interface FocusResult {
  focusedNodes: Set<string>;
  focusedEdges: Set<string>;
  dimmedNodes: Set<string>;
}

/**
 * Hook to calculate focused node and edge sets based on selection and focus mode
 *
 * @param selectedNodes - Set of currently selected node IDs
 * @param focusMode - The active focus mode
 * @param focusRadius - Number of relationship hops to include (for 'selected' mode)
 * @param businessGraph - The business graph structure
 * @returns Object containing focused nodes, focused edges, and dimmed nodes
 */
export function useBusinessFocus(
  selectedNodes: Set<string>,
  focusMode: FocusMode,
  focusRadius: number,
  businessGraph: BusinessGraph | null
): FocusResult {
  return useMemo(() => {
    return calculateFocusResult(selectedNodes, focusMode, focusRadius, businessGraph);
  }, [selectedNodes, focusMode, focusRadius, businessGraph]);
}

/**
 * Calculate focus result without React hook (for testing)
 * @internal
 */
export function calculateFocusResult(
  selectedNodes: Set<string>,
  focusMode: FocusMode,
  focusRadius: number,
  businessGraph: BusinessGraph | null
): FocusResult {
  if (!businessGraph || focusMode === 'none' || selectedNodes.size === 0) {
    return {
      focusedNodes: new Set(),
      focusedEdges: new Set(),
      dimmedNodes: new Set()
    };
  }

  const focusedNodes = new Set<string>(selectedNodes);
  const focusedEdges = new Set<string>();

  if (focusMode === 'selected') {
    selectedNodes.forEach(nodeId => {
      addNeighbors(
        nodeId,
        focusRadius,
        businessGraph,
        focusedNodes,
        focusedEdges
      );
    });
  } else if (focusMode === 'upstream') {
    selectedNodes.forEach(nodeId => {
      traceUpstream(nodeId, businessGraph, focusedNodes, focusedEdges);
    });
  } else if (focusMode === 'downstream') {
    selectedNodes.forEach(nodeId => {
      traceDownstream(nodeId, businessGraph, focusedNodes, focusedEdges);
    });
  } else if (focusMode === 'radial') {
    selectedNodes.forEach(nodeId => {
      addNeighbors(nodeId, 1, businessGraph, focusedNodes, focusedEdges);
    });
  }

  const dimmedNodes = new Set<string>();
  businessGraph.nodes.forEach((_, id) => {
    if (!focusedNodes.has(id)) {
      dimmedNodes.add(id);
    }
  });

  return { focusedNodes, focusedEdges, dimmedNodes };
}

/**
 * Add neighbors recursively up to specified number of hops
 */
function addNeighbors(
  nodeId: string,
  hops: number,
  graph: BusinessGraph,
  focusedNodes: Set<string>,
  focusedEdges: Set<string>
): void {
  if (hops === 0) return;

  const neighbors = getDirectNeighbors(nodeId, graph);

  neighbors.nodes.forEach(neighbor => {
    if (!focusedNodes.has(neighbor)) {
      focusedNodes.add(neighbor);
      addNeighbors(neighbor, hops - 1, graph, focusedNodes, focusedEdges);
    }
  });

  neighbors.edges.forEach(edgeId => focusedEdges.add(edgeId));
}

/**
 * Get direct neighbors of a node (connected by incoming or outgoing edges)
 */
function getDirectNeighbors(
  nodeId: string,
  graph: BusinessGraph
): { nodes: Set<string>; edges: Set<string> } {
  const neighborNodes = new Set<string>();
  const neighborEdges = new Set<string>();

  graph.edges.forEach((edge, edgeId) => {
    if (edge.source === nodeId) {
      neighborNodes.add(edge.target);
      neighborEdges.add(edgeId);
    } else if (edge.target === nodeId) {
      neighborNodes.add(edge.source);
      neighborEdges.add(edgeId);
    }
  });

  return { nodes: neighborNodes, edges: neighborEdges };
}

/**
 * Trace all upstream dependencies (nodes that this node depends on)
 */
function traceUpstream(
  nodeId: string,
  graph: BusinessGraph,
  focusedNodes: Set<string>,
  focusedEdges: Set<string>
): void {
  // Find all edges where this node is the target
  graph.edges.forEach((edge, edgeId) => {
    if (edge.target === nodeId && !focusedNodes.has(edge.source)) {
      focusedNodes.add(edge.source);
      focusedEdges.add(edgeId);
      // Recursively trace upstream from this source node
      traceUpstream(edge.source, graph, focusedNodes, focusedEdges);
    }
  });
}

/**
 * Trace all downstream dependents (nodes that depend on this node)
 */
function traceDownstream(
  nodeId: string,
  graph: BusinessGraph,
  focusedNodes: Set<string>,
  focusedEdges: Set<string>
): void {
  // Find all edges where this node is the source
  graph.edges.forEach((edge, edgeId) => {
    if (edge.source === nodeId && !focusedNodes.has(edge.target)) {
      focusedNodes.add(edge.target);
      focusedEdges.add(edgeId);
      // Recursively trace downstream from this target node
      traceDownstream(edge.target, graph, focusedNodes, focusedEdges);
    }
  });
}
