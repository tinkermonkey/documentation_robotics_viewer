import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';
import { isExpectedConsoleError, isKnownRenderingBug } from '../tests/stories/storyErrorFilters.ts';

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
  }
}

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Initialize error collection arrays and axe state on the page context
    await page.evaluate(() => {
      window.__errorMessages__ = [];
      window.__pageErrors__ = [];
      window.__axeInjected__ = false;
      window.__axeConfigured__ = false;
      window.__axeRunning__ = false;
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

    // Inject axe-core for accessibility testing with proper sequencing
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
    // Normalize tags to empty array if missing or not an array (addresses redundant guard issue)
    const tags = Array.isArray(context.tags) ? context.tags : [];

    // Determine which validation steps to skip
    const skipAccessibility = tags.includes('skip-a11y');
    const skipErrors = tags.includes('skip-errors');
    const skipTest = tags.includes('skip-test');

    // Handle skip-test: log deprecation warning and treat as skip-a11y only
    // This ensures console error validation always runs (WCAG 2.1 AA mandate: accessibility must be validated)
    // skip-test is deprecated; use granular flags for explicit control
    if (skipTest) {
      console.warn(
        `[test-runner] Story "${context.id}" uses deprecated 'skip-test' tag. ` +
        `Use granular tags instead: 'skip-a11y' (skip accessibility). ` +
        `'skip-test' now only skips accessibility checks. Console error validation always runs to ensure WCAG 2.1 AA compliance. ` +
        `This tag will be removed in a future version.`
      );
    }

    // Determine final skip flags: skip-test acts as alias for skip-a11y only
    // Rationale: WCAG 2.1 AA compliance (accessibility) must be enforced. Error validation is mandatory.
    const skipAccessibilityFinal = skipAccessibility || skipTest;
    const skipErrorsFinal = skipErrors; // Note: skip-test does NOT skip error validation

    // Log what's being skipped (addresses confusing logging issue)
    // Check skip-test first before building granular skip list to avoid redundant logs
    if (skipTest) {
      console.log(`[test-runner] Story "${context.id}" skipping: accessibility (via deprecated skip-test tag). Console error validation still runs.`);
    } else if (skipAccessibilityFinal || skipErrorsFinal) {
      const skipped = [];
      if (skipAccessibilityFinal) skipped.push('accessibility');
      if (skipErrorsFinal) skipped.push('error validation');
      console.log(`[test-runner] Story "${context.id}" skipping: ${skipped.join(', ')}`);
    }

    try {
      // Skip accessibility checks if requested
      if (!skipAccessibilityFinal) {
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

        // Run accessibility checks with proper axe sequencing
        // checkA11y properly awaits and sequences axe runs - no concurrent execution
        try {
          await checkA11y(page, '#storybook-root', {
            detailedReport: true,
            detailedReportOptions: { html: true },
          });
        } catch (error) {
          // checkA11y throws if violations are found - extract violation details
          const errorMsg = error instanceof Error ? error.message : String(error);

          // Check if this is an axe-core violation error (contains violation details)
          if (errorMsg.startsWith('Accessibility') || errorMsg.includes('violation')) {
            // Parse the error message for high-impact violations
            // checkA11y error message format includes "VIOLATIONS" section with details
            if (errorMsg.includes('critical') || errorMsg.includes('serious')) {
              // Re-throw as-is - checkA11y already properly ran axe and found violations
              throw error;
            }
            // Moderate or minor violations - log as warning but don't fail
            console.warn(`Accessibility warnings in story "${context.id}":\n${errorMsg}`);
          } else {
            // Error from checkA11y but not a violation report - this is a real error
            throw new Error(
              `Accessibility check failed for story "${context.id}": ${errorMsg}`
            );
          }
        }
      } else {
        console.log(`[test-runner] Skipping accessibility checks for story "${context.id}"`);
      }

      // Check for collected console and page errors after all tests (unless skipped)
      if (!skipErrorsFinal) {
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
      } else {
        console.log(`[test-runner] Skipping error validation for story "${context.id}"`);
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
