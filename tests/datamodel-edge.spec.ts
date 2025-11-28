import { test, expect } from '@playwright/test';

test('DataModel layer edge between Order and User', async ({ page }) => {
  // Listen to console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Listen to errors
  const pageErrors: string[] = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
  });

  await page.goto('http://localhost:3005');

  // Load demo data
  await page.click('text=Load Demo Data');

  // Wait for rendering
  await page.waitForTimeout(2000);

  // Get all nodes and edges from the page
  const reactFlowData = await page.evaluate(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Get all node elements
    document.querySelectorAll('.react-flow__node').forEach(node => {
      const id = node.getAttribute('data-id');
      const type = node.getAttribute('data-nodetype');
      nodes.push({ id, type });
    });

    // Get all edge elements
    document.querySelectorAll('.react-flow__edge').forEach(edge => {
      const id = edge.getAttribute('data-id');
      const source = edge.getAttribute('data-source');
      const target = edge.getAttribute('data-target');
      const sourceHandle = edge.getAttribute('data-sourcehandle');
      const targetHandle = edge.getAttribute('data-targethandle');
      edges.push({ id, source, target, sourceHandle, targetHandle });
    });

    return { nodes, edges };
  });

  console.log('Nodes found:', reactFlowData.nodes.length);
  console.log('Edges found:', reactFlowData.edges.length);

  console.log('\nAll nodes:');
  reactFlowData.nodes.forEach(node => {
    console.log(`  - ${node.id} (${node.type})`);
  });

  console.log('\nAll edges:');
  reactFlowData.edges.forEach(edge => {
    console.log(`  - ${edge.id}`);
    console.log(`    source: ${edge.source} (handle: ${edge.sourceHandle || 'none'})`);
    console.log(`    target: ${edge.target} (handle: ${edge.targetHandle || 'none'})`);
  });

  // Look for the DataModel nodes
  const orderNode = reactFlowData.nodes.find(n => n.id?.includes('dm-2'));
  const userNode = reactFlowData.nodes.find(n => n.id?.includes('dm-1'));

  console.log('\nOrder node:', orderNode);
  console.log('User node:', userNode);

  // Look for the edge between them
  const dmEdge = reactFlowData.edges.find(e =>
    e.id?.includes('dm-rel-1') ||
    (e.source?.includes('dm-') && e.target?.includes('dm-'))
  );

  console.log('\nDataModel edge:', dmEdge);

  // Check for handles on the nodes
  if (orderNode) {
    const orderHandles = await page.evaluate((nodeId) => {
      const node = document.querySelector(`[data-id="${nodeId}"]`);
      if (!node) return [];

      const handles = Array.from(node.querySelectorAll('.react-flow__handle'));
      return handles.map(h => ({
        id: h.getAttribute('data-handleid'),
        type: h.getAttribute('data-handletype'),
        position: h.getAttribute('data-handlepos')
      }));
    }, orderNode.id);

    console.log('\nOrder node handles:', orderHandles);
  }

  if (userNode) {
    const userHandles = await page.evaluate((nodeId) => {
      const node = document.querySelector(`[data-id="${nodeId}"]`);
      if (!node) return [];

      const handles = Array.from(node.querySelectorAll('.react-flow__handle'));
      return handles.map(h => ({
        id: h.getAttribute('data-handleid'),
        type: h.getAttribute('data-handletype'),
        position: h.getAttribute('data-handlepos')
      }));
    }, userNode.id);

    console.log('\nUser node handles:', userHandles);
  }

  // Print console messages and errors
  if (consoleMessages.length > 0) {
    console.log('\nBrowser console messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
  }

  if (pageErrors.length > 0) {
    console.log('\nBrowser errors:');
    pageErrors.forEach(err => console.log(`  ${err}`));
  }

  // Take a focused screenshot of the DataModel layer
  const dataModelLayer = page.locator('text=DataModel').first();
  if (await dataModelLayer.isVisible()) {
    await dataModelLayer.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: 'test-results/datamodel-layer.png',
      fullPage: true
    });
  }

  // Verify we found the edge
  expect(dmEdge, 'DataModel edge should exist').toBeDefined();
  if (dmEdge) {
    console.log('\n✓ DataModel edge found!');
    console.log(`  Edge connects ${dmEdge.source} -> ${dmEdge.target}`);
    console.log(`  Source handle: ${dmEdge.sourceHandle}`);
    console.log(`  Target handle: ${dmEdge.targetHandle}`);
  }
});
