const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`[ERROR]:`, msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('[Page Error]:', err.message);
  });

  // CORRECT story ID with hyphens
  await page.goto('http://localhost:6006/?story=graph-views--changesetgraphview--active-changeset&mode=preview', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  const reactFlowCount = await page.locator('.react-flow').count();
  const svgCount = await page.locator('svg').count();
  const nodeCount = await page.locator('[class*="react-flow__node"]').count();

  console.log(`\n=== Results ===`);
  console.log(`React Flow containers: ${reactFlowCount}`);
  console.log(`SVG elements: ${svgCount}`);
  console.log(`Nodes rendered: ${nodeCount}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nError messages:');
    errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
  } else {
    console.log('\n✅ No errors! Story rendered successfully.');
  }

  await browser.close();
  process.exit(0);
})();
