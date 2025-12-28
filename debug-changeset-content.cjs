const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[Browser]:`, msg.text()));
  page.on('pageerror', err => console.log('[Error]:', err.message));

  await page.goto('http://localhost:6006/?story=changesetgraphview--active-changeset&mode=preview', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // Get the HTML content
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== Page Content ===');
  console.log(bodyText);

  // Check for loading/error states
  const messageOverlay = await page.locator('.message-overlay').count();
  console.log(`\nMessage overlays: ${messageOverlay}`);

  if (messageOverlay > 0) {
    const messageText = await page.locator('.message-overlay').textContent();
    console.log('Message:', messageText);
  }

  await browser.close();
  process.exit(0);
})();
