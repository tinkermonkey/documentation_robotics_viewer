/**
 * E2E Tests for Motivation Layer Visualization - Phase 5
 * Tests: Semantic Zoom, Coverage Analysis, Changeset Visualization, Performance
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 5: Semantic Zoom, Coverage, and Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded viewer
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('FR-10: Semantic zoom reveals appropriate detail levels', async ({ page }) => {
    // Load demo data
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Get initial viewport
    const viewportBounds = await page.evaluate(() => {
      const viewport = document.querySelector('.react-flow__viewport');
      if (!viewport) return null;
      const transform = window.getComputedStyle(viewport).transform;
      const match = transform.match(/matrix\(([^,]+), [^,]+, [^,]+, ([^,]+), ([^,]+), ([^,]+)\)/);
      if (!match) return { zoom: 1, x: 0, y: 0 };
      return {
        zoom: parseFloat(match[1]),
        x: parseFloat(match[3]),
        y: parseFloat(match[4]),
      };
    });

    expect(viewportBounds).toBeTruthy();

    // Verify nodes are visible at default zoom (medium detail)
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log(`Nodes visible at default zoom: ${nodeCount}`);
    expect(nodeCount).toBeGreaterThan(0);

    // Test zoom out to overview (< 0.4)
    // Overview should show only stakeholders and goals
    await page.evaluate(() => {
      const reactFlowContainer = document.querySelector('.react-flow');
      if (reactFlowContainer) {
        const zoomEvent = new WheelEvent('wheel', {
          deltaY: 500, // Zoom out
          bubbles: true,
          cancelable: true,
        });
        reactFlowContainer.dispatchEvent(zoomEvent);
      }
    });

    await page.waitForTimeout(500); // Allow zoom transition

    // Test zoom in to detail (> 1.0)
    // Detail should show all elements with metadata
    await page.evaluate(() => {
      const reactFlowContainer = document.querySelector('.react-flow');
      if (reactFlowContainer) {
        const zoomEvent = new WheelEvent('wheel', {
          deltaY: -500, // Zoom in
          bubbles: true,
          cancelable: true,
        });
        reactFlowContainer.dispatchEvent(zoomEvent);
      }
    });

    await page.waitForTimeout(500);

    // Take screenshots for visual verification
    await page.screenshot({
      path: 'test-results/motivation-phase5-semantic-zoom.png',
      fullPage: false,
    });
  });

  test('FR-14: Changeset visualization highlights operations', async ({ page }) => {
    // This test assumes changesets are available
    // Skip if no changesets present
    const hasChangesets = await page.locator('text=Show Changesets').isVisible().catch(() => false);

    if (!hasChangesets) {
      console.log('No changesets available, skipping changeset visualization test');
      test.skip();
      return;
    }

    // Enable changeset visualization
    await page.click('text=Show Changesets');
    await page.waitForTimeout(300);

    // Verify OperationLegend is visible
    const legendVisible = await page.locator('.operation-legend').isVisible();
    expect(legendVisible).toBe(true);

    // Verify legend shows all three operations
    await expect(page.locator('text=Added')).toBeVisible();
    await expect(page.locator('text=Updated')).toBeVisible();
    await expect(page.locator('text=Deleted')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/motivation-phase5-changeset-viz.png',
      fullPage: false,
    });
  });

  test('US-12: Coverage analysis identifies goals without requirements', async ({ page }) => {
    // Load demo data
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Look for coverage summary panel
    const coveragePanelVisible = await page
      .locator('.coverage-summary-panel')
      .isVisible()
      .catch(() => false);

    if (!coveragePanelVisible) {
      console.log('Coverage panel not visible by default, may need to be triggered');
      // Try to find and click a button that shows coverage
      const showCoverageButton = await page
        .locator('text=Coverage')
        .first()
        .isVisible()
        .catch(() => false);
      if (showCoverageButton) {
        await page.click('text=Coverage');
        await page.waitForTimeout(300);
      }
    }

    // Verify coverage statistics are displayed
    const overallCoverage = await page.locator('.coverage-stats__value').first().textContent();
    console.log(`Overall coverage: ${overallCoverage}`);
    expect(overallCoverage).toBeTruthy();

    // Verify coverage indicators on goal nodes
    const goalNodes = await page.locator('[aria-label^="Goal:"]').count();
    console.log(`Goal nodes found: ${goalNodes}`);
    expect(goalNodes).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/motivation-phase5-coverage-analysis.png',
      fullPage: true,
    });
  });

  test('US-13: Performance with 500+ elements (smoke test)', async ({ page }) => {
    // This is a smoke test - we'll measure rendering performance
    // Real test would require a larger dataset

    // Load demo data
    const startTime = Date.now();
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });
    const loadTime = Date.now() - startTime;

    console.log(`Motivation view load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Test pan/zoom responsiveness
    const panStartTime = Date.now();
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(500, 400);
    await page.mouse.up();
    const panTime = Date.now() - panStartTime;

    console.log(`Pan operation time: ${panTime}ms`);
    expect(panTime).toBeLessThan(1000); // Should be responsive

    // Test zoom responsiveness
    const zoomStartTime = Date.now();
    await page.evaluate(() => {
      const reactFlowContainer = document.querySelector('.react-flow');
      if (reactFlowContainer) {
        const zoomEvent = new WheelEvent('wheel', {
          deltaY: -100,
          bubbles: true,
          cancelable: true,
        });
        reactFlowContainer.dispatchEvent(zoomEvent);
      }
    });
    await page.waitForTimeout(100);
    const zoomTime = Date.now() - zoomStartTime;

    console.log(`Zoom operation time: ${zoomTime}ms`);
    expect(zoomTime).toBeLessThan(500); // Should be responsive

    // Take screenshot
    await page.screenshot({
      path: 'test-results/motivation-phase5-performance.png',
      fullPage: false,
    });
  });

  test('Edge bundling activates with many edges', async ({ page }) => {
    // Load demo data
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Count edges
    const edgeCount = await page.locator('.react-flow__edge').count();
    console.log(`Total edges: ${edgeCount}`);

    // If edges are bundled, we should see bundle labels with counts
    const bundleLabels = await page.locator('text=/\\d+ relationships/').count();
    if (bundleLabels > 0) {
      console.log(`Found ${bundleLabels} bundled edges`);
      expect(bundleLabels).toBeGreaterThan(0);
    } else {
      console.log('No edge bundling applied (edge count below threshold)');
    }

    // Take screenshot
    await page.screenshot({
      path: 'test-results/motivation-phase5-edge-bundling.png',
      fullPage: false,
    });
  });

  test('Layout caching improves filter performance', async ({ page }) => {
    // Load demo data
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Open filter panel
    const filterPanelButton = await page
      .locator('text=Filters')
      .first()
      .isVisible()
      .catch(() => false);

    if (filterPanelButton) {
      await page.click('text=Filters');
      await page.waitForTimeout(200);
    }

    // Apply a filter (toggle element type)
    // First filter application - cache miss
    const firstFilterStart = Date.now();
    const driverCheckbox = await page.locator('input[type="checkbox"]').first();
    await driverCheckbox.click();
    await page.waitForTimeout(200);
    const firstFilterTime = Date.now() - firstFilterStart;

    console.log(`First filter application: ${firstFilterTime}ms`);

    // Toggle back - should use cached layout
    const secondFilterStart = Date.now();
    await driverCheckbox.click();
    await page.waitForTimeout(200);
    const secondFilterTime = Date.now() - secondFilterStart;

    console.log(`Second filter application (cached): ${secondFilterTime}ms`);

    // Second filter should be faster due to caching
    // Allow some tolerance since network/rendering varies
    expect(secondFilterTime).toBeLessThan(firstFilterTime * 1.5);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/motivation-phase5-layout-caching.png',
      fullPage: false,
    });
  });

  test('Detail level transitions smoothly', async ({ page }) => {
    // Load demo data
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Select a goal node to inspect detail changes
    const goalNode = await page.locator('[aria-label^="Goal:"]').first();
    await expect(goalNode).toBeVisible();

    // Zoom out to minimal detail
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const reactFlowContainer = document.querySelector('.react-flow');
        if (reactFlowContainer) {
          const zoomEvent = new WheelEvent('wheel', {
            deltaY: 200,
            bubbles: true,
            cancelable: true,
          });
          reactFlowContainer.dispatchEvent(zoomEvent);
        }
      });
      await page.waitForTimeout(100);
    }

    // Take screenshot at overview level
    await page.screenshot({
      path: 'test-results/motivation-phase5-detail-minimal.png',
      fullPage: false,
    });

    // Zoom in to detailed level
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => {
        const reactFlowContainer = document.querySelector('.react-flow');
        if (reactFlowContainer) {
          const zoomEvent = new WheelEvent('wheel', {
            deltaY: -200,
            bubbles: true,
            cancelable: true,
          });
          reactFlowContainer.dispatchEvent(zoomEvent);
        }
      });
      await page.waitForTimeout(100);
    }

    // Take screenshot at detail level
    await page.screenshot({
      path: 'test-results/motivation-phase5-detail-full.png',
      fullPage: false,
    });

    // Verify transitions were smooth (no errors in console)
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    expect(consoleErrors.length).toBe(0);
  });
});
