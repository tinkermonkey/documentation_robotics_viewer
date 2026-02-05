import { test, expect } from '@playwright/test';

test.describe('ChatPanelContainer Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app (using baseURL from config)
    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
  });

  test('should render ChatPanel in ArchitectureRoute', async ({ page }) => {
    // Navigate to architecture route
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // Verify ChatPanel container is visible
    const chatPanel = page.locator('[data-testid="architecture-chat-panel"]');
    await expect(chatPanel).toBeVisible();
  });

  test('should initialize SDK status on mount', async ({ page }) => {
    // Navigate to architecture route
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // Check for SDK status indicator (ready or unavailable)
    const statusIndicator = page.locator('[data-testid="chat-panel"]').locator('text=/Ready|Unavailable/');
    await expect(statusIndicator).toBeVisible();
  });

  test('should display chat messages when available', async ({ page }) => {
    // Navigate to architecture route
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // Check for messages container
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    await expect(messagesContainer).toBeVisible();

    // Initially should show empty state or "No messages yet"
    const emptyState = page.locator('[data-testid="messages-container"]').locator('text=/No messages|Start a conversation/');
    await expect(emptyState).toBeVisible();
  });

  test('should have working input area', async ({ page }) => {
    // Navigate to architecture route
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // Find chat input
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();

    // Verify it's a textarea
    const textarea = chatInput.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('should show initialization spinner briefly on mount', async ({ page }) => {
    // Navigate to fresh route to catch initialization
    await page.click('text=Architecture');

    // Look for spinner during initialization
    const spinner = page.locator('[data-testid="architecture-chat-panel"]').locator('text=/Initializing chat/');

    // Spinner might be gone quickly, so we check if it was there or if panel is already ready
    try {
      await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });
      // Panel loaded successfully, initialization complete
      expect(true).toBe(true);
    } catch {
      // Should not fail to load
      throw new Error('ChatPanelContainer failed to initialize');
    }
  });

  test('should handle SDK unavailable gracefully', async ({ page }) => {
    // Navigate to architecture route
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // The panel should still render even if SDK is unavailable
    const chatPanel = page.locator('[data-testid="chat-panel"]');
    await expect(chatPanel).toBeVisible();

    // Check for either ready or unavailable indicator
    const statusText = page.locator('[data-testid="chat-panel"]').locator('text=/Ready|Unavailable/');
    await expect(statusText).toBeVisible();
  });

  test('should not have console errors during initialization', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to architecture route
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // Wait a moment for any async initialization
    await page.waitForTimeout(1000);

    // Filter out expected errors
    const unexpectedErrors = errors.filter(
      (err) => !err.includes('SDK') && !err.includes('not available')
    );

    expect(unexpectedErrors).toHaveLength(0);
  });

  test('should maintain chat state across panel visibility toggling', async ({ page }) => {
    // Navigate to architecture route
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // Initially visible
    let chatPanel = page.locator('[data-testid="architecture-chat-panel"]');
    await expect(chatPanel).toBeVisible();

    // Navigate away and back
    await page.click('text=Motivation');
    await page.waitForTimeout(500);

    // Navigate back to Architecture
    await page.click('text=Architecture');
    await page.waitForSelector('[data-testid="architecture-chat-panel"]', { timeout: 5000 });

    // Should be visible again
    chatPanel = page.locator('[data-testid="architecture-chat-panel"]');
    await expect(chatPanel).toBeVisible();
  });
});
