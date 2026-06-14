/**
 * render-with-providers for the ui/ component tests.
 *
 * Wraps a component in a FRESH React Query client (retries off, no cache bleed)
 * so each test fetches against MSW deterministically, and resets the real
 * `uiStore` to its documented initial state first. We render the REAL
 * components + the REAL data hooks; only the network boundary (`/api/*`) is
 * mocked (MSW) — matching the suite's testing philosophy.
 *
 * `resetUiStore()` is exported for tests that need to seed presentation state
 * (a selected element / layer / changeset) before rendering: reset, then drive
 * the store via its own actions, then render.
 */

import { createElement, type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useUiStore } from '@/apps/embedded/ui/uiStore';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Restore `uiStore` to its documented initial state. `chatOpen`/`wide` seed
 * from the viewport in production; in tests we pin them to `false` for
 * determinism (happy-dom's default innerWidth is below the 1300px threshold).
 */
export function resetUiStore(): void {
  useUiStore.setState({
    view: 'model',
    layerId: null,
    selectedId: null,
    changesetId: null,
    canvasDark: false,
    chatOpen: false,
    wide: false,
    expandedSections: new Set<string>(['model']),
    expandedLayers: new Set<string>(),
  });
  // The store also mirrors canvasDark onto <body>; clear it so dark-mode tests
  // start from a known baseline.
  if (typeof document !== 'undefined') {
    document.body.classList.remove('dark-canvas');
  }
}

export interface RenderWithProvidersResult {
  client: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { client?: QueryClient },
) {
  resetUiStore();
  const client = options?.client ?? createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, ...render(ui, { ...options, wrapper }) };
}
