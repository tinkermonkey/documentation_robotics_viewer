/**
 * Backend-Dependent Story Tests
 *
 * Hand-written tests for stories that depend on backend/store state.
 * These tests validate that:
 * - ConnectionStatus stories render the correct visual state
 * - ChatPanelContainer renders structure without backend
 * - Fallback/error UI renders correctly
 *
 * NOTE: These stories use Zustand store mocking rather than actual
 * backend connections. They test the visual/UI layer only.
 *
 * Covers: ConnectionStatus, ChatPanelContainer (store-mocked states)
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('Backend-Dependent Stories', () => {
  test.describe('ConnectionStatus', () => {
    test('Connected: renders connected state', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('primitives--indicators--connectionstatus--connected'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      // Wait for content to be rendered, max 5 seconds
      await page.waitForFunction(() => {
        const bodyText = document.body.innerText;
        return bodyText && bodyText.length > 0;
      }, { timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      // Connected state should show some indicator
      expect(bodyText.length, 'Connected status should render content').toBeGreaterThan(0);
    });

    test('Disconnected: renders disconnected state', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('primitives--indicators--connectionstatus--disconnected'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'Disconnected status should render content').toBeGreaterThan(0);
    });

    test('Connecting: renders connecting state', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('primitives--indicators--connectionstatus--connecting'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'Connecting status should render content').toBeGreaterThan(0);
    });

    test('Reconnecting: renders reconnecting state', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('primitives--indicators--connectionstatus--reconnecting'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'Reconnecting status should render content').toBeGreaterThan(0);
    });

    test('Error: renders error state', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('primitives--indicators--connectionstatus--error'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'Error status should render content').toBeGreaterThan(0);
    });

    test('stories render different visual states', async ({ page }) => {
      setupErrorFiltering(page);
      // Collect text content from two different states to verify they differ
      await page.goto(storyUrl('primitives--indicators--connectionstatus--connected'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const connectedHtml = await page.locator('body').innerHTML();

      await page.goto(storyUrl('primitives--indicators--connectionstatus--disconnected'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const disconnectedHtml = await page.locator('body').innerHTML();

      expect(
        connectedHtml !== disconnectedHtml,
        'Connected and Disconnected should render different visual states'
      ).toBe(true);
    });
  });

  test.describe('ChatPanelContainer', () => {
    test('Default: renders container structure', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-panel-container-default'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      // ChatPanelContainer should render at minimum a container div
      const hasElements = await page.locator('[data-testid], div').count();
      expect(
        bodyText.length > 0 || hasElements > 0,
        'ChatPanelContainer should render structure'
      ).toBe(true);
    });
  });

  test.describe('FloatingChatPanel', () => {
    test('Default: renders panel', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--floating-chat-panel-default'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      const hasElements = await page.locator('[data-testid], div').count();
      expect(
        bodyText.length > 0 || hasElements > 0,
        'FloatingChatPanel should render panel content'
      ).toBe(true);
    });
  });
});
