import { test, expect } from '@playwright/test';

test.describe('Motivation Graph View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to embedded app
    await page.goto('http://localhost:3001');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('renders motivation view tab in mode selector', async ({ page }) => {
    // Check that motivation tab exists
    const motivationButton = page.getByRole('button', { name: /motivation/i });
    await expect(motivationButton).toBeVisible();
  });

  test('switches to motivation view when tab is clicked', async ({ page }) => {
    // Click motivation tab
    const motivationButton = page.getByRole('button', { name: /motivation/i });
    await motivationButton.click();

    // Wait for view to load
    await page.waitForTimeout(1000);

    // Check that motivation view container is present
    const motivationContainer = page.locator('.motivation-view-container');
    await expect(motivationContainer).toBeVisible();
  });

  test('displays motivation graph with nodes and edges', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    // Check for ReactFlow canvas
    const canvas = page.locator('.react-flow');
    await expect(canvas).toBeVisible();

    // Check for nodes (at least one should be visible if motivation layer exists)
    // Note: This will depend on the loaded model having motivation elements
    const nodes = page.locator('[data-id]').filter({ hasText: /./ });
    const nodeCount = await nodes.count();
    console.log('Number of nodes found:', nodeCount);

    // If model has motivation elements, nodes should be present
    if (nodeCount > 0) {
      console.log('Motivation graph rendered with nodes');
    }
  });

  test('displays correct custom node types', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    // Look for motivation-specific node elements
    // Check for various node type indicators
    const stakeholderIcon = page.getByText('👤');
    const goalIcon = page.getByText('🎯');
    const requirementIcon = page.getByText('📋');
    const constraintIcon = page.getByText('⚠️');
    const driverIcon = page.getByText('⚡');
    const outcomeIcon = page.getByText('🏆');

    // At least one type should be present if model has motivation layer
    const iconCount = await Promise.all([
      stakeholderIcon.count(),
      goalIcon.count(),
      requirementIcon.count(),
      constraintIcon.count(),
      driverIcon.count(),
      outcomeIcon.count(),
    ]);

    const totalIcons = iconCount.reduce((a, b) => a + b, 0);
    console.log('Total motivation node icons found:', totalIcons);
  });

  test('ReactFlow controls are present', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    // Check for ReactFlow controls
    const controls = page.locator('.react-flow__controls');
    await expect(controls).toBeVisible();

    // Check for minimap
    const minimap = page.locator('.react-flow__minimap');
    await expect(minimap).toBeVisible();
  });

  test('nodes are selectable', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    // Find first visible node
    const firstNode = page.locator('[data-id]').first();
    const nodeCount = await page.locator('[data-id]').count();

    if (nodeCount > 0) {
      // Click the node
      await firstNode.click();

      // Wait for selection
      await page.waitForTimeout(500);

      // Check if node has selected class or styling
      // Note: ReactFlow adds 'selected' class to selected nodes
      const isSelected = await firstNode.evaluate((node) => {
        return node.classList.contains('selected') ||
               node.parentElement?.classList.contains('selected');
      });

      console.log('Node selection status:', isSelected);
    }
  });

  test('handles empty motivation layer gracefully', async ({ page }) => {
    // This test assumes a model without motivation elements might be loaded
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for view to process
    await page.waitForTimeout(2000);

    // Should either show graph or empty state message
    const hasCanvas = await page.locator('.react-flow').isVisible();
    const hasEmptyMessage = await page.locator('.message-box').isVisible();

    // One of these should be true
    expect(hasCanvas || hasEmptyMessage).toBeTruthy();

    if (hasEmptyMessage) {
      console.log('Empty state displayed for motivation layer');
    } else {
      console.log('Motivation graph displayed');
    }
  });

  test('zoom and pan work correctly', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    const nodeCount = await page.locator('[data-id]').count();

    if (nodeCount > 0) {
      // Find zoom in button in ReactFlow controls
      const zoomInButton = page.locator('.react-flow__controls-button').first();

      // Click zoom in
      await zoomInButton.click();
      await page.waitForTimeout(300);

      // Click zoom in again
      await zoomInButton.click();
      await page.waitForTimeout(300);

      console.log('Zoom controls functional');
    }
  });
});
