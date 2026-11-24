/**
 * Global Vitest setup (registered via `vitest.config.ts` `setupFiles`).
 *
 * - Extends `expect` with jest-dom matchers for component/DOM assertions.
 * - Boots the MSW server once, resets handlers + the in-memory annotation store
 *   after every test, and tears it down at the end.
 * - Resets the chat store between tests so the singleton `chatService` /
 *   `chatStore` never bleed state across cases.
 *
 * Pure-function unit tests (node env, no DOM/network) are unaffected: MSW's
 * Node interceptor only patches `fetch`, and the store reset is a no-op for
 * tests that don't touch chat.
 */

import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { mswServer, resetMswState } from './mswServer';
import { useChatStore } from '@/apps/embedded/stores/chatStore';
import { installDomStubs } from './domStubs';
import { useCheckoutStore } from '@/apps/embedded/stores/checkoutStore';

/** The checkout every test shows unless it sets another (the route's `/p/<project>/c/<checkout>`). */
export const TEST_CHECKOUT = { project: 'test-project', checkout: 'main' } as const;

// happy-dom gap stubs (ResizeObserver/IntersectionObserver/matchMedia/scrollIntoView).
// No-ops when run under the node env (pure-function tests): the installer guards
// on `window`/`Element` existence.
installDomStubs();

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: 'error' });
});

// Every project-data hook is scoped to the route's checkout: seed one, as the
// router would, so components rendered without a router still load data.
beforeEach(() => {
  useCheckoutStore.setState({ ref: { ...TEST_CHECKOUT }, unavailable: null });
});

afterEach(() => {
  // Unmount any rendered component trees so `screen` queries never see stale
  // DOM from a prior test (Testing Library auto-cleanup is not wired without
  // `globals: true`). A no-op for pure-function tests that render nothing.
  cleanup();
  mswServer.resetHandlers();
  resetMswState();
  useChatStore.getState().reset();
});

afterAll(() => {
  mswServer.close();
});
