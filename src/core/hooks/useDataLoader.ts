/**
 * Generic Data Loading Hook
 *
 * Encapsulates async data fetching with loading/error state management,
 * WebSocket event subscription, and optional callbacks.
 *
 * Usage:
 * ```typescript
 * const { data, loading, error, reload } = useDataLoader({
 *   loadFn: () => embeddedDataLoader.loadModel(),
 *   websocketEvents: ['model.updated'],
 *   onSuccess: (model) => useModelStore.getState().setModel(model),
 * });
 * ```
 */

import { useState, useCallback, useEffect } from 'react';
import { websocketClient } from '../../apps/embedded/services/websocketClient';

/**
 * Options for the useDataLoader hook
 */
export interface DataLoaderOptions<T> {
  /** Async function that returns data */
  loadFn: () => Promise<T>;

  /** Whether to load data on mount (default: true) */
  immediate?: boolean;

  /** Callback invoked after successful load */
  onSuccess?: (data: T) => void;

  /** Callback invoked after load failure */
  onError?: (error: Error) => void;

  /** WebSocket events that trigger reload */
  websocketEvents?: string[];
}

/**
 * Result from the useDataLoader hook
 */
export interface DataLoaderResult<T> {
  /** Loaded data, or null if not yet loaded or loading failed */
  data: T | null;

  /** Whether data is currently loading */
  loading: boolean;

  /** Error message if loading failed, or null */
  error: string | null;

  /** Function to manually trigger a reload */
  reload: () => Promise<void>;
}

/**
 * Generic hook for async data loading with WebSocket integration
 *
 * Manages loading, error, and data state, and optionally:
 * - Executes loadFn on mount if immediate is true (default)
 * - Calls success/error callbacks
 * - Subscribes to WebSocket events and reloads on event
 * - Cleans up subscriptions on unmount
 *
 * @param options Configuration options
 * @returns Data loading state and reload function
 */
export function useDataLoader<T>(options: DataLoaderOptions<T>): DataLoaderResult<T> {
  const { loadFn, immediate = true, onSuccess, onError, websocketEvents } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reload function that executes the loadFn and updates state
   */
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await loadFn();
      setData(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }, [loadFn, onSuccess, onError]);

  /**
   * Load data on mount if immediate is true
   */
  useEffect(() => {
    if (immediate) {
      reload();
    }
  }, [immediate, reload]);

  /**
   * Subscribe to WebSocket events and reload when they fire
   */
  useEffect(() => {
    if (!websocketEvents || websocketEvents.length === 0) {
      return;
    }

    const handler = () => {
      reload();
    };

    websocketEvents.forEach((event) => {
      websocketClient.on(event, handler);
    });

    return () => {
      websocketEvents.forEach((event) => {
        websocketClient.off(event, handler);
      });
    };
  }, [websocketEvents, reload]);

  return { data, loading, error, reload };
}
