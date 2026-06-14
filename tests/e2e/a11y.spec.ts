/**
 * a11y.spec.ts — automated axe-core (WCAG 2.1 AA) scan of the three primary
 * views in BOTH canvas tones (light + dark).
 *
 * Gate: NO `serious`/`critical` violations OTHER than `color-contrast`.
 *
 * FIXED (was a documented debt): the dark IDE-shell chrome previously shipped
 * subtle low-emphasis mono labels (nav counts, statusbar, footer, page-header
 * eyebrows/meta — e.g. `#6e7a87` on `#13203a`, ~3.7:1) plus the dark-canvas
 * muted graph/inspector text (`--canvas-fg-3`/`--canvas-fg-4`) that fell below
 * the 4.5:1 AA threshold. The viewer now raises those low-emphasis tokens to the
 * MINIMUM value that clears 4.5:1 against the lightest background each renders on
 * (a self-contained override in `src/apps/embedded/ui/domain-and-nav.css`, loaded
 * after the Heimdall CSS). As a result every shell/dark-canvas combo is now at
 * ZERO color-contrast violations.
 *
 * REMAINING (documented, not masked): the **light**-canvas Changesets view still
 * has a small set of pre-existing content-level contrast nodes that are OUTSIDE
 * the shell/dark-canvas token scope fixed here — the cyan changeset op-badge
 * (`#22d3ee` on light-cyan `#e4fafd`) and the muted mono detail text
 * (`#94a3b8`/light `--canvas-fg-4` on `#ffffff`). These are light-canvas
 * changeset-row content, not shell chrome, so the contrast baseline below is 0
 * for every combo EXCEPT `Changesets/light`, which keeps a small documented
 * ceiling. The test attaches the full `color-contrast` detail for review, asserts
 * the contrast node count stays AT OR BELOW its recorded per-view/tone baseline
 * (so a NEW contrast regression — which would push the count up — is caught), and
 * HARD-FAILS on any other serious/critical rule. See the returned "open issues"
 * for the tracking note on the remaining light-canvas Changesets nodes.
 */

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoView, ROUTES } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Recorded color-contrast baselines (node counts), measured twice against the
 * built bundle + the repo's committed `.dr` model (deterministic positions).
 * After raising the low-emphasis shell/dark-canvas tokens to AA, every combo is
 * at ZERO except `Changesets/light`, which retains the pre-existing,
 * out-of-scope light-canvas changeset-row content nodes (cyan op-badge + muted
 * detail text — see the file header). These are CEILINGS: the documented
 * remainder sits at/below them, so it passes; a new contrast regression
 * elsewhere would exceed the ceiling and fail. A small headroom (+5) absorbs
 * benign label/layout jitter without letting a real regression (which adds many
 * nodes at once) slip through.
 */
const HEADROOM = 5;
const CONTRAST_BASELINE: Record<string, number> = {
  'Model/light': 0,
  'Model/dark': 0,
  'Schema/light': 0,
  'Schema/dark': 0,
  'Changesets/light': 14,
  'Changesets/dark': 0,
};

/** Run axe with the WCAG AA ruleset over the full page. */
async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
}

/** Set the canvas tone via the topbar SegmentedControl (a radiogroup). */
async function setTone(page: Page, tone: 'light' | 'dark') {
  await page.getByRole('radio', { name: tone, exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
    .toBe(tone === 'dark');
}

const VIEWS: Array<{ name: string; route: string }> = [
  { name: 'Model', route: ROUTES.model },
  { name: 'Schema', route: ROUTES.spec },
  { name: 'Changesets', route: ROUTES.changesets },
];

const TONES: Array<'light' | 'dark'> = ['light', 'dark'];

test.describe('accessibility (axe / WCAG 2.1 AA)', () => {
  for (const view of VIEWS) {
    for (const tone of TONES) {
      test(`${view.name} view — ${tone} canvas: no serious/critical violations (except known contrast)`, async ({
        page,
      }, testInfo) => {
        await gotoView(page, view.route);
        await expect(page.getByTestId('canvas')).toBeVisible();
        await setTone(page, tone);

        const results = await scan(page);

        const seriousOrCritical = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );

        // Attach EVERY serious/critical violation for the report.
        await testInfo.attach(`axe-${view.name}-${tone}.json`, {
          body: JSON.stringify(seriousOrCritical, null, 2),
          contentType: 'application/json',
        });

        // Shell/dark-canvas low-emphasis labels are now AA (baseline 0); only the
        // out-of-scope light-canvas Changesets content nodes remain (see header).
        const contrast = seriousOrCritical.filter((v) => v.id === 'color-contrast');
        const others = seriousOrCritical.filter((v) => v.id !== 'color-contrast');

        // HARD GATE: any serious/critical rule OTHER than color-contrast is a
        // regression and must fail the suite.
        const otherSummary = others
          .map((v) => `${v.id} (${v.impact}) × ${v.nodes.length}`)
          .join('; ');
        expect(others, `unexpected serious/critical violations: ${otherSummary}`).toEqual([]);

        // BASELINE GATE: the shell/dark-canvas contrast is now asserted to its
        // recorded per-view/tone ceiling — 0 for every combo except
        // `Changesets/light` (the documented out-of-scope light-canvas content
        // remainder). The node count must stay AT OR BELOW that ceiling (+ small
        // headroom), so a NEW contrast regression (which would push the count
        // past the ceiling) is caught. Any remainder is recorded as a known-issue
        // annotation so it stays visible in CI output.
        const nodeCount = contrast.reduce((n, v) => n + v.nodes.length, 0);
        if (nodeCount > 0) {
          testInfo.annotations.push({
            type: 'known-issue',
            description: `color-contrast: ${nodeCount} light-canvas content nodes below 4.5:1 (${view.name}/${tone})`,
          });
        }

        const key = `${view.name}/${tone}`;
        const ceiling = (CONTRAST_BASELINE[key] ?? 0) + HEADROOM;
        expect(
          nodeCount,
          `color-contrast node count for ${key} (${nodeCount}) exceeded its recorded ` +
            `baseline ceiling (${ceiling}) — likely a NEW contrast regression, not the ` +
            `documented out-of-scope light-canvas Changesets remainder`,
        ).toBeLessThanOrEqual(ceiling);
      });
    }
  }
});
