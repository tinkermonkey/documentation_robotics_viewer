/**
 * C4ViewTransformer Service
 *
 * Converts C4Graph intermediate representation to ReactFlow nodes and edges.
 * Applies layout algorithms, filtering, focus+context, and semantic zoom.
 *
 * Key responsibilities:
 * - Filter nodes by C4 view level (context/container/component/code)
 * - Apply user filters (container type, technology stack)
 * - Apply focus+context highlighting
 * - Compute layout using various algorithms (hierarchical, force, orthogonal, manual)
 * - Convert to ReactFlow nodes/edges with styling and data
 * - Support semantic zoom for detail level adjustment
 *
 * Architecture Decision: Follows MotivationGraphTransformer pattern with
 * layout caching, semantic zoom integration, and path highlighting support.
 *
 * Note on Layout Algorithms:
 * - 'orthogonal': Currently a placeholder that uses hierarchical layout.
 *   True orthogonal edge routing would require a more sophisticated edge
 *   router that is not yet implemented. The edge type remains 'smoothstep'
 *   for now. See FR4.1 for future orthogonal routing implementation.
 */

import { Node, Edge, MarkerType } from '@xyflow/react';
import dagre from 'dagre';

/**
 * Debug logging flag - set to true for verbose console output during development
 * Matches the pattern established in c4Parser.ts
 */
const DEBUG_LOGGING = false;
import {
  C4Graph,
  C4Node,
  C4Edge,
  C4Type,
  CommunicationDirection,
  C4TransformerOptions,
  C4TransformResult,
  C4BreadcrumbSegment,
  C4NodeDetailLevel,
  ContainerType,

  C4_SCENARIO_PRESETS,
  DEFAULT_C4_TRANSFORMER_OPTIONS,
  DEFAULT_C4_LAYOUT_OPTIONS,
} from '../types/c4Graph';

/**
 * Node dimensions for layout calculation
 * CRITICAL: These MUST match the actual rendered component sizes
 */
export const C4_CONTAINER_NODE_WIDTH = 280;
export const C4_CONTAINER_NODE_HEIGHT = 180;
export const C4_COMPONENT_NODE_WIDTH = 240;
export const C4_COMPONENT_NODE_HEIGHT = 140;
export const C4_EXTERNAL_ACTOR_NODE_WIDTH = 160;
export const C4_EXTERNAL_ACTOR_NODE_HEIGHT = 120;
export const C4_SYSTEM_BOUNDARY_PADDING = 40;

/**
 * Layout cache configuration
 */
const LAYOUT_CACHE_MAX_SIZE = 10;

/**
 * Semantic zoom thresholds for detail level transitions
 * - Below MINIMAL_THRESHOLD: Show minimal detail (name only)
 * - Between MINIMAL and MEDIUM: Show medium detail (name + type)
 * - Above MEDIUM_THRESHOLD: Show full detail (all information)
 */
const SEMANTIC_ZOOM_MINIMAL_THRESHOLD = 0.5;
const SEMANTIC_ZOOM_MEDIUM_THRESHOLD = 0.8;

/**
 * Edge bundling configuration
 * Edges between the same pair of nodes are bundled when count >= threshold
 */
const EDGE_BUNDLE_THRESHOLD = 3;

/**
 * Position interface for layout
 */
interface Position {
  x: number;
  y: number;
}

/**
 * Layout result from layout algorithms
 */
