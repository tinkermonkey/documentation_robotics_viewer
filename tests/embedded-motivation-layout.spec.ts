import { test, expect } from '@playwright/test';

test.describe('Motivation View Layout', () => {
  test('should have correct layout for motivation graph container', async ({ page }) => {
    // Navigate to motivation view
    await page.goto('/motivation');

    // Wait for layout
    await page.waitForSelector('.motivation-graph-container');

    // Check motivation-graph-container display property
    const containerDisplay = await page.$eval('.motivation-graph-container', (el) => {
      return window.getComputedStyle(el).display;
    });
    console.log('Motivation container display:', containerDisplay);

    // Check graph-viewer dimensions
    // We expect it to be visible and have substantial width
    const graphViewer = await page.$('.graph-viewer');
    if (graphViewer) {
      const box = await graphViewer.boundingBox();
      console.log('Graph viewer box:', box);
      
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThan(100); // Should be much wider than 10px
        expect(box.height).toBeGreaterThan(100);
        
        // Check if it's visible
        const isVisible = await graphViewer.isVisible();
        console.log('Graph viewer is visible:', isVisible);
        expect(isVisible).toBe(true);
      }
    } else {
      console.log('Graph viewer not found');
      // Fail the test if graph viewer is missing
      expect(graphViewer).not.toBeNull();
    }
  });
});
