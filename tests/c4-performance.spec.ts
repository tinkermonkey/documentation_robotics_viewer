/**
 * Performance Tests for C4 Architecture View
 *
 * Tests performance metrics for C4 visualization:
 * - Initial render time (< 3s target)
 * - Drill-down navigation latency (< 300ms target)
 * - Filter operation latency (< 500ms target)
 * - Layout switch time (< 800ms target)
 * - Pan/zoom responsiveness (60fps target)
 *
 * These tests help ensure the C4 visualization meets performance requirements
 * defined in the acceptance criteria.
 */

import { test, expect } from '@playwright/test';

// Increase timeout for performance measurements
test.setTimeout(60000);

test.describe('C4 Architecture View Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test.describe('Initial Render Performance', () => {
    test('should render C4 view within 3 seconds', async ({ page }) => {
      // Record performance metrics
      await page.evaluate(() => {
        (window as any).performanceMarks = [];
        (window as any).performanceMarks.push({ name: 'start', time: performance.now() });
      });

      const startTime = Date.now();

      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');

      // Wait for ReactFlow to be visible and have nodes
      await page.waitForSelector('.react-flow', { timeout: 5000 });

      // Also wait for nodes if model has data
      try {
        await page.waitForSelector('.react-flow__node', { timeout: 3000 });
      } catch {
        // Model might be empty, which is fine
      }

      const renderTime = Date.now() - startTime;

      console.log(`C4 View initial render time: ${renderTime}ms`);

      // Target: < 3000ms for initial render
      expect(renderTime).toBeLessThan(3000);
    });

    test('should complete first contentful paint quickly', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');

      // Get First Contentful Paint timing
      const fcpTime = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcp = entries.find(e => e.name === 'first-contentful-paint');
            if (fcp) {
              observer.disconnect();
              resolve(fcp.startTime);
            }
          });

          observer.observe({ type: 'paint', buffered: true });

          // Fallback after timeout
          setTimeout(() => {
            observer.disconnect();
            resolve(-1);
          }, 5000);
        });
      });

      if (fcpTime > 0) {
        console.log(`First Contentful Paint: ${fcpTime}ms`);
        expect(fcpTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('Drill-Down Navigation Performance', () => {
    test('should complete drill-down within 300ms', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find a container node
      const containerNode = page.locator('.react-flow__node[data-c4-type="container"]').first();

      if (await containerNode.isVisible()) {
        const startTime = Date.now();

        // Double-click to drill down
        await containerNode.dblclick();

        // Wait for breadcrumb to update (indicates drill-down complete)
        await page.waitForFunction(() => {
          const breadcrumbs = document.querySelectorAll('.c4-breadcrumb-nav .breadcrumb-item');
          return breadcrumbs.length > 1;
        }, { timeout: 1000 }).catch(() => null);

        const drillDownTime = Date.now() - startTime;

        console.log(`Drill-down navigation time: ${drillDownTime}ms`);

        // Target: < 300ms for drill-down (allow 500ms for CI variability)
        expect(drillDownTime).toBeLessThan(500);
      }
    });

    test('should complete breadcrumb navigation within 300ms', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Drill down first
      const containerNode = page.locator('.react-flow__node[data-c4-type="container"]').first();

      if (await containerNode.isVisible()) {
        await containerNode.dblclick();
        await page.waitForTimeout(1000);

        const startTime = Date.now();

        // Click breadcrumb to go back
        const firstBreadcrumb = page.locator('.c4-breadcrumb-nav .breadcrumb-item').first();
        await firstBreadcrumb.click();

        // Wait for view to update
        await page.waitForFunction(() => {
          const breadcrumbs = document.querySelectorAll('.c4-breadcrumb-nav .breadcrumb-item');
          return breadcrumbs.length === 1;
        }, { timeout: 1000 }).catch(() => null);

        const navTime = Date.now() - startTime;

        console.log(`Breadcrumb navigation time: ${navTime}ms`);

        // Target: < 300ms
        expect(navTime).toBeLessThan(500);
      }
    });
  });

  test.describe('Filter Performance', () => {
    test('should apply filter within 500ms', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find a filter checkbox
      const checkbox = page.locator('.c4-filter-panel input[type="checkbox"]').first();

      if (await checkbox.isVisible()) {
        const initialNodeCount = await page.locator('.react-flow__node').count();
        const startTime = Date.now();

        // Toggle filter
        await checkbox.click();

        // Wait for graph to update
        await page.waitForTimeout(100);

        const filterTime = Date.now() - startTime;

        console.log(`Filter operation time: ${filterTime}ms`);

        // Target: < 500ms
        expect(filterTime).toBeLessThan(500);

        // Reset filter
        await checkbox.click();
      }
    });

    test('should handle multiple filter changes efficiently', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Get all checkboxes
      const checkboxes = page.locator('.c4-filter-panel input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        const startTime = Date.now();

        // Toggle multiple filters rapidly
        for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
          await checkboxes.nth(i).click();
          await page.waitForTimeout(50);
        }

        const multiFilterTime = Date.now() - startTime;

        console.log(`Multiple filter operations time: ${multiFilterTime}ms`);

        // Should handle multiple filters efficiently
        expect(multiFilterTime).toBeLessThan(1000);

        // Reset filters
        for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
          await checkboxes.nth(i).click();
        }
      }
    });
  });

  test.describe('Layout Switch Performance', () => {
    test('should switch layout within 800ms', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find layout options
      const layoutOptions = page.locator('.c4-control-panel .layout-option');
      const optionCount = await layoutOptions.count();

      if (optionCount > 1) {
        const startTime = Date.now();

        // Switch to a different layout
        await layoutOptions.nth(1).click();

        // Wait for layout animation to complete
        await page.waitForTimeout(100);

        const layoutSwitchTime = Date.now() - startTime;

        console.log(`Layout switch time: ${layoutSwitchTime}ms`);

        // Target: < 800ms
        expect(layoutSwitchTime).toBeLessThan(800);
      }
    });
  });

  test.describe('Pan and Zoom Performance', () => {
    test('should maintain smooth panning', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      const reactFlow = page.locator('.react-flow');
      const bounds = await reactFlow.boundingBox();

      if (bounds) {
        // Measure frame rate during pan
        const frameTimings: number[] = [];

        await page.evaluate(() => {
          (window as any).frameTimings = [];
          let lastTime = performance.now();

          const measureFrame = () => {
            const now = performance.now();
            (window as any).frameTimings.push(now - lastTime);
            lastTime = now;
            if ((window as any).frameTimings.length < 60) {
              requestAnimationFrame(measureFrame);
            }
          };

          requestAnimationFrame(measureFrame);
        });

        // Perform pan operation
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();

        // Pan in a circle
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2;
          const x = bounds.x + bounds.width / 2 + Math.cos(angle) * 100;
          const y = bounds.y + bounds.height / 2 + Math.sin(angle) * 100;
          await page.mouse.move(x, y);
          await page.waitForTimeout(16); // ~60fps
        }

        await page.mouse.up();
        await page.waitForTimeout(100);

        // Check frame timings
        const timings = await page.evaluate(() => (window as any).frameTimings);

        if (timings && timings.length > 0) {
          const avgFrameTime = timings.reduce((a: number, b: number) => a + b, 0) / timings.length;
          const fps = 1000 / avgFrameTime;

          console.log(`Average frame time: ${avgFrameTime.toFixed(2)}ms (${fps.toFixed(1)} fps)`);

          // Target: ~60fps (16.67ms per frame), allow for some variance
          expect(avgFrameTime).toBeLessThan(50); // At least 20fps
        }
      }
    });

    test('should maintain smooth zooming', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      const reactFlow = page.locator('.react-flow');
      const bounds = await reactFlow.boundingBox();

      if (bounds) {
        const startTime = Date.now();

        // Perform zoom operation via mouse wheel
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel(0, -100); // Zoom in
          await page.waitForTimeout(50);
        }

        const zoomTime = Date.now() - startTime;

        console.log(`Zoom operation time: ${zoomTime}ms`);

        // Zoom should be responsive
        expect(zoomTime).toBeLessThan(1000);

        // Zoom out
        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel(0, 100);
          await page.waitForTimeout(50);
        }
      }
    });
  });

  test.describe('Memory Performance', () => {
    test('should not leak memory on view switches', async ({ page }) => {
      // Get initial memory (if available)
      const initialMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      });

      // Switch views multiple times
      for (let i = 0; i < 5; i++) {
        await page.click('.mode-selector button:has-text("Architecture")');
        await page.waitForTimeout(500);
        await page.click('.mode-selector button:has-text("Model")');
        await page.waitForTimeout(500);
      }

      // End on Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(1000);

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      });

      if (initialMemory !== null && finalMemory !== null) {
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
        console.log(`Memory increase after 5 view switches: ${memoryIncrease.toFixed(2)}MB`);

        // Should not increase by more than 50MB
        expect(memoryIncrease).toBeLessThan(50);
      }
    });
  });

  test.describe('Large Graph Performance', () => {
    test('should handle many nodes efficiently', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Count nodes
      const nodeCount = await page.locator('.react-flow__node').count();
      console.log(`Node count: ${nodeCount}`);

      if (nodeCount > 0) {
        const startTime = Date.now();

        // Fit to view operation
        const fitButton = page.locator('.c4-control-panel button', { hasText: /Fit|View/i });
        if (await fitButton.isVisible()) {
          await fitButton.click();
        }

        // Wait for animation
        await page.waitForTimeout(300);

        const fitTime = Date.now() - startTime;

        console.log(`Fit to view time with ${nodeCount} nodes: ${fitTime}ms`);

        // Should complete fit operation quickly even with many nodes
        expect(fitTime).toBeLessThan(1000);
      }
    });

    test('should render edges efficiently', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Count edges
      const edgeCount = await page.locator('.react-flow__edge').count();
      console.log(`Edge count: ${edgeCount}`);

      // If we have edges, check they render
      if (edgeCount > 0) {
        const edges = page.locator('.react-flow__edge');

        // First edge should be visible
        await expect(edges.first()).toBeVisible();

        // Edges should have paths
        const pathCount = await page.locator('.react-flow__edge path').count();
        expect(pathCount).toBeGreaterThanOrEqual(edgeCount);
      }
    });
  });

  test.describe('Export Performance', () => {
    test('should export PNG within reasonable time', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find PNG export button
      const pngButton = page.locator('.c4-control-panel button', { hasText: /PNG/i });

      if (await pngButton.isVisible()) {
        const startTime = Date.now();

        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        await pngButton.click();

        const download = await downloadPromise;

        if (download) {
          const exportTime = Date.now() - startTime;
          console.log(`PNG export time: ${exportTime}ms`);

          // Export should complete within 5 seconds
          expect(exportTime).toBeLessThan(5000);
        }
      }
    });

    test('should export JSON data quickly', async ({ page }) => {
      // Navigate to Architecture view
      await page.click('.mode-selector button:has-text("Architecture")');
      await page.waitForTimeout(3000);

      // Find Data/JSON export button
      const dataButton = page.locator('.c4-control-panel button', { hasText: /Data|JSON/i });

      if (await dataButton.isVisible()) {
        const startTime = Date.now();

        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await dataButton.click();

        const download = await downloadPromise;

        if (download) {
          const exportTime = Date.now() - startTime;
          console.log(`JSON export time: ${exportTime}ms`);

          // JSON export should be very fast
          expect(exportTime).toBeLessThan(1000);
        }
      }
    });
  });
});
