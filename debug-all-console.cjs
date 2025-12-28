const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log ALL console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[PageError]:', err.message);
  });

  await page.goto('http://localhost:6006/?story=graph-views--changesetgraphview--active-changeset&mode=preview', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(5000);
  await browser.close();
  process.exit(0);
})();
