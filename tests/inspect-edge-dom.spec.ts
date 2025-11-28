import { test } from '@playwright/test';

test('inspect DataModel edge DOM', async ({ page }) => {
  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[BROWSER ${type.toUpperCase()}]:`, msg.text());
    }
  });

  // Capture page errors
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]:', err.message);
  });

  await page.goto('http://localhost:3005');
  await page.click('text=Load Demo Data');
  await page.waitForTimeout(2000);

  // Get detailed information about the DataModel edge
  const edgeInfo = await page.evaluate(() => {
    const edge = document.querySelector('[data-id="edge-dm-rel-1"]');
    if (!edge) return { exists: false };

    const computedStyle = window.getComputedStyle(edge);
    const rect = edge.getBoundingClientRect();

    // Get the path element
    const pathElement = edge.querySelector('.react-flow__edge-path');
    const pathData = pathElement ? pathElement.getAttribute('d') : null;
    const pathStyle = pathElement ? window.getComputedStyle(pathElement) : null;

    return {
      exists: true,
      classes: edge.className,
      dataAttributes: {
        id: edge.getAttribute('data-id'),
        source: edge.getAttribute('data-source'),
        target: edge.getAttribute('data-target'),
        sourceHandle: edge.getAttribute('data-sourcehandle'),
        targetHandle: edge.getAttribute('data-targethandle'),
      },
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      style: {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        zIndex: computedStyle.zIndex,
      },
      path: {
        data: pathData,
        stroke: pathStyle?.stroke,
        strokeWidth: pathStyle?.strokeWidth,
        fill: pathStyle?.fill,
        opacity: pathStyle?.opacity,
        display: pathStyle?.display,
      },
      innerHTML: edge.innerHTML.substring(0, 500),
    };
  });

  console.log('\n=== DataModel Edge Information ===');
  console.log(JSON.stringify(edgeInfo, null, 2));

  // Also check all edges
  const allEdges = await page.evaluate(() => {
    const edges = Array.from(document.querySelectorAll('.react-flow__edge'));
    return edges.map(edge => {
      const rect = edge.getBoundingClientRect();
      const pathElement = edge.querySelector('.react-flow__edge-path');
      return {
        id: edge.getAttribute('data-id'),
        class: edge.className,
        visible: rect.width > 0 && rect.height > 0,
        hasPath: !!pathElement,
        pathD: pathElement ? pathElement.getAttribute('d')?.substring(0, 100) : null,
      };
    });
  });

  console.log('\n=== All Edges ===');
  allEdges.forEach(edge => {
    console.log(`- ${edge.id}: visible=${edge.visible}, hasPath=${edge.hasPath}`);
    if (edge.pathD) {
      console.log(`  Path: ${edge.pathD}...`);
    }
  });

  await page.screenshot({
    path: 'test-results/edge-inspection.png',
    fullPage: true
  });
});
