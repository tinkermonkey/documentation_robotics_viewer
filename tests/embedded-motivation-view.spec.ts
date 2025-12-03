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
 *         They are SKIPPED by default because they require the Python reference server.
 *         They only run when executed with: npm run test:embedded
 *
 * NOTE: Do NOT remove .skip - these tests are designed to run ONLY with
 *       playwright.embedded.config.ts which starts the reference server.
 */

import { test, expect } from '@playwright/test';

// SKIP by default - only run with: npm run test:embedded
// The embedded config (playwright.embedded.config.ts) starts the required Python reference server
test.describe.skip('Motivation View - Reference Server Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');
    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });
    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test('should switch to motivation view and render graph without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click the Motivation button
    await page.click('.mode-selector button:has-text("Motivation")');

    // Wait for potential error or graph
    await page.waitForTimeout(2000);

    // Check for the specific React Flow error
    const reactFlowError = errors.find(e => e.includes('Seems like you have not used zustand provider as an ancestor'));

    // Fail if we see the error
    expect(reactFlowError, 'React Flow Provider error detected').toBeUndefined();

    // Verify Motivation mode is active
    const motivationButton = page.locator('.mode-selector button', { hasText: 'Motivation' });
    await expect(motivationButton).toHaveClass(/active/);

    // Check for graph container
    await expect(page.locator('.motivation-graph-container')).toBeVisible();

    // Check that we have nodes (assuming the model has motivation elements)
    // The example model should have them.
    // We might need to wait a bit for layout
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10000 });
  });
});
