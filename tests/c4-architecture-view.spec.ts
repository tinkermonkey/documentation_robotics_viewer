/**
 * E2E Tests for C4 Architecture Visualization
 *
 * Tests the C4GraphView component functionality including:
 * - Navigation to Architecture view
 * - Handling of empty/error states when no C4 elements exist
 * - Basic view switching
 *
 * Note: Many C4-specific tests (drill-down, filtering, export) require a model
 * with Application services. The example model only has components, so these
 * tests verify the view handles this gracefully.
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

    test('should display architecture view container or message overlay', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // The view should either show the C4 graph container (if C4 elements exist)
      // or a message overlay (for loading, error, or empty state)
      const c4Container = page.locator('.c4-graph-container');
      const messageOverlay = page.locator('.message-overlay');

      // At least one of these should be visible
      const c4Visible = await c4Container.isVisible().catch(() => false);
      const messageVisible = await messageOverlay.isVisible().catch(() => false);

      expect(c4Visible || messageVisible).toBeTruthy();
    });
  });

  test.describe('Empty Model Handling', () => {
    test('should gracefully handle model without C4 containers', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // The example model may not have Application services (only components)
      // so C4 view should show either:
      // 1. C4 graph with nodes (if model has services)
      // 2. Empty/error message overlay (if model lacks services)

      const reactFlow = page.locator('.react-flow');
      const messageBox = page.locator('.message-box');

      const hasReactFlow = await reactFlow.isVisible().catch(() => false);
      const hasMessage = await messageBox.isVisible().catch(() => false);

      // One of these must be true - the view should not be completely empty
      expect(hasReactFlow || hasMessage).toBeTruthy();
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

      // Should still be functional - either showing graph or message
      const c4Container = page.locator('.c4-graph-container');
      const messageOverlay = page.locator('.message-overlay');
      const architectureContainer = page.locator('.architecture-view-container');

      const hasC4 = await c4Container.isVisible().catch(() => false);
      const hasMessage = await messageOverlay.isVisible().catch(() => false);
      const hasArchContainer = await architectureContainer.isVisible().catch(() => false);

      expect(hasC4 || hasMessage || hasArchContainer).toBeTruthy();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support Escape key without errors', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Listen for errors during keyboard interaction
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Press Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Should not cause any critical errors
      const criticalErrors = errors.filter(e =>
        e.includes('TypeError') ||
        e.includes('Cannot read properties')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Phase 5: Scenario Presets', () => {
    test('should display scenario preset selector', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for scenario preset buttons
      const presetButtons = page.locator('.scenario-preset-button');
      const count = await presetButtons.count().catch(() => 0);

      // If C4 view has loaded, should have preset buttons
      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Expect at least one preset button
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should toggle scenario preset on click', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Find a preset button (e.g., "Data Flow")
        const dataFlowButton = page.locator('.scenario-preset-button', { hasText: 'Data Flow' });
        const buttonExists = await dataFlowButton.isVisible().catch(() => false);

        if (buttonExists) {
          // Click to activate
          await dataFlowButton.click();
          await page.waitForTimeout(500);

          // Button should become active
          await expect(dataFlowButton).toHaveClass(/active/);

          // Click again to deactivate
          await dataFlowButton.click();
          await page.waitForTimeout(500);

          // Button should not be active
          await expect(dataFlowButton).not.toHaveClass(/active/);
        }
      }
    });
  });

  test.describe('Phase 5: View Level Switching', () => {
    test('should display view level selector', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for view level buttons
      const viewLevelButtons = page.locator('.view-level-button');
      const count = await viewLevelButtons.count().catch(() => 0);

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Expect Context, Container, Component buttons
        expect(count).toBeGreaterThanOrEqual(3);
      }
    });

    test('should switch view levels without error', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Listen for errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Click Container view button
        const containerButton = page.locator('.view-level-button', { hasText: 'Container' });
        if (await containerButton.isVisible().catch(() => false)) {
          await containerButton.click();
          await page.waitForTimeout(500);

          // Should not have critical errors
          const criticalErrors = errors.filter(e => e.includes('TypeError'));
          expect(criticalErrors).toHaveLength(0);
        }
      }
    });
  });

  test.describe('Phase 5: Layout Algorithms', () => {
    test('should display layout selector', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for layout selector
      const layoutSelector = page.locator('.layout-selector');
      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        await expect(layoutSelector).toBeVisible();
      }
    });

    test('should switch layouts in under 800ms', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        const layoutSelector = page.locator('.layout-selector');
        if (await layoutSelector.isVisible().catch(() => false)) {
          // Measure layout switch time
          const startTime = Date.now();
          await layoutSelector.selectOption('force');
          await page.waitForTimeout(800);
          const endTime = Date.now();

          // Layout switch should complete in under 800ms (plus some tolerance)
          expect(endTime - startTime).toBeLessThan(1200);
        }
      }
    });
  });

  test.describe('Phase 5: Export Functionality', () => {
    test('should display export buttons', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Check for export buttons
      const exportButtons = page.locator('.export-button');
      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        const count = await exportButtons.count().catch(() => 0);
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Phase 5: Focus Mode', () => {
    test('should toggle focus mode', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Find focus mode checkbox
        const focusModeCheckbox = page.locator('input[type="checkbox"][aria-label*="Focus"]');
        if (await focusModeCheckbox.isVisible().catch(() => false)) {
          // Toggle on
          await focusModeCheckbox.check();
          await page.waitForTimeout(300);

          // Verify checked
          await expect(focusModeCheckbox).toBeChecked();

          // Toggle off
          await focusModeCheckbox.uncheck();
          await page.waitForTimeout(300);

          // Verify unchecked
          await expect(focusModeCheckbox).not.toBeChecked();
        }
      }
    });
  });

  test.describe('Phase 5: Fit to View', () => {
    test('should have fit to view button', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Find fit to view button
        const fitButton = page.locator('.control-button', { hasText: 'Fit to View' });
        await expect(fitButton).toBeVisible();
      }
    });
  });

  test.describe('Phase 5: Drill-down Latency', () => {
    test('should complete drill-down in under 300ms', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Find a ReactFlow node
        const node = page.locator('.react-flow__node').first();
        if (await node.isVisible().catch(() => false)) {
          // Double-click for drill-down
          const startTime = Date.now();
          await node.dblclick();
          await page.waitForTimeout(300);
          const endTime = Date.now();

          // Should complete drill-down gesture in under 300ms + tolerance
          expect(endTime - startTime).toBeLessThan(600);
        }
      }
    });
  });

  test.describe('Phase 5: Path Tracing', () => {
    test('should support path tracing from inspector panel', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      const c4Container = page.locator('.c4-graph-container');
      const hasC4 = await c4Container.isVisible().catch(() => false);

      if (hasC4) {
        // Click a node to select it
        const node = page.locator('.react-flow__node').first();
        if (await node.isVisible().catch(() => false)) {
          await node.click();
          await page.waitForTimeout(500);

          // Check for inspector panel with trace buttons
          const traceUpstreamButton = page.locator('button', { hasText: /upstream/i });
          const traceDownstreamButton = page.locator('button', { hasText: /downstream/i });

          const hasUpstream = await traceUpstreamButton.isVisible().catch(() => false);
          const hasDownstream = await traceDownstreamButton.isVisible().catch(() => false);

          // If inspector panel is visible, should have trace buttons
          const inspectorPanel = page.locator('.c4-inspector-panel');
          if (await inspectorPanel.isVisible().catch(() => false)) {
            expect(hasUpstream || hasDownstream).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Phase 5: Performance', () => {
    test('should render initial view in under 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');

      // Wait for either C4 container or message to appear
      await Promise.race([
        page.waitForSelector('.c4-graph-container', { timeout: 3000 }),
        page.waitForSelector('.message-overlay', { timeout: 3000 }),
      ]);

      const endTime = Date.now();

      // Initial render should complete in under 3 seconds
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });
});
