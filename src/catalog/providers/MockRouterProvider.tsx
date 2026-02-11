/**
 * Mock Router Provider
 * Provides mock TanStack Router hooks for testing route compositions in Storybook
 *
 * NOTE: This provider is for FUTURE use in full-route stories that import actual route components.
 * Current composition components (ModelRouteComposition, SpecRouteComposition) accept all state
 * as props and do not use router hooks directly.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

/**
 * Navigate options matching TanStack Router NavigateOptions
 */
export interface NavigateOptions {
  to: string;
  search?: Record<string, unknown>;
  replace?: boolean;
  params?: Record<string, string | undefined>;
}

/**
 * Mock router context providing route state and navigation
 */
interface MockRouterContext {
  params: Record<string, string | undefined>;
  search: Record<string, unknown>;
  navigate: (options: NavigateOptions) => void;
  setParams: (params: Record<string, string | undefined>) => void;
  setSearch: (search: Record<string, unknown>) => void;
}

const MockRouterContext = createContext<MockRouterContext | null>(null);

/**
 * Get mock router context with error handling
 */
function useMockRouterContext(strict: boolean = true): MockRouterContext {
  const context = useContext(MockRouterContext);

  if (!context && strict) {
    throw new Error(
      'useMockRouterContext must be used within MockRouterProvider. ' +
      'Wrap your story component with <MockRouterProvider>.'
    );
  }

  return context || {
    params: {},
    search: {},
    navigate: () => console.warn('[MockRouter] navigate called outside provider'),
    setParams: () => {},
    setSearch: () => {}
  };
}

/**
 * Mock useParams hook matching @tanstack/react-router signature
 *
 * @example
 * const { view } = useParams({ strict: false });
 * // Returns: { view: 'graph' } or { view: undefined }
 */
export function useParams({ strict = true }: { strict?: boolean } = {}): Record<string, string | undefined> {
  const { params } = useMockRouterContext(strict);
  return params;
}

/**
 * Mock useSearch hook matching @tanstack/react-router signature
 *
 * @example
 * const search = useSearch({ strict: false }) as { layer?: string };
 * // Returns: { layer: 'motivation' } or {}
 */
export function useSearch({ strict = true }: { strict?: boolean } = {}): Record<string, unknown> {
  const { search } = useMockRouterContext(strict);
  return search;
}

/**
 * Mock useNavigate hook matching @tanstack/react-router signature
 *
 * @example
 * const navigate = useNavigate();
 * navigate({ to: '.', search: { layer: 'business' } });
 */
export function useNavigate(): (options: NavigateOptions) => void {
  const { navigate } = useMockRouterContext(true);
  return navigate;
}

/**
 * Access mock router internals for story control
 * Allows stories to programmatically update router state for testing
 *
 * @example
 * const { setParams, setSearch } = useMockRouter();
 * setParams({ view: 'json' });
 * setSearch({ layer: 'motivation' });
 */
export function useMockRouter(): Omit<MockRouterContext, 'navigate'> {
  const context = useMockRouterContext(true);
  return {
    params: context.params,
    search: context.search,
    setParams: context.setParams,
    setSearch: context.setSearch
  };
}

/**
 * Props for MockRouterProvider
 */
export interface MockRouterProviderProps {
  /** Initial route params (e.g., { view: 'graph' }) */
  initialParams?: Record<string, string | undefined>;
  /** Initial search params (e.g., { layer: 'motivation', token: 'abc123' }) */
  initialSearch?: Record<string, unknown>;
  /** Optional callback for navigation events (for logging/debugging) */
  onNavigate?: (options: NavigateOptions) => void;
  children: ReactNode;
}

/**
 * MockRouterProvider
 * Provides mock TanStack Router context for stories
 *
 * @example
 * <MockRouterProvider
 *   initialParams={{ view: 'graph' }}
 *   initialSearch={{ layer: 'motivation' }}
 *   onNavigate={(opts) => console.log('Navigate:', opts)}
 * >
 *   <YourComponent />
 * </MockRouterProvider>
 */
export function MockRouterProvider({
  initialParams = {},
  initialSearch = {},
  onNavigate,
  children
}: MockRouterProviderProps) {
  const [params, setParams] = useState<Record<string, string | undefined>>(initialParams);
  const [search, setSearch] = useState<Record<string, unknown>>(initialSearch);

  const navigate = useCallback((options: NavigateOptions) => {
    console.log('[MockRouter] navigate:', options);

    // Update params if provided
    if (options.params) {
      setParams(prev => ({ ...prev, ...options.params }));
    }

    // Update search if provided
    if (options.search) {
      setSearch(prev => ({ ...prev, ...options.search }));
    }

    // Call optional callback
    if (onNavigate) {
      onNavigate(options);
    }
  }, [onNavigate]);

  const value = useMemo<MockRouterContext>(() => ({
    params,
    search,
    navigate,
    setParams,
    setSearch
  }), [params, search, navigate]);

  return (
    <MockRouterContext.Provider value={value}>
      {children}
    </MockRouterContext.Provider>
  );
}
