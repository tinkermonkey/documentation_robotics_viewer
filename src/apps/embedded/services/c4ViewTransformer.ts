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
   * 3. Compute layout
   * 4. Create ReactFlow nodes with styling
   * 5. Create ReactFlow edges with styling
   * 6. Apply focus+context and path highlighting
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
    const filteredGraph = this.applyUserFilters(viewFilteredGraph, graph);
    if (DEBUG_LOGGING) {
      console.log(
        `[C4ViewTransformer] User filters: ${filteredGraph.nodes.size} nodes after filtering`
      );
    }

    // Step 3: Compute layout with caching
    const layoutResult = this.computeLayoutWithCache(filteredGraph);

    // Step 4: Get semantic zoom detail level
    const detailLevel = this.getDetailLevel();

    // Step 5: Create ReactFlow nodes (includes warnings for missing positions)
    const { nodes, warnings } = this.createReactFlowNodes(filteredGraph, layoutResult, detailLevel, graph);

    // Step 6: Create ReactFlow edges
    const edges = this.createReactFlowEdges(filteredGraph, graph);

    // Step 7: Build breadcrumb
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

    // Store in cache (limit to 10 entries)
    if (this.layoutCache.size >= 10) {
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

    if (scale < 0.5) {
      return 'minimal';
    } else if (scale < 0.8) {
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
   * Create ReactFlow edges from filtered C4 graph
   */
  private createReactFlowEdges(filtered: FilteredC4Graph, _fullGraph: C4Graph): Edge[] {
    const edges: Edge[] = [];
    const { pathHighlighting, semanticZoom } = this.options;

    const showLabels = !semanticZoom.enabled || semanticZoom.currentScale >= 0.6;

    for (const [edgeId, edge] of filtered.edges) {
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

      edges.push({
        id: edgeId,
        source: edge.sourceId,
        target: edge.targetId,
        type: 'smoothstep', // Or 'elbow' for orthogonal routing
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
      } as Edge);
    }

    return edges;
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
   * Trace upstream dependencies from a node
   * Returns set of node IDs in the upstream path
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
   * Trace downstream dependencies from a node
   * Returns set of node IDs in the downstream path
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
   * Trace path between two nodes (BFS shortest path)
   * Returns set of node IDs on the path
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
   * Get edges for highlighted nodes
   * Returns edge IDs for edges connecting highlighted nodes
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
