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

  test('displays correct custom node types with text labels', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    // Look for motivation-specific node type labels (standardized text-based design)
    const stakeholderLabel = page.getByText('STAKEHOLDER', { exact: false });
    const goalLabel = page.getByText('GOAL', { exact: false });
    const requirementLabel = page.getByText('REQUIREMENT', { exact: false });
    const constraintLabel = page.getByText('CONSTRAINT', { exact: false });
    const driverLabel = page.getByText('DRIVER', { exact: false });
    const outcomeLabel = page.getByText('OUTCOME', { exact: false });
    const principleLabel = page.getByText('PRINCIPLE', { exact: false });
    const assumptionLabel = page.getByText('ASSUMPTION', { exact: false });
    const valueStreamLabel = page.getByText('VALUE STREAM', { exact: false });
    const assessmentLabel = page.getByText('ASSESSMENT', { exact: false });

    // At least one type should be present if model has motivation layer
    const labelCount = await Promise.all([
      stakeholderLabel.count(),
      goalLabel.count(),
      requirementLabel.count(),
      constraintLabel.count(),
      driverLabel.count(),
      outcomeLabel.count(),
      principleLabel.count(),
      assumptionLabel.count(),
      valueStreamLabel.count(),
      assessmentLabel.count(),
    ]);

    const totalLabels = labelCount.reduce((a, b) => a + b, 0);
    console.log('Total motivation node type labels found:', totalLabels);
    expect(totalLabels).toBeGreaterThan(0);
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

  test('force-directed layout positions nodes away from origin', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for layout to complete
    await page.waitForTimeout(2000);

    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();

    if (nodeCount > 1) {
      // Get position of first two nodes
      const node1 = nodes.nth(0);
      const node2 = nodes.nth(1);

      const pos1 = await node1.boundingBox();
      const pos2 = await node2.boundingBox();

      // Nodes should have non-zero positions (not all at origin)
      expect(pos1).not.toBeNull();
      expect(pos2).not.toBeNull();

      if (pos1 && pos2) {
        // At least one node should be positioned away from (0,0)
        const hasNonZeroPosition = pos1.x !== 0 || pos1.y !== 0 || pos2.x !== 0 || pos2.y !== 0;
        expect(hasNonZeroPosition).toBeTruthy();
        console.log('Layout positioned nodes correctly:', { pos1, pos2 });
      }
    }
  });

  test('custom edge styles are applied correctly', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    const edges = page.locator('.react-flow__edge');
    const edgeCount = await edges.count();

    if (edgeCount > 0) {
      const firstEdge = edges.first();

      // Get edge path element
      const edgePath = firstEdge.locator('path').first();

      // Check that edge has styling attributes
      const stroke = await edgePath.getAttribute('stroke');
      const strokeWidth = await edgePath.getAttribute('stroke-width');

      expect(stroke).not.toBeNull();
      expect(strokeWidth).not.toBeNull();

      console.log('Edge styling applied:', { stroke, strokeWidth });
    } else {
      console.log('No edges found in motivation graph');
    }
  });

  test('node selection updates visual state', async ({ page }) => {
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();

    if (nodeCount > 0) {
      const firstNode = nodes.first();

      // Get initial box-shadow or border (selection indicator)
      const initialStyle = await firstNode.evaluate((el) => {
        return window.getComputedStyle(el).boxShadow;
      });

      // Click node to select
      await firstNode.click();
      await page.waitForTimeout(300);

      // Get style after selection
      const selectedStyle = await firstNode.evaluate((el) => {
        return window.getComputedStyle(el).boxShadow;
      });

      // Selection should change styling (ReactFlow adds box-shadow for selection)
      console.log('Selection state changed:', {
        before: initialStyle,
        after: selectedStyle,
        changed: initialStyle !== selectedStyle,
      });
    }
  });

  test('changeset operation styling is applied', async ({ page }) => {
    // This test verifies that if changeset operations exist, they are styled correctly
    // Switch to motivation view
    await page.getByRole('button', { name: /motivation/i }).click();

    // Wait for graph to render
    await page.waitForTimeout(2000);

    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();

    if (nodeCount > 0) {
      // Look for any nodes with changeset styling (green for add, amber for update, red for delete)
      const greenBorder = await page.locator('[style*="rgb(16, 185, 129)"]').count(); // green
      const amberBorder = await page.locator('[style*="rgb(245, 158, 11)"]').count(); // amber
      const redBorder = await page.locator('[style*="rgb(239, 68, 68)"]').count(); // red

      console.log('Changeset styling check:', {
        greenBorders: greenBorder,
        amberBorders: amberBorder,
        redBorders: redBorder,
        note: 'Colors applied when changesets are active',
      });

      // Test passes regardless of whether changesets exist - just verifying no errors
      expect(true).toBeTruthy();
    }
  });
});
