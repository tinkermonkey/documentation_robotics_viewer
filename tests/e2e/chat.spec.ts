/**
 * chat.spec.ts — the DrBot chat drawer, end-to-end against a REAL Claude Code.
 *
 * GATED on `chat.status.sdk_available` (read over the WS JSON-RPC `chat.status`
 * method): the whole describe is skipped when no chat client is available.
 *
 * Sends ONE short benign query and asserts the streamed answer renders EXACTLY
 * ONCE (not doubled) — the end-to-end guard for the WebSocket double-emit
 * regression (a JSON-RPC frame must dispatch the generic `message` event once,
 * not twice, so chat text is not duplicated).
 */

import { test, expect } from '@playwright/test';
import { gotoView, ROUTES, chatSdkAvailable } from './helpers';

test.describe('chat', () => {
  // One real Claude Code spawn per query → allow plenty of time.
  test.setTimeout(90_000);

  test('streamed answer renders exactly once (double-emit regression)', async ({ page }) => {
    await gotoView(page, ROUTES.model);

    const available = await chatSdkAvailable(page);
    test.skip(!available, 'chat SDK unavailable (chat.status.sdk_available === false)');

    // Open the drawer (default viewport is < 1300px, so it starts closed).
    const drawer = page.getByTestId('chat-drawer');
    if (!(await drawer.isVisible())) {
      await page.getByRole('button', { name: /DrBot/ }).click();
    }
    await expect(drawer).toBeVisible();

    // Compose one short benign query and send it (Enter submits).
    const composer = drawer.locator('.chat-composer__input');
    await expect(composer).toBeVisible();
    const query = 'Reply with the single word pong and nothing else.';
    await composer.fill(query);
    await composer.press('Enter');

    // The user message renders once.
    await expect(drawer.getByText(query, { exact: false })).toBeVisible();

    // Wait for a bot answer to stream in. After the greeting + this exchange,
    // there is exactly one NEW bot row carrying the answer text.
    const botRows = drawer.locator('[data-testid="chat-message-bot"]');
    // Greeting is row 0; the answer is a later bot row.
    await expect.poll(async () => botRows.count(), { timeout: 80_000 }).toBeGreaterThan(1);

    // The answer body contains "pong". Assert it appears in exactly ONE bot row,
    // and within that row the word is NOT duplicated (double-emit would render
    // "pongpong" / "pong pong" inside a single coalesced text body).
    const answerRow = drawer.locator('[data-testid="chat-message-bot"]', { hasText: /pong/i });
    await expect(answerRow).toHaveCount(1);

    const answerText = (await answerRow.locator('.chat-message__body').innerText()).toLowerCase();
    const pongMatches = (answerText.match(/pong/g) ?? []).length;
    expect(pongMatches).toBe(1);
  });
});
