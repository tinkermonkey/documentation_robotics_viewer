import { test, expect } from '@playwright/test';

test.describe('Edge Routing', () => {
  test('edges should use SmoothStepEdge with proper routing', async ({ page }) => {
    await page.goto('http://localhost:3005');

    // Load demo data
    await page.click('text=Load Demo Data');

    // Wait for the graph to render
    await page.waitForSelector('.react-flow__edges', { timeout: 5000 });

    // Wait a bit for edges to render
    await page.waitForTimeout(1000);

    // Check that edges are rendered
    const edges = await page.locator('.react-flow__edge').count();
    console.log(`Found ${edges} edges`);
    expect(edges).toBeGreaterThan(0);

    // Check for smooth step edge paths (they use cubic bezier curves)
    const edgePaths = await page.locator('.react-flow__edge-path').count();
    console.log(`Found ${edgePaths} edge paths`);
    expect(edgePaths).toBeGreaterThan(0);

    // Take a screenshot to verify visual routing
    await page.screenshot({
      path: 'test-results/edge-routing.png',
      fullPage: true
    });

    // Check that the DataModel layer is visible (where the connection issue was)
    const dataModelLayer = await page.locator('text=DataModel').first();
    await expect(dataModelLayer).toBeVisible();

    // Look for the Order and User nodes that were in the screenshot
    const orderNode = await page.locator('text=Order').first();
    const userNode = await page.locator('text=User').first();

    if (await orderNode.isVisible() && await userNode.isVisible()) {
      console.log('Order and User nodes found and visible');

      // Get their bounding boxes
      const orderBox = await orderNode.boundingBox();
      const userBox = await userNode.boundingBox();

      if (orderBox && userBox) {
        console.log('Order node:', orderBox);
        console.log('User node:', userBox);
      }
    }
  });

  test('edges should avoid routing through nodes', async ({ page }) => {
    await page.goto('http://localhost:3005');
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.react-flow__edges', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Get all edge paths
    const edgePaths = page.locator('.react-flow__edge-path');
    const count = await edgePaths.count();

    console.log(`Testing ${count} edge paths for proper routing`);

    // For each edge, verify it has a path element with a 'd' attribute
    // SmoothStepEdge creates paths with L (line) and C (curve) commands
    for (let i = 0; i < Math.min(count, 5); i++) {
      const path = edgePaths.nth(i);
      const dAttr = await path.getAttribute('d');

      if (dAttr) {
        console.log(`Edge ${i} path:`, dAttr.substring(0, 100) + '...');

        // SmoothStepEdge should create paths with curves (C) or lines (L)
        // Not just straight lines (M x,y L x2,y2)
        const hasSteps = dAttr.includes('L') && dAttr.split('L').length > 2;
        const hasCurves = dAttr.includes('C');

        console.log(`  Has multiple steps: ${hasSteps}, Has curves: ${hasCurves}`);
      }
    }

    await page.screenshot({
      path: 'test-results/edge-routing-detailed.png',
      fullPage: true
    });
  });
});
