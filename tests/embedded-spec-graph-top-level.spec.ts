import { test, expect } from '@playwright/test';

test.describe('Spec Graph Visibility - No Definitions', () => {
  test('should render top-level schema as a node if definitions are missing', async ({ page }) => {
    // Mock data with top-level schema but no definitions
    const mockSpecData = {
      version: '1.0.0',
      schemas: {
        '01-motivation-layer.schema.json': {
          $schema: 'http://json-schema.org/draft-07/schema#',
          $id: 'http://example.com/schemas/motivation',
          title: 'Motivation',
          type: 'object',
          properties: {
            driver: { type: 'string' },
            goal: { type: 'string' }
          }
          // No definitions
        }
      }
    };

    // Mock the API response
    await page.route('**/api/spec', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSpecData)
      });
    });

    // Navigate to the spec graph view
    await page.goto('/spec/graph');

    // Wait for the graph to render
    // We expect at least one node if top-level schemas are supported
    try {
      await page.waitForSelector('.react-flow__node', { timeout: 5000 });
    } catch (e) {
      // Ignore timeout, we'll check count next
    }

    // Check if any nodes are rendered
    const nodes = await page.$$('.react-flow__node');
    console.log(`Found ${nodes.length} nodes`);

    // If this is 0, it confirms the issue
    expect(nodes.length).toBeGreaterThan(0);
  });
});
