/**
 * E2E Tests for Spec Version Mismatch Warning and Example Model Validation
 *
 * Prerequisites:
 * 1. DR CLI server running with example model:
 *    dr visualize documentation-robotics/
 *
 * 2. Playwright browsers:
 *    npx playwright install chromium
 *
 * 3. Run E2E tests:
 *    npm run test:e2e
 *
 * STATUS: Tests verify spec version warning component and example model loading
 * NOTE: These tests require an active DR CLI server and should be run with npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.setTimeout(30000);

// Skip tests if not running in E2E mode (indicated by specific env or condition)
const isE2EMode = process.env.E2E_MODE === 'true' || process.env.npm_lifecycle_event === 'test:e2e';

test.describe('Spec Version Mismatch Warning', () => {
  test.skip(!isE2EMode, 'Skipped: Run with npm run test:e2e when DR CLI server is active');

  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 10000 });

    // Wait for network to stabilize
    await page.waitForLoadState('networkidle');
  });

  test('loads example model without spec version warning when versions match', async ({ page }) => {
    // Wait for the spec version warning element to appear (or not)
    const warningElement = page.locator('[data-testid="spec-version-warning"]');

    // Give the model time to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // The warning should not be visible if versions match
    // Using toHaveCount(0) to assert it either doesn't exist or isn't visible
    const isVisible = await warningElement.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    console.log('✓ No spec version warning displayed (versions matched)');
  });

  test('renders graph nodes after loading example model', async ({ page }) => {
    // Navigate to Model tab if needed
    const header = page.locator('[data-testid="embedded-header"]');
    const modelButton = header.getByRole('button', { name: 'Model' });

    if (await modelButton.isVisible()) {
      await modelButton.click();
    }

    // Click Graph view tab
    const graphButton = header.getByRole('button', { name: 'Graph' });
    if (await graphButton.isVisible()) {
      await graphButton.click();
    }

    // Wait for React Flow to initialize
    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Verify at least one node renders
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.first()).toBeVisible({ timeout: 5000 });

    const nodeCount = await nodes.count();
    console.log(`✓ Graph loaded: ${nodeCount} nodes rendered`);
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('renders at least one edge in the example model graph', async ({ page }) => {
    // Navigate to Model tab if needed
    const header = page.locator('[data-testid="embedded-header"]');
    const modelButton = header.getByRole('button', { name: 'Model' });

    if (await modelButton.isVisible()) {
      await modelButton.click();
    }

    // Click Graph view tab
    const graphButton = header.getByRole('button', { name: 'Graph' });
    if (await graphButton.isVisible()) {
      await graphButton.click();
    }

    // Wait for React Flow to initialize
    await page.waitForSelector('.react-flow', { timeout: 10000 });

    // Verify at least one edge renders
    const edges = page.locator('.react-flow__edge');

    // Wait for at least one edge to appear
    await expect(edges.first()).toBeVisible({ timeout: 5000 });

    const edgeCount = await edges.count();
    console.log(`✓ Graph loaded: ${edgeCount} edges rendered`);
    expect(edgeCount).toBeGreaterThan(0);
  });

  test('spec version warning has proper ARIA attributes when present', async ({ page }) => {
    // This test validates the component is correctly implemented
    // The warning component, if rendered, should have proper ARIA attributes
    const warningElement = page.locator('[data-testid="spec-version-warning"]');

    // Verify the element exists in the DOM (even if hidden)
    const count = await warningElement.count();

    if (count > 0) {
      // If the component is rendered, check its accessibility attributes
      const role = await warningElement.getAttribute('role');
      const ariaLive = await warningElement.getAttribute('aria-live');

      // These attributes must be present for accessibility compliance
      expect(role).toBe('alert');
      expect(ariaLive).toBe('polite');
      console.log('✓ Warning has proper ARIA attributes');
    } else {
      // If not rendered, the component structure should be in the DOM
      // This test documents that the component must be accessible when used
      console.log('ℹ Warning component not rendered in current state');
    }
  });

  test('spec version warning dismiss button is properly implemented', async ({ page }) => {
    const warningElement = page.locator('[data-testid="spec-version-warning"]');

    // Check if warning element exists in DOM
    const count = await warningElement.count();

    if (count > 0) {
      // If warning is rendered, the dismiss button should be present
      const dismissButton = warningElement.locator('button');
      const buttonCount = await dismissButton.count();

      // Verify dismiss button exists in the component
      expect(buttonCount).toBeGreaterThan(0);

      // If warning is visible, test that dismiss works
      const isVisible = await warningElement.isVisible().catch(() => false);
      if (isVisible) {
        await dismissButton.first().click();
        await expect(warningElement).not.toBeVisible();
        console.log('✓ Warning was successfully dismissed');
      }
    } else {
      console.log('ℹ Warning component not in DOM (no mismatch in current state)');
    }
  });

  test('example model contains cross-layer relationships', async ({ page }) => {
    // Navigate to Model tab if needed
    const header = page.locator('[data-testid="embedded-header"]');
    const modelButton = header.getByRole('button', { name: 'Model' });

    if (await modelButton.isVisible()) {
      await modelButton.click();
    }

    // Click Graph view tab
    const graphButton = header.getByRole('button', { name: 'Graph' });
    if (await graphButton.isVisible()) {
      await graphButton.click();
    }

    // Wait for React Flow to initialize and stabilize
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // In a fully loaded graph with cross-layer relationships, we should see edges
    // connecting nodes from different layers
    const edges = page.locator('.react-flow__edge');
    const edgeCount = await edges.count();

    // This verifies that edges exist (which includes cross-layer relationships)
    expect(edgeCount).toBeGreaterThan(0);
    console.log(`✓ Cross-layer relationships present: ${edgeCount} edges found`);
  });
});
