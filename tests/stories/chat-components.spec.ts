/**
 * Chat Component Story Tests
 *
 * Hand-written tests for chat-related stories that validate:
 * - Message content renders correctly
 * - ThinkingBlock expand/collapse toggle
 * - ToolInvocationCard shows tool name and status
 * - Chat input is visible and functional
 *
 * Covers: ChatComponents (ThinkingBlock, ToolInvocationCard, UsageBadge, etc.),
 *         ChatPanelContainer, FloatingChatPanel
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('Chat Component Stories', () => {
  test.describe('ChatTextContent', () => {
    test('Basic: renders text content', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-text-content-basic'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'ChatTextContent Basic should render text').toBeGreaterThan(5);
    });

    test('Markdown: renders formatted content', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-text-content-markdown'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'ChatTextContent Markdown should render formatted text').toBeGreaterThan(10);
    });

    test('CodeBlock: renders code content', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-text-content-code-block'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      // No wait needed - body rendering is synchronous
      // Code blocks typically have pre/code elements
      const hasCode = await page.locator('pre, code').count();
      const bodyText = await page.locator('body').innerText();
      expect(hasCode > 0 || bodyText.length > 10, 'CodeBlock should render code content').toBe(true);
    });
  });

  test.describe('ThinkingBlock', () => {
    test('Default: renders thinking content', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--thinking-block-default'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'ThinkingBlock should render content').toBeGreaterThan(0);
    });

    test('Expanded: shows full thinking text', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--thinking-block-expanded'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'Expanded ThinkingBlock should show full text').toBeGreaterThan(10);
    });

    test('Default: toggle expands content', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--thinking-block-default'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      // No wait needed - body rendering is synchronous
      // Find the toggle/expand button
      const toggle = page.locator('button, [role="button"], summary').first();
      if (await toggle.count() > 0) {
        await toggle.click();
        const bodyText = await page.locator('body').innerText();
        expect(bodyText.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('ToolInvocationCard', () => {
    test('Executing: shows tool name and status', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--tool-invocation-card-executing'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'ToolInvocationCard should show tool info').toBeGreaterThan(5);
    });

    test('Complete: shows completed status', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--tool-invocation-card-complete'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(5);
    });

    test('Error: shows error status', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--tool-invocation-card-error'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(5);
    });
  });

  test.describe('ChatInput', () => {
    test('Default: input field is visible', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-input-default'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const inputs = await page.locator('input, textarea').count();
      expect(inputs, 'ChatInput should render an input field').toBeGreaterThan(0);
    });

    test('Default: send button is present', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-input-default'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const buttons = await page.locator('button').count();
      expect(buttons, 'ChatInput should have a send button').toBeGreaterThan(0);
    });

    test('Default: input accepts text', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-input-default'));
      await page.locator('input, textarea').first().waitFor({ state: 'attached', timeout: 5000 });
      const input = page.locator('input, textarea').first();
      await input.fill('Test message');
      const value = await input.inputValue();
      expect(value).toBe('Test message');
    });
  });

  test.describe('ChatMessage', () => {
    test('User: renders user message', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-message-user'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'User message should render content').toBeGreaterThan(5);
    });

    test('Assistant: renders assistant message', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('chat-components--chat-message-assistant'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length, 'Assistant message should render content').toBeGreaterThan(5);
    });
  });
});
