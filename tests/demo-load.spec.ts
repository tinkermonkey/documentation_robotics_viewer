import { test, expect } from '@playwright/test';

test('load demo data and verify shapes created', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`Browser console [${msg.type()}]:`, text);
  });

  // Capture page errors
  page.on('pageerror', error => {
    const errorMsg = `Page error: ${error.message}\n${error.stack}`;
    errors.push(errorMsg);
    console.error(errorMsg);
  });

  // Navigate to the app
  await page.goto('/');

  // Wait for the app to load
  await page.waitForSelector('h1:has-text("Documentation Robotics Viewer")');

  // Click the "Load Demo Data" button
  await page.click('button:has-text("Load Demo Data")');

  // Wait a bit for the demo data to load and shapes to be created
  await page.waitForTimeout(2000);

  // Log all console messages
  console.log('\n=== All Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));

  // Take a screenshot for visual debugging
  await page.screenshot({ path: 'test-results/demo-load.png', fullPage: true });

  // Verify demo data loaded successfully
  const demoLoadMessage = consoleMessages.find(msg =>
    msg.includes('Demo model loaded successfully')
  );
  expect(demoLoadMessage).toBeTruthy();
  console.log('✅ Demo model loaded successfully');

  // Verify shapes were created
  const shapeCreationMessage = consoleMessages.find(msg =>
    msg.includes('Created') && msg.includes('shapes') && msg.includes('arrows')
  );
  expect(shapeCreationMessage).toBeTruthy();
  console.log(`✅ Shapes created: ${shapeCreationMessage}`);

  // Parse shape and arrow counts
  const match = shapeCreationMessage?.match(/Created (\d+) shapes and (\d+) arrows/);
  if (match) {
    const shapeCount = parseInt(match[1]);
    const arrowCount = parseInt(match[2]);

    // Demo data has 8 elements across 4 layers
    expect(shapeCount).toBe(8);
    console.log(`✅ Expected 8 shapes, got ${shapeCount}`);

    // Demo data has 2 relationships
    expect(arrowCount).toBe(2);
    console.log(`✅ Expected 2 arrows, got ${arrowCount}`);
  }

  // Verify there are NO validation errors
  const validationErrors = errors.filter(err => err.includes('ValidationError'));
  if (validationErrors.length > 0) {
    console.log('\n❌ VALIDATION ERRORS DETECTED:');
    validationErrors.forEach(err => console.log(err));
  }
  expect(validationErrors.length).toBe(0);
  console.log('✅ No validation errors');

  // Verify there are NO page errors
  expect(errors.length).toBe(0);
  console.log('✅ No page errors');

  console.log(`\nTotal console messages: ${consoleMessages.length}`);
});
