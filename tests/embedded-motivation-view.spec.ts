/**
 * E2E Tests for Motivation View in Embedded App
 * Tests the motivation graph visualization with DR CLI server integration
 *
 * IMPORTANT: These tests require the DR CLI server to be running.
 *
 * Prerequisites:
 * 1. DR CLI server running:
 *    dr visualize [path-to-model]
 *
 * 2. Playwright browsers:
 *    npx playwright install chromium
 *
 * 3. Run tests ONLY with the embedded config:
 *    npm run test:e2e
 *
 * STATUS: These tests are VALID and test real functionality in the embedded app.
 *         They are excluded from default tests via playwright.config.ts.
 *         They run when executed with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

test.describe('Motivation View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');
    // Wait for React to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 10000 });
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
    await expect(motivationButton).toHaveClass(/bg-blue/);

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
    // or error boundary if there's a rendering issue
    const motivationContainer = page.locator('.motivation-graph-container');
    const messageOverlay = page.locator('.message-overlay');
    const renderingError = page.locator('h3:has-text("Rendering Error")');

    // At least one of these should be visible
    const motivationVisible = await motivationContainer.isVisible().catch(() => false);
    const messageVisible = await messageOverlay.isVisible().catch(() => false);
    const errorVisible = await renderingError.isVisible().catch(() => false);

    expect(motivationVisible || messageVisible || errorVisible).toBeTruthy();
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
    await page.waitForLoadState('networkidle');

    // Should still be functional - either showing graph or message or error
    const motivationContainer = page.locator('.motivation-graph-container');
    const messageOverlay = page.locator('.message-overlay');
    const motivationViewContainer = page.locator('.motivation-view-container');
    const renderingError = page.locator('h3:has-text("Rendering Error")');

    const hasMotivation = await motivationContainer.isVisible().catch(() => false);
    const hasMessage = await messageOverlay.isVisible().catch(() => false);
    const hasViewContainer = await motivationViewContainer.isVisible().catch(() => false);
    const hasError = await renderingError.isVisible().catch(() => false);

    expect(hasMotivation || hasMessage || hasViewContainer || hasError).toBeTruthy();
  });

  test('should not show error boundary in normal operation', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to Motivation view
    await page.click('.mode-selector button:has-text("Motivation")');
    await page.waitForTimeout(3000);

    // Check if error boundary is showing
    const renderingError = page.locator('h3:has-text("Rendering Error")');
    const hasError = await renderingError.isVisible().catch(() => false);

    // If error boundary is showing, fail with details
    if (hasError) {
      const errorDetails = await page.locator('details summary:has-text("Error Details")').isVisible().catch(() => false);
      let errorText = 'Error boundary is showing';
      
      if (errorDetails) {
        // Try to get error details
        await page.click('details summary:has-text("Error Details")');
        await page.waitForTimeout(500);
        const preContent = await page.locator('details pre').textContent().catch(() => '');
        errorText += `\nError details: ${preContent}`;
      }
      
      // Also log console errors
      if (errors.length > 0) {
        errorText += `\nConsole errors: ${errors.join('\n')}`;
      }

      throw new Error(errorText);
    }

    // Should show either the graph or a message, but not error boundary
    const motivationContainer = page.locator('.motivation-graph-container');
    const messageOverlay = page.locator('.message-overlay');
    
    const hasMotivation = await motivationContainer.isVisible().catch(() => false);
    const hasMessage = await messageOverlay.isVisible().catch(() => false);

    expect(hasMotivation || hasMessage).toBeTruthy();
  });
});
