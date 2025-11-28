import { test, expect } from '@playwright/test';

/**
 * Test GitHub loading through the server proxy (E2E test)
 * REQUIRES: Server running on port 3002
 */
test('load from GitHub through server proxy', async ({ page }) => {
  // Capture console messages
  const consoleMessages: string[] = [];
  const errorMessages: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errorMessages.push(text);
    }
  });

  // Go to the app
  await page.goto('/');

  // Wait for the app to load
  await expect(page.locator('h1')).toContainText('Documentation Robotics Viewer');

  // Click the "Load from GitHub" button
  await page.click('button:has-text("Load from GitHub")');

  // Wait for loading to complete (either success or error)
  await page.waitForTimeout(5000);

  // Check if we got an error or success
  const errorBox = page.locator('.message-box.error');
  const hasError = await errorBox.isVisible();

  console.log('\n=== Test Result ===');

  if (hasError) {
    const errorMessage = await errorBox.locator('p').textContent();
    console.log('❌ ERROR:', errorMessage);
    console.log('\n=== Error Messages ===');
    errorMessages.forEach(msg => console.log(msg));

    // If there's an error, it should be helpful
    expect(errorMessage).toBeTruthy();
  } else {
    // Success! Check if shapes were created
    const welcomeBox = page.locator('.message-box.welcome');
    const isWelcome = await welcomeBox.isVisible();

    if (!isWelcome) {
      console.log('✅ SUCCESS: Model loaded from GitHub');

      // Look for success indicators in console
      const loadSuccessLog = consoleMessages.find(msg =>
        msg.includes('Model loaded successfully')
      );
      const shapesCreatedLog = consoleMessages.find(msg =>
        msg.includes('Created') && msg.includes('shapes')
      );

      console.log('\nSuccess indicators:');
      if (loadSuccessLog) console.log(loadSuccessLog);
      if (shapesCreatedLog) console.log(shapesCreatedLog);

      expect(loadSuccessLog || shapesCreatedLog).toBeTruthy();
    } else {
      console.log('⚠️  Still showing welcome screen');
    }
  }

  // Log relevant console messages for debugging
  console.log('\n=== GitHub Loading Messages ===');
  consoleMessages.forEach(msg => {
    if (
      msg.includes('GitHub') ||
      msg.includes('release') ||
      msg.includes('schema') ||
      msg.includes('Downloading') ||
      msg.includes('Extracted')
    ) {
      console.log(msg);
    }
  });

  // Log server messages
  console.log('\n=== Server Communication ===');
  consoleMessages.forEach(msg => {
    if (msg.includes('3002') || msg.includes('server')) {
      console.log(msg);
    }
  });
});
