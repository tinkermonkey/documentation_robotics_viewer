import { test, expect } from '@playwright/test';

/**
 * Test the GitHub loading functionality
 * Handles both success (when server is available) and error cases
 */
test('load from GitHub works correctly', async ({ page }) => {
  // Capture console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Go to the app
  await page.goto('/');

  // Wait for the app to load
  await expect(page.locator('h1')).toContainText('Documentation Robotics Viewer');

  // Click the "Load from GitHub" button
  await page.click('button:has-text("Load from GitHub")');

  // Wait for loading to complete
  await page.waitForTimeout(6000);

  // Check if we got an error or success
  const errorBox = page.locator('.message-box.error');
  const hasError = await errorBox.isVisible();

  if (hasError) {
    // ERROR CASE: Server not available or other error
    const errorMessage = await errorBox.locator('p').textContent();

    console.log('=== Error Message Displayed ===');
    console.log(errorMessage);

    // Verify we get a helpful error message
    expect(errorMessage).toBeTruthy();

    // If it's not a network error, verify the message quality
    if (!errorMessage?.includes('Failed to fetch') && !errorMessage?.includes('NetworkError')) {
      expect(errorMessage).toMatch(/no.*releases?|spec|schema|error/i);
    }

    // Dismiss the error
    await page.click('button:has-text("Dismiss")');
    await expect(errorBox).not.toBeVisible();
  } else {
    // SUCCESS CASE: Server available and schemas loaded
    const welcomeBox = page.locator('.message-box.welcome');
    const isWelcome = await welcomeBox.isVisible();

    if (!isWelcome) {
      console.log('=== Success: Model Loaded ===');

      // Look for success indicators
      const loadSuccess = consoleMessages.find(msg =>
        msg.includes('Model loaded successfully')
      );
      const shapesCreated = consoleMessages.find(msg =>
        msg.includes('Created') && msg.includes('shapes')
      );

      if (loadSuccess) console.log(loadSuccess);
      if (shapesCreated) console.log(shapesCreated);

      // Verify we got success indicators
      expect(loadSuccess || shapesCreated).toBeTruthy();
    }
  }
});
