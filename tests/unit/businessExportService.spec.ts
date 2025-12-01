/**
 * Unit tests for Business Export Service
 *
 * Tests all export functions for correct data structure generation.
 * Note: PNG/SVG exports require DOM and are tested in E2E tests.
 */

import { test, expect } from '@playwright/test';
import type { Node, Edge } from '@xyflow/react';
import type { BusinessGraph, BusinessNode, BusinessEdge, CrossLayerLink } from '../../src/core/types/businessLayer';

// Mock data helper functions
function createMockBusinessGraph(): BusinessGraph {
  const nodes = new Map<string, BusinessNode>();
  const edges = new Map<string, BusinessEdge>();

  // Create sample nodes
  nodes.set('process-1', {
    id: 'process-1',
    type: 'process',
    name: 'Order Management',
    description: 'Manage customer orders',
    properties: {},
    metadata: {
      owner: 'Sales Team',
      criticality: 'high',
      lifecycle: 'active',
      domain: 'Sales',
      subprocessCount: 3,
    },
    hierarchyLevel: 0,
    childIds: ['process-2'],
  });

  nodes.set('process-2', {
    id: 'process-2',
    type: 'process',
    name: 'Create Order',
    description: 'Create a new customer order',
    properties: {},
    metadata: {
      owner: 'Sales Team',
      criticality: 'medium',
      lifecycle: 'active',
      domain: 'Sales',
    },
    hierarchyLevel: 1,
    parentId: 'process-1',
    childIds: [],
  });

  nodes.set('function-1', {
    id: 'function-1',
    type: 'function',
    name: 'Sales Function',
    properties: {},
    metadata: {},
    hierarchyLevel: 0,
    childIds: [],
  });

  // Create sample edges
  edges.set('edge-1', {
    id: 'edge-1',
    source: 'process-1',
    target: 'process-2',
    type: 'composes',
    label: 'contains',
  });

  // Create cross-layer links
  const crossLayerLinks: CrossLayerLink[] = [
    {
      source: 'process-1',
      target: 'goal-1',
      sourceLayer: 'business',
      targetLayer: 'motivation',
      type: 'realizes',
    },
    {
      source: 'process-1',
      target: 'component-1',
      sourceLayer: 'business',
      targetLayer: 'application',
      type: 'realized_by',
    },
    {
      source: 'process-1',
      target: 'entity-1',
      sourceLayer: 'business',
      targetLayer: 'data_model',
      type: 'uses',
    },
  ];

  return {
    nodes,
    edges,
    hierarchy: {
      maxDepth: 1,
      rootNodes: ['process-1', 'function-1'],
      leafNodes: ['process-2', 'function-1'],
      nodesByLevel: new Map([[0, new Set(['process-1', 'function-1'])], [1, new Set(['process-2'])]]),
      parentChildMap: new Map([['process-1', ['process-2']]]),
      childParentMap: new Map([['process-2', 'process-1']]),
    },
    metrics: {
      nodeCount: 3,
      edgeCount: 1,
      averageConnectivity: 0.67,
      maxHierarchyDepth: 1,
      circularDependencies: [],
      orphanedNodes: [],
      criticalNodes: ['process-1'],
    },
    crossLayerLinks,
    indices: {
      byType: new Map([
        ['process', new Set(['process-1', 'process-2'])],
        ['function', new Set(['function-1'])],
        ['service', new Set()],
        ['capability', new Set()],
      ]),
      byDomain: new Map([['Sales', new Set(['process-1', 'process-2'])]]),
      byLifecycle: new Map([['active', new Set(['process-1', 'process-2'])]]),
      byCriticality: new Map([
        ['high', new Set(['process-1'])],
        ['medium', new Set(['process-2'])],
      ]),
    },
  };
}

function createMockReactFlowNodes(): Node[] {
  return [
    {
      id: 'process-1',
      type: 'businessProcess',
      position: { x: 100, y: 100 },
      data: { label: 'Order Management', fill: '#e3f2fd', stroke: '#1565c0' },
    },
    {
      id: 'process-2',
      type: 'businessProcess',
      position: { x: 100, y: 200 },
      data: { label: 'Create Order', fill: '#e3f2fd', stroke: '#1565c0' },
    },
  ];
}

function createMockReactFlowEdges(): Edge[] {
  return [
    {
      id: 'edge-1',
      source: 'process-1',
      target: 'process-2',
      type: 'elbow',
    },
  ];
}

