/**
 * Unit tests for Reference Diagram Service
 *
 * Tests the referenceDiagramService for:
 * - Reference diagram loading and caching
 * - Validation of reference diagram structure
 * - Graph extraction and metrics calculation
 * - Manifest loading and summary retrieval
 */

import { test, expect } from '@playwright/test';
import {
  ReferenceDiagram,
  ReferenceDiagramType,
  ExtractedGraph,
  ExtractedNode,
  ExtractedEdge,
} from '../../src/core/types/referenceDiagram';
import {
  validateReferenceDiagram,
  extractedGraphToNodes,
  extractedGraphToEdges,
  calculateExtractedGraphMetrics,
} from '../../src/core/services/reference/referenceDiagramService';

/**
 * Helper to create a valid test reference diagram
 */
function createValidReferenceDiagram(
  overrides: Partial<ReferenceDiagram> = {}
): ReferenceDiagram {
  return {
    id: 'test-diagram-v1',
    type: 'c4-context',
    name: 'Test Diagram',
    description: 'A test diagram',
    source: {
      url: 'https://example.com/diagram',
      citation: 'Example Citation',
      accessedDate: '2024-12-04',
      author: 'Test Author',
    },
    license: 'MIT',
    imagePath: 'reference-diagrams/test/diagram.png',
    extractedGraph: {
      nodes: [
        { id: 'node1', label: 'Node 1', type: 'Person', x: 100, y: 50, width: 120, height: 80 },
        { id: 'node2', label: 'Node 2', type: 'System', x: 100, y: 200, width: 150, height: 100 },
      ],
      edges: [
        { source: 'node1', target: 'node2', label: 'uses', type: 'uses' },
      ],
      boundingBox: { width: 400, height: 350 },
    },
    qualityMetrics: {
      overallScore: 0.85,
      metrics: {
        crossingNumber: 1.0,
        crossingAngle: 1.0,
        angularResolutionMin: 0.8,
        angularResolutionDev: 0.8,
      },
      extendedMetrics: {
        crossingNumber: 1.0,
        crossingAngle: 1.0,
        angularResolutionMin: 0.8,
        angularResolutionDev: 0.8,
        edgeLength: { min: 100, max: 150, mean: 125, stdDev: 15 },
        nodeNodeOcclusion: 0,
        aspectRatio: 1.14,
        density: 0.5,
      },
      timestamp: '2024-12-04T00:00:00.000Z',
      layoutType: 'force-directed',
      diagramType: 'c4',
      nodeCount: 2,
      edgeCount: 1,
      computationTimeMs: 5,
    },
    annotations: {
      keyLayoutPatterns: ['hierarchical'],
      exemplaryFeatures: ['no crossings'],
      applicableScenarios: ['small diagrams'],
    },
    version: 1,
    lastUpdated: '2024-12-04T00:00:00.000Z',
    ...overrides,
  };
}

