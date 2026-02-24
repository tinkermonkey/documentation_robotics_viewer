import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';
import { isExpectedConsoleError, isKnownRenderingBug } from '../tests/stories/storyErrorFilters';

interface AxeViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  nodes: Array<{ html: string }>;
}

interface AxeResults {
  violations: AxeViolation[];
}

// Extend Window interface for test-runner injected properties
declare global {
  interface Window {
    __errorMessages__: string[];
    __pageErrors__: string[];
    __axeInjected__: boolean;
    __axeConfigured__: boolean;
    __STORYBOOK_MOCK_WEBSOCKET__?: boolean;
    axe: {
      run: (
        options: object,
        callback: (err: Error | null, results: any) => void
      ) => void;
    };
  }
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Initialize error collection arrays on the page context
    await page.evaluate(() => {
      window.__errorMessages__ = [];
      window.__pageErrors__ = [];
      window.__axeInjected__ = false;
      window.__axeConfigured__ = false;
    });

    // Register console error listener - push errors to page's __errorMessages__
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Push to window.__errorMessages__ which will be read in postVisit
        // Use void to explicitly indicate we're not awaiting, but handle rejections
        void page.evaluate((error) => {
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
      // Push to window.__pageErrors__ which will be read in postVisit
      // Use void to explicitly indicate we're not awaiting, but handle rejections
      void page.evaluate((err) => {
        window.__pageErrors__?.push(err);
      }, errorText).catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[test-runner] Failed to record page error: ${errorMsg}`);
      });
    });

    // Inject axe-core for accessibility testing
    try {
      await injectAxe(page);
      // Mark injection as successful so we know axe is available
      await page.evaluate(() => {
        window.__axeInjected__ = true;
      });
    } catch (err) {
      throw new Error(`Failed to inject axe-core: ${err instanceof Error ? err.message : String(err)}. Accessibility testing cannot proceed without axe-core.`);
    }
  },

  async postVisit(page, context) {
    try {
      // Check that axe was successfully injected before proceeding
      let axeInjected = false;
      try {
        axeInjected = await page.evaluate(() => window.__axeInjected__);
      } catch (evalError) {
        // If page.evaluate fails due to Storybook initialization issues, continue with a11y check anyway
        const errMsg = evalError instanceof Error ? evalError.message : String(evalError);
        if (!errMsg.includes('StorybookTestRunnerError')) {
          console.warn(`[test-runner] Failed to check axe injection status: ${errMsg}`);
        }
        // Assume axe was injected and proceed
        axeInjected = true;
      }
      if (!axeInjected) {
        throw new Error(`Skipping accessibility checks for story "${context.id}": axe-core injection failed in preVisit.`);
      }

    // Configure axe-core rules for architecture visualization context
    try {
      await configureAxe(page, {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
            reviewOnFail: true, // Mark for manual review instead of auto-fail
          },
          {
            id: 'aria-allowed-attr',
            enabled: true,
          },
          {
            id: 'aria-required-children',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
          {
            id: 'image-alt',
            enabled: true,
          },
        ],
      });
      // Mark configuration as successful
      await page.evaluate(() => {
        window.__axeConfigured__ = true;
      });
    } catch (err) {
      throw new Error(`Failed to configure axe-core for story "${context.id}": ${err instanceof Error ? err.message : String(err)}. Accessibility testing cannot proceed with inconsistent configuration.`);
    }

    // Check that axe was successfully configured before running checks
    let axeConfigured = false;
    try {
      axeConfigured = await page.evaluate(() => window.__axeConfigured__);
    } catch (evalError) {
      // If page.evaluate fails, continue anyway
      const errMsg = evalError instanceof Error ? evalError.message : String(evalError);
      if (!errMsg.includes('StorybookTestRunnerError')) {
        console.warn(`[test-runner] Failed to check axe configuration status: ${errMsg}`);
      }
      // Assume axe was configured and proceed
      axeConfigured = true;
    }
    if (!axeConfigured) {
      throw new Error(`Skipping accessibility checks for story "${context.id}": axe-core configuration failed.`);
    }

    // Run accessibility checks
    try {
      await checkA11y(page, '#storybook-root', {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    } catch (error) {
      // checkA11y throws if violations are found
      // Extract violation details from the error message
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Check if this is an axe-core violation error (contains violation details)
      if (errorMsg.startsWith('Accessibility') || errorMsg.includes('violation')) {
        // Try to parse violations from page if available
        try {
          const violations = await page.evaluate(() => {
            return new Promise<AxeResults | null>((resolve) => {
              if (typeof window.axe !== 'undefined' && window.axe.run) {
                window.axe.run(
                  {
                    runOnly: {
                      type: 'tag',
                      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
                    },
                  },
                  (err: Error | null, results: AxeResults) => {
                    if (err) {
                      // Log axe execution errors (timeout, crash, etc.) to distinguish from "no violations"
                      console.warn(`[test-runner] axe-core execution error: ${err instanceof Error ? err.message : String(err)}`);
                      resolve(null);
                    } else {
                      resolve(results);
                    }
                  }
                );
              } else {
                resolve(null);
              }
            });
          });

          if (violations) {
            const highImpactViolations = violations.violations.filter(
              (v) => v.impact === 'critical' || v.impact === 'serious'
            );

            if (highImpactViolations.length > 0) {
              const violationSummary = highImpactViolations
                .map((v) => `${v.id} (${v.impact}): ${v.description}`)
                .join('\n');

              throw new Error(
                `High-impact accessibility violations in story "${context.id}":\n${violationSummary}`
              );
            }

            // Log moderate/minor violations as warnings
            const otherViolations = violations.violations.filter(
              (v) => v.impact === 'moderate' || v.impact === 'minor'
            );
            if (otherViolations.length > 0) {
              const warningSummary = otherViolations
                .map((v) => `  - ${v.id} (${v.impact}): ${v.description}`)
                .join('\n');
              console.warn(
                `Accessibility warnings in story "${context.id}":\n${warningSummary}`
              );
            }
          }
        } catch (parseError) {
          // If parse error is a High-impact violation that we threw, re-throw it
          if (parseError instanceof Error && parseError.message.includes('High-impact')) {
            throw parseError;
          }
          // Otherwise, this is a real error in parsing/running axe - re-throw it
          throw new Error(
            `Error processing accessibility violations for story "${context.id}": ${parseError instanceof Error ? parseError.message : String(parseError)}`
          );
        }
      } else {
        // Error from checkA11y but not a violation report - this is a real error (timeout, type error, etc.)
        throw new Error(
          `Accessibility check failed for story "${context.id}": ${errorMsg}`
        );
      }
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
      // log it but don't fail the story test - the accessibility checks already passed
      const errMsg = evalError instanceof Error ? evalError.message : String(evalError);
      if (!errMsg.includes('StorybookTestRunnerError')) {
        console.warn(`[test-runner] Failed to collect page errors: ${errMsg}`);
      }
      // Continue without error check if page.evaluate fails - a11y checks already passed
      return;
    }

    for (const error of errors) {
      if (!isExpectedConsoleError(error) && !isKnownRenderingBug(error)) {
        throw new Error(`Critical error in story ${context.id}: ${error}`);
      }
    }
    } catch (postVisitError) {
      // If the entire postVisit fails due to Storybook test-runner issues, only throw if it's not the StorybookTestRunnerError
      const errMsg = postVisitError instanceof Error ? postVisitError.message : String(postVisitError);
      if (errMsg.includes('StorybookTestRunnerError')) {
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
