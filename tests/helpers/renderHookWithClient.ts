/**
 * renderHook wrapper that provides a FRESH React Query client per call so the
 * data-hook tests never bleed cache between cases. Retries are disabled (so a
 * deliberate error surfaces immediately) and gc/stale times are tuned for
 * deterministic refetch assertions.
 */

import { createElement, type ReactNode } from 'react';
import { renderHook, type RenderHookOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderHookWithClient<TResult, TProps>(
  callback: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & { client?: QueryClient },
) {
  const client = options?.client ?? createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, ...renderHook(callback, { ...options, wrapper }) };
}
