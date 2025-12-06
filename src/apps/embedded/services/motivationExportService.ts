/**
 * Motivation Export Service
 * Handles export operations for motivation layer visualization:
 * - PNG/SVG image exports
 * - JSON graph data exports
 * - Traceability report generation
 */

import { Node, Edge,   } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import { MotivationGraph, MotivationElementType } from '../types/motivationGraph';

/**
 * Traceability report structure for requirement→goal mapping
 */
export interface TraceabilityReport {
  /** Model version */
  modelVersion: string;

  /** Export timestamp */
  exportTimestamp: string;

  /** Requirements with their traced goals */
  requirements: RequirementTrace[];

  /** Requirements without goal coverage */
  orphanedRequirements: string[];

  /** Goals without requirement coverage */
  orphanedGoals: string[];

  /** Coverage statistics */
  coverageStatistics: CoverageStatistics;
}

export interface RequirementTrace {
  /** Requirement ID */
  id: string;

  /** Requirement name */
  name: string;

  /** Priority level */
  priority?: string;

  /** Goals this requirement supports/realizes */
  goals: string[];

  /** Trace paths from requirement to goals */
  tracePaths: string[][];

  /** Whether this requirement has at least one goal */
  hasCoverage: boolean;
}

export interface CoverageStatistics {
  /** Total number of goals */
  totalGoals: number;

  /** Goals with at least one requirement */
  goalsWithRequirements: number;

  /** Goal coverage percentage */
  goalCoveragePercentage: number;

  /** Total number of requirements */
  totalRequirements: number;

  /** Requirements with at least one goal */
  requirementsWithGoals: number;

  /** Requirement coverage percentage */
  requirementCoveragePercentage: number;
}

/**
 * Export current viewport as PNG image
 */
