/**
 * E2E Tests for Dual-View URL Routing
 * Tests spec and changeset URL routing and redirects
 *
 * Note: Tests for ViewTabSwitcher visibility and tab switching require the
 * DR CLI server to be running because the UI only shows tabs after data loads.
 * Those tests are covered in embedded-app.spec.ts when run with:
 *   npm run test:e2e (uses playwright.e2e.config.ts)
 *
 * Prerequisites:
 * 1. DR CLI server running:
 *    dr visualize [path-to-model]
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

    // Wait for header to be visible (connection may be REST mode)
    await page.waitForSelector('[data-testid="embedded-header"]', { timeout: 10000 });
  });

  test.describe('URL-based Navigation', () => {
    test('should redirect /spec to /spec/graph by default', async ({ page }) => {
      await page.goto('/spec');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/spec\/graph/);
    });

    test('should redirect /changesets to /changesets/graph by default', async ({ page }) => {
      await page.goto('/changesets');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/changesets\/graph/);
    });

    test('should redirect /model to /model/graph by default', async ({ page }) => {
      await page.goto('/model');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/model\/graph/);
    });

    test('should load /spec/json route directly', async ({ page }) => {
      await page.goto('/spec/json');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should stay on JSON view
      await expect(page).toHaveURL(/\/spec\/json/);
    });

    test('should load /changesets/list route directly', async ({ page }) => {
      await page.goto('/changesets/list');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should stay on list view
      await expect(page).toHaveURL(/\/changesets\/list/);
    });

    test('should load /model/json route directly', async ({ page }) => {
      await page.goto('/model/json');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should stay on JSON view
      await expect(page).toHaveURL(/\/model\/json/);
    });
  });

  test.describe('App Structure', () => {
    test('should have header with title', async ({ page }) => {
      // Already on / from beforeEach
      await expect(page.locator('[data-testid="embedded-header"] h1')).toContainText('Documentation Robotics Viewer');
    });

    test('should have mode selector with all modes', async ({ page }) => {
      // Check for all main tab buttons using data-testid
      await expect(page.locator('[data-testid="main-tab-spec"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-tab-model"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-tab-motivation"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-tab-architecture"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-tab-changesets"]')).toBeVisible();
    });

    test('should have connection status indicator', async ({ page }) => {
      // Connection status should exist (may show connecting, connected, or disconnected)
      await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
    });
  });

  test.describe('Spec Dual View', () => {
    test('should show tab switcher in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('[data-testid="main-tab-changesets"]');

      // Wait for navigation to complete and sub-tab navigation to appear
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Check for Graph and List tabs using data-testid
      await expect(page.locator('[data-testid="sub-tab-graph"]')).toBeVisible();
      await expect(page.locator('[data-testid="sub-tab-list"]')).toBeVisible();
    });

    test('should default to Graph view in spec mode', async ({ page }) => {
      // Switch to Spec mode
      await page.click('[data-testid="main-tab-spec"]');

      // Wait for navigation and sub-tab navigation to appear
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Graph tab should be active by default (router redirects /spec to /spec/graph)
      // Active tabs have blue text color via CSS classes
      const graphTab = page.locator('[data-testid="sub-tab-graph"]');
      await expect(graphTab).toHaveClass(/text-blue-600/);

      // GraphViewer should be visible
      await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
    });

    test('should switch to graph view when Graph tab clicked', async ({ page }) => {
      // Switch to Spec mode (defaults to graph)
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // First switch to JSON view
      await page.click('[data-testid="sub-tab-json"]');
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Now switch back to Graph view
      await page.click('[data-testid="sub-tab-graph"]');
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Graph tab should be active (has blue text color)
      const graphTab = page.locator('[data-testid="sub-tab-graph"]');
      await expect(graphTab).toHaveClass(/text-blue-600/);

      // Check for React Flow (graph viewer)
      const reactFlow = page.locator('.react-flow');
      await expect(reactFlow).toBeVisible();
    });

    test('should render schema nodes in graph view', async ({ page }) => {
      // Switch to Spec mode (defaults to graph view)
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

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
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Verify graph is active (has blue text)
      await expect(page.locator('[data-testid="sub-tab-graph"]')).toHaveClass(/text-blue-600/);

      // Switch to Model mode
      await page.click('[data-testid="main-tab-model"]');
      await page.waitForLoadState('networkidle');

      // Switch back to Spec mode
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Graph tab should still be active (preference persisted)
      const graphTab = page.locator('[data-testid="sub-tab-graph"]');
      await expect(graphTab).toHaveClass(/text-blue-600/);
    });

    test('should switch back to JSON view', async ({ page }) => {
      // Switch to Spec mode (defaults to graph)
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Verify we're in graph view
      await expect(page.locator('[data-testid="sub-tab-graph"]')).toHaveClass(/text-blue-600/);

      // Switch to JSON
      await page.click('[data-testid="sub-tab-json"]');
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // JSON tab should be active (has blue text)
      const jsonTab = page.locator('[data-testid="sub-tab-json"]');
      await expect(jsonTab).toHaveClass(/text-blue-600/);

      // SpecViewer should be visible
      await expect(page.locator('[data-testid="spec-viewer"]')).toBeVisible();
    });

    test('should not have third-level tabs in Spec JSON view', async ({ page }) => {
      // Switch to Spec JSON view
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });
      await page.click('[data-testid="sub-tab-json"]');
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Should only have 2 levels of tabs: main tabs and sub-tabs (Graph/JSON)
      // NO third level for Schemas/Cross-Layer Links
      // We have 1 sub-tab-navigation element
      const subTabNav = page.locator('[data-testid="sub-tab-navigation"]');
      const count = await subTabNav.count();

      console.log(`Found ${count} sub-tab-navigation elements (expecting 1)`);
      expect(count).toBe(1);
    });

    test('should show merged schema definitions and cross-layer links', async ({ page }) => {
      // Switch to Spec JSON view
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });
      await page.click('[data-testid="sub-tab-json"]');
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Select a schema
      const firstSchemaButton = page.locator('button').filter({ hasText: /.schema.json$/ }).first();
      if (await firstSchemaButton.isVisible()) {
        await firstSchemaButton.click();
        await page.waitForLoadState('networkidle');

        // Both sections should be visible in merged view
        await expect(page.locator('text=Schema Definitions')).toBeVisible();

        // Cross-layer links section may not exist if no links
        const hasLinksSection = await page.locator('text=Cross-Layer Links').isVisible();
        console.log(`Cross-Layer Links section ${hasLinksSection ? 'visible' : 'not visible (may have no links)'}`);
      }
    });
  });

  test.describe('Changeset Dual View', () => {
    test('should show tab switcher in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('[data-testid="main-tab-changesets"]');

      // Wait for sub-tab navigation to appear
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Check for Graph and List tabs
      await expect(page.locator('[data-testid="sub-tab-graph"]')).toBeVisible();
      await expect(page.locator('[data-testid="sub-tab-list"]')).toBeVisible();
    });

    test('should default to Graph view in changeset mode', async ({ page }) => {
      // Switch to Changesets mode
      await page.click('[data-testid="main-tab-changesets"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Graph tab should be active by default (router redirects /changesets to /changesets/graph)
      const graphTab = page.locator('[data-testid="sub-tab-graph"]');
      await expect(graphTab).toHaveClass(/text-blue-600/);
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
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

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
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Switch to JSON view
      await page.click('[data-testid="sub-tab-json"]');
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 20000 });
      await page.waitForSelector('[data-testid="embedded-header"]', { timeout: 20000 });

      // Switch to Spec mode
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // JSON tab should still be active (preference persisted via blue text)
      const jsonTab = page.locator('[data-testid="sub-tab-json"]');
      await expect(jsonTab).toHaveClass(/text-blue-600/);
    });
  });
});
