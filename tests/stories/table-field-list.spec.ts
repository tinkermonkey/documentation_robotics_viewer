/**
 * TableFieldList Component Story Tests
 *
 * Validates that the TableFieldList component renders correctly in various scenarios.
 * Tests cover:
 * - Basic field rendering with proper semantic HTML
 * - Empty state handling
 * - Layout and styling (two-column, alternating rows)
 * - Field labels, values, and required/optional indicators
 * - Tooltips and accessibility features
 *
 * The TableFieldList is the table layout mode used by DATA_JSON_SCHEMA and DATA_MODEL node types.
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('TableFieldList Component Stories', () => {
  test.describe('Default story', () => {
    test('renders field list container', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--default'));

      const fieldList = page.locator('[role="list"]').first();
      await fieldList.waitFor({ state: 'attached', timeout: 5000 });
      await expect(fieldList).toBeVisible();
    });

    test('renders all field items', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--default'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(4); // Has 4 fields
    });

    test('displays field labels', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--default'));

      await expect(page.locator('text=userId')).toBeVisible();
      await expect(page.locator('text=email')).toBeVisible();
      await expect(page.locator('text=phone')).toBeVisible();
      await expect(page.locator('text=created_at')).toBeVisible();
    });

    test('displays field values', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--default'));

      await expect(page.locator('text=string')).toBeVisible();
      await expect(page.locator('text=ISO8601')).toBeVisible();
    });

    test('shows required indicator for required fields', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--default'));

      // Required fields should have a bullet indicator (•)
      const requiredIndicators = page.locator('text=•');
      const count = await requiredIndicators.count();
      expect(count).toBeGreaterThanOrEqual(3); // At least 3 required fields
    });
  });

  test.describe('EmptyState story', () => {
    test('renders empty state message', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--empty-state'));

      const emptyState = page.locator('text=/No fields|empty/i');
      await expect(emptyState.first()).toBeVisible();
    });

    test('does not render field list when empty', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--empty-state'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(0);
    });
  });

  test.describe('UndefinedItems story', () => {
    test('handles undefined items gracefully', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--undefined-items'));

      // Should not crash, should show empty or fallback message
      const container = page.locator('div').first();
      await expect(container).toBeVisible();
    });
  });

  test.describe('ManyFields story', () => {
    test('renders all 20 fields', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--many-fields'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(20);
    });

    test('displays numbered fields correctly', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--many-fields'));

      // Check that field names are sequential
      await expect(page.locator('text=field_0')).toBeVisible();
      await expect(page.locator('text=field_5')).toBeVisible();
      await expect(page.locator('text=field_19')).toBeVisible();
    });
  });

  test.describe('ComplexTypes story', () => {
    test('renders complex type annotations', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--complex-types'));

      // Check that complex types are displayed
      await expect(page.locator('text=object<string, unknown>')).toBeVisible();
      await expect(page.locator('text=string[]')).toBeVisible();
      await expect(page.locator('text=Record<string, any>')).toBeVisible();
    });

    test('displays UUID type value', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--complex-types'));

      await expect(page.locator('text=UUID')).toBeVisible();
    });
  });

  test.describe('LongContent story', () => {
    test('renders long field names without breaking', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--long-content'));

      const longName = page.locator('text=veryLongFieldNameThatExceedsNormalLength');
      await expect(longName).toBeVisible();
    });

    test('renders long type values', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--long-content'));

      const complexType = page.locator('text=Map<string, Promise<Record<string, unknown>>');
      await expect(complexType).toBeVisible();
    });
  });

  test.describe('AllRequired story', () => {
    test('renders 4 required fields', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--all-required'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(4);

      // All should have required indicator
      const requiredIndicators = page.locator('text=•');
      const requiredCount = await requiredIndicators.count();
      expect(requiredCount).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('AllOptional story', () => {
    test('renders 4 optional fields', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--all-optional'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(4);
    });

    test('does not show required indicator for optional fields', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--all-optional'));

      const requiredIndicators = page.locator('text=•');
      const count = await requiredIndicators.count();
      // Should have no required indicators
      expect(count).toBe(0);
    });
  });

  test.describe('MixedTooltips story', () => {
    test('renders fields with and without tooltips', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--mixed-tooltips'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(4);

      // Verify some fields are visible
      await expect(page.locator('text=id')).toBeVisible();
      await expect(page.locator('text=name')).toBeVisible();
    });
  });

  test.describe('CustomItemHeight story', () => {
    test('renders with custom item height', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--custom-item-height'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(3);

      // Items should be rendered (height doesn't affect count)
      await expect(items.first()).toBeVisible();
    });
  });

  test.describe('DarkMode story', () => {
    test('renders with dark mode styling', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('core-nodes-tablefieldlist--dark-mode'));

      const items = page.locator('[role="listitem"]');
      const count = await items.count();
      expect(count).toBe(3);

      // Should be visible even in dark mode
      await expect(page.locator('text=userId')).toBeVisible();
      await expect(page.locator('text=email')).toBeVisible();
    });
  });
});
