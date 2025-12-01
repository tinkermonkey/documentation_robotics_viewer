/**
 * Business Export Service
 * Handles export operations for business layer visualization:
 * - PNG/SVG image exports
 * - JSON graph data exports
 * - Business process catalog
 * - Traceability report generation (business→motivation/application/data)
 * - Impact analysis report
 */

import { Node, Edge } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import { BusinessGraph, CrossLayerLink } from '../types/businessLayer';
import { analyzeImpact } from './impactAnalysisService';

/**
 * Process catalog entry
 */
export interface ProcessCatalogEntry {
  id: string;
  name: string;
  type: string;
  description?: string;
  owner?: string;
  criticality?: string;
  lifecycle?: string;
  domain?: string;
  subprocessCount?: number;
  relationships: {
    upstream: Array<{ type: string; process: string }>;
    downstream: Array<{ type: string; process: string }>;
  };
}

/**
 * Process catalog structure
 */
export interface ProcessCatalog {
  generated: string;
  processCount: number;
  processes: ProcessCatalogEntry[];
}

/**
 * Traceability report for business→application→data mappings
 */
export interface BusinessTraceabilityReport {
  generated: string;
  summary: {
    totalProcesses: number;
    processesWithMotivationLinks: number;
    processesWithApplicationRealization: number;
    processesWithDataDependencies: number;
    orphanedProcesses: number;
    coverage: {
      motivation: string;
      application: string;
      data: string;
    };
  };
  traceability: Array<{
    process: { id: string; name: string; type: string };
    realizesGoals: Array<{ id: string; type: string }>;
    realizedByComponents: Array<{ id: string; type: string }>;
    usesDataEntities: Array<{ id: string; type: string }>;
  }>;
  orphanedProcesses: Array<{ id: string; name: string }>;
}

/**
 * Impact analysis report structure
 */
export interface ImpactAnalysisReport {
  generated: string;
  changedProcesses: Array<{ id: string; name?: string }>;
  impact: {
    directImpact: number;
    indirectImpact: number;
    totalImpact: number;
    maxPathLength: number;
  };
  impactedProcesses: Array<{ id: string; name?: string; type?: string }>;
  impactPaths: Array<{
    path: string[];
    length: number;
  }>;
}

/**
 * Export current viewport as PNG image
 * Reuses logic from motivationExportService
 */
export async function exportAsPNG(
  reactFlowContainer: HTMLElement,
  filename: string = 'business-layer.png'
): Promise<void> {
  try {
    console.log('[BusinessExportService] Exporting as PNG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Unable to export: The graph container is not available. Please reload the page and try again.');
    }

    // Find the ReactFlow wrapper element
    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate the graph canvas for export. Please make sure the business graph is visible and try again.');
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

    console.log('[BusinessExportService] PNG export successful');
  } catch (error) {
    console.error('[BusinessExportService] PNG export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export image: ${errorMessage}`);
  }
}

/**
 * Export current viewport as SVG image
 * Reuses logic from motivationExportService
 */
