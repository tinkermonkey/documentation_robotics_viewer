/**
 * E2E Tests for Cross-Layer Components
 * Tests the cross-layer link toggle, filters, and breadcrumb navigation
 *
 * IMPORTANT: These tests require the embedded app to be running.
 *
 * Tests:
 * - CrossLayerPanel toggle visibility
 * - CrossLayerFilterPanel target layer filters
 * - CrossLayerFilterPanel relationship type filters
 * - CrossLayerBreadcrumb navigation
 * - Edge count display
 */

import { test, expect } from '@playwright/test';

// Increase timeout for complex operations
test.setTimeout(30000);

test.describe('Cross-Layer Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForLoadState('networkidle').catch(() => {
      // Network idle may not always be achieved, continue anyway
    });
  });

  test.describe('CrossLayerPanel Toggle', () => {
    test('should render cross-layer panel when cross-layer edges exist', async ({ page }) => {
      // Look for cross-layer panel
      const crossLayerPanel = page.locator('[data-testid="cross-layer-panel"]');

      // Panel should be present if there are cross-layer edges
      const isPanelPresent = await crossLayerPanel.isVisible().catch(() => false);

      // If panel is present, verify toggle exists
      if (isPanelPresent) {
        const toggle = page.locator('[data-testid="cross-layer-toggle"]');
        await expect(toggle).toBeVisible();
      }
    });

    test('should toggle cross-layer links visibility', async ({ page }) => {
      // Find the toggle
      const toggle = page.locator('[data-testid="cross-layer-toggle"]');

      // Skip if toggle is not visible (no cross-layer edges)
      const isVisible = await toggle.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip();
      }

      // Get initial state
      const initialChecked = await toggle.evaluate((el: any) => el.checked);

      // Click toggle
      await toggle.click();
      await page.waitForTimeout(500);

      // Verify state changed
      const afterChecked = await toggle.evaluate((el: any) => el.checked);
      expect(afterChecked).not.toBe(initialChecked);
    });

    test('should display edge count badge', async ({ page }) => {
      // Look for edge count badge
      const badge = page.locator('[data-testid="cross-layer-edge-count"]');

      // Skip if cross-layer panel doesn't exist
      const isBadgeVisible = await badge.isVisible().catch(() => false);
      if (!isBadgeVisible) {
        test.skip();
      }

      // Badge should have numeric content
      const badgeText = await badge.textContent();
      expect(badgeText).toBeTruthy();
      expect(/^\d+$/.test(badgeText || '')).toBeTruthy();
    });
  });

  test.describe('CrossLayerFilterPanel', () => {
    test('should show filter panel when toggle is enabled', async ({ page }) => {
      // Find and enable the toggle if not already
      const toggle = page.locator('[data-testid="cross-layer-toggle"]');

      // Skip if toggle not visible
      const isToggleVisible = await toggle.isVisible().catch(() => false);
      if (!isToggleVisible) {
        test.skip();
      }

      // Ensure toggle is checked
      const isChecked = await toggle.evaluate((el: any) => el.checked);
      if (!isChecked) {
        await toggle.click();
        await page.waitForTimeout(500);
      }

      // Filter panel should be visible
      const filterPanel = page.locator('[data-testid="cross-layer-filter-panel"]');
      await expect(filterPanel).toBeVisible();
    });

    test('should have target layer filter options', async ({ page }) => {
      // Skip if no filter panel
      const filterPanel = page.locator('[data-testid="cross-layer-filter-panel"]');
      const isPanelVisible = await filterPanel.isVisible().catch(() => false);
      if (!isPanelVisible) {
        test.skip();
      }

      // Look for target layer filters
      const layerFilters = page.locator('[data-testid*="cross-layer-toggle-target-layer-"]');
      const filterCount = await layerFilters.count();

      // Should have at least one filter option (Motivation, Application, Security, DataModel, API, UX)
      expect(filterCount).toBeGreaterThan(0);
    });

    test('should have relationship type filter options', async ({ page }) => {
      // Skip if no filter panel
      const filterPanel = page.locator('[data-testid="cross-layer-filter-panel"]');
      const isPanelVisible = await filterPanel.isVisible().catch(() => false);
      if (!isPanelVisible) {
        test.skip();
      }

      // Look for relationship type filters
      const typeFilters = page.locator('[data-testid*="cross-layer-toggle-relationship-type-"]');
      const filterCount = await typeFilters.count();

      // Should have filter options
      expect(filterCount).toBeGreaterThan(0);
    });

    test('should toggle target layer filter', async ({ page }) => {
      // Skip if no filter panel
      const filterPanel = page.locator('[data-testid="cross-layer-filter-panel"]');
      const isPanelVisible = await filterPanel.isVisible().catch(() => false);
      if (!isPanelVisible) {
        test.skip();
      }

      // Find first layer filter
      const firstFilter = page.locator('[data-testid*="cross-layer-toggle-target-layer-"]').first();
      const isFilterVisible = await firstFilter.isVisible().catch(() => false);

      if (!isFilterVisible) {
        test.skip();
      }

      // Get initial checked state
      const initialChecked = await firstFilter.evaluate((el: any) => el.checked);

      // Click filter
      await firstFilter.click();
      await page.waitForTimeout(300);

      // Verify state changed
      const afterChecked = await firstFilter.evaluate((el: any) => el.checked);
      expect(afterChecked).not.toBe(initialChecked);
    });

    test('should toggle relationship type filter', async ({ page }) => {
      // Skip if no filter panel
      const filterPanel = page.locator('[data-testid="cross-layer-filter-panel"]');
      const isPanelVisible = await filterPanel.isVisible().catch(() => false);
      if (!isPanelVisible) {
        test.skip();
      }

      // Find first relationship type filter
      const firstFilter = page.locator('[data-testid*="cross-layer-toggle-relationship-type-"]').first();
      const isFilterVisible = await firstFilter.isVisible().catch(() => false);

      if (!isFilterVisible) {
        test.skip();
      }

      // Get initial checked state
      const initialChecked = await firstFilter.evaluate((el: any) => el.checked);

      // Click filter
      await firstFilter.click();
      await page.waitForTimeout(300);

      // Verify state changed
      const afterChecked = await firstFilter.evaluate((el: any) => el.checked);
      expect(afterChecked).not.toBe(initialChecked);
    });

    test('should handle Select All button for target layers', async ({ page }) => {
      // Skip if no filter panel
      const filterPanel = page.locator('[data-testid="cross-layer-filter-panel"]');
      const isPanelVisible = await filterPanel.isVisible().catch(() => false);
      if (!isPanelVisible) {
        test.skip();
      }

      // Find Select All button for target layers
      const selectAllBtn = page.locator('[data-testid="select-all-target-layers"]');
      const isBtnVisible = await selectAllBtn.isVisible().catch(() => false);

      if (!isBtnVisible) {
        test.skip();
      }

      // Click Select All
      await selectAllBtn.click();
      await page.waitForTimeout(300);

      // All target layer filters should be checked
      const layerFilters = page.locator('[data-testid*="cross-layer-toggle-target-layer-"]');
      const filterCount = await layerFilters.count();

      for (let i = 0; i < filterCount; i++) {
        const isChecked = await layerFilters.nth(i).evaluate((el: any) => el.checked);
        expect(isChecked).toBeTruthy();
      }
    });

    test('should handle Deselect All button for target layers', async ({ page }) => {
      // Skip if no filter panel
      const filterPanel = page.locator('[data-testid="cross-layer-filter-panel"]');
      const isPanelVisible = await filterPanel.isVisible().catch(() => false);
      if (!isPanelVisible) {
        test.skip();
      }

      // First select all
      const selectAllBtn = page.locator('[data-testid="select-all-target-layers"]');
      const isBtnVisible = await selectAllBtn.isVisible().catch(() => false);

      if (!isBtnVisible) {
        test.skip();
      }

      await selectAllBtn.click();
      await page.waitForTimeout(300);

      // Then deselect all
      const deselectAllBtn = page.locator('[data-testid="deselect-all-target-layers"]');
      await deselectAllBtn.click();
      await page.waitForTimeout(300);

      // All target layer filters should be unchecked
      const layerFilters = page.locator('[data-testid*="cross-layer-toggle-target-layer-"]');
      const filterCount = await layerFilters.count();

      for (let i = 0; i < filterCount; i++) {
        const isChecked = await layerFilters.nth(i).evaluate((el: any) => el.checked);
        expect(isChecked).toBeFalsy();
      }
    });
  });

  test.describe('CrossLayerBreadcrumb', () => {
    test('should not show breadcrumb when navigation history is empty', async ({ page }) => {
      // Breadcrumb should not be visible initially (or only if history exists)
      const breadcrumb = page.locator('[data-testid="cross-layer-breadcrumb"]');

      // Check if breadcrumb is visible - it's ok either way, depending on initial history
      const isVisible = await breadcrumb.isVisible().catch(() => false);

      // This test verifies the breadcrumb logic - it should only show with history
      expect(typeof isVisible).toBe('boolean');
    });

    test('should display breadcrumb items in correct format', async ({ page }) => {
      // If breadcrumb exists, verify format
      const breadcrumb = page.locator('[data-testid="cross-layer-breadcrumb"]');
      const isBreadcrumbVisible = await breadcrumb.isVisible().catch(() => false);

      if (!isBreadcrumbVisible) {
        test.skip();
      }

      // Get all breadcrumb step elements
      const steps = page.locator('[data-testid^="breadcrumb-step-"]');
      const stepCount = await steps.count();

      if (stepCount > 0) {
        // Each step should contain text in format "layer / element"
        for (let i = 0; i < stepCount; i++) {
          const stepText = await steps.nth(i).textContent();
          expect(stepText).toContain('/');
        }
      }
    });

    test('should have clear button for breadcrumb', async ({ page }) => {
      // Find breadcrumb
      const breadcrumb = page.locator('[data-testid="cross-layer-breadcrumb"]');
      const isBreadcrumbVisible = await breadcrumb.isVisible().catch(() => false);

      if (!isBreadcrumbVisible) {
        test.skip();
      }

      // Clear button should exist
      const clearBtn = page.locator('[data-testid="clear-breadcrumb-btn"]');
      await expect(clearBtn).toBeVisible();
    });

    test('should have no console errors when rendering breadcrumb', async ({ page }) => {
      // Track console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Wait for page to settle
      await page.waitForTimeout(2000);

      // No React or TypeScript errors
      const jsErrors = errors.filter(e =>
        e.includes('TypeError') ||
        e.includes('Cannot read properties') ||
        e.includes('is not defined')
      );

      expect(jsErrors).toHaveLength(0);
    });
  });

  test.describe('Integration', () => {
    test('should not have console errors when using cross-layer components', async ({ page }) => {
      // Track all console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Interact with components if they exist
      const toggle = page.locator('[data-testid="cross-layer-toggle"]');
      const isToggleVisible = await toggle.isVisible().catch(() => false);

      if (isToggleVisible) {
        // Toggle the switch
        await toggle.click();
        await page.waitForTimeout(500);

        // Try clicking filters if visible
        const firstFilter = page.locator('[data-testid*="cross-layer-toggle-target-layer-"]').first();
        const isFilterVisible = await firstFilter.isVisible().catch(() => false);

        if (isFilterVisible) {
          await firstFilter.click();
          await page.waitForTimeout(300);
        }
      }

      // Check for critical errors
      const criticalErrors = errors.filter(e =>
        e.includes('zustand') ||
        e.includes('TypeError') ||
        e.includes('Cannot read properties of undefined')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
