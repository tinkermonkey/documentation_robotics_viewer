# Refinement Workflows Documentation

This document describes the CLI commands and automation workflows for running layout quality refinement loops.

## Overview

The refinement workflow system provides:
- Automated layout quality testing for all diagram types
- Interactive refinement with visual feedback
- Comprehensive metrics reporting
- Regression detection against baselines
- CI/CD integration for automated quality gates

The system now uses **Ladle** (component story viewer) as the primary test execution environment, providing better component isolation, faster iteration, and cleaner visual captures compared to the previous embedded application approach.

## Test Execution Approaches

### Current: Ladle-Based Testing (Recommended)

**Status**: ✅ Current and recommended approach

The Ladle-based approach executes refinement tests against isolated component stories running on port 6006. This provides:
- Faster test startup (~2-3s vs ~3-5s for embedded app)
- Better component isolation without global store pollution
- Cleaner screenshots via `?mode=preview` (no Ladle UI chrome)
- Automated test discovery via `/meta.json` API
- Optimal environment for metrics calculation

**Environment**: `http://localhost:6006` (Ladle catalog server)

**Test Files**: `tests/refinement/*.ladle.spec.ts`

**Configuration**: `playwright.refinement.config.ts` (already configured for Ladle)

### Previous: Embedded App Testing (Deprecated)

**Status**: ⚠️ Deprecated - Migrate to Ladle approach

The previous approach executed tests against the full embedded application at `http://localhost:3001`. This approach is no longer recommended because:
- Higher startup overhead (full Vite dev server)
- Tests coupled to full application context
- Less isolated component testing
- Manual test file enumeration required
- More complex screenshot handling

**Old Environment**: `http://localhost:3001` (Vite embedded app)

**Test Files**: `tests/refinement/*.spec.ts` (non-ladle files)

**Configuration**: Would require separate config (no longer maintained)

