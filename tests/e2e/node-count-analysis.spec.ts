/**
 * Node Count Discrepancy Analysis
 *
 * Diagnostic test to identify why server reports 182 elements
 * but only 170 nodes render in the graph.
 *
 * This test runs diagnostic checks to determine where the 12 missing nodes are.
 */

import { test, expect } from '@playwright/test';

test.describe('Node Count Discrepancy Diagnostic', () => {

  test('analyze node count discrepancy', async ({ page, request }) => {
    // Get server element count
    const serverResp = await request.get('http://localhost:8765/api/model');
    const model = await serverResp.json();

    const serverElementCount = Object.values(model.layers as any)
      .reduce((sum: number, layer: any) => sum + layer.elements.length, 0);

    console.log('=== Server Data Analysis ===');
    console.log(`Total server elements: ${serverElementCount}`);

    // Analyze layer breakdown
    console.log('\nLayer-by-layer breakdown:');
    for (const [layerId, layer] of Object.entries(model.layers as any)) {
      console.log(`  ${layerId}: ${layer.elements.length} elements`);
    }

    // Load page and get rendered counts
    await page.goto('http://localhost:3001');
    await page.waitForSelector('.react-flow__node', { timeout: 15000 });

    // Wait for rendering to stabilize
    await page.waitForTimeout(3000);

    const renderedNodes = await page.locator('.react-flow__node').count();
    const containerNodes = await page.locator('[data-type="layerContainer"]').count();
    const hiddenNodes = await page.locator('.react-flow__node[hidden]').count();

    console.log('\n=== Rendered Node Analysis ===');
    console.log(`Rendered nodes (.react-flow__node): ${renderedNodes}`);
    console.log(`Container nodes (data-type="layerContainer"): ${containerNodes}`);
    console.log(`Hidden nodes: ${hiddenNodes}`);
    console.log(`Total nodes: ${renderedNodes + containerNodes}`);
    console.log(`Missing: ${serverElementCount - renderedNodes}`);

    // Get element types that rendered
    const renderedTypes = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
      return nodes.map(n => {
        const id = n.getAttribute('data-id');
        const type = n.getAttribute('data-type') || 'unknown';
        return { id, type };
      });
    });

    const uniqueTypes = new Set(renderedTypes.map(n => n.type));
    console.log(`\nRendered types: ${uniqueTypes.size} unique types`);
    console.log(`Types:`, [...uniqueTypes].sort());

    // Show sample of first 5 nodes with their types
    console.log('\nSample nodes:');
    for (const node of renderedTypes.slice(0, 5)) {
      console.log(`  ${node.id}: ${node.type}`);
    }

    // Count by type
    const typeCounts: Record<string, number> = {};
    for (const node of renderedTypes) {
      typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
    }

    console.log('\nType counts:');
    for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count}`);
    }

    // Get element IDs from server
    const serverElementIds = new Set<string>();
    for (const layer of Object.values(model.layers as any)) {
      for (const element of layer.elements) {
        serverElementIds.add(element.id);
      }
    }

    // Get rendered element IDs (strip 'node-' prefix and filter out containers)
    const {elementIds, containerIds} = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
      const elements: string[] = [];
      const containers: string[] = [];

      for (const node of nodes) {
        const id = node.getAttribute('data-id');
        if (!id) continue;

        if (id.startsWith('container-')) {
          containers.push(id);
        } else if (id.startsWith('node-')) {
          elements.push(id.replace(/^node-/, ''));
        }
      }

      return { elementIds: elements, containerIds: containers };
    });

    const renderedIdSet = new Set(elementIds);

    console.log(`\nServer element IDs: ${serverElementIds.size}`);
    console.log(`Rendered element nodes: ${elementIds.length}`);
    console.log(`Rendered container nodes: ${containerIds.length}`);
    console.log(`Total DOM nodes: ${elementIds.length + containerIds.length}`);

    // Find missing element IDs
    const missingIds: string[] = [];
    for (const id of serverElementIds) {
      if (!renderedIdSet.has(id)) {
        missingIds.push(id);
      }
    }

    if (missingIds.length > 0) {
      console.log(`\n=== Missing Elements (${missingIds.length}) ===`);
      for (const id of missingIds) {
        // Find the element in server data
        for (const layer of Object.values(model.layers as any)) {
          const element = layer.elements.find((e: any) => e.id === id);
          if (element) {
            console.log(`  ${id} (type: ${element.type}, layer: ${element.layerId})`);
          }
        }
      }
    }

    // Check for elements rendered multiple times
    const duplicates = elementIds.filter((id, index) =>
      elementIds.indexOf(id) !== index
    );

    if (duplicates.length > 0) {
      console.log(`\n=== Duplicate Elements (${duplicates.length}) ===`);
      console.log(duplicates);
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Expected nodes: ${serverElementCount}`);
    console.log(`Actual nodes: ${renderedNodes}`);
    console.log(`Discrepancy: ${serverElementCount - renderedNodes}`);
    console.log(`Status: ${renderedNodes >= serverElementCount * 0.9 ? 'ACCEPTABLE (>90%)' : 'NEEDS INVESTIGATION'}`);

    // Validation
    expect(renderedNodes).toBeGreaterThan(0);
    expect(renderedNodes).toBeGreaterThan(serverElementCount * 0.85); // At least 85% should render
  });

  test('check for transformation errors in console', async ({ page }) => {
    const transformErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('transform') || text.includes('error') || text.includes('failed')) {
        transformErrors.push(text);
      }
    });

    await page.goto('http://localhost:3001');
    await page.waitForSelector('.react-flow__node', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('\n=== Transformation Errors ===');
    if (transformErrors.length > 0) {
      console.log(`Found ${transformErrors.length} potential transformation errors:`);
      transformErrors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('No transformation errors detected');
    }
  });

  test('verify layer container rendering', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('.react-flow__node', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Check if layer containers are rendered separately
    const layerContainers = await page.locator('[data-type="layerContainer"]').count();
    const allNodes = await page.locator('.react-flow__node').count();

    console.log('\n=== Layer Container Analysis ===');
    console.log(`Layer containers: ${layerContainers}`);
    console.log(`All nodes: ${allNodes}`);
    console.log(`Expected layers: ~11`);

    if (layerContainers > 0) {
      console.log('Layer containers are rendered separately from element nodes');
    } else {
      console.log('Layer containers may be included in node count or not rendered');
    }
  });
});
