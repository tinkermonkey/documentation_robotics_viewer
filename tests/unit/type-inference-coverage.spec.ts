import { test, expect } from '@playwright/test';

test.describe('Type Inference Coverage', () => {
  test('should identify remaining elements needing type inference', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    const model = await response.json();

    const unknownElements: Array<{
      id: string;
      name: string;
      layer: string;
      properties: string[];
    }> = [];

    for (const [layerId, layer] of Object.entries(model.layers as any)) {
      for (const element of layer.elements || []) {
        if (element.type === 'unknown') {
          unknownElements.push({
            id: element.id,
            name: element.name,
            layer: layerId,
            properties: Object.keys(element.properties)
          });
        }
      }
    }

    console.log(`\nFound ${unknownElements.length} elements with unknown type:`);

    // Group by common patterns
    const patterns: Record<string, typeof unknownElements> = {};

    for (const elem of unknownElements) {
      // Check for policy pattern
      if (elem.name.toLowerCase().includes('policy')) {
        patterns['policy'] = patterns['policy'] || [];
        patterns['policy'].push(elem);
      }
      // Check for zone pattern
      else if (elem.name.toLowerCase().includes('zone')) {
        patterns['zone'] = patterns['zone'] || [];
        patterns['zone'].push(elem);
      }
      // Check for systemsoftware pattern
      else if (elem.id.includes('systemsoftware')) {
        patterns['systemsoftware'] = patterns['systemsoftware'] || [];
        patterns['systemsoftware'].push(elem);
      }
      // Check for artifact pattern
      else if (elem.id.includes('artifact')) {
        patterns['artifact'] = patterns['artifact'] || [];
        patterns['artifact'].push(elem);
      }
      // Other unknown
      else {
        patterns['other'] = patterns['other'] || [];
        patterns['other'].push(elem);
      }
    }

    for (const [pattern, elements] of Object.entries(patterns)) {
      console.log(`\n${pattern.toUpperCase()} (${elements.length} elements):`);
      for (const elem of elements.slice(0, 3)) {
        console.log(`  - ${elem.name}`);
        console.log(`    Properties: ${elem.properties.join(', ')}`);
      }
    }

    // Document what needs to be added to type inference
    console.log('\n=== Type Inference Improvements Needed ===');
    if (patterns['policy']) {
      console.log(`- Add 'policy' type for elements with names containing 'policy'`);
    }
    if (patterns['zone']) {
      console.log(`- Add 'zone' type for elements with 'trust_level' property`);
    }
    if (patterns['systemsoftware']) {
      console.log(`- Add 'systemsoftware' type for elements with 'language' property`);
    }
    if (patterns['artifact']) {
      console.log(`- Add 'artifact' type for elements with 'location' property`);
    }

    // Test should pass - this is documentation, not enforcement
    expect(unknownElements.length).toBeGreaterThanOrEqual(0);
  });

  test('should verify all major architectural layers have typed elements', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    const model = await response.json();

    const layerCoverage: Record<string, { total: number; typed: number; percentage: number }> = {};

    for (const [layerId, layer] of Object.entries(model.layers as any)) {
      const total = layer.elements?.length || 0;
      const typed = layer.elements?.filter((e: any) => e.type !== 'unknown').length || 0;
      const percentage = total > 0 ? Math.round((typed / total) * 100) : 0;

      layerCoverage[layerId] = { total, typed, percentage };
    }

    console.log('\n=== Layer Type Coverage ===');
    for (const [layerId, coverage] of Object.entries(layerCoverage)) {
      console.log(`${layerId}: ${coverage.typed}/${coverage.total} (${coverage.percentage}%)`);

      // Each layer should have at least 70% type coverage
      if (coverage.total > 0) {
        expect(coverage.percentage).toBeGreaterThanOrEqual(70);
      }
    }

    // Overall coverage should be at least 85%
    const totalElements = Object.values(layerCoverage).reduce((sum, c) => sum + c.total, 0);
    const typedElements = Object.values(layerCoverage).reduce((sum, c) => sum + c.typed, 0);
    const overallPercentage = Math.round((typedElements / totalElements) * 100);

    console.log(`\nOverall: ${typedElements}/${totalElements} (${overallPercentage}%)`);
    expect(overallPercentage).toBeGreaterThanOrEqual(85);
  });
});
