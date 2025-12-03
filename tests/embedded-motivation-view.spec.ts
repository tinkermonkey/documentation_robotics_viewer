/**
 * E2E Tests for Motivation View in Embedded App
 * Tests the motivation graph visualization with reference server integration
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
 *         They are excluded from default tests via playwright.config.ts.
 *         They run when executed with: npm run test:embedded
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

test.describe('Motivation View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');
    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test('should have Motivation button in mode selector', async ({ page }) => {
    // Check that Motivation button exists
    const motivationButton = page.locator('.mode-selector button', { hasText: 'Motivation' });
    await expect(motivationButton).toBeVisible();
  });

  test('should switch to motivation view without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click the Motivation button
    await page.click('.mode-selector button:has-text("Motivation")');

    // Wait for view to load
    await page.waitForTimeout(2000);

    // Verify Motivation mode is active
    const motivationButton = page.locator('.mode-selector button', { hasText: 'Motivation' });
    await expect(motivationButton).toHaveClass(/active/);

    // Check for critical React/ReactFlow errors
    const criticalErrors = errors.filter(e =>
      e.includes('zustand provider') ||
      e.includes('TypeError') ||
      e.includes('Cannot read properties') ||
      e.includes('Seems like you have not used zustand provider as an ancestor')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should display motivation view container or message overlay', async ({ page }) => {
    // Navigate to Motivation view
    await page.click('.mode-selector button:has-text("Motivation")');
    await page.waitForTimeout(2000);

    // The view should either show the motivation graph container (if motivation elements exist)
    // or a message overlay (for loading, error, or empty state)
    const motivationContainer = page.locator('.motivation-graph-container');
    const messageOverlay = page.locator('.message-overlay');

    // At least one of these should be visible
    const motivationVisible = await motivationContainer.isVisible().catch(() => false);
    const messageVisible = await messageOverlay.isVisible().catch(() => false);

    expect(motivationVisible || messageVisible).toBeTruthy();
  });

  test('should not crash when rapidly switching views', async ({ page }) => {
    // Rapidly switch between views
    for (let i = 0; i < 3; i++) {
      await page.click('.mode-selector button:has-text("Motivation")');
      await page.waitForTimeout(100);
      await page.click('.mode-selector button:has-text("Model")');
      await page.waitForTimeout(100);
    }

    // End on Motivation
    await page.click('.mode-selector button:has-text("Motivation")');
    await page.waitForTimeout(1000);

    // Should still be functional - either showing graph or message
    const motivationContainer = page.locator('.motivation-graph-container');
    const messageOverlay = page.locator('.message-overlay');
    const motivationViewContainer = page.locator('.motivation-view-container');

    const hasMotivation = await motivationContainer.isVisible().catch(() => false);
    const hasMessage = await messageOverlay.isVisible().catch(() => false);
    const hasViewContainer = await motivationViewContainer.isVisible().catch(() => false);

    expect(hasMotivation || hasMessage || hasViewContainer).toBeTruthy();
  });
});
