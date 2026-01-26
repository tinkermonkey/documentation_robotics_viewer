/**
 * Business Graph Builder
 *
 * Builds intermediate graph representation with semantic metadata and metrics.
 * Calculates hierarchy, detects circular dependencies, and creates indices for fast filtering.
 */

import {
  BusinessGraph,
  BusinessNode,
  BusinessEdge,
  BusinessElement,
  BusinessRelationship,
  HierarchyInfo,
  GraphMetrics,
  CircularDependency,
  BusinessGraphIndices,
  BusinessNodeType,
  BusinessEdgeType,
} from '../types/businessLayer';

/**
 * BusinessGraphBuilder - Constructs intermediate graph structure from business layer data
 */
export class BusinessGraphBuilder {
  private warnings: string[] = [];

  /**
   * Build complete business graph from elements and relationships
   *
   * @param elements - Business elements from parser
   * @param relationships - Business relationships from parser
   * @returns Complete business graph with hierarchy, metrics, and indices
   */
  buildGraph(
    elements: BusinessElement[],
    relationships: BusinessRelationship[]
  ): BusinessGraph {
    this.warnings = [];

    // Convert elements to nodes
    const nodes = this.buildNodes(elements);

    // Convert relationships to edges
    const edges = this.buildEdges(relationships, nodes);

    // Build hierarchy information
    const hierarchy = this.resolveHierarchy(nodes, edges);

    // Calculate graph metrics
    const metrics = this.calculateMetrics(nodes, edges, hierarchy);

    // Build filter indices
    const indices = this.buildIndices(nodes);

    const graph: BusinessGraph = {
      nodes,
      edges,
      hierarchy,
      metrics,
      crossLayerLinks: [], // Will be populated by CrossLayerReferenceResolver
      indices,
    };

    return graph;
  }

  /**
   * Resolve hierarchy structure
   *
   * @param nodes - Graph nodes
   * @param edges - Graph edges
   * @returns Hierarchy information including depth and parent-child relationships
   */
  resolveHierarchy(
    nodes: Map<string, BusinessNode>,
    edges: Map<string, BusinessEdge>
  ): HierarchyInfo {
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string>();
    const nodesByLevel = new Map<number, Set<string>>();
    const rootNodes: string[] = [];
    const leafNodes: string[] = [];

    // Build parent-child relationships from 'composes' and 'aggregates' edges
    for (const edge of edges.values()) {
      if (edge.type === 'composes' || edge.type === 'aggregates') {
        // Parent composes/aggregates child
        const parent = edge.source;
        const child = edge.target;

        // Add to parent-child map
        const children = parentChildMap.get(parent) || [];
        children.push(child);
        parentChildMap.set(parent, children);

        // Add to child-parent map
        childParentMap.set(child, parent);
      }
    }

    // Update node parent/child references
    for (const node of nodes.values()) {
      node.childIds = parentChildMap.get(node.id) || [];
      node.parentId = childParentMap.get(node.id);
    }

    // Identify root nodes (no parent)
    for (const node of nodes.values()) {
      if (!node.parentId) {
        rootNodes.push(node.id);
      }
    }

    // Calculate hierarchy levels using BFS
    const visited = new Set<string>();
    let currentLevel = 0;
    let currentLevelNodes = [...rootNodes];

    while (currentLevelNodes.length > 0) {
      const levelSet = new Set<string>();

      for (const nodeId of currentLevelNodes) {
        if (visited.has(nodeId)) {
          // Circular reference detected
          this.warnings.push(`Circular hierarchy reference detected for node ${nodeId}`);
          continue;
        }

        const node = nodes.get(nodeId);
        if (node) {
          node.hierarchyLevel = currentLevel;
          levelSet.add(nodeId);
          visited.add(nodeId);
        }
      }

      nodesByLevel.set(currentLevel, levelSet);

      // Move to next level
      const nextLevelNodes: string[] = [];
      for (const nodeId of currentLevelNodes) {
        const children = parentChildMap.get(nodeId) || [];
        nextLevelNodes.push(...children);
      }

      currentLevelNodes = nextLevelNodes;
      currentLevel++;
    }

    // Identify leaf nodes (no children)
    for (const node of nodes.values()) {
      if (node.childIds.length === 0) {
        leafNodes.push(node.id);
      }
    }

    const maxDepth = Math.max(0, currentLevel - 1);

    return {
      maxDepth,
      rootNodes,
      leafNodes,
      nodesByLevel,
      parentChildMap,
      childParentMap,
    };
  }

