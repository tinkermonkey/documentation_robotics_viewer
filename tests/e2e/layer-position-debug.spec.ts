import { test } from '@playwright/test';

test('debug layer positioning', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForSelector('.react-flow__node', { timeout: 15000 });
  await page.waitForTimeout(2000);

  const layerInfo = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.react-flow__node')) as HTMLElement[];

    return nodes.slice(0, 15).map(node => {
      const id = node.getAttribute('data-id');
      const layerAttr = node.getAttribute('data-layer');
      const transform = node.style.transform;
      const yMatch = transform.match(/translate\([\d.]+px,\s*([\d.]+)px\)/);
      const y = yMatch ? parseFloat(yMatch[1]) : null;

      return { id, layerAttr, y };
    });
  });

  console.log('\n=== Layer Position Analysis ===');
  layerInfo.forEach(info => {
    console.log(`${info.id}: layer="${info.layerAttr}", y=${info.y}`);
  });

  // Group by layer
  const byLayer = new Map<string, number[]>();
  layerInfo.forEach(info => {
    const layer = info.layerAttr || 'unknown';
    if (!byLayer.has(layer)) {
      byLayer.set(layer, []);
    }
    if (info.y !== null) {
      byLayer.get(layer)!.push(info.y);
    }
  });

  console.log('\n=== Average Y by Layer ===');
  byLayer.forEach((yValues, layer) => {
    const avg = yValues.reduce((sum, y) => sum + y, 0) / yValues.length;
    console.log(`${layer}: ${avg.toFixed(2)} (${yValues.length} nodes)`);
  });
});