test.describe('ReferenceDiagramService', () => {
  test.describe('validateReferenceDiagram()', () => {
    test('should validate a correct reference diagram', () => {
      const diagram = createValidReferenceDiagram();

      const result = validateReferenceDiagram(diagram);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const diagram = {
        // Missing all required fields
      } as ReferenceDiagram;

      const result = validateReferenceDiagram(diagram);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
      expect(result.errors).toContain('Missing required field: type');
      expect(result.errors).toContain('Missing required field: name');
      expect(result.errors).toContain('Missing required field: source');
      expect(result.errors).toContain('Missing required field: license');
      expect(result.errors).toContain('Missing required field: imagePath');
      expect(result.errors).toContain('Missing required field: extractedGraph');
      expect(result.errors).toContain('Missing required field: qualityMetrics');
      expect(result.errors).toContain('Missing required field: annotations');
    });

    test('should detect missing source fields', () => {
      const diagram = createValidReferenceDiagram({
        source: {
          url: '',
          citation: '',
          accessedDate: '',
        } as ReferenceDiagram['source'],
      });
      // Override to have empty values which should still be truthy but empty
      diagram.source.url = '';
      diagram.source.citation = '';
      diagram.source.accessedDate = '';

      const result = validateReferenceDiagram(diagram);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Source missing required field: url');
      expect(result.errors).toContain('Source missing required field: citation');
      expect(result.errors).toContain('Source missing required field: accessedDate');
    });

    test('should detect invalid edge references', () => {
      const diagram = createValidReferenceDiagram({
        extractedGraph: {
          nodes: [
            { id: 'node1', label: 'Node 1', type: 'Person', x: 100, y: 50, width: 120, height: 80 },
          ],
          edges: [
            { source: 'node1', target: 'nonexistent', label: 'uses' },
            { source: 'alsononexistent', target: 'node1', label: 'uses' },
          ],
        },
      });

      const result = validateReferenceDiagram(diagram);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Edge references non-existent target node: nonexistent');
      expect(result.errors).toContain('Edge references non-existent source node: alsononexistent');
    });

    test('should warn about empty nodes array', () => {
      const diagram = createValidReferenceDiagram({
        extractedGraph: {
          nodes: [],
          edges: [],
        },
      });

      const result = validateReferenceDiagram(diagram);

      expect(result.isValid).toBe(true); // Warnings don't invalidate
      expect(result.warnings).toContain('extractedGraph has no nodes');
    });

    test('should validate quality metrics score range', () => {
      const diagram = createValidReferenceDiagram();
      diagram.qualityMetrics.overallScore = 1.5; // Invalid: > 1

      const result = validateReferenceDiagram(diagram);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'qualityMetrics.overallScore must be a number between 0 and 1'
      );
    });

    test('should validate negative quality metrics score', () => {
      const diagram = createValidReferenceDiagram();
      diagram.qualityMetrics.overallScore = -0.5; // Invalid: < 0

      const result = validateReferenceDiagram(diagram);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'qualityMetrics.overallScore must be a number between 0 and 1'
      );
    });
  });

  test.describe('extractedGraphToNodes()', () => {
    test('should convert extracted nodes to React Flow nodes', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'n1', label: 'Node 1', type: 'Person', x: 150, y: 100, width: 120, height: 80 },
          { id: 'n2', label: 'Node 2', type: 'System', x: 300, y: 250, width: 150, height: 100 },
        ],
        edges: [],
      };

      const nodes = extractedGraphToNodes(extractedGraph);

      expect(nodes).toHaveLength(2);

      // First node: center (150, 100) with size 120x80 -> top-left at (90, 60)
      expect(nodes[0].id).toBe('n1');
      expect(nodes[0].position.x).toBe(150 - 120 / 2); // 90
      expect(nodes[0].position.y).toBe(100 - 80 / 2); // 60
      expect(nodes[0].width).toBe(120);
      expect(nodes[0].height).toBe(80);
      expect(nodes[0].data.label).toBe('Node 1');
      expect(nodes[0].data.type).toBe('Person');

      // Second node: center (300, 250) with size 150x100 -> top-left at (225, 200)
      expect(nodes[1].id).toBe('n2');
      expect(nodes[1].position.x).toBe(300 - 150 / 2); // 225
      expect(nodes[1].position.y).toBe(250 - 100 / 2); // 200
      expect(nodes[1].width).toBe(150);
      expect(nodes[1].height).toBe(100);
    });

    test('should handle empty nodes array', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [],
        edges: [],
      };

      const nodes = extractedGraphToNodes(extractedGraph);

      expect(nodes).toHaveLength(0);
    });
  });

  test.describe('extractedGraphToEdges()', () => {
    test('should convert extracted edges to React Flow edges', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'n1', label: 'Node 1', type: 'Person', x: 100, y: 50, width: 120, height: 80 },
          { id: 'n2', label: 'Node 2', type: 'System', x: 100, y: 200, width: 150, height: 100 },
        ],
        edges: [
          { source: 'n1', target: 'n2', label: 'uses', type: 'uses' },
          { source: 'n2', target: 'n1', label: 'notifies' },
        ],
      };

      const edges = extractedGraphToEdges(extractedGraph);

      expect(edges).toHaveLength(2);

      expect(edges[0].id).toBe('edge-0');
      expect(edges[0].source).toBe('n1');
      expect(edges[0].target).toBe('n2');
      expect(edges[0].label).toBe('uses');
      expect(edges[0].type).toBe('uses');

      expect(edges[1].id).toBe('edge-1');
      expect(edges[1].source).toBe('n2');
      expect(edges[1].target).toBe('n1');
      expect(edges[1].label).toBe('notifies');
      expect(edges[1].type).toBe('default'); // No type specified
    });

    test('should handle empty edges array', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [],
        edges: [],
      };

      const edges = extractedGraphToEdges(extractedGraph);

      expect(edges).toHaveLength(0);
    });
  });

  test.describe('calculateExtractedGraphMetrics()', () => {
    test('should calculate metrics for a simple graph', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'n1', label: 'Node 1', type: 'Person', x: 200, y: 50, width: 120, height: 80 },
          { id: 'n2', label: 'Node 2', type: 'System', x: 200, y: 250, width: 150, height: 100 },
          { id: 'n3', label: 'Node 3', type: 'System', x: 400, y: 250, width: 150, height: 100 },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
          { source: 'n1', target: 'n3' },
        ],
      };

      const metrics = calculateExtractedGraphMetrics(extractedGraph, 'c4-context');

      expect(metrics).toBeDefined();
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(1);
      expect(metrics.nodeCount).toBe(3);
      expect(metrics.edgeCount).toBe(2);
      expect(metrics.diagramType).toBe('c4');
      expect(metrics.layoutType).toBe('force-directed'); // Default for c4-context
    });

    test('should use correct layout type for different diagram types', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'n1', label: 'Goal', type: 'Goal', x: 200, y: 50, width: 120, height: 80 },
          { id: 'n2', label: 'Requirement', type: 'Requirement', x: 200, y: 200, width: 150, height: 100 },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
        ],
      };

      const motivationMetrics = calculateExtractedGraphMetrics(
        extractedGraph,
        'motivation-ontology'
      );
      expect(motivationMetrics.layoutType).toBe('hierarchical');
      expect(motivationMetrics.diagramType).toBe('motivation');

      const businessMetrics = calculateExtractedGraphMetrics(
        extractedGraph,
        'business-process'
      );
      expect(businessMetrics.layoutType).toBe('hierarchical');
      expect(businessMetrics.diagramType).toBe('business');

      const c4ContainerMetrics = calculateExtractedGraphMetrics(
        extractedGraph,
        'c4-container'
      );
      expect(c4ContainerMetrics.layoutType).toBe('hierarchical');
      expect(c4ContainerMetrics.diagramType).toBe('c4');
    });

    test('should allow custom layout type override', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'n1', label: 'Node', type: 'Node', x: 100, y: 100, width: 100, height: 60 },
        ],
        edges: [],
      };

      const metrics = calculateExtractedGraphMetrics(
        extractedGraph,
        'c4-context',
        'manual'
      );

      expect(metrics.layoutType).toBe('manual');
    });

    test('should handle graphs with no edges', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'n1', label: 'Node 1', type: 'Person', x: 100, y: 50, width: 120, height: 80 },
          { id: 'n2', label: 'Node 2', type: 'System', x: 300, y: 50, width: 150, height: 100 },
        ],
        edges: [],
      };

      const metrics = calculateExtractedGraphMetrics(extractedGraph, 'c4-context');

      expect(metrics.nodeCount).toBe(2);
      expect(metrics.edgeCount).toBe(0);
      // With no edges, crossing metrics should be perfect
      expect(metrics.metrics.crossingNumber).toBe(1);
      expect(metrics.metrics.crossingAngle).toBe(1);
    });
  });

  test.describe('ReferenceDiagramType mapping', () => {
    test('should map c4 types to c4 diagram type', () => {
      const graph: ExtractedGraph = {
        nodes: [{ id: 'n1', label: 'N', type: 'T', x: 0, y: 0, width: 100, height: 100 }],
        edges: [],
      };

      const contextMetrics = calculateExtractedGraphMetrics(graph, 'c4-context');
      const containerMetrics = calculateExtractedGraphMetrics(graph, 'c4-container');
      const componentMetrics = calculateExtractedGraphMetrics(graph, 'c4-component');

      expect(contextMetrics.diagramType).toBe('c4');
      expect(containerMetrics.diagramType).toBe('c4');
      expect(componentMetrics.diagramType).toBe('c4');
    });

    test('should map motivation-ontology to motivation diagram type', () => {
      const graph: ExtractedGraph = {
        nodes: [{ id: 'n1', label: 'N', type: 'T', x: 0, y: 0, width: 100, height: 100 }],
        edges: [],
      };

      const metrics = calculateExtractedGraphMetrics(graph, 'motivation-ontology');

      expect(metrics.diagramType).toBe('motivation');
    });

    test('should map business-process to business diagram type', () => {
      const graph: ExtractedGraph = {
        nodes: [{ id: 'n1', label: 'N', type: 'T', x: 0, y: 0, width: 100, height: 100 }],
        edges: [],
      };

      const metrics = calculateExtractedGraphMetrics(graph, 'business-process');

      expect(metrics.diagramType).toBe('business');
    });
  });

  test.describe('Edge cases', () => {
    test('should handle single node graph', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'solo', label: 'Solo Node', type: 'Node', x: 100, y: 100, width: 100, height: 50 },
        ],
        edges: [],
      };

      const nodes = extractedGraphToNodes(extractedGraph);
      const edges = extractedGraphToEdges(extractedGraph);
      const metrics = calculateExtractedGraphMetrics(extractedGraph, 'c4-context');

      expect(nodes).toHaveLength(1);
      expect(edges).toHaveLength(0);
      expect(metrics.nodeCount).toBe(1);
      expect(metrics.edgeCount).toBe(0);
    });

    test('should handle nodes with metadata', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          {
            id: 'n1',
            label: 'Node with Metadata',
            type: 'Container',
            x: 100,
            y: 100,
            width: 180,
            height: 100,
            metadata: {
              technology: 'Java',
              description: 'API Application',
            },
          },
        ],
        edges: [],
      };

      const nodes = extractedGraphToNodes(extractedGraph);

      expect(nodes[0].data.label).toBe('Node with Metadata');
      expect(nodes[0].data.type).toBe('Container');
      // Note: metadata is not currently passed through, but the conversion should still work
    });

    test('should handle edges with bend points', () => {
      const extractedGraph: ExtractedGraph = {
        nodes: [
          { id: 'n1', label: 'N1', type: 'T', x: 0, y: 0, width: 100, height: 100 },
          { id: 'n2', label: 'N2', type: 'T', x: 300, y: 300, width: 100, height: 100 },
        ],
        edges: [
          {
            source: 'n1',
            target: 'n2',
            bendPoints: [
              { x: 150, y: 50 },
              { x: 250, y: 150 },
            ],
          },
        ],
      };

      const edges = extractedGraphToEdges(extractedGraph);

      // Bend points are stored but not currently used in the basic conversion
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('n1');
      expect(edges[0].target).toBe('n2');
    });
  });
});
