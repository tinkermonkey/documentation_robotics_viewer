/**
 * E2E tests for Business Layer cross-layer integration
 * Tests expansion/collapse, cross-layer edges, and navigation features
 */

import { test, expect } from '@playwright/test';

test.describe('Business Layer Cross-Layer Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to business layer view
    await page.goto('/embedded?view=business');

    // Wait for the graph to load
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test('should display expand/collapse buttons on processes with subprocesses', async ({ page }) => {
    // Find a business process node with subprocesses
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    await expect(processNode).toBeVisible();

    // Check if expand/collapse button exists (if node has subprocesses)
    const expandButton = processNode.locator('button[aria-label*="Expand"]');
    const hasSubprocesses = await expandButton.count() > 0;

    if (hasSubprocesses) {
      await expect(expandButton).toBeVisible();
      await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('should expand node and show subprocess list when expand button is clicked', async ({ page }) => {
    // Find a process node with subprocesses
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    const expandButton = processNode.locator('button[aria-label*="Expand"]');

    const hasExpandButton = await expandButton.count() > 0;
    if (!hasExpandButton) {
      test.skip(); // Skip if no processes have subprocesses in test data
    }

    // Click expand button
    await expandButton.click();

    // Wait for expansion animation
    await page.waitForTimeout(250);

    // Check that button changed to collapse
    await expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    await expect(expandButton).toHaveText('−');

    // Check that subprocess list is visible
    const subprocessList = processNode.locator('.subprocess-list, div:has-text("Subprocesses")');
    await expect(subprocessList).toBeVisible();
  });

  test('should collapse node when collapse button is clicked', async ({ page }) => {
    // Find and expand a process node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    const expandButton = processNode.locator('button[aria-label*="Expand"]');

    const hasExpandButton = await expandButton.count() > 0;
    if (!hasExpandButton) {
      test.skip();
    }

    // Expand
    await expandButton.click();
    await page.waitForTimeout(250);

    // Collapse
    await expandButton.click();
    await page.waitForTimeout(250);

    // Check that button shows expand again
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    await expect(expandButton).toHaveText('+');
  });

  test('should render cross-layer edges with dashed style', async ({ page }) => {
    // Check if any cross-layer edges exist
    const crossLayerEdges = page.locator('.react-flow__edge[id^="cross-"]');
    const hasCrossLayerEdges = await crossLayerEdges.count() > 0;

    if (hasCrossLayerEdges) {
      const firstCrossLayerEdge = crossLayerEdges.first();

      // Check that edge has dashed stroke
      const pathElement = firstCrossLayerEdge.locator('path');
      const strokeDasharray = await pathElement.getAttribute('style');
      expect(strokeDasharray).toContain('stroke-dasharray');
    }
  });

  test('should display cross-layer links in inspector panel when node is selected', async ({ page }) => {
    // Click on a process node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    await processNode.click();

    // Wait for inspector panel to update
    await page.waitForTimeout(500);

    // Check if inspector panel is visible
    const inspector = page.locator('.process-inspector-panel');
    await expect(inspector).toBeVisible();

    // Check for cross-layer section (if any links exist)
    const crossLayerSection = inspector.locator('.cross-layer-section');
    const hasCrossLayerLinks = await crossLayerSection.count() > 0;

    if (hasCrossLayerLinks) {
      await expect(crossLayerSection).toBeVisible();

      // Check for layer groups
      const layerGroups = crossLayerSection.locator('.layer-group');
      expect(await layerGroups.count()).toBeGreaterThan(0);
    }
  });

  test('should show "View in" buttons for cross-layer navigation', async ({ page }) => {
    // Click on a process node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    await processNode.click();

    // Wait for inspector panel
    await page.waitForTimeout(500);

    // Check for navigation buttons
    const crossLayerSection = page.locator('.cross-layer-section');
    const hasCrossLayerLinks = await crossLayerSection.count() > 0;

    if (hasCrossLayerLinks) {
      const navigateButtons = crossLayerSection.locator('button.navigate-button');
      expect(await navigateButtons.count()).toBeGreaterThan(0);

      const firstButton = navigateButtons.first();
      await expect(firstButton).toBeVisible();
      await expect(firstButton).toHaveText(/View in/);
    }
  });

  test('should trigger navigation when clicking cross-layer link button', async ({ page }) => {
    // Setup event listener for navigation events
    let navigationTriggered = false;

    page.on('dialog', async (dialog) => {
      // Handle alert that shows navigation message
      expect(dialog.message()).toContain('Navigate to');
      navigationTriggered = true;
      await dialog.accept();
    });

    // Click on a process node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    await processNode.click();
    await page.waitForTimeout(500);

    // Check for navigation buttons
    const crossLayerSection = page.locator('.cross-layer-section');
    const hasCrossLayerLinks = await crossLayerSection.count() > 0;

    if (hasCrossLayerLinks) {
      const navigateButton = crossLayerSection.locator('button.navigate-button').first();
      await navigateButton.click();

      // Wait a bit for event to trigger
      await page.waitForTimeout(500);

      // Navigation should have been triggered (alert shown)
      expect(navigationTriggered).toBe(true);
    } else {
      test.skip(); // Skip if no cross-layer links in test data
    }
  });

  test('should maintain expanded state when panning the graph', async ({ page }) => {
    // Find and expand a process node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    const expandButton = processNode.locator('button[aria-label*="Expand"]');

    const hasExpandButton = await expandButton.count() > 0;
    if (!hasExpandButton) {
      test.skip();
    }

    // Get initial position
    const initialBoundingBox = await processNode.boundingBox();

    // Expand node
    await expandButton.click();
    await page.waitForTimeout(250);

    // Pan the graph
    const canvas = page.locator('.react-flow__pane');
    await canvas.dragTo(canvas, {
      sourcePosition: { x: 400, y: 300 },
      targetPosition: { x: 200, y: 150 },
    });

    // Check that node is still expanded
    await expect(expandButton).toHaveAttribute('aria-expanded', 'true');

    // Subprocess list should still be visible
    const subprocessList = processNode.locator('div:has-text("Subprocesses")');
    await expect(subprocessList).toBeVisible();
  });

  test('should display correct cross-layer edge colors', async ({ page }) => {
    // Define expected colors for each layer
    const layerColors: Record<string, string> = {
      motivation: '#9b59b6',
      application: '#3498db',
      data_model: '#2ecc71',
      security: '#e74c3c',
      api: '#f39c12',
      ux: '#1abc9c',
    };

    // Check cross-layer edges
    const crossLayerEdges = page.locator('.react-flow__edge[id^="cross-"]');
    const edgeCount = await crossLayerEdges.count();

    if (edgeCount > 0) {
      for (let i = 0; i < Math.min(edgeCount, 5); i++) {
        const edge = crossLayerEdges.nth(i);
        const pathElement = edge.locator('path');
        const strokeStyle = await pathElement.getAttribute('style');

        // Check that stroke color matches one of the layer colors
        let hasValidColor = false;
        for (const color of Object.values(layerColors)) {
          if (strokeStyle && strokeStyle.includes(color)) {
            hasValidColor = true;
            break;
          }
        }

        expect(hasValidColor).toBe(true);
      }
    }
  });

  test('should group cross-layer links by target layer in inspector', async ({ page }) => {
    // Click on a process node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    await processNode.click();
    await page.waitForTimeout(500);

    // Check cross-layer section
    const crossLayerSection = page.locator('.cross-layer-section');
    const hasCrossLayerLinks = await crossLayerSection.count() > 0;

    if (hasCrossLayerLinks) {
      // Check for layer groups
      const layerGroups = crossLayerSection.locator('.layer-group');
      const groupCount = await layerGroups.count();

      if (groupCount > 0) {
        // Each group should have a header with layer name
        const firstGroup = layerGroups.first();
        const layerHeader = firstGroup.locator('.layer-header');
        await expect(layerHeader).toBeVisible();

        // Header should have a colored border
        const borderStyle = await layerHeader.getAttribute('style');
        expect(borderStyle).toContain('border-left');
      }
    }
  });

  test('should show count badges for each layer in cross-layer section', async ({ page }) => {
    // Click on a process node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    await processNode.click();
    await page.waitForTimeout(500);

    // Check cross-layer section
    const crossLayerSection = page.locator('.cross-layer-section');
    const hasCrossLayerLinks = await crossLayerSection.count() > 0;

    if (hasCrossLayerLinks) {
      // Check for count badges
      const countBadges = crossLayerSection.locator('.count-badge');
      const badgeCount = await countBadges.count();

      if (badgeCount > 0) {
        const firstBadge = countBadges.first();
        await expect(firstBadge).toBeVisible();

        // Badge should contain a number
        const badgeText = await firstBadge.textContent();
        expect(badgeText).toMatch(/^\d+$/);
      }
    }
  });
});

test.describe('Business Layer Accessibility for Cross-Layer Features', () => {
  test('should have accessible expand/collapse buttons', async ({ page }) => {
    await page.goto('/embedded?view=business');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    const expandButton = processNode.locator('button[aria-label*="Expand"]');

    const hasExpandButton = await expandButton.count() > 0;
    if (!hasExpandButton) {
      test.skip();
    }

    // Check aria-label
    const ariaLabel = await expandButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('subprocesses');

    // Check aria-expanded
    const ariaExpanded = await expandButton.getAttribute('aria-expanded');
    expect(ariaExpanded).toBeTruthy();
    expect(['true', 'false']).toContain(ariaExpanded!);
  });

  test('should have accessible navigation buttons', async ({ page }) => {
    await page.goto('/embedded?view=business');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });

    // Click on a node
    const processNode = page.locator('.react-flow__node[data-id*="process"]').first();
    await processNode.click();
    await page.waitForTimeout(500);

    // Check navigation buttons
    const crossLayerSection = page.locator('.cross-layer-section');
    const hasCrossLayerLinks = await crossLayerSection.count() > 0;

    if (hasCrossLayerLinks) {
      const navigateButtons = crossLayerSection.locator('button.navigate-button');
      const buttonCount = await navigateButtons.count();

      if (buttonCount > 0) {
        const firstButton = navigateButtons.first();

        // Check aria-label
        const ariaLabel = await firstButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toContain('Navigate to');
      }
    }
  });
});