  /**
   * Calculate graph metrics
   *
   * @param nodes - Graph nodes
   * @param edges - Graph edges
   * @param hierarchy - Hierarchy information
   * @returns Graph metrics including connectivity and circular dependencies
   */
  calculateMetrics(
    nodes: Map<string, BusinessNode>,
    edges: Map<string, BusinessEdge>,
    hierarchy: HierarchyInfo
  ): GraphMetrics {
    const nodeCount = nodes.size;
    const edgeCount = edges.size;

    // Calculate average connectivity
    const averageConnectivity = nodeCount > 0 ? edgeCount / nodeCount : 0;

    // Detect circular dependencies
    const circularDependencies = this.detectCircularDependencies(nodes, edges);

    // Find orphaned nodes (no connections)
    const orphanedNodes: string[] = [];
    for (const node of nodes.values()) {
      const hasIncoming = Array.from(edges.values()).some((e) => e.target === node.id);
      const hasOutgoing = Array.from(edges.values()).some((e) => e.source === node.id);

      if (!hasIncoming && !hasOutgoing) {
        orphanedNodes.push(node.id);
      }
    }

    // Find critical nodes (high criticality)
    const criticalNodes: string[] = [];
    for (const node of nodes.values()) {
      if (node.metadata.criticality === 'high') {
        criticalNodes.push(node.id);
      }
    }

    return {
      nodeCount,
      edgeCount,
      averageConnectivity,
      maxHierarchyDepth: hierarchy.maxDepth,
      circularDependencies,
      orphanedNodes,
      criticalNodes,
    };
  }

  /**
   * Get accumulated warnings
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Build nodes map from elements
   */
  private buildNodes(
    elements: BusinessElement[]
  ): Map<string, BusinessNode> {
    const nodes = new Map<string, BusinessNode>();

    for (const element of elements) {
      try {
        const node: BusinessNode = {
          id: element.id,
          type: this.inferNodeType(element.type),
          name: element.name,
          description: element.description,
          properties: element.properties,
          metadata: this.extractMetadata(element),
          hierarchyLevel: 0, // Will be calculated in resolveHierarchy
          parentId: undefined,
          childIds: [],
          dimensions: this.calculateDimensions(element),
        };

        nodes.set(node.id, node);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.warnings.push(`Failed to build node for element ${element.id}: ${message}`);
      }
    }

    return nodes;
  }

  /**
   * Build edges map from relationships
   */
  private buildEdges(
    relationships: BusinessRelationship[],
    nodes: Map<string, BusinessNode>
  ): Map<string, BusinessEdge> {
    const edges = new Map<string, BusinessEdge>();

    for (const rel of relationships) {
      try {
        // Validate source and target exist
        if (!nodes.has(rel.sourceId)) {
          this.warnings.push(
            `Relationship ${rel.id} references non-existent source ${rel.sourceId}`
          );
          continue;
        }

        if (!nodes.has(rel.targetId)) {
          this.warnings.push(
            `Relationship ${rel.id} references non-existent target ${rel.targetId}`
          );
          continue;
        }

        const edge: BusinessEdge = {
          id: rel.id,
          source: rel.sourceId,
          sourceId: rel.sourceId,
          target: rel.targetId,
          targetId: rel.targetId,
          type: this.inferEdgeType(rel.type),
          label: rel.properties?.label as string | undefined,
          properties: rel.properties,
        };

        edges.set(edge.id, edge);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.warnings.push(`Failed to build edge for relationship ${rel.id}: ${message}`);
      }
    }

    return edges;
  }

  /**
   * Infer node type from element type
   */
  private inferNodeType(type: string): BusinessNodeType {
    const normalized = type.toLowerCase();

    if (normalized.includes('function')) return 'function';
    if (normalized.includes('process')) return 'process';
    if (normalized.includes('service')) return 'service';
    if (normalized.includes('capability')) return 'capability';

    // Default to 'function' for unknown types
    return 'function';
  }

  /**
   * Infer edge type from relationship type
   */
  private inferEdgeType(type: string): BusinessEdgeType {
    const normalized = type.toLowerCase();

    const typeMap: Record<string, BusinessEdgeType> = {
      realizes: 'realizes',
      supports: 'supports',
      flows_to: 'flows_to',
      depends_on: 'depends_on',
      serves: 'serves',
      composes: 'composes',
      aggregates: 'aggregates',
    };

    return typeMap[normalized] || 'serves';
  }

