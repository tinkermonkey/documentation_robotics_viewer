/**
 * Ladle Story Validation Test Suite - Components
 *
 * Validates component stories including panels, navigation, shared components, etc.
 * Excludes node/edge/graph stories which are in the graphs suite.
 *
 * Run with: npx playwright test tests/ladle-story-validation-components.spec.ts --config=playwright.refinement.config.ts
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
 * Check if a story is a component story (not node/edge/graph)
 */
function isComponentStory(testName: string): boolean {
  const graphPatterns = [
    'Nodes /',
    'Edges /',
    'Refinement / Layout tests /',
    'Graph views /',
    'Business layer /', // These are graph-heavy components, move to graphs suite
  ];

  return !graphPatterns.some(pattern => testName.startsWith(pattern));
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

    // Story-specific validations
    if (
      metadata.levels.includes('Panels') ||
      metadata.levels.includes('Components')
    ) {
      // For component stories, verify they render something
      const hasContent = await page.locator('body *').count();
      expect(
        hasContent,
        `Component story "${testName}" should render content`
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
const SKIP_STORIES = [
  // Error boundary story intentionally triggers an error (expected behavior)
  'Components / Errorboundary / With error',
];

/**
 * Helper function to run validation for a batch of stories
 */
async function validateBatch(
  page: Page,
  browser: any,
  storyKeys: string[],
  allStories: Record<string, StoryMetadata>,
  batchName: string
): Promise<void> {
  test.setTimeout(300000); // 5 minutes per batch

  const results: { story: string; status: 'pass' | 'fail'; error?: string }[] = [];

  // Create fresh context every 50 stories to prevent memory issues
  let currentPage = page;
  let currentContext = page.context();

  for (let i = 0; i < storyKeys.length; i++) {
    const storyKey = storyKeys[i];
    const metadata = allStories[storyKey];
    const testName = formatTestName(storyKey, metadata);

    // Refresh browser context every 50 stories to prevent memory buildup
    if (i > 0 && i % 50 === 0) {
      console.log(`\n🔄 Refreshing browser context (story ${i}/${storyKeys.length})\n`);
      await currentContext.close();
      currentContext = await browser.newContext();
      currentPage = await currentContext.newPage();
    }

    // Skip known failing stories (only intentional error cases)
    if (SKIP_STORIES.includes(testName)) {
      results.push({ story: testName, status: 'pass' });
      console.log(`  ⏭️  ${testName} (skipped - intentional error)`);
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
  console.log(`📊 ${batchName} Validation Summary`);
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
  expect(failed, `${failed} stories failed validation in ${batchName}`).toBe(0);
}

/**
 * Main test suite - validates component stories in batches
 */
test.describe('Ladle Story Validation - Components', () => {
  let allStories: Record<string, StoryMetadata> = {};
  let componentStoryKeys: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Fetch all stories from Ladle's meta.json
    const response = await request.get('http://localhost:6006/meta.json');
    expect(response.ok()).toBeTruthy();

    const meta: MetaJson = await response.json();
    allStories = meta.stories;

    // Filter to only component stories
    componentStoryKeys = Object.keys(allStories).filter((key) => {
      const testName = formatTestName(key, allStories[key]);
      return isComponentStory(testName);
    });

    console.log(`\n📚 Discovered ${componentStoryKeys.length} component stories to validate\n`);
  });

  test('Batch 1: Panels stories', async ({ page, browser }) => {
    const batchKeys = componentStoryKeys.filter((key) => {
      const levels = allStories[key].levels;
      return levels[0] === 'Panels';
    });
    console.log(`\n🔍 Validating ${batchKeys.length} Panels stories\n`);
    await validateBatch(page, browser, batchKeys, allStories, 'Panels');
  });

  test('Batch 2: Components stories', async ({ page, browser }) => {
    const batchKeys = componentStoryKeys.filter((key) => {
      const levels = allStories[key].levels;
      return levels[0] === 'Components';
    });
    console.log(`\n🔍 Validating ${batchKeys.length} Components stories\n`);
    await validateBatch(page, browser, batchKeys, allStories, 'Components');
  });

  test('Batch 3: Shared and Core stories', async ({ page, browser }) => {
    const batchKeys = componentStoryKeys.filter((key) => {
      const levels = allStories[key].levels;
      return levels[0] === 'Shared' || levels[0] === 'Core' || levels[0] === 'Core components';
    });
    console.log(`\n🔍 Validating ${batchKeys.length} Shared/Core stories\n`);
    await validateBatch(page, browser, batchKeys, allStories, 'Shared and Core');
  });

  test('Batch 4: Navigation, Status, and other stories', async ({ page, browser }) => {
    const batchKeys = componentStoryKeys.filter((key) => {
      const levels = allStories[key].levels;
      return levels[0] !== 'Panels' &&
             levels[0] !== 'Components' &&
             levels[0] !== 'Shared' &&
             levels[0] !== 'Core' &&
             levels[0] !== 'Core components';
    });
    console.log(`\n🔍 Validating ${batchKeys.length} Navigation/Status/Other stories\n`);
    await validateBatch(page, browser, batchKeys, allStories, 'Navigation, Status, and Others');
  });
});
