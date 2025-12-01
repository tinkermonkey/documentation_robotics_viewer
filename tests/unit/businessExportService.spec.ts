/**
 * Unit tests for businessExportService
 *
 * Tests data structure generation for all export functions.
 * PNG/SVG exports are tested in E2E tests.
 */

import { test, expect } from '@playwright/test';
import { exportProcessCatalog, exportGraphDataAsJSON, exportTraceabilityReport, exportImpactAnalysisReport } from '../../src/core/services/businessExportService';
import { BusinessGraph, BusinessNode, BusinessEdge, CrossLayerLink } from '../../src/core/types/businessLayer';
import type { Node, Edge } from '@xyflow/react';

// Mock downloadJSON by capturing calls
let capturedExportData: unknown = null;
let capturedFilename: string = '';

// Mock the download mechanism
test.beforeEach(() => {
  capturedExportData = null;
  capturedFilename = '';

  // Mock URL.createObjectURL and revokeObjectURL
  global.URL.createObjectURL = () => 'mock-url';
  global.URL.revokeObjectURL = () => {};

  // Mock document.createElement to intercept download
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = (tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName === 'a') {
      // Override click to capture the download
      const originalClick = element.click.bind(element);
      element.click = () => {
        if (element.href.startsWith('blob:') || element.href.startsWith('data:') || element.href === 'mock-url') {
          capturedFilename = element.getAttribute('download') || '';
          // For JSON exports, decode the data URL or use mock data
          if (element.href.startsWith('data:application/json')) {
            const jsonPart = element.href.split(',')[1];
            capturedExportData = JSON.parse(decodeURIComponent(jsonPart));
          }
        }
        originalClick();
      };
    }
    return element;
  };

  // Mock Blob to capture JSON content
  const OriginalBlob = global.Blob;
  global.Blob = class MockBlob extends OriginalBlob {
    constructor(parts: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options);
      if (options?.type === 'application/json' && parts.length > 0) {
        capturedExportData = JSON.parse(parts[0] as string);
      }
    }
  } as typeof Blob;
});

test.describe('Business Export Service - Process Catalog', () => {
  test('should generate process catalog with correct structure', () => {
    // Create mock business graph
    const mockNode1: BusinessNode = {
      id: 'process-1',
      name: 'Order Processing',
      type: 'process',
      description: 'Process customer orders',
      layer: 'business',
      metadata: {
        owner: 'Sales Team',
        criticality: 'high',
        lifecycle: 'active',
        domain: 'Sales',
        subprocessCount: 3,
      },
    };

    const mockNode2: BusinessNode = {
      id: 'function-1',
      name: 'Inventory Management',
      type: 'function',
      description: 'Manage inventory',
      layer: 'business',
      metadata: {},
    };

    const mockEdge: BusinessEdge = {
      id: 'edge-1',
      source: 'process-1',
      target: 'function-1',
      type: 'depends-on',
    };

    const mockGraph: BusinessGraph = {
      nodes: new Map([
        ['process-1', mockNode1],
        ['function-1', mockNode2],
      ]),
      edges: new Map([['edge-1', mockEdge]]),
      crossLayerLinks: [],
      indices: {
        byType: new Map([
          ['process', new Set(['process-1'])],
          ['function', new Set(['function-1'])],
        ]),
        byDomain: new Map(),
        byCriticality: new Map(),
        byLifecycle: new Map(),
      },
      adjacency: {
        upstream: new Map(),
        downstream: new Map(),
      },
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        averageConnectivity: 0.5,
        maxHierarchyDepth: 1,
        circularDependencies: [],
        orphanedNodes: [],
      },
    };

    // Call the actual export function
    exportProcessCatalog(mockGraph, 'test-catalog.json');

    // Verify the captured data
    expect(capturedExportData).toBeTruthy();
    const catalog = capturedExportData as any;

    expect(catalog).toHaveProperty('generated');
    expect(catalog).toHaveProperty('processCount', 2);
    expect(catalog).toHaveProperty('processes');
    expect(Array.isArray(catalog.processes)).toBe(true);
    expect(catalog.processes.length).toBe(2);

    // Verify process entry structure
    const processEntry = catalog.processes.find((p: any) => p.id === 'process-1');
    expect(processEntry).toBeTruthy();
    expect(processEntry.name).toBe('Order Processing');
    expect(processEntry.type).toBe('process');
    expect(processEntry.description).toBe('Process customer orders');
    expect(processEntry.owner).toBe('Sales Team');
    expect(processEntry.criticality).toBe('high');
    expect(processEntry.lifecycle).toBe('active');
    expect(processEntry.domain).toBe('Sales');
    expect(processEntry.subprocessCount).toBe(3);

    // Verify relationships
    expect(processEntry.relationships).toBeTruthy();
    expect(processEntry.relationships.upstream).toEqual([]);
    expect(processEntry.relationships.downstream).toEqual([
      { type: 'depends-on', process: 'function-1' }
    ]);

    expect(capturedFilename).toBe('test-catalog.json');
  });
});

