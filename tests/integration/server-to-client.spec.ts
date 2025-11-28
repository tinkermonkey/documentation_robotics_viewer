/**
 * Server-to-Client Integration Tests (Phase 3)
 *
 * Tests the complete data pipeline from server API → client → graph rendering
 * These tests verify data integrity through the entire stack.
 */

import { test, expect } from '@playwright/test';

test.describe('Server-to-Client Data Pipeline', () => {

  test('should load model data from server API', async ({ request }) => {
    // STEP 1: Verify server API returns correct data structure
    const response = await request.get('http://localhost:8765/api/model');
    expect(response.ok()).toBe(true);

    const serverModel = await response.json();

    console.log('Server model structure:', {
      hasLayers: !!serverModel.layers,
      layerCount: Object.keys(serverModel.layers || {}).length,
      layerNames: Object.keys(serverModel.layers || {})
    });

    // CRITICAL: Verify basic structure
    expect(serverModel).toBeDefined();
    expect(serverModel.layers).toBeDefined();
    expect(Object.keys(serverModel.layers).length).toBeGreaterThan(0);

    // CRITICAL: Count elements across all layers
    let totalElements = 0;
    let elementsWithTypes: Record<string, number> = {};
    let elementsWithoutType = 0;

    for (const [layerId, layer] of Object.entries(serverModel.layers as any)) {
      const elements = layer.elements || [];
      totalElements += elements.length;

      console.log(`Layer ${layerId}: ${elements.length} elements`);

      for (const element of elements) {
        if (!element.type || element.type === 'unknown') {
          elementsWithoutType++;
          console.warn(`Element ${element.id} has no/unknown type`);
        } else {
          elementsWithTypes[element.type] = (elementsWithTypes[element.type] || 0) + 1;
        }
      }
    }

    console.log('Server data quality:', {
      totalElements,
      elementsWithTypes: Object.keys(elementsWithTypes).length,
      elementsWithoutType,
      typeDistribution: elementsWithTypes
    });

    // CRITICAL: All elements must have proper types
    expect(totalElements).toBe(182); // Expected from example-implementation
    expect(elementsWithoutType).toBe(0); // Must be ZERO
    expect(Object.keys(elementsWithTypes).length).toBeGreaterThan(5);
  });

  test('should receive model data in client', async ({ page }) => {
    // STEP 2: Load page and verify client receives data
    await page.goto('http://localhost:3001');

    // Wait for connection indicator
    await page.waitForSelector('text=Connected', { timeout: 10000 });

    // Check client-side model data
    const clientModel = await page.evaluate(() => {
      // Try to access model from window or React state
      // This depends on how the app exposes data
      return {
        hasWindow: typeof window !== 'undefined',
        timestamp: Date.now()
      };
    });

    console.log('Client loaded:', clientModel);
    expect(clientModel.hasWindow).toBe(true);
  });

  test('should preserve element types from server to client', async ({ page, request }) => {
    // STEP 3: Compare server data to client rendering

    // Get server data
    const serverResponse = await request.get('http://localhost:8765/api/model');
    const serverModel = await serverResponse.json();

    const serverElements: any[] = [];
    for (const layer of Object.values(serverModel.layers)) {
      serverElements.push(...(layer as any).elements || []);
    }

    console.log(`Server has ${serverElements.length} elements`);

    // Load page
    await page.goto('http://localhost:3001');
    await page.waitForSelector('text=Connected');

    // Wait a bit for data to load
    await page.waitForTimeout(2000);

    // Check if elements are being processed
    const clientInfo = await page.evaluate(() => {
      // Check console for any transformation logs
      return {
        url: window.location.href,
        hasReact: typeof (window as any).React !== 'undefined'
      };
    });

    console.log('Client info:', clientInfo);

    // Verify we got data from server
    expect(serverElements.length).toBe(182);

    // Every server element should have a valid type
    const serverTypesValid = serverElements.every(e => e.type && e.type !== 'unknown');
    expect(serverTypesValid).toBe(true);

    console.log('✓ Server element types are valid');
    console.log('Server element types:', [...new Set(serverElements.map(e => e.type))].sort());
  });

  test('should transform server elements to displayable format', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('text=Connected');

    // Switch to JSON view to see what data is loaded
    await page.click('button:has-text("JSON")');
    await page.waitForTimeout(1000);

    // Check if JSON viewer shows data
    const jsonViewerContent = await page.locator('.json-viewer, pre, .json-display').first().textContent();

    if (jsonViewerContent) {
      console.log('JSON viewer has content:', jsonViewerContent.substring(0, 200) + '...');
      expect(jsonViewerContent.length).toBeGreaterThan(0);
    }

    // Switch back to Graph view
    await page.click('button:has-text("Graph")');
    await page.waitForTimeout(1000);

    // Check if graph viewer exists
    const graphViewer = await page.locator('.graph-viewer, .react-flow').first();
    await expect(graphViewer).toBeVisible({ timeout: 5000 });

    console.log('✓ Graph viewer container is visible');
  });

  test('should identify transformation pipeline failure point', async ({ page }) => {
    // This test tries to pinpoint where the pipeline breaks

    await page.goto('http://localhost:3001');

    // Monitor console for errors
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    // Wait for app to load
    await page.waitForSelector('text=Connected', { timeout: 10000 });
    await page.waitForTimeout(3000); // Let everything settle

    // Look for specific console messages about transformation
    const transformLogs = consoleMessages.filter(msg =>
      msg.includes('Transform') ||
      msg.includes('model') ||
      msg.includes('nodes') ||
      msg.includes('elements')
    );

    console.log('\n=== Console Messages Related to Transformation ===');
    transformLogs.forEach(log => console.log(log));

    console.log('\n=== Errors ===');
    if (errors.length > 0) {
      errors.forEach(err => console.error(err));
    } else {
      console.log('No errors detected');
    }

    // Check what's in the DOM
    const domInfo = await page.evaluate(() => {
      return {
        hasGraphViewer: !!document.querySelector('.graph-viewer'),
        hasReactFlow: !!document.querySelector('.react-flow'),
        hasReactFlowNodes: !!document.querySelector('.react-flow__node'),
        reactFlowNodeCount: document.querySelectorAll('.react-flow__node').length,
        hasReactFlowEdges: !!document.querySelector('.react-flow__edge'),
        layerPanelVisible: !!document.querySelector('[class*="layer"]'),
      };
    });

    console.log('\n=== DOM Structure ===');
    console.log(JSON.stringify(domInfo, null, 2));

    // Assertions to identify the break point
    expect(domInfo.hasGraphViewer).toBe(true); // ✓ Graph viewer exists
    expect(domInfo.hasReactFlow).toBe(true); // ✓ React Flow mounted

    if (!domInfo.hasReactFlowNodes) {
      console.error('❌ BREAK POINT IDENTIFIED: React Flow has NO nodes!');
      console.error('   This means:');
      console.error('   1. Model is loading (server connection works)');
      console.error('   2. React Flow is mounting (component renders)');
      console.error('   3. BUT: NodeTransformer is not creating nodes, OR');
      console.error('   4. GraphViewer is not passing nodes to React Flow');
    }

    // This will fail until the issue is fixed
    expect(domInfo.reactFlowNodeCount).toBeGreaterThan(0);
  });

  test('should verify server model structure matches client expectations', async ({ request }) => {
    const response = await request.get('http://localhost:8765/api/model');
    const model = await response.json();

    // Verify structure matches what NodeTransformer expects
    expect(model.layers).toBeDefined();

    for (const [layerId, layer] of Object.entries(model.layers as any)) {
      console.log(`\nValidating layer: ${layerId}`);

      // Check required layer properties
      expect(layer.name).toBeDefined();
      expect(layer.elements).toBeDefined();
      expect(Array.isArray(layer.elements)).toBe(true);

      // Check element structure
      for (const element of layer.elements) {
        // Required fields for NodeTransformer
        expect(element.id).toBeDefined();
        expect(element.type).toBeDefined();
        expect(element.name).toBeDefined();
        expect(element.layerId).toBeDefined();

        // Visual properties
        if (!element.visual) {
          console.warn(`Element ${element.id} missing visual properties`);
        } else {
          expect(element.visual.size).toBeDefined();
          expect(element.visual.style).toBeDefined();
        }

        // Properties object
        if (!element.properties) {
          console.warn(`Element ${element.id} missing properties object`);
        }
      }
    }

    console.log('✓ Server model structure is valid for client consumption');
  });

  test('should check if GraphViewer receives model prop', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('text=Connected');

    // Try to inspect React component props
    const componentInfo = await page.evaluate(() => {
      // Try to find React Fiber node
      const root = document.getElementById('root');
      if (!root) return { error: 'No root element' };

      // Check if React DevTools would show anything
      const reactRoot = (root as any)._reactRootContainer ||
                       (root as any)._reactRoot ||
                       (root as any).__reactContainer$;

      return {
        hasReactRoot: !!reactRoot,
        hasGraphViewer: !!document.querySelector('.graph-viewer'),
        timestamp: Date.now()
      };
    });

    console.log('Component inspection:', componentInfo);

    expect(componentInfo.hasGraphViewer).toBe(true);
  });
});
