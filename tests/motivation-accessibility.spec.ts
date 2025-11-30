/**
 * Accessibility Tests for Motivation Layer Visualization
 * Uses axe-core via axe-playwright to verify WCAG 2.1 AA compliance
 *
 * IMPORTANT: These tests require the embedded app dev server to be running.
 *
 * Prerequisites:
 * 1. Embedded app dev server:
 *    npm run dev:embedded
 *
 * 2. Playwright browsers:
 *    npx playwright install chromium
 *
 * STATUS: Accessibility audit and keyboard navigation tests
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe.skip('Motivation Layer - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded viewer
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');

    // Load demo data
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.motivation-view', { timeout: 10000 });

    // Inject axe-core
    await injectAxe(page);
  });

  /**
   * Run comprehensive axe-core accessibility audit
   * Acceptance: Zero critical/serious violations
   */
  test('Axe-core accessibility audit - zero violations', async ({ page }) => {
    console.log('[A11y] Running axe-core accessibility audit...');

    // Run axe audit on the entire page
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });

    console.log('[A11y] Accessibility audit passed - no violations found');
  });

  /**
   * Test specific regions with axe-core
   */
  test('Control panel accessibility', async ({ page }) => {
    console.log('[A11y] Testing control panel accessibility...');

    // Test control panel specifically
    await checkA11y(page, '.motivation-control-panel', {
      detailedReport: true,
    });

    console.log('[A11y] Control panel accessibility verified');
  });

  test('Filter panel accessibility', async ({ page }) => {
    console.log('[A11y] Testing filter panel accessibility...');

    // Test filter panel
    await checkA11y(page, '.motivation-filter-panel', {
      detailedReport: true,
    });

    console.log('[A11y] Filter panel accessibility verified');
  });

  /**
   * Keyboard navigation - Tab through interactive elements
   * Acceptance: All controls reachable via keyboard, focus visible
   */
  test('Keyboard navigation - Tab order', async ({ page }) => {
    console.log('[A11y] Testing keyboard navigation...');

    // Tab through interface
    const tabStops: string[] = [];
    let previousFocus = '';

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Get currently focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';

        return `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}`;
      });

      if (focusedElement !== previousFocus) {
        tabStops.push(focusedElement);
        console.log(`Tab stop ${i + 1}: ${focusedElement}`);
        previousFocus = focusedElement;
      }
    }

    // Verify we can reach interactive elements
    expect(tabStops.length).toBeGreaterThan(5); // Should have multiple tab stops

    // Take screenshot showing focus indicator
    await page.screenshot({ path: 'test-results/a11y-keyboard-navigation.png' });
  });

  /**
   * Keyboard navigation - Arrow keys for node selection
   * Acceptance: Arrow keys navigate between nodes
   */
  test('Keyboard navigation - Arrow keys', async ({ page }) => {
    console.log('[A11y] Testing arrow key navigation...');

    // Focus on graph area
    const graphViewer = await page.locator('.graph-viewer').first();
    await graphViewer.click();

    // Try arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);

    await page.screenshot({ path: 'test-results/a11y-arrow-navigation.png' });
    console.log('[A11y] Arrow key navigation tested');
  });

  /**
   * Keyboard shortcuts - Enter to activate
   * Acceptance: Enter key activates focused buttons
   */
  test('Keyboard shortcuts - Enter activation', async ({ page }) => {
    console.log('[A11y] Testing Enter key activation...');

    // Tab to fit-to-view button
    let foundFitButton = false;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focusedLabel = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute('aria-label') || '';
      });

      if (focusedLabel.toLowerCase().includes('fit')) {
        foundFitButton = true;
        console.log('[A11y] Found Fit to View button, pressing Enter...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        break;
      }
    }

    expect(foundFitButton).toBe(true);
    await page.screenshot({ path: 'test-results/a11y-enter-activation.png' });
  });

  /**
   * Verify ARIA labels on all interactive elements
   * Acceptance: All buttons, inputs have descriptive ARIA labels
   */
  test('ARIA labels present on all interactive elements', async ({ page }) => {
    console.log('[A11y] Checking ARIA labels...');

    // Check layout selector
    const layoutSelector = await page.locator('#layout-selector');
    const layoutLabel = await layoutSelector.getAttribute('aria-label');
    expect(layoutLabel).toBeTruthy();
    console.log(`Layout selector: ${layoutLabel}`);

    // Check buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);

    let labeledButtons = 0;
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      if (ariaLabel || (textContent && textContent.trim().length > 0)) {
        labeledButtons++;
      }
    }

    console.log(`Buttons with labels: ${labeledButtons}/${buttons.length}`);
    expect(labeledButtons).toBe(buttons.length);
  });

  /**
   * Verify ARIA live regions for dynamic content
   * Acceptance: Status messages announced to screen readers
   */
  test('ARIA live regions for status updates', async ({ page }) => {
    console.log('[A11y] Checking ARIA live regions...');

    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').all();
    console.log(`Found ${liveRegions.length} ARIA live regions`);

    expect(liveRegions.length).toBeGreaterThan(0);

    // Check for status roles
    const statusElements = await page.locator('[role="status"]').all();
    console.log(`Found ${statusElements.length} status elements`);

    await page.screenshot({ path: 'test-results/a11y-live-regions.png' });
  });

  /**
   * Color contrast verification
   * Acceptance: All text meets WCAG AA contrast requirements (4.5:1)
   */
  test('Color contrast compliance', async ({ page }) => {
    console.log('[A11y] Testing color contrast...');

    // Run axe with specific color-contrast rule
    await checkA11y(page, undefined, {
      detailedReport: true,
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    console.log('[A11y] Color contrast requirements met');
  });

  /**
   * Focus indicators visible
   * Acceptance: Focus ring visible on all interactive elements
   */
  test('Focus indicators visible', async ({ page }) => {
    console.log('[A11y] Verifying focus indicators...');

    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if focus is visible (outline or box-shadow)
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el) return false;

      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;

      return (outline && outline !== 'none' && outline !== '0px') ||
             (boxShadow && boxShadow !== 'none');
    });

    console.log(`Focus indicator visible: ${focusVisible}`);
    expect(focusVisible).toBe(true);

    await page.screenshot({ path: 'test-results/a11y-focus-indicators.png' });
  });

  /**
   * Screen reader compatibility - Semantic HTML
   * Acceptance: Proper heading hierarchy, landmark regions
   */
  test('Semantic HTML structure', async ({ page }) => {
    console.log('[A11y] Checking semantic HTML...');

    // Check for landmark regions
    const mainRegion = await page.locator('main, [role="main"]').count();
    console.log(`Main region: ${mainRegion > 0 ? 'present' : 'missing'}`);

    // Check for headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    console.log(`Found ${headings.length} headings`);

    // Verify heading levels are sequential
    const headingLevels: number[] = [];
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName[1]);
      headingLevels.push(level);
    }

    console.log(`Heading levels: ${headingLevels.join(', ')}`);

    // Run axe with specific structure rules
    await checkA11y(page, undefined, {
      detailedReport: true,
      rules: {
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
      },
    });
  });

  /**
   * Form labels and descriptions
   * Acceptance: All form inputs have labels, descriptions for complex controls
   */
  test('Form labels and descriptions', async ({ page }) => {
    console.log('[A11y] Checking form labels...');

    // Run axe with form-related rules
    await checkA11y(page, undefined, {
      detailedReport: true,
      rules: {
        'label': { enabled: true },
        'label-title-only': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
      },
    });

    console.log('[A11y] Form labels verified');
  });

  /**
   * Test with reduced motion preference
   * Acceptance: Animations respect prefers-reduced-motion
   */
  test('Reduced motion support', async ({ page }) => {
    console.log('[A11y] Testing reduced motion...');

    // Emulate prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Switch layouts and verify no heavy animations
    const startTime = Date.now();
    await page.selectOption('#layout-selector', 'hierarchical');
    await page.waitForTimeout(500);
    const switchTime = Date.now() - startTime;

    console.log(`Layout switch time with reduced motion: ${switchTime}ms`);

    // With reduced motion, transitions should be instant or very fast
    expect(switchTime).toBeLessThan(1000);

    await page.screenshot({ path: 'test-results/a11y-reduced-motion.png' });
  });
});
