/**
 * C4 Export Service
 * Handles export operations for C4 architecture visualization:
 * - PNG/SVG image exports
 * - JSON graph data exports
 * - Dependency report generation
 */

import { Node, Edge } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import { C4Graph, C4Type, ContainerType, ProtocolType } from '../types/c4Graph';

/**
 * Dependency report structure for container→container mapping
 */
export interface C4DependencyReport {
  /** Model version */
  modelVersion: string;

  /** Export timestamp */
  exportTimestamp: string;

  /** View level exported */
  viewLevel: string;

  /** Container dependencies */
  containers: ContainerDependency[];

  /** Orphaned containers (no incoming or outgoing) */
  orphanedContainers: string[];

  /** Technology distribution */
  technologyDistribution: Record<string, number>;

  /** Container type distribution */
  containerTypeDistribution: Record<ContainerType, number>;

  /** Dependency statistics */
  dependencyStatistics: DependencyStatistics;
}

export interface ContainerDependency {
  /** Container ID */
  id: string;

  /** Container name */
  name: string;

  /** Container type */
  containerType: ContainerType | undefined;

  /** Technology stack */
  technology: string[];

  /** Upstream dependencies (containers this depends on) */
  upstream: DependencyEdge[];

  /** Downstream dependents (containers that depend on this) */
  downstream: DependencyEdge[];

  /** Total number of dependencies */
  totalDependencies: number;
}

export interface DependencyEdge {
  /** Target/source container ID */
  containerId: string;

  /** Target/source container name */
  containerName: string;

  /** Communication protocol */
  protocol: ProtocolType;

  /** Description of the relationship */
  description: string;
}

export interface DependencyStatistics {
  /** Total number of containers */
  totalContainers: number;

  /** Total number of dependencies */
  totalDependencies: number;

  /** Average dependencies per container */
  averageDependencies: number;

  /** Container with most dependencies */
  mostConnected: {
    id: string;
    name: string;
    connectionCount: number;
  } | null;

  /** Containers with no dependencies */
  isolatedCount: number;
}

/**
 * Export current viewport as PNG image
 */
export async function exportC4AsPNG(
  reactFlowContainer: HTMLElement,
  filename: string = 'c4-diagram.png'
): Promise<void> {
  try {
    console.log('[C4ExportService] Exporting as PNG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Unable to export: The graph container is not available. Please reload the page and try again.');
    }

    // Find the ReactFlow wrapper element
    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate the graph canvas for export. Please make sure the C4 diagram is visible and try again.');
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

    console.log('[C4ExportService] PNG export successful');
  } catch (error) {
    console.error('[C4ExportService] PNG export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export image: ${errorMessage}`);
  }
}

/**
 * Export current viewport as SVG image
 */
export async function exportC4AsSVG(
  reactFlowContainer: HTMLElement,
  filename: string = 'c4-diagram.svg'
): Promise<void> {
  try {
    console.log('[C4ExportService] Exporting as SVG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Unable to export: The graph container is not available. Please reload the page and try again.');
    }

    // Find the ReactFlow wrapper element
    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate the graph canvas for export. Please make sure the C4 diagram is visible and try again.');
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

    console.log('[C4ExportService] SVG export successful');
  } catch (error) {
    console.error('[C4ExportService] SVG export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export SVG: ${errorMessage}`);
  }
}

/**
 * Export C4 graph data as JSON
 */
export function exportC4GraphAsJSON(
  nodes: Node[],
  edges: Edge[],
  c4Graph: C4Graph,
  filename: string = 'c4-graph-data.json'
): void {
  try {
    console.log('[C4ExportService] Exporting graph data as JSON:', filename);

    const exportData = {
      version: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      format: 'C4',
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        elementCounts: c4Graph.metadata.elementCounts,
        containerTypeCounts: c4Graph.metadata.containerTypeCounts,
        technologies: c4Graph.metadata.technologies,
        maxComponentDepth: c4Graph.metadata.maxComponentDepth,
        warnings: c4Graph.metadata.warnings,
      },
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          c4Type: node.data.c4Type,
          name: node.data.label || node.data.name,
          description: node.data.description,
          technology: node.data.technology,
          containerType: node.data.containerType,
          boundary: node.data.boundary,
        },
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        label: edge.label,
        data: edge.data,
      })),
      hierarchy: {
        systemBoundary: c4Graph.hierarchy.systemBoundary,
        containers: Object.fromEntries(
          Array.from(c4Graph.hierarchy.containers).map(([key, value]) => [
            key,
            Array.from(value),
          ])
        ),
        externalActors: c4Graph.hierarchy.externalActors,
      },
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    console.log('[C4ExportService] Graph data export successful');
  } catch (error) {
    console.error('[C4ExportService] Graph data export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export graph data: ${errorMessage}`);
  }
}

