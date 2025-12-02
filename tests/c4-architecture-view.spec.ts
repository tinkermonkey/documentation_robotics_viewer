/**
 * E2E Tests for C4 Architecture Visualization
 *
 * Tests the C4GraphView component functionality including:
 * - Navigation to Architecture view
 * - Handling of empty/error states when no C4 elements exist
 * - Basic view switching
 *
 * Note: Many C4-specific tests (drill-down, filtering, export) require a model
 * with Application services. The example model only has components, so these
 * tests verify the view handles this gracefully.
 *
 * Prerequisites:
 * 1. Reference server running with example model
 * 2. Playwright browsers installed: npx playwright install chromium
 *
 * Run tests: npm run test:embedded
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

test.describe('C4 Architecture View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test.describe('Navigation to Architecture View', () => {
    test('should have Architecture button in mode selector', async ({ page }) => {
      // Check that Architecture button exists
      const architectureButton = page.locator('.mode-selector button', { hasText: 'Architecture' });
      await expect(architectureButton).toBeVisible();
    });

    test('should switch to Architecture view without errors', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Click the Architecture button
      await page.click('.mode-selector button:has-text("Architecture")');

      // Wait for view to load
      await page.waitForTimeout(2000);

      // Verify Architecture mode is active
      const architectureButton = page.locator('.mode-selector button', { hasText: 'Architecture' });
      await expect(architectureButton).toHaveClass(/active/);

      // Check for critical React/ReactFlow errors
      const criticalErrors = errors.filter(e =>
        e.includes('zustand provider') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('should display architecture view container or message overlay', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // The view should either show the C4 graph container (if C4 elements exist)
      // or a message overlay (for loading, error, or empty state)
      const c4Container = page.locator('.c4-graph-container');
      const messageOverlay = page.locator('.message-overlay');

      // At least one of these should be visible
      const c4Visible = await c4Container.isVisible().catch(() => false);
      const messageVisible = await messageOverlay.isVisible().catch(() => false);

      expect(c4Visible || messageVisible).toBeTruthy();
    });
  });

  test.describe('Empty Model Handling', () => {
    test('should gracefully handle model without C4 containers', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // The example model may not have Application services (only components)
      // so C4 view should show either:
      // 1. C4 graph with nodes (if model has services)
      // 2. Empty/error message overlay (if model lacks services)

      const reactFlow = page.locator('.react-flow');
      const messageBox = page.locator('.message-box');

      const hasReactFlow = await reactFlow.isVisible().catch(() => false);
      const hasMessage = await messageBox.isVisible().catch(() => false);

      // One of these must be true - the view should not be completely empty
      expect(hasReactFlow || hasMessage).toBeTruthy();
    });

    test('should not crash when rapidly switching views', async ({ page }) => {
      // Rapidly switch between views
      for (let i = 0; i < 3; i++) {
        await page.click('.mode-selector button:has-text("Architecture")');
        await page.waitForTimeout(100);
        await page.click('.mode-selector button:has-text("Model")');
        await page.waitForTimeout(100);
      }

      // End on Architecture
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(1000);

      // Should still be functional - either showing graph or message
      const c4Container = page.locator('.c4-graph-container');
      const messageOverlay = page.locator('.message-overlay');
      const architectureContainer = page.locator('.architecture-view-container');

      const hasC4 = await c4Container.isVisible().catch(() => false);
      const hasMessage = await messageOverlay.isVisible().catch(() => false);
      const hasArchContainer = await architectureContainer.isVisible().catch(() => false);

      expect(hasC4 || hasMessage || hasArchContainer).toBeTruthy();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support Escape key without errors', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(2000);

      // Listen for errors during keyboard interaction
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Press Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Should not cause any critical errors
      const criticalErrors = errors.filter(e =>
        e.includes('TypeError') ||
        e.includes('Cannot read properties')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });
});
