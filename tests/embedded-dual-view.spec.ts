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

    test('should load /spec/details route directly', async ({ page }) => {
      await page.goto('/spec/details');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should stay on details view
      await expect(page).toHaveURL(/\/spec\/details/);
    });

    test('should load /changesets/list route directly', async ({ page }) => {
      await page.goto('/changesets/list');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should stay on list view
      await expect(page).toHaveURL(/\/changesets\/list/);
    });

    test('should load /model/details route directly', async ({ page }) => {
      await page.goto('/model/details');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

      // Should stay on details view
      await expect(page).toHaveURL(/\/model\/details/);
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
      const graphTab = page.locator('[data-testid="sub-tab-graph"]');
      await expect(graphTab).toHaveClass(/text-blue-600/);
    });

    test('should not have third-level tabs in Spec view', async ({ page }) => {
      // Switch to Spec mode (defaults to Graph view)
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Should only have 2 levels of tabs: main tabs and sub-tabs (Details only)
      // NO third level for Schemas/Cross-Layer Links
      const subTabNav = page.locator('[data-testid="sub-tab-navigation"]');
      const count = await subTabNav.count();

      console.log(`Found ${count} sub-tab-navigation elements (expecting 1)`);
      expect(count).toBe(1);
    });

    test('should show schema element definitions in Details view', async ({ page }) => {
      // Switch to Spec mode then navigate to Details view
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });
      await page.click('[data-testid="sub-tab-details"]');
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Select a schema from the sidebar
      const firstSchemaButton = page.locator('[data-testid^="schema-item-"]').first();
      if (await firstSchemaButton.isVisible()) {
        await firstSchemaButton.click();
        await page.waitForLoadState('networkidle');

        // Schema definitions section should be visible
        await expect(page.locator('[data-testid="schema-definitions-section"]')).toBeVisible();
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
    test('should not have console errors in spec details view', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Switch to Spec mode then navigate to Details view
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });
      await page.click('[data-testid="sub-tab-details"]');
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Wait for network to stabilize
      await page.waitForLoadState('networkidle');

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
    test('should load spec in Graph view after page reload', async ({ page }) => {
      // Switch to Spec mode (defaults to Graph view)
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 20000 });
      await page.waitForSelector('[data-testid="embedded-header"]', { timeout: 20000 });

      // Switch to Spec mode
      await page.click('[data-testid="main-tab-spec"]');
      await page.waitForSelector('[data-testid="sub-tab-navigation"]', { timeout: 10000 });

      // Graph tab should be active
      const graphTab = page.locator('[data-testid="sub-tab-graph"]');
      await expect(graphTab).toHaveClass(/text-blue-600/);
    });
  });
});
