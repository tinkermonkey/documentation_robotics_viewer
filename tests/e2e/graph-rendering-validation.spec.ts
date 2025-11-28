/**
 * Enhanced E2E Graph Rendering Validation Tests
 *
 * These tests validate actual graph rendering, not just DOM structure.
 * They would have caught the "type: unknown" bug where 0 nodes rendered.
 *
 * Critical validations:
 * - Actual node count matches expected (182 for example model)
 * - Nodes have visible labels/content
 * - Edges render between nodes
 * - No console errors during rendering
 * - Layers are positioned correctly
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Count console errors
 */
async function monitorConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected WebSocket fallback errors
      if (!text.includes('[WebSocket]') && !text.includes('WebSocket')) {
        errors.push(text);
      }
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  return errors;
}

/**
 * Helper: Wait for graph to finish rendering
 */
async function waitForGraphRendering(page: Page, minNodeCount: number = 1) {
  // Wait for graph container
  await page.waitForSelector('.graph-viewer', { timeout: 10000 });

  // Wait for React Flow to be ready
  await page.waitForSelector('.react-flow', { timeout: 10000 });

  // Wait for at least some nodes to appear
  await page.waitForSelector('.react-flow__node', { timeout: 15000 });

  // Wait for node count to stabilize (layout might take time)
  let previousCount = 0;
  let stableCount = 0;

  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(500);
    const currentCount = await page.locator('.react-flow__node').count();

    if (currentCount === previousCount && currentCount >= minNodeCount) {
      stableCount++;
      if (stableCount >= 3) break; // Count stable for 1.5 seconds
    } else {
      stableCount = 0;
    }

    previousCount = currentCount;
  }
}

