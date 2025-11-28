import { test, expect } from '@playwright/test';

test('debug edge rendering', async ({ page }) => {
  await page.goto('http://localhost:3005');

  // Take initial screenshot
  await page.screenshot({ path: 'test-results/01-initial.png', fullPage: true });

  // Load demo data
  await page.click('text=Load Demo Data');

  // Wait a bit
  await page.waitForTimeout(2000);

  // Take screenshot after loading
  await page.screenshot({ path: 'test-results/02-after-load.png', fullPage: true });

  // Check what's in the DOM
  const reactFlowWrapper = await page.locator('.react-flow').count();
  console.log('React Flow wrapper count:', reactFlowWrapper);

  const nodes = await page.locator('.react-flow__nodes').count();
  console.log('React Flow nodes container count:', nodes);

  const nodeElements = await page.locator('.react-flow__node').count();
  console.log('React Flow node elements count:', nodeElements);

  const edges = await page.locator('.react-flow__edges').count();
  console.log('React Flow edges container count:', edges);

  const edgeElements = await page.locator('.react-flow__edge').count();
  console.log('React Flow edge elements count:', edgeElements);

  // Check if edges container exists and get its properties
  if (edges > 0) {
    const edgesContainer = page.locator('.react-flow__edges').first();
    const isVisible = await edgesContainer.isVisible();
    const innerHTML = await edgesContainer.innerHTML();

    console.log('Edges container visible:', isVisible);
    console.log('Edges container innerHTML length:', innerHTML.length);
    console.log('Edges container innerHTML preview:', innerHTML.substring(0, 500));
  }

  // Get console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Get errors
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Check React Flow state in the page
  const reactFlowState = await page.evaluate(() => {
    const reactFlowDiv = document.querySelector('.react-flow');
    if (reactFlowDiv) {
      return {
        classList: Array.from(reactFlowDiv.classList),
        childrenCount: reactFlowDiv.children.length,
        children: Array.from(reactFlowDiv.children).map(child => ({
          className: child.className,
          tagName: child.tagName,
        }))
      };
    }
    return null;
  });

  console.log('React Flow state:', JSON.stringify(reactFlowState, null, 2));

  await page.screenshot({ path: 'test-results/03-final.png', fullPage: true });
});