  /**
   * Extract metadata from element properties
   */
  private extractMetadata(element: BusinessElement): BusinessNode['metadata'] {
    const props = element.properties;

    return {
      owner: props.owner as string | undefined,
      criticality: this.parseCriticality(props.criticality),
      lifecycle: this.parseLifecycle(props.lifecycle),
      domain: props.domain as string | undefined,
      subprocessCount: props.subprocessCount as number | undefined,
      stepCount: props.stepCount as number | undefined,
    };
  }

  /**
   * Parse criticality from property value
   */
  private parseCriticality(
    value: unknown
  ): 'high' | 'medium' | 'low' | undefined {
    if (typeof value !== 'string') return undefined;

    const normalized = value.toLowerCase();
    if (normalized === 'high' || normalized === 'critical') return 'high';
    if (normalized === 'medium' || normalized === 'normal') return 'medium';
    if (normalized === 'low') return 'low';

    return undefined;
  }

  /**
   * Parse lifecycle from property value
   */
  private parseLifecycle(
    value: unknown
  ): 'ideation' | 'active' | 'deprecated' | undefined {
    if (typeof value !== 'string') return undefined;

    const normalized = value.toLowerCase();
    if (normalized === 'ideation' || normalized === 'planned') return 'ideation';
    if (normalized === 'active' || normalized === 'current') return 'active';
    if (normalized === 'deprecated' || normalized === 'retired') return 'deprecated';

    return undefined;
  }

  /**
   * Calculate node dimensions based on type and content
   */
  private calculateDimensions(
    element: BusinessElement
  ): { width: number; height: number } {
    // Default dimensions (will be refined later based on actual node content)
    const baseWidth = 200;
    const baseHeight = 100;

    // Adjust for element type
    let width = baseWidth;
    let height = baseHeight;

    const type = element.type.toLowerCase();

    if (type.includes('process')) {
      width = 220;
      height = 120;
    } else if (type.includes('service')) {
      width = 200;
      height = 100;
    } else if (type.includes('capability')) {
      width = 240;
      height = 110;
    }

    return { width, height };
  }

  /**
   * Build filter indices for fast querying
   */
  private buildIndices(nodes: Map<string, BusinessNode>): BusinessGraphIndices {
    const byType = new Map<BusinessNodeType, Set<string>>();
    const byDomain = new Map<string, Set<string>>();
    const byLifecycle = new Map<string, Set<string>>();
    const byCriticality = new Map<string, Set<string>>();

    for (const node of nodes.values()) {
      // Index by type
      const typeSet = byType.get(node.type) || new Set();
      typeSet.add(node.id);
      byType.set(node.type, typeSet);

      // Index by domain
      if (node.metadata.domain) {
        const domainSet = byDomain.get(node.metadata.domain) || new Set();
        domainSet.add(node.id);
        byDomain.set(node.metadata.domain, domainSet);
      }

      // Index by lifecycle
      if (node.metadata.lifecycle) {
        const lifecycleSet = byLifecycle.get(node.metadata.lifecycle) || new Set();
        lifecycleSet.add(node.id);
        byLifecycle.set(node.metadata.lifecycle, lifecycleSet);
      }

      // Index by criticality
      if (node.metadata.criticality) {
        const criticalitySet = byCriticality.get(node.metadata.criticality) || new Set();
        criticalitySet.add(node.id);
        byCriticality.set(node.metadata.criticality, criticalitySet);
      }
    }

    return {
      byType,
      byDomain,
      byLifecycle,
      byCriticality,
    };
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(
    nodes: Map<string, BusinessNode>,
    edges: Map<string, BusinessEdge>
  ): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Build adjacency list for dependency edges
    const adjList = new Map<string, string[]>();
    for (const edge of edges.values()) {
      if (edge.type === 'depends_on' || edge.type === 'flows_to') {
        const neighbors = adjList.get(edge.source) || [];
        neighbors.push(edge.target);
        adjList.set(edge.source, neighbors);
      }
    }

    // DFS to detect cycles
    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Cycle detected
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor); // Close the cycle

          cycles.push({
            cycle,
            type: 'depends_on',
          });
        }
      }

      recursionStack.delete(nodeId);
    };

    // Run DFS from each unvisited node
    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }
}
