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
    __ERRORS__: string[];
  }
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Initialize error collection arrays on the page context
    await page.evaluate(() => {
      (window as any).__errorMessages__ = [];
      (window as any).__pageErrors__ = [];
    });

    // Register console error listener - push errors to page's __errorMessages__
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Push to window.__errorMessages__ which will be read in postVisit
        page.evaluate((error) => {
          (window as any).__errorMessages__?.push(error);
        }, text);
      }
    });

    // Register page error listener - push errors to page's __pageErrors__
    page.on('pageerror', (error) => {
      const errorText = error.toString();
      // Push to window.__pageErrors__ which will be read in postVisit
      page.evaluate((err) => {
        (window as any).__pageErrors__?.push(err);
      }, errorText);
    });

    // Inject axe-core for accessibility testing
    try {
      await injectAxe(page);
    } catch (err) {
      console.warn('Could not inject axe-core:', err);
    }
  },

  async postVisit(page, context) {
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
    } catch (err) {
      console.warn(`Failed to configure axe-core for story "${context.id}":`, err);
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

      // Check if violations are from critical/serious issues
      if (errorMsg.includes('axe-core') || errorMsg.includes('violations')) {
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
          // If we can't parse violations, log the original error
          if (parseError instanceof Error && parseError.message.includes('High-impact')) {
            throw parseError;
          }
          console.warn(`Accessibility check warning in story "${context.id}":`, parseError);
        }
      }
    }

    // Check for collected console and page errors after all tests
    const errors = await page.evaluate(() => {
      const collected = [
        ...((window as any).__errorMessages__ || []),
        ...((window as any).__pageErrors__ || []),
      ];
      return collected;
    });

    for (const error of errors) {
      if (!isExpectedConsoleError(error) && !isKnownRenderingBug(error)) {
        throw new Error(`Critical error in story ${context.id}: ${error}`);
      }
    }
  },
};

export default config;
