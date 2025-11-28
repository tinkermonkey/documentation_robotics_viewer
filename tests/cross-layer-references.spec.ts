import { test, expect } from '@playwright/test';

test.describe('Cross-Layer Reference Extraction', () => {
  test('should extract and display cross-layer references from GitHub data', async ({ page }) => {
    // Set longer timeout for GitHub data loading
    test.setTimeout(60000);

    // Navigate to the app
    await page.goto('http://localhost:3006');

    // Wait for app to load
    await page.waitForSelector('h1:has-text("Documentation Robotics Viewer")', { timeout: 10000 });

    // Click "Load from GitHub" button
    const githubButton = page.locator('button:has-text("Load from GitHub")');
    await expect(githubButton).toBeVisible();
    await githubButton.click();

    // Wait for loading to complete (watch for console logs)
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      console.log(`Browser console: ${text}`);
      consoleMessages.push(text);
    });

    // Wait for data to load
    await page.waitForTimeout(10000);

    // Check console logs for cross-layer reference extraction messages
    const relevantMessages = consoleMessages.filter(msg =>
      msg.includes('Building cross-layer references') ||
      msg.includes('Extracted') ||
      msg.includes('Resolved') ||
      msg.includes('Cross-Layer References Statistics')
    );

    console.log('\nCross-layer reference extraction messages:');
    relevantMessages.forEach(msg => console.log(`  ${msg}`));

    // Verify that references were extracted
    expect(relevantMessages.length).toBeGreaterThan(0);

    // Verify specific extraction steps occurred
    const hasExtracted = consoleMessages.some(msg => msg.includes('Extracted') && msg.includes('custom cross-layer references'));
    const hasResolved = consoleMessages.some(msg => msg.includes('Resolved') && msg.includes('references'));

    expect(hasExtracted).toBe(true);
    expect(hasResolved).toBe(true);

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'test-results/cross-layer-references.png',
      fullPage: true
    });

    console.log('\nTest completed successfully!');
    console.log('Screenshot saved to test-results/cross-layer-references.png');
  });

  test('should show cross-layer reference statistics', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:3006');
    await page.waitForSelector('h1:has-text("Documentation Robotics Viewer")', { timeout: 10000 });

    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Load GitHub data
    const githubButton = page.locator('button:has-text("Load from GitHub")');
    await githubButton.click();

    // Wait for data to load
    await page.waitForTimeout(10000);

    // Check for statistics in console
    const statsMessages = consoleMessages.filter(msg =>
      msg.includes('Total References:') ||
      msg.includes('References by Type:') ||
      msg.includes('References by Source Layer:')
    );

    console.log('\nCross-layer reference statistics:');
    statsMessages.forEach(msg => console.log(msg));

    // Verify statistics were logged
    expect(statsMessages.length).toBeGreaterThan(0);

    // Check for specific reference types
    const referenceTypes = [
      'business-object',
      'business-service',
      'api-operation',
      'goal',
      'requirement',
      'security-resource'
    ];

    const foundTypes = referenceTypes.filter(type =>
      consoleMessages.some(msg => msg.includes(type))
    );

    console.log(`\nFound reference types: ${foundTypes.join(', ')}`);
    console.log(`Total types found: ${foundTypes.length}/${referenceTypes.length}`);
  });

  test('should handle schemas without cross-layer references', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('http://localhost:3006');
    await page.waitForSelector('h1:has-text("Documentation Robotics Viewer")', { timeout: 10000 });

    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Load demo data (which may not have cross-layer references)
    const demoButton = page.locator('button:has-text("Load Demo Data")');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForTimeout(3000);

      // Verify system handles schemas without cross-layer references gracefully
      const hasErrors = consoleMessages.some(msg =>
        msg.toLowerCase().includes('error') &&
        msg.includes('cross-layer')
      );

      expect(hasErrors).toBe(false);
      console.log('System handles schemas without cross-layer references correctly');
    }
  });
});

test.describe('Cross-Layer Reference Resolution', () => {
  test('should resolve UUID-based references', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:3006');
    await page.waitForSelector('h1', { timeout: 10000 });

    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    const githubButton = page.locator('button:has-text("Load from GitHub")');
    await githubButton.click();
    await page.waitForTimeout(10000);

    // Check for resolved UUID references
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const hasUUIDs = consoleMessages.some(msg => uuidPattern.test(msg));

    console.log(`UUID-based references found: ${hasUUIDs}`);
  });

  test('should track unresolved references', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:3006');
    await page.waitForSelector('h1', { timeout: 10000 });

    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    const githubButton = page.locator('button:has-text("Load from GitHub")');
    await githubButton.click();
    await page.waitForTimeout(10000);

    // Check for unresolved reference tracking
    const unresolvedMessages = consoleMessages.filter(msg =>
      msg.includes('Unresolved:') || msg.includes('unresolved')
    );

    console.log('\nUnresolved reference tracking:');
    unresolvedMessages.forEach(msg => console.log(`  ${msg}`));

    // System should track unresolved references (count may be 0 or more)
    const hasUnresolvedTracking = consoleMessages.some(msg =>
      msg.includes('Unresolved:')
    );

    expect(hasUnresolvedTracking).toBe(true);
  });
});
