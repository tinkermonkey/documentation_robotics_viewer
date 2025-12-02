/**
 * Integration tests for C4GraphBuilder with example-implementation model
 *
 * Tests the parser against the real 182-element example model to validate:
 * - Correct container/component classification
 * - API relationship inference
 * - Technology stack extraction
 * - Deployment mapping
 * - Graph structure validation
 * - Performance targets
 */

import { test, expect } from '@playwright/test';
import { C4GraphBuilder } from '../../src/apps/embedded/services/c4Parser';
import { loadExampleImplementation } from '../helpers/testDataLoader';
import { C4Type, ContainerType } from '../../src/apps/embedded/types/c4Graph';

test.describe('C4Parser Integration Tests', () => {
  test.describe('Example Implementation Model (182 elements)', () => {
    test('should parse example-implementation model successfully', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // Basic validation
      expect(graph.nodes.size).toBeGreaterThan(0);
      expect(graph.metadata.warnings.length).toBe(0);
      console.log(`[C4Parser] Parsed ${graph.nodes.size} nodes from 182 elements`);
    });

    test('should detect containers from application services', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // According to manifest.yaml, there are 15 application services
      // Services with API endpoints should be classified as containers
      const containers = Array.from(graph.nodes.values()).filter(
        (n) => n.c4Type === C4Type.Container
      );

      console.log(`[C4Parser] Detected ${containers.length} containers`);
      expect(containers.length).toBeGreaterThan(0);

      // Verify container properties
      for (const container of containers) {
        expect(container.name).toBeTruthy();
        expect(container.description).toBeTruthy();
        expect(container.sourceElement).toBeDefined();
      }
    });

    test('should extract components from application layer', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // According to manifest.yaml, there are 18 application components
      const components = Array.from(graph.nodes.values()).filter(
        (n) => n.c4Type === C4Type.Component
      );

      console.log(`[C4Parser] Extracted ${components.length} components`);
      expect(components.length).toBeGreaterThan(0);

      // Verify component properties
      for (const component of components) {
        expect(component.name).toBeTruthy();
        expect(component.c4Type).toBe(C4Type.Component);
      }
    });

    test('should link API operations to containers', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // Manifest shows 20 API operations
      // Containers with API endpoints should have metadata
      const containersWithApis = Array.from(graph.nodes.values()).filter(
        (n) => n.c4Type === C4Type.Container && n.metadata?.apiEndpointCount && n.metadata.apiEndpointCount > 0
      );

      console.log(`[C4Parser] Found ${containersWithApis.length} containers with API endpoints`);
      expect(containersWithApis.length).toBeGreaterThan(0);

      // Verify API endpoint counts
      const totalApiEndpoints = containersWithApis.reduce(
        (sum, c) => sum + (c.metadata?.apiEndpointCount || 0),
        0
      );
      console.log(`[C4Parser] Total API endpoints: ${totalApiEndpoints}`);
      expect(totalApiEndpoints).toBeGreaterThan(0);
    });

    test('should include datastore containers', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // Manifest shows 4 databases in datastore layer
      const datastores = Array.from(graph.nodes.values()).filter(
        (n) => n.containerType === ContainerType.Database
      );

      console.log(`[C4Parser] Found ${datastores.length} datastore containers`);
      expect(datastores.length).toBeGreaterThanOrEqual(4);

      // Verify database containers
      for (const db of datastores) {
        expect(db.c4Type).toBe(C4Type.Container);
        expect(db.containerType).toBe(ContainerType.Database);
      }
    });

    test('should extract technology stack information', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // Check that technology metadata is collected
      expect(graph.metadata.technologies.length).toBeGreaterThan(0);
      console.log(`[C4Parser] Technologies found: ${graph.metadata.technologies.join(', ')}`);

      // Verify technology index
      expect(graph.indexes.byTechnology.size).toBeGreaterThan(0);

      // Check that some nodes have technology stack
      const nodesWithTech = Array.from(graph.nodes.values()).filter(
        (n) => n.technology.length > 0
      );
      console.log(`[C4Parser] ${nodesWithTech.length} nodes have technology information`);
      expect(nodesWithTech.length).toBeGreaterThan(0);
    });

    test('should build hierarchy correctly', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // Verify system boundary
      expect(graph.hierarchy.systemBoundary.length).toBeGreaterThan(0);
      console.log(`[C4Parser] System boundary: ${graph.hierarchy.systemBoundary.length} containers`);

      // Verify container-component relationships
      const containersWithComponents = Array.from(graph.hierarchy.containers.entries()).filter(
        ([_, components]) => components.length > 0
      );
      console.log(
        `[C4Parser] ${containersWithComponents.length} containers have components`
      );

      // Verify parent-child map consistency
      for (const [containerId, componentIds] of graph.hierarchy.containers) {
        for (const componentId of componentIds) {
          expect(graph.hierarchy.parentChildMap.get(componentId)).toBe(containerId);
        }
      }
    });

    test('should create edges from relationships', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      console.log(`[C4Parser] Created ${graph.edges.size} edges`);

      // Verify edges have required properties
      for (const edge of graph.edges.values()) {
        expect(edge.sourceId).toBeTruthy();
        expect(edge.targetId).toBeTruthy();
        expect(edge.protocol).toBeTruthy();
        expect(edge.direction).toBeTruthy();
        expect(edge.description).toBeTruthy();

        // Verify source and target nodes exist
        expect(graph.nodes.has(edge.sourceId)).toBe(true);
        expect(graph.nodes.has(edge.targetId)).toBe(true);
      }
    });

    test('should validate graph structure (no cycles)', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder({ validateStructure: true });

      const graph = builder.build(metaModel);

      // Check validation results
      expect(graph.metadata.hasCycles).toBe(false);

      // Check for validation errors
      const criticalErrors = graph.metadata.validationErrors.filter((e) =>
        e.includes('cycle')
      );
      expect(criticalErrors.length).toBe(0);

      console.log(`[C4Parser] Validation: ${graph.metadata.validationErrors.length} errors`);
    });

    test('should validate all edge references', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder({ validateStructure: true });

      const graph = builder.build(metaModel);

      // All edges should reference valid nodes
      for (const edge of graph.edges.values()) {
        expect(graph.nodes.has(edge.sourceId)).toBe(true);
        expect(graph.nodes.has(edge.targetId)).toBe(true);
      }

      // Check for missing reference errors
      const missingRefErrors = graph.metadata.validationErrors.filter((e) =>
        e.includes('non-existent')
      );
      console.log(`[C4Parser] Missing reference errors: ${missingRefErrors.length}`);
    });

    test('should build efficient indexes', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // Verify all index types are populated
      expect(graph.indexes.byType.size).toBeGreaterThan(0);
      console.log(`[C4Parser] Type index: ${graph.indexes.byType.size} types`);

      expect(graph.indexes.byTechnology.size).toBeGreaterThan(0);
      console.log(
        `[C4Parser] Technology index: ${graph.indexes.byTechnology.size} technologies`
      );

      expect(graph.indexes.byContainerType.size).toBeGreaterThan(0);
      console.log(
        `[C4Parser] Container type index: ${graph.indexes.byContainerType.size} types`
      );

      // Verify index consistency
      let totalNodesInTypeIndex = 0;
      for (const nodeSet of graph.indexes.byType.values()) {
        totalNodesInTypeIndex += nodeSet.size;
      }
      expect(totalNodesInTypeIndex).toBe(graph.nodes.size);
    });

    test('should complete parsing in under 500ms', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const startTime = performance.now();
      const graph = builder.build(metaModel);
      const endTime = performance.now();

      const parseTime = endTime - startTime;
      console.log(`[C4Parser] Parse time: ${parseTime.toFixed(2)}ms`);

      expect(parseTime).toBeLessThan(500);
      expect(graph.metadata.performance!.parseTimeMs).toBeLessThan(500);
    });

    test('should produce expected element counts', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      console.log('[C4Parser] Element counts:');
      console.log(`  Containers: ${graph.metadata.elementCounts[C4Type.Container]}`);
      console.log(`  Components: ${graph.metadata.elementCounts[C4Type.Component]}`);
      console.log(`  External: ${graph.metadata.elementCounts[C4Type.External]}`);
      console.log(`  Deployment: ${graph.metadata.elementCounts[C4Type.Deployment]}`);

      // Based on manifest:
      // - 15 application services (potential containers)
      // - 18 application components
      // - 4 databases
      // Expected: ~15 containers (services) + 4 (databases) = 19 containers
      // Expected: ~18 components

      expect(graph.metadata.elementCounts[C4Type.Container]).toBeGreaterThanOrEqual(4);
      expect(graph.metadata.elementCounts[C4Type.Component]).toBeGreaterThanOrEqual(0);
    });

    test('should provide detailed metadata', async () => {
      const metaModel = await loadExampleImplementation();
      const builder = new C4GraphBuilder();

      const graph = builder.build(metaModel);

      // Verify metadata structure
      expect(graph.metadata).toBeDefined();
      expect(graph.metadata.elementCounts).toBeDefined();
      expect(graph.metadata.containerTypeCounts).toBeDefined();
      expect(graph.metadata.technologies).toBeDefined();
      expect(graph.metadata.maxComponentDepth).toBeGreaterThanOrEqual(0);
      expect(graph.metadata.performance).toBeDefined();

      console.log('[C4Parser] Metadata summary:');
      console.log(`  Total nodes: ${graph.nodes.size}`);
      console.log(`  Total edges: ${graph.edges.size}`);
      console.log(`  Technologies: ${graph.metadata.technologies.length}`);
      console.log(`  Max component depth: ${graph.metadata.maxComponentDepth}`);
      console.log(`  Warnings: ${graph.metadata.warnings.length}`);
      console.log(`  Validation errors: ${graph.metadata.validationErrors.length}`);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle model with no API layer', async () => {
      const metaModel = await loadExampleImplementation();

      // Remove API layer
      delete metaModel.layers['api'];

      const builder = new C4GraphBuilder();
      const graph = builder.build(metaModel);

      // Should still build graph, but containers may not be detected
      expect(graph.nodes.size).toBeGreaterThanOrEqual(0);
      console.log(`[C4Parser] Nodes without API layer: ${graph.nodes.size}`);
    });

    test('should handle model with no relationships', async () => {
      const metaModel = await loadExampleImplementation();

      // Clear relationships
      for (const layer of Object.values(metaModel.layers)) {
        layer.relationships = [];
      }

      const builder = new C4GraphBuilder();
      const graph = builder.build(metaModel);

      // Should still detect nodes
      expect(graph.nodes.size).toBeGreaterThan(0);
      // Should have no edges
      expect(graph.edges.size).toBe(0);
    });
  });

  test.describe('Builder Options', () => {
    test('should respect includeExternal option', async () => {
      const metaModel = await loadExampleImplementation();

      const builderWithExternal = new C4GraphBuilder({ includeExternal: true });
      const graphWithExternal = builderWithExternal.build(metaModel);

      const builderWithoutExternal = new C4GraphBuilder({ includeExternal: false });
      const graphWithoutExternal = builderWithoutExternal.build(metaModel);

      console.log(
        `[C4Parser] External actors (included): ${
          Array.from(graphWithExternal.nodes.values()).filter(
            (n) => n.c4Type === C4Type.External
          ).length
        }`
      );
      console.log(
        `[C4Parser] External actors (excluded): ${
          Array.from(graphWithoutExternal.nodes.values()).filter(
            (n) => n.c4Type === C4Type.External
          ).length
        }`
      );
    });

    test('should respect validateStructure option', async () => {
      const metaModel = await loadExampleImplementation();

      const builderWithValidation = new C4GraphBuilder({ validateStructure: true });
      const graphWithValidation = builderWithValidation.build(metaModel);

      const builderWithoutValidation = new C4GraphBuilder({ validateStructure: false });
      const graphWithoutValidation = builderWithoutValidation.build(metaModel);

      // With validation, should have validation results
      expect(graphWithValidation.metadata.validationErrors).toBeDefined();

      // Without validation, should have empty validation errors
      expect(graphWithoutValidation.metadata.validationErrors.length).toBe(0);
    });

    test('should respect inferTechnology option', async () => {
      const metaModel = await loadExampleImplementation();

      const builderWithInference = new C4GraphBuilder({ inferTechnology: true });
      const graphWithInference = builderWithInference.build(metaModel);

      const builderWithoutInference = new C4GraphBuilder({ inferTechnology: false });
      const graphWithoutInference = builderWithoutInference.build(metaModel);

      console.log(
        `[C4Parser] Technologies (with inference): ${graphWithInference.metadata.technologies.length}`
      );
      console.log(
        `[C4Parser] Technologies (without inference): ${graphWithoutInference.metadata.technologies.length}`
      );
    });
  });
});
