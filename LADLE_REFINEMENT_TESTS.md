# Ladle-Based Refinement Tests

## Overview

This document describes the Ladle-based refinement workflow tests for the Documentation Robotics Viewer. These tests have migrated from route-based navigation (embedded app) to story-based navigation (Ladle component catalog), providing faster iteration, better isolation, and automated story discovery.

## Architecture

### Test Execution Flow

```
User runs: npm run refine:all
            ↓
Playwright launches Ladle (localhost:6006)
            ↓
Tests discover stories from /meta.json
            ↓
Tests navigate to stories via Ladle URL pattern
            ↓
StoryLoadedWrapper signals when React Flow initializes
            ↓
Tests extract node/edge positions from DOM
            ↓
Quality metrics calculated on rendered graphs
            ↓
Screenshots captured with Ladle stories
            ↓
Results reported to test-results/refinement/
```

## File Organization

### Core Components

- **Test Discovery Helper**: `tests/refinement/helpers/storyDiscovery.ts`
  - Fetches and filters stories from Ladle's `/meta.json` API
  - Generates Ladle story URLs with proper parameters
  - Extracts quality thresholds from story metadata

- **Ladle-Based Tests**: `tests/refinement/*.ladle.spec.ts` (13 files)
  - One test file per architecture layer plus cross-layer
  - Each file tests 5+ story variants (small, medium, large, sparse, dense)
  - Includes rendering, metrics, discovery, and variant comparison tests

### Supporting Infrastructure

- **Story Fixtures**: `src/catalog/fixtures/refinementFixtures.ts`
  - Configurable fixture factories for all 12 layers
  - Supports size and edge density variations
  - Uses deterministic seeding for reproducibility

- **Story Components**: `src/apps/embedded/components/refinement/*.stories.tsx`
  - React component stories for each layer
  - Includes story metadata (skip flag, quality threshold)
  - 5+ story variants per layer

- **Load Detection**: `src/catalog/components/StoryLoadedWrapper.tsx`
  - Wraps story content and signals initialization
  - Polls for `.react-flow__node` elements in DOM
  - Sets `data-storyloaded="true"` attribute when ready

## Running Tests

### Prerequisites

```bash
# Ensure Ladle server is running (in another terminal)
npm run catalog:dev

# Ladle will start on http://localhost:6006
# meta.json available at http://localhost:6006/meta.json
```

### Run All Refinement Tests

Includes both legacy embedded app tests and new Ladle-based tests:

```bash
npm run refine:all
```

### Run Specific Layer Tests

```bash
# Motivation layer
npm test tests/refinement/motivation-refinement.ladle.spec.ts --config=playwright.refinement.config.ts

# Business layer
npm test tests/refinement/business-refinement.ladle.spec.ts --config=playwright.refinement.config.ts

# All Ladle tests only
npm test tests/refinement/*.ladle.spec.ts --config=playwright.refinement.config.ts
```

### View Test Results

```bash
npm run report:refinement
```

## Test Structure

Each layer test file (e.g., `motivation-refinement.ladle.spec.ts`) includes:

### 1. Rendering Tests

```typescript
test('should render small motivation graph from story', async ({ page }) => {
  await page.goto(getStoryUrl('refinement--layout-tests--motivation--small-graph'));
  await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

  const nodeCount = await page.locator('.react-flow__node').count();
  expect(nodeCount).toBeGreaterThan(0);
  expect(nodeCount).toBeLessThanOrEqual(10);
});
```

### 2. Quality Metrics Tests

```typescript
test('should calculate quality metrics for rendered small graph', async ({ page }) => {
  // Navigate to story
  await page.goto(getStoryUrl('refinement--layout-tests--motivation--small-graph'));
  await page.waitForSelector('[data-storyloaded="true"]');

  // Extract positions from DOM
  const positions = await extractNodePositions(page);
  const nodes = positionsToNodes(positions);
  const edges = await extractEdges(page);

  // Calculate quality
  const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);

  expect(report.overallScore).toBeGreaterThan(0);
  expect(report.overallScore).toBeLessThanOrEqual(1);
});
```

### 3. Story Discovery Tests

```typescript
test('should discover all motivation stories', async ({ page }) => {
  const stories = await discoverRefinementStories(page);
  const motivationStories = stories.filter(key => key.toLowerCase().includes('motivation'));

  expect(motivationStories.length).toBeGreaterThan(0);
  // Verify all stories load without errors
});
```

### 4. Screenshot Tests

```typescript
test('should capture screenshots for visual regression', async ({ page }) => {
  await page.goto(getStoryUrl('refinement--layout-tests--motivation--medium-graph'));
  await page.waitForSelector('[data-storyloaded="true"]');

  await page.locator('[data-testid="refinement-motivation-medium"]').screenshot({
    path: path.join(SCREENSHOT_DIR, 'motivation-medium-graph.png'),
  });
});
```

## Story URL Pattern

Ladle stories are accessed via URL query parameters:

```
/?story=refinement--layout-tests--{layer}--{variant}&mode=preview
```

