/**
 * E2E Tests for Embedded App
 * Tests the embedded viewer with reference server integration
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

test.describe('Embedded App - Reference Server Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('http://localhost:8765/');

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
    const connectionStatus = page.locator('.connection-status');
    await expect(connectionStatus).toHaveClass(/connected/);
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

  test('should switch to spec view and load without errors', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click the Spec button
    await page.click('.mode-selector button:has-text("Spec")');

    // Wait for spec to load
    await page.waitForTimeout(3000);

    // Verify Spec mode is active
    const specButton = page.locator('.mode-selector button', { hasText: 'Spec' });
    await expect(specButton).toHaveClass(/active/);

    // Check that no errors occurred during spec loading
    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') ||
      e.includes('l.elements is undefined') ||
      e.includes('u.references is not iterable') ||
      e.includes('Error rendering model')
    );
    expect(criticalErrors).toHaveLength(0);

    // Check for SpecViewer (not GraphViewer)
    await expect(page.locator('.spec-viewer')).toBeVisible();

    // Verify that schema list is rendered
    await expect(page.locator('.schema-list')).toBeVisible();

    // Count schema items
    const schemaItems = page.locator('.schema-item');
    const schemaCount = await schemaItems.count();

    // Should have schema files from .dr/schemas/ directory
    expect(schemaCount).toBeGreaterThan(0);

    // Log for debugging
    console.log(`Spec view rendered ${schemaCount} schema files`);
  });

  test('should switch to changesets view', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Click the Changesets button
    await page.click('.mode-selector button:has-text("Changesets")');

    // Wait for changesets to load
    await page.waitForTimeout(2000);

    // Verify Changesets mode is active
    const changesetsButton = page.locator('.mode-selector button', { hasText: 'Changesets' });
    await expect(changesetsButton).toHaveClass(/active/);

    // Check for changeset view
    await expect(page.locator('.changeset-view')).toBeVisible();

    // Should have changeset list
    await expect(page.locator('.changeset-list')).toBeVisible();
  });

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

  test('should display layer panel', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Wait for model to load
    await page.waitForTimeout(2000);

    // Check for layer panel
    await expect(page.locator('.layer-panel')).toBeVisible();
  });

  test('should handle all three mode switches sequentially', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 5000 });

    // Model (default)
    await expect(page.locator('.mode-selector button:has-text("Model")')).toHaveClass(/active/);
    await page.waitForTimeout(1000);

    // Switch to Spec
    await page.click('.mode-selector button:has-text("Spec")');
    await page.waitForTimeout(1000);
    await expect(page.locator('.mode-selector button:has-text("Spec")')).toHaveClass(/active/);

    // Switch to Changesets
    await page.click('.mode-selector button:has-text("Changesets")');
    await page.waitForTimeout(1000);
    await expect(page.locator('.mode-selector button:has-text("Changesets")')).toHaveClass(/active/);
    await expect(page.locator('.changeset-view')).toBeVisible();

    // Switch back to Model
    await page.click('.mode-selector button:has-text("Model")');
    await page.waitForTimeout(1000);
    await expect(page.locator('.mode-selector button:has-text("Model")')).toHaveClass(/active/);
  });

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
