/**
 * Store Provider Wrapper
 * Provides mock Zustand stores to components that use hooks like useAnnotationStore, useModelStore
 * This allows components designed with hooks to work in isolated story contexts
 */

import { ReactNode, useEffect } from 'react';
import { createMockAnnotationStore, createMockModelStore, createMockFilterStore } from './MockStoreProvider';
import type { Annotation } from '../../apps/embedded/types/annotations';
import type { MetaModel } from '../../core/types';
import type { MockFilterState } from './MockStoreProvider';

// Module-level stores that can be accessed via hooks
let globalAnnotationStore: ReturnType<typeof createMockAnnotationStore> | null = null;
let globalModelStore: ReturnType<typeof createMockModelStore> | null = null;
let globalFilterStore: ReturnType<typeof createMockFilterStore> | null = null;

/**
 * Get or create the global annotation store
 */
export function getAnnotationStore() {
  if (!globalAnnotationStore) {
    globalAnnotationStore = createMockAnnotationStore();
  }
  return globalAnnotationStore;
}

/**
 * Get or create the global model store
 */
export function getModelStore() {
  if (!globalModelStore) {
    globalModelStore = createMockModelStore();
  }
  return globalModelStore;
}

/**
 * Get or create the global filter store
 */
export function getFilterStore() {
  if (!globalFilterStore) {
    globalFilterStore = createMockFilterStore();
  }
  return globalFilterStore;
}

/**
 * Reset all global stores (useful for test isolation)
 */
export function resetStores() {
  globalAnnotationStore = null;
  globalModelStore = null;
  globalFilterStore = null;
}

interface StoreProviderWrapperProps {
  children: ReactNode;
  initialAnnotations?: Annotation[];
  initialModel?: MetaModel;
  initialFilters?: MockFilterState;
}

/**
 * Provider wrapper that sets up global stores for story context
 * Components using useAnnotationStore, useModelStore, etc. will access these stores
 */
export function StoreProviderWrapper({
  children,
  initialAnnotations = [],
  initialModel,
  initialFilters = {}
}: StoreProviderWrapperProps) {
  useEffect(() => {
    // Initialize annotation store
    const annotationStore = createMockAnnotationStore(initialAnnotations);
    globalAnnotationStore = annotationStore;

    // Initialize model store
    const modelStore = createMockModelStore(initialModel ? { model: initialModel } : {});
    globalModelStore = modelStore;

    // Initialize filter store
    const filterStore = createMockFilterStore(initialFilters);
    globalFilterStore = filterStore;

    return () => {
      resetStores();
    };
  }, [initialAnnotations, initialModel, initialFilters]);

  return <>{children}</>;
}
