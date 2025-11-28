import { test, expect } from '@playwright/test';

test('debug node types', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForSelector('.react-flow__node', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get node type info from React Flow's internal state
  const nodeInfo = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
    return nodes.slice(0, 20).map(node => {
      const id = node.getAttribute('data-id');
      const dataType = node.getAttribute('data-type');
      const dataNodeType = node.getAttribute('data-nodetype');
      const classes = node.className;
      const typeFromClass = classes.match(/react-flow__node-(\w+)/)?.[1];
      return { id, dataType, dataNodeType, typeFromClass, classes };
    });
  });

  console.log('\n=== Node Type Analysis ===');
  nodeInfo.forEach(info => {
    console.log(`ID: ${info.id}`);
    console.log(`  data-type: ${info.dataType}`);
    console.log(`  data-nodetype: ${info.dataNodeType}`);
    console.log(`  Type from class: ${info.typeFromClass}`);
  });
});
