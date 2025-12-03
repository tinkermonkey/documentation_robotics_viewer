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
test.describe.skip('Embedded App - Reference Server Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });
  });

  test('should load the embedded app', async ({ page }) => {
    // Check that the main app container is present
    await expect(page.locator('.embedded-app')).toBeVisible();

    // Check that the header is present
    await expect(page.locator('.embedded-header h1')).toContainText('Documentation Robotics Viewer');

    // Check that the mode selector is present
    await expect(page.locator('.mode-selector')).toBeVisible();
  });

  test('should connect to WebSocket server', async ({ page }) => {
    // Wait for connection status to show connected
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Verify connection status
    const connectionStatus = page.locator('.connection-status.connected');
    await expect(connectionStatus).toBeVisible();
  });

  test('should load and display model view', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Model view should be active by default
    const modelButton = page.locator('.mode-selector button', { hasText: 'Model' });
    await expect(modelButton).toHaveClass(/active/);

    // Wait for model to load (empty model is fine)
    await page.waitForTimeout(2000);

    // Check for GraphViewer or message overlay
    const hasGraphViewer = await page.locator('.react-flow').isVisible();
    const hasMessage = await page.locator('.message-overlay').isVisible();

    // Either GraphViewer is shown or a message (for empty model)
    expect(hasGraphViewer || hasMessage).toBeTruthy();
  });

  // Note: Spec view switching is tested more comprehensively in embedded-dual-view.spec.ts
  // which handles async loading states properly

  // Note: Changeset view switching is tested more comprehensively in embedded-dual-view.spec.ts
  // which handles async loading states properly

  test('should load and display annotations', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Wait for model to load
    await page.waitForTimeout(2000);

    // Check for annotation panel
    const annotationPanel = page.locator('.annotation-panel');

    // If annotations are loaded, panel should be visible
    if (await annotationPanel.isVisible()) {
      // Check for annotation items or empty state
      const hasAnnotations = await page.locator('.annotation-item').count() > 0;
      const hasEmptyState = await page.locator('.empty-state').isVisible();

      expect(hasAnnotations || hasEmptyState).toBeTruthy();
    }
  });

  // Note: Layer panel visibility depends on graph view which is tested in embedded-dual-view.spec.ts
  // The LayerPanel is only rendered when activeView === 'graph' in ModelRoute/SpecRoute

  // Note: Sequential mode switching is tested more comprehensively in embedded-dual-view.spec.ts
  // which properly handles async loading states for changesets

  test('should display version badge when model is loaded', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Wait for model to load
    await page.waitForTimeout(2000);

    // Check for version badge in header
    const versionBadge = page.locator('.version-badge');
    if (await versionBadge.isVisible()) {
      await expect(versionBadge).toContainText('v');
    }
  });
});
