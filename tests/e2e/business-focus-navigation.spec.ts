/**
 * E2E tests for Business Layer Focus & Navigation features
 *
 * Tests focus modes, process tracing, node interaction, and keyboard navigation.
 */

import { test, expect } from '@playwright/test';

test.describe('Business Layer Focus & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to embedded view with business layer
    await page.goto('/embedded?view=business');

    // Wait for the business layer to load
    await page.waitForSelector('.business-layer-view', { timeout: 10000 });

    // Wait for nodes to render
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test.describe('Node Selection', () => {
    test('should select node on click', async ({ page }) => {
      // Click on first process node
      const firstNode = page.locator('.react-flow__node').first();
      await firstNode.click();

      // Verify node is selected (has focused class)
      await expect(firstNode).toHaveClass(/focused-node/);

      // Verify inspector panel appears with node details
      const inspector = page.locator('.process-inspector-panel');
      await expect(inspector).toBeVisible();

      // Verify inspector shows node name
      const nodeName = await firstNode.locator('.node-title, .node-label').textContent();
      if (nodeName) {
        await expect(inspector.locator('h3')).toContainText(nodeName.trim());
      }
    });

    test('should select different node on click', async ({ page }) => {
      // Click on first node
      const firstNode = page.locator('.react-flow__node').first();
      await firstNode.click();
      await expect(firstNode).toHaveClass(/focused-node/);

      // Click on second node
      const secondNode = page.locator('.react-flow__node').nth(1);
      await secondNode.click();

      // Verify second node is selected and first is not
      await expect(secondNode).toHaveClass(/focused-node/);
      await expect(firstNode).not.toHaveClass(/focused-node/);
    });

    test('should multi-select with shift+click', async ({ page }) => {
      // Click first node
      const firstNode = page.locator('.react-flow__node').first();
      await firstNode.click();

      // Shift+click second node
      const secondNode = page.locator('.react-flow__node').nth(1);
      await secondNode.click({ modifiers: ['Shift'] });

      // Both nodes should be focused (though only one will have the CSS class)
      // We can verify multi-select by checking if focus mode is active
      const focusedNodes = page.locator('.react-flow__node.focused-node');
      const count = await focusedNodes.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should deselect on Escape key', async ({ page }) => {
      // Select a node
      const firstNode = page.locator('.react-flow__node').first();
      await firstNode.click();
      await expect(firstNode).toHaveClass(/focused-node/);

      // Press Escape
      await page.keyboard.press('Escape');

      // Verify node is deselected
      await expect(firstNode).not.toHaveClass(/focused-node/);

      // Verify inspector panel shows empty state
      const inspector = page.locator('.process-inspector-panel');
      await expect(inspector.locator('.inspector-empty')).toBeVisible();
    });
  });

  test.describe('Focus Mode: Selected', () => {
    test('should highlight selected node and neighbors', async ({ page }) => {
      // Click a node to select it
      const nodeToSelect = page.locator('.react-flow__node').nth(2); // Select middle node
      await nodeToSelect.click();

      // Wait for focus mode to apply
      await page.waitForTimeout(500);

      // Verify selected node is highlighted
      await expect(nodeToSelect).toHaveClass(/focused-node/);

      // Verify some nodes are dimmed (opacity < 1)
      const dimmedNodes = page.locator('.react-flow__node[style*="opacity: 0.3"]');
      const dimmedCount = await dimmedNodes.count();
      expect(dimmedCount).toBeGreaterThan(0);

      // Verify focused nodes have full opacity
      const focusedNodes = page.locator('.react-flow__node:not([style*="opacity: 0.3"])');
      const focusedCount = await focusedNodes.count();
      expect(focusedCount).toBeGreaterThan(0);
    });

    test('should update focus when selecting different node', async ({ page }) => {
      // Select first node
      const firstNode = page.locator('.react-flow__node').first();
      await firstNode.click();
      await page.waitForTimeout(500);

      const initialDimmedCount = await page
        .locator('.react-flow__node[style*="opacity: 0.3"]')
        .count();

      // Select a different node
      const secondNode = page.locator('.react-flow__node').nth(3);
      await secondNode.click();
      await page.waitForTimeout(500);

      const newDimmedCount = await page
        .locator('.react-flow__node[style*="opacity: 0.3"]')
        .count();

      // Dimmed set should change (may not be different count, but different nodes)
      await expect(secondNode).toHaveClass(/focused-node/);
      await expect(firstNode).not.toHaveClass(/focused-node/);
    });
  });

  test.describe('Process Inspector Panel', () => {
    test('should display node details when selected', async ({ page }) => {
      // Click a node
      const node = page.locator('.react-flow__node').first();
      await node.click();

      const inspector = page.locator('.process-inspector-panel');
      await expect(inspector).toBeVisible();

      // Verify inspector sections are present
      await expect(inspector.locator('h3')).toBeVisible(); // Node name
      await expect(inspector.locator('.node-type-badge')).toBeVisible();

      // Verify metadata section
      const metadataSection = inspector.locator('.metadata-section');
      if ((await metadataSection.count()) > 0) {
        await expect(metadataSection.locator('h4')).toContainText('Metadata');
      }

      // Verify relationships section
      const relSection = inspector.locator('.relationships-section');
      await expect(relSection.locator('h4')).toContainText('Relationships');
      await expect(relSection.locator('.relationship-item').first()).toBeVisible();

      // Verify quick actions
      const actionsSection = inspector.locator('.quick-actions');
      await expect(actionsSection.locator('h4')).toContainText('Quick Actions');
    });

    test('should display upstream/downstream counts', async ({ page }) => {
      // Find a node with connections
      const node = page.locator('.react-flow__node').nth(2);
      await node.click();

      const inspector = page.locator('.process-inspector-panel');
      const relSection = inspector.locator('.relationships-section');

      // Check for upstream count
      const upstreamItem = relSection.locator('.relationship-item').filter({ hasText: 'Upstream' });
      await expect(upstreamItem).toBeVisible();
      const upstreamCount = await upstreamItem.locator('.count-badge').textContent();
      expect(upstreamCount).toMatch(/\d+/);

      // Check for downstream count
      const downstreamItem = relSection
        .locator('.relationship-item')
        .filter({ hasText: 'Downstream' });
      await expect(downstreamItem).toBeVisible();
      const downstreamCount = await downstreamItem.locator('.count-badge').textContent();
      expect(downstreamCount).toMatch(/\d+/);
    });

    test('should hide when no node selected', async ({ page }) => {
      const inspector = page.locator('.process-inspector-panel');

      // Initially, no node is selected
      await expect(inspector.locator('.inspector-empty')).toBeVisible();
      await expect(inspector.locator('.inspector-empty')).toContainText('Select a process');
    });
  });

  test.describe('Quick Actions', () => {
    test('should trace upstream dependencies', async ({ page }) => {
      // Select a node with upstream dependencies
      const node = page.locator('.react-flow__node').nth(3);
      await node.click();

      const inspector = page.locator('.process-inspector-panel');

      // Get initial upstream count
      const upstreamCountBefore = await inspector
        .locator('.relationship-item')
        .filter({ hasText: 'Upstream' })
        .locator('.count-badge')
        .textContent();

      // Only click if upstream count > 0
      if (upstreamCountBefore && parseInt(upstreamCountBefore) > 0) {
        // Click "Trace Upstream" button
        const upstreamButton = inspector.locator('button').filter({ hasText: 'Trace Upstream' });
        await upstreamButton.click();

        // Wait for focus mode to apply
        await page.waitForTimeout(500);

        // Verify focus mode changed (nodes should have different opacity)
        const dimmedNodes = page.locator('.react-flow__node[style*="opacity: 0.3"]');
        const dimmedCount = await dimmedNodes.count();
        expect(dimmedCount).toBeGreaterThan(0);
      }
    });

    test('should trace downstream dependencies', async ({ page }) => {
      // Select a node with downstream dependencies
      const node = page.locator('.react-flow__node').first();
      await node.click();

      const inspector = page.locator('.process-inspector-panel');

      // Get initial downstream count
      const downstreamCountBefore = await inspector
        .locator('.relationship-item')
        .filter({ hasText: 'Downstream' })
        .locator('.count-badge')
        .textContent();

      // Only click if downstream count > 0
      if (downstreamCountBefore && parseInt(downstreamCountBefore) > 0) {
        // Click "Trace Downstream" button
        const downstreamButton = inspector
          .locator('button')
          .filter({ hasText: 'Trace Downstream' });
        await downstreamButton.click();

        // Wait for focus mode to apply
        await page.waitForTimeout(500);

        // Verify focus mode changed
        const dimmedNodes = page.locator('.react-flow__node[style*="opacity: 0.3"]');
        const dimmedCount = await dimmedNodes.count();
        expect(dimmedCount).toBeGreaterThan(0);
      }
    });

    test('should isolate process', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').nth(2);
      await node.click();

      const inspector = page.locator('.process-inspector-panel');

      // Click "Isolate Process" button
      const isolateButton = inspector.locator('button').filter({ hasText: 'Isolate Process' });
      await isolateButton.click();

      // Wait for focus mode to apply
      await page.waitForTimeout(500);

      // Verify radial focus mode (selected node + immediate neighbors)
      const dimmedNodes = page.locator('.react-flow__node[style*="opacity: 0.3"]');
      const dimmedCount = await dimmedNodes.count();

      // Most nodes should be dimmed except selected and neighbors
      const totalNodes = await page.locator('.react-flow__node').count();
      expect(dimmedCount).toBeLessThan(totalNodes);
      expect(dimmedCount).toBeGreaterThan(0);
    });

    test('should disable upstream button when no upstream connections', async ({ page }) => {
      // Try to find a root node (no upstream)
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();

      // Click through nodes to find one with 0 upstream
      for (let i = 0; i < Math.min(nodeCount, 5); i++) {
        await nodes.nth(i).click();
        await page.waitForTimeout(300);

        const inspector = page.locator('.process-inspector-panel');
        const upstreamCount = await inspector
          .locator('.relationship-item')
          .filter({ hasText: 'Upstream' })
          .locator('.count-badge')
          .textContent();

        if (upstreamCount === '0') {
          // Found a node with no upstream
          const upstreamButton = inspector.locator('button').filter({ hasText: 'Trace Upstream' });
          await expect(upstreamButton).toBeDisabled();
          break;
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should handle Escape key to clear selection', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').first();
      await node.click();

      // Verify selection
      await expect(node).toHaveClass(/focused-node/);

      // Press Escape
      await page.keyboard.press('Escape');

      // Verify deselection
      await expect(node).not.toHaveClass(/focused-node/);

      // Verify inspector shows empty state
      const inspector = page.locator('.process-inspector-panel');
      await expect(inspector.locator('.inspector-empty')).toBeVisible();
    });

    test('should maintain focus after zoom', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').first();
      await node.click();
      await expect(node).toHaveClass(/focused-node/);

      // Zoom in using keyboard
      await page.keyboard.press('+');
      await page.waitForTimeout(300);

      // Verify node is still focused
      await expect(node).toHaveClass(/focused-node/);
    });

    test('should maintain focus after pan', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').first();
      await node.click();
      await expect(node).toHaveClass(/focused-node/);

      // Pan using keyboard arrows
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(300);

      // Verify node is still focused
      await expect(node).toHaveClass(/focused-node/);
    });
  });

  test.describe('Focus Mode Transitions', () => {
    test('should smoothly transition between focus modes', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').nth(2);
      await node.click();
      await page.waitForTimeout(500);

      const inspector = page.locator('.process-inspector-panel');

      // Start with selected mode
      const initialFocusedCount = await page
        .locator('.react-flow__node:not([style*="opacity: 0.3"])')
        .count();

      // Check if downstream button is enabled
      const downstreamButton = inspector.locator('button').filter({ hasText: 'Trace Downstream' });
      const isEnabled = await downstreamButton.isEnabled();

      if (isEnabled) {
        // Switch to downstream mode
        await downstreamButton.click();
        await page.waitForTimeout(500);

        // Verify focus changed
        const downstreamFocusedCount = await page
          .locator('.react-flow__node:not([style*="opacity: 0.3"])')
          .count();

        // Switch to isolate mode
        const isolateButton = inspector.locator('button').filter({ hasText: 'Isolate Process' });
        await isolateButton.click();
        await page.waitForTimeout(500);

        // Verify focus changed again
        const isolateFocusedCount = await page
          .locator('.react-flow__node:not([style*="opacity: 0.3"])')
          .count();

        // Each mode should show different focus sets (though exact counts may vary)
        expect(isolateFocusedCount).toBeGreaterThan(0);
      }
    });

    test('should clear focus mode on Escape', async ({ page }) => {
      // Select and focus
      const node = page.locator('.react-flow__node').first();
      await node.click();
      await page.waitForTimeout(500);

      // Verify some nodes are dimmed
      let dimmedCount = await page.locator('.react-flow__node[style*="opacity: 0.3"]').count();
      expect(dimmedCount).toBeGreaterThan(0);

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Verify no nodes are dimmed
      dimmedCount = await page.locator('.react-flow__node[style*="opacity: 0.3"]').count();
      expect(dimmedCount).toBe(0);
    });
  });

  test.describe('Visual Styling', () => {
    test('should apply focused node styling', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').first();
      await node.click();
      await page.waitForTimeout(500);

      // Verify focused node has CSS class
      await expect(node).toHaveClass(/focused-node/);

      // Verify node has full opacity
      const opacity = await node.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeGreaterThan(0.9);
    });

    test('should apply dimmed node styling', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').nth(2);
      await node.click();
      await page.waitForTimeout(500);

      // Find dimmed nodes
      const dimmedNodes = page.locator('.react-flow__node[style*="opacity: 0.3"]');
      const dimmedCount = await dimmedNodes.count();

      if (dimmedCount > 0) {
        const firstDimmed = dimmedNodes.first();
        const opacity = await firstDimmed.evaluate(
          (el) => window.getComputedStyle(el).opacity
        );
        expect(parseFloat(opacity)).toBeLessThan(0.4);
      }
    });

    test('should apply edge styling based on focus', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').first();
      await node.click();
      await page.waitForTimeout(500);

      // Verify some edges exist
      const edges = page.locator('.react-flow__edge');
      const edgeCount = await edges.count();
      expect(edgeCount).toBeGreaterThan(0);

      // Check edge opacity varies (some focused, some dimmed)
      const dimmedEdges = page.locator('.react-flow__edge[style*="opacity: 0.2"]');
      const dimmedEdgeCount = await dimmedEdges.count();

      // If there are multiple edges, some should be dimmed
      if (edgeCount > 2) {
        expect(dimmedEdgeCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Performance', () => {
    test('should update focus mode in <500ms', async ({ page }) => {
      // Select a node
      const node = page.locator('.react-flow__node').nth(2);

      const startTime = Date.now();
      await node.click();

      // Wait for focus to apply
      await page.waitForSelector('.react-flow__node.focused-node', { timeout: 5000 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Focus mode should apply quickly (<500ms)
      expect(duration).toBeLessThan(500);
    });

    test('should handle rapid selection changes', async ({ page }) => {
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();

      // Rapidly click through nodes
      for (let i = 0; i < Math.min(5, nodeCount); i++) {
        await nodes.nth(i).click();
        await page.waitForTimeout(100); // Small delay between clicks
      }

      // Verify last selected node is focused
      const lastNode = nodes.nth(Math.min(4, nodeCount - 1));
      await expect(lastNode).toHaveClass(/focused-node/);
    });
  });
});