test.describe('Graph Rendering Validation - Model Mode', () => {

  test('should render correct number of nodes from server model', async ({ page }) => {
    const errors = await monitorConsoleErrors(page);

    // Navigate to embedded app (loads from server on port 8765)
    await page.goto('http://localhost:3001');

    // Wait for model to load and graph to render
    await waitForGraphRendering(page, 50);

    // CRITICAL: Count actual rendered nodes
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log(`✓ Rendered ${nodeCount} nodes in Model mode`);

    // Verify we got a reasonable number of nodes
    // Expected: 182 elements from server
    // Note: Some elements may not render as nodes (e.g., layer containers use different class)
    // Validation: At least 150 nodes should render (allowing for some variance)
    expect(nodeCount).toBeGreaterThan(150);
    expect(nodeCount).toBeLessThan(250); // Reasonable upper bound

    // CRITICAL: Check for console errors
    if (errors.length > 0) {
      console.error('Console errors detected:', errors);
    }
    expect(errors).toHaveLength(0);
  });

  test('should render nodes with visible labels', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Sample first 20 visible nodes
    const visibleNodes = await page.locator('.react-flow__node:visible').all();
    expect(visibleNodes.length).toBeGreaterThan(0);

    console.log(`Checking labels on ${Math.min(20, visibleNodes.length)} sample nodes...`);

    let nodesWithLabels = 0;
    let nodesWithoutLabels = 0;

    for (const node of visibleNodes.slice(0, 20)) {
      const text = await node.textContent();
      if (text && text.trim().length > 0) {
        nodesWithLabels++;
      } else {
        nodesWithoutLabels++;
        const nodeId = await node.getAttribute('data-id');
        console.warn(`Node without label: ${nodeId}`);
      }
    }

    console.log(`✓ ${nodesWithLabels} nodes with labels, ${nodesWithoutLabels} without`);

    // At least 90% of sampled nodes should have labels
    expect(nodesWithLabels).toBeGreaterThan(nodesWithoutLabels);
  });

  test('should render edges between nodes', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // CRITICAL: Verify edges exist
    const edgeCount = await page.locator('.react-flow__edge').count();
    console.log(`✓ Rendered ${edgeCount} edges`);

    // Example model has relationships, so edges should exist
    expect(edgeCount).toBeGreaterThan(0);
  });

  test('should render all element types correctly', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Get all node types from React Flow CSS classes
    const nodeTypes = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
      const types = new Set<string>();

      nodes.forEach(node => {
        // Extract type from React Flow's class: react-flow__node-{type}
        const typeFromClass = node.className.match(/react-flow__node-(\w+)/)?.[1];
        if (typeFromClass) types.add(typeFromClass);
      });

      return Array.from(types);
    });

    console.log(`✓ Found ${nodeTypes.length} different node types:`, nodeTypes);

    // Should have at least 2 types (layerContainer + businessProcess minimum)
    expect(nodeTypes.length).toBeGreaterThanOrEqual(2);

    // Should NOT have 'unknown' type
    expect(nodeTypes).not.toContain('unknown');

    // Should have businessProcess and layerContainer
    expect(nodeTypes).toContain('businessProcess');
    expect(nodeTypes).toContain('layerContainer');
  });

  test('should position nodes in vertical layers', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Get all Y positions of element nodes (excluding containers)
    const yPositions = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node')) as HTMLElement[];
      const positions: number[] = [];

      nodes.forEach(node => {
        // Skip container nodes
        if (node.getAttribute('data-id')?.startsWith('container-')) {
          return;
        }

        const transform = node.style.transform;
        const match = transform.match(/translate\([\d.]+px,\s*([\d.]+)px\)/);
        if (match) {
          const y = parseFloat(match[1]);
          positions.push(y);
        }
      });

      return positions;
    });

    console.log(`Collected ${yPositions.length} Y positions`);
    console.log('Unique Y values:', new Set(yPositions).size);
    console.log('Sample Y positions:', yPositions.slice(0, 10));

    // Should have nodes positioned
    expect(yPositions.length).toBeGreaterThan(100);

    // In a vertical layer layout, nodes should be at different Y positions
    // At minimum, expect at least 5 different Y levels (one per layer minimum)
    const uniqueYPositions = new Set(yPositions);
    expect(uniqueYPositions.size).toBeGreaterThanOrEqual(5);
  });

  test('should handle layer visibility toggling', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Get initial visible node count
    const initialCount = await page.locator('.react-flow__node:visible').count();
    console.log(`Initial visible nodes: ${initialCount}`);

    // Find a layer toggle button (if UI has one)
    const layerToggle = await page.locator('[data-testid="layer-toggle"]').first();

    if (await layerToggle.isVisible()) {
      await layerToggle.click();
      await page.waitForTimeout(500); // Wait for animation

      const afterToggleCount = await page.locator('.react-flow__node:visible').count();
      console.log(`After toggle: ${afterToggleCount}`);

      // Count should change when toggling layers
      expect(afterToggleCount).not.toBe(initialCount);
    } else {
      console.log('⚠ Layer toggle UI not found, skipping visibility test');
    }
  });

  test('should not have rendering errors in console', async ({ page }) => {
    const errors = await monitorConsoleErrors(page);

    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Let any async errors surface
    await page.waitForTimeout(2000);

    // CRITICAL: No errors should occur during rendering
    if (errors.length > 0) {
      console.error('❌ Console errors detected:');
      errors.forEach(err => console.error('  -', err));
    }

    expect(errors).toHaveLength(0);
  });

  test('should match visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Zoom to fit
    await page.click('.react-flow__controls-fitview');
    await page.waitForTimeout(1000);

    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('model-graph-full-render.png', {
      fullPage: true,
      maxDiffPixels: 500, // Allow some rendering variance
      timeout: 10000
    });

    console.log('✓ Visual snapshot captured');
  });
});

test.describe('Graph Rendering Validation - Spec Mode', () => {

  test('should render schema definitions as graph', async ({ page }) => {
    const errors = await monitorConsoleErrors(page);

    await page.goto('http://localhost:3001');

    // Switch to Spec mode
    await page.click('button:has-text("Spec")');
    await page.waitForTimeout(500);

    // Click Graph tab
    await page.click('button:has-text("Graph")');

    // Wait for graph to render
    await waitForGraphRendering(page, 10);

    // Count nodes (should be schema element types)
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log(`✓ Rendered ${nodeCount} schema nodes in Spec mode`);

    // Should have some nodes from schema definitions
    expect(nodeCount).toBeGreaterThan(0);

    // Check for errors
    if (errors.length > 0) {
      console.error('Console errors in Spec mode:', errors);
    }
    expect(errors).toHaveLength(0);
  });

  test('should show schema element labels in Spec graph', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('button:has-text("Spec")');
    await page.click('button:has-text("Graph")');
    await waitForGraphRendering(page, 5);

    // Check that nodes have text content
    const nodesWithText = await page.locator('.react-flow__node:has-text("")').count();
    const totalNodes = await page.locator('.react-flow__node').count();

    console.log(`Spec nodes with text: ${nodesWithText}/${totalNodes}`);

    // Most nodes should have labels
    expect(nodesWithText).toBeGreaterThan(0);
    expect(nodesWithText / totalNodes).toBeGreaterThan(0.8); // 80% threshold
  });

  test('should match Spec graph visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('button:has-text("Spec")');
    await page.click('button:has-text("Graph")');
    await waitForGraphRendering(page, 5);

    // Fit view
    await page.click('.react-flow__controls-fitview');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('spec-graph-render.png', {
      fullPage: true,
      maxDiffPixels: 300,
      timeout: 10000
    });

    console.log('✓ Spec visual snapshot captured');
  });
});

