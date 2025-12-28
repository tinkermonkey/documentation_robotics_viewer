const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const startTime = Date.now();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const elapsed = Date.now() - startTime;
      errors.push({ time: elapsed, msg: msg.text() });
      console.log(`[${elapsed}ms] ERROR:`, msg.text().substring(0, 80));
    }
  });

  console.log('[0ms] Navigating...');
  await page.goto('http://localhost:6006/?story=graph-views--changesetgraphview--active-changeset&mode=preview', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const loadTime = Date.now() - startTime;
  console.log(`[${loadTime}ms] Page loaded`);

  await page.waitForTimeout(3000);

  const finalTime = Date.now() - startTime;
  console.log(`\n[${finalTime}ms] === Summary ===`);
  console.log(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('\nError timeline:');
    errors.forEach(e => console.log(`  ${e.time}ms: ${e.msg.substring(0, 60)}...`));
  }

  await browser.close();
  process.exit(0);
})();
