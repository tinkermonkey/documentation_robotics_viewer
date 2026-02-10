/**
 * Story Provider Wrapper
 * Chains all mock providers in correct order for comprehensive story testing
 *
 * Provider Chain:
 * ReactFlowProvider → MockRouterProvider → MockDataLoaderProvider →
 * MockStoreProvider → MockWebSocketProvider → children
 */

import { ReactFlowProvider } from '@xyflow/react';
import { useMemo, type ReactNode } from 'react';
import { MockRouterProvider, type NavigateOptions } from './MockRouterProvider';
import { MockDataLoaderProvider } from './MockDataLoaderProvider';
import { MockStoreProvider } from './MockStoreProvider';
import { MockWebSocketProvider, createMockWebSocketClient } from './MockWebSocketProvider';
import type { MetaModel } from '../../core/types';
import type { SpecDataResponse, LinkRegistry } from '../../apps/embedded/services/embeddedDataLoader';
import type { Annotation } from '../../apps/embedded/types/annotations';
import type { MockFilterState } from './MockStoreProvider';

/**
 * Props for StoryProviderWrapper
 */
export interface StoryProviderWrapperProps {
  children: ReactNode;

  // Router Props
  /** Initial route params (e.g., { view: 'graph' }) */
  initialParams?: Record<string, string | undefined>;
  /** Initial search params (e.g., { layer: 'motivation' }) */
  initialSearch?: Record<string, unknown>;
  /** Optional callback for navigation events */
  onNavigate?: (options: NavigateOptions) => void;

  // Data Loader Props
  /** Pre-loaded MetaModel data */
  model?: MetaModel | null;
  /** Pre-loaded SpecDataResponse data */
  spec?: SpecDataResponse | null;
  /** Pre-loaded LinkRegistry data */
  linkRegistry?: LinkRegistry | null;
  /** Pre-loaded annotations */
  annotations?: Annotation[];

  // Store Props
  /** Override model store state */
  modelStoreOverrides?: { model?: MetaModel };
  /** Override annotation store state */
  annotationStoreOverrides?: { annotations?: Annotation[] };
  /** Override filter store state */
  filterStoreOverrides?: MockFilterState;

  // WebSocket Props
  /** Enable debug logging for WebSocket events */
  websocketDebug?: boolean;
}

/**
 * StoryProviderWrapper
 * Comprehensive provider wrapper that sets up all mock infrastructure for stories
 *
 * @example
 * <StoryProviderWrapper
 *   model={createCompleteModelFixture()}
 *   spec={createCompleteSpecFixture()}
 *   annotations={createAnnotationListFixture()}
 *   initialParams={{ view: 'graph' }}
 *   initialSearch={{ layer: 'motivation' }}
 * >
 *   <YourComponent />
 * </StoryProviderWrapper>
 */
export function StoryProviderWrapper({
  children,
  // Router props
  initialParams = {},
  initialSearch = {},
  onNavigate,
  // Data loader props
  model = null,
  spec = null,
  linkRegistry = null,
  annotations = [],
  // Store props
  modelStoreOverrides = {},
  annotationStoreOverrides = {},
  filterStoreOverrides = {},
  // WebSocket props
  websocketDebug = false
}: StoryProviderWrapperProps) {
  // Create WebSocket client with debug option
  const wsClient = useMemo(() => {
    return createMockWebSocketClient({
      debug: websocketDebug
    });
  }, [websocketDebug]);

  return (
    <ReactFlowProvider>
      <MockRouterProvider
        initialParams={initialParams}
        initialSearch={initialSearch}
        onNavigate={onNavigate}
      >
        <MockDataLoaderProvider
          model={model}
          spec={spec}
          linkRegistry={linkRegistry}
          annotations={annotations}
        >
          <MockStoreProvider
            initialAnnotations={annotations}
            initialFilters={filterStoreOverrides}
            modelStoreOverrides={{ model: model || undefined, ...modelStoreOverrides }}
            annotationStoreOverrides={{ annotations, ...annotationStoreOverrides }}
          >
            <MockWebSocketProvider client={wsClient}>
              {children}
            </MockWebSocketProvider>
          </MockStoreProvider>
        </MockDataLoaderProvider>
      </MockRouterProvider>
    </ReactFlowProvider>
  );
}
