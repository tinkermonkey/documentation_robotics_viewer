/**
 * Shared Story Test Utilities
 *
 * Common helpers used across story test files to:
 * - Convert Storybook story IDs to iframe URLs
 * - Validate story rendering state
 * - Check error patterns
 *
 * This module is a single source of truth for story test helpers,
 * preventing duplication across multiple test files.
 */

/**
 * Convert Storybook story ID to iframe URL
 *
 * Example:
 *   storyUrl('architecture-nodes--motivation--goalnode--default')
 *   → '/iframe.html?id=architecture-nodes--motivation--goalnode--default&viewMode=story'
 *
 * @param storyId - The Storybook story ID from CSF3 meta.id + story key
 * @returns Full iframe URL for navigating to the story
 */
export function storyUrl(storyId: string): string {
  return `/iframe.html?id=${storyId}&viewMode=story`;
}

/**
 * Wait for a story to load with explicit success/failure states
 *
 * Storybook wraps stories in StoryLoadedWrapper which sets data-storyloaded:
 * - 'true': Story loaded successfully with React Flow initialized
 * - 'timeout': Story timed out waiting for React Flow nodes
 * - undefined: Story still loading
 *
 * @param page - Playwright page object
 * @param options - Configuration options
 * @returns Promise that resolves when story loads or times out
 */
export async function waitForStoryLoaded(
  page: import('@playwright/test').Page,
  options?: {
    timeout?: number;
  }
): Promise<'success' | 'timeout'> {
  const timeout = options?.timeout ?? 35000; // Slightly more than StoryLoadedWrapper's 30s max wait

  try {
    await page.locator('[data-storyloaded="true"]').waitFor({ timeout });
    return 'success';
  } catch {
    // Check if timed out specifically
    const timedOutElement = await page.locator('[data-storyloaded="timeout"]').count();
    if (timedOutElement > 0) {
      return 'timeout';
    }
    throw new Error('Story failed to load or provide status');
  }
}