test.describe('Business Export Service - Traceability Report', () => {
  test('should generate traceability report with coverage statistics', () => {
    const mockNode1: BusinessNode = {
      id: 'process-1',
      name: 'User Registration',
      type: 'process',
      layer: 'business',
      metadata: {},
    };

    const mockNode2: BusinessNode = {
      id: 'process-2',
      name: 'Data Sync',
      type: 'process',
      layer: 'business',
      metadata: {},
    };

    const mockNode3: BusinessNode = {
      id: 'process-3',
      name: 'Orphaned Process',
      type: 'process',
      layer: 'business',
      metadata: {},
    };

    const crossLayerLinks: CrossLayerLink[] = [
      {
        source: 'process-1',
        target: 'goal-improve-ux',
        type: 'realizes',
        targetLayer: 'motivation',
      },
      {
        source: 'process-1',
        target: 'component-auth',
        type: 'realized-by',
        targetLayer: 'application',
      },
      {
        source: 'process-2',
        target: 'entity-user',
        type: 'uses',
        targetLayer: 'data_model',
      },
    ];

    const mockGraph: BusinessGraph = {
      nodes: new Map([
        ['process-1', mockNode1],
        ['process-2', mockNode2],
        ['process-3', mockNode3],
      ]),
      edges: new Map(),
      crossLayerLinks,
      indices: {
        byType: new Map([['process', new Set(['process-1', 'process-2', 'process-3'])]]),
        byDomain: new Map(),
        byCriticality: new Map(),
        byLifecycle: new Map(),
      },
      adjacency: {
        upstream: new Map(),
        downstream: new Map(),
      },
      metrics: {
        nodeCount: 3,
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: [],
      },
    };

    exportTraceabilityReport(mockGraph, crossLayerLinks, 'test-traceability.json');

    expect(capturedExportData).toBeTruthy();
    const report = capturedExportData as any;

    // Verify report structure
    expect(report).toHaveProperty('generated');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('traceability');
    expect(report).toHaveProperty('orphanedProcesses');

    // Verify summary
    expect(report.summary.totalProcesses).toBe(3);
    expect(report.summary.processesWithMotivationLinks).toBe(1);
    expect(report.summary.processesWithApplicationRealization).toBe(1);
    expect(report.summary.processesWithDataDependencies).toBe(1);
    expect(report.summary.orphanedProcesses).toBe(2); // process-2 and process-3

    // Verify coverage percentages
    expect(report.summary.coverage.motivation).toBe('33.3%');
    expect(report.summary.coverage.application).toBe('33.3%');
    expect(report.summary.coverage.data).toBe('33.3%');

    // Verify traceability entries
    expect(Array.isArray(report.traceability)).toBe(true);
    expect(report.traceability.length).toBe(3);

    const process1Trace = report.traceability.find((t: any) => t.process.id === 'process-1');
    expect(process1Trace).toBeTruthy();
    expect(process1Trace.realizesGoals).toEqual([{ id: 'goal-improve-ux', type: 'realizes' }]);
    expect(process1Trace.realizedByComponents).toEqual([{ id: 'component-auth', type: 'realized-by' }]);
    expect(process1Trace.usesDataEntities).toEqual([]);

    // Verify orphaned processes
    expect(report.orphanedProcesses.length).toBe(2);
    const orphanedIds = report.orphanedProcesses.map((p: any) => p.id);
    expect(orphanedIds).toContain('process-2');
    expect(orphanedIds).toContain('process-3');

    expect(capturedFilename).toBe('test-traceability.json');
  });
});

