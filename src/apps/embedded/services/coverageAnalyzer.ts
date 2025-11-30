/**
 * CoverageAnalyzer
 *
 * Analyzes requirement coverage for goals in the motivation layer.
 * Identifies goals without supporting requirements (coverage gaps).
 */

import {
  MotivationGraph,
  MotivationGraphNode,
  MotivationElementType,
  MotivationRelationshipType,
} from '../types/motivationGraph';

/**
 * Coverage status for a goal
 */
export type CoverageStatus = 'complete' | 'partial' | 'none';

/**
 * Coverage information for a single goal
 */
export interface GoalCoverage {
  /** Goal node ID */
  goalId: string;

  /** Goal name */
  goalName: string;

  /** Coverage status */
  status: CoverageStatus;

  /** Number of linked requirements */
  requirementCount: number;

  /** IDs of linked requirements */
  requirementIds: string[];

  /** Number of linked constraints */
  constraintCount: number;

  /** IDs of linked constraints */
  constraintIds: string[];

  /** Coverage percentage (0-100) */
  coveragePercentage: number;
}

/**
 * Overall coverage summary
 */
export interface CoverageSummary {
  /** Total number of goals */
  totalGoals: number;

  /** Goals with complete coverage */
  completeCount: number;

  /** Goals with partial coverage */
  partialCount: number;

  /** Goals with no coverage */
  noneCount: number;

  /** Overall coverage percentage */
  overallCoverage: number;

  /** List of uncovered goals */
  uncoveredGoals: GoalCoverage[];

  /** List of partially covered goals */
  partiallyCoveredGoals: GoalCoverage[];

  /** All goal coverage details */
  goalCoverages: GoalCoverage[];
}

/**
 * Coverage thresholds for determining status
 */
export const COVERAGE_THRESHOLDS = {
  COMPLETE: 2, // At least 2 requirements for complete coverage
  PARTIAL: 1, // At least 1 requirement for partial coverage
} as const;

/**
 * Coverage Analyzer
 */
export class CoverageAnalyzer {
  /**
   * Analyze coverage for all goals in the graph
   */
  analyzeCoverage(graph: MotivationGraph): CoverageSummary {
    // Extract all goals
    const goals = this.extractGoals(graph);

    // Analyze coverage for each goal
    const goalCoverages = goals.map((goal) => this.analyzeGoalCoverage(goal, graph));

    // Calculate summary statistics
    const completeCount = goalCoverages.filter((gc) => gc.status === 'complete').length;
    const partialCount = goalCoverages.filter((gc) => gc.status === 'partial').length;
    const noneCount = goalCoverages.filter((gc) => gc.status === 'none').length;

    // Overall coverage percentage: (complete + 0.5*partial) / total
    const totalGoals = goalCoverages.length;
    const overallCoverage =
      totalGoals > 0 ? ((completeCount + partialCount * 0.5) / totalGoals) * 100 : 0;

    // Extract uncovered and partially covered goals
    const uncoveredGoals = goalCoverages.filter((gc) => gc.status === 'none');
    const partiallyCoveredGoals = goalCoverages.filter((gc) => gc.status === 'partial');

    return {
      totalGoals,
      completeCount,
      partialCount,
      noneCount,
      overallCoverage,
      uncoveredGoals,
      partiallyCoveredGoals,
      goalCoverages,
    };
  }

  /**
   * Analyze coverage for a single goal
   */
  private analyzeGoalCoverage(goal: MotivationGraphNode, graph: MotivationGraph): GoalCoverage {
    const goalId = goal.element.id;
    const goalName = goal.element.name;

    // Find all requirements linked to this goal
    const linkedRequirements = this.findLinkedRequirements(goalId, graph);
    const requirementIds = linkedRequirements.map((req) => req.element.id);
    const requirementCount = linkedRequirements.length;

    // Find all constraints linked to this goal
    const linkedConstraints = this.findLinkedConstraints(goalId, graph);
    const constraintIds = linkedConstraints.map((con) => con.element.id);
    const constraintCount = linkedConstraints.length;

    // Determine coverage status
    let status: CoverageStatus;
    let coveragePercentage: number;

    if (requirementCount >= COVERAGE_THRESHOLDS.COMPLETE) {
      status = 'complete';
      coveragePercentage = 100;
    } else if (requirementCount >= COVERAGE_THRESHOLDS.PARTIAL) {
      status = 'partial';
      coveragePercentage = 50;
    } else {
      status = 'none';
      coveragePercentage = 0;
    }

    return {
      goalId,
      goalName,
      status,
      requirementCount,
      requirementIds,
      constraintCount,
      constraintIds,
      coveragePercentage,
    };
  }

