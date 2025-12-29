/**
 * Ladle Story Validation Test Suite
 *
 * DEPRECATED: This comprehensive test suite has been split into smaller batches
 * to prevent timeout issues. Use the following instead:
 *
 * - tests/ladle-story-validation-components.spec.ts (4 batches, ~150 stories)
 * - tests/ladle-story-validation-graphs.spec.ts (8 batches, ~300 stories)
 *
 * The batched approach allows each test to complete within the timeout limit
 * and provides better granularity for debugging failures.
 *
 * This file is kept for backward compatibility but will skip all tests.
 *
 * Run with: npx playwright test tests/ladle-story-validation.spec.ts --config=playwright.refinement.config.ts
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
 * Main test suite - DEPRECATED in favor of batched tests
 */
test.describe('Ladle Story Validation', () => {
  test.skip('validate all stories - DEPRECATED', async () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                     TEST SUITE DEPRECATED                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  This comprehensive test has been split into smaller batches  ║
║  to prevent timeout issues. Please use instead:               ║
║                                                                ║
║  • tests/ladle-story-validation-components.spec.ts             ║
║    (4 batches covering ~150 component stories)                ║
║                                                                ║
║  • tests/ladle-story-validation-graphs.spec.ts                 ║
║    (8 batches covering ~300 graph stories)                    ║
║                                                                ║
║  Benefits of batched approach:                                ║
║  ✓ Each batch completes within timeout limits                 ║
║  ✓ Better granularity for debugging failures                  ║
║  ✓ Faster feedback on specific story categories               ║
║  ✓ Can run batches in parallel for faster CI                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
});