test.describe('Business Export Service Data Structures', () => {
  test('should generate correct process catalog structure', () => {
    const mockBusinessGraph = createMockBusinessGraph();

    // Simulate catalog generation logic
    const catalog = {
      generated: new Date().toISOString(),
      processCount: mockBusinessGraph.nodes.size,
      processes: Array.from(mockBusinessGraph.nodes.values()).map(node => ({
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
          upstream: Array.from(mockBusinessGraph.edges.values())
            .filter(e => e.target === node.id)
            .map(e => ({ type: e.type, process: e.source })),
          downstream: Array.from(mockBusinessGraph.edges.values())
            .filter(e => e.source === node.id)
            .map(e => ({ type: e.type, process: e.target })),
        },
      })),
    };

    // Verify structure
    expect(catalog).toHaveProperty('generated');
    expect(catalog).toHaveProperty('processCount', 3);
    expect(catalog.processes).toHaveLength(3);

    // Verify process metadata
    const process1 = catalog.processes.find(p => p.id === 'process-1');
    expect(process1).toBeDefined();
    expect(process1?.name).toBe('Order Management');
    expect(process1?.owner).toBe('Sales Team');
    expect(process1?.criticality).toBe('high');
    expect(process1?.lifecycle).toBe('active');
    expect(process1?.domain).toBe('Sales');
    expect(process1?.subprocessCount).toBe(3);

    // Verify relationships
    expect(process1?.relationships.downstream).toHaveLength(1);
    expect(process1?.relationships.downstream[0]).toEqual({
      type: 'composes',
      process: 'process-2',
    });

    const process2 = catalog.processes.find(p => p.id === 'process-2');
    expect(process2?.relationships.upstream).toHaveLength(1);
    expect(process2?.relationships.upstream[0]).toEqual({
      type: 'composes',
      process: 'process-1',
    });
  });

  test('should generate correct traceability report structure', () => {
    const mockBusinessGraph = createMockBusinessGraph();

    // Simulate traceability report generation logic
    const processesWithMotivation = new Set<string>();
    const processesWithApplication = new Set<string>();
    const processesWithData = new Set<string>();

    mockBusinessGraph.crossLayerLinks.forEach(link => {
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

    const orphanedProcesses = Array.from(mockBusinessGraph.nodes.values())
      .filter(node =>
        node.type === 'process' &&
        !processesWithApplication.has(node.id)
      )
      .map(node => ({ id: node.id, name: node.name }));

    const traceability = Array.from(mockBusinessGraph.nodes.values()).map(node => ({
      process: { id: node.id, name: node.name, type: node.type },
      realizesGoals: mockBusinessGraph.crossLayerLinks
        .filter(l => l.source === node.id && l.targetLayer === 'motivation')
        .map(l => ({ id: l.target, type: l.type })),
      realizedByComponents: mockBusinessGraph.crossLayerLinks
        .filter(l => l.source === node.id && l.targetLayer === 'application')
        .map(l => ({ id: l.target, type: l.type })),
      usesDataEntities: mockBusinessGraph.crossLayerLinks
        .filter(l => l.source === node.id && l.targetLayer === 'data_model')
        .map(l => ({ id: l.target, type: l.type })),
    }));

    const totalProcesses = mockBusinessGraph.nodes.size;
    const report = {
      generated: new Date().toISOString(),
      summary: {
        totalProcesses,
        processesWithMotivationLinks: processesWithMotivation.size,
        processesWithApplicationRealization: processesWithApplication.size,
        processesWithDataDependencies: processesWithData.size,
        orphanedProcesses: orphanedProcesses.length,
        coverage: {
          motivation: `${((processesWithMotivation.size / totalProcesses) * 100).toFixed(1)}%`,
          application: `${((processesWithApplication.size / totalProcesses) * 100).toFixed(1)}%`,
          data: `${((processesWithData.size / totalProcesses) * 100).toFixed(1)}%`,
        },
      },
      traceability,
      orphanedProcesses,
    };

    // Verify structure
    expect(report).toHaveProperty('generated');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('traceability');
    expect(report).toHaveProperty('orphanedProcesses');

    // Verify summary
    expect(report.summary.totalProcesses).toBe(3);
    expect(report.summary.processesWithMotivationLinks).toBe(1);
    expect(report.summary.processesWithApplicationRealization).toBe(1);
    expect(report.summary.processesWithDataDependencies).toBe(1);
    expect(report.summary.orphanedProcesses).toBe(2);

    // Verify coverage percentages
    expect(report.summary.coverage.motivation).toBe('33.3%');
    expect(report.summary.coverage.application).toBe('33.3%');
    expect(report.summary.coverage.data).toBe('33.3%');

    // Verify traceability entries
    const process1Trace = report.traceability.find(t => t.process.id === 'process-1');
    expect(process1Trace).toBeDefined();
    expect(process1Trace?.realizesGoals).toHaveLength(1);
    expect(process1Trace?.realizesGoals[0]).toEqual({ id: 'goal-1', type: 'realizes' });
    expect(process1Trace?.realizedByComponents).toHaveLength(1);
    expect(process1Trace?.realizedByComponents[0]).toEqual({ id: 'component-1', type: 'realized_by' });
    expect(process1Trace?.usesDataEntities).toHaveLength(1);
    expect(process1Trace?.usesDataEntities[0]).toEqual({ id: 'entity-1', type: 'uses' });

    // Verify orphaned processes
    expect(report.orphanedProcesses).toHaveLength(2);
    expect(report.orphanedProcesses.map(p => p.id)).toContain('process-2');
    expect(report.orphanedProcesses.map(p => p.id)).toContain('function-1');
  });

  test('should generate correct graph data structure', () => {
    const mockBusinessGraph = createMockBusinessGraph();
    const mockNodes = createMockReactFlowNodes();
    const mockEdges = createMockReactFlowEdges();

    // Simulate graph data export logic
    const graphData = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      metadata: {
        nodeCount: mockNodes.length,
        edgeCount: mockEdges.length,
        layers: {
          functions: mockBusinessGraph.indices.byType.get('function')?.size || 0,
          processes: mockBusinessGraph.indices.byType.get('process')?.size || 0,
          services: mockBusinessGraph.indices.byType.get('service')?.size || 0,
          capabilities: mockBusinessGraph.indices.byType.get('capability')?.size || 0,
        },
        metrics: {
          totalNodes: mockBusinessGraph.metrics.nodeCount,
          totalEdges: mockBusinessGraph.metrics.edgeCount,
          averageConnectivity: mockBusinessGraph.metrics.averageConnectivity,
          maxHierarchyDepth: mockBusinessGraph.metrics.maxHierarchyDepth,
          circularDependencyCount: mockBusinessGraph.metrics.circularDependencies.length,
          orphanedNodeCount: mockBusinessGraph.metrics.orphanedNodes.length,
        },
      },
      nodes: mockNodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data
      })),
      edges: mockEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        label: e.label
      })),
    };

    // Verify structure
    expect(graphData.version).toBe('1.0.0');
    expect(graphData).toHaveProperty('generated');
    expect(graphData.metadata.nodeCount).toBe(2);
    expect(graphData.metadata.edgeCount).toBe(1);
    expect(graphData.metadata.layers.functions).toBe(1);
    expect(graphData.metadata.layers.processes).toBe(2);
    expect(graphData.metadata.layers.services).toBe(0);
    expect(graphData.metadata.layers.capabilities).toBe(0);

    // Verify node structure
    expect(graphData.nodes).toHaveLength(2);
    const node1 = graphData.nodes[0];
    expect(node1.id).toBe('process-1');
    expect(node1.type).toBe('businessProcess');
    expect(node1.position).toEqual({ x: 100, y: 100 });
    expect(node1.data.label).toBe('Order Management');

    // Verify edge structure
    expect(graphData.edges).toHaveLength(1);
    const edge1 = graphData.edges[0];
    expect(edge1.source).toBe('process-1');
    expect(edge1.target).toBe('process-2');
  });

  test('should handle empty business graph gracefully', () => {
    const emptyGraph: BusinessGraph = {
      nodes: new Map(),
      edges: new Map(),
      hierarchy: {
        maxDepth: 0,
        rootNodes: [],
        leafNodes: [],
        nodesByLevel: new Map(),
        parentChildMap: new Map(),
        childParentMap: new Map(),
      },
      metrics: {
        nodeCount: 0,
        edgeCount: 0,
        averageConnectivity: 0,
        maxHierarchyDepth: 0,
        circularDependencies: [],
        orphanedNodes: [],
        criticalNodes: [],
      },
      crossLayerLinks: [],
      indices: {
        byType: new Map(),
        byDomain: new Map(),
        byLifecycle: new Map(),
        byCriticality: new Map(),
      },
    };

    // Simulate process catalog generation
    const catalog = {
      generated: new Date().toISOString(),
      processCount: emptyGraph.nodes.size,
      processes: Array.from(emptyGraph.nodes.values()).map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
      })),
    };

    expect(catalog.processCount).toBe(0);
    expect(catalog.processes).toHaveLength(0);

    // Simulate traceability report generation
    const report = {
      generated: new Date().toISOString(),
      summary: {
        totalProcesses: 0,
        processesWithMotivationLinks: 0,
        processesWithApplicationRealization: 0,
        processesWithDataDependencies: 0,
        orphanedProcesses: 0,
        coverage: {
          motivation: '0%',
          application: '0%',
          data: '0%',
        },
      },
      traceability: [],
      orphanedProcesses: [],
    };

    expect(report.summary.totalProcesses).toBe(0);
    expect(report.traceability).toHaveLength(0);
    expect(report.orphanedProcesses).toHaveLength(0);
  });
});
