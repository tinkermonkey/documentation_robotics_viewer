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

import { useState, useCallback, useEffect, useRef } from 'react';
import { websocketClient } from '../services/websocketClient';
import { logError } from '../services/errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';

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
 * - Calls success/error callbacks with proper error handling
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

  // Create stable ref to avoid effect re-runs and subscription churn
  const reloadRef = useRef<(() => Promise<void>) | undefined>(undefined);

  /**
   * Reload function that executes loadFn and manages state lifecycle:
   * - Sets loading=true and clears previous errors
   * - Updates data state with results
   * - Invokes success/error callbacks with proper error handling
   * - Guarantees loading state is cleared even if callbacks throw
   */
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await loadFn();
      setData(result);

      if (onSuccess) {
        try {
          onSuccess(result);
        } catch (successError) {
          console.error('[useDataLoader] onSuccess callback failed:', successError);
          // Track callback failure for observability
          const callbackError = successError instanceof Error ? successError : new Error(String(successError));
          logError(
            ERROR_IDS.DATA_LOADER_SUCCESS_CALLBACK_FAILED,
            'Success callback threw an error',
            {
              callbackName: onSuccess.name || 'anonymous',
              message: callbackError.message
            },
            callbackError
          );
          // Don't fail the load if the success callback fails - UI state may be partially updated
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';

      // CRITICAL: Add comprehensive error logging with context
      console.error('[useDataLoader] Load failed:', {
        error: err,
        message: errorMessage,
        loadFn: loadFn.name || 'anonymous',
        stack: err instanceof Error ? err.stack : undefined,
      });

      setError(errorMessage);

      if (onError) {
        try {
          onError(err instanceof Error ? err : new Error(errorMessage));
        } catch (errorHandlerError) {
          console.error('[useDataLoader] onError callback failed:', errorHandlerError);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [loadFn, onSuccess, onError]);

  // Update ref whenever reload changes to avoid subscription churn
  reloadRef.current = reload;

  /**
   * Load data on mount if immediate is true
   */
  useEffect(() => {
    if (immediate && reloadRef.current) {
      reloadRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]); // Remove reload from deps to prevent infinite loops

  /**
   * Subscribe to WebSocket events and reload when they fire
   * Uses ref to avoid re-subscribing whenever reload changes
   */
  useEffect(() => {
    if (!websocketEvents?.length) {
      return;
    }

    const handler = () => {
      if (reloadRef.current) {
        reloadRef.current();
      }
    };

    websocketEvents.forEach((event) => {
      websocketClient.on(event, handler);
    });

    return () => {
      websocketEvents.forEach((event) => {
        websocketClient.off(event, handler);
      });
    };
  }, [websocketEvents]); // Remove reload from deps to prevent subscription churn

  return { data, loading, error, reload };
}
