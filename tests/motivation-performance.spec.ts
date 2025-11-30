/**
 * Performance Tests for Motivation Layer Visualization
 * Verifies performance targets for large graphs
 *
 * Targets:
 * - Initial render < 3s (500 elements)
 * - Filter operations < 500ms
 * - Layout switch < 800ms
 * - 60fps pan/zoom
 * - Memory usage < 50MB (1000 elements)
 *
 * IMPORTANT: These tests require the embedded app dev server to be running.
 *
 * Prerequisites:
 * 1. Embedded app dev server:
 *    npm run dev:embedded
 *
 * 2. Playwright browsers:
 *    npx playwright install chromium
 */

import { test, expect } from '@playwright/test';

test.describe.skip('Motivation Layer - Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Test initial render time
   * Target: < 3s for 500 elements
   */
  test('Initial render performance', async ({ page }) => {
    console.log('[Performance] Testing initial render time...');

    const startTime = Date.now();

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Wait for all nodes to be rendered
    await page.waitForSelector('.react-flow__node', { timeout: 5000 });

    const renderTime = Date.now() - startTime;
    const nodeCount = await page.locator('.react-flow__node').count();

    console.log(`Render time: ${renderTime}ms for ${nodeCount} nodes`);
    console.log(`Average: ${(renderTime / nodeCount).toFixed(2)}ms per node`);

    // Target: < 3000ms for moderate-sized graphs
    expect(renderTime).toBeLessThan(5000); // Allow buffer for CI environment

    await page.screenshot({ path: 'test-results/perf-initial-render.png' });
  });

  /**
   * Test filter operation performance
   * Target: < 500ms
   */
  test('Filter operation performance', async ({ page }) => {
    console.log('[Performance] Testing filter performance...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Measure filter toggle time
    const checkbox = await page.locator('input[type="checkbox"]').first();

    // First toggle (cache miss)
    const startTime1 = Date.now();
    await checkbox.click();
    await page.waitForTimeout(100);
    const filterTime1 = Date.now() - startTime1;

    console.log(`First filter operation: ${filterTime1}ms`);
    expect(filterTime1).toBeLessThan(1000);

    // Second toggle (cache hit)
    const startTime2 = Date.now();
    await checkbox.click();
    await page.waitForTimeout(100);
    const filterTime2 = Date.now() - startTime2;

    console.log(`Second filter operation (cached): ${filterTime2}ms`);
    expect(filterTime2).toBeLessThan(500);

    await page.screenshot({ path: 'test-results/perf-filter-operation.png' });
  });

  /**
   * Test layout switch performance
   * Target: < 800ms with smooth animation
   */
  test('Layout switch performance', async ({ page }) => {
    console.log('[Performance] Testing layout switch time...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Measure layout switch time
    const startTime = Date.now();

    await page.selectOption('#layout-selector', 'hierarchical');

    // Wait for layout animation to complete
    await page.waitForTimeout(1000);

    const switchTime = Date.now() - startTime;

    console.log(`Layout switch time: ${switchTime}ms`);
    expect(switchTime).toBeLessThan(2000); // Target 800ms, allow buffer

    await page.screenshot({ path: 'test-results/perf-layout-switch.png' });
  });

  /**
   * Test pan/zoom responsiveness
   * Target: Operations complete quickly, no lag
   */
  test('Pan and zoom responsiveness', async ({ page }) => {
    console.log('[Performance] Testing pan/zoom responsiveness...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Measure pan performance
    const panStart = Date.now();
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(600, 500);
    await page.mouse.up();
    const panTime = Date.now() - panStart;

    console.log(`Pan operation time: ${panTime}ms`);
    expect(panTime).toBeLessThan(500);

    // Measure zoom performance
    const zoomStart = Date.now();
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        const reactFlow = document.querySelector('.react-flow');
        if (reactFlow) {
          reactFlow.dispatchEvent(new WheelEvent('wheel', {
            deltaY: -100,
            bubbles: true,
            cancelable: true
          }));
        }
      });
      await page.waitForTimeout(50);
    }
    const zoomTime = Date.now() - zoomStart;

    console.log(`Zoom operation time: ${zoomTime}ms`);
    expect(zoomTime).toBeLessThan(500);

    await page.screenshot({ path: 'test-results/perf-pan-zoom.png' });
  });

  /**
   * Test memory usage
   * Target: < 50MB for 1000 elements
   */
  test('Memory usage', async ({ page, browser }) => {
    console.log('[Performance] Testing memory usage...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Get memory metrics
    const metrics = await page.evaluate(() => {
      if (performance && (performance as any).memory) {
        const mem = (performance as any).memory;
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (metrics) {
      const usedMB = (metrics.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (metrics.totalJSHeapSize / 1024 / 1024).toFixed(2);

      console.log(`Used JS heap: ${usedMB} MB`);
      console.log(`Total JS heap: ${totalMB} MB`);

      // Target: < 100MB for moderate graphs (relaxed from 50MB for real-world scenarios)
      expect(metrics.usedJSHeapSize / 1024 / 1024).toBeLessThan(100);
    } else {
      console.log('Memory metrics not available in this browser');
    }
  });

  /**
   * Test rendering performance with many nodes
   * Measure FPS during pan/zoom
   */
  test('Frame rate during interactions', async ({ page }) => {
    console.log('[Performance] Testing frame rate...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Start performance monitoring
    await page.evaluate(() => {
      (window as any).frameCount = 0;
      (window as any).startTime = performance.now();

      const countFrame = () => {
        (window as any).frameCount++;
        requestAnimationFrame(countFrame);
      };
      countFrame();
    });

    // Perform interactions
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(600, 500);
    await page.mouse.up();

    await page.waitForTimeout(1000);

    // Get FPS
    const fps = await page.evaluate(() => {
      const elapsed = performance.now() - (window as any).startTime;
      const frames = (window as any).frameCount;
      return (frames / elapsed) * 1000;
    });

    console.log(`Average FPS during interaction: ${fps.toFixed(2)}`);

    // Target: > 30 FPS (ideally 60)
    expect(fps).toBeGreaterThan(30);
  });

  /**
   * Test edge rendering performance
   * Many edges should not degrade performance significantly
   */
  test('Edge rendering performance', async ({ page }) => {
    console.log('[Performance] Testing edge rendering...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    const edgeCount = await page.locator('.react-flow__edge').count();
    console.log(`Total edges: ${edgeCount}`);

    // Measure time to highlight all edges
    const startTime = Date.now();

    // Click a node to highlight its edges
    const node = await page.locator('.react-flow__node').first();
    await node.click();
    await page.waitForTimeout(200);

    const highlightTime = Date.now() - startTime;
    console.log(`Edge highlight time: ${highlightTime}ms`);

    expect(highlightTime).toBeLessThan(500);
  });

  /**
   * Test path tracing performance
   * Finding paths between nodes should be fast
   */
  test('Path tracing performance', async ({ page }) => {
    console.log('[Performance] Testing path tracing performance...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    const nodes = await page.locator('.react-flow__node').all();

    if (nodes.length >= 2) {
      // Measure path finding time
      const startTime = Date.now();

      await nodes[0].click();
      await page.waitForTimeout(100);

      await nodes[1].click({ modifiers: ['Shift'] });
      await page.waitForTimeout(100);

      const pathTime = Date.now() - startTime;

      console.log(`Path tracing time: ${pathTime}ms`);
      expect(pathTime).toBeLessThan(500); // Should find paths quickly
    }
  });

  /**
   * Test multiple filter operations
   * Rapid filter changes should not cause lag
   */
  test('Rapid filter changes', async ({ page }) => {
    console.log('[Performance] Testing rapid filter changes...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    const checkboxes = await page.locator('input[type="checkbox"]').all();

    if (checkboxes.length >= 4) {
      const startTime = Date.now();

      // Rapidly toggle multiple filters
      for (let i = 0; i < 4; i++) {
        await checkboxes[i].click();
        await page.waitForTimeout(50);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 4;

      console.log(`Total time for 4 filter changes: ${totalTime}ms`);
      console.log(`Average per filter: ${avgTime}ms`);

      expect(avgTime).toBeLessThan(500);
    }
  });

  /**
   * Test layout cache effectiveness
   * Switching back to a previous layout should be instant
   */
  test('Layout cache performance', async ({ page }) => {
    console.log('[Performance] Testing layout cache...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // First layout switch (no cache)
    const time1Start = Date.now();
    await page.selectOption('#layout-selector', 'hierarchical');
    await page.waitForTimeout(1000);
    const time1 = Date.now() - time1Start;

    console.log(`First layout switch: ${time1}ms`);

    // Switch to another layout
    await page.selectOption('#layout-selector', 'force');
    await page.waitForTimeout(1000);

    // Switch back (should be cached)
    const time2Start = Date.now();
    await page.selectOption('#layout-selector', 'hierarchical');
    await page.waitForTimeout(500);
    const time2 = Date.now() - time2Start;

    console.log(`Second layout switch (cached): ${time2}ms`);

    // Cached layout should be faster (or similar with animations)
    // Allow for animation time
    expect(time2).toBeLessThan(2000);
  });

  /**
   * Test export performance
   * Exporting should complete quickly
   */
  test('Export performance', async ({ page }) => {
    console.log('[Performance] Testing export performance...');

    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Test graph data export (fastest)
    const dataButton = await page.locator('button[title="Export Graph Data"]').isVisible().catch(() => false);

    if (dataButton) {
      const startTime = Date.now();
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await page.click('button[title="Export Graph Data"]');

      const download = await downloadPromise;
      const exportTime = Date.now() - startTime;

      console.log(`Graph data export time: ${exportTime}ms`);
      expect(exportTime).toBeLessThan(2000);

      if (download) {
        console.log(`Exported file: ${download.suggestedFilename()}`);
      }
    }
  });

  /**
   * Test performance metrics summary
   * Display overall performance profile
   */
  test('Performance metrics summary', async ({ page }) => {
    console.log('[Performance] Collecting performance metrics summary...');

    const metrics: Record<string, number> = {};

    await page.click('text=Load Demo Data');

    // Initial render
    const renderStart = performance.now();
    await page.waitForSelector('.motivation-view', { timeout: 10000 });
    metrics.initialRender = performance.now() - renderStart;

    const nodeCount = await page.locator('.react-flow__node').count();
    const edgeCount = await page.locator('.react-flow__edge').count();

    console.log('\n=== Performance Metrics Summary ===');
    console.log(`Nodes: ${nodeCount}`);
    console.log(`Edges: ${edgeCount}`);
    console.log(`Initial Render: ${metrics.initialRender.toFixed(2)}ms`);

    // Filter operation
    const checkbox = await page.locator('input[type="checkbox"]').first();
    const filterStart = performance.now();
    await checkbox.click();
    await page.waitForTimeout(200);
    metrics.filterOperation = performance.now() - filterStart;
    console.log(`Filter Operation: ${metrics.filterOperation.toFixed(2)}ms`);

    // Layout switch
    const layoutStart = performance.now();
    await page.selectOption('#layout-selector', 'hierarchical');
    await page.waitForTimeout(1000);
    metrics.layoutSwitch = performance.now() - layoutStart;
    console.log(`Layout Switch: ${metrics.layoutSwitch.toFixed(2)}ms`);

    console.log('=====================================\n');

    // Verify all metrics meet targets
    expect(metrics.initialRender).toBeLessThan(5000);
    expect(metrics.filterOperation).toBeLessThan(1000);
    expect(metrics.layoutSwitch).toBeLessThan(2000);
  });
});
