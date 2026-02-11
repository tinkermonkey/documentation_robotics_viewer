import type { TestRunnerConfig } from '@storybook/test-runner';
import { isExpectedConsoleError, isKnownRenderingBug } from '../tests/stories/storyErrorFilters';

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Capture console errors in browser context using window.__ERRORS__
    await page.evaluateOnNewDocument(() => {
      window.__ERRORS__ = [];
      const originalError = console.error;
      console.error = (...args: any[]) => {
        window.__ERRORS__.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
  },

  async postVisit(page, context) {
    // Reuse existing 3-tier error classification system
    const errors = await page.evaluate(() => window.__ERRORS__ || []);

    const criticalErrors = errors.filter((error: string) => {
      if (isExpectedConsoleError(error)) return false;
      if (isKnownRenderingBug(error)) {
        console.warn(`Known rendering bug in ${context.id}: ${error}`);
        return false;
      }
      return true;
    });

    if (criticalErrors.length > 0) {
      throw new Error(
        `Critical errors in story ${context.id}:\n${criticalErrors.join('\n')}`
      );
    }
  },
};

export default config;

// Type augmentation for window.__ERRORS__
declare global {
  interface Window {
    __ERRORS__: string[];
  }
}
