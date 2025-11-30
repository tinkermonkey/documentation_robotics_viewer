import { test, expect } from '@playwright/test';

test.describe('Spec Graph Visibility', () => {
  test('should render nodes with dimensions and visibility', async ({ page }) => {
    // Navigate to Spec Graph view
    await page.goto('/spec/graph');
    
    // Wait for graph to load
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    
    // Get all nodes
    const nodes = page.locator('.react-flow__node');
    const count = await nodes.count();
    console.log(`Found ${count} nodes`);
    expect(count).toBeGreaterThan(0);

    // Check first node for visibility and dimensions
    const firstNode = nodes.first();
    await expect(firstNode).toBeVisible();
    
    const box = await firstNode.boundingBox();
    console.log('First node bounding box:', box);
    
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      // Check if it's roughly within the viewport (allowing for some scrolling/panning)
      // Note: React Flow canvas can be huge, so x/y might be large, but fitView should bring them into view.
    }

    // Check if nodes have opacity style
    const opacity = await firstNode.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    console.log('First node opacity:', opacity);
    expect(opacity).not.toBe('0');

    // Check if nodes are hidden
    const isHidden = await firstNode.getAttribute('hidden');
    console.log('First node hidden attr:', isHidden);
    expect(isHidden).toBeNull(); // Should not be hidden
  });

  test('should have valid layout positions', async ({ page }) => {
    await page.goto('/spec/graph');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    // Check transform style of a few nodes to ensure they aren't all at (0,0)
    const nodes = page.locator('.react-flow__node');
    const count = await nodes.count();
    
    const positions = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      const transform = await nodes.nth(i).evaluate((el) => {
        return el.style.transform;
      });
      positions.push(transform);
    }
    console.log('Node transforms:', positions);

    // Check if they are different (simple check for layout working)
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBeGreaterThan(1);
  });
});