interface LayoutResult {
  nodePositions: Map<string, Position>;
  bounds: {
    width: number;
    height: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

/**
 * Filtered C4 graph for view-level filtering
 */
interface FilteredC4Graph {
  nodes: Map<string, C4Node>;
  edges: Map<string, C4Edge>;
}

/**
 * C4ViewTransformer class
 * Transforms C4Graph to ReactFlow format with filtering, layout, and styling
 */
export class C4ViewTransformer {
  private options: C4TransformerOptions;
  private layoutCache: Map<string, LayoutResult> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(options: Partial<C4TransformerOptions> = {}) {
    this.options = { ...DEFAULT_C4_TRANSFORMER_OPTIONS, ...options };
  }

  /**
   * Update transformer options
   */
  setOptions(options: Partial<C4TransformerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Transform C4Graph to ReactFlow format
   *
   * Transformation pipeline:
   * 1. Apply view level filtering (context/container/component)
   * 2. Apply user filters (container type, technology)
   * 3. Apply scenario preset filtering (if active)
   * 4. Apply changeset filter (if active)
   * 5. Compute layout
   * 6. Create ReactFlow nodes with styling
   * 7. Create ReactFlow edges with styling
   * 8. Apply focus+context and path highlighting
   */
  transform(graph: C4Graph): C4TransformResult {
    if (DEBUG_LOGGING) {
      console.log('[C4ViewTransformer] Transforming graph with', graph.nodes.size, 'nodes');
    }

    // Step 1: Apply view level filtering
    const viewFilteredGraph = this.applyViewLevelFilter(graph);
    if (DEBUG_LOGGING) {
      console.log(
        `[C4ViewTransformer] View level ${this.options.viewLevel}: ${viewFilteredGraph.nodes.size} nodes after filtering`
      );
    }

    // Step 2: Apply user filters
    let filteredGraph = this.applyUserFilters(viewFilteredGraph, graph);
    if (DEBUG_LOGGING) {
      console.log(
        `[C4ViewTransformer] User filters: ${filteredGraph.nodes.size} nodes after filtering`
      );
    }

    // Step 3: Apply scenario preset if active
    if (this.options.scenarioPreset) {
      filteredGraph = this.applyScenarioPreset(filteredGraph, graph);
      if (DEBUG_LOGGING) {
        console.log(
          `[C4ViewTransformer] Scenario preset ${this.options.scenarioPreset}: ${filteredGraph.nodes.size} nodes after filtering`
        );
      }
    }

    // Step 4: Apply changeset filter if active
    if (this.options.showOnlyChangeset) {
      filteredGraph = this.applyChangesetFilter(filteredGraph);
      if (DEBUG_LOGGING) {
        console.log(
          `[C4ViewTransformer] Changeset filter: ${filteredGraph.nodes.size} nodes after filtering`
        );
      }
    }

    // Step 5: Compute layout with caching
    const layoutResult = this.computeLayoutWithCache(filteredGraph);

    // Step 6: Get semantic zoom detail level
    const detailLevel = this.getDetailLevel();

    // Step 7: Create ReactFlow nodes (includes warnings for missing positions)
    const { nodes, warnings } = this.createReactFlowNodes(filteredGraph, layoutResult, detailLevel, graph);

    // Step 8: Create ReactFlow edges
    const edges = this.createReactFlowEdges(filteredGraph, graph);

    // Step 9: Build breadcrumb
    const breadcrumb = this.buildBreadcrumb(graph);

    if (DEBUG_LOGGING) {
      console.log('[C4ViewTransformer] Transform complete:', {
        nodes: nodes.length,
        edges: edges.length,
        bounds: layoutResult.bounds,
        cacheHitRate: this.getCacheHitRate(),
        warnings: warnings.length,
      });
    }

    return {
      nodes,
      edges,
      bounds: layoutResult.bounds,
      breadcrumb,
      visibleNodeCount: nodes.length,
      visibleEdgeCount: edges.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Apply view level filtering based on C4 abstraction level
   */
  private applyViewLevelFilter(graph: C4Graph): FilteredC4Graph {
    const { viewLevel, selectedContainerId, selectedComponentId } = this.options;

    const filteredNodes = new Map<string, C4Node>();
    const filteredEdges = new Map<string, C4Edge>();

    switch (viewLevel) {
      case 'context':
        // System Context: Show containers + external actors only
        for (const [nodeId, node] of graph.nodes) {
          if (node.c4Type === C4Type.Container || node.c4Type === C4Type.External) {
            filteredNodes.set(nodeId, node);
          }
        }
        break;

      case 'container':
        // Container View: Show components within selected container
        if (selectedContainerId) {
          // Include the selected container itself
          const container = graph.nodes.get(selectedContainerId);
          if (container) {
            filteredNodes.set(selectedContainerId, container);
          }

          // Include all components that belong to this container
          const componentIds = graph.indexes.containerComponents.get(selectedContainerId);
          if (componentIds) {
            for (const componentId of componentIds) {
              const component = graph.nodes.get(componentId);
              if (component) {
                filteredNodes.set(componentId, component);
              }
            }
          }

          // Include external actors that connect to this container
          for (const [nodeId, node] of graph.nodes) {
            if (node.c4Type === C4Type.External) {
              // Check if external actor has edge to/from selected container or its components
              const hasConnection = this.hasConnectionToSet(
                nodeId,
                new Set([selectedContainerId, ...(componentIds || [])]),
                graph
              );
              if (hasConnection) {
                filteredNodes.set(nodeId, node);
              }
            }
          }
        } else {
          // No container selected, show all containers (same as context view)
          for (const [nodeId, node] of graph.nodes) {
            if (node.c4Type === C4Type.Container || node.c4Type === C4Type.External) {
              filteredNodes.set(nodeId, node);
            }
          }
        }
        break;

      case 'component':
        // Component View: Show internal structure of selected component
        if (selectedComponentId) {
          const component = graph.nodes.get(selectedComponentId);
          if (component) {
            filteredNodes.set(selectedComponentId, component);
          }
          // In future, could show code-level details here
        } else if (selectedContainerId) {
          // Fall back to container view
          return this.applyViewLevelFilter({
            ...graph,
            // Simulate selecting the container
          });
        }
        break;

      case 'code':
        // Code View: Show code-level structure (not fully implemented)
        // For now, show same as component view
        if (selectedComponentId) {
          const component = graph.nodes.get(selectedComponentId);
          if (component) {
            filteredNodes.set(selectedComponentId, component);
          }
        }
        break;
    }

    // Filter edges - only include if both source and target are in filtered nodes
    for (const [edgeId, edge] of graph.edges) {
      if (filteredNodes.has(edge.sourceId) && filteredNodes.has(edge.targetId)) {
        filteredEdges.set(edgeId, edge);
      }
    }

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }

  /**
   * Apply user filters (container type, technology stack)
   *
   * Note: The _graph parameter (full C4Graph) is reserved for future optimization.
   * Currently, we iterate over the already-filtered nodes for user filtering.
   * The full graph's indexes (e.g., byContainerType, byTechnology) could enable
   * O(1) set intersection for filtering, but the current implementation is
   * sufficient for typical graph sizes. The parameter is kept for API consistency
   * and future optimization opportunities.
   */
  private applyUserFilters(filtered: FilteredC4Graph, _graph: C4Graph): FilteredC4Graph {
    const { filterOptions } = this.options;
    const { containerTypes, technologyStack } = filterOptions;

    // If no filters active, return as-is
    if (
      (!containerTypes || containerTypes.size === 0) &&
      (!technologyStack || technologyStack.size === 0)
    ) {
      return filtered;
    }

    const resultNodes = new Map<string, C4Node>();
    const resultEdges = new Map<string, C4Edge>();

    for (const [nodeId, node] of filtered.nodes) {
      let includeNode = true;

      // Filter by container type (only applies to containers)
      if (containerTypes && containerTypes.size > 0 && node.containerType) {
        if (!containerTypes.has(node.containerType)) {
          includeNode = false;
        }
      }

      // Filter by technology stack
      if (includeNode && technologyStack && technologyStack.size > 0) {
        // Check if node has any matching technology
        const hasMatchingTech = node.technology.some((tech) => technologyStack.has(tech));
        if (!hasMatchingTech && node.technology.length > 0) {
          includeNode = false;
        }
        // If node has no technology, still include it (don't filter out unknowns)
      }

      // External actors are always included (not filtered by type/tech)
      if (node.c4Type === C4Type.External) {
        includeNode = true;
      }

      if (includeNode) {
        resultNodes.set(nodeId, node);
      }
    }

    // Filter edges
    for (const [edgeId, edge] of filtered.edges) {
      if (resultNodes.has(edge.sourceId) && resultNodes.has(edge.targetId)) {
        resultEdges.set(edgeId, edge);
      }
    }

    return {
      nodes: resultNodes,
      edges: resultEdges,
    };
  }

  /**
   * Check if a node has any connection to a set of target nodes
   */
  private hasConnectionToSet(nodeId: string, targetIds: Set<string>, graph: C4Graph): boolean {
    for (const edge of graph.edges.values()) {
      if (edge.sourceId === nodeId && targetIds.has(edge.targetId)) {
        return true;
      }
      if (edge.targetId === nodeId && targetIds.has(edge.sourceId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Apply scenario preset filtering
   * Each preset applies specific rules to highlight or filter elements
   */
  private applyScenarioPreset(filtered: FilteredC4Graph, fullGraph: C4Graph): FilteredC4Graph {
    const preset = this.options.scenarioPreset;
    if (!preset) return filtered;

    const presetConfig = C4_SCENARIO_PRESETS.find(p => p.id === preset);
    if (!presetConfig) return filtered;

    const resultNodes = new Map<string, C4Node>();
    const resultEdges = new Map<string, C4Edge>();

    // Apply container type filtering if specified
    const containerTypeFilter = presetConfig.containerTypes
      ? new Set(presetConfig.containerTypes)
      : null;

    // Apply protocol filtering if specified
    const protocolFilter = presetConfig.highlightProtocols
      ? new Set(presetConfig.highlightProtocols)
      : null;

    // Filter nodes based on preset rules
    for (const [nodeId, node] of filtered.nodes) {
      let includeNode = true;

      // Container type filtering
      if (containerTypeFilter && node.containerType) {
        // For data flow preset, only include data-related containers
        if (presetConfig.dataFlowOnly) {
          includeNode = containerTypeFilter.has(node.containerType as ContainerType);
        }
      }

      // External interfaces only filtering
      if (presetConfig.externalInterfacesOnly && node.c4Type === C4Type.Container) {
        // Check if this container has external-facing edges
        const hasExternalConnection = this.hasExternalConnection(nodeId, fullGraph);
        if (!hasExternalConnection) {
          includeNode = false;
        }
      }

      // External actors are always included
      if (node.c4Type === C4Type.External) {
        includeNode = true;
      }

      // For data flow preset, include containers that connect to data stores
      if (presetConfig.dataFlowOnly && !containerTypeFilter?.has(node.containerType as ContainerType)) {
        // Check if this container connects to a data container
        const connectsToDataStore = this.connectsToContainerTypes(
          nodeId,
          containerTypeFilter || new Set(),
          fullGraph
        );
        if (connectsToDataStore) {
          includeNode = true;
        }
      }

      if (includeNode) {
        resultNodes.set(nodeId, node);
      }
    }

    // Filter edges based on preset rules
    for (const [edgeId, edge] of filtered.edges) {
      // Both endpoints must be in result nodes
      if (!resultNodes.has(edge.sourceId) || !resultNodes.has(edge.targetId)) {
        continue;
      }

      let includeEdge = true;

      // Protocol filtering for data flow preset
      if (protocolFilter && presetConfig.dataFlowOnly) {
        // Only include edges with data-related protocols
        if (!protocolFilter.has(edge.protocol)) {
          // Still include if connected to a data container
          const sourceNode = resultNodes.get(edge.sourceId);
          const targetNode = resultNodes.get(edge.targetId);
          const sourceIsDataStore = sourceNode && containerTypeFilter?.has(sourceNode.containerType as ContainerType);
          const targetIsDataStore = targetNode && containerTypeFilter?.has(targetNode.containerType as ContainerType);
          if (!sourceIsDataStore && !targetIsDataStore) {
            includeEdge = false;
          }
        }
      }

      if (includeEdge) {
        resultEdges.set(edgeId, edge);
      }
    }

    return {
      nodes: resultNodes,
      edges: resultEdges,
    };
  }

  /**
   * Check if a node has external-facing connections (to external actors)
   */
  private hasExternalConnection(nodeId: string, graph: C4Graph): boolean {
    for (const edge of graph.edges.values()) {
      const isSource = edge.sourceId === nodeId;
      const isTarget = edge.targetId === nodeId;

      if (isSource) {
        const targetNode = graph.nodes.get(edge.targetId);
        if (targetNode?.c4Type === C4Type.External) {
          return true;
        }
      }

      if (isTarget) {
        const sourceNode = graph.nodes.get(edge.sourceId);
        if (sourceNode?.c4Type === C4Type.External) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if a node connects to any containers of the specified types
   */
  private connectsToContainerTypes(
    nodeId: string,
    containerTypes: Set<ContainerType>,
    graph: C4Graph
  ): boolean {
    for (const edge of graph.edges.values()) {
      const isSource = edge.sourceId === nodeId;
      const isTarget = edge.targetId === nodeId;

      if (isSource) {
        const targetNode = graph.nodes.get(edge.targetId);
        if (targetNode && containerTypes.has(targetNode.containerType as ContainerType)) {
          return true;
        }
      }

      if (isTarget) {
        const sourceNode = graph.nodes.get(edge.sourceId);
        if (sourceNode && containerTypes.has(sourceNode.containerType as ContainerType)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Apply changeset filter - show only elements with changeset status
   */
  private applyChangesetFilter(filtered: FilteredC4Graph): FilteredC4Graph {
    const resultNodes = new Map<string, C4Node>();
    const resultEdges = new Map<string, C4Edge>();

    // Include nodes with changeset status
    for (const [nodeId, node] of filtered.nodes) {
      if (node.changesetStatus) {
        resultNodes.set(nodeId, node);
      }
    }

    // Include edges with changeset status or connecting changed nodes
    for (const [edgeId, edge] of filtered.edges) {
      if (edge.changesetStatus) {
        resultEdges.set(edgeId, edge);
      } else if (resultNodes.has(edge.sourceId) && resultNodes.has(edge.targetId)) {
        resultEdges.set(edgeId, edge);
      }
    }

    return {
      nodes: resultNodes,
      edges: resultEdges,
    };
  }

  /**
   * Compute layout with caching
   *
   * Note: Manual layout is excluded from caching because the existingPositions
   * can change between calls (user drags nodes), and the cache key would need
   * to include a hash of all positions to detect changes correctly.
   */
  private computeLayoutWithCache(filtered: FilteredC4Graph): LayoutResult {
    // Skip caching for manual layout - positions can change between calls
    // and would require hashing all positions for proper cache invalidation
    if (this.options.layoutAlgorithm === 'manual') {
      return this.computeLayout(filtered);
    }

    const cacheKey = this.generateLayoutCacheKey(filtered);

    const cachedLayout = this.layoutCache.get(cacheKey);
    if (cachedLayout) {
      this.cacheHits++;
      if (DEBUG_LOGGING) {
        console.log(`[C4ViewTransformer] Layout cache hit (rate: ${this.getCacheHitRate()}%)`);
      }
      return cachedLayout;
    }

    this.cacheMisses++;
    const layoutResult = this.computeLayout(filtered);

    // Store in cache (limit to max entries)
    if (this.layoutCache.size >= LAYOUT_CACHE_MAX_SIZE) {
      const firstKey = this.layoutCache.keys().next().value;
      if (firstKey) {
        this.layoutCache.delete(firstKey);
      }
    }
    this.layoutCache.set(cacheKey, layoutResult);

    return layoutResult;
  }

  /**
   * Generate cache key for layout
   */
  private generateLayoutCacheKey(filtered: FilteredC4Graph): string {
    const nodeIds = Array.from(filtered.nodes.keys()).sort().join(',');
    const edgeIds = Array.from(filtered.edges.keys()).sort().join(',');
    return `${this.options.layoutAlgorithm}:${nodeIds}:${edgeIds}`;
  }

  /**
   * Compute layout based on selected algorithm
   */
  private computeLayout(filtered: FilteredC4Graph): LayoutResult {
    const { layoutAlgorithm, existingPositions } = this.options;

    if (DEBUG_LOGGING) {
      console.log(`[C4ViewTransformer] Computing ${layoutAlgorithm} layout`);
    }

    switch (layoutAlgorithm) {
      case 'hierarchical':
        return this.computeHierarchicalLayout(filtered);

      case 'force':
        return this.computeForceDirectedLayout(filtered);

      case 'orthogonal':
        // Orthogonal layout is a placeholder - uses hierarchical layout.
        // True orthogonal edge routing is not yet implemented.
        // See file header documentation for details.
        return this.computeHierarchicalLayout(filtered);

      case 'manual':
        if (existingPositions && existingPositions.size > 0) {
          return this.computeManualLayout(filtered, existingPositions);
        }
        // Fall back to hierarchical if no positions
        if (DEBUG_LOGGING) {
          console.log('[C4ViewTransformer] No existing positions for manual layout, using hierarchical');
        }
        return this.computeHierarchicalLayout(filtered);

      default:
        return this.computeHierarchicalLayout(filtered);
    }
  }

  /**
   * Compute hierarchical layout using dagre
   */
  private computeHierarchicalLayout(filtered: FilteredC4Graph): LayoutResult {
    const opts = DEFAULT_C4_LAYOUT_OPTIONS;
    const { width = 1200, height = 800, padding = 50 } = opts;

    // Early return for empty graphs with valid default bounds
    if (filtered.nodes.size === 0) {
      return {
        nodePositions: new Map(),
        bounds: {
          width: 0,
          height: 0,
          minX: 0,
          minY: 0,
          maxX: 0,
          maxY: 0,
        },
      };
    }

    // Use dagre for hierarchical layout
    const g = new dagre.graphlib.Graph();

    // Configure graph with C4-optimized spacing
    g.setGraph({
      rankdir: opts.rankDir || 'TB',
      align: 'UL',
      nodesep: opts.nodeSep || 120, // Wider horizontal spacing for C4 nodes
      ranksep: opts.rankSep || 150, // Taller vertical spacing for readability
      marginx: padding,
      marginy: padding,
    });

    g.setDefaultEdgeLabel(() => ({}));

    // Add nodes to dagre graph
    for (const [nodeId, node] of filtered.nodes) {
      const dimensions = this.getNodeDimensions(node);
      g.setNode(nodeId, {
        width: dimensions.width,
        height: dimensions.height,
        label: node.name,
      });
    }

    // Add edges to dagre graph
    for (const edge of filtered.edges.values()) {
      g.setEdge(edge.sourceId, edge.targetId);
    }

    // Run dagre layout
    dagre.layout(g);

    // Extract positions
    const positions = new Map<string, Position>();
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const [nodeId, node] of filtered.nodes) {
      const dagreNode = g.node(nodeId);
      if (dagreNode) {
        // Dagre returns center positions
        positions.set(nodeId, {
          x: dagreNode.x,
          y: dagreNode.y,
        });

        const dimensions = this.getNodeDimensions(node);
        minX = Math.min(minX, dagreNode.x - dimensions.width / 2);
        minY = Math.min(minY, dagreNode.y - dimensions.height / 2);
        maxX = Math.max(maxX, dagreNode.x + dimensions.width / 2);
        maxY = Math.max(maxY, dagreNode.y + dimensions.height / 2);
      }
    }

    // Handle disconnected nodes
    this.handleDisconnectedNodes(filtered, positions, width, height, padding);

    // Recalculate bounds
    for (const [nodeId, pos] of positions) {
      const node = filtered.nodes.get(nodeId);
      if (node) {
        const dimensions = this.getNodeDimensions(node);
        minX = Math.min(minX, pos.x - dimensions.width / 2);
        minY = Math.min(minY, pos.y - dimensions.height / 2);
        maxX = Math.max(maxX, pos.x + dimensions.width / 2);
        maxY = Math.max(maxY, pos.y + dimensions.height / 2);
      }
    }

    return {
      nodePositions: positions,
      bounds: {
        width: maxX - minX + 2 * padding,
        height: maxY - minY + 2 * padding,
        minX,
        minY,
        maxX,
        maxY,
      },
    };
  }

  /**
   * Simple deterministic hash function for consistent initial positions
   * Uses a basic string hash to generate a value between 0 and 1
   */
  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Normalize to 0-1 range
    return Math.abs(hash % 10000) / 10000;
  }

  /**
   * Compute force-directed layout
   *
   * Uses deterministic initial positions based on node IDs to ensure
   * consistent layouts when the same graph is transformed multiple times.
   */
  private computeForceDirectedLayout(filtered: FilteredC4Graph): LayoutResult {
    const opts = DEFAULT_C4_LAYOUT_OPTIONS;
    const { width = 1200, height = 800, padding = 50 } = opts;

    // Early return for empty graphs with valid default bounds
    if (filtered.nodes.size === 0) {
      return {
        nodePositions: new Map(),
        bounds: {
          width: 0,
          height: 0,
          minX: 0,
          minY: 0,
          maxX: 0,
          maxY: 0,
        },
      };
    }

    // Initialize positions and velocities with deterministic positions
    // based on node IDs for consistent layouts
    const positions = new Map<string, Position>();
    const velocities = new Map<string, { vx: number; vy: number }>();

    for (const [nodeId] of filtered.nodes) {
      // Use deterministic hash-based positions instead of random
      const hashX = this.hashStringToNumber(nodeId + '_x');
      const hashY = this.hashStringToNumber(nodeId + '_y');
      positions.set(nodeId, {
        x: padding + hashX * (width - 2 * padding),
        y: padding + hashY * (height - 2 * padding),
      });
      velocities.set(nodeId, { vx: 0, vy: 0 });
    }

    // Simulation parameters
    const iterations = opts.iterations || 150;
    const linkDistance = opts.linkDistance || 250;
    const chargeStrength = opts.chargeStrength || -600;
    const centerForce = 0.1;

    let alpha = 1.0;
    const alphaDecay = 1 - Math.pow(0.001, 1 / iterations);

    // Run simulation
    for (let iter = 0; iter < iterations; iter++) {
      // Center force
      for (const [nodeId, pos] of positions) {
        const vel = velocities.get(nodeId)!;
        vel.vx += ((width / 2 - pos.x) * centerForce * alpha);
        vel.vy += ((height / 2 - pos.y) * centerForce * alpha);
      }

      // Charge force (repulsion)
      const nodeIds = Array.from(filtered.nodes.keys());
      for (let i = 0; i < nodeIds.length; i++) {
        const id1 = nodeIds[i];
        const pos1 = positions.get(id1)!;
        const vel1 = velocities.get(id1)!;

        for (let j = i + 1; j < nodeIds.length; j++) {
          const id2 = nodeIds[j];
          const pos2 = positions.get(id2)!;
          const vel2 = velocities.get(id2)!;

          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = (chargeStrength * alpha) / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          vel1.vx -= fx;
          vel1.vy -= fy;
          vel2.vx += fx;
          vel2.vy += fy;
        }
      }

      // Link force (attraction)
      for (const edge of filtered.edges.values()) {
        const pos1 = positions.get(edge.sourceId);
        const pos2 = positions.get(edge.targetId);
        if (!pos1 || !pos2) continue;

        const vel1 = velocities.get(edge.sourceId)!;
        const vel2 = velocities.get(edge.targetId)!;

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = (distance - linkDistance) * 0.1 * alpha;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        vel1.vx += fx;
        vel1.vy += fy;
        vel2.vx -= fx;
        vel2.vy -= fy;
      }

      // Apply velocities with damping
      const damping = 0.6;
      for (const [nodeId, pos] of positions) {
        const vel = velocities.get(nodeId)!;
        pos.x += vel.vx;
        pos.y += vel.vy;
        vel.vx *= damping;
        vel.vy *= damping;
      }

      alpha *= (1 - alphaDecay);
    }

    // Calculate bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const [nodeId, pos] of positions) {
      const node = filtered.nodes.get(nodeId);
      if (node) {
        const dimensions = this.getNodeDimensions(node);
        minX = Math.min(minX, pos.x - dimensions.width / 2);
        minY = Math.min(minY, pos.y - dimensions.height / 2);
        maxX = Math.max(maxX, pos.x + dimensions.width / 2);
        maxY = Math.max(maxY, pos.y + dimensions.height / 2);
      }
    }

    return {
      nodePositions: positions,
      bounds: {
        width: maxX - minX + 2 * padding,
        height: maxY - minY + 2 * padding,
        minX,
        minY,
        maxX,
        maxY,
      },
    };
  }

  /**
   * Compute manual layout from existing positions
   */
  private computeManualLayout(
    filtered: FilteredC4Graph,
    existingPositions: Map<string, { x: number; y: number }>
  ): LayoutResult {
    const opts = DEFAULT_C4_LAYOUT_OPTIONS;
    const { width = 1200, height = 800, padding = 50 } = opts;

    // Early return for empty graphs with valid default bounds
    if (filtered.nodes.size === 0) {
      return {
        nodePositions: new Map(),
        bounds: {
          width: 0,
          height: 0,
          minX: 0,
          minY: 0,
          maxX: 0,
          maxY: 0,
        },
      };
    }

    const positions = new Map<string, Position>();

    // Use existing positions for known nodes
    for (const [nodeId] of filtered.nodes) {
      const existingPos = existingPositions.get(nodeId);
      if (existingPos) {
        positions.set(nodeId, { ...existingPos });
      } else {
        // New node - place at center
        positions.set(nodeId, {
          x: width / 2,
          y: height / 2,
        });
      }
    }

    // Calculate bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const [nodeId, pos] of positions) {
      const node = filtered.nodes.get(nodeId);
      if (node) {
        const dimensions = this.getNodeDimensions(node);
        minX = Math.min(minX, pos.x - dimensions.width / 2);
        minY = Math.min(minY, pos.y - dimensions.height / 2);
        maxX = Math.max(maxX, pos.x + dimensions.width / 2);
        maxY = Math.max(maxY, pos.y + dimensions.height / 2);
      }
    }

    return {
      nodePositions: positions,
      bounds: {
        width: maxX - minX + 2 * padding,
        height: maxY - minY + 2 * padding,
        minX,
        minY,
        maxX,
        maxY,
      },
    };
  }

  /**
   * Handle disconnected nodes by placing them in a ring
   */
  private handleDisconnectedNodes(
    filtered: FilteredC4Graph,
    positions: Map<string, Position>,
    width: number,
    height: number,
    padding: number
  ): void {
    const disconnected: string[] = [];
    for (const nodeId of filtered.nodes.keys()) {
      if (!positions.has(nodeId)) {
        disconnected.push(nodeId);
      }
    }

    if (disconnected.length > 0) {
      if (DEBUG_LOGGING) {
        console.log(`[C4ViewTransformer] Positioning ${disconnected.length} disconnected nodes`);
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - padding;
      const angleStep = (2 * Math.PI) / disconnected.length;

      disconnected.forEach((nodeId, index) => {
        const angle = index * angleStep;
        positions.set(nodeId, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
      });
    }
  }

  /**
   * Get node dimensions based on C4 type
   */
  private getNodeDimensions(node: C4Node): { width: number; height: number } {
    switch (node.c4Type) {
      case C4Type.Container:
        return { width: C4_CONTAINER_NODE_WIDTH, height: C4_CONTAINER_NODE_HEIGHT };
      case C4Type.Component:
        return { width: C4_COMPONENT_NODE_WIDTH, height: C4_COMPONENT_NODE_HEIGHT };
      case C4Type.External:
        return { width: C4_EXTERNAL_ACTOR_NODE_WIDTH, height: C4_EXTERNAL_ACTOR_NODE_HEIGHT };
      default:
        return { width: C4_CONTAINER_NODE_WIDTH, height: C4_CONTAINER_NODE_HEIGHT };
    }
  }

  /**
   * Get semantic zoom detail level
   */
  private getDetailLevel(): C4NodeDetailLevel {
    const { semanticZoom } = this.options;

    if (!semanticZoom.enabled) {
      return 'full';
    }

    const scale = semanticZoom.currentScale;

    if (scale < SEMANTIC_ZOOM_MINIMAL_THRESHOLD) {
      return 'minimal';
    } else if (scale < SEMANTIC_ZOOM_MEDIUM_THRESHOLD) {
      return 'medium';
    } else {
      return 'full';
    }
  }

  /**
   * Create ReactFlow nodes from filtered C4 graph
   *
   * Note: The _fullGraph parameter is reserved for future use when we need
   * to access the full graph context (e.g., for showing relationship counts
   * to nodes outside the current view). Currently unused but kept for API
   * consistency with MotivationGraphTransformer.
   *
   * @returns Object with nodes array and warnings array
   */
  private createReactFlowNodes(
    filtered: FilteredC4Graph,
    layoutResult: LayoutResult,
    detailLevel: C4NodeDetailLevel,
    _fullGraph: C4Graph
  ): { nodes: Node[]; warnings: string[] } {
    const nodes: Node[] = [];
    const warnings: string[] = [];
    const { focusContext, pathHighlighting } = this.options;

    for (const [nodeId, node] of filtered.nodes) {
      const position = layoutResult.nodePositions.get(nodeId);
      if (!position) {
        const warning = `No position for node ${nodeId} (${node.name})`;
        warnings.push(warning);
        if (DEBUG_LOGGING) {
          console.warn(`[C4ViewTransformer] ${warning}`);
        }
        continue;
      }

      // Determine node type for ReactFlow
      const nodeType = this.getReactFlowNodeType(node);

      // Create node data
      const nodeData = this.createNodeData(node, detailLevel);

      // Apply focus+context highlighting
      let opacity = 1.0;
      if (focusContext?.enabled && focusContext.focusedNodeId) {
        if (nodeId === focusContext.focusedNodeId) {
          opacity = 1.0;
        } else {
          opacity = focusContext.dimmedOpacity || 0.3;
        }
      }

      // Apply path highlighting
      if (pathHighlighting && pathHighlighting.mode !== 'none') {
        const highlightedNodes = pathHighlighting.highlightedNodeIds;
        if (highlightedNodes && highlightedNodes.size > 0) {
          if (highlightedNodes.has(nodeId)) {
            opacity = 1.0;
            nodeData.isHighlighted = true;
          } else {
            opacity = 0.3;
          }
        }
      }

      nodeData.opacity = opacity;
      nodeData.detailLevel = detailLevel;

      // Convert from center to top-left position
      const dimensions = this.getNodeDimensions(node);
      const topLeftPosition = {
        x: position.x - dimensions.width / 2,
        y: position.y - dimensions.height / 2,
      };

      nodes.push({
        id: nodeId,
        type: nodeType,
        position: topLeftPosition,
        data: nodeData,
        draggable: true,
        selectable: true,
      } as Node);
    }

    return { nodes, warnings };
  }

  /**
   * Get ReactFlow node type for C4 node
   */
  private getReactFlowNodeType(node: C4Node): string {
    switch (node.c4Type) {
      case C4Type.Container:
        return 'c4Container';
      case C4Type.Component:
        return 'c4Component';
      case C4Type.External:
        return 'c4ExternalActor';
      case C4Type.System:
        return 'c4Container'; // System boundary shown as special container
      case C4Type.Deployment:
        return 'c4DeploymentNode';
      default:
        return 'c4Container';
    }
  }

  /**
   * Create node data for ReactFlow
   */
  private createNodeData(node: C4Node, detailLevel: C4NodeDetailLevel): Record<string, any> {
    const baseData = {
      label: node.name,
      elementId: node.id,
      c4Type: node.c4Type,
      containerType: node.containerType,
      description: node.description,
      technology: node.technology,
      boundary: node.boundary,
      sourceElement: node.sourceElement,
      changesetStatus: node.changesetStatus,
      detailLevel,
      // Styling
      fill: this.getNodeFill(node),
      stroke: this.getNodeStroke(node),
    };

    // Add type-specific data
    if (node.c4Type === C4Type.Container && node.metadata) {
      return {
        ...baseData,
        apiEndpointCount: node.metadata.apiEndpointCount,
        componentCount: node.metadata.componentCount,
        primaryLanguage: node.metadata.primaryLanguage,
      };
    }

    if (node.c4Type === C4Type.External && node.metadata) {
      return {
        ...baseData,
        isExternal: node.metadata.isExternal,
      };
    }

    return baseData;
  }

  /**
   * Get fill color for node based on C4 type
   */
  private getNodeFill(node: C4Node): string {
    // Apply changeset status styling
    if (node.changesetStatus === 'new') {
      return '#d1fae5'; // Green for new
    }
    if (node.changesetStatus === 'modified') {
      return '#fef3c7'; // Yellow for modified
    }
    if (node.changesetStatus === 'deleted') {
      return '#fee2e2'; // Red for deleted
    }

    // Default colors by type
    switch (node.c4Type) {
      case C4Type.Container:
        return '#dbeafe'; // Light blue
      case C4Type.Component:
        return '#f3e8ff'; // Light purple
      case C4Type.External:
        return '#f3f4f6'; // Light gray
      default:
        return '#ffffff';
    }
  }

  /**
   * Get stroke color for node based on C4 type
   */
  private getNodeStroke(node: C4Node): string {
    // Apply changeset status styling
    if (node.changesetStatus === 'new') {
      return '#10b981'; // Green
    }
    if (node.changesetStatus === 'modified') {
      return '#f59e0b'; // Yellow
    }
    if (node.changesetStatus === 'deleted') {
      return '#ef4444'; // Red
    }

    // Default colors by type
    switch (node.c4Type) {
      case C4Type.Container:
        return '#2563eb'; // Blue
      case C4Type.Component:
        return '#7c3aed'; // Purple
      case C4Type.External:
        return '#6b7280'; // Gray
      default:
        return '#000000';
    }
  }

  /**
   * Create ReactFlow edges from filtered C4 graph.
   * Implements relationship bundling (FR3.5): Groups 3+ connections into single edge with count.
   *
   * Note: The _fullGraph parameter is reserved for future use when we need to access
   * the full graph context (e.g., for showing relationships to nodes outside the current
   * filtered view, or for computing global edge statistics). Currently unused but kept
   * for API consistency with createReactFlowNodes.
   */
  private createReactFlowEdges(filtered: FilteredC4Graph, _fullGraph: C4Graph): Edge[] {
    const edges: Edge[] = [];
    const { pathHighlighting, semanticZoom } = this.options;

    const showLabels = !semanticZoom.enabled || semanticZoom.currentScale >= 0.6;

    // Group edges by source-target pair for bundling
    const edgeGroups = new Map<string, { edges: C4Edge[]; ids: string[] }>();
    for (const [edgeId, edge] of filtered.edges) {
      const pairKey = `${edge.sourceId}__${edge.targetId}`;
      if (!edgeGroups.has(pairKey)) {
        edgeGroups.set(pairKey, { edges: [], ids: [] });
      }
      const group = edgeGroups.get(pairKey)!;
      group.edges.push(edge);
      group.ids.push(edgeId);
    }

    // Process each group, bundling if edges meet threshold
    for (const [, group] of edgeGroups) {
      if (group.edges.length >= EDGE_BUNDLE_THRESHOLD) {
        // Bundle into single edge with count indicator
        const bundledEdge = this.createBundledEdge(group.edges, group.ids, showLabels);
        edges.push(bundledEdge);
      } else {
        // Create individual edges
        for (let i = 0; i < group.edges.length; i++) {
          const edge = group.edges[i];
          const edgeId = group.ids[i];
          edges.push(this.createSingleEdge(edgeId, edge, showLabels, pathHighlighting));
        }
      }
    }

    return edges;
  }

  /**
   * Create a bundled edge representing multiple connections between two nodes.
   * Called when EDGE_BUNDLE_THRESHOLD or more edges connect the same source-target pair.
   *
   * Bundled edges have:
   * - A dashed stroke style to visually distinguish from single edges
   * - A count indicator in the label (e.g., "3 connections (REST, gRPC)")
   * - Animation if any bundled edge is async
   * - Combined changeset status styling (new takes priority over modified)
   *
   * @param bundledEdges - Array of C4Edge objects to bundle
   * @param edgeIds - Corresponding edge IDs for path highlighting lookup
   * @param showLabels - Whether to show edge labels (based on zoom level)
   * @returns A single ReactFlow Edge representing the bundled connections
   */
  private createBundledEdge(
    bundledEdges: C4Edge[],
    edgeIds: string[],
    showLabels: boolean
  ): Edge {
    const { pathHighlighting } = this.options;

    // Use the first edge as the representative
    const primaryEdge = bundledEdges[0];
    const bundleId = `bundle__${primaryEdge.sourceId}__${primaryEdge.targetId}`;

    // Determine styling based on all edges
    let strokeWidth = 2.5; // Thicker for bundles
    let strokeColor = '#6b7280';
    let opacity = 1.0;
    let animated = bundledEdges.some(e => e.direction === CommunicationDirection.Async);

    // Apply path highlighting if any edge in bundle is highlighted
    if (pathHighlighting && pathHighlighting.mode !== 'none') {
      const highlightedEdges = pathHighlighting.highlightedEdgeIds;
      if (highlightedEdges && highlightedEdges.size > 0) {
        const hasHighlighted = edgeIds.some(id => highlightedEdges.has(id));
        if (hasHighlighted) {
          strokeWidth = 4;
          strokeColor = '#3b82f6';
          opacity = 1.0;
        } else {
          opacity = 0.2;
        }
      }
    }

    // Check for changeset elements
    const hasNew = bundledEdges.some(e => e.changesetStatus === 'new');
    const hasModified = bundledEdges.some(e => e.changesetStatus === 'modified');
    const hasDeleted = bundledEdges.some(e => e.changesetStatus === 'deleted');
    if (hasNew) {
      strokeColor = '#10b981';
    } else if (hasModified) {
      strokeColor = '#f59e0b';
    }
    if (hasDeleted && !hasNew && !hasModified) {
      strokeColor = '#ef4444';
      opacity = 0.6;
    }

    // Collect unique protocols
    const protocols = new Set<string>();
    bundledEdges.forEach(e => {
      if (e.protocol && e.protocol !== 'Custom') {
        protocols.add(e.protocol);
      }
    });

    // Build label with count and protocols
    let label: string | undefined;
    if (showLabels) {
      const protocolStr = protocols.size > 0
        ? Array.from(protocols).slice(0, 2).join(', ') + (protocols.size > 2 ? '...' : '')
        : '';
      label = `${bundledEdges.length} connections${protocolStr ? ` (${protocolStr})` : ''}`;
    }

    return {
      id: bundleId,
      source: primaryEdge.sourceId,
      target: primaryEdge.targetId,
      type: 'smoothstep',
      label,
      labelStyle: {
        fill: '#374151',
        fontWeight: 600,
        fontSize: 11,
        background: '#dbeafe',
        padding: '2px 6px',
        borderRadius: '4px',
      },
      labelBgStyle: { fill: '#dbeafe', fillOpacity: 0.95, rx: 4, ry: 4 },
      animated,
      style: {
        strokeWidth,
        stroke: strokeColor,
        opacity,
        strokeDasharray: '8 4', // Dashed to indicate bundling
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 22,
        height: 22,
        color: strokeColor,
      },
      data: {
        isBundled: true,
        bundleCount: bundledEdges.length,
        protocols: Array.from(protocols),
        bundledEdgeIds: edgeIds,
      },
    } as Edge;
  }

  /**
   * Create a single edge (used when bundling is not needed)
   */
  private createSingleEdge(
    edgeId: string,
    edge: C4Edge,
    showLabels: boolean,
    pathHighlighting?: { mode: string; highlightedEdgeIds?: Set<string> }
  ): Edge {
    // Determine edge styling
    let strokeWidth = 1.5;
    let strokeColor = '#6b7280';
    let opacity = 1.0;
    let animated = edge.direction === CommunicationDirection.Async;

    // Apply path highlighting
    if (pathHighlighting && pathHighlighting.mode !== 'none') {
      const highlightedEdges = pathHighlighting.highlightedEdgeIds;
      if (highlightedEdges && highlightedEdges.size > 0) {
        if (highlightedEdges.has(edgeId)) {
          strokeWidth = 3;
          strokeColor = '#3b82f6'; // Blue for highlighted
          opacity = 1.0;
        } else {
          opacity = 0.2;
        }
      }
    }

    // Apply changeset styling
    if (edge.changesetStatus === 'new') {
      strokeColor = '#10b981';
    } else if (edge.changesetStatus === 'modified') {
      strokeColor = '#f59e0b';
    } else if (edge.changesetStatus === 'deleted') {
      strokeColor = '#ef4444';
      opacity = 0.6;
    }

    // Build label with protocol
    let label: string | undefined;
    if (showLabels) {
      const parts: string[] = [];
      if (edge.protocol && edge.protocol !== 'Custom') {
        parts.push(edge.protocol);
      }
      if (edge.method) {
        parts.push(edge.method);
      }
      if (parts.length > 0) {
        label = parts.join(' ');
      } else if (edge.description) {
        label = edge.description;
      }
    }

    return {
      id: edgeId,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'smoothstep',
      label,
      labelStyle: { fill: '#555', fontWeight: 500, fontSize: 11 },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.8, rx: 4, ry: 4 },
      animated,
      style: {
        strokeWidth,
        stroke: strokeColor,
        opacity,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: strokeColor,
      },
      data: {
        protocol: edge.protocol,
        direction: edge.direction,
        description: edge.description,
        method: edge.method,
        path: edge.path,
        isDeploymentRelation: edge.isDeploymentRelation,
        changesetStatus: edge.changesetStatus,
      },
    } as Edge;
  }

  /**
   * Build breadcrumb navigation path
   */
  private buildBreadcrumb(graph: C4Graph): C4BreadcrumbSegment[] {
    const { viewLevel, selectedContainerId, selectedComponentId } = this.options;
    const breadcrumb: C4BreadcrumbSegment[] = [];

    // Root context
    breadcrumb.push({
      level: 'context',
      label: 'System Context',
    });

    // Container level
    if (viewLevel !== 'context' && selectedContainerId) {
      const container = graph.nodes.get(selectedContainerId);
      breadcrumb.push({
        level: 'container',
        label: container?.name || 'Container',
        nodeId: selectedContainerId,
      });
    }

    // Component level
    if ((viewLevel === 'component' || viewLevel === 'code') && selectedComponentId) {
      const component = graph.nodes.get(selectedComponentId);
      breadcrumb.push({
        level: 'component',
        label: component?.name || 'Component',
        nodeId: selectedComponentId,
      });
    }

    return breadcrumb;
  }

  /**
   * Get cache hit rate percentage
   */
  private getCacheHitRate(): string {
    const total = this.cacheHits + this.cacheMisses;
    if (total === 0) return '0.0';
    return ((this.cacheHits / total) * 100).toFixed(1);
  }

  /**
   * Clear layout cache
   */
  clearLayoutCache(): void {
    this.layoutCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Trace upstream dependencies from a node using breadth-first search.
   * Finds all nodes that directly or indirectly provide input to the specified node.
   *
   * @param nodeId - The starting node ID to trace upstream from
   * @param graph - The complete C4Graph containing all nodes and edges
   * @returns Set of node IDs that are upstream of the specified node (includes the starting node)
   *
   * @example
   * ```typescript
   * // Find all data sources feeding into a service
   * const upstream = transformer.traceUpstream('api-gateway-id', graph);
   * console.log(`${upstream.size} upstream dependencies found`);
   * ```
   */
  traceUpstream(nodeId: string, graph: C4Graph): Set<string> {
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // Find edges where current is the target (incoming edges)
      for (const edge of graph.edges.values()) {
        if (edge.targetId === current && !visited.has(edge.sourceId)) {
          queue.push(edge.sourceId);
        }
      }
    }

    return visited;
  }

  /**
   * Trace downstream dependencies from a node using breadth-first search.
   * Finds all nodes that directly or indirectly consume output from the specified node.
   *
   * @param nodeId - The starting node ID to trace downstream from
   * @param graph - The complete C4Graph containing all nodes and edges
   * @returns Set of node IDs that are downstream of the specified node (includes the starting node)
   *
   * @example
   * ```typescript
   * // Find all consumers of a database container
   * const downstream = transformer.traceDownstream('database-id', graph);
   * console.log(`${downstream.size} downstream consumers found`);
   * ```
   */
  traceDownstream(nodeId: string, graph: C4Graph): Set<string> {
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // Find edges where current is the source (outgoing edges)
      for (const edge of graph.edges.values()) {
        if (edge.sourceId === current && !visited.has(edge.targetId)) {
          queue.push(edge.targetId);
        }
      }
    }

    return visited;
  }

  /**
   * Trace the shortest path between two nodes using breadth-first search.
   * Treats the graph as undirected for path finding (can traverse edges in either direction).
   *
   * @param sourceId - The starting node ID
   * @param targetId - The destination node ID
   * @param graph - The complete C4Graph containing all nodes and edges
   * @returns Set of node IDs on the shortest path (includes both source and target), or empty set if no path exists
   *
   * @example
   * ```typescript
   * // Find path between frontend and database
   * const path = transformer.traceBetween('web-app-id', 'database-id', graph);
   * if (path.size > 0) {
   *   console.log(`Found path with ${path.size} nodes`);
   * } else {
   *   console.log('No path found between nodes');
   * }
   * ```
   */
  traceBetween(sourceId: string, targetId: string, graph: C4Graph): Set<string> {
    if (sourceId === targetId) {
      return new Set([sourceId]);
    }

    const visited = new Set<string>();
    const parent = new Map<string, string>();
    const queue = [sourceId];
    visited.add(sourceId);

    // BFS to find shortest path
    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === targetId) {
        // Reconstruct path
        const path = new Set<string>();
        let node: string | undefined = targetId;
        while (node) {
          path.add(node);
          node = parent.get(node);
        }
        return path;
      }

      // Check all edges (both directions for undirected traversal)
      for (const edge of graph.edges.values()) {
        let neighbor: string | undefined;
        if (edge.sourceId === current && !visited.has(edge.targetId)) {
          neighbor = edge.targetId;
        } else if (edge.targetId === current && !visited.has(edge.sourceId)) {
          neighbor = edge.sourceId;
        }

        if (neighbor) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }

    // No path found
    return new Set();
  }

  /**
   * Get all edges that connect nodes within the highlighted set.
   * Used to visually emphasize the connections along a traced path.
   *
   * @param highlightedNodes - Set of node IDs that should be highlighted
   * @param graph - The complete C4Graph containing all nodes and edges
   * @returns Set of edge IDs where both source and target are in the highlighted set
   *
   * @example
   * ```typescript
   * // Highlight edges along an upstream path
   * const upstream = transformer.traceUpstream('api-gateway-id', graph);
   * const edges = transformer.getHighlightedEdges(upstream, graph);
   * // Use edges to set pathHighlighting.highlightedEdgeIds in transformer options
   * ```
   */
  getHighlightedEdges(highlightedNodes: Set<string>, graph: C4Graph): Set<string> {
    const highlightedEdges = new Set<string>();

    for (const [edgeId, edge] of graph.edges) {
      if (highlightedNodes.has(edge.sourceId) && highlightedNodes.has(edge.targetId)) {
        highlightedEdges.add(edgeId);
      }
    }

    return highlightedEdges;
  }
}
