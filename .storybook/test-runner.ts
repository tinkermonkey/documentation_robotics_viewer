import type { TestRunnerConfig } from '@storybook/test-runner';
import AxeBuilder from '@axe-core/playwright';
import { isExpectedConsoleError, isKnownRenderingBug } from '../tests/stories/storyErrorFilters.ts';

/**
 * Check if error is a Storybook test-runner initialization issue
 */
function isStorybookTestRunnerError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for StorybookTestRunnerError by name
    if (error.name === 'StorybookTestRunnerError') {
      return true;
    }
    // Check for temporal dead zone error: ReferenceError with 'Cannot access StorybookTestRunnerError'
    if (error.name === 'ReferenceError' &&
        error.message?.includes('Cannot access StorybookTestRunnerError')) {
      return true;
    }
  }
  return false;
}

// Extend Window interface for test-runner injected properties
declare global {
  interface Window {
    __errorMessages__: string[];
    __pageErrors__: string[];
    __STORYBOOK_MOCK_WEBSOCKET__?: boolean;
  }
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Initialize error collection arrays on the page context
    await page.evaluate(() => {
      window.__errorMessages__ = [];
      window.__pageErrors__ = [];
    });

    // Register console error listener - push errors to page's __errorMessages__
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Accumulate errors in a queue to avoid concurrent page.evaluate calls
        page.evaluate((error) => {
          window.__errorMessages__?.push(error);
        }, text).catch((err) => {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[test-runner] Failed to record console error: ${errorMsg}`);
        });
      }
    });

    // Register page error listener - push errors to page's __pageErrors__
    page.on('pageerror', (error) => {
      const errorText = error.toString();
      // Accumulate errors in a queue to avoid concurrent page.evaluate calls
      page.evaluate((err) => {
        window.__pageErrors__?.push(err);
      }, errorText).catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[test-runner] Failed to record page error: ${errorMsg}`);
      });
    });
  },

  async postVisit(page, context) {
    try {
      // Run accessibility checks using @axe-core/playwright AxeBuilder
      // AxeBuilder handles axe-core injection automatically during analyze()
      // Disable color-contrast for architecture visualization (complex color schemes)
      try {
        const results = await new AxeBuilder({ page })
          .include('#storybook-root')
          .disableRules([
            'color-contrast',
            'region',
            'landmark-no-duplicate-main',
            'landmark-main-is-top-level'
          ])
          .analyze();

        // Report all violations (critical, serious, moderate, minor)
        const violations = results.violations;

        if (violations.length > 0) {
          const violationDetails = violations
            .map((v) => {
              const nodes = v.nodes.map((n) => n.html).join('\n  ');
              return `- ${v.id} (${v.impact}): ${v.description}\n  ${nodes}`;
            })
            .join('\n');
          throw new Error(
            `Accessibility violations found in story "${context.id}":\n${violationDetails}`
          );
        }
      } catch (error) {
        // Re-throw accessibility violation errors
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('Accessibility violations') || errorMsg.includes('violation')) {
          throw error;
        }
        // Non-violation errors from AxeBuilder (e.g., page context issues)
        throw new Error(
          `Accessibility check failed for story "${context.id}": ${errorMsg}`
        );
      }

      // Check for collected console and page errors after all tests
      let errors: string[] = [];
      try {
        errors = await page.evaluate(() => {
          const collected = [
            ...(window.__errorMessages__ || []),
            ...(window.__pageErrors__ || []),
          ];
          return collected;
        });
      } catch (evalError) {
        // If page.evaluate fails (e.g., due to Storybook test-runner initialization issues),
        // only silently skip error collection if it's a known initialization issue.
        // Otherwise, re-throw the error to the outer catch block for proper handling.
        if (isStorybookTestRunnerError(evalError)) {
          // Known Storybook test-runner initialization issue - silently skip error collection
          return;
        }
        // Re-throw unknown errors to outer catch block
        throw evalError;
      }

      for (const error of errors) {
        if (!isExpectedConsoleError(error) && !isKnownRenderingBug(error)) {
          throw new Error(`Critical error in story ${context.id}: ${error}`);
        }
      }
    } catch (postVisitError) {
      // If the entire postVisit fails due to Storybook test-runner issues, only throw if it's not known
      if (isStorybookTestRunnerError(postVisitError)) {
        // Known Storybook test-runner initialization issue - log but don't fail
        console.warn(`[test-runner] Storybook test-runner initialization issue in story "${context.id}": skipping error checks`);
        return;
      }
      // Re-throw other errors
      throw postVisitError;
    }
  },
};

export default config;
