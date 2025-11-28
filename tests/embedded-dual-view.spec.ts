/**
 * E2E Tests for Dual-View Functionality
 * Tests spec and changeset graph/JSON/list views
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(60000);

test.describe('Embedded App - Dual View Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });

    // Navigate to the embedded app
    await page.goto('http://localhost:8765/');

    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test.describe('Spec Dual View', () => {
    test('should show tab switcher in spec mode', async ({ page }) => {
      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(2000);

      // Check for tab switcher
      const tabSwitcher = page.locator('.view-tab-switcher');
      await expect(tabSwitcher).toBeVisible();

      // Check for Graph and JSON tabs
      await expect(page.locator('.view-tab:has-text("Graph")')).toBeVisible();
      await expect(page.locator('.view-tab:has-text("JSON")')).toBeVisible();
    });

    test('should default to JSON view in spec mode', async ({ page }) => {
      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(2000);

      // JSON tab should be active by default
      const jsonTab = page.locator('.view-tab:has-text("JSON")');
      await expect(jsonTab).toHaveClass(/active/);

      // SpecViewer should be visible
      await expect(page.locator('.spec-viewer')).toBeVisible();
    });

    test('should switch to graph view when Graph tab clicked', async ({ page }) => {
      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(2000);

      // Click Graph tab
      await page.click('.view-tab:has-text("Graph")');
      await page.waitForTimeout(2000);

      // Graph tab should be active
      const graphTab = page.locator('.view-tab:has-text("Graph")');
      await expect(graphTab).toHaveClass(/active/);

      // Check for React Flow (graph viewer)
      const reactFlow = page.locator('.react-flow');
      await expect(reactFlow).toBeVisible({ timeout: 5000 });
    });

    test('should render schema nodes in graph view', async ({ page }) => {
      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(2000);

      // Click Graph tab
      await page.click('.view-tab:has-text("Graph")');
      await page.waitForTimeout(3000);

      // Check for nodes
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();

      console.log(`Found ${nodeCount} schema nodes in graph view`);
      expect(nodeCount).toBeGreaterThan(0);
    });

    test('should remember graph view preference when returning to spec', async ({ page }) => {
      // Switch to Spec mode and select Graph view
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(1000);
      await page.click('.view-tab:has-text("Graph")');
      await page.waitForTimeout(1000);

      // Switch to Model mode
      await page.click('.mode-selector button:has-text("Model")');
      await page.waitForTimeout(1000);

      // Switch back to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(1000);

      // Graph tab should still be active
      const graphTab = page.locator('.view-tab:has-text("Graph")');
      await expect(graphTab).toHaveClass(/active/);
    });

    test('should switch back to JSON view', async ({ page }) => {
      // Switch to Spec mode and select Graph view
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(1000);
      await page.click('.view-tab:has-text("Graph")');
      await page.waitForTimeout(1000);

      // Switch back to JSON
      await page.click('.view-tab:has-text("JSON")');
      await page.waitForTimeout(1000);

      // JSON tab should be active
      const jsonTab = page.locator('.view-tab:has-text("JSON")');
      await expect(jsonTab).toHaveClass(/active/);

      // SpecViewer should be visible
      await expect(page.locator('.spec-viewer')).toBeVisible();
    });
  });

  test.describe('Changeset Dual View', () => {
    test('should show tab switcher in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForTimeout(2000);

      // Should have changeset list
      await expect(page.locator('.changeset-list')).toBeVisible();

      // Click a changeset to select it
      const firstChangeset = page.locator('.changeset-item').first();
      if (await firstChangeset.isVisible()) {
        await firstChangeset.click();
        await page.waitForTimeout(1000);

        // Check for tab switcher
        const tabSwitcher = page.locator('.view-tab-switcher');
        await expect(tabSwitcher).toBeVisible();

        // Check for Graph and List tabs
        await expect(page.locator('.view-tab:has-text("Graph")')).toBeVisible();
        await expect(page.locator('.view-tab:has-text("List")')).toBeVisible();
      }
    });

    test('should default to list view in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForTimeout(2000);

      // Click a changeset
      const firstChangeset = page.locator('.changeset-item').first();
      if (await firstChangeset.isVisible()) {
        await firstChangeset.click();
        await page.waitForTimeout(1000);

        // List tab should be active by default
        const listTab = page.locator('.view-tab:has-text("List")');
        await expect(listTab).toHaveClass(/active/);

        // ChangesetViewer should be visible
        await expect(page.locator('.changeset-viewer')).toBeVisible();
      }
    });

    test('should switch to graph view when Graph tab clicked', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForTimeout(2000);

      // Click a changeset
      const firstChangeset = page.locator('.changeset-item').first();
      if (await firstChangeset.isVisible()) {
        await firstChangeset.click();
        await page.waitForTimeout(1000);

        // Click Graph tab
        await page.click('.view-tab:has-text("Graph")');
        await page.waitForTimeout(2000);

        // Graph tab should be active
        const graphTab = page.locator('.view-tab:has-text("Graph")');
        await expect(graphTab).toHaveClass(/active/);

        // Check for changeset graph container
        await expect(page.locator('.changeset-graph-container')).toBeVisible();
      }
    });

    test('should show operation legend in changeset graph', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForTimeout(2000);

      // Click a changeset
      const firstChangeset = page.locator('.changeset-item').first();
      if (await firstChangeset.isVisible()) {
        await firstChangeset.click();
        await page.waitForTimeout(1000);

        // Click Graph tab
        await page.click('.view-tab:has-text("Graph")');
        await page.waitForTimeout(2000);

        // Check for operation legend
        await expect(page.locator('.operation-legend')).toBeVisible();
        await expect(page.locator('.legend-item.add')).toBeVisible();
        await expect(page.locator('.legend-item.update')).toBeVisible();
        await expect(page.locator('.legend-item.delete')).toBeVisible();
      }
    });

    test('should render changeset elements in graph', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForTimeout(2000);

      // Click a changeset
      const firstChangeset = page.locator('.changeset-item').first();
      if (await firstChangeset.isVisible()) {
        await firstChangeset.click();
        await page.waitForTimeout(1000);

        // Click Graph tab
        await page.click('.view-tab:has-text("Graph")');
        await page.waitForTimeout(3000);

        // Check for React Flow and nodes
        const reactFlow = page.locator('.react-flow');
        await expect(reactFlow).toBeVisible({ timeout: 5000 });

        const nodes = page.locator('.react-flow__node');
        const nodeCount = await nodes.count();

        console.log(`Found ${nodeCount} changeset nodes in graph view`);
        expect(nodeCount).toBeGreaterThan(0);
      }
    });

    test('should remember graph view preference for changesets', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForTimeout(2000);

      // Click a changeset and select Graph view
      const firstChangeset = page.locator('.changeset-item').first();
      if (await firstChangeset.isVisible()) {
        await firstChangeset.click();
        await page.waitForTimeout(1000);
        await page.click('.view-tab:has-text("Graph")');
        await page.waitForTimeout(1000);

        // Switch to Model mode
        await page.click('.mode-selector button:has-text("Model")');
        await page.waitForTimeout(1000);

        // Switch back to Changesets mode
        await page.click('.mode-selector button:has-text("Changesets")');
        await page.waitForTimeout(2000);

        // Click the same changeset
        await firstChangeset.click();
        await page.waitForTimeout(1000);

        // Graph tab should still be active
        const graphTab = page.locator('.view-tab:has-text("Graph")');
        await expect(graphTab).toHaveClass(/active/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should not have console errors in spec graph view', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Switch to Spec mode and Graph view
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(1000);
      await page.click('.view-tab:has-text("Graph")');
      await page.waitForTimeout(3000);

      // Check for critical errors
      const criticalErrors = errors.filter(e =>
        e.includes('TypeError') ||
        e.includes('undefined') ||
        e.includes('Cannot read')
      );

      if (criticalErrors.length > 0) {
        console.log('Critical errors found:', criticalErrors);
      }

      expect(criticalErrors).toHaveLength(0);
    });

    test('should not have console errors in changeset graph view', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Switch to Changesets mode and Graph view
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForTimeout(2000);

      const firstChangeset = page.locator('.changeset-item').first();
      if (await firstChangeset.isVisible()) {
        await firstChangeset.click();
        await page.waitForTimeout(1000);
        await page.click('.view-tab:has-text("Graph")');
        await page.waitForTimeout(3000);

        // Check for critical errors
        const criticalErrors = errors.filter(e =>
          e.includes('TypeError') ||
          e.includes('undefined') ||
          e.includes('Cannot read')
        );

        if (criticalErrors.length > 0) {
          console.log('Critical errors found:', criticalErrors);
        }

        expect(criticalErrors).toHaveLength(0);
      }
    });
  });

  test.describe('Persistence', () => {
    test('should persist view preferences across page reloads', async ({ page }) => {
      // Set Spec to Graph view
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(1000);
      await page.click('.view-tab:has-text("Graph")');
      await page.waitForTimeout(1000);

      // Reload page
      await page.reload();
      await page.waitForSelector('.embedded-app', { timeout: 10000 });
      await page.waitForSelector('.connection-status.connected', { timeout: 10000 });

      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForTimeout(1000);

      // Graph tab should still be active
      const graphTab = page.locator('.view-tab:has-text("Graph")');
      await expect(graphTab).toHaveClass(/active/);
    });
  });
});
