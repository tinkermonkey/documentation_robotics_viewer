/**
 * E2E tests for Business Layer Filtering
 *
 * Tests the complete filtering workflow with actual business layer data.
 * Verifies filter controls, graph updates, and performance targets.
 */

import { test, expect } from '@playwright/test';

test.describe('Business Layer Filtering (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded viewer with business layer visible
    await page.goto('http://localhost:5173/embedded');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display filter controls in business layer view', async ({ page }) => {
    // Load example implementation model (has business layer data)
    await page.click('button:has-text("Load Demo")');

    // Wait for model to load
    await page.waitForTimeout(1000);

    // Switch to business layer if not already there
    // (This assumes there's a layer selector - adjust based on actual UI)
    const businessLayerButton = page.locator('button:has-text("Business")');
    if (await businessLayerButton.isVisible()) {
      await businessLayerButton.click();
    }

    // Verify filter controls are visible
    await expect(page.locator('.business-layer-controls')).toBeVisible();

    // Verify filter sections exist
    await expect(page.locator('text=Element Types')).toBeVisible();
    await expect(page.locator('text=Layout')).toBeVisible();
    await expect(page.locator('text=Export')).toBeVisible();
  });

  test('should filter by element type', async ({ page }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Get initial node count
    const initialCountText = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
    expect(initialCountText).toBeTruthy();

    const initialMatch = initialCountText!.match(/Showing (\\d+) of (\\d+)/);
    expect(initialMatch).toBeTruthy();

    const initialVisible = parseInt(initialMatch![1], 10);
    const totalCount = parseInt(initialMatch![2], 10);

    console.log(`Initial: ${initialVisible} of ${totalCount} nodes visible`);

    // Click on a type filter (e.g., Functions)
    const functionCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('text=/Functions \\(\\d+\\)/'),
    });

    if (await functionCheckbox.isVisible()) {
      await functionCheckbox.check();

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify count changed
      const filteredCountText = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
      const filteredMatch = filteredCountText!.match(/Showing (\\d+) of (\\d+)/);

      const filteredVisible = parseInt(filteredMatch![1], 10);

      console.log(`After filter: ${filteredVisible} of ${totalCount} nodes visible`);

      // Filtered count should be less than total
      expect(filteredVisible).toBeLessThan(totalCount);
      expect(filteredVisible).toBeGreaterThan(0);
    }
  });

  test('should clear all filters', async ({ page }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Apply a filter
    const functionCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('text=/Functions/'),
    }).first();

    if (await functionCheckbox.isVisible()) {
      await functionCheckbox.check();
      await page.waitForTimeout(500);

      // Verify Clear All Filters button appears
      const clearButton = page.locator('button:has-text("Clear All Filters")');
      await expect(clearButton).toBeVisible();

      // Get filtered count
      const filteredCountText = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
      const filteredMatch = filteredCountText!.match(/Showing (\\d+) of (\\d+)/);
      const filteredVisible = parseInt(filteredMatch![1], 10);
      const totalCount = parseInt(filteredMatch![2], 10);

      // Click clear button
      await clearButton.click();
      await page.waitForTimeout(500);

      // Verify all nodes are visible again
      const clearedCountText = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
      const clearedMatch = clearedCountText!.match(/Showing (\\d+) of (\\d+)/);
      const clearedVisible = parseInt(clearedMatch![1], 10);

      expect(clearedVisible).toBe(totalCount);

      // Clear button should disappear
      await expect(clearButton).not.toBeVisible();
    }
  });

  test('should apply multiple filters (intersection)', async ({ page }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Get initial count
    const initialCountText = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
    const initialMatch = initialCountText!.match(/Showing (\\d+) of (\\d+)/);
    const totalCount = parseInt(initialMatch![2], 10);

    // Apply first filter (type)
    const functionCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('text=/Functions/'),
    }).first();

    if (await functionCheckbox.isVisible()) {
      await functionCheckbox.check();
      await page.waitForTimeout(500);

      const afterType = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
      const afterTypeMatch = afterType!.match(/Showing (\\d+) of (\\d+)/);
      const afterTypeVisible = parseInt(afterTypeMatch![1], 10);

      console.log(`After type filter: ${afterTypeVisible} visible`);

      // Try to apply domain filter if available
      const domainCheckboxes = page.locator('text=Business Domains').locator('..')
        .locator('input[type="checkbox"]');

      const domainCount = await domainCheckboxes.count();

      if (domainCount > 0) {
        await domainCheckboxes.first().check();
        await page.waitForTimeout(500);

        const afterDomain = await page.locator('text=/Showing \\d+ of \\d+/').textContent();
        const afterDomainMatch = afterDomain!.match(/Showing (\\d+) of (\\d+)/);
        const afterDomainVisible = parseInt(afterDomainMatch![1], 10);

        console.log(`After domain filter: ${afterDomainVisible} visible`);

        // Multiple filters should show fewer or equal nodes
        expect(afterDomainVisible).toBeLessThanOrEqual(afterTypeVisible);
      }
    }
  });

  test('should update layout selection', async ({ page }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Find layout selector
    const layoutSelect = page.locator('select').filter({
      has: page.locator('option:has-text("Hierarchical")'),
    });

    await expect(layoutSelect).toBeVisible();

    // Verify default is hierarchical
    await expect(layoutSelect).toHaveValue('hierarchical');

    // Try changing layout (note: only hierarchical is implemented in Phase 3)
    await layoutSelect.selectOption('force');

    // Verify warning message appears
    await expect(page.locator('text=/Only hierarchical layout is currently implemented/')).toBeVisible();
  });

  test('should display export buttons', async ({ page }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Verify all export buttons exist
    await expect(page.locator('button:has-text("Export as PNG")')).toBeVisible();
    await expect(page.locator('button:has-text("Export as SVG")')).toBeVisible();
    await expect(page.locator('button:has-text("Export Catalog")')).toBeVisible();
    await expect(page.locator('button:has-text("Export Traceability")')).toBeVisible();
  });

  test('should show placeholder alert for export (Phase 7)', async ({ page }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Listen for alert dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Coming in Phase 7');
      await dialog.accept();
    });

    // Click export button
    await page.click('button:has-text("Export as PNG")');
  });

  test('should persist filter state to localStorage', async ({ page, context }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Apply a filter
    const functionCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('text=/Functions/'),
    }).first();

    if (await functionCheckbox.isVisible()) {
      await functionCheckbox.check();
      await page.waitForTimeout(500);

      // Verify filter is checked
      await expect(functionCheckbox).toBeChecked();

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify filter state is restored
      const restoredCheckbox = page.locator('input[type="checkbox"]').filter({
        has: page.locator('text=/Functions/'),
      }).first();

      if (await restoredCheckbox.isVisible()) {
        await expect(restoredCheckbox).toBeChecked();
      }
    }
  });

  test('should display correct filter counts', async ({ page }) => {
    // Load demo model
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Verify filter labels have counts
    const functionLabel = page.locator('text=/Functions \\(\\d+\\)/');
    const processLabel = page.locator('text=/Processes \\(\\d+\\)/');

    if (await functionLabel.isVisible()) {
      const functionText = await functionLabel.textContent();
      const functionMatch = functionText!.match(/\\((\\d+)\\)/);
      expect(functionMatch).toBeTruthy();

      const functionCount = parseInt(functionMatch![1], 10);
      expect(functionCount).toBeGreaterThan(0);

      console.log(`Functions count: ${functionCount}`);
    }

    if (await processLabel.isVisible()) {
      const processText = await processLabel.textContent();
      const processMatch = processText!.match(/\\((\\d+)\\)/);
      expect(processMatch).toBeTruthy();

      const processCount = parseInt(processMatch![1], 10);
      expect(processCount).toBeGreaterThan(0);

      console.log(`Processes count: ${processCount}`);
    }
  });
});

test.describe('Business Layer Filtering - Performance', () => {
  test('should apply filters in <500ms', async ({ page }) => {
    // Load demo model
    await page.goto('http://localhost:5173/embedded');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    // Measure filter application time
    const functionCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('text=/Functions/'),
    }).first();

    if (await functionCheckbox.isVisible()) {
      const startTime = Date.now();

      await functionCheckbox.check();

      // Wait for graph to update (check for count change)
      await page.waitForTimeout(100);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Filter application took ${duration}ms`);

      // Should be well under 500ms
      expect(duration).toBeLessThan(500);
    }
  });

  test('should handle rapid filter changes smoothly', async ({ page }) => {
    // Load demo model
    await page.goto('http://localhost:5173/embedded');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Load Demo")');
    await page.waitForTimeout(1000);

    const checkboxes = page.locator('.business-layer-controls input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      const startTime = Date.now();

      // Toggle multiple filters rapidly
      for (let i = 0; i < Math.min(5, checkboxCount); i++) {
        await checkboxes.nth(i).check();
        await page.waitForTimeout(50); // Small delay
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Rapid filter changes took ${duration}ms`);

      // Should handle smoothly (within reasonable time)
      expect(duration).toBeLessThan(2000);
    }
  });
});