export async function exportAsSVG(
  reactFlowContainer: HTMLElement,
  filename: string = 'business-layer.svg'
): Promise<void> {
  try {
    console.log('[BusinessExportService] Exporting as SVG:', filename);

    if (!reactFlowContainer) {
      throw new Error('Unable to export: The graph container is not available. Please reload the page and try again.');
    }

    // Find the ReactFlow wrapper element
    const reactFlowWrapper = reactFlowContainer.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowWrapper) {
      throw new Error('Unable to locate the graph canvas for export. Please make sure the business graph is visible and try again.');
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

    console.log('[BusinessExportService] SVG export successful');
  } catch (error) {
    console.error('[BusinessExportService] SVG export failed:', error);
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
  businessGraph: BusinessGraph,
  filename: string = 'business-graph-data.json'
): void {
  try {
    console.log('[BusinessExportService] Exporting graph data as JSON:', filename);

    const graphData = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        layers: {
          functions: businessGraph.indices.byType.get('function')?.size || 0,
          processes: businessGraph.indices.byType.get('process')?.size || 0,
          services: businessGraph.indices.byType.get('service')?.size || 0,
          capabilities: businessGraph.indices.byType.get('capability')?.size || 0,
        },
        metrics: {
          totalNodes: businessGraph.metrics.nodeCount,
          totalEdges: businessGraph.metrics.edgeCount,
          averageConnectivity: businessGraph.metrics.averageConnectivity,
          maxHierarchyDepth: businessGraph.metrics.maxHierarchyDepth,
          circularDependencyCount: businessGraph.metrics.circularDependencies.length,
          orphanedNodeCount: businessGraph.metrics.orphanedNodes.length,
        },
      },
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        label: e.label
      })),
    };

    downloadJSON(graphData, filename);

    console.log('[BusinessExportService] Graph data export successful');
  } catch (error) {
    console.error('[BusinessExportService] Graph data export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export graph data: ${errorMessage}`);
  }
}

/**
 * Export business process catalog
 * Includes all processes with metadata and relationships
 */
export function exportProcessCatalog(
  businessGraph: BusinessGraph,
  filename: string = 'business-catalog.json'
): void {
  try {
    console.log('[BusinessExportService] Exporting process catalog:', filename);

    const catalog: ProcessCatalog = {
      generated: new Date().toISOString(),
      processCount: businessGraph.nodes.size,
      processes: Array.from(businessGraph.nodes.values()).map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        description: node.description,
        owner: node.metadata.owner,
        criticality: node.metadata.criticality,
        lifecycle: node.metadata.lifecycle,
        domain: node.metadata.domain,
        subprocessCount: node.metadata.subprocessCount,
        relationships: {
          upstream: Array.from(businessGraph.edges.values())
            .filter(e => e.target === node.id)
            .map(e => ({ type: e.type, process: e.source })),
          downstream: Array.from(businessGraph.edges.values())
            .filter(e => e.source === node.id)
            .map(e => ({ type: e.type, process: e.target })),
        },
      })),
    };

    downloadJSON(catalog, filename);

    console.log('[BusinessExportService] Process catalog export successful');
  } catch (error) {
    console.error('[BusinessExportService] Process catalog export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to export process catalog: ${errorMessage}`);
  }
}

/**
 * Generate and export traceability report
 * Maps business processes to motivation, application, and data layers
 */
