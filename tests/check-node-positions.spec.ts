import { test } from '@playwright/test';

test('check Order and User node positions', async ({ page }) => {
  await page.goto('http://localhost:3005');
  await page.click('text=Load Demo Data');
  await page.waitForTimeout(2000);

  const nodeInfo = await page.evaluate(() => {
    const orderNode = document.querySelector('[data-id="node-dm-2"]'); // Order
    const userNode = document.querySelector('[data-id="node-dm-1"]'); // User

    const getNodeInfo = (node: Element | null, name: string) => {
      if (!node) return { name, exists: false };

      const rect = node.getBoundingClientRect();
      const transform = window.getComputedStyle(node).transform;

      // Get handles
      const handles = Array.from(node.querySelectorAll('.react-flow__handle')).map(h => {
        const handleRect = h.getBoundingClientRect();
        return {
          id: h.getAttribute('data-handleid'),
          position: h.getAttribute('data-handlepos'),
          type: h.getAttribute('data-handletype'),
          rect: {
            top: handleRect.top,
            left: handleRect.left,
            width: handleRect.width,
            height: handleRect.height,
          },
        };
      });

      return {
        name,
        exists: true,
        boundingBox: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        transform,
        handles,
      };
    };

    return {
      order: getNodeInfo(orderNode, 'Order (dm-2)'),
      user: getNodeInfo(userNode, 'User (dm-1)'),
    };
  });

  console.log('\n=== Node Positions ===');
  console.log(JSON.stringify(nodeInfo, null, 2));

  // Find the specific handles the edge should connect to
  const orderUserId = nodeInfo.order.handles?.find(h => h.id === 'field-f2-right');
  const userId = nodeInfo.user.handles?.find(h => h.id === 'field-f1-left');

  console.log('\n=== Edge Connection Points ===');
  console.log('Order userId handle (field-f2-right):', orderUserId);
  console.log('User id handle (field-f1-left):', userId);

  if (orderUserId && userId) {
    console.log('\n=== Expected Edge Path ===');
    console.log(`Should connect from (${orderUserId.rect.left}, ${orderUserId.rect.top})`);
    console.log(`             to (${userId.rect.left}, ${userId.rect.top})`);
  }

  await page.screenshot({
    path: 'test-results/node-positions.png',
    fullPage: true
  });
});
