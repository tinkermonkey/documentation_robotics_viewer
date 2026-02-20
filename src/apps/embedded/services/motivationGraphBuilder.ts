/**
 * MotivationGraphBuilder Service
 *
 * Extracts motivation layer elements from MetaModel and transforms them into
 * an intermediate graph representation suitable for visualization.
 *
 * Key responsibilities:
 * - Extract motivation layer elements
 * - Resolve relationship types
 * - Calculate graph metrics (centrality, influence depth)
 * - Integrate changeset modifications
 * - Build adjacency lists for efficient traversal
 */

import { MetaModel, ModelElement, Relationship } from '../../../core/types';
import {
  MotivationGraph,
  MotivationGraphNode,
  MotivationGraphEdge,
  MotivationGraphMetadata,
  MotivationElementType,
  MotivationRelationshipType,
  RelationshipDirection,
  ConflictDetection,
  MotivationGraphBuilderOptions,
  InfluencePath
} from '../types/motivationGraph';
import { ChangesetDetails, ChangesetChange } from './changesetGraphBuilder';

/**
 * Mapping from various relationship type names to MotivationRelationshipType
 */
const RELATIONSHIP_TYPE_MAP: Record<string, MotivationRelationshipType> = {
  // ArchiMate standard relationships
  'influence': MotivationRelationshipType.Influence,
  'influences': MotivationRelationshipType.Influence,
  'constrains': MotivationRelationshipType.Constrains,
  'realizes': MotivationRelationshipType.Realizes,
  'refines': MotivationRelationshipType.Refines,
  'conflicts': MotivationRelationshipType.Conflicts,

  // Custom motivation relationships
  'motivates': MotivationRelationshipType.Motivates,
  'supports_goals': MotivationRelationshipType.SupportsGoals,
  'fulfills_requirements': MotivationRelationshipType.FulfillsRequirements,
  'constrained_by': MotivationRelationshipType.ConstrainedBy,
  'has_interest': MotivationRelationshipType.HasInterest,

  // Fallback
  'custom': MotivationRelationshipType.Custom,
  'reference': MotivationRelationshipType.Custom
};

/**
 * Default builder options
 */
const DEFAULT_OPTIONS: MotivationGraphBuilderOptions = {
  calculateAdvancedMetrics: false,
  detectConflicts: true,
  computeInfluencePaths: false,
  maxPathLength: 10
};

/**
 * Type guard to validate MotivationElementType values
 */
const isValidMotivationElement = (value: unknown): value is MotivationElementType => {
  return Object.values(MotivationElementType).includes(value as MotivationElementType);
};

export class MotivationGraphBuilder {
  private warnings: string[] = [];
  private options: MotivationGraphBuilderOptions;
  private pathCache: Map<string, InfluencePath[]> = new Map();
  private performanceWarnings: Array<{operation: string; duration: number; timestamp: number}> = [];