test.describe('Business Export Service - Graph Data', () => {
  test('should export graph data with nodes, edges, and metadata', () => {
    const mockReactFlowNodes: Node[] = [
      {
        id: 'node-1',
        type: 'businessProcess',
        position: { x: 100, y: 200 },
        data: { label: 'Process A', type: 'process' },
      },
    ];

    const mockReactFlowEdges: Edge[] = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'default',
      },
    ];

    const mockGraph: BusinessGraph = {
      nodes: new Map(),
      edges: new Map(),
      crossLayerLinks: [],
      indices: {
        byType: new Map([
          ['function', new Set(['f1'])],
          ['process', new Set(['p1', 'p2'])],
          ['service', new Set(['s1'])],
          ['capability', new Set(['c1'])],
        ]),
        byDomain: new Map(),
        byCriticality: new Map(),
        byLifecycle: new Map(),
      },
      adjacency: {
        upstream: new Map(),
        downstream: new Map(),
      },
      metrics: {
        nodeCount: 5,
        edgeCount: 3,
        averageConnectivity: 0.6,
        maxHierarchyDepth: 2,
        circularDependencies: [],
        orphanedNodes: [],
      },
    };

    exportGraphDataAsJSON(mockReactFlowNodes, mockReactFlowEdges, mockGraph, 'test-graph.json');

    expect(capturedExportData).toBeTruthy();
    const graphData = capturedExportData as any;

    expect(graphData).toHaveProperty('version', '1.0.0');
    expect(graphData).toHaveProperty('generated');
    expect(graphData).toHaveProperty('metadata');
    expect(graphData).toHaveProperty('nodes');
    expect(graphData).toHaveProperty('edges');

    // Verify metadata
    expect(graphData.metadata.nodeCount).toBe(1);
    expect(graphData.metadata.edgeCount).toBe(1);
    expect(graphData.metadata.layers.functions).toBe(1);
    expect(graphData.metadata.layers.processes).toBe(2);
    expect(graphData.metadata.layers.services).toBe(1);
    expect(graphData.metadata.layers.capabilities).toBe(1);

    expect(graphData.metadata.metrics.totalNodes).toBe(5);
    expect(graphData.metadata.metrics.totalEdges).toBe(3);
    expect(graphData.metadata.metrics.averageConnectivity).toBe(0.6);
    expect(graphData.metadata.metrics.maxHierarchyDepth).toBe(2);

    // Verify nodes
    expect(Array.isArray(graphData.nodes)).toBe(true);
    expect(graphData.nodes.length).toBe(1);
    expect(graphData.nodes[0]).toEqual({
      id: 'node-1',
      type: 'businessProcess',
      position: { x: 100, y: 200 },
      data: { label: 'Process A', type: 'process' },
    });

    // Verify edges
    expect(Array.isArray(graphData.edges)).toBe(true);
    expect(graphData.edges.length).toBe(1);

    expect(capturedFilename).toBe('test-graph.json');
  });
});

test.describe('Business Export Service - Empty Graph Handling', () => {
  test('should handle empty business graph gracefully', () => {
    const emptyGraph: BusinessGraph = {
      nodes: new Map(),
      edges: new Map(),
      crossLayerLinks: [],
      indices: {
        byType: new Map(),
        byDomain: new Map(),
        byCriticality: new Map(),
        byLifecycle: new Map(),
      },
      adjacency: {
        upstream: new Map(),
        downstream: new Map(),
      },
      metrics: {
        nodeCount: 0,
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: [],
      },
    };

    exportProcessCatalog(emptyGraph, 'empty-catalog.json');

    expect(capturedExportData).toBeTruthy();
    const catalog = capturedExportData as any;

    expect(catalog.processCount).toBe(0);
    expect(catalog.processes).toEqual([]);
  });

  test('should handle empty selectedNodes set with validation', () => {
    const emptyGraph: BusinessGraph = {
      nodes: new Map(),
      edges: new Map(),
      crossLayerLinks: [],
      indices: {
        byType: new Map(),
        byDomain: new Map(),
        byCriticality: new Map(),
        byLifecycle: new Map(),
      },
      adjacency: {
        upstream: new Map(),
        downstream: new Map(),
      },
      metrics: {
        nodeCount: 0,
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: [],
      },
    };

    // Should throw error when no nodes selected
    expect(() => {
      exportImpactAnalysisReport(new Set(), emptyGraph, 'impact.json');
    }).toThrow('No processes selected for impact analysis');
  });
});
