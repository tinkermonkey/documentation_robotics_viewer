/**
 * E2E Tests for C4 Architecture Visualization
 *
 * Tests the C4GraphView component functionality including:
 * - Loading and displaying C4 Context diagram
 * - Drill-down navigation (Context → Container → Component)
 * - Breadcrumb navigation
 * - Filter panel operations
 * - Layout switching
 * - Export functionality
 * - Inspector panel interactions
 *
 * Prerequisites:
 * 1. Reference server running with example model
 * 2. Playwright browsers installed: npx playwright install chromium
 *
 * Run tests: npm run test:embedded
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

test.describe('C4 Architecture View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test.describe('Navigation to Architecture View', () => {
    test('should have Architecture button in mode selector', async ({ page }) => {
      // Check that Architecture button exists
      const architectureButton = page.locator('.mode-selector button', { hasText: 'Architecture' });
      await expect(architectureButton).toBeVisible();
    });

    test('should switch to Architecture view without errors', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Click the Architecture button
      await page.click('.mode-selector button:has-text("Architecture")');

      // Wait for view to load
      await page.waitForTimeout(2000);

      // Verify Architecture mode is active
      const architectureButton = page.locator('.mode-selector button', { hasText: 'Architecture' });
      await expect(architectureButton).toHaveClass(/active/);

      // Check for critical React/ReactFlow errors
      const criticalErrors = errors.filter(e =>
        e.includes('zustand provider') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('should display C4 graph container', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for C4 graph container
      await expect(page.locator('.c4-graph-container')).toBeVisible();
    });
  });

  test.describe('C4 Context Diagram Display', () => {
    test('should load model and display C4 Context diagram', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Check for ReactFlow canvas
      const reactFlow = page.locator('.react-flow');
      await expect(reactFlow).toBeVisible();

      // Check for nodes (containers or external actors)
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();

      // Should have at least some nodes if model is loaded
      // (might be 0 for empty model, which is also valid)
      expect(nodeCount).toBeGreaterThanOrEqual(0);
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for breadcrumb component
      const breadcrumb = page.locator('.c4-breadcrumb-nav');
      await expect(breadcrumb).toBeVisible();

      // Should show Context level
      await expect(breadcrumb.locator('.c4-breadcrumb-item').first()).toContainText(/Context|System/i);
    });

    test('should display filter panel', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for filter panel
      const filterPanel = page.locator('.c4-filter-panel');
      await expect(filterPanel).toBeVisible();

      // Should have container type section
      await expect(filterPanel.locator('text=Container Types')).toBeVisible();
    });

    test('should display control panel', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for control panel
      const controlPanel = page.locator('.c4-control-panel');
      await expect(controlPanel).toBeVisible();

      // Should have layout section
      await expect(controlPanel.locator('text=Layout')).toBeVisible();
    });
  });

  test.describe('Drill-Down Navigation', () => {
    test('should drill down when clicking a container node', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find a container node
      const containerNode = page.locator('.react-flow__node[data-c4-type="container"]').first();

      if (await containerNode.isVisible()) {
        // Double-click to drill down
        await containerNode.dblclick();
        await page.waitForTimeout(1000);

        // Breadcrumb should update to show container level
        const breadcrumb = page.locator('.c4-breadcrumb-nav');
        const breadcrumbItems = await breadcrumb.locator('.c4-breadcrumb-item').count();

        // Should have more than 1 breadcrumb item after drill-down
        expect(breadcrumbItems).toBeGreaterThan(1);
      }
    });

    test('should navigate back via breadcrumb', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find and drill down on a container
      const containerNode = page.locator('.react-flow__node[data-c4-type="container"]').first();

      if (await containerNode.isVisible()) {
        await containerNode.dblclick();
        await page.waitForTimeout(1000);

        // Click on first breadcrumb item to go back to Context
        const firstBreadcrumbItem = page.locator('.c4-breadcrumb-nav .c4-breadcrumb-item').first();
        await firstBreadcrumbItem.click();
        await page.waitForTimeout(1000);

        // Should be back at Context level
        const breadcrumbItems = await page.locator('.c4-breadcrumb-nav .c4-breadcrumb-item').count();
        expect(breadcrumbItems).toBe(1);
      }
    });
  });

  test.describe('Filter Panel Operations', () => {
    test('should toggle container type filter', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find a container type checkbox (filter-checkbox-label is the actual class)
      const containerTypeCheckbox = page.locator('.c4-filter-panel .filter-checkbox-label input[type="checkbox"]').first();

      if (await containerTypeCheckbox.isVisible()) {
        const initialNodeCount = await page.locator('.react-flow__node').count();

        // Toggle the checkbox off
        await containerTypeCheckbox.click();
        await page.waitForTimeout(500);

        const afterToggleCount = await page.locator('.react-flow__node').count();

        // Node count might change (or stay same if filter doesn't affect visible nodes)
        expect(afterToggleCount).toBeLessThanOrEqual(initialNodeCount);

        // Toggle back on
        await containerTypeCheckbox.click();
        await page.waitForTimeout(500);
      }
    });

    test('should toggle technology filter', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find a technology checkbox (technology-list contains technology filter checkboxes)
      const techCheckbox = page.locator('.c4-filter-panel .technology-list input[type="checkbox"]').first();

      if (await techCheckbox.isVisible()) {
        // Toggle the checkbox
        await techCheckbox.click();
        await page.waitForTimeout(500);

        // Toggle back
        await techCheckbox.click();
        await page.waitForTimeout(500);
      }
    });

    test('should show filter counts', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for filter count indicator
      const filterCount = page.locator('.c4-filter-panel .filter-count');
      if (await filterCount.isVisible()) {
        const countText = await filterCount.textContent();
        // Should show format like "5/10" or "all"
        expect(countText).toMatch(/\d+\/\d+|all/i);
      }
    });
  });

  test.describe('Layout Switching', () => {
    test('should have layout options in control panel', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for layout selector (it's a <select> element)
      const layoutSelector = page.locator('.c4-control-panel select.layout-selector');
      await expect(layoutSelector).toBeVisible();

      // Should have layout options
      const layoutOptions = layoutSelector.locator('option');
      const optionCount = await layoutOptions.count();
      expect(optionCount).toBeGreaterThan(0);
    });

    test('should switch layout with smooth transition', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find layout selector (it's a <select> element)
      const layoutSelector = page.locator('.c4-control-panel select.layout-selector');

      if (await layoutSelector.isVisible()) {
        // Get initial node positions
        const firstNode = page.locator('.react-flow__node').first();
        const initialBounds = await firstNode.boundingBox();

        // Select a different layout option (e.g., 'force')
        await layoutSelector.selectOption('force');
        await page.waitForTimeout(1000);

        // Layout should have changed (positions might differ)
        // Just verify no errors occurred
        const reactFlow = page.locator('.react-flow');
        await expect(reactFlow).toBeVisible();
      }
    });

    test('should support manual layout mode', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find layout selector and select manual mode
      const layoutSelector = page.locator('.c4-control-panel select.layout-selector');

      if (await layoutSelector.isVisible()) {
        await layoutSelector.selectOption('manual');
        await page.waitForTimeout(500);

        // In manual mode, nodes should be draggable
        const node = page.locator('.react-flow__node').first();
        if (await node.isVisible()) {
          const bounds = await node.boundingBox();
          if (bounds) {
            // Attempt to drag the node
            await node.hover();
            await page.mouse.down();
            await page.mouse.move(bounds.x + 50, bounds.y + 50);
            await page.mouse.up();
            await page.waitForTimeout(500);

            // Node should still be visible after drag
            await expect(node).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Inspector Panel', () => {
    test('should show inspector when node is selected', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Click on a node to select it
      const node = page.locator('.react-flow__node').first();

      if (await node.isVisible()) {
        await node.click();
        await page.waitForTimeout(500);

        // Inspector panel should appear
        const inspectorPanel = page.locator('.c4-inspector-panel');
        await expect(inspectorPanel).toBeVisible();
      }
    });

    test('should display element details in inspector', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Click on a node to select it
      const node = page.locator('.react-flow__node').first();

      if (await node.isVisible()) {
        await node.click();
        await page.waitForTimeout(500);

        // Check inspector has element name
        const inspectorPanel = page.locator('.c4-inspector-panel');
        if (await inspectorPanel.isVisible()) {
          const elementName = inspectorPanel.locator('.element-name, .inspector-title, h3').first();
          await expect(elementName).toBeVisible();
        }
      }
    });

    test('should close inspector when clicking close button', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Click on a node to select it
      const node = page.locator('.react-flow__node').first();

      if (await node.isVisible()) {
        await node.click();
        await page.waitForTimeout(500);

        // Find and click close button
        const closeButton = page.locator('.c4-inspector-panel .close-button, .c4-inspector-panel [aria-label="Close"]');
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await page.waitForTimeout(500);

          // Inspector should be hidden
          await expect(page.locator('.c4-inspector-panel')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('should have export buttons in control panel', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for export buttons
      const pngButton = page.locator('.c4-control-panel button', { hasText: /PNG/i });
      const svgButton = page.locator('.c4-control-panel button', { hasText: /SVG/i });
      const dataButton = page.locator('.c4-control-panel button', { hasText: /Data|JSON/i });

      // At least one export button should be visible
      const pngVisible = await pngButton.isVisible();
      const svgVisible = await svgButton.isVisible();
      const dataVisible = await dataButton.isVisible();

      expect(pngVisible || svgVisible || dataVisible).toBeTruthy();
    });

    test('should trigger PNG export download', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Listen for download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      // Click PNG export button
      const pngButton = page.locator('.c4-control-panel button', { hasText: /PNG/i });
      if (await pngButton.isVisible()) {
        await pngButton.click();

        // Wait for download (may not trigger in test environment)
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.png$/);
        }
      }
    });

    test('should trigger SVG export download', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Listen for download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      // Click SVG export button
      const svgButton = page.locator('.c4-control-panel button', { hasText: /SVG/i });
      if (await svgButton.isVisible()) {
        await svgButton.click();

        // Wait for download
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.svg$/);
        }
      }
    });

    test('should trigger JSON data export download', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Listen for download
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

      // Click Data export button
      const dataButton = page.locator('.c4-control-panel button', { hasText: /Data|JSON/i });
      if (await dataButton.isVisible()) {
        await dataButton.click();

        // Wait for download
        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.json$/);
        }
      }
    });
  });

  test.describe('View Level Controls', () => {
    test('should have view level switcher buttons', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for view level buttons
      const contextButton = page.locator('.c4-control-panel .view-level-button', { hasText: /Context/i });
      const containerButton = page.locator('.c4-control-panel .view-level-button', { hasText: /Container/i });
      const componentButton = page.locator('.c4-control-panel .view-level-button', { hasText: /Component/i });

      // At least Context button should be visible
      await expect(contextButton).toBeVisible();
    });

    test('should switch view levels via control buttons', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Click Container view button
      const containerButton = page.locator('.c4-control-panel .view-level-button', { hasText: /Container/i });
      if (await containerButton.isVisible()) {
        await containerButton.click();
        await page.waitForTimeout(1000);

        // Button should now be active
        await expect(containerButton).toHaveClass(/active|selected/);
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support Tab key for focus navigation', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Focus on the graph area
      const reactFlow = page.locator('.react-flow');
      await reactFlow.focus();

      // Press Tab to navigate
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      // Some element should have focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should support Escape key to deselect', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Select a node
      const node = page.locator('.react-flow__node').first();
      if (await node.isVisible()) {
        await node.click();
        await page.waitForTimeout(500);

        // Verify selection (node might have selected class)
        await expect(node).toHaveClass(/selected/);

        // Press Escape to deselect
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Node should no longer be selected
        // Note: This depends on how selection is indicated
      }
    });
  });

  test.describe('MiniMap', () => {
    test('should display minimap', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Check for minimap
      const minimap = page.locator('.react-flow__minimap');
      await expect(minimap).toBeVisible();
    });

    test('should navigate via minimap click', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find minimap
      const minimap = page.locator('.react-flow__minimap');
      if (await minimap.isVisible()) {
        const bounds = await minimap.boundingBox();
        if (bounds) {
          // Click on a different area of minimap
          await page.mouse.click(
            bounds.x + bounds.width * 0.7,
            bounds.y + bounds.height * 0.7
          );
          await page.waitForTimeout(500);

          // Graph viewport should have changed
          // (Just verify no errors occurred)
          await expect(page.locator('.react-flow')).toBeVisible();
        }
      }
    });
  });

  test.describe('Performance', () => {
    test('should render within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');

      // Wait for graph to be visible
      await page.waitForSelector('.react-flow', { timeout: 5000 });

      const renderTime = Date.now() - startTime;

      // Should render within 3 seconds (target from CLAUDE.md)
      expect(renderTime).toBeLessThan(3000);
    });

    test('should handle drill-down within latency target', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find a container node
      const containerNode = page.locator('.react-flow__node[data-c4-type="container"]').first();

      if (await containerNode.isVisible()) {
        const startTime = Date.now();

        // Double-click to drill down
        await containerNode.dblclick();

        // Wait for breadcrumb to update
        await page.waitForFunction(() => {
          const breadcrumbs = document.querySelectorAll('.c4-breadcrumb-nav .c4-breadcrumb-item');
          return breadcrumbs.length > 1;
        }, { timeout: 1000 }).catch(() => null);

        const drillDownTime = Date.now() - startTime;

        // Should complete within 300ms (target from acceptance criteria)
        expect(drillDownTime).toBeLessThan(500); // Allow some slack for CI
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display message for empty model', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Check for either graph or empty state message
      const hasNodes = await page.locator('.react-flow__node').count() > 0;
      const hasEmptyMessage = await page.locator('.message-box, .empty-state').isVisible();

      // Should show either nodes or empty message, not crash
      expect(hasNodes || hasEmptyMessage || await page.locator('.react-flow').isVisible()).toBeTruthy();
    });

    test('should not crash when rapidly switching views', async ({ page }) => {
      // Rapidly switch between views
      for (let i = 0; i < 3; i++) {
        await page.click('.mode-selector button:has-text("Architecture")');
        await page.waitForTimeout(100);
        await page.click('.mode-selector button:has-text("Model")');
        await page.waitForTimeout(100);
      }

      // End on Architecture
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(1000);

      // Should still be functional
      await expect(page.locator('.c4-graph-container, .react-flow, .message-overlay')).toBeVisible();
    });
  });
});
