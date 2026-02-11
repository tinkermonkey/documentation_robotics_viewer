import type { TestRunnerConfig } from '@storybook/test-runner';
import { isExpectedConsoleError, isKnownRenderingBug } from '../tests/stories/storyErrorFilters';

const config: TestRunnerConfig = {
  async postVisit(page, context) {
    // Reuse existing 3-tier error classification system
    // Capture console errors from the page
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!isExpectedConsoleError(text) && !isKnownRenderingBug(text)) {
          throw new Error(`Critical error in story ${context.id}: ${text}`);
        }
      }
    });

    // Also check for any JavaScript errors
    page.on('pageerror', (error) => {
      const text = error.toString();
      if (!isExpectedConsoleError(text) && !isKnownRenderingBug(text)) {
        throw new Error(`Critical error in story ${context.id}: ${text}`);
      }
    });
  },
};

export default config;

// Type augmentation for window.__ERRORS__
declare global {
  interface Window {
    __ERRORS__: string[];
  }
}
