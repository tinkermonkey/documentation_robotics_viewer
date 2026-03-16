/**
 * Business Layer Filtering Hook
 *
 * Multi-dimensional filtering for business layer elements using pre-built indices.
 * Designed for <500ms filter operations on 500+ node graphs.
 */

import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { BusinessGraph, BusinessNodeType } from '../types/businessLayer';

/**
 * Business filter configuration
 */
export interface BusinessFilters {
  /** Element types to show (empty = show all) */
  types: Set<BusinessNodeType>;

  /** Business domains to show (empty = show all) */
  domains: Set<string>;

  /** Lifecycle stages to show (empty = show all) */
  lifecycles: Set<'ideation' | 'active' | 'deprecated'>;

  /** Criticality levels to show (empty = show all) */
  criticalities: Set<'high' | 'medium' | 'low'>;
}

/**
 * Filter result with filtered nodes and edges
 */
export interface FilterResult {
  filteredNodes: Node[];
  filteredEdges: Edge[];
  visibleCount: number;
  totalCount: number;
}

/**
 * Fast multi-dimensional filtering using pre-built indices
 *
 * Performance: O(n) where n is the number of nodes, optimized with Set operations
 * Target: <500ms for 500+ nodes
 *
 * @param nodes - All React Flow nodes
 * @param edges - All React Flow edges
 * @param filters - Active filter configuration
 * @param businessGraph - Business graph with indices
 * @returns Filtered nodes and edges
 */
export function useBusinessFilters(
  nodes: Node[],
  edges: Edge[],
  filters: BusinessFilters,
  businessGraph: BusinessGraph | null
): FilterResult {
  return useMemo(() => {
    // No graph = no filtering
    if (!businessGraph) {
      return {
        filteredNodes: nodes,
        filteredEdges: edges,
        visibleCount: nodes.length,
        totalCount: nodes.length,
      };
    }

    const startTime = performance.now();

    // Start with all node IDs
    let visibleIds = new Set<string>(businessGraph.nodes.keys());

    // Apply type filter (if specified)
    if (filters.types.size > 0) {
      const typeMatches = new Set<string>();
      for (const type of filters.types) {
        const typeSet = businessGraph.indices.byType.get(type);
        if (typeSet) {
          typeSet.forEach((id) => typeMatches.add(id));
        }
      }
      visibleIds = new Set([...visibleIds].filter((id) => typeMatches.has(id)));
    }

    // Apply domain filter (if specified)
    if (filters.domains.size > 0) {
      const domainMatches = new Set<string>();
      for (const domain of filters.domains) {
        const domainSet = businessGraph.indices.byDomain.get(domain);
        if (domainSet) {
          domainSet.forEach((id) => domainMatches.add(id));
        }
      }
      visibleIds = new Set([...visibleIds].filter((id) => domainMatches.has(id)));
    }

    // Apply lifecycle filter (if specified)
    if (filters.lifecycles.size > 0) {
      const lifecycleMatches = new Set<string>();
      for (const lifecycle of filters.lifecycles) {
        const lifecycleSet = businessGraph.indices.byLifecycle.get(lifecycle);
        if (lifecycleSet) {
          lifecycleSet.forEach((id) => lifecycleMatches.add(id));
        }
      }
      visibleIds = new Set([...visibleIds].filter((id) => lifecycleMatches.has(id)));
    }

    // Apply criticality filter (if specified)
    if (filters.criticalities.size > 0) {
      const criticalityMatches = new Set<string>();
      for (const criticality of filters.criticalities) {
        const criticalitySet = businessGraph.indices.byCriticality.get(criticality);
        if (criticalitySet) {
          criticalitySet.forEach((id) => criticalityMatches.add(id));
        }
      }
      visibleIds = new Set([...visibleIds].filter((id) => criticalityMatches.has(id)));
    }

    // Filter nodes
    const filteredNodes = nodes.filter((node) => visibleIds.has(node.id));

    // Filter edges (only keep edges where both source and target are visible)
    const filteredEdges = edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log performance warning if filter operation exceeds target
    if (duration > 500) {
      console.warn(
        `[useBusinessFilters] Filter operation took ${duration.toFixed(2)}ms (target: <500ms)`
      );
    }

    return {
      filteredNodes,
      filteredEdges,
      visibleCount: filteredNodes.length,
      totalCount: nodes.length,
    };
  }, [nodes, edges, filters, businessGraph]);
}

/**
 * Extract available filter values from business graph
 *
 * @param businessGraph - Business graph with indices
 * @returns Available filter values for each dimension
 */
export function useAvailableFilters(businessGraph: BusinessGraph | null) {
  return useMemo(() => {
    if (!businessGraph) {
      return {
        types: [] as BusinessNodeType[],
        domains: [] as string[],
        lifecycles: [] as ('ideation' | 'active' | 'deprecated')[],
        criticalities: [] as ('high' | 'medium' | 'low')[],
      };
    }

    return {
      types: Array.from(businessGraph.indices.byType.keys()),
      domains: Array.from(businessGraph.indices.byDomain.keys()),
      lifecycles: Array.from(businessGraph.indices.byLifecycle.keys()) as ('ideation' | 'active' | 'deprecated')[],
      criticalities: Array.from(businessGraph.indices.byCriticality.keys()) as ('high' | 'medium' | 'low')[],
    };
  }, [businessGraph]);
}
