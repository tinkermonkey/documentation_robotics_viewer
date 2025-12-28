const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages = [];
  const errors = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`[Browser ${msg.type()}]:`, text);
  });

  // Capture errors
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('[Page Error]:', err.message);
  });

  console.log('Navigating to Changeset story...');
  try {
    await page.goto('http://localhost:6006/?story=changesetgraphview--active-changeset&mode=preview', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Waiting for rendering...');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/changeset-story.png', fullPage: true });
    console.log('Screenshot saved to /tmp/changeset-story.png');

    // Check for SVG elements
    const svgCount = await page.locator('svg').count();
    console.log(`Found ${svgCount} SVG elements`);

    // Check for React Flow elements
    const reactFlowCount = await page.locator('.react-flow').count();
    console.log(`Found ${reactFlowCount} React Flow containers`);

  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n=== Summary ===');
  console.log(`Console messages: ${consoleMessages.length}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  await browser.close();
  process.exit(0);
})();
