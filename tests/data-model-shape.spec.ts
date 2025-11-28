import { test, expect } from '@playwright/test';

/**
 * Unit Tests for DataModelComponent Shape Rendering
 * Verifies that data model entities render correctly with Luna Modeler styling
 */

test.describe('DataModelComponent Shape', () => {
  test('should render DataModelComponent with properties from schema', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      console.log(`Browser console [${msg.type()}]:`, text);
    });

    // Capture page errors
    page.on('pageerror', error => {
      const errorMsg = `Page error: ${error.message}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    });

    await page.goto('/');

    // Wait for app to be ready
    await expect(page.locator('h1')).toContainText('Documentation Robotics Viewer');

    // Click Load from GitHub button
    await page.click('button:has-text("Load from GitHub")');

    // Wait for loading to complete
    await page.waitForTimeout(10000);

    // Check for errors
    const errorBox = page.locator('.message-box.error');
    const hasError = await errorBox.isVisible();

    if (hasError) {
      const errorMessage = await errorBox.locator('p').textContent();
      console.log('⚠️  Error loading from GitHub:', errorMessage);
      test.skip();
      return;
    }

    // Verify shapes were created
    const shapeCreationMessage = consoleMessages.find(msg =>
      msg.includes('Created') && msg.includes('shapes') && msg.includes('arrows')
    );
    expect(shapeCreationMessage).toBeTruthy();
    console.log(`✅ ${shapeCreationMessage}`);

    // Parse shape count
    const match = shapeCreationMessage?.match(/Created (\d+) shapes/);
    if (match) {
      const shapeCount = parseInt(match[1]);
      expect(shapeCount).toBeGreaterThan(0);
      console.log(`✅ Found ${shapeCount} shapes`);
    }

    // Take a screenshot to visualize the rendering
    await page.screenshot({
      path: 'test-results/data-model-shapes.png',
      fullPage: true
    });

    // Look for DataModel layer parsing
    const dataModelParsing = consoleMessages.find(msg =>
      msg.includes('Parsed layer DataModel')
    );

    if (dataModelParsing) {
      console.log(`✅ DataModel layer: ${dataModelParsing}`);

      // Extract element count
      const elementMatch = dataModelParsing.match(/(\d+) elements/);
      if (elementMatch) {
        const elementCount = parseInt(elementMatch[1]);
        expect(elementCount).toBeGreaterThan(0);
        console.log(`✅ DataModel has ${elementCount} schema entities`);
      }
    }

    // Verify no validation errors
    const validationErrors = errors.filter(err => err.includes('ValidationError'));
    if (validationErrors.length > 0) {
      console.log('\n❌ VALIDATION ERRORS:');
      validationErrors.forEach(err => console.log(err));
    }
    expect(validationErrors.length).toBe(0);

    // Verify no rendering errors
    const renderErrors = consoleMessages.filter(msg =>
      msg.includes('[error]') &&
      (msg.includes('render') || msg.includes('shape'))
    );
    if (renderErrors.length > 0) {
      console.log('\n❌ RENDER ERRORS:');
      renderErrors.forEach(err => console.log(err));
    }
    expect(renderErrors.length).toBe(0);

    // Log all messages for debugging
    console.log('\n=== DataModel Related Messages ===');
    consoleMessages
      .filter(msg =>
        msg.toLowerCase().includes('datamodel') ||
        msg.toLowerCase().includes('data model') ||
        msg.toLowerCase().includes('data-model')
      )
      .forEach(msg => console.log(msg));
  });

  test('should render data model shapes with correct visual properties', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('/');
    await page.click('button:has-text("Load from GitHub")');
    await page.waitForTimeout(10000);

    // Skip if error loading
    const hasError = await page.locator('.message-box.error').isVisible();
    if (hasError) {
      test.skip();
      return;
    }

    // Wait for canvas to render
    await page.waitForSelector('.tldraw__canvas');

    // Take a detailed screenshot
    await page.screenshot({
      path: 'test-results/data-model-visual-check.png',
      fullPage: true
    });

    // Check for specific visual elements using tldraw canvas
    // Note: tldraw renders to canvas/SVG, so we verify through console logs

    // Verify shape creation was logged
    const shapeMessage = consoleMessages.find(msg =>
      msg.includes('Created') && msg.includes('shapes')
    );
    expect(shapeMessage).toBeTruthy();

    console.log('\n=== Visual Properties Test ===');
    console.log('Screenshots saved to test-results/');
    console.log('Manual verification needed for:');
    console.log('- Blue header with white text');
    console.log('- White body with property fields');
    console.log('- Property names and types displayed');
    console.log('- FK badges for references');
    console.log('- Required field indicators (●)');
  });
});
