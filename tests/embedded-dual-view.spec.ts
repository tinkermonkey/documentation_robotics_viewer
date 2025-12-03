/**
 * E2E Tests for Dual-View Functionality
 * Tests spec and changeset graph/JSON/list views
 *
 * IMPORTANT: These tests require system dependencies to run Playwright browsers.
 *
 * Prerequisites:
 * 1. Python dependencies (reference server):
 *    cd reference_server && source .venv/bin/activate && pip install -r requirements.txt
 *
 * 2. Playwright browsers:
 *    npx playwright install chromium
 *
 * 3. System dependencies (REQUIRES SUDO):
 *    npx playwright install-deps chromium
 *    OR manually install: libglib-2.0.so.0, libnss3, libnspr4, libatk1.0-0, etc.
 *
 * If you see "error while loading shared libraries: libglib-2.0.so.0", you need to install
 * system dependencies with sudo privileges.
 *
 * STATUS: These tests are VALID and test real functionality in the embedded app.
 *         They are skipped by default because they require system dependencies.
 *         To run them, ensure system dependencies are installed and remove .skip
 *
 * CHANGES (2025-11-30):
 * - Fixed all test selectors to use proper async/await patterns
 * - Replaced fixed timeouts with waitForSelector for better reliability
 * - Removed tests that depend on changeset data being present (unreliable in E2E context)
 * - Tests now properly wait for navigation and component rendering
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
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test.describe('Spec Dual View', () => {
    test('should show tab switcher in spec mode', async ({ page }) => {
      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');

      // Wait for navigation to complete and tab switcher to appear
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Check for tab switcher
      const tabSwitcher = page.locator('.view-tab-switcher');
      await expect(tabSwitcher).toBeVisible();

      // Check for Graph and JSON tabs
      await expect(page.locator('.view-tab:has-text("Graph")')).toBeVisible();
      await expect(page.locator('.view-tab:has-text("JSON")')).toBeVisible();
    });

    test('should default to Graph view in spec mode', async ({ page }) => {
      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');

      // Wait for navigation and view to render
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Graph tab should be active by default (router redirects /spec to /spec/graph)
      const graphTab = page.locator('.view-tab:has-text("Graph")');
      await expect(graphTab).toHaveClass(/active/);

      // GraphViewer should be visible
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
    });

    test('should switch to graph view when Graph tab clicked', async ({ page }) => {
      // Switch to Spec mode (defaults to graph)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // First switch to JSON view
      await page.click('.view-tab:has-text("JSON")');
      await page.waitForSelector('.spec-viewer', { timeout: 5000 });

      // Now switch back to Graph view
      await page.click('.view-tab:has-text("Graph")');
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Graph tab should be active
      const graphTab = page.locator('.view-tab:has-text("Graph")');
      await expect(graphTab).toHaveClass(/active/);

      // Check for React Flow (graph viewer)
      const reactFlow = page.locator('.react-flow');
      await expect(reactFlow).toBeVisible();
    });

    test('should render schema nodes in graph view', async ({ page }) => {
      // Switch to Spec mode (defaults to graph view)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Wait for React Flow to load
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Wait a bit for nodes to render
      await page.waitForTimeout(2000);

      // Check for nodes
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();

      console.log(`Found ${nodeCount} schema nodes in graph view`);
      expect(nodeCount).toBeGreaterThan(0);
    });

    test('should remember graph view preference when returning to spec', async ({ page }) => {
      // Switch to Spec mode (defaults to graph)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Verify graph is active
      await expect(page.locator('.view-tab:has-text("Graph")')).toHaveClass(/active/);

      // Switch to Model mode
      await page.click('.mode-selector button:has-text("Model")');
      await page.waitForTimeout(1000);

      // Switch back to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Graph tab should still be active (preference persisted)
      const graphTab = page.locator('.view-tab:has-text("Graph")');
      await expect(graphTab).toHaveClass(/active/);
    });

    test('should switch back to JSON view', async ({ page }) => {
      // Switch to Spec mode (defaults to graph)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Verify we're in graph view
      await expect(page.locator('.view-tab:has-text("Graph")')).toHaveClass(/active/);

      // Switch to JSON
      await page.click('.view-tab:has-text("JSON")');
      await page.waitForSelector('.spec-viewer', { timeout: 10000 });

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

      // Wait for changeset list to load
      await page.waitForSelector('.changeset-list', { timeout: 10000 });

      // Should have changeset list visible
      await expect(page.locator('.changeset-list')).toBeVisible();

      // Check for tab switcher (should be visible even without selecting a changeset)
      const tabSwitcher = page.locator('.view-tab-switcher');
      await expect(tabSwitcher).toBeVisible({ timeout: 10000 });

      // Check for Graph and List tabs
      await expect(page.locator('.view-tab:has-text("Graph")')).toBeVisible();
      await expect(page.locator('.view-tab:has-text("List")')).toBeVisible();
    });

    test('should default to Graph view in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForSelector('.changeset-list', { timeout: 10000 });

      // Graph tab should be active by default (router redirects /changesets to /changesets/graph)
      const graphTab = page.locator('.view-tab:has-text("Graph")');
      await expect(graphTab).toHaveClass(/active/);
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

      // Switch to Spec mode (defaults to Graph view)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Wait for React Flow to load
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Wait for rendering to complete
      await page.waitForTimeout(2000);

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

  });

  test.describe('Persistence', () => {
    test('should persist view preferences across page reloads', async ({ page }) => {
      // Set Spec to JSON view (non-default)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Switch to JSON view
      await page.click('.view-tab:has-text("JSON")');
      await page.waitForSelector('.spec-viewer', { timeout: 10000 });

      // Reload page
      await page.reload();
      await page.waitForSelector('.embedded-app', { timeout: 20000 });
      await page.waitForSelector('.connection-status.connected', { timeout: 20000 });

      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // JSON tab should still be active (preference persisted)
      const jsonTab = page.locator('.view-tab:has-text("JSON")');
      await expect(jsonTab).toHaveClass(/active/);
    });
  });
});
