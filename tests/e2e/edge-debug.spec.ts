import { test, expect } from '@playwright/test';

test('debug edge creation', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('NodeTransformer') || text.includes('edge')) {
      logs.push(text);
      console.log(text);
    }
  });

  await page.goto('http://localhost:3001');
  await page.waitForSelector('.react-flow__node', { timeout: 15000 });
  await page.waitForTimeout(2000);

  console.log('\n=== Edge Creation Logs ===');
  logs.forEach(log => console.log(log));

  const edgeCount = await page.locator('.react-flow__edge').count();
  console.log(`\n=== Final edge count: ${edgeCount} ===`);
});
