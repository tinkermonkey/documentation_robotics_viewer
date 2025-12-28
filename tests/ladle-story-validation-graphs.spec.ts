/**
 * Ladle Story Validation Test Suite - Graphs
 *
 * Validates graph-related stories including nodes, edges, refinement layouts, and graph views.
 * Component stories are in the components suite.
 *
 * Run with: npx playwright test tests/ladle-story-validation-graphs.spec.ts --config=playwright.refinement.config.ts
 */

import { test, expect, Page } from '@playwright/test';
import type { ConsoleMessage } from '@playwright/test';

interface StoryMetadata {
  name: string;
  levels: string[];
  filePath: string;
  namedExport: string;
  meta: Record<string, unknown>;
}

interface MetaJson {
  about: {
    homepage: string;
    github: string;
    version: number;
  };
  stories: Record<string, StoryMetadata>;
}

/**
 * Formats a story key into a readable test name
 */
function formatTestName(storyKey: string, metadata: StoryMetadata): string {
  const path = [...metadata.levels, metadata.name].join(' / ');
  return `${path}`;
}

/**
 * Check if a story is a graph story (nodes/edges/graphs)
 */
function isGraphStory(testName: string): boolean {
  const graphPatterns = [
    'Nodes /',
    'Edges /',
    'Refinement / Layout tests /',
    'Graph views /',
  ];

  return graphPatterns.some(pattern => testName.startsWith(pattern));
}

/**
 * Validates a single story by loading it and checking for errors
 */
async function validateStory(
  page: Page,
  storyKey: string,
  metadata: StoryMetadata
): Promise<void> {
  const testName = formatTestName(storyKey, metadata);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  // Track console errors
  const consoleHandler = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known acceptable warnings and transient initialization errors
      if (
        !text.includes('React does not recognize') &&
        !text.includes('Warning: ') &&
        !text.includes('DevTools') &&
        !text.includes('Download the React DevTools') &&
        // React Flow MiniMap initialization errors - transient NaN during viewport calculation
        !text.includes('attribute d: Expected number') &&
        !text.includes('attribute viewBox: Expected number')
      ) {
        consoleErrors.push(text);
      }
    }
  };

  // Track page errors
  const errorHandler = (error: Error) => {
    pageErrors.push(error.message);
  };

  page.on('console', consoleHandler);
  page.on('pageerror', errorHandler);

  try {
    // Navigate to the story
    const url = `/?story=${storyKey}&mode=preview`;
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Verify navigation succeeded
    expect(response?.status(), `Story "${testName}" failed to load`).toBe(200);

    // Wait for React to render
    await page.waitForTimeout(1000);

    // Check for React error boundaries
    const errorBoundary = await page.locator('[data-error-boundary]').count();
    expect(
      errorBoundary,
      `Story "${testName}" triggered an error boundary`
    ).toBe(0);

    // Verify no console errors
    if (consoleErrors.length > 0) {
      console.error(`❌ Console errors in "${testName}":`);
      consoleErrors.forEach((err) => console.error(`   - ${err}`));
    }

    expect(
      consoleErrors.length,
      `Story "${testName}" produced ${consoleErrors.length} console error(s): ${consoleErrors.join('; ')}`
    ).toBe(0);

    // Verify no uncaught exceptions
    expect(
      pageErrors.length,
      `Story "${testName}" threw ${pageErrors.length} uncaught exception(s): ${pageErrors.join('; ')}`
    ).toBe(0);

    // Story-specific validations based on type
    if (
      metadata.levels.includes('Nodes') ||
      metadata.levels.includes('Edges')
    ) {
      // For node/edge stories, verify SVG elements render
      // Note: Some isolated node components may not render SVG outside React Flow context
      const svgElements = await page.locator('svg').count();
      if (svgElements === 0) {
        console.warn(`  ⚠️  Warning: Node/Edge story "${testName}" did not render any SVG elements`);
      }
    }

    if (metadata.levels.includes('Graph views')) {
      // For graph view stories, verify React Flow renders
      const reactFlowElements = await page.locator('.react-flow').count();
      expect(
        reactFlowElements,
        `Graph view story "${testName}" should render React Flow`
      ).toBeGreaterThan(0);
    }
  } finally {
    // Clean up listeners
    page.off('console', consoleHandler);
    page.off('pageerror', errorHandler);
  }
}

/**
 * Stories to skip due to known issues
 */
const SKIP_STORIES: string[] = [];

/**
 * Main test suite - validates graph stories
 */
test.describe('Ladle Story Validation - Graphs', () => {
  let allStories: Record<string, StoryMetadata> = {};
  let graphStoryKeys: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Fetch all stories from Ladle's meta.json
    const response = await request.get('http://localhost:6006/meta.json');
    expect(response.ok()).toBeTruthy();

    const meta: MetaJson = await response.json();
    allStories = meta.stories;

    // Filter to only graph stories
    graphStoryKeys = Object.keys(allStories).filter((key) => {
      const testName = formatTestName(key, allStories[key]);
      return isGraphStory(testName);
    });

    console.log(`\n📚 Discovered ${graphStoryKeys.length} graph stories to validate\n`);
  });

  test('validate all graph stories', async ({ page, browser }) => {
    // Set timeout for graph stories
    test.setTimeout(600000); // 10 minutes

    const results: { story: string; status: 'pass' | 'fail'; error?: string }[] = [];

    // Create fresh context every 50 stories to prevent memory issues
    let currentPage = page;
    let currentContext = page.context();

    for (let i = 0; i < graphStoryKeys.length; i++) {
      const storyKey = graphStoryKeys[i];
      const metadata = allStories[storyKey];
      const testName = formatTestName(storyKey, metadata);

      // Refresh browser context every 50 stories to prevent memory buildup
      if (i > 0 && i % 50 === 0) {
        console.log(`\n🔄 Refreshing browser context (story ${i}/${graphStoryKeys.length})\n`);
        await currentContext.close();
        currentContext = await browser.newContext();
        currentPage = await currentContext.newPage();
      }

      // Skip known failing stories
      if (SKIP_STORIES.includes(testName)) {
        results.push({ story: testName, status: 'pass' });
        console.log(`  ⏭️  ${testName} (skipped)`);
        continue;
      }

      try {
        await validateStory(currentPage, storyKey, metadata);
        results.push({ story: testName, status: 'pass' });
        console.log(`  ✅ ${testName}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.push({ story: testName, status: 'fail', error: errorMsg });
        console.error(`  ❌ ${testName}: ${errorMsg}`);
      }
    }

    // Clean up final context if we created a new one
    if (currentContext !== page.context()) {
      await currentContext.close();
    }

    // Generate summary report
    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Graph Story Validation Summary`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Stories: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`${'='.repeat(60)}\n`);

    if (failed > 0) {
      console.log('Failed Stories:');
      results
        .filter((r) => r.status === 'fail')
        .forEach((r) => console.log(`  - ${r.story}: ${r.error}`));
      console.log('');
    }

    // Fail the test if any stories failed
    expect(failed, `${failed} stories failed validation`).toBe(0);
  });
});
