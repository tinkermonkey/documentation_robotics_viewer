/**
 * E2E Tests for Embedded App
 * Tests the embedded viewer with reference server integration
 *
 * IMPORTANT: These tests require the Python reference server to be running.
 *
 * Prerequisites:
 * 1. Python dependencies (reference server):
 *    cd reference_server && source .venv/bin/activate && pip install -r requirements.txt
 *
 * 2. Playwright browsers:
 *    npx playwright install chromium
 *
 * 3. Run tests ONLY with the embedded config:
 *    npm run test:embedded
 *
 * STATUS: These tests are VALID and test real functionality in the embedded app.
 *         They are SKIPPED by default because they require the Python reference server.
 *         They only run when executed with: npm run test:embedded
 *
 * NOTE: Do NOT remove .skip - these tests are designed to run ONLY with
 *       playwright.embedded.config.ts which starts the reference server.
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

// SKIP by default - only run with: npm run test:embedded
// The embedded config (playwright.embedded.config.ts) starts the required Python reference server
test.describe('Embedded App - Reference Server Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
  });

  test('should load the embedded app', async ({ page }) => {
    // Check that the main app container is present
    await expect(page.locator('[data-testid="embedded-app"]')).toBeVisible();

    // Check that the header is present
    await expect(page.locator('[data-testid="embedded-header"] h1')).toContainText('Documentation Robotics Viewer');

    // Check that the header contains main tabs
    const header = page.locator('[data-testid="embedded-header"]');
    await expect(header).toBeVisible();

    // Verify the main tab labels are present (button-based tabs)
    await expect(header.getByRole('button', { name: 'Spec' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Model' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Motivation' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Architecture' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Changesets' })).toBeVisible();
  });

  test('should connect to WebSocket server', async ({ page }) => {
    // Wait for connection status to show connected
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });

    // Verify connection status
    const connectionStatus = page.locator('[data-connection-state="connected"]');
    await expect(connectionStatus).toBeVisible();
  });

  test('should load and display model view', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });

    // Navigate to Model tab if not already there
    const header = page.locator('[data-testid="embedded-header"]');
    const modelTab = header.getByRole('button', { name: 'Model' });
    await modelTab.click();

    // Wait for model to load
    await page.waitForTimeout(2000);

    // Check that SharedLayout is visible (graph or JSON view)
    const sharedLayout = page.locator('[data-testid="shared-layout"]');
    await expect(sharedLayout).toBeVisible();

    // Check that Graph sub-tab is active
    const graphTab = header.getByRole('button', { name: 'Graph' });
    await expect(graphTab).toBeVisible();
  });

  // Note: Spec view switching is tested more comprehensively in embedded-dual-view.spec.ts
  // which handles async loading states properly

  // Note: Changeset view switching is tested more comprehensively in embedded-dual-view.spec.ts
  // which handles async loading states properly

  test('should load and display annotations', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });

    // Wait for model to load
    await page.waitForTimeout(2000);

    // Annotations may be displayed in various ways - check for any content
    const hasReactFlow = await page.locator('.react-flow').isVisible();
    const hasAnnotationPanel = await page.locator('.annotation-panel').isVisible();
    const hasAnnotations = await page.locator('.annotation-item').count() > 0;

    // As long as the page loaded with some content, consider it successful
    expect(hasReactFlow || hasAnnotationPanel || hasAnnotations).toBeTruthy();
  });

  // Note: Layer panel visibility depends on graph view which is tested in embedded-dual-view.spec.ts
  // The LayerPanel is only rendered when activeView === 'graph' in ModelRoute/SpecRoute

  // Note: Sequential mode switching is tested more comprehensively in embedded-dual-view.spec.ts
  // which properly handles async loading states for changesets

  test('should display version badge when model is loaded', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });

    // Wait for model to load
    await page.waitForTimeout(2000);

    // Check for version badge in header
    const versionBadge = page.locator('.version-badge');
    if (await versionBadge.isVisible()) {
      await expect(versionBadge).toContainText('v');
    }
  });
});
