/**
 * Mock Data Loader Provider
 * Provides pre-loaded data and mocked useDataLoader hook for Storybook stories
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { MetaModel } from '../../core/types';
import type { SpecDataResponse } from '../../apps/embedded/services/embeddedDataLoader';
import type { Annotation } from '../../apps/embedded/types/annotations';
import type { DataLoaderOptions, DataLoaderResult } from '../../apps/embedded/hooks/useDataLoader';
import { useMockWebSocket } from './MockWebSocketProvider';

/**
 * Mock data loader context providing pre-loaded data
 */
interface MockDataLoaderContext {
  model: MetaModel | null;
  spec: SpecDataResponse | null;
  annotations: Annotation[];
  loading: boolean;
  error: string | null;
  setModel: (model: MetaModel | null) => void;
  setSpec: (spec: SpecDataResponse | null) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const MockDataLoaderContext = createContext<MockDataLoaderContext | null>(null);

/**
 * Get mock data loader context with error handling
 */
function useMockDataLoaderContext(): MockDataLoaderContext {
  const context = useContext(MockDataLoaderContext);

  if (!context) {
    throw new Error(
      'useMockDataLoaderContext must be used within MockDataLoaderProvider. ' +
      'Wrap your story component with <MockDataLoaderProvider>.'
    );
  }

  return context;
}

/**
 * Mock useDataLoader hook matching the real useDataLoader interface
 *
 * Simulates async loading with setTimeout and integrates with MockWebSocketProvider
 * to trigger reloads on WebSocket events.
 *
 * @example
 * const { data, loading, error, reload } = useDataLoader({
 *   loadFn: () => embeddedDataLoader.loadModel(),
 *   onSuccess: (model) => setModel(model),
 *   websocketEvents: ['model.updated']
 * });
 */
export function useDataLoader<T>(options: DataLoaderOptions<T>): DataLoaderResult<T> {
  const { loadFn, immediate = true, onSuccess, onError, websocketEvents } = options;
  const context = useMockDataLoaderContext();
  const mockWebSocket = useMockWebSocket();

  const [data, setData] = useState<T | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  /**
   * Reload function that simulates async loading with 100ms delay
   */
  const reload = useCallback(async () => {
    try {
      setLocalLoading(true);
      context.setLoading(true);
      setLocalError(null);
      context.setError(null);
      setCallbackError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await loadFn();
      setData(result);

      if (onSuccess) {
        try {
          onSuccess(result);
        } catch (successError) {
          // Log the error from callback but don't re-throw since we're in an async context
          // This prevents unhandled promise rejections
          console.error('[MockDataLoader] onSuccess callback failed:', successError);
          const callbackErr = successError instanceof Error ? successError : new Error(String(successError));
          const errorMessage = `Callback failed: ${callbackErr.message}`;
          setCallbackError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';

      console.error('[MockDataLoader] Load failed:', {
        error: err,
        message: errorMessage,
        loadFn: loadFn.name || 'anonymous'
      });

      setLocalError(errorMessage);
      context.setError(errorMessage);

      if (onError) {
        try {
          onError(err instanceof Error ? err : new Error(errorMessage));
        } catch (errorHandlerError) {
          // Log the error from callback but don't re-throw since we're in an async context
          // This prevents unhandled promise rejections
          console.error('[MockDataLoader] onError callback failed:', errorHandlerError);
        }
      }
    } finally {
      setLocalLoading(false);
      context.setLoading(false);
    }
  }, [loadFn, onSuccess, onError, context]);

  /**
   * Load data on mount if immediate is true
   */
  useEffect(() => {
    if (immediate) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  /**
   * Subscribe to WebSocket events via MockWebSocketProvider
   */
  useEffect(() => {
    if (!websocketEvents?.length || !mockWebSocket) {
      return;
    }

    const handler = () => {
      console.log('[MockDataLoader] WebSocket event triggered reload:', websocketEvents);
      reload();
    };

    websocketEvents.forEach((event) => {
      mockWebSocket.on(event, handler);
    });

    return () => {
      websocketEvents.forEach((event) => {
        mockWebSocket.off(event, handler);
      });
    };
  }, [websocketEvents, mockWebSocket, reload]);

  return {
    data,
    loading: localLoading || context.loading,
    error: localError || context.error,
    callbackError,
    reload
  };
}

/**
 * Props for MockDataLoaderProvider
 */
export interface MockDataLoaderProviderProps {
  /** Pre-loaded MetaModel data */
  model?: MetaModel | null;
  /** Pre-loaded SpecDataResponse data */
  spec?: SpecDataResponse | null;
  /** Pre-loaded annotations */
  annotations?: Annotation[];
  /** Initial loading state (default: false) */
  initialLoading?: boolean;
  /** Initial error state (default: null) */
  initialError?: string | null;
  children: ReactNode;
}

/**
 * MockDataLoaderProvider
 * Provides pre-loaded data and mocked useDataLoader hook for stories
 *
 * @example
 * <MockDataLoaderProvider
 *   model={createCompleteModelFixture()}
 *   spec={createCompleteSpecFixture()}
 *   annotations={createAnnotationListFixture()}
 * >
 *   <YourComponent />
 * </MockDataLoaderProvider>
 */
export function MockDataLoaderProvider({
  model: initialModel = null,
  spec: initialSpec = null,
  annotations: initialAnnotations = [],
  initialLoading = false,
  initialError = null,
  children
}: MockDataLoaderProviderProps) {
  const [model, setModel] = useState<MetaModel | null>(initialModel);
  const [spec, setSpec] = useState<SpecDataResponse | null>(initialSpec);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  const value = useMemo<MockDataLoaderContext>(() => ({
    model,
    spec,
    annotations,
    loading,
    error,
    setModel,
    setSpec,
    setAnnotations,
    setLoading,
    setError
  }), [model, spec, annotations, loading, error]);

  return (
    <MockDataLoaderContext.Provider value={value}>
      {children}
    </MockDataLoaderContext.Provider>
  );
}

/**
 * Access mock data loader internals for story control
 * Allows stories to programmatically update data/loading/error states
 *
 * @example
 * const { model, setModel, setLoading } = useMockDataLoader();
 * setModel(createMinimalModelFixture());
 * setLoading(true);
 */
export function useMockDataLoader(): MockDataLoaderContext {
  return useMockDataLoaderContext();
}