/**
 * Generate and export dependency report
 */
export function exportC4DependencyReport(
  c4Graph: C4Graph,
  viewLevel: string = 'context',
  filename: string = 'c4-dependency-report.json'
): void {
  try {
    console.log('[C4ExportService] Generating dependency report');

    // Get all containers
    const containers = Array.from(c4Graph.nodes.values()).filter(
      (n) => n.c4Type === C4Type.Container
    );

    console.log(`[C4ExportService] Found ${containers.length} containers`);

    // Build container dependencies
    const containerDependencies: ContainerDependency[] = [];
    const orphanedContainers: string[] = [];

    // Technology and container type distributions
    const technologyDistribution: Record<string, number> = {};
    const containerTypeDistribution: Record<ContainerType, number> = {} as Record<ContainerType, number>;

    // Initialize container type counts
    Object.values(ContainerType).forEach((type) => {
      containerTypeDistribution[type as ContainerType] = 0;
    });

    let maxConnections = 0;
    let mostConnected: DependencyStatistics['mostConnected'] = null;

    for (const container of containers) {
      // Count container types
      if (container.containerType) {
        containerTypeDistribution[container.containerType]++;
      }

      // Count technologies
      container.technology.forEach((tech) => {
        technologyDistribution[tech] = (technologyDistribution[tech] || 0) + 1;
      });

      // Find upstream dependencies (edges where this container is the source)
      const upstreamEdges = Array.from(c4Graph.edges.values()).filter(
        (e) => e.sourceId === container.id
      );
      const upstream: DependencyEdge[] = upstreamEdges.map((edge) => {
        const targetNode = c4Graph.nodes.get(edge.targetId);
        return {
          containerId: edge.targetId,
          containerName: targetNode?.name || edge.targetId,
          protocol: edge.protocol,
          description: edge.description,
        };
      });

      // Find downstream dependents (edges where this container is the target)
      const downstreamEdges = Array.from(c4Graph.edges.values()).filter(
        (e) => e.targetId === container.id
      );
      const downstream: DependencyEdge[] = downstreamEdges.map((edge) => {
        const sourceNode = c4Graph.nodes.get(edge.sourceId);
        return {
          containerId: edge.sourceId,
          containerName: sourceNode?.name || edge.sourceId,
          protocol: edge.protocol,
          description: edge.description,
        };
      });

      const totalDependencies = upstream.length + downstream.length;

      // Track most connected
      if (totalDependencies > maxConnections) {
        maxConnections = totalDependencies;
        mostConnected = {
          id: container.id,
          name: container.name,
          connectionCount: totalDependencies,
        };
      }

      // Track orphaned containers
      if (totalDependencies === 0) {
        orphanedContainers.push(container.id);
      }

      containerDependencies.push({
        id: container.id,
        name: container.name,
        containerType: container.containerType,
        technology: container.technology,
        upstream,
        downstream,
        totalDependencies,
      });
    }

    // Calculate statistics
    const totalDependencies = containerDependencies.reduce(
      (sum, c) => sum + c.totalDependencies,
      0
    );

    const dependencyStatistics: DependencyStatistics = {
      totalContainers: containers.length,
      totalDependencies: totalDependencies / 2, // Each edge counted twice (once upstream, once downstream)
      averageDependencies:
        containers.length > 0 ? totalDependencies / containers.length : 0,
      mostConnected,
      isolatedCount: orphanedContainers.length,
    };

    // Build final report
    const report: C4DependencyReport = {
      modelVersion: '1.0.0',
      exportTimestamp: new Date().toISOString(),
      viewLevel,
      containers: containerDependencies,
      orphanedContainers,
      technologyDistribution,
      containerTypeDistribution,
      dependencyStatistics,
    };

    console.log('[C4ExportService] Dependency report generated:', {
      containers: containerDependencies.length,
      orphaned: orphanedContainers.length,
      totalDependencies: dependencyStatistics.totalDependencies,
      mostConnected: mostConnected?.name,
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

    console.log('[C4ExportService] Dependency report exported successfully');
  } catch (error) {
    console.error('[C4ExportService] Dependency report export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to generate dependency report: ${errorMessage}`);
  }
}
