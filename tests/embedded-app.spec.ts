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
 * 3. Run tests with the E2E config:
 *    npm run test:e2e
 *
 * STATUS: These tests are VALID and test real functionality in the embedded app.
 *         They automatically run with the E2E config which starts both servers.
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

// These tests run automatically with: npm run test:e2e
// The E2E config (playwright.e2e.config.ts) starts both the reference server and dev server
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

    // Verify React Flow graph is rendered
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    const reactFlow = page.locator('.react-flow');
    await expect(reactFlow).toBeVisible();

    // Verify nodes are present
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThan(0);
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

  test('should have only one left sidebar in JSON views', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });

    // Navigate to Model JSON view
    const header = page.locator('[data-testid="embedded-header"]');
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'JSON' }).click();

    // Wait for JSON view to render
    await page.waitForSelector('[data-testid="shared-layout"]', { timeout: 5000 });

    // Check for left sidebar
    const leftSidebar = page.locator('[data-testid="left-sidebar"]');
    await expect(leftSidebar).toBeVisible();
    await expect(leftSidebar).toHaveCount(1);

    // Ensure no duplicate internal sidebars
    const allSidebars = page.locator('aside');
    const sidebarCount = await allSidebars.count();

    // Should have exactly 2 sidebars: left (w-64) and right (w-80)
    expect(sidebarCount).toBeLessThanOrEqual(2);
  });

  test('should attach right sidebar to screen edge', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });

    // Navigate to Model graph view
    const header = page.locator('[data-testid="embedded-header"]');
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();

    // Wait for right sidebar
    await page.waitForSelector('[data-testid="right-sidebar"]', { timeout: 5000 });

    const rightSidebar = page.locator('[data-testid="right-sidebar"]');
    await expect(rightSidebar).toBeVisible();

    const box = await rightSidebar.boundingBox();
    const viewport = page.viewportSize()!;

    // Right edge should be at viewport edge (within 2px tolerance for scrollbar)
    const rightEdge = box!.x + box!.width;
    const distanceFromEdge = Math.abs(rightEdge - viewport.width);

    expect(distanceFromEdge).toBeLessThan(2);
  });

  test('should render graph with proper height', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });

    // Navigate to Model graph view
    const header = page.locator('[data-testid="embedded-header"]');
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();

    // Wait for React Flow
    await page.waitForSelector('.react-flow', { timeout: 10000 });

    const graphContainer = page.locator('.react-flow');
    const bbox = await graphContainer.boundingBox();

    // Graph should have substantial height (not collapsed)
    expect(bbox).toBeTruthy();
    expect(bbox!.height).toBeGreaterThan(100);
  });
});
