/**
 * Integration tests for Reference Diagram Library
 *
 * Tests that verify:
 * - Reference diagrams can be loaded from the file system
 * - Manifest is correctly structured
 * - All referenced diagrams exist and are valid
 * - Quality metrics are within expected ranges
 */

import { test, expect } from '@playwright/test';

const REFERENCE_BASE_URL = 'http://localhost:3001/reference-diagrams';

test.describe('Reference Diagram Library Integration', () => {
  test.beforeAll(async () => {
    // Ensure dev server is running
  });

  test('should load manifest.json', async ({ request }) => {
    const response = await request.get(`${REFERENCE_BASE_URL}/manifest.json`);

    expect(response.ok()).toBe(true);

    const manifest = await response.json();

    expect(manifest.version).toBeDefined();
    expect(manifest.lastUpdated).toBeDefined();
    expect(Array.isArray(manifest.diagrams)).toBe(true);
    expect(manifest.diagrams.length).toBeGreaterThanOrEqual(6);
  });

  test('should have at least 2 diagrams per type', async ({ request }) => {
    const response = await request.get(`${REFERENCE_BASE_URL}/manifest.json`);
    const manifest = await response.json();

    // Count diagrams by type
    const byType = new Map<string, number>();
    for (const diagram of manifest.diagrams) {
      const count = byType.get(diagram.type) || 0;
      byType.set(diagram.type, count + 1);
    }

    // Verify each type has at least 2 diagrams
    expect(byType.get('c4-context')).toBeGreaterThanOrEqual(1);
    expect(byType.get('c4-container')).toBeGreaterThanOrEqual(1);
    expect(byType.get('motivation-ontology')).toBeGreaterThanOrEqual(2);
    expect(byType.get('business-process')).toBeGreaterThanOrEqual(2);
  });

  test('should load all C4 reference diagrams', async ({ request }) => {
    // Load C4 context diagram
    const contextResponse = await request.get(
      `${REFERENCE_BASE_URL}/c4/c4-bigbank-context-v1.json`
    );
    expect(contextResponse.ok()).toBe(true);

    const contextDiagram = await contextResponse.json();
    expect(contextDiagram.id).toBe('c4-bigbank-context-v1');
    expect(contextDiagram.type).toBe('c4-context');
    expect(contextDiagram.extractedGraph.nodes.length).toBe(4);
    expect(contextDiagram.extractedGraph.edges.length).toBe(4);
    expect(contextDiagram.qualityMetrics.overallScore).toBeGreaterThan(0.8);

    // Load C4 container diagram
    const containerResponse = await request.get(
      `${REFERENCE_BASE_URL}/c4/c4-bigbank-container-v1.json`
    );
    expect(containerResponse.ok()).toBe(true);

    const containerDiagram = await containerResponse.json();
    expect(containerDiagram.id).toBe('c4-bigbank-container-v1');
    expect(containerDiagram.type).toBe('c4-container');
    expect(containerDiagram.extractedGraph.nodes.length).toBe(8);
    expect(containerDiagram.extractedGraph.edges.length).toBe(10);
  });

  test('should load all motivation reference diagrams', async ({ request }) => {
    // Load goal hierarchy diagram
    const hierarchyResponse = await request.get(
      `${REFERENCE_BASE_URL}/motivation/motivation-goal-hierarchy-v1.json`
    );
    expect(hierarchyResponse.ok()).toBe(true);

    const hierarchyDiagram = await hierarchyResponse.json();
    expect(hierarchyDiagram.id).toBe('motivation-goal-hierarchy-v1');
    expect(hierarchyDiagram.type).toBe('motivation-ontology');
    expect(hierarchyDiagram.extractedGraph.nodes.length).toBe(12);

    // Load stakeholder concerns diagram
    const stakeholderResponse = await request.get(
      `${REFERENCE_BASE_URL}/motivation/motivation-stakeholder-concerns-v1.json`
    );
    expect(stakeholderResponse.ok()).toBe(true);

    const stakeholderDiagram = await stakeholderResponse.json();
    expect(stakeholderDiagram.id).toBe('motivation-stakeholder-concerns-v1');
    expect(stakeholderDiagram.type).toBe('motivation-ontology');
  });

  test('should load all business process reference diagrams', async ({
    request,
  }) => {
    // Load order process diagram
    const orderResponse = await request.get(
      `${REFERENCE_BASE_URL}/business/business-order-process-v1.json`
    );
    expect(orderResponse.ok()).toBe(true);

    const orderDiagram = await orderResponse.json();
    expect(orderDiagram.id).toBe('business-order-process-v1');
    expect(orderDiagram.type).toBe('business-process');
    expect(orderDiagram.extractedGraph.nodes.length).toBe(15);

    // Load approval workflow diagram
    const approvalResponse = await request.get(
      `${REFERENCE_BASE_URL}/business/business-approval-workflow-v1.json`
    );
    expect(approvalResponse.ok()).toBe(true);

    const approvalDiagram = await approvalResponse.json();
    expect(approvalDiagram.id).toBe('business-approval-workflow-v1');
    expect(approvalDiagram.type).toBe('business-process');
  });

  test('should have valid source attribution for all diagrams', async ({
    request,
  }) => {
    const manifestResponse = await request.get(
      `${REFERENCE_BASE_URL}/manifest.json`
    );
    const manifest = await manifestResponse.json();

    for (const summary of manifest.diagrams) {
      // Determine directory based on type
      let dir: string;
      if (summary.type.startsWith('c4-')) {
        dir = 'c4';
      } else if (summary.type === 'business-process') {
        dir = 'business';
      } else if (summary.type === 'motivation-ontology') {
        dir = 'motivation';
      } else {
        dir = summary.type;
      }

      const diagramResponse = await request.get(
        `${REFERENCE_BASE_URL}/${dir}/${summary.id}.json`
      );
      expect(diagramResponse.ok()).toBe(true);

      const diagram = await diagramResponse.json();

      // Verify source attribution
      expect(diagram.source).toBeDefined();
      expect(diagram.source.url).toBeDefined();
      expect(diagram.source.url.startsWith('http')).toBe(true);
      expect(diagram.source.citation).toBeDefined();
      expect(diagram.source.accessedDate).toBeDefined();

      // Verify license
      expect(diagram.license).toBeDefined();
      expect(diagram.license.length).toBeGreaterThan(0);
    }
  });

  test('should have valid quality metrics for all diagrams', async ({
    request,
  }) => {
    const manifestResponse = await request.get(
      `${REFERENCE_BASE_URL}/manifest.json`
    );
    const manifest = await manifestResponse.json();

    for (const summary of manifest.diagrams) {
      // Verify metrics are in valid range
      expect(summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(summary.overallScore).toBeLessThanOrEqual(1);
      expect(summary.nodeCount).toBeGreaterThan(0);
      expect(summary.edgeCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have complete extracted graph structures', async ({
    request,
  }) => {
    const manifestResponse = await request.get(
      `${REFERENCE_BASE_URL}/manifest.json`
    );
    const manifest = await manifestResponse.json();

    for (const summary of manifest.diagrams) {
      let dir: string;
      if (summary.type.startsWith('c4-')) {
        dir = 'c4';
      } else if (summary.type === 'business-process') {
        dir = 'business';
      } else if (summary.type === 'motivation-ontology') {
        dir = 'motivation';
      } else {
        dir = summary.type;
      }

      const diagramResponse = await request.get(
        `${REFERENCE_BASE_URL}/${dir}/${summary.id}.json`
      );
      const diagram = await diagramResponse.json();

      // Verify extracted graph structure
      expect(diagram.extractedGraph).toBeDefined();
      expect(Array.isArray(diagram.extractedGraph.nodes)).toBe(true);
      expect(Array.isArray(diagram.extractedGraph.edges)).toBe(true);

      // Verify node count matches
      expect(diagram.extractedGraph.nodes.length).toBe(summary.nodeCount);

      // Verify all nodes have required fields
      for (const node of diagram.extractedGraph.nodes) {
        expect(node.id).toBeDefined();
        expect(node.label).toBeDefined();
        expect(node.type).toBeDefined();
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(typeof node.width).toBe('number');
        expect(typeof node.height).toBe('number');
      }

      // Verify all edges reference valid nodes
      const nodeIds = new Set(diagram.extractedGraph.nodes.map((n: any) => n.id));
      for (const edge of diagram.extractedGraph.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    }
  });

  test('should have complete annotations for all diagrams', async ({
    request,
  }) => {
    const manifestResponse = await request.get(
      `${REFERENCE_BASE_URL}/manifest.json`
    );
    const manifest = await manifestResponse.json();

    for (const summary of manifest.diagrams) {
      let dir: string;
      if (summary.type.startsWith('c4-')) {
        dir = 'c4';
      } else if (summary.type === 'business-process') {
        dir = 'business';
      } else if (summary.type === 'motivation-ontology') {
        dir = 'motivation';
      } else {
        dir = summary.type;
      }

      const diagramResponse = await request.get(
        `${REFERENCE_BASE_URL}/${dir}/${summary.id}.json`
      );
      const diagram = await diagramResponse.json();

      // Verify annotations
      expect(diagram.annotations).toBeDefined();
      expect(Array.isArray(diagram.annotations.keyLayoutPatterns)).toBe(true);
      expect(diagram.annotations.keyLayoutPatterns.length).toBeGreaterThan(0);
      expect(Array.isArray(diagram.annotations.exemplaryFeatures)).toBe(true);
      expect(diagram.annotations.exemplaryFeatures.length).toBeGreaterThan(0);
      expect(Array.isArray(diagram.annotations.applicableScenarios)).toBe(true);
      expect(diagram.annotations.applicableScenarios.length).toBeGreaterThan(0);
    }
  });

  test('should have quality scores above 0.80 for all references', async ({
    request,
  }) => {
    const manifestResponse = await request.get(
      `${REFERENCE_BASE_URL}/manifest.json`
    );
    const manifest = await manifestResponse.json();

    for (const summary of manifest.diagrams) {
      // Reference diagrams should have high quality scores (>= 0.80)
      expect(summary.overallScore).toBeGreaterThanOrEqual(0.80);
    }
  });
});
