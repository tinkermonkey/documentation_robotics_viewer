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

    // Wait for the answer itself, not just a new bot row: the empty streaming
    // placeholder is added the moment the message is sent, while the real
    // answer (Claude Code + DrBot's agent) can take well over 10s to arrive.
    const answerRow = drawer.locator('[data-testid="chat-message-bot"]', { hasText: /pong/i });
    await expect(answerRow.first()).toBeVisible({ timeout: 80_000 });
    // ...and has finished streaming (its text stops changing), so the
    // duplicate check below reads the final text.
    let lastText = '';
    await expect
      .poll(
        async () => {
          const text = await answerRow.first().innerText();
          const settled = text === lastText;
          lastText = text;
          return settled;
        },
        { timeout: 80_000, intervals: [1_000] },
      )
      .toBe(true);

    // The answer body contains "pong". Assert it appears in exactly ONE bot row,
    // and within that row the word is NOT duplicated (double-emit would render
    // "pongpong" / "pong pong" inside a single coalesced text body).
    await expect(answerRow).toHaveCount(1);

    const answerText = (await answerRow.locator('.chat-message__body').innerText()).toLowerCase();
    const pongMatches = (answerText.match(/pong/g) ?? []).length;
    expect(pongMatches).toBe(1);
  });
});