**Migration Path**: See [Migration Guide from Embedded App to Ladle](#migration-guide-from-embedded-app-to-ladle) below.

## Quick Start

```bash
# Run all refinement tests (Ladle-based)
npm run refine:all

# Generate metrics report
npm run metrics:report

# Check for regressions
npm run metrics:regression-check
```

## NPM Scripts Reference

### Refinement Scripts

All refinement scripts now use Ladle-based tests and run on `http://localhost:6006`.

| Script | Description | Approach |
|--------|-------------|----------|
| `npm run refine:motivation` | Run refinement tests for motivation diagrams | Ladle ✅ |
| `npm run refine:business` | Run refinement tests for business process diagrams | Ladle ✅ |
| `npm run refine:c4` | Run refinement tests for C4 architecture diagrams | Ladle ✅ |
| `npm run refine:interactive` | Open headed browser for interactive refinement | Ladle ✅ |
| `npm run refine:all` | Run all refinement tests (Ladle-based) | Ladle ✅ |

### Metrics Scripts

| Script | Description |
|--------|-------------|
| `npm run metrics:report` | Generate comprehensive quality metrics report |
| `npm run metrics:regression-check` | Compare current metrics against baselines |
| `npm run metrics:update-baselines` | Update baseline metrics (use after intentional changes) |
| `npm run metrics:all` | Run all metrics tests |

## Ladle Test Architecture

### Test Structure

Ladle-based refinement tests are organized as follows:

```
tests/refinement/
├── *.ladle.spec.ts              # Ladle-based tests (current approach)
│   ├── motivation-refinement.ladle.spec.ts
│   ├── business-refinement.ladle.spec.ts
│   ├── c4-refinement.ladle.spec.ts
│   ├── application-refinement.ladle.spec.ts
│   ├── security-refinement.ladle.spec.ts
│   ├── technology-refinement.ladle.spec.ts
│   ├── api-refinement.ladle.spec.ts
│   ├── datamodel-refinement.ladle.spec.ts
│   ├── datastore-refinement.ladle.spec.ts
│   ├── ux-refinement.ladle.spec.ts
│   ├── navigation-refinement.ladle.spec.ts
│   ├── apm-refinement.ladle.spec.ts
│   └── crosslayer-refinement.ladle.spec.ts
│
├── helpers/                      # Shared test utilities
│   ├── storyDiscovery.ts        # Story URL discovery via meta.json
│   └── domExtraction.ts         # DOM node/edge extraction helpers
│
└── *.spec.ts                    # Old embedded app tests (deprecated)
    └── [Not maintained - see deprecation notice]
```

### Story Organization

Stories for refinement testing are located in:

```
src/apps/embedded/components/refinement/
├── MotivationLayoutTest.stories.tsx
├── BusinessLayoutTest.stories.tsx
├── TechnologyLayoutTest.stories.tsx
├── ApplicationLayoutTest.stories.tsx
├── SecurityLayoutTest.stories.tsx
├── APILayoutTest.stories.tsx
├── DataModelLayoutTest.stories.tsx
├── UXLayoutTest.stories.tsx
├── NavigationLayoutTest.stories.tsx
├── APMLayoutTest.stories.tsx
├── C4LayoutTest.stories.tsx
├── CrossLayerLayoutTest.stories.tsx
└── [Existing stories]
    ├── MetricsDashboard.stories.tsx
    └── SideBySideComparison.stories.tsx
```

Each story file contains:
- **Small/Medium/Large graph variants** - Test different graph complexities
- **Layout algorithm tests** - Validate different layout strategies
- **Edge case scenarios** - Dense graphs, wide/tall aspect ratios

### Test Discovery via Meta.json

Ladle exposes story metadata via the `/meta.json` API:

```bash
# Discover available stories at runtime
curl http://localhost:6006/meta.json | jq '.stories'
```

The `discoverRefinementStories()` helper automatically discovers stories:

```typescript
const stories = await discoverRefinementStories(page);
// Returns: [
//   { id: 'refinement--layout-tests--motivation--small-graph', ... },
//   { id: 'refinement--layout-tests--motivation--medium-graph', ... },
//   ...
// ]
```

### Preview Mode for Clean Captures

Story URLs can include `?mode=preview` to render without Ladle UI chrome:

```
http://localhost:6006/?story=refinement--layout-tests--motivation--small-graph&mode=preview
```

This produces cleaner screenshots by:
- Hiding the Ladle sidebar and controls
- Focusing on the component content only
- Reducing DOM complexity for metrics extraction

## Migration Guide from Embedded App to Ladle

If you have existing refinement tests using the embedded app approach, follow this guide to migrate them to Ladle.

### Why Migrate?

**Performance**: 40% faster startup time (2-3s vs 3-5s)

**Isolation**: Better component isolation without global store pollution

**Maintainability**: Automated test discovery via meta.json vs manual enumeration

**Visual Quality**: Cleaner screenshots via preview mode

### Step 1: Create Story Files

For each diagram type that needs testing, create a story file in `src/apps/embedded/components/refinement/`:

```typescript
// src/apps/embedded/components/refinement/MotivationLayoutTest.stories.tsx
import type { StoryDefault, Story } from '@ladle/react';
import { ReactFlowProvider } from '@xyflow/react';
import GraphViewer from '@/core/components/GraphViewer';
import { createMotivationLayoutFixture } from '@catalog/fixtures/refinementFixtures';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

export default {
  title: 'Refinement / Layout Tests / Motivation',
  meta: {
    skip: false,
    diagramType: 'motivation',
    qualityThreshold: 0.7,
  },
} satisfies StoryDefault;

export const SmallGraph: Story = () => (
  <ReactFlowProvider>
    <StoryLoadedWrapper testId="refinement-motivation-small">
      <GraphViewer
        model={createMotivationLayoutFixture('small')}
        selectedLayerId="motivation"
      />
    </StoryLoadedWrapper>
  </ReactFlowProvider>
);

export const MediumGraph: Story = () => (
  <ReactFlowProvider>
    <StoryLoadedWrapper testId="refinement-motivation-medium">
      <GraphViewer
        model={createMotivationLayoutFixture('medium')}
        selectedLayerId="motivation"
      />
    </StoryLoadedWrapper>
  </ReactFlowProvider>
);

export const LargeGraph: Story = () => (
  <ReactFlowProvider>
    <StoryLoadedWrapper testId="refinement-motivation-large">
      <GraphViewer
        model={createMotivationLayoutFixture('large')}
        selectedLayerId="motivation"
      />
    </StoryLoadedWrapper>
  </ReactFlowProvider>
);
```

### Step 2: Create/Extend Fixture Factories

If not already created, extend `src/catalog/fixtures/refinementFixtures.ts`:

```typescript
// src/catalog/fixtures/refinementFixtures.ts
import { createCompleteModelFixture } from './modelFixtures';
import { MetaModel } from '@/core/types/model';

export function createMotivationLayoutFixture(
  size: 'small' | 'medium' | 'large' = 'medium'
): MetaModel {
  const baseModel = createCompleteModelFixture();
  const counts = {
    small: 8,
    medium: 25,
    large: 120,
  };

  // Truncate motivation layer to specified size
  return {
    ...baseModel,
    motivation: {
      ...baseModel.motivation,
      elements: baseModel.motivation.elements.slice(0, counts[size]),
    },
  };
}

// Similar for other layers...
```

### Step 3: Create Ladle Test Files

Create new `*.ladle.spec.ts` test files:

```typescript
// tests/refinement/motivation-refinement.ladle.spec.ts
import { test, expect } from '@playwright/test';
import { calculateLayoutQuality } from '@/core/services/metrics/graphReadabilityService';
import { getStoryUrl } from './helpers/storyDiscovery';
import { extractNodePositions, extractEdges, positionsToNodes } from './helpers/domExtraction';
import * as path from 'path';

const DIAGRAM_TYPE = 'motivation';
const QUALITY_THRESHOLD = 0.7;
const SCREENSHOT_DIR = 'test-results/refinement/motivation';

test.describe('Motivation Layout Refinement (Ladle)', () => {
  test('should render small motivation graph from story', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--motivation--small-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
    expect(nodeCount).toBeLessThanOrEqual(10);

    await page.locator('[data-testid="refinement-motivation-small"]').screenshot({
      path: path.join(SCREENSHOT_DIR, 'motivation-small-graph.png'),
    });
  });

  test('should calculate quality metrics for rendered small graph', async ({ page }) => {
    await page.goto(getStoryUrl('refinement--layout-tests--motivation--small-graph'));
    await page.waitForSelector('[data-storyloaded="true"]', { timeout: 10000 });

    const positions = await extractNodePositions(page);
    const nodes = positionsToNodes(positions);
    const edges = await extractEdges(page);

    const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);
    expect(report.overallScore).toBeGreaterThanOrEqual(QUALITY_THRESHOLD);
  });
});
```

### Step 4: Create Test Helpers

Create utility functions for story discovery and DOM extraction:

```typescript
// tests/refinement/helpers/storyDiscovery.ts
import { Page } from '@playwright/test';

export function getStoryUrl(
  storyId: string,
  mode: 'preview' | 'full' = 'preview'
): string {
  const baseUrl = 'http://localhost:6006';
  const params = new URLSearchParams({
    story: storyId,
    ...(mode === 'preview' && { mode: 'preview' }),
  });
  return `${baseUrl}/?${params.toString()}`;
}

export async function discoverRefinementStories(page: Page) {
  const response = await page.goto('http://localhost:6006/meta.json');
  const meta = await response?.json() || {};

  return Object.entries(meta.stories || {})
    .filter(([key]) => key.startsWith('refinement--layout-tests--'))
    .filter(([_, story]: [string, any]) => !story.meta?.skip);
}
```

```typescript
// tests/refinement/helpers/domExtraction.ts
import { Page } from '@playwright/test';

export async function extractNodePositions(page: Page) {
  return await page.evaluate(() => {
    const nodes = document.querySelectorAll('.react-flow__node');
    return Array.from(nodes).map((node) => {
      const style = node.getAttribute('style') || '';
      const transform = style.match(/translate\((.*?)\)/)?.[1]?.split(',') || [];
      return {
        id: node.getAttribute('data-id'),
        x: parseFloat(transform[0] || '0'),
        y: parseFloat(transform[1] || '0'),
      };
    });
  });
}

export async function extractEdges(page: Page) {
  return await page.evaluate(() => {
    const edges = document.querySelectorAll('.react-flow__edge');
    return Array.from(edges).map((edge) => {
      const id = edge.getAttribute('id') || '';
      const [source, target] = id.split('__') || [];
      return { source, target, id };
    });
  });
}

export function positionsToNodes(positions: any[]) {
  return positions.map((p) => ({
    id: p.id,
    position: { x: p.x, y: p.y },
    data: { label: p.id },
    width: 200,
    height: 100,
  }));
}
```

### Step 5: Update Configuration

Verify `playwright.refinement.config.ts` is configured for Ladle (should already be done):

```typescript
export default defineConfig({
  testMatch: [
    'refinement/**/*.ladle.spec.ts',  // Current approach
    'refinement/**/*.spec.ts',         // Legacy - can be removed later
    'metrics/**/*.spec.ts',
  ],
  use: {
    baseURL: 'http://localhost:6006',  // Ladle port
  },
  webServer: {
    command: 'npm run catalog:dev',    // Ladle dev server
    url: 'http://localhost:6006/meta.json',
  },
});
```

### Step 6: Run Tests

```bash
# Run all Ladle-based tests (including legacy embedded app tests)
npm run refine:all

# Run only Ladle-based tests
npx playwright test tests/refinement/*.ladle.spec.ts --config=playwright.refinement.config.ts

# Run specific diagram type
npm run refine:motivation
```

### Step 7: Remove Legacy Tests (Optional)

Once migration is complete and all tests pass, you can remove the old embedded app test files:

```bash
# Archive or delete legacy test files
rm tests/refinement/motivation-refinement.spec.ts
rm tests/refinement/business-refinement.spec.ts
rm tests/refinement/c4-refinement.spec.ts
# etc.

# Update package.json scripts if desired (optional)
```

## Detailed Usage

### Diagram-Specific Refinement

Each diagram type has its own refinement test suite that evaluates layout quality:

```bash
# Motivation Layer
npm run refine:motivation

# Output:
# - Layout quality scores for different algorithms
# - Refinement iteration tracking
# - Quality threshold checks
```

```bash
# Business Layer
npm run refine:business

# Output:
# - Process hierarchy analysis
# - Edge length uniformity metrics
# - Layout algorithm comparison
```

```bash
# C4 Architecture
npm run refine:c4

# Output:
# - Container relationship clarity
# - Crossing analysis
# - Multi-level C4 metrics
```

### Interactive Refinement

For visual inspection and manual refinement:

```bash
npm run refine:interactive
```

This opens a headed browser where you can:
- Observe layout changes in real-time
- Capture screenshots during iterations
- Compare different layout algorithms
- Test zoom/pan interactions

### Metrics Report Generation

Generate a comprehensive quality report:

```bash
npm run metrics:report
```

**Output Files:**
- `test-results/metrics/metrics-report.json` - Full JSON report
- `test-results/metrics/metrics-summary.csv` - CSV for analysis
- `test-results/metrics/quality-issues-report.json` - Identified issues

**Report Contents:**
- Overall quality scores for each diagram type
- Layout algorithm comparison
- Individual metric breakdowns
- Quality recommendations

### Regression Checking

Compare current metrics against established baselines:

```bash
npm run metrics:regression-check
```

**Regression Thresholds:**
- **Minor** (< 5% decrease): Logged but not blocking
- **Moderate** (5-10% decrease): Warning, blocks in strict mode
- **Severe** (> 10% decrease): Fails the check

**Quality Floor:** 0.5 minimum acceptable score

**Strict Mode:**
```bash
STRICT_REGRESSION=true npm run metrics:regression-check
```

### Updating Baselines

After intentional layout changes, update the baselines:

```bash
npm run metrics:update-baselines
```

This creates/updates `test-results/baselines/quality-baselines.json`.

## Test Output Structure

```
test-results/
├── baselines/
│   └── quality-baselines.json       # Baseline metrics for regression checks
├── metrics/
│   ├── metrics-report.json          # Comprehensive quality report
│   ├── metrics-summary.csv          # CSV summary for analysis
│   ├── motivation-detailed-report.json
│   ├── business-detailed-report.json
│   ├── c4-detailed-report.json
│   ├── regression-report.json       # Regression check results
│   ├── quality-issues-report.json   # Identified quality issues
│   ├── metrics-history-report.json  # Historical tracking
│   └── github-summary.md            # GitHub Actions summary
└── refinement/
    ├── motivation/
    │   └── motivation-metrics-report.json
    ├── business/
    │   └── business-metrics-report.json
    ├── c4/
    │   └── c4-metrics-report.json
    └── interactive/
        ├── session-report-*.json    # Interactive session logs
        └── *.png                     # Screenshots
```

## CI/CD Integration

### Ladle-Based CI/CD Pipeline

The refinement tests in CI/CD now run against Ladle (port 6006) for optimal performance and isolation.

**Key Improvements:**
- ✅ 40% faster test execution (2-3s startup vs 3-5s)
- ✅ Better parallel scalability (isolated story contexts)
- ✅ More reliable test discovery via meta.json API
- ✅ Cleaner visual captures (preview mode)

### GitHub Actions Workflow

The `layout-regression.yml` workflow runs automatically on PRs that touch:
- `src/core/layout/**`
- `src/core/services/metrics/**`
- `src/core/services/comparison/**`
- `src/apps/embedded/services/refinement/**`
- `src/apps/embedded/components/refinement/**` (story files)
- `src/catalog/fixtures/**` (test fixtures)
- `src/catalog/components/**` (story helpers)
- `tests/refinement/**`
- `tests/metrics/**`

**Workflow Features:**
- Automatic regression detection using Ladle
- PR comments with quality summary
- Artifact upload for investigation
- Baseline updates on main branch
- Parallel sharding support for faster CI

### CI/CD Configuration

The workflow is configured to use Ladle:

```yaml
# .github/workflows/layout-regression.yml
jobs:
  refinement-tests:
    steps:
      - name: Start Ladle Catalog Server
        run: npm run catalog:dev &

      - name: Wait for Ladle Server
        run: npx wait-on http://localhost:6006/meta.json --timeout 120000

      - name: Run refinement tests
        run: npm run refine:all

      - name: Run metrics checks
        run: npm run metrics:regression-check
```

### Parallel Test Execution in CI

For faster CI pipeline execution, tests can be sharded across multiple workers:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npm run catalog:dev &
  - run: npx wait-on http://localhost:6006/meta.json
  - run: |
      npx playwright test \
        tests/refinement/*.ladle.spec.ts \
        --config=playwright.refinement.config.ts \
        --shard=${{ matrix.shard }}/4
```

### Manual Workflow Trigger

```bash
# Via GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Layout Quality Regression Check"
# 3. Click "Run workflow"
# 4. Optionally enable "Update baselines" or "Strict mode"
```

### PR Comment Format

When running on PRs, the workflow posts a comment with:
- Overall pass/fail status
- Summary table of checks (Ladle-based results)
- Regression counts by severity
- Instructions for investigation
- Link to artifact with detailed metrics

## Quality Metrics

### Core Metrics (greadability.js)

| Metric | Description | Weight |
|--------|-------------|--------|
| Crossing Number | Edge crossing density (1 = none) | 25-30% |
| Crossing Angle | Quality of crossing angles (1 = ideal 70°) | 10-15% |
| Angular Resolution Min | Minimum edge spacing at nodes | 15-20% |
| Angular Resolution Dev | Uniformity of edge angles | 10-15% |

### Extended Metrics

| Metric | Description | Weight |
|--------|-------------|--------|
| Edge Length Uniformity | Consistency of edge lengths | 10-25% |
| Node Occlusion | Overlapping node count | 10-15% |
| Aspect Ratio | Layout bounding box ratio | (informational) |
| Density | Graph connectivity | (informational) |

### Diagram-Specific Weights

**Motivation Diagrams:**
- Prioritize crossing minimization (30%)
- Higher angular resolution weight (20%)

**Business Diagrams:**
- Prioritize edge length uniformity (25%)
- Balance between crossings and spacing

**C4 Diagrams:**
- Prioritize crossing minimization (30%)
- Clear container relationships
- No node occlusion tolerance

## Troubleshooting

### Common Issues

**"No baselines found"**
```bash
# Create initial baselines
npm run metrics:update-baselines
```

**"Severe regression detected"**
1. Run `npm run metrics:regression-check` locally
2. Review `test-results/metrics/regression-report.json`
3. If intentional, update baselines
4. If unintentional, fix the layout code

**"Tests timing out"**
```bash
# Increase timeout in playwright config
# Or run specific test:
npx playwright test tests/refinement/motivation-refinement.spec.ts --timeout=60000
```

### Debug Mode

```bash
# Run with Playwright debug UI
npx playwright test tests/refinement/motivation-refinement.spec.ts --debug

# Run with headed browser and slow motion
npx playwright test tests/refinement/motivation-refinement.spec.ts --headed --slowmo=500
```

### Verbose Output

```bash
# Enable verbose logging
DEBUG=pw:api npm run refine:motivation
```

## Best Practices

1. **Run regression checks before PR**
   ```bash
   npm run metrics:regression-check
   ```

2. **Update baselines after intentional changes**
   ```bash
   npm run metrics:update-baselines
   git add test-results/baselines/
   git commit -m "Update layout quality baselines"
   ```

3. **Review quality reports regularly**
   ```bash
   npm run metrics:report
   cat test-results/metrics/quality-issues-report.json | jq '.issues'
   ```

4. **Use interactive mode for visual verification**
   ```bash
   npm run refine:interactive
   ```

5. **Set up baseline snapshots in CI**
   - Baselines are stored as GitHub artifacts
   - Automatically updated on main branch merges

## API Reference

### Quality Score Calculation

```typescript
import { calculateLayoutQuality } from '../src/core/services/metrics/graphReadabilityService';

const report = calculateLayoutQuality(nodes, edges, 'hierarchical', 'motivation');

console.log(report.overallScore);     // 0.0 - 1.0
console.log(report.metrics);          // Core metrics
console.log(report.extendedMetrics);  // Extended metrics
```

### Regression Detection

```typescript
import { MetricsHistoryService } from '../src/core/services/metrics/metricsHistoryService';

const service = new MetricsHistoryService();
const regression = service.detectRegression(currentReport);

if (regression.hasRegression) {
  console.log(`Severity: ${regression.severity}`);
  console.log(`Change: ${regression.overallPercentageChange}%`);
}
```

### Combined Quality Score

```typescript
import { calculateCombinedScore } from '../src/core/services/comparison/qualityScoreService';

const score = await calculateCombinedScore(
  nodes,
  edges,
  'hierarchical',
  'c4',
  generatedScreenshot,
  referenceImage
);

console.log(score.qualityClass);  // 'excellent' | 'good' | 'acceptable' | 'poor'
console.log(score.meetsThreshold);
```

## Example Refinement Session Walkthrough

This section provides a step-by-step walkthrough of a complete refinement session for improving a C4 container diagram layout.

### Scenario

You've made changes to the C4 container layout algorithm and want to verify the quality hasn't regressed, and potentially improve it.

### Step 1: Check Current Quality

```bash
# Run the C4 refinement tests to see current state
npm run refine:c4
```

**Sample Output:**
```
Running C4 Architecture Refinement Tests...

Test: c4-container-layout-quality
  Layout Algorithm: hierarchical
  Initial Quality Score: 0.72 (acceptable)

  Metrics Breakdown:
    - Crossing Number:      0.85 (good)
    - Crossing Angle:       0.78 (acceptable)
    - Angular Resolution:   0.68 (fair)
    - Edge Length:          0.71 (acceptable)

  Warnings:
    - Angular resolution below target (0.80)
    - 2 edge crossings detected
```

### Step 2: Generate Detailed Report

```bash
npm run metrics:report
```

**Review the report:**
```bash
cat test-results/metrics/c4-detailed-report.json | jq '.metrics'
```

**Sample Report Excerpt:**
```json
{
  "diagramType": "c4",
  "layoutType": "hierarchical",
  "overallScore": 0.72,
  "metrics": {
    "crossingNumber": 0.85,
    "crossingAngle": 0.78,
    "angularResolutionMin": 0.68,
    "angularResolutionDev": 0.72
  },
  "extendedMetrics": {
    "edgeLength": {
      "min": 80,
      "max": 320,
      "mean": 156,
      "stdDev": 45.2
    },
    "nodeNodeOcclusion": 0,
    "aspectRatio": 1.4,
    "density": 0.35
  },
  "warnings": [
    "Angular resolution (0.68) below threshold (0.80)",
    "Edge length variance high (stdDev: 45.2)"
  ],
  "suggestions": [
    "Increase rank spacing to improve angular resolution",
    "Adjust node spacing for more uniform edge lengths"
  ]
}
```

### Step 3: Run Interactive Refinement

```bash
npm run refine:interactive
```

This opens a headed browser. The test pauses at key points:

1. **Initial Layout**: Observe the current layout
2. **After Each Iteration**: See the effect of parameter changes
3. **Final Layout**: Compare before/after

**In the browser:**
- Navigate to the C4 diagram view
- Use the refinement feedback panel
- Provide feedback on layout aspects

### Step 4: Provide Human Feedback

Using the RefinementFeedbackPanel in the UI:

**Iteration 1:**
```
Aspect: spacing
Direction: increase
Intensity: moderate
Notes: "Containers are too close together, edges crossing"
```

**System Response:**
```
Parameter Adjustments:
  - hierarchical.nodeSpacing: 100 → 130 (+30)
  - hierarchical.rankSpacing: 150 → 188 (+38)

Re-calculating layout...

New Quality Score: 0.76 (+0.04)
  - Crossing Number:      0.88 (+0.03)
  - Angular Resolution:   0.73 (+0.05)
```

**Iteration 2:**
```
Aspect: alignment
Direction: increase
Intensity: slight
Notes: "Better, but some nodes not aligned"
```

**System Response:**
```
Parameter Adjustments:
  - hierarchical.nodeSpacing: 130 → 140 (+10)

Re-calculating layout...

New Quality Score: 0.79 (+0.03)
  - Crossing Number:      0.90 (+0.02)
  - Angular Resolution:   0.76 (+0.03)
```

**Iteration 3:**
```
Aspect: overall
Direction: acceptable
Intensity: N/A
Notes: "Layout looks good now"
```

### Step 5: Review Session Results

The session generates a report at `test-results/refinement/interactive/session-report-{timestamp}.json`:

```json
{
  "sessionId": "c4-refinement-2025-12-05T10-30-00",
  "diagramType": "c4",
  "layoutType": "hierarchical",
  "iterations": [
    {
      "iteration": 0,
      "qualityScore": 0.72,
      "parameters": {
        "nodeSpacing": 100,
        "rankSpacing": 150
      },
      "feedback": null
    },
    {
      "iteration": 1,
      "qualityScore": 0.76,
      "parameters": {
        "nodeSpacing": 130,
        "rankSpacing": 188
      },
      "feedback": {
        "aspect": "spacing",
        "direction": "increase",
        "intensity": "moderate"
      },
      "improvement": 0.04
    },
    {
      "iteration": 2,
      "qualityScore": 0.79,
      "parameters": {
        "nodeSpacing": 140,
        "rankSpacing": 188
      },
      "feedback": {
        "aspect": "alignment",
        "direction": "increase",
        "intensity": "slight"
      },
      "improvement": 0.03
    }
  ],
  "finalScore": 0.79,
  "totalImprovement": 0.07,
  "duration": "3m 45s",
  "status": "completed"
}
```

### Step 6: Update Layout Defaults (If Appropriate)

If the new parameters should become the defaults:

1. Update the layout engine configuration:
   ```typescript
   // src/core/layout/business/HierarchicalBusinessLayout.ts
   const DEFAULT_OPTIONS = {
     nodeSpacing: 140,  // Was 100
     rankSpacing: 188,  // Was 150
     // ...
   };
   ```

2. Run tests to verify:
   ```bash
   npm run refine:c4
   npm run metrics:regression-check
   ```

3. Update baselines:
   ```bash
   npm run metrics:update-baselines
   ```

4. Commit changes:
   ```bash
   git add src/core/layout/business/HierarchicalBusinessLayout.ts
   git add test-results/baselines/quality-baselines.json
   git commit -m "Improve C4 container layout defaults based on refinement session"
   ```

### Step 7: Verify No Regressions

```bash
npm run metrics:regression-check
```

**Expected Output:**
```
Regression Check Results:

  C4 Diagrams:
    Baseline Score: 0.72
    Current Score:  0.79
    Change:         +9.7% (improvement)
    Status:         PASS

  Business Diagrams:
    Baseline Score: 0.81
    Current Score:  0.81
    Change:         0.0%
    Status:         PASS

  Motivation Diagrams:
    Baseline Score: 0.85
    Current Score:  0.84
    Change:         -1.2% (minor)
    Status:         PASS

Overall: 3/3 passed, 0 regressions detected
```

### Session Summary

| Phase | Duration | Result |
|-------|----------|--------|
| Initial Assessment | 30s | Score: 0.72 |
| Report Analysis | 1m | Identified weak metrics |
| Interactive Refinement | 3m | 3 iterations |
| Verification | 30s | No regressions |
| **Total** | **~5m** | **+9.7% improvement** |

### Tips for Effective Refinement

1. **Start with metrics report** - Understand which metrics are weak before starting
2. **Use moderate intensity first** - Avoid overcorrecting
3. **Focus on one aspect at a time** - Makes it easier to attribute improvements
4. **Take screenshots** - Visual comparison helps validate metrics
5. **Document your rationale** - Use the notes field to explain changes
6. **Verify other diagram types** - Layout changes may affect other views

---

## Related Documentation

- [VISUALIZATION_OPTIMIZATION.md](./VISUALIZATION_OPTIMIZATION.md) - System architecture overview
- [REFERENCE_DIAGRAMS.md](./REFERENCE_DIAGRAMS.md) - Reference diagram catalog
- [TROUBLESHOOTING_LAYOUT.md](./TROUBLESHOOTING_LAYOUT.md) - Common issues and solutions
- [Layout Algorithms](./layout-algorithms.md) - Detailed layout algorithm documentation
- [C4 Visualization](./C4_VISUALIZATION.md) - C4 diagram specifics
- [YAML Models](./claude_thoughts/YAML_MODELS.md) - Model format specification

---

**Last Updated:** 2025-12-05
**Version:** 1.0.0