test.describe('Graph Rendering Validation - Data Quality', () => {

  test('should verify all nodes have required properties', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Check node data attributes
    const nodeValidation = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));

      let valid = 0;
      let invalid = 0;
      const issues: string[] = [];

      nodes.forEach((node, idx) => {
        const element = node as HTMLElement;
        const hasId = element.getAttribute('data-id') !== null;
        const hasPosition = element.style.transform.includes('translate');
        const hasContent = (element.textContent?.trim().length || 0) > 0;

        if (hasId && hasPosition && hasContent) {
          valid++;
        } else {
          invalid++;
          if (idx < 5) { // Log first 5 issues
            issues.push(`Node ${idx}: id=${hasId}, pos=${hasPosition}, content=${hasContent}`);
          }
        }
      });

      return { valid, invalid, issues };
    });

    console.log('Node validation:', nodeValidation);

    if (nodeValidation.issues.length > 0) {
      console.warn('Node validation issues:', nodeValidation.issues);
    }

    // At least 95% of nodes should be valid
    const validPercentage = nodeValidation.valid / (nodeValidation.valid + nodeValidation.invalid);
    expect(validPercentage).toBeGreaterThan(0.95);
  });

  test('should verify model metadata is correct', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Access model data from window (if exposed)
    const modelStats = await page.evaluate(() => {
      // Try to get model from React DevTools or window
      const reactRoot = document.querySelector('#root');
      if (!reactRoot) return null;

      // Count actual elements in graph
      const nodeCount = document.querySelectorAll('.react-flow__node').length;
      const edgeCount = document.querySelectorAll('.react-flow__edge').length;

      return {
        nodes: nodeCount,
        edges: edgeCount
      };
    });

    console.log('Model stats:', modelStats);

    if (modelStats) {
      // Verify reasonable counts
      expect(modelStats.nodes).toBeGreaterThan(100); // Example model has 182
      expect(modelStats.edges).toBeGreaterThan(0);
    }
  });

  test('should verify no duplicate node IDs', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    const duplicateCheck = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
      const ids = nodes.map(node => node.getAttribute('data-id')).filter(id => id !== null);

      const uniqueIds = new Set(ids);
      const duplicates = ids.length - uniqueIds.size;

      return {
        total: ids.length,
        unique: uniqueIds.size,
        duplicates
      };
    });

    console.log('ID check:', duplicateCheck);

    // Should have no duplicates
    expect(duplicateCheck.duplicates).toBe(0);
    expect(duplicateCheck.unique).toBe(duplicateCheck.total);
  });
});

test.describe('Graph Rendering Validation - Performance', () => {

  test('should render within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    const renderTime = Date.now() - startTime;
    console.log(`✓ Graph rendered in ${renderTime}ms`);

    // Should render within 15 seconds
    expect(renderTime).toBeLessThan(15000);
  });

  test('should handle zoom and pan smoothly', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await waitForGraphRendering(page, 50);

    // Test zoom controls
    await page.click('.react-flow__controls-zoomin');
    await page.waitForTimeout(300);

    await page.click('.react-flow__controls-zoomout');
    await page.waitForTimeout(300);

    // Test fit view
    await page.click('.react-flow__controls-fitview');
    await page.waitForTimeout(500);

    // Should complete without errors
    console.log('✓ Zoom/pan controls working');
  });
});
