import { test, expect } from '@playwright/test';

test.describe('Firefox Layout', () => {
  test('should have correct layout for graph container', async ({ page }) => {
    // Navigate to spec graph
    await page.goto('/spec/graph');

    // Wait for layout
    await page.waitForSelector('.viewer-container');

    // Check viewer-container display property
    const viewerContainerDisplay = await page.$eval('.viewer-container', (el) => {
      return window.getComputedStyle(el).display;
    });
    console.log('Viewer container display:', viewerContainerDisplay);

    // Check spec-view-container dimensions
    // We expect it to be visible (width > 0, height > 0)
    // And it should NOT be 100% width if LayerPanel is present (it should be less)
    
    // Note: LayerPanel might be collapsed or not present depending on state, 
    // but spec-view-container should definitely be visible.
    
    const specViewContainer = await page.$('.spec-view-container');
    if (specViewContainer) {
      const box = await specViewContainer.boundingBox();
      console.log('Spec view container box:', box);
      
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
        
        // If layout is broken (stacked), it might have width equal to viewport width
        // If layout is correct (flex), it should be viewport width - panels
        
        const viewportSize = page.viewportSize();
        if (viewportSize) {
          // If it's stacked, it takes full width
          // If it's flex, it shares width.
          // But the main failure mode described is "not displaying correctly" or "invisible".
          // If it's pushed down by LayerPanel (height 100%), it might be out of view?
          // Or if overflow is hidden on parent, it might be clipped.
          
          // LayerPanel is 280px.
          // If stacked, LayerPanel takes 100% height. spec-view-container starts at y=100%.
          // Since viewer-container has overflow: hidden, spec-view-container is invisible.
          
          // So we check if it intersects with the viewport or is within the visible area of viewer-container
          
          const isVisible = await specViewContainer.isVisible();
          console.log('Spec view container is visible:', isVisible);
          expect(isVisible).toBe(true);
          
          // Check if it's within the bounding box of viewer-container
          const viewerBox = await page.locator('.viewer-container').boundingBox();
          if (viewerBox) {
             expect(box.y).toBeLessThan(viewerBox.y + viewerBox.height);
          }
        }
      }
    } else {
      console.log('Spec view container not found');
    }
  });
});
