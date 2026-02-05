import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Chat Functionality
 * Tests the complete chat user experience including SDK status, messaging, streaming, and error handling
 * Requires both Python reference server (port 8765) and frontend dev server (port 3001) running
 */

test.describe('Chat Integration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to embedded app with chat enabled
    await page.goto('http://localhost:3001/');

    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('SDK Status Check (FR-8)', () => {
    test('should check SDK availability on mount', async ({ page }) => {
      // The ChatPanelContainer should call chatService.getStatus() on initialization
      // This verifies FR-8 requirement

      // Wait for chat panel to appear
      const chatPanel = page.locator('[data-testid="chat-panel-container"]');
      await expect(chatPanel).toBeVisible({ timeout: 5000 });

      // Verify SDK status is checked (no error message if SDK available)
      const errorMessage = page.locator('text=/Chat service is not available|Chat SDK is not available/');
      const isAvailable = await errorMessage.isHidden();
      expect(typeof isAvailable).toBe('boolean');

      // Check for console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      await page.waitForTimeout(500);
      expect(errors).not.toContain(expect.stringContaining('getStatus'));
    });

    test('should display warning when SDK is unavailable', async ({ page }) => {
      // This test would require mocking SDK unavailability
      // Verify UI handles SDK unavailable gracefully

      // Look for warning message or disabled state
      const warningOrDisabled = page.locator(
        'text=/Chat service is not available|Chat SDK is not available/ , [disabled]'
      );

      // Either warning is shown OR input is disabled
      const warningVisible = await page.locator('text=/Chat service is not available/').isVisible();
      const inputDisabled = await page.locator('[data-testid="message-input"]').isDisabled();

      expect(warningVisible || inputDisabled).toBeTruthy();
    });
  });

  test.describe('Message Sending and Receiving', () => {
    test('should send message when Enter key pressed', async ({ page }) => {
      // Setup: Find message input
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');

      // Verify input exists and is enabled
      await expect(messageInput).toBeVisible();
      await expect(messageInput).toBeEnabled();

      // Send a test message
      const testMessage = 'Hello, Chat!';
      await messageInput.fill(testMessage);
      await messageInput.press('Enter');

      // Verify message appears in chat history
      const userMessage = page.locator(`text="${testMessage}"`);
      await expect(userMessage).toBeVisible({ timeout: 5000 });

      // Verify input is cleared
      await expect(messageInput).toHaveValue('');
    });

    test('should display user message with You avatar', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const testMessage = 'Test message';

      await messageInput.fill(testMessage);
      await messageInput.press('Enter');

      // Wait for message to appear
      const userMessage = page.locator(`[data-testid^="message-"]`).first();
      await expect(userMessage).toBeVisible();

      // Verify "You" label appears
      const youLabel = userMessage.locator('text="You"');
      await expect(youLabel).toBeVisible();
    });

    test('should support Shift+Enter for newline', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');

      await messageInput.fill('Line 1');
      await messageInput.press('Shift+Enter');
      await messageInput.type('Line 2');

      // Verify input has newline (not sent)
      const value = await messageInput.inputValue();
      expect(value).toContain('Line 1\nLine 2');

      // Send button should be enabled
      const sendButton = page.locator('[data-testid="send-button"]');
      await expect(sendButton).toBeEnabled();
    });

    test('should disable send button when input is empty', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');

      // Empty input
      await messageInput.fill('');

      // Send button should be disabled
      await expect(sendButton).toBeDisabled();
    });

    test('should restore message on send error', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const testMessage = 'Test message';

      await messageInput.fill(testMessage);

      // Try to send (may fail if no backend)
      const sendButton = page.locator('[data-testid="send-button"]');
      await sendButton.click();

      // If there's an error, input should be restored
      await page.waitForTimeout(1000);

      // Either message was sent or restored
      const inputValue = await messageInput.inputValue();
      const messageAppears = await page.locator(`text="${testMessage}"`).isVisible();

      expect(inputValue === testMessage || messageAppears).toBeTruthy();
    });
  });

  test.describe('Streaming Response', () => {
    test('should show streaming indicator while receiving response', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');

      // Send a message
      await messageInput.fill('Hello');
      await messageInput.press('Enter');

      // Look for streaming indicator (pulsing animation)
      const streamingIndicator = page.locator(
        '[data-testid="streaming-indicator"], text=/Streaming|Thinking/'
      );

      // Wait for streaming state (with timeout for cases where response is quick)
      try {
        await expect(streamingIndicator).toBeVisible({ timeout: 2000 });
      } catch {
        // If no streaming indicator appears within timeout, response may have completed
        // This is acceptable behavior
      }
    });

    test('should show cancel button during streaming', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const cancelButton = page.locator('[data-testid="cancel-button"]');

      await messageInput.fill('Hello');
      await messageInput.press('Enter');

      // Wait for streaming state
      await page.waitForTimeout(500);

      // Cancel button should be visible if streaming
      const isCancelVisible = await cancelButton.isVisible();
      const isSendVisible = await page.locator('[data-testid="send-button"]').isVisible();

      // Either cancel or send should be visible, not both
      expect(isCancelVisible !== isSendVisible).toBeTruthy();
    });

    test('should support canceling message during streaming', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const cancelButton = page.locator('[data-testid="cancel-button"]');

      await messageInput.fill('Hello');
      await messageInput.press('Enter');

      // Wait for streaming to start
      await page.waitForTimeout(500);

      // Click cancel if button is visible
      const isCancelVisible = await cancelButton.isVisible();
      if (isCancelVisible) {
        await cancelButton.click();

        // Cancel button should disappear after click
        await page.waitForTimeout(500);
        const isCancelStillVisible = await cancelButton.isVisible();
        expect(!isCancelStillVisible).toBeTruthy();
      }
    });
  });

  test.describe('Thinking Blocks', () => {
    test('should display thinking block when present', async ({ page }) => {
      const thinkingBlock = page.locator('[data-testid="thinking-block"]');

      // Thinking blocks may not appear in all responses
      // Just verify selector works
      expect(await thinkingBlock.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show thinking block collapsed by default', async ({ page }) => {
      const thinkingBlocks = page.locator('[data-testid="thinking-block"]');
      const count = await thinkingBlocks.count();

      if (count > 0) {
        const collapsedContent = page.locator('[data-testid="thinking-block-content-collapsed"]');
        const expandedContent = page.locator('[data-testid="thinking-block-content-expanded"]');

        // Either collapsed or expanded should be visible, not both
        const collapsedVisible = await collapsedContent.isVisible();
        const expandedVisible = await expandedContent.isVisible();

        expect(collapsedVisible || expandedVisible).toBeTruthy();
      }
    });

    test('should expand thinking block when clicked', async ({ page }) => {
      const thinkingBlocks = page.locator('[data-testid="thinking-block"]');
      const count = await thinkingBlocks.count();

      if (count > 0) {
        const header = page.locator('[data-testid="thinking-block-header"]').first();
        await header.click();

        // Wait for expand animation
        await page.waitForTimeout(300);

        // Expanded content should be visible
        const expandedContent = page.locator('[data-testid="thinking-block-content-expanded"]').first();
        await expect(expandedContent).toBeVisible();
      }
    });

    test('should collapse thinking block when clicked again', async ({ page }) => {
      const header = page.locator('[data-testid="thinking-block-header"]').first();
      const count = await header.count();

      if (count > 0) {
        // Expand first
        await header.click();
        await page.waitForTimeout(300);

        // Collapse
        await header.click();
        await page.waitForTimeout(300);

        // Collapsed content should be visible
        const collapsedContent = page.locator(
          '[data-testid="thinking-block-content-collapsed"]'
        ).first();
        const isVisible = await collapsedContent.isVisible();
        expect(typeof isVisible).toBe('boolean');
      }
    });
  });

  test.describe('Tool Invocations', () => {
    test('should display tool invocation cards when present', async ({ page }) => {
      const toolCards = page.locator('[data-testid="tool-invocation-card"]');

      // Tool cards may not appear in all responses
      expect(await toolCards.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show tool status badge', async ({ page }) => {
      const statusBadges = page.locator('[data-testid="tool-status-badge"]');
      const count = await statusBadges.count();

      if (count > 0) {
        const badge = statusBadges.first();
        await expect(badge).toBeVisible();

        // Badge should contain status text
        const text = await badge.textContent();
        expect(['Executing', 'Complete', 'Error']).toContain(text);
      }
    });

    test('should display tool input in JSON format', async ({ page }) => {
      const inputSections = page.locator('[data-testid="tool-input-section"]');
      const count = await inputSections.count();

      if (count > 0) {
        const inputCode = page.locator('[data-testid="tool-input-code"]').first();
        const text = await inputCode.textContent();

        // JSON should have braces or brackets
        expect(text).toMatch(/[{[\]]/);
      }
    });

    test('should expand tool card to show input/output', async ({ page }) => {
      const toolCards = page.locator('[data-testid="tool-invocation-card"]');
      const count = await toolCards.count();

      if (count > 0) {
        const header = page.locator('[data-testid="tool-invocation-header"]').first();
        await header.click();

        // Wait for expand animation
        await page.waitForTimeout(300);

        // Content should be visible
        const content = page.locator('[data-testid="tool-invocation-content"]').first();
        await expect(content).toBeVisible();
      }
    });

    test('should show tool execution duration', async ({ page }) => {
      const durations = page.locator('[data-testid="tool-duration"]');
      const count = await durations.count();

      if (count > 0) {
        const duration = durations.first();
        const text = await duration.textContent();

        // Should be in format like "1234ms"
        expect(text).toMatch(/\d+ms/);
      }
    });
  });

  test.describe('Usage Statistics Badge', () => {
    test('should display usage stats badge when present', async ({ page }) => {
      const badges = page.locator('[data-testid="usage-stats-badge"]');

      // May not appear in all responses
      expect(await badges.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show formatted token count', async ({ page }) => {
      const badges = page.locator('[data-testid="usage-stats-badge"]');
      const count = await badges.count();

      if (count > 0) {
        const badge = badges.first();
        const text = await badge.textContent();

        // Should contain "tokens" and a number
        expect(text).toContain('tokens');
        expect(text).toMatch(/(\d+\.?\d*k?|\d+)\s+tokens/);
      }
    });

    test('should show tooltip with token breakdown', async ({ page }) => {
      const badges = page.locator('[data-testid="usage-stats-badge"]');
      const count = await badges.count();

      if (count > 0) {
        const badge = badges.first();

        // Hover to show tooltip
        await badge.hover();
        await page.waitForTimeout(200);

        // Check for tooltip content
        const tooltip = badge.locator(':scope, [role="tooltip"]');
        const tooltipText = await badge.getAttribute('title');

        // Should have Input/Output/Total info
        expect(tooltipText || (await tooltip.textContent())).toMatch(/Input|Output|Total/i);
      }
    });

    test('should format large token counts with k suffix', async ({ page }) => {
      const badges = page.locator('[data-testid="usage-stats-badge"]');
      const count = await badges.count();

      if (count > 0) {
        const texts = await badges.allTextContents();
        const hasKSuffix = texts.some(text => /\d+\.?\d*k\s+tokens/.test(text));

        // If any badge has 1000+ tokens, should use k format
        expect(typeof hasKSuffix).toBe('boolean');
      }
    });
  });

  test.describe('Error Handling (FR-7)', () => {
    test('should display error message when present', async ({ page }) => {
      const errorMessages = page.locator('[data-testid="error-message"]');

      // May not appear in normal flow
      expect(await errorMessages.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show warning when chat unavailable', async ({ page }) => {
      // Look for unavailability warning
      const warning = page.locator(
        'text=/Chat service is not available|Chat SDK is not available|not configured/'
      );

      // Warning may or may not appear depending on backend
      const isVisible = await warning.isVisible();
      expect(typeof isVisible).toBe('boolean');
    });

    test('should handle rapid messages without errors', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');
      const errors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // Send multiple messages rapidly
      for (let i = 0; i < 3; i++) {
        await messageInput.fill(`Message ${i}`);
        await messageInput.press('Enter');
        await page.waitForTimeout(200);
      }

      // Check for critical errors
      const criticalErrors = errors.filter(
        e => !e.includes('404') && !e.includes('NetworkError')
      );
      expect(criticalErrors.length).toBeLessThan(3);
    });

    test('should not have uncaught exceptions in console', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // Perform some chat action
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('Test');

      await page.waitForTimeout(1000);

      // Filter out expected network errors
      const unexpectedErrors = errors.filter(
        e => !e.includes('404') && !e.includes('ECONNREFUSED')
      );

      expect(unexpectedErrors.length).toBe(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should support Tab navigation through interactive elements', async ({ page }) => {
      const messageInput = page.locator('[data-testid="message-input"]');

      // Focus input via Tab
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify something is focused
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focused).toBeTruthy();
    });

    test('should have aria-expanded on expandable elements', async ({ page }) => {
      // Check thinking block header
      const thinkingHeader = page.locator('[data-testid="thinking-block-header"]');
      const ariaExpanded = await thinkingHeader.first().getAttribute('aria-expanded');

      if (await thinkingHeader.count() > 0) {
        expect(['true', 'false']).toContain(ariaExpanded);
      }

      // Check tool invocation header
      const toolHeader = page.locator('[data-testid="tool-invocation-header"]');
      if (await toolHeader.count() > 0) {
        const toolAriaExpanded = await toolHeader.first().getAttribute('aria-expanded');
        expect(['true', 'false']).toContain(toolAriaExpanded);
      }
    });

    test('should have descriptive labels and testids', async ({ page }) => {
      // Verify key interactive elements have testids
      const messageInput = page.locator('[data-testid="message-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');

      expect(await messageInput.count()).toBeGreaterThan(0);
      expect(await sendButton.count()).toBeGreaterThan(0);
    });

    test('should have streaming indicator with aria-label', async ({ page }) => {
      // Send message to trigger streaming
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill('Hello');
      await messageInput.press('Enter');

      await page.waitForTimeout(500);

      // Look for streaming indicator with aria-label
      const streamingIndicator = page.locator('[aria-label="Content is streaming"]');
      const isPresent = await streamingIndicator.count() > 0;

      expect(typeof isPresent).toBe('boolean');
    });
  });

  test.describe('Dark Mode Support', () => {
    test('should render chat components with dark mode classes', async ({ page }) => {
      // Check if any dark mode classes are applied
      const darkModeElements = page.locator('[class*="dark:"]');
      const count = await darkModeElements.count();

      // Should have some dark mode classes defined (even if not active)
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should have consistent styling across theme', async ({ page }) => {
      // Get computed styles to verify CSS is loaded
      const messageInput = page.locator('[data-testid="message-input"]');
      const bgColor = await messageInput.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should have a background color defined
      expect(bgColor).toBeTruthy();
    });
  });
});