export async function exportAsPNG(
  reactFlowContainer: HTMLElement,
  filename: string = 'motivation-graph.png'
): Promise<void> {
  try {
    console.log('[MotivationExportService] Exporting as PNG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Unable to export: The graph container is not available. Please reload the page and try again.');
    }

    // Find the ReactFlow wrapper element
    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate the graph canvas for export. Please make sure the motivation graph is visible and try again.');
    }

    // Generate PNG using html-to-image
    const dataUrl = await toPng(reactFlowWrapper, {
      backgroundColor: '#ffffff',
      quality: 1.0,
      pixelRatio: 2, // Higher resolution
      filter: (node) => {
        // Exclude controls and minimap from export
        if (node instanceof HTMLElement) {
          return !node.classList.contains('react-flow__controls') &&
                 !node.classList.contains('react-flow__minimap') &&
                 !node.classList.contains('react-flow__panel');
        }
        return true;
      }
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    console.log('[MotivationExportService] PNG export successful');
  } catch (error) {
    console.error('[MotivationExportService] PNG export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export image: ${errorMessage}`);
  }
}

/**
 * Export current viewport as SVG image
 */
export async function exportAsSVG(
  reactFlowContainer: HTMLElement,
  filename: string = 'motivation-graph.svg'
): Promise<void> {
  try {
    console.log('[MotivationExportService] Exporting as SVG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Unable to export: The graph container is not available. Please reload the page and try again.');
    }

    // Find the ReactFlow wrapper element
    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate the graph canvas for export. Please make sure the motivation graph is visible and try again.');
    }

    // Generate SVG using html-to-image
    const dataUrl = await toSvg(reactFlowWrapper, {
      backgroundColor: '#ffffff',
      filter: (node) => {
        // Exclude controls and minimap from export
        if (node instanceof HTMLElement) {
          return !node.classList.contains('react-flow__controls') &&
                 !node.classList.contains('react-flow__minimap') &&
                 !node.classList.contains('react-flow__panel');
        }
        return true;
      }
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    console.log('[MotivationExportService] SVG export successful');
  } catch (error) {
    console.error('[MotivationExportService] SVG export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export SVG: ${errorMessage}`);
  }
}

/**
 * Export filtered graph data as JSON
 */
export function exportGraphDataAsJSON(
  nodes: Node[],
  edges: Edge[],
  motivationGraph: MotivationGraph,
  filename: string = 'motivation-graph-data.json'
): void {
  try {
    console.log('[MotivationExportService] Exporting graph data as JSON:', filename);

    const exportData = {
      version: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        elementCounts: motivationGraph.metadata.elementCounts,
        relationshipCounts: motivationGraph.metadata.relationshipCounts,
      },
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        label: edge.label,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    console.log('[MotivationExportService] Graph data export successful');
  } catch (error) {
    console.error('[MotivationExportService] Graph data export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export graph data: ${errorMessage}`);
  }
}

/**
 * Generate and export traceability report (requirement→goal mapping)
 */
export function exportTraceabilityReport(
  motivationGraph: MotivationGraph,
  filename: string = 'traceability-report.json'
): void {
  try {
    console.log('[MotivationExportService] Generating traceability report');

    // Extract requirements and goals
    const requirements = Array.from(motivationGraph.nodes.values())
      .filter(n => n.element.type === MotivationElementType.Requirement);

    const goals = Array.from(motivationGraph.nodes.values())
      .filter(n => n.element.type === MotivationElementType.Goal);

    console.log(`[MotivationExportService] Found ${requirements.length} requirements and ${goals.length} goals`);

    // Build requirement traces
    const requirementTraces: RequirementTrace[] = [];
    const orphanedRequirements: string[] = [];

    for (const req of requirements) {
      // Find all goals this requirement traces to
      const tracedGoals = new Set<string>();
      const tracePaths: string[][] = [];

      // Direct relationships
      const outgoingEdges = Array.from(motivationGraph.edges.values())
        .filter(e => e.sourceId === req.element.id);

      for (const edge of outgoingEdges) {
        const targetNode = motivationGraph.nodes.get(edge.targetId);
        if (targetNode && targetNode.element.type === MotivationElementType.Goal) {
          tracedGoals.add(edge.targetId);
          tracePaths.push([req.element.id, edge.targetId]);
        }
      }

      // Indirect relationships (via outcomes, drivers, etc.)
      // Traverse up to 3 hops to find goals
      const visited = new Set<string>();
      const queue: Array<{nodeId: string, path: string[]}> = [{ nodeId: req.element.id, path: [req.element.id] }];

      while (queue.length > 0) {
        const {nodeId, path} = queue.shift()!;

        if (path.length > 4) continue; // Max 3 hops
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const outgoing = Array.from(motivationGraph.edges.values())
          .filter(e => e.sourceId === nodeId);

        for (const edge of outgoing) {
          const targetNode = motivationGraph.nodes.get(edge.targetId);
          if (!targetNode) continue;

          const newPath = [...path, edge.targetId];

          if (targetNode.element.type === MotivationElementType.Goal) {
            tracedGoals.add(edge.targetId);
            if (newPath.length > 2) { // Only record indirect paths
              tracePaths.push(newPath);
            }
          } else if (path.length < 4) {
            // Continue traversing
            queue.push({ nodeId: edge.targetId, path: newPath });
          }
        }
      }

      const goalIds = Array.from(tracedGoals);
      const hasCoverage = goalIds.length > 0;

      requirementTraces.push({
        id: req.element.id,
        name: req.element.name,
        priority: req.element.properties?.priority as string | undefined,
        goals: goalIds,
        tracePaths,
        hasCoverage
      });

      if (!hasCoverage) {
        orphanedRequirements.push(req.element.id);
      }
    }

    // Find orphaned goals (goals without requirements)
    const goalsWithRequirements = new Set<string>();
    requirementTraces.forEach(trace => {
      trace.goals.forEach(goalId => goalsWithRequirements.add(goalId));
    });

    const orphanedGoals = goals
      .filter(g => !goalsWithRequirements.has(g.element.id))
      .map(g => g.element.id);

    // Calculate coverage statistics
    const coverageStatistics: CoverageStatistics = {
      totalGoals: goals.length,
      goalsWithRequirements: goalsWithRequirements.size,
      goalCoveragePercentage: goals.length > 0 ? (goalsWithRequirements.size / goals.length) * 100 : 0,
      totalRequirements: requirements.length,
      requirementsWithGoals: requirementTraces.filter(t => t.hasCoverage).length,
      requirementCoveragePercentage: requirements.length > 0
        ? (requirementTraces.filter(t => t.hasCoverage).length / requirements.length) * 100
        : 0
    };

    // Build final report
    const report: TraceabilityReport = {
      modelVersion: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      requirements: requirementTraces,
      orphanedRequirements,
      orphanedGoals,
      coverageStatistics
    };

    console.log('[MotivationExportService] Traceability report generated:', {
      requirements: requirementTraces.length,
      orphanedRequirements: orphanedRequirements.length,
      orphanedGoals: orphanedGoals.length,
      goalCoverage: `${coverageStatistics.goalCoveragePercentage.toFixed(1)}%`,
      requirementCoverage: `${coverageStatistics.requirementCoveragePercentage.toFixed(1)}%`
    });

    // Export as JSON
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    console.log('[MotivationExportService] Traceability report exported successfully');
  } catch (error) {
    console.error('[MotivationExportService] Traceability report export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to generate traceability report: ${errorMessage}`);
  }
}