  constructor(options: Partial<MotivationGraphBuilderOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Build motivation graph from MetaModel
   */
  build(metaModel: MetaModel): MotivationGraph {
    console.log('[MotivationGraphBuilder] Building motivation graph from MetaModel');
    this.warnings = [];

    // Extract motivation layer
    const motivationLayer = this.extractMotivationLayer(metaModel);
    if (!motivationLayer) {
      console.warn('[MotivationGraphBuilder] No motivation layer found in MetaModel');
      return this.createEmptyGraph();
    }

    console.log(`[MotivationGraphBuilder] Found ${motivationLayer.elements.length} elements in motivation layer`);

    // Build nodes from elements
    const nodes = this.buildNodes(motivationLayer.elements);

    // Build edges from relationships
    const edges = this.buildEdges(motivationLayer.relationships, nodes);

    // Build adjacency lists
    const adjacencyLists = this.buildAdjacencyLists(edges);

    // Calculate graph metrics
    this.calculateMetrics(nodes, adjacencyLists);

    // Detect conflicts if enabled
    const conflicts = this.options.detectConflicts
      ? this.detectConflicts(nodes, edges)
      : [];

    // Compute influence paths if enabled
    const influencePaths = this.options.computeInfluencePaths
      ? this.computeInfluencePaths(nodes, adjacencyLists)
      : undefined;

    // Build metadata
    const metadata = this.buildMetadata(nodes, edges, conflicts);

    const graph: MotivationGraph = {
      nodes,
      edges,
      metadata,
      adjacencyLists,
      influencePaths
    };

    console.log('[MotivationGraphBuilder] Graph built:', {
      nodes: nodes.size,
      edges: edges.size,
      warnings: this.warnings.length
    });

    return graph;
  }

  /**
   * Apply changeset modifications to existing graph
   */
  applyChangesets(graph: MotivationGraph, changesets: ChangesetDetails[]): MotivationGraph {
    console.log(`[MotivationGraphBuilder] Applying ${changesets.length} changesets to graph`);

    const newGraph: MotivationGraph = {
      nodes: new Map(graph.nodes),
      edges: new Map(graph.edges),
      metadata: { ...graph.metadata },
      adjacencyLists: {
        outgoing: new Map(graph.adjacencyLists.outgoing),
        incoming: new Map(graph.adjacencyLists.incoming)
      },
      influencePaths: graph.influencePaths
    };

    for (const changeset of changesets) {
      const changesArray = (changeset as any).changes?.changes || changeset.changes || [];

      for (const change of changesArray) {
        // Only process motivation layer changes
        if (change.layer.toLowerCase() !== 'motivation') {
          continue;
        }

        this.applyChange(newGraph, change);
      }
    }

    // Recalculate metrics
    this.calculateMetrics(newGraph.nodes, newGraph.adjacencyLists);

    // Update metadata
    newGraph.metadata = this.buildMetadata(
      newGraph.nodes,
      newGraph.edges,
      newGraph.metadata.conflicts
    );

    return newGraph;
  }

  /**
   * Extract motivation layer from MetaModel
   */
  private extractMotivationLayer(metaModel: MetaModel) {
    // Try different possible layer names
    const possibleNames = ['Motivation', 'motivation', 'MOTIVATION'];

    for (const name of possibleNames) {
      if (metaModel.layers[name]) {
        return metaModel.layers[name];
      }
    }

    return null;
  }

  /**
   * Build graph nodes from elements
   */
  private buildNodes(elements: ModelElement[]): Map<string, MotivationGraphNode> {
    const nodes = new Map<string, MotivationGraphNode>();

    for (const element of elements) {
      // Verify this is a motivation element type
      if (!this.isMotivationElement(element.type)) {
        this.warnings.push(`Skipping non-motivation element: ${element.type}`);
        continue;
      }

      const node: MotivationGraphNode = {
        id: element.id,
        element,
        metrics: {
          degreeCentrality: 0,
          inDegree: 0,
          outDegree: 0,
          influenceDepth: 0,
          influenceHeight: 0
        },
        adjacency: {
          incoming: [],
          outgoing: []
        }
      };

      nodes.set(element.id, node);
    }

    console.log(`[MotivationGraphBuilder] Built ${nodes.size} nodes`);
    return nodes;
  }

  /**
   * Build graph edges from relationships
   */
  private buildEdges(
    relationships: Relationship[],
    nodes: Map<string, MotivationGraphNode>
  ): Map<string, MotivationGraphEdge> {
    const edges = new Map<string, MotivationGraphEdge>();

    for (const relationship of relationships) {
      // Verify both source and target exist in nodes
      if (!nodes.has(relationship.sourceId) || !nodes.has(relationship.targetId)) {
        this.warnings.push(
          `Skipping relationship ${relationship.id}: source or target not in motivation layer`
        );
        continue;
      }

      // Use originalType from properties if available (YAML relationships)
      const typeToMap = relationship.properties?.originalType || relationship.type;
      const relType = this.mapRelationshipType(typeToMap);
      const direction = this.determineDirection(relType);

      const edge: MotivationGraphEdge = {
        id: relationship.id,
        sourceId: relationship.sourceId,
        targetId: relationship.targetId,
        type: relType,
        relationship,
        direction,
        weight: 1.0
      };

      edges.set(edge.id, edge);
    }

    console.log(`[MotivationGraphBuilder] Built ${edges.size} edges`);
    return edges;
  }

  /**
   * Build adjacency lists for efficient graph traversal
   */
  private buildAdjacencyLists(edges: Map<string, MotivationGraphEdge>) {
    const outgoing = new Map<string, Set<string>>();
    const incoming = new Map<string, Set<string>>();

    for (const edge of edges.values()) {
      // Outgoing edges
      if (!outgoing.has(edge.sourceId)) {
        outgoing.set(edge.sourceId, new Set());
      }
      outgoing.get(edge.sourceId)!.add(edge.targetId);

      // Incoming edges
      if (!incoming.has(edge.targetId)) {
        incoming.set(edge.targetId, new Set());
      }
      incoming.get(edge.targetId)!.add(edge.sourceId);

      // Handle bidirectional relationships
      if (edge.direction === RelationshipDirection.Bidirectional) {
        if (!outgoing.has(edge.targetId)) {
          outgoing.set(edge.targetId, new Set());
        }
        outgoing.get(edge.targetId)!.add(edge.sourceId);

        if (!incoming.has(edge.sourceId)) {
          incoming.set(edge.sourceId, new Set());
        }
        incoming.get(edge.sourceId)!.add(edge.targetId);
      }
    }

    return { outgoing, incoming };
  }

  /**
   * Calculate graph metrics for all nodes
   */
  private calculateMetrics(
    nodes: Map<string, MotivationGraphNode>,
    adjacencyLists: { outgoing: Map<string, Set<string>>; incoming: Map<string, Set<string>> }
  ): void {
    // Calculate basic degree metrics
    for (const [nodeId, node] of nodes) {
      const outDegree = adjacencyLists.outgoing.get(nodeId)?.size || 0;
      const inDegree = adjacencyLists.incoming.get(nodeId)?.size || 0;

      node.metrics.outDegree = outDegree;
      node.metrics.inDegree = inDegree;
      node.metrics.degreeCentrality = outDegree + inDegree;

      // Update adjacency lists in node
      node.adjacency.outgoing = Array.from(adjacencyLists.outgoing.get(nodeId) || []);
      node.adjacency.incoming = Array.from(adjacencyLists.incoming.get(nodeId) || []);
    }

    // Calculate influence depth for each node
    for (const [nodeId, node] of nodes) {
      node.metrics.influenceDepth = this.calculateInfluenceDepth(nodeId, adjacencyLists.outgoing, nodes);
      node.metrics.influenceHeight = this.calculateInfluenceDepth(nodeId, adjacencyLists.incoming, nodes);
    }

    // Calculate advanced metrics if enabled
    if (this.options.calculateAdvancedMetrics) {
      this.calculateBetweennessCentrality(nodes, adjacencyLists);
      this.calculateClusteringCoefficients(nodes, adjacencyLists);
    }
  }

  /**
   * Calculate maximum depth of influence chains from a node
   */
  private calculateInfluenceDepth(
    startNodeId: string,
    adjacencyList: Map<string, Set<string>>,
    nodes: Map<string, MotivationGraphNode>,
    visited = new Set<string>(),
    depth = 0
  ): number {
    if (visited.has(startNodeId)) {
      return depth; // Cycle detected
    }

    visited.add(startNodeId);

    const neighbors = adjacencyList.get(startNodeId);
    if (!neighbors || neighbors.size === 0) {
      return depth;
    }

    let maxDepth = depth;
    for (const neighborId of neighbors) {
      if (nodes.has(neighborId)) {
        const neighborDepth = this.calculateInfluenceDepth(
          neighborId,
          adjacencyList,
          nodes,
          new Set(visited),
          depth + 1
        );
        maxDepth = Math.max(maxDepth, neighborDepth);
      }
    }

    return maxDepth;
  }

  /**
   * Calculate betweenness centrality using Brandes' algorithm (simplified)
   */
  private calculateBetweennessCentrality(
    nodes: Map<string, MotivationGraphNode>,
    adjacencyLists: { outgoing: Map<string, Set<string>>; incoming: Map<string, Set<string>> }
  ): void {
    const betweenness = new Map<string, number>();

    // Initialize all to 0
    for (const nodeId of nodes.keys()) {
      betweenness.set(nodeId, 0);
    }

    // For each node, compute shortest paths
    for (const source of nodes.keys()) {
      const stack: string[] = [];
      const predecessors = new Map<string, string[]>();
      const sigma = new Map<string, number>();
      const distance = new Map<string, number>();

      for (const nodeId of nodes.keys()) {
        predecessors.set(nodeId, []);
        sigma.set(nodeId, 0);
        distance.set(nodeId, -1);
      }

      sigma.set(source, 1);
      distance.set(source, 0);

      const queue: string[] = [source];

      while (queue.length > 0) {
        const v = queue.shift()!;
        stack.push(v);

        const neighbors = adjacencyLists.outgoing.get(v) || new Set();
        for (const w of neighbors) {
          // First time we see this node?
          if (distance.get(w)! < 0) {
            queue.push(w);
            distance.set(w, distance.get(v)! + 1);
          }

          // Shortest path to w via v?
          if (distance.get(w) === distance.get(v)! + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            predecessors.get(w)!.push(v);
          }
        }
      }

      const delta = new Map<string, number>();
      for (const nodeId of nodes.keys()) {
        delta.set(nodeId, 0);
      }

      // Accumulate back
      while (stack.length > 0) {
        const w = stack.pop()!;
        for (const v of predecessors.get(w)!) {
          delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
        }
        if (w !== source) {
          betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
        }
      }
    }

    // Normalize and assign to nodes
    const n = nodes.size;
    const normalization = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;

    for (const [nodeId, node] of nodes) {
      node.metrics.betweennessCentrality = (betweenness.get(nodeId) || 0) * normalization;
    }
  }

  /**
   * Calculate clustering coefficients
   */
  private calculateClusteringCoefficients(
    nodes: Map<string, MotivationGraphNode>,
    adjacencyLists: { outgoing: Map<string, Set<string>>; incoming: Map<string, Set<string>> }
  ): void {
    for (const [nodeId, node] of nodes) {
      const neighbors = new Set([
        ...(adjacencyLists.outgoing.get(nodeId) || []),
        ...(adjacencyLists.incoming.get(nodeId) || [])
      ]);

      const k = neighbors.size;
      if (k < 2) {
        node.metrics.clusteringCoefficient = 0;
        continue;
      }

      let connectedPairs = 0;
      const neighborArray = Array.from(neighbors);

      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          const n1 = neighborArray[i];
          const n2 = neighborArray[j];

          // Check if n1 and n2 are connected
          if (adjacencyLists.outgoing.get(n1)?.has(n2) ||
              adjacencyLists.incoming.get(n1)?.has(n2)) {
            connectedPairs++;
          }
        }
      }

      const possiblePairs = (k * (k - 1)) / 2;
      node.metrics.clusteringCoefficient = connectedPairs / possiblePairs;
    }
  }

  /**
   * Detect conflicts between goals, requirements, and constraints
   */
  private detectConflicts(
    nodes: Map<string, MotivationGraphNode>,
    edges: Map<string, MotivationGraphEdge>
  ): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];

    // Look for explicit conflict relationships
    for (const edge of edges.values()) {
      if (edge.type === MotivationRelationshipType.Conflicts) {
        const sourceNode = nodes.get(edge.sourceId);
        const targetNode = nodes.get(edge.targetId);

        if (sourceNode && targetNode) {
          conflicts.push({
            nodes: [edge.sourceId, edge.targetId],
            type: 'goal-conflict',
            description: `Conflict between ${sourceNode.element.name} and ${targetNode.element.name}`,
            severity: 'high'
          });
        }
      }
    }

    // Build adjacency lists for sophisticated conflict detection
    const adjacencyLists = {
      outgoing: new Map<string, Set<string>>(),
      incoming: new Map<string, Set<string>>()
    };

    for (const edge of edges.values()) {
      if (!adjacencyLists.outgoing.has(edge.sourceId)) {
        adjacencyLists.outgoing.set(edge.sourceId, new Set());
      }
      adjacencyLists.outgoing.get(edge.sourceId)!.add(edge.targetId);

      if (!adjacencyLists.incoming.has(edge.targetId)) {
        adjacencyLists.incoming.set(edge.targetId, new Set());
      }
      adjacencyLists.incoming.get(edge.targetId)!.add(edge.sourceId);
    }

    // Additional sophisticated conflict detection:
    // 1. Goals that constrain each other through requirements
    this.detectGoalConstraintConflicts(nodes, adjacencyLists, conflicts);

    // 2. Requirements that cannot be simultaneously satisfied
    this.detectRequirementConflicts(nodes, adjacencyLists, conflicts);

    // 3. Constraint violations (constraints conflicting with goals or requirements)
    this.detectConstraintViolations(nodes, adjacencyLists, conflicts);

    return conflicts;
  }

  /**
   * Detect goals that constrain each other through requirements
   */
  private detectGoalConstraintConflicts(
    nodes: Map<string, MotivationGraphNode>,
    adjacencyLists: { outgoing: Map<string, Set<string>>; incoming: Map<string, Set<string>> },
    conflicts: ConflictDetection[]
  ): void {
    const goals = Array.from(nodes.values()).filter(
      n => n.element.type === MotivationElementType.Goal
    );

    // Check if two goals share requirements that have conflicting constraints
    for (let i = 0; i < goals.length; i++) {
      for (let j = i + 1; j < goals.length; j++) {
        const goal1 = goals[i];
        const goal2 = goals[j];

        // Get requirements for each goal
        const reqs1 = this.getRelatedNodes(goal1.element.id, adjacencyLists.outgoing, nodes, MotivationElementType.Requirement);
        const reqs2 = this.getRelatedNodes(goal2.element.id, adjacencyLists.outgoing, nodes, MotivationElementType.Requirement);

        // Find shared requirements
        const sharedReqs = reqs1.filter(r1 => reqs2.some(r2 => r2.element.id === r1.element.id));

        if (sharedReqs.length > 0) {
          // Check if these requirements have conflicting constraints
          const hasConflictingConstraints = sharedReqs.some(req => {
            const constraints = this.getRelatedNodes(req.element.id, adjacencyLists.outgoing, nodes, MotivationElementType.Constraint);
            return constraints.length > 1; // Multiple constraints may conflict
          });

          if (hasConflictingConstraints) {
            conflicts.push({
              nodes: [goal1.element.id, goal2.element.id],
              type: 'goal-constraint-conflict',
              description: `Goals "${goal1.element.name}" and "${goal2.element.name}" may have conflicting constraints through shared requirements`,
              severity: 'medium'
            });
          }
        }
      }
    }
  }

  /**
   * Detect requirements that cannot be simultaneously satisfied
   */
  private detectRequirementConflicts(
    nodes: Map<string, MotivationGraphNode>,
    adjacencyLists: { outgoing: Map<string, Set<string>>; incoming: Map<string, Set<string>> },
    conflicts: ConflictDetection[]
  ): void {
    const requirements = Array.from(nodes.values()).filter(
      n => n.element.type === MotivationElementType.Requirement
    );

    // Check for mutually exclusive requirements
    for (let i = 0; i < requirements.length; i++) {
      for (let j = i + 1; j < requirements.length; j++) {
        const req1 = requirements[i];
        const req2 = requirements[j];

        // Heuristic: requirements with conflicting properties in their metadata
        const prop1 = req1.element.properties || {};
        const prop2 = req2.element.properties || {};

        // Check for explicit conflicts in priority or criticality
        if (prop1.priority === 'high' && prop2.priority === 'high') {
          const constraints1 = this.getRelatedNodes(req1.element.id, adjacencyLists.outgoing, nodes, MotivationElementType.Constraint);
          const constraints2 = this.getRelatedNodes(req2.element.id, adjacencyLists.outgoing, nodes, MotivationElementType.Constraint);

          // If both have constraints, they may conflict
          if (constraints1.length > 0 && constraints2.length > 0) {
            conflicts.push({
              nodes: [req1.element.id, req2.element.id],
              type: 'requirement-conflict',
              description: `High-priority requirements "${req1.element.name}" and "${req2.element.name}" may conflict`,
              severity: 'high'
            });
          }
        }
      }
    }
  }

  /**
   * Detect constraint violations (constraints conflicting with goals or requirements)
   */
  private detectConstraintViolations(
    nodes: Map<string, MotivationGraphNode>,
    adjacencyLists: { outgoing: Map<string, Set<string>>; incoming: Map<string, Set<string>> },
    conflicts: ConflictDetection[]
  ): void {
    const constraints = Array.from(nodes.values()).filter(
      n => n.element.type === MotivationElementType.Constraint
    );
    const goals = Array.from(nodes.values()).filter(
      n => n.element.type === MotivationElementType.Goal
    );

    // Check if constraints conflict with goals
    for (const constraint of constraints) {
      const affectedGoals = this.getRelatedNodes(constraint.element.id, adjacencyLists.incoming, nodes, MotivationElementType.Goal);

      if (affectedGoals.length > 1) {
        // A constraint affecting multiple goals may cause violations
        conflicts.push({
          nodes: [constraint.element.id, ...affectedGoals.map(g => g.element.id)],
          type: 'constraint-violation',
          description: `Constraint "${constraint.element.name}" affects ${affectedGoals.length} goals and may cause conflicts`,
          severity: 'medium'
        });
      }

      // Check for conflicting constraints on the same goal
      for (const goal of goals) {
        const goalConstraints = this.getRelatedNodes(goal.element.id, adjacencyLists.outgoing, nodes, MotivationElementType.Constraint);

        if (goalConstraints.length > 2) {
          // More than 2 constraints on a goal may conflict
          conflicts.push({
            nodes: [goal.element.id, ...goalConstraints.map(c => c.element.id)],
            type: 'constraint-violation',
            description: `Goal "${goal.element.name}" has ${goalConstraints.length} constraints that may conflict`,
            severity: 'high'
          });
        }
      }
    }
  }

  /**
   * Get related nodes of a specific type
   */
  private getRelatedNodes(
    nodeId: string,
    adjacencyList: Map<string, Set<string>>,
    nodes: Map<string, MotivationGraphNode>,
    targetType: MotivationElementType
  ): MotivationGraphNode[] {
    const relatedIds = adjacencyList.get(nodeId) || new Set();
    return Array.from(relatedIds)
      .map(id => nodes.get(id))
      .filter((node): node is MotivationGraphNode =>
        node !== undefined && node.element.type === targetType
      );
  }

  /**
   * Compute influence paths between nodes
   */
  private computeInfluencePaths(
    nodes: Map<string, MotivationGraphNode>,
    adjacencyLists: { outgoing: Map<string, Set<string>>; incoming: Map<string, Set<string>> }
  ): Map<string, InfluencePath[]> {
    const pathsMap = new Map<string, InfluencePath[]>();

    // For demonstration, compute paths between stakeholders and goals
    const stakeholders = Array.from(nodes.values()).filter(
      n => n.element.type === MotivationElementType.Stakeholder
    );
    const goals = Array.from(nodes.values()).filter(
      n => n.element.type === MotivationElementType.Goal
    );

    for (const stakeholder of stakeholders) {
      for (const goal of goals) {
        const paths = this.findPaths(
          stakeholder.element.id,
          goal.element.id,
          adjacencyLists.outgoing,
          this.options.maxPathLength || 10
        );

        if (paths.length > 0) {
          const key = `${stakeholder.element.id}:${goal.element.id}`;
          pathsMap.set(key, paths);
        }
      }
    }

    return pathsMap;
  }

  /**
   * Find all paths between source and target (up to maxLength)
   */
  private findPaths(
    source: string,
    target: string,
    adjacencyList: Map<string, Set<string>>,
    maxLength: number
  ): InfluencePath[] {
    const paths: InfluencePath[] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[], edges: string[]): void => {
      if (path.length > maxLength) {
        return;
      }

      if (current === target && path.length > 1) {
        paths.push({
          id: `path-${paths.length}`,
          sourceId: source,
          targetId: target,
          path: [...path],
          edges: [...edges],
          length: path.length - 1,
          pathType: visited.has(current) ? 'cyclic' : path.length === 2 ? 'direct' : 'indirect'
        });
        return;
      }

      visited.add(current);

      const neighbors = adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path, neighbor], [...edges, `${current}-${neighbor}`]);
        }
      }

      visited.delete(current);
    };

    dfs(source, [source], []);
    return paths;
  }

  /**
   * Build graph metadata
   */
  private buildMetadata(
    nodes: Map<string, MotivationGraphNode>,
    edges: Map<string, MotivationGraphEdge>,
    conflicts: ConflictDetection[]
  ): MotivationGraphMetadata {
    // Count elements by type
    const elementCounts: Record<MotivationElementType, number> = {} as any;
    for (const type of Object.values(MotivationElementType)) {
      elementCounts[type] = 0;
    }
    for (const node of nodes.values()) {
      const type = node.element.type as MotivationElementType;
      if (elementCounts[type] !== undefined) {
        elementCounts[type]++;
      }
    }

    // Count relationships by type
    const relationshipCounts: Record<MotivationRelationshipType, number> = {} as any;
    for (const type of Object.values(MotivationRelationshipType)) {
      relationshipCounts[type] = 0;
    }
    for (const edge of edges.values()) {
      relationshipCounts[edge.type]++;
    }

    // Calculate max influence depth
    let maxInfluenceDepth = 0;
    for (const node of nodes.values()) {
      maxInfluenceDepth = Math.max(maxInfluenceDepth, node.metrics.influenceDepth);
    }

    // Calculate average clustering
    let averageClustering: number | undefined;
    if (this.options.calculateAdvancedMetrics) {
      let sum = 0;
      let count = 0;
      for (const node of nodes.values()) {
        if (node.metrics.clusteringCoefficient !== undefined) {
          sum += node.metrics.clusteringCoefficient;
          count++;
        }
      }
      averageClustering = count > 0 ? sum / count : 0;
    }

    // Calculate graph density
    const n = nodes.size;
    const maxEdges = n * (n - 1); // Directed graph
    const density = maxEdges > 0 ? edges.size / maxEdges : 0;

    return {
      elementCounts,
      relationshipCounts,
      maxInfluenceDepth,
      averageClustering,
      conflicts,
      density,
      warnings: [...this.warnings]
    };
  }

  /**
   * Apply a single changeset change to the graph
   */
  private applyChange(graph: MotivationGraph, change: ChangesetChange): void {
    switch (change.operation) {
      case 'add':
        this.applyAddChange(graph, change);
        break;
      case 'update':
        this.applyUpdateChange(graph, change);
        break;
      case 'delete':
        this.applyDeleteChange(graph, change);
        break;
    }
  }

  /**
   * Apply add operation
   */
  private applyAddChange(graph: MotivationGraph, change: ChangesetChange): void {
    const elementData = change.data || {};
    const name = typeof elementData.name === 'string' ? elementData.name : change.element_id;

    const element: ModelElement = {
      id: change.element_id,
      type: change.element_type,
      name,
      layerId: 'Motivation',
      properties: elementData,
      visual: {
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        style: {
          backgroundColor: '#d1fae5',
          borderColor: '#10b981'
        }
      }
    };

    const node: MotivationGraphNode = {
      id: element.id,
      element,
      metrics: {
        degreeCentrality: 0,
        inDegree: 0,
        outDegree: 0,
        influenceDepth: 0,
        influenceHeight: 0
      },
      adjacency: {
        incoming: [],
        outgoing: []
      },
      changesetOperation: 'add'
    };

    graph.nodes.set(element.id, node);
  }

  /**
   * Apply update operation
   */
  private applyUpdateChange(graph: MotivationGraph, change: ChangesetChange): void {
    const existingNode = graph.nodes.get(change.element_id);
    if (!existingNode) {
      this.warnings.push(`Cannot update non-existent node: ${change.element_id}`);
      return;
    }

    const updatedData = change.after || change.data || {};

    // Update element properties
    existingNode.element.properties = {
      ...existingNode.element.properties,
      ...updatedData
    };

    if (typeof updatedData.name === 'string') {
      existingNode.element.name = updatedData.name;
    }

    // Update visual style
    existingNode.element.visual.style.backgroundColor = '#fef3c7';
    existingNode.element.visual.style.borderColor = '#f59e0b';
    existingNode.changesetOperation = 'update';
  }

  /**
   * Apply delete operation
   */
  private applyDeleteChange(graph: MotivationGraph, change: ChangesetChange): void {
    const existingNode = graph.nodes.get(change.element_id);
    if (!existingNode) {
      return;
    }

    // Mark as deleted but keep in graph (ghost element)
    existingNode.element.visual.style.backgroundColor = '#fee2e2';
    existingNode.element.visual.style.borderColor = '#ef4444';
    existingNode.changesetOperation = 'delete';
  }

  /**
   * Check if element type is a motivation element
   */
  private isMotivationElement(type: string): boolean {
    return isValidMotivationElement(type);
  }

  /**
   * Map relationship type to MotivationRelationshipType
   */
  private mapRelationshipType(type: string | any): MotivationRelationshipType {
    const typeStr = typeof type === 'string' ? type.toLowerCase() : String(type).toLowerCase();
    return RELATIONSHIP_TYPE_MAP[typeStr] || MotivationRelationshipType.Custom;
  }

  /**
   * Determine relationship direction
   */
  private determineDirection(type: MotivationRelationshipType): RelationshipDirection {
    // Most motivation relationships are directional
    switch (type) {
      case MotivationRelationshipType.Influence:
      case MotivationRelationshipType.Motivates:
      case MotivationRelationshipType.Constrains:
      case MotivationRelationshipType.Realizes:
      case MotivationRelationshipType.Refines:
        return RelationshipDirection.Outgoing;

      case MotivationRelationshipType.Conflicts:
        return RelationshipDirection.Bidirectional;

      default:
        return RelationshipDirection.Outgoing;
    }
  }

  /**
   * Create an empty graph
   */
  private createEmptyGraph(): MotivationGraph {
    return {
      nodes: new Map(),
      edges: new Map(),
      metadata: {
        elementCounts: {} as any,
        relationshipCounts: {} as any,
        maxInfluenceDepth: 0,
        conflicts: [],
        density: 0,
        warnings: ['No motivation layer found in MetaModel']
      },
      adjacencyLists: {
        outgoing: new Map(),
        incoming: new Map()
      }
    };
  }

  /**
   * Get warnings from last build operation
   */
  getWarnings(): string[] {
    return this.warnings;
  }

  /**
   * Get performance warnings from path tracing operations
   */
  getPerformanceWarnings(): Array<{operation: string; duration: number; timestamp: number}> {
    return this.performanceWarnings;
  }

  /**
   * Clear path cache
   */
  clearPathCache(): void {
    this.pathCache.clear();
  }

  /**
   * Measure performance of a function and log warnings if it exceeds threshold
   */
  private measurePerformance<T>(
    operationName: string,
    threshold: number,
    fn: () => T
  ): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > threshold) {
      const warning = {
        operation: operationName,
        duration,
        timestamp: Date.now()
      };
      this.performanceWarnings.push(warning);
      console.warn(`[MotivationGraphBuilder] Performance warning: ${operationName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    return result;
  }

  /**
   * Get all direct relationships (edges) connected to a node
   * @returns Array of edge IDs
   */
  getDirectRelationships(nodeId: string, graph: MotivationGraph): MotivationGraphEdge[] {
    const relationships: MotivationGraphEdge[] = [];

    for (const edge of graph.edges.values()) {
      if (edge.sourceId === nodeId || edge.targetId === nodeId) {
        relationships.push(edge);
      }
    }

    return relationships;
  }

  /**
   * Trace upstream influences backward to root drivers
   * Traverses incoming edges to find all elements that influence the starting node
   * @param nodeId - Starting node ID
   * @param graph - Motivation graph
   * @param maxDepth - Maximum depth to traverse (default: 10)
   * @returns Set of influenced node IDs and edges in the chain
   */
  traceUpstreamInfluences(
    nodeId: string,
    graph: MotivationGraph,
    maxDepth: number = 10
  ): { nodeIds: Set<string>; edgeIds: Set<string>; paths: InfluencePath[] } {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const paths: InfluencePath[] = [];

    const visited = new Set<string>();

    const traverse = (currentId: string, depth: number, path: string[], edges: string[]): void => {
      if (depth >= maxDepth || visited.has(currentId)) {
        return;
      }

      visited.add(currentId);
      nodeIds.add(currentId);

      // Get incoming neighbors
      const incomingNeighbors = graph.adjacencyLists.incoming.get(currentId) || new Set();

      for (const neighborId of incomingNeighbors) {
        // Find the edge
        for (const edge of graph.edges.values()) {
          if (edge.sourceId === neighborId && edge.targetId === currentId) {
            edgeIds.add(edge.id);

            // Record path
            const newPath = [neighborId, ...path];
            const newEdges = [edge.id, ...edges];

            if (newPath.length > 1) {
              paths.push({
                id: `upstream-${paths.length}`,
                sourceId: neighborId,
                targetId: nodeId,
                path: newPath,
                edges: newEdges,
                length: newPath.length - 1,
                pathType: newPath.length === 2 ? 'direct' : 'indirect'
              });
            }

            // Continue traversing
            traverse(neighborId, depth + 1, newPath, newEdges);
          }
        }
      }
    };

    traverse(nodeId, 0, [nodeId], []);

    return { nodeIds, edgeIds, paths };
  }

  /**
   * Trace downstream impacts forward to leaf outcomes
   * Traverses outgoing edges to find all elements influenced by the starting node
   * @param nodeId - Starting node ID
   * @param graph - Motivation graph
   * @param maxDepth - Maximum depth to traverse (default: 10)
   * @returns Set of influenced node IDs and edges in the chain
   */
  traceDownstreamImpacts(
    nodeId: string,
    graph: MotivationGraph,
    maxDepth: number = 10
  ): { nodeIds: Set<string>; edgeIds: Set<string>; paths: InfluencePath[] } {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const paths: InfluencePath[] = [];

    const visited = new Set<string>();

    const traverse = (currentId: string, depth: number, path: string[], edges: string[]): void => {
      if (depth >= maxDepth || visited.has(currentId)) {
        return;
      }

      visited.add(currentId);
      nodeIds.add(currentId);

      // Get outgoing neighbors
      const outgoingNeighbors = graph.adjacencyLists.outgoing.get(currentId) || new Set();

      for (const neighborId of outgoingNeighbors) {
        // Find the edge
        for (const edge of graph.edges.values()) {
          if (edge.sourceId === currentId && edge.targetId === neighborId) {
            edgeIds.add(edge.id);

            // Record path
            const newPath = [...path, neighborId];
            const newEdges = [...edges, edge.id];

            if (newPath.length > 1) {
              paths.push({
                id: `downstream-${paths.length}`,
                sourceId: nodeId,
                targetId: neighborId,
                path: newPath,
                edges: newEdges,
                length: newPath.length - 1,
                pathType: newPath.length === 2 ? 'direct' : 'indirect'
              });
            }

            // Continue traversing
            traverse(neighborId, depth + 1, newPath, newEdges);
          }
        }
      }
    };

    traverse(nodeId, 0, [nodeId], []);

    return { nodeIds, edgeIds, paths };
  }

  /**
   * Find all paths between two nodes using breadth-first search
   * Highlights shortest path differently
   * @param sourceId - Starting node ID
   * @param targetId - Ending node ID
   * @param graph - Motivation graph
   * @param maxPaths - Maximum number of paths to find (default: 10)
   * @returns Array of influence paths, with shortest path first and marked
   */
  findPathsBetween(
    sourceId: string,
    targetId: string,
    graph: MotivationGraph,
    maxPaths: number = 10
  ): InfluencePath[] {
    // Check cache first
    const cacheKey = `${sourceId}:${targetId}:${maxPaths}`;
    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey)!;
    }

    // Measure performance (200ms threshold for 10-hop chains)
    const paths = this.measurePerformance(
      `findPathsBetween(${sourceId}, ${targetId})`,
      200,
      () => this.computePathsBFS(sourceId, targetId, graph, maxPaths)
    );

    // Cache the result
    this.pathCache.set(cacheKey, paths);

    return paths;
  }

  /**
   * Internal BFS implementation for finding paths
   */
  private computePathsBFS(
    sourceId: string,
    targetId: string,
    graph: MotivationGraph,
    maxPaths: number
  ): InfluencePath[] {
    const paths: InfluencePath[] = [];

    // BFS to find all paths
    interface QueueItem {
      currentId: string;
      path: string[];
      edges: string[];
      visited: Set<string>;
    }

    const queue: QueueItem[] = [{
      currentId: sourceId,
      path: [sourceId],
      edges: [],
      visited: new Set([sourceId])
    }];

    let shortestLength = Infinity;

    while (queue.length > 0 && paths.length < maxPaths) {
      const item = queue.shift()!;

      // Found target
      if (item.currentId === targetId) {
        const pathLength = item.path.length - 1;

        // Track shortest path length
        if (pathLength < shortestLength) {
          shortestLength = pathLength;
        }

        paths.push({
          id: `path-${paths.length}`,
          sourceId,
          targetId,
          path: item.path,
          edges: item.edges,
          length: pathLength,
          pathType: pathLength === 1 ? 'direct' : 'indirect',
          isShortestPath: false // Will be set after sorting
        });

        continue;
      }

      // Explore neighbors
      const outgoingNeighbors = graph.adjacencyLists.outgoing.get(item.currentId) || new Set();

      for (const neighborId of outgoingNeighbors) {
        if (item.visited.has(neighborId)) {
          continue; // Avoid cycles
        }

        // Find edge
        for (const edge of graph.edges.values()) {
          if (edge.sourceId === item.currentId && edge.targetId === neighborId) {
            const newVisited = new Set(item.visited);
            newVisited.add(neighborId);

            queue.push({
              currentId: neighborId,
              path: [...item.path, neighborId],
              edges: [...item.edges, edge.id],
              visited: newVisited
            });
            break;
          }
        }
      }
    }

    // Sort paths by length (shortest first)
    paths.sort((a, b) => a.length - b.length);

    // Mark shortest path(s) for special highlighting
    if (paths.length > 0) {
      const minLength = paths[0].length;
      for (const path of paths) {
        if (path.length === minLength) {
          path.isShortestPath = true;
        } else {
          break; // Paths are sorted by length
        }
      }
    }

    return paths;
  }
}