export function exportTraceabilityReport(
  businessGraph: BusinessGraph,
  crossLayerLinks: CrossLayerLink[],
  filename: string = 'traceability-report.json'
): void {
  try {
    console.log('[BusinessExportService] Generating traceability report');

    // Track processes with various types of links
    const processesWithMotivation = new Set<string>();
    const processesWithApplication = new Set<string>();
    const processesWithData = new Set<string>();

    // Analyze cross-layer links
    crossLayerLinks.forEach(link => {
      if (link.targetLayer === 'motivation') {
        processesWithMotivation.add(link.source);
      }
      if (link.targetLayer === 'application') {
        processesWithApplication.add(link.source);
      }
      if (link.targetLayer === 'data_model') {
        processesWithData.add(link.source);
      }
    });

    // Find orphaned processes (not realized by any component)
    const orphanedProcesses = Array.from(businessGraph.nodes.values())
      .filter(node =>
        node.type === 'process' &&
        !processesWithApplication.has(node.id)
      )
      .map(node => ({ id: node.id, name: node.name }));

    // Build traceability entries
    const traceability = Array.from(businessGraph.nodes.values()).map(node => ({
      process: {
        id: node.id,
        name: node.name,
        type: node.type,
      },
      realizesGoals: crossLayerLinks
        .filter(l => l.source === node.id && l.targetLayer === 'motivation')
        .map(l => ({ id: l.target, type: l.type })),
      realizedByComponents: crossLayerLinks
        .filter(l => l.source === node.id && l.targetLayer === 'application')
        .map(l => ({ id: l.target, type: l.type })),
      usesDataEntities: crossLayerLinks
        .filter(l => l.source === node.id && l.targetLayer === 'data_model')
        .map(l => ({ id: l.target, type: l.type })),
    }));

    // Calculate coverage statistics
    const totalProcesses = businessGraph.nodes.size;
    const motivationCoverage = totalProcesses > 0
      ? `${((processesWithMotivation.size / totalProcesses) * 100).toFixed(1)}%`
      : '0%';
    const applicationCoverage = totalProcesses > 0
      ? `${((processesWithApplication.size / totalProcesses) * 100).toFixed(1)}%`
      : '0%';
    const dataCoverage = totalProcesses > 0
      ? `${((processesWithData.size / totalProcesses) * 100).toFixed(1)}%`
      : '0%';

    const report: BusinessTraceabilityReport = {
      generated: new Date().toISOString(),
      summary: {
        totalProcesses,
        processesWithMotivationLinks: processesWithMotivation.size,
        processesWithApplicationRealization: processesWithApplication.size,
        processesWithDataDependencies: processesWithData.size,
        orphanedProcesses: orphanedProcesses.length,
        coverage: {
          motivation: motivationCoverage,
          application: applicationCoverage,
          data: dataCoverage,
        },
      },
      traceability,
      orphanedProcesses,
    };

    console.log('[BusinessExportService] Traceability report generated:', {
      totalProcesses,
      processesWithMotivation: processesWithMotivation.size,
      processesWithApplication: processesWithApplication.size,
      processesWithData: processesWithData.size,
      orphanedProcesses: orphanedProcesses.length,
      coverages: report.summary.coverage,
    });

    downloadJSON(report, filename);

    console.log('[BusinessExportService] Traceability report exported successfully');
  } catch (error) {
    console.error('[BusinessExportService] Traceability report export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to generate traceability report: ${errorMessage}`);
  }
}

/**
 * Generate and export impact analysis report
 * Analyzes upstream/downstream dependencies for selected processes
 */
export function exportImpactAnalysisReport(
  selectedNodes: Set<string>,
  businessGraph: BusinessGraph,
  filename: string = 'impact-analysis.json'
): void {
  try {
    console.log('[BusinessExportService] Generating impact analysis report');

    // Run impact analysis
    const impactResult = analyzeImpact(selectedNodes, businessGraph);

    // Build report with human-readable process names
    const report: ImpactAnalysisReport = {
      generated: new Date().toISOString(),
      changedProcesses: Array.from(selectedNodes).map(id => {
        const node = businessGraph.nodes.get(id);
        return { id, name: node?.name };
      }),
      impact: impactResult.summary,
      impactedProcesses: Array.from(impactResult.impactedProcesses).map(id => {
        const node = businessGraph.nodes.get(id);
        return { id, name: node?.name, type: node?.type };
      }),
      impactPaths: impactResult.impactPaths.map(p => ({
        path: p.path.map(id => {
          const node = businessGraph.nodes.get(id);
          return node?.name || id;
        }),
        length: p.length,
      })),
    };

    console.log('[BusinessExportService] Impact analysis report generated:', {
      changedProcesses: selectedNodes.size,
      totalImpact: impactResult.summary.totalImpact,
      directImpact: impactResult.summary.directImpact,
      indirectImpact: impactResult.summary.indirectImpact,
      maxPathLength: impactResult.summary.maxPathLength,
    });

    downloadJSON(report, filename);

    console.log('[BusinessExportService] Impact analysis report exported successfully');
  } catch (error) {
    console.error('[BusinessExportService] Impact analysis report export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`Unable to generate impact analysis report: ${errorMessage}`);
  }
}

/**
 * Helper function to download JSON data as a file
 */
function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