Where:
- `story`: Story key from meta.json (e.g., `refinement--layout-tests--motivation--small-graph`)
- `mode`: `preview` (no Ladle UI chrome) or `full` (with Ladle UI)

Example:
```
http://localhost:6006/?story=refinement--layout-tests--motivation--small-graph&mode=preview
```

## Story Discovery via meta.json

The `discoverRefinementStories()` function queries Ladle's API:

```typescript
const response = await page.goto('/meta.json');
const meta: MetaJson = await response.json();

const stories = Object.entries(meta.stories)
  .filter(([key]) => key.toLowerCase().includes('refinement'))
  .filter(([_, story]) => !story.meta?.skip)
  .map(([key]) => key);
```

Story metadata in meta.json includes:
```json
{
  "refinement--layout-tests--motivation--small-graph": {
    "title": "Small graph",
    "meta": {
      "skip": false,
      "diagramType": "motivation",
      "qualityThreshold": 0.7
    }
  }
}
```

## DOM Extraction Patterns

### Node Positions

```typescript
async function extractNodePositions(page) {
  const nodeElements = await page.locator('.react-flow__node').all();
  const positions = [];

  for (const nodeElement of nodeElements) {
    const box = await nodeElement.boundingBox();
    positions.push({
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    });
  }

  return positions;
}
```

### Edge Count

```typescript
async function extractEdges(page) {
  const edgeElements = await page.locator('.react-flow__edge').all();
  return edgeElements.length;
}
```

## Quality Metrics Calculation

Metrics are calculated using the existing `graphReadabilityService`:

```typescript
const report = calculateLayoutQuality(
  nodes,          // Node[] with positions from DOM
  edges,          // Edge[] extracted from rendered edges
  'hierarchical', // Layout type
  'motivation'    // Diagram type
);

// Report includes:
// - overallScore: 0-1 quality rating
// - metrics: crossing number, angle resolution, etc.
// - extendedMetrics: node occlusions, density, aspect ratio
// - computationTimeMs: performance metric
```

## Configuration

### Playwright Configuration

File: `playwright.refinement.config.ts`

```typescript
export default defineConfig({
  testDir: './tests',
  testMatch: [
    'refinement/**/*.ladle.spec.ts',  // New Ladle tests
    'refinement/**/*.spec.ts',        // Legacy embedded app tests
    'metrics/**/*.spec.ts',
  ],
  use: {
    baseURL: 'http://localhost:6006', // Ladle server
  },
  webServer: {
    command: 'npm run catalog:dev',
    url: 'http://localhost:6006/meta.json',
  },
});
```

### Test Thresholds

Each layer test defines:
- Default quality threshold: 0.7 (70%)
- Node count expectations: small <10, medium 10-50, large >50
- Timeout for story loading: 10 seconds

## Coexistence with Legacy Tests

Both legacy embedded app tests and new Ladle tests coexist:

| Test Type | Pattern | Server | Notes |
|-----------|---------|--------|-------|
| Legacy | `*-refinement.spec.ts` | Vite embedded (3001) | Still functional |
| New | `*-refinement.ladle.spec.ts` | Ladle catalog (6006) | Recommended |

Run both:
```bash
npm run refine:all  # Runs both types via playwright.refinement.config.ts
```

## Benefits Over Embedded App Tests

1. **Faster Startup**: Ladle (2-3s) vs Vite embedded app (3-5s)
2. **Better Isolation**: Stories run independently without global store pollution
3. **Automated Discovery**: meta.json enables dynamic story detection
4. **Cleaner Screenshots**: Preview mode removes Ladle UI chrome
5. **Scalability**: Stories can be tested in parallel
6. **Maintainability**: Story definitions are single source of truth

## Troubleshooting

### Tests timeout waiting for stories

Increase timeout in test:
```typescript
await page.waitForSelector('[data-storyloaded="true"]', { timeout: 15000 });
```

### Story URL not found (404)

Verify Ladle is running:
```bash
curl http://localhost:6006/meta.json
```

Check story key format (double dashes): `refinement--layout-tests--{layer}--{variant}`

### No React Flow nodes detected

Ensure:
1. StoryLoadedWrapper is used in story component
2. GraphViewer component is rendering
3. ReactFlowProvider wraps the content
4. Wait timeout is sufficient for large graphs

### Screenshots not capturing

Use Ladle preview mode URL to avoid capturing Ladle UI:
```typescript
await page.goto(getStoryUrl('refinement--layout-tests--motivation--small-graph'));
```

## Future Enhancements

- [ ] Parallel test execution per story
- [ ] Visual regression baselines with image diffing
- [ ] Performance profiling integration
- [ ] Accessibility checks (WCAG 2.1 AA) for each story
- [ ] Cross-browser testing (Firefox, Safari)
- [ ] CI/CD integration with screenshot comparison

## References

- [Ladle Documentation](https://www.ladle.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Flow Documentation](https://reactflow.dev/)
- [Story Discovery](./tests/refinement/helpers/storyDiscovery.ts)
- [Graph Quality Service](./src/core/services/metrics/graphReadabilityService.ts)