  /**
   * Extract all goal nodes from graph
   */
  private extractGoals(graph: MotivationGraph): MotivationGraphNode[] {
    const goals: MotivationGraphNode[] = [];

    for (const node of graph.nodes.values()) {
      if (node.element.type === MotivationElementType.Goal) {
        goals.push(node);
      }
    }

    return goals;
  }

  /**
   * Find all requirements linked to a goal
   * Looks for incoming relationships of type "realizes", "fulfills_requirements", "supports_goals"
   */
  private findLinkedRequirements(
    goalId: string,
    graph: MotivationGraph
  ): MotivationGraphNode[] {
    const linkedRequirements: MotivationGraphNode[] = [];

    // Find all edges where this goal is the target
    for (const edge of graph.edges.values()) {
      if (edge.targetId === goalId) {
        // Check if source is a requirement
        const sourceNode = graph.nodes.get(edge.sourceId);
        if (sourceNode && sourceNode.element.type === MotivationElementType.Requirement) {
          // Check if relationship type is appropriate
          if (
            edge.type === MotivationRelationshipType.Realizes ||
            edge.type === MotivationRelationshipType.FulfillsRequirements ||
            edge.type === MotivationRelationshipType.SupportsGoals
          ) {
            linkedRequirements.push(sourceNode);
          }
        }
      }

      // Also check outgoing edges from goal to requirements
      if (edge.sourceId === goalId) {
        const targetNode = graph.nodes.get(edge.targetId);
        if (targetNode && targetNode.element.type === MotivationElementType.Requirement) {
          linkedRequirements.push(targetNode);
        }
      }
    }

    // Deduplicate
    const uniqueRequirements = Array.from(
      new Map(linkedRequirements.map((req) => [req.element.id, req])).values()
    );

    return uniqueRequirements;
  }

  /**
   * Find all constraints linked to a goal
   */
  private findLinkedConstraints(goalId: string, graph: MotivationGraph): MotivationGraphNode[] {
    const linkedConstraints: MotivationGraphNode[] = [];

    for (const edge of graph.edges.values()) {
      // Constraints can constrain goals (outgoing from constraint)
      if (edge.targetId === goalId) {
        const sourceNode = graph.nodes.get(edge.sourceId);
        if (sourceNode && sourceNode.element.type === MotivationElementType.Constraint) {
          if (
            edge.type === MotivationRelationshipType.Constrains ||
            edge.type === MotivationRelationshipType.ConstrainedBy
          ) {
            linkedConstraints.push(sourceNode);
          }
        }
      }

      // Or goals can reference constraints (outgoing from goal)
      if (edge.sourceId === goalId) {
        const targetNode = graph.nodes.get(edge.targetId);
        if (targetNode && targetNode.element.type === MotivationElementType.Constraint) {
          linkedConstraints.push(targetNode);
        }
      }
    }

    // Deduplicate
    const uniqueConstraints = Array.from(
      new Map(linkedConstraints.map((con) => [con.element.id, con])).values()
    );

    return uniqueConstraints;
  }

  /**
   * Get coverage icon name based on status
   */
  getCoverageIcon(status: CoverageStatus): string {
    switch (status) {
      case 'complete':
        return '✓'; // Checkmark
      case 'partial':
        return '◐'; // Half-filled circle
      case 'none':
        return '⚠'; // Warning
      default:
        return '?';
    }
  }

  /**
   * Get coverage color based on status
   */
  getCoverageColor(status: CoverageStatus): { bg: string; color: string } {
    switch (status) {
      case 'complete':
        return { bg: '#d1fae5', color: '#059669' }; // Green
      case 'partial':
        return { bg: '#dbeafe', color: '#2563eb' }; // Blue
      case 'none':
        return { bg: '#fef3c7', color: '#f59e0b' }; // Amber
      default:
        return { bg: '#f3f4f6', color: '#6b7280' }; // Gray
    }
  }
}

/**
 * Singleton instance
 */
export const coverageAnalyzer = new CoverageAnalyzer();
