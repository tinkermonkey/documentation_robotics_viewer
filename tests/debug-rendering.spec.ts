import { test, expect } from '@playwright/test';

/**
 * Debug test to inspect DOM structure and rendering
 */

test('debug DOM structure and shape rendering', async ({ page }) => {
  const consoleMessages: string[] = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('/');
  await page.click('button:has-text("Load Demo Data")');
  await page.waitForTimeout(3000);

  console.log('\n=== Inspecting DOM Structure ===\n');

  // Check if tldraw canvas exists
  const canvas = await page.locator('.tl-canvas');
  const canvasExists = await canvas.count();
  console.log(`tldraw canvas elements found: ${canvasExists}`);

  // Look for SVG elements
  const svgElements = await page.locator('svg').count();
  console.log(`Total SVG elements: ${svgElements}`);

  // Look for shape containers
  const shapeContainers = await page.locator('[data-shape-type]').count();
  console.log(`Shape containers: ${shapeContainers}`);

  // Inspect the SVG content
  const svgContent = await page.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    const results = [];

    svgs.forEach((svg, index) => {
      const rects = svg.querySelectorAll('rect');
      const texts = svg.querySelectorAll('text');
      const groups = svg.querySelectorAll('g');

      results.push({
        index,
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height'),
        rects: rects.length,
        texts: texts.length,
        groups: groups.length,
        classes: svg.className.baseVal
      });
    });

    return results;
  });

  console.log('\n=== SVG Analysis ===');
  svgContent.forEach(svg => {
    console.log(`SVG ${svg.index}: ${svg.width}x${svg.height}`);
    console.log(`  - Classes: ${svg.classes}`);
    console.log(`  - Groups: ${svg.groups}`);
    console.log(`  - Rects: ${svg.rects}`);
    console.log(`  - Texts: ${svg.texts}`);
  });

  // Check for React SVG namespace issues
  const textElements = await page.evaluate(() => {
    const texts = document.querySelectorAll('text');
    return Array.from(texts).slice(0, 5).map(text => ({
      content: text.textContent,
      x: text.getAttribute('x'),
      y: text.getAttribute('y'),
      parent: text.parentElement?.tagName,
      namespaceURI: text.namespaceURI
    }));
  });

  console.log('\n=== Text Elements ===');
  textElements.forEach((text, i) => {
    console.log(`Text ${i}:`);
    console.log(`  - Content: "${text.content}"`);
    console.log(`  - Position: (${text.x}, ${text.y})`);
    console.log(`  - Parent: ${text.parent}`);
    console.log(`  - Namespace: ${text.namespaceURI}`);
  });

  // Check for custom shape elements
  const customShapes = await page.evaluate(() => {
    // Look for elements with our custom shape types
    const allElements = document.querySelectorAll('*');
    const shapeTypes = new Set<string>();

    allElements.forEach(el => {
      const dataType = el.getAttribute('data-shape-type');
      if (dataType) {
        shapeTypes.add(dataType);
      }
    });

    return Array.from(shapeTypes);
  });

  console.log('\n=== Custom Shape Types Found ===');
  customShapes.forEach(type => console.log(`  - ${type}`));

  // Get shape creation log
  const shapeLog = consoleMessages.find(msg => msg.includes('Created') && msg.includes('shapes'));
  console.log(`\n=== Shape Creation ===`);
  console.log(shapeLog);

  // Take screenshot
  await page.screenshot({
    path: 'test-results/debug-rendering.png',
    fullPage: true
  });

  console.log('\n=== Screenshot saved to test-results/debug-rendering.png ===');
});
