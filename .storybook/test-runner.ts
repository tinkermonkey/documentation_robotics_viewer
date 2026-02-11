import type { TestRunnerConfig } from '@storybook/test-runner';
import { isExpectedConsoleError, isKnownRenderingBug } from '../tests/stories/storyErrorFilters';

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Inject axe-core for accessibility testing via axe-playwright
    try {
      // Load axe-core script into the page
      await page.addScriptTag({
        url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.0/axe.min.js',
      });
    } catch (err) {
      // axe-core might already be injected by addon, this is optional
      console.warn('Could not inject axe-core via CDN:', err);
    }
  },

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

    // Run accessibility checks if axe-core is available
    try {
      // axe-core is injected by the a11y addon
      const results = await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          // @ts-ignore - axe is globally injected
          if (typeof window.axe !== 'undefined') {
            // @ts-ignore
            window.axe.run(
              { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } },
              (error: any, results: any) => {
                if (error) reject(error);
                else resolve(results);
              }
            );
          } else {
            // axe-core not available, skip accessibility checks
            resolve(null);
          }
        });
      });

      if (results) {
        const typedResults = results as any;
        const violations = typedResults.violations || [];

        // Report accessibility violations with context
        if (violations.length > 0) {
          const violationSummary = violations
            .map((v: any) => `  - ${v.id} (impact: ${v.impact}): ${v.description}`)
            .join('\n');

          console.warn(`Accessibility violations detected in story "${context.id}":\n${violationSummary}`);

          // Treat high-impact violations as failures
          const highImpactViolations = violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious');
          if (highImpactViolations.length > 0) {
            const highImpactSummary = highImpactViolations
              .map((v: any) => `${v.id} (impact: ${v.impact})`)
              .join(', ');
            throw new Error(`High-impact accessibility violations in story "${context.id}": ${highImpactSummary}`);
          }
        }
      }
    } catch (error) {
      // If error is about accessibility violations, throw it
      if (error instanceof Error && error.message.includes('accessibility violations')) {
        throw error;
      }
      // Otherwise, log but don't fail (axe might not be available in all environments)
      if (error instanceof Error && error.message !== 'axe-core not available') {
        console.warn(`Accessibility check issue in story "${context.id}":`, error);
      }
    }
  },
};

export default config;

// Type augmentation for window.__ERRORS__
declare global {
  interface Window {
    __ERRORS__: string[];
    axe?: {
      run: (
        options: any,
        callback: (error: any, results: any) => void
      ) => void;
    };
  }
}
