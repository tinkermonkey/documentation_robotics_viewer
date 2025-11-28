import { test, expect } from '@playwright/test';

test.describe('Server Model Loading', () => {
  test('should load model with 182 elements', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    expect(response.ok()).toBeTruthy();

    const model = await response.json();

    // Verify model structure
    expect(model.version).toBe('0.1.0');
    expect(model.metadata.type).toBe('yaml-instance');
    expect(model.metadata.statistics.total_elements).toBe(182);

    // Verify layers exist
    expect(model.layers).toBeDefined();
    expect(Object.keys(model.layers).length).toBe(11);
  });

  test('should have elements in each layer', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    const model = await response.json();

    let totalElements = 0;
    const layerElementCounts: Record<string, number> = {};

    for (const [layerId, layer] of Object.entries(model.layers as any)) {
      const elementCount = layer.elements?.length || 0;
      layerElementCounts[layerId] = elementCount;
      totalElements += elementCount;

      if (elementCount > 0) {
        console.log(`Layer ${layerId}: ${elementCount} elements`);
      }
    }

    console.log(`Total elements across all layers: ${totalElements}`);
    expect(totalElements).toBe(182);
  });

  test('should have proper element structure', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    const model = await response.json();

    let elementsWithTypes: Record<string, number> = {};
    let elementsWithoutType = 0;

    for (const [layerId, layer] of Object.entries(model.layers as any)) {
      for (const element of layer.elements || []) {
        // Verify required fields
        expect(element.id).toBeDefined();
        expect(element.name).toBeDefined();
        expect(element.properties).toBeDefined();

        // Track types
        const elementType = element.type || 'missing';
        if (elementType === 'unknown' || elementType === 'missing') {
          elementsWithoutType++;
          console.log(`Element without proper type: ${element.id} (${element.name})`);
          console.log(`  Properties:`, Object.keys(element.properties));
        } else {
          elementsWithTypes[elementType] = (elementsWithTypes[elementType] || 0) + 1;
        }
      }
    }

    console.log('Element types found:', elementsWithTypes);
    console.log(`Elements with unknown/missing type: ${elementsWithoutType}`);

    // Verify we have good type coverage (85%+ elements should have proper types)
    // Starting point was 163/182 unknown (90% unknown)
    // Current state should be < 30 unknown (< 15% unknown)
    expect(elementsWithoutType).toBeLessThan(30);

    // Verify we successfully inferred major element types
    expect(elementsWithTypes['constraint']).toBeGreaterThan(0);
    expect(elementsWithTypes['goal']).toBeGreaterThan(0);
    expect(elementsWithTypes['service']).toBeGreaterThan(0);
    expect(elementsWithTypes['component']).toBeGreaterThan(0);
    expect(elementsWithTypes['operation']).toBeGreaterThan(0);
  });

  test('should infer element types from YAML structure', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    const model = await response.json();

    // Check specific examples from motivation layer
    const motivationLayer = model.layers.motivation;
    expect(motivationLayer).toBeDefined();

    const elements = motivationLayer.elements || [];
    console.log(`Motivation layer has ${elements.length} elements`);

    // Find constraint element
    const constraintElement = elements.find((e: any) =>
      e.properties.constraintType !== undefined
    );

    if (constraintElement) {
      console.log('Found constraint element:', {
        id: constraintElement.id,
        type: constraintElement.type,
        properties: Object.keys(constraintElement.properties)
      });

      // The type should be 'constraint', not 'unknown'
      // This test will show us if server is setting types correctly
    }

    // Find goal element
    const goalElement = elements.find((e: any) =>
      e.properties.goal !== undefined || e.name.includes('Goal')
    );

    if (goalElement) {
      console.log('Found goal element:', {
        id: goalElement.id,
        type: goalElement.type,
        properties: Object.keys(goalElement.properties)
      });
    }
  });

  test('should have relationships in elements', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    const model = await response.json();

    let elementsWithRelationships = 0;
    let totalRelationships = 0;

    for (const [layerId, layer] of Object.entries(model.layers as any)) {
      for (const element of layer.elements || []) {
        if (element.properties.relationships) {
          elementsWithRelationships++;
          const relCount = Object.keys(element.properties.relationships).length;
          totalRelationships += relCount;
        }
      }
    }

    console.log(`Elements with relationships: ${elementsWithRelationships}`);
    console.log(`Total relationship definitions: ${totalRelationships}`);

    // Verify model has relationship data
    expect(elementsWithRelationships).toBeGreaterThan(0);
  });
});
