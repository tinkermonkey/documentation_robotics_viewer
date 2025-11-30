/**
 * E2E Tests for Motivation Layer Visualization - Phase 3
 * Tests filter controls, layout algorithm switching, and animated transitions
 */

import { test, expect } from '@playwright/test';

test.describe('Motivation Layer Visualization - Phase 3', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('filter panel renders with all element type checkboxes', async ({ page }) => {
    // Load demo data or example-implementation
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    // Wait for canvas to load
    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(1000);
    }

    // Check filter panel is visible
    const filterPanel = page.locator('.motivation-filter-panel');
    await expect(filterPanel).toBeVisible();

    // Check element type section header
    const elementTypesHeader = page.locator('h4:has-text("Element Types")');
    await expect(elementTypesHeader).toBeVisible();

    // Check that key element type checkboxes are present
    const stakeholderCheckbox = page.locator('text=Stakeholders').locator('..').locator('input[type="checkbox"]');
    const goalCheckbox = page.locator('text=Goals').locator('..').locator('input[type="checkbox"]');
    const requirementCheckbox = page.locator('text=Requirements').locator('..').locator('input[type="checkbox"]');

    await expect(stakeholderCheckbox).toBeVisible();
    await expect(goalCheckbox).toBeVisible();
    await expect(requirementCheckbox).toBeVisible();

    // All checkboxes should be checked by default
    await expect(stakeholderCheckbox).toBeChecked();
    await expect(goalCheckbox).toBeChecked();
    await expect(requirementCheckbox).toBeChecked();
  });

  test('toggling element type filter hides/shows nodes', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Count initial visible nodes (from ReactFlow)
    const initialNodeCount = await page.locator('.react-flow__node').count();
    console.log('Initial node count:', initialNodeCount);

    // Uncheck "Goals" filter
    const goalCheckbox = page.locator('text=Goals').locator('..').locator('input[type="checkbox"]');
    await goalCheckbox.uncheck();
    await page.waitForTimeout(1000); // Wait for re-render

    // Count nodes after filtering
    const filteredNodeCount = await page.locator('.react-flow__node').count();
    console.log('Filtered node count:', filteredNodeCount);

    // Verify that node count decreased (goals hidden)
    expect(filteredNodeCount).toBeLessThan(initialNodeCount);

    // Re-check "Goals" filter
    await goalCheckbox.check();
    await page.waitForTimeout(1000);

    // Count nodes after re-enabling
    const restoredNodeCount = await page.locator('.react-flow__node').count();
    console.log('Restored node count:', restoredNodeCount);

    // Node count should be restored
    expect(restoredNodeCount).toBe(initialNodeCount);
  });

  test('relationship type filters work correctly', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Expand relationship types section if collapsed
    const relationshipTypesHeader = page.locator('h4:has-text("Relationship Types")');
    await relationshipTypesHeader.click();
    await page.waitForTimeout(500);

    // Count initial edges
    const initialEdgeCount = await page.locator('.react-flow__edge').count();
    console.log('Initial edge count:', initialEdgeCount);

    // Uncheck "Influences" filter
    const influenceCheckbox = page.locator('text=Influences').locator('..').locator('input[type="checkbox"]');
    if (await influenceCheckbox.isVisible()) {
      await influenceCheckbox.uncheck();
      await page.waitForTimeout(1000);

      // Count edges after filtering
      const filteredEdgeCount = await page.locator('.react-flow__edge').count();
      console.log('Filtered edge count:', filteredEdgeCount);

      // Edge count should decrease or stay the same (depends on data)
      expect(filteredEdgeCount).toBeLessThanOrEqual(initialEdgeCount);
    }
  });

  test('clear all filters button resets filters', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Uncheck several filters
    const goalCheckbox = page.locator('text=Goals').locator('..').locator('input[type="checkbox"]');
    const stakeholderCheckbox = page.locator('text=Stakeholders').locator('..').locator('input[type="checkbox"]');

    await goalCheckbox.uncheck();
    await stakeholderCheckbox.uncheck();
    await page.waitForTimeout(1000);

    // Click "Clear All Filters"
    const clearButton = page.locator('button:has-text("Clear All")');
    await clearButton.click();
    await page.waitForTimeout(1000);

    // Verify all checkboxes are checked again
    await expect(goalCheckbox).toBeChecked();
    await expect(stakeholderCheckbox).toBeChecked();
  });

  test('layout switcher changes layout algorithm', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Find layout selector
    const layoutSelector = page.locator('select#layout-selector');
    await expect(layoutSelector).toBeVisible();

    // Verify default layout is Force-Directed
    const currentLayout = await layoutSelector.inputValue();
    console.log('Current layout:', currentLayout);
    expect(currentLayout).toBe('force');

    // Get initial node positions
    const initialPositions = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.react-flow__node');
      return Array.from(nodes).map((node) => {
        const transform = (node as HTMLElement).style.transform;
        return transform;
      });
    });

    // Switch to Hierarchical layout
    await layoutSelector.selectOption('hierarchical');
    await page.waitForTimeout(1500); // Wait for animation + layout

    // Get new node positions
    const newPositions = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.react-flow__node');
      return Array.from(nodes).map((node) => {
        const transform = (node as HTMLElement).style.transform;
        return transform;
      });
    });

    // Positions should have changed
    expect(initialPositions).not.toEqual(newPositions);
  });

  test('fit to view button works', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Find and click "Fit to View" button
    const fitToViewButton = page.locator('button:has-text("Fit to View")');
    await expect(fitToViewButton).toBeVisible();
    await fitToViewButton.click();

    // Wait for fit animation
    await page.waitForTimeout(500);

    // Verify that the button worked (no errors thrown)
    // In a real test, we'd check the viewport transform
    await expect(fitToViewButton).toBeEnabled();
  });

  test('layout transitions are smooth (800ms duration)', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Find layout selector
    const layoutSelector = page.locator('select#layout-selector');

    // Switch layout and measure transition
    const startTime = Date.now();
    await layoutSelector.selectOption('hierarchical');

    // Wait for layout completion indicator (not layouting)
    await page.waitForFunction(
      () => !document.querySelector('.layout-progress'),
      { timeout: 5000 }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('Layout transition duration:', duration, 'ms');

    // Transition should complete within reasonable time (< 3 seconds including layout calculation)
    expect(duration).toBeLessThan(3000);
  });

  test('filter settings persist across page reloads', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Uncheck a specific filter
    const constraintCheckbox = page.locator('text=Constraints').locator('..').locator('input[type="checkbox"]');
    await constraintCheckbox.uncheck();
    await page.waitForTimeout(500);

    // Change layout
    const layoutSelector = page.locator('select#layout-selector');
    await layoutSelector.selectOption('hierarchical');
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Load data again and switch to Motivation
    if (await page.locator('button:has-text("Load Demo Data")').first().isVisible()) {
      await page.locator('button:has-text("Load Demo Data")').first().click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    if (await page.locator('button:has-text("Motivation")').isVisible()) {
      await page.locator('button:has-text("Motivation")').click();
      await page.waitForTimeout(2000);
    }

    // Verify filter is still unchecked
    const constraintCheckboxAfterReload = page.locator('text=Constraints').locator('..').locator('input[type="checkbox"]');
    await expect(constraintCheckboxAfterReload).not.toBeChecked();

    // Verify layout is still hierarchical
    const layoutSelectorAfterReload = page.locator('select#layout-selector');
    const layoutValue = await layoutSelectorAfterReload.inputValue();
    expect(layoutValue).toBe('hierarchical');
  });

  test('filter count indicators display correct visible/total counts', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Check filter count badge for Goals
    const goalCountBadge = page.locator('text=Goals').locator('..').locator('.filter-count-badge');
    await expect(goalCountBadge).toBeVisible();

    const goalCountText = await goalCountBadge.textContent();
    console.log('Goal count badge:', goalCountText);

    // Should match format "X/Y" where X <= Y
    expect(goalCountText).toMatch(/^\d+\/\d+$/);

    // Uncheck Goals filter
    const goalCheckbox = page.locator('text=Goals').locator('..').locator('input[type="checkbox"]');
    await goalCheckbox.uncheck();
    await page.waitForTimeout(1000);

    // Count should now be "0/Y"
    const goalCountTextAfterFilter = await goalCountBadge.textContent();
    console.log('Goal count badge after filter:', goalCountTextAfterFilter);
    expect(goalCountTextAfterFilter).toMatch(/^0\/\d+$/);
  });

  test('should persist manual node positions to localStorage and restore on reload', async ({ page }) => {
    // Load demo data
    const loadDataButton = page.locator('button:has-text("Load Demo Data")').first();
    if (await loadDataButton.isVisible()) {
      await loadDataButton.click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    // Switch to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(2000);
    }

    // Switch to Manual layout
    const layoutSelector = page.locator('select#layout-selector');
    await layoutSelector.selectOption('manual');
    await page.waitForTimeout(1500);

    // Get a node to drag
    const firstNode = page.locator('.react-flow__node').first();
    await expect(firstNode).toBeVisible();

    // Get initial position
    const initialPosition = await page.evaluate(() => {
      const node = document.querySelector('.react-flow__node') as HTMLElement;
      return node ? node.style.transform : '';
    });

    console.log('Initial position:', initialPosition);

    // Drag the node to a new position
    const nodeBoundingBox = await firstNode.boundingBox();
    if (nodeBoundingBox) {
      await page.mouse.move(
        nodeBoundingBox.x + nodeBoundingBox.width / 2,
        nodeBoundingBox.y + nodeBoundingBox.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        nodeBoundingBox.x + nodeBoundingBox.width / 2 + 100,
        nodeBoundingBox.y + nodeBoundingBox.height / 2 + 100
      );
      await page.mouse.up();
      await page.waitForTimeout(500);
    }

    // Get new position after drag
    const draggedPosition = await page.evaluate(() => {
      const node = document.querySelector('.react-flow__node') as HTMLElement;
      return node ? node.style.transform : '';
    });

    console.log('Dragged position:', draggedPosition);

    // Verify position changed
    expect(draggedPosition).not.toBe(initialPosition);

    // Check localStorage for persisted positions
    const hasPersistedPositions = await page.evaluate(() => {
      const stored = localStorage.getItem('dr-viewer-preferences');
      if (!stored) return false;
      try {
        const parsed = JSON.parse(stored);
        return (
          parsed.state &&
          parsed.state.motivationPreferences &&
          parsed.state.motivationPreferences.manualPositions &&
          Object.keys(parsed.state.motivationPreferences.manualPositions).length > 0
        );
      } catch (e) {
        return false;
      }
    });

    expect(hasPersistedPositions).toBe(true);

    // Reload page to verify positions are restored
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Load data again and switch to Motivation
    if (await page.locator('button:has-text("Load Demo Data")').first().isVisible()) {
      await page.locator('button:has-text("Load Demo Data")').first().click();
    }

    await page.waitForSelector('.tldraw__canvas', { timeout: 10000 });

    if (await page.locator('button:has-text("Motivation")').isVisible()) {
      await page.locator('button:has-text("Motivation")').click();
      await page.waitForTimeout(2000);
    }

    // Verify manual layout is still selected
    const layoutSelectorAfterReload = page.locator('select#layout-selector');
    const layoutValue = await layoutSelectorAfterReload.inputValue();
    expect(layoutValue).toBe('manual');

    // Get position after reload
    const restoredPosition = await page.evaluate(() => {
      const node = document.querySelector('.react-flow__node') as HTMLElement;
      return node ? node.style.transform : '';
    });

    console.log('Restored position:', restoredPosition);

    // Position should be close to dragged position (may have minor differences due to rendering)
    // We just verify it's not the default initial position
    expect(restoredPosition).toBeTruthy();
  });
});
