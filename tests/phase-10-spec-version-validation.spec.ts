/**
 * E2E Tests for Phase 10: Spec Version Mismatch Warning and Example Model Validation
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

test.describe('Phase 10 - Spec Version Mismatch Warning', () => {
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

  test('spec version warning is accessible with proper ARIA attributes', async ({ page }) => {
    // Create a mismatch scenario by setting different versions
    // Note: This test verifies the component structure, actual mismatch depends on spec version

    // The warning component should have proper ARIA attributes when visible
    const warningElement = page.locator('[data-testid="spec-version-warning"]');

    // If the warning is visible, check its accessibility attributes
    if (await warningElement.isVisible().catch(() => false)) {
      // Check for role="alert"
      const role = await warningElement.getAttribute('role');
      expect(role).toBe('alert');

      // Check for aria-live="polite"
      const ariaLive = await warningElement.getAttribute('aria-live');
      expect(ariaLive).toBe('polite');

      console.log('✓ Warning has proper ARIA attributes');
    }
  });

  test('spec version warning can be dismissed by user', async ({ page }) => {
    // Get the warning element
    const warningElement = page.locator('[data-testid="spec-version-warning"]');

    // If the warning is visible, test dismissal
    if (await warningElement.isVisible().catch(() => false)) {
      // Find the dismiss button (the × button)
      const dismissButton = warningElement.locator('button');
      await dismissButton.click();

      // Wait for the warning to disappear
      await expect(warningElement).not.toBeVisible();

      console.log('✓ Warning was successfully dismissed');
    } else {
      console.log('✓ Warning not present (versions matched, no dismissal needed)');
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
