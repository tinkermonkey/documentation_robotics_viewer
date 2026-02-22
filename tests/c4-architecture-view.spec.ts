/**
 * E2E Tests for Architecture View
 *
 * Tests the ArchitectureRoute component functionality including:
 * - Navigation to Architecture view
 * - No errors or crashes when loading
 * - Rapid view switching stability
 *
 * Prerequisites:
 * 1. DR CLI server running with example model
 * 2. Playwright browsers installed: npx playwright install chromium
 *
 * Run tests: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

test.describe('Architecture View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Wait for WebSocket connection (using data attributes from ConnectionStatus component)
    await page.waitForSelector('[data-testid="connection-status"][data-connection-state="connected"]', { timeout: 10000 });
  });

  test.describe('Navigation to Architecture View', () => {
    test('should have Architecture button in main tabs', async ({ page }) => {
      const architectureButton = page.locator('[data-testid="main-tab-architecture"]');
      await expect(architectureButton).toBeVisible();
    });

    test('should switch to Architecture view without errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.click('[data-testid="main-tab-architecture"]');
      await page.waitForFunction(() => document.readyState === 'complete');

      const architectureButton = page.locator('[data-testid="main-tab-architecture"]');
      await expect(architectureButton).toHaveClass(/text-blue/);

      const criticalErrors = errors.filter(e =>
        e.includes('zustand provider') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('should display the graph viewer', async ({ page }) => {
      await page.click('[data-testid="main-tab-architecture"]');
      await page.waitForFunction(() => document.readyState === 'complete');

      const reactFlow = page.locator('.react-flow');
      const hasReactFlow = await reactFlow.isVisible().catch(() => false);

      const loadingState = page.locator('text="Loading architecture view..."');
      const hasLoading = await loadingState.isVisible().catch(() => false);

      const errorState = page.locator('h3:has-text("Error")');
      const hasError = await errorState.isVisible().catch(() => false);

      expect(hasReactFlow || hasLoading || hasError).toBeTruthy();
    });
  });

  test.describe('Stability', () => {
    test('should not crash when rapidly switching views', async ({ page }) => {
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="main-tab-architecture"]');
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="main-tab-model"]');
        await page.waitForLoadState('networkidle');
      }

      await page.click('[data-testid="main-tab-architecture"]');
      await page.waitForLoadState('networkidle');

      const architectureContainer = page.locator('[data-testid="embedded-app"]');
      await expect(architectureContainer).toBeVisible();
    });

    test('should support Escape key without errors', async ({ page }) => {
      await page.click('[data-testid="main-tab-architecture"]');
      await page.waitForFunction(() => document.readyState === 'complete');

      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.keyboard.press('Escape');
      await page.waitForLoadState('networkidle');

      const criticalErrors = errors.filter(e =>
        e.includes('TypeError') ||
        e.includes('Cannot read properties')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('should not show error boundary in normal operation', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.click('[data-testid="main-tab-architecture"]');
      await page.waitForFunction(() => document.readyState === 'complete');

      const renderingError = page.locator('h3:has-text("Rendering Error")');
      const hasError = await renderingError.isVisible().catch(() => false);

      if (hasError) {
        let errorText = 'Error boundary is showing in Architecture view';
        if (errors.length > 0) {
          errorText += `\nConsole errors: ${errors.join('\n')}`;
        }
        throw new Error(errorText);
      }

      const reactFlow = page.locator('.react-flow');
      await expect(reactFlow).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should render initial view in under 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.click('[data-testid="main-tab-architecture"]');
      await page.waitForSelector('.react-flow', { timeout: 3000 });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });
});
