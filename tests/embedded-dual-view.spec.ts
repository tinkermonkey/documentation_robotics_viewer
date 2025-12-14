/**
 * E2E Tests for Dual-View URL Routing
 * Tests spec and changeset URL routing and redirects
 *
 * Note: Tests for ViewTabSwitcher visibility and tab switching require the
 * reference server to be running because the UI only shows tabs after data loads.
 * Those tests are covered in embedded-app.spec.ts when run with:
 *   npm run test:embedded (uses playwright.embedded.config.ts)
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

test.describe('Embedded App - Dual View URL Routing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 10000 });
  });

  test.describe('URL-based Navigation', () => {
    test('should redirect /spec to /spec/graph by default', async ({ page }) => {
      await page.goto('/spec');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/spec\/graph/);
    });

    test('should redirect /changesets to /changesets/graph by default', async ({ page }) => {
      await page.goto('/changesets');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/changesets\/graph/);
    });

    test('should redirect /model to /model/graph by default', async ({ page }) => {
      await page.goto('/model');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/model\/graph/);
    });

    test('should load /spec/json route directly', async ({ page }) => {
      await page.goto('/spec/json');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should stay on JSON view
      await expect(page).toHaveURL(/\/spec\/json/);
    });

    test('should load /changesets/list route directly', async ({ page }) => {
      await page.goto('/changesets/list');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should stay on list view
      await expect(page).toHaveURL(/\/changesets\/list/);
    });

    test('should load /model/json route directly', async ({ page }) => {
      await page.goto('/model/json');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should stay on JSON view
      await expect(page).toHaveURL(/\/model\/json/);
    });
  });

  test.describe('App Structure', () => {
    test('should have header with title', async ({ page }) => {
      // Already on / from beforeEach
      await expect(page.locator('.embedded-header h1')).toContainText('Documentation Robotics Viewer');
    });

    test('should have mode selector with all modes', async ({ page }) => {
      const modeSelector = page.locator('.mode-selector');
      await expect(modeSelector).toBeVisible();

      // Check for all mode buttons
      await expect(page.locator('.mode-selector button:has-text("Spec")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Model")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Motivation")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Architecture")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Changesets")')).toBeVisible();
    });

    test('should have connection status indicator', async ({ page }) => {
      // Connection status should exist (may show connecting, connected, or disconnected)
      await expect(page.locator('div.connection-status')).toBeVisible();
    });
  });

  test.describe('Spec Dual View', () => {
    test('should show tab switcher in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');

      // Wait for navigation to complete and tab switcher to appear
      await page.waitForSelector('.view-tab-switcher, [role="tablist"]', { timeout: 10000 });

      // Check for tab switcher or tabs
      const hasTabSwitcher = await page.locator('.view-tab-switcher').isVisible();
      const hasTabs = await page.locator('[role="tablist"]').isVisible();
      expect(hasTabSwitcher || hasTabs).toBeTruthy();

      // Check for Graph and List tabs
      await expect(page.locator('[role="tab"]:has-text("Graph")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("List")')).toBeVisible();
    });

    test('should default to Graph view in spec mode', async ({ page }) => {
      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');

      // Wait for navigation and view to render
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Graph tab should be active by default (router redirects /spec to /spec/graph)
      const graphTab = page.locator('[role="tab"]:has-text("Graph")');
      await expect(graphTab).toHaveAttribute('aria-selected', 'true');

      // GraphViewer should be visible
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
    });

    test('should switch to graph view when Graph tab clicked', async ({ page }) => {
      // Switch to Spec mode (defaults to graph)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher, [role="tablist"]', { timeout: 10000 });

      // First switch to JSON view
      await page.click('[role="tab"]:has-text("JSON")');
      await page.waitForSelector('.spec-viewer', { timeout: 5000 });

      // Now switch back to Graph view
      await page.click('[role="tab"]:has-text("Graph")');
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Graph tab should be active
      const graphTab = page.locator('[role="tab"]:has-text("Graph")');
      await expect(graphTab).toHaveAttribute('aria-selected', 'true');

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
      await expect(page.locator('[role="tab"]:has-text("Graph")')).toHaveAttribute('aria-selected', 'true');

      // Switch to Model mode
      await page.click('.mode-selector button:has-text("Model")');
      await page.waitForTimeout(1000);

      // Switch back to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Graph tab should still be active (preference persisted)
      const graphTab = page.locator('[role="tab"]:has-text("Graph")');
      await expect(graphTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch back to JSON view', async ({ page }) => {
      // Switch to Spec mode (defaults to graph)
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // Verify we're in graph view
      await expect(page.locator('[role="tab"]:has-text("Graph")')).toHaveAttribute('aria-selected', 'true');

      // Switch to JSON
      await page.click('[role="tab"]:has-text("JSON")');
      await page.waitForSelector('.spec-viewer', { timeout: 10000 });

      // JSON tab should be active
      const jsonTab = page.locator('[role="tab"]:has-text("JSON")');
      await expect(jsonTab).toHaveAttribute('aria-selected', 'true');

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
      await expect(page.locator('[role="tab"]:has-text("Graph")')).toBeVisible();
      await expect(page.locator('[role="tab"]:has-text("List")')).toBeVisible();
    });

    test('should default to Graph view in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('.mode-selector button:has-text("Changesets")');
      await page.waitForSelector('.changeset-list', { timeout: 10000 });

      // Graph tab should be active by default (router redirects /changesets to /changesets/graph)
      const graphTab = page.locator('[role="tab"]:has-text("Graph")');
      await expect(graphTab).toHaveAttribute('aria-selected', 'true');
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
      await page.click('[role="tab"]:has-text("JSON")');
      await page.waitForSelector('.spec-viewer', { timeout: 10000 });

      // Reload page
      await page.reload();
      await page.waitForSelector('.embedded-app', { timeout: 20000 });
      await page.waitForSelector('.connection-status.connected', { timeout: 20000 });

      // Switch to Spec mode
      await page.click('.mode-selector button:has-text("Spec")');
      await page.waitForSelector('.view-tab-switcher', { timeout: 10000 });

      // JSON tab should still be active (preference persisted)
      const jsonTab = page.locator('[role="tab"]:has-text("JSON")');
      await expect(jsonTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});
