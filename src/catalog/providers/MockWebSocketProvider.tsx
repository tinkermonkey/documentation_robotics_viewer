import { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';

/**
 * Mock WebSocket client implementation
 * Simulates real-time events for testing components that depend on WebSocket events
 */
export interface MockWebSocketClient {
  /**
   * Register a handler for a specific event
   * @param event - Event name
   * @param handler - Function called with event data as argument
   */
  on: (event: string, handler: (data: unknown) => void) => void;

  /**
   * Unregister a handler for an event, or all handlers if no handler specified
   * @param event - Event name
   * @param handler - Specific handler to remove, or undefined to remove all
   */
  off: (event: string, handler?: (data: unknown) => void) => void;

  /**
   * Emit an event (for testing purposes)
   * @param event - Event name
   * @param data - Event data passed to all handlers
   */
  emit: (event: string, data: unknown) => void;

  /**
   * Get all registered handlers for debugging
   * @param event - Event name
   * @returns Set of handlers registered for this event
   */
  getHandlers: (event: string) => Set<(data: unknown) => void>;
}

/**
 * Options for creating a mock WebSocket client
 */
export interface MockWebSocketClientOptions {
  /**
   * Enable debug logging to console (default: true)
   */
  debug?: boolean;
}

/**
 * Create a mock WebSocket client with in-memory event handling
 */
export function createMockWebSocketClient(options?: MockWebSocketClientOptions): MockWebSocketClient {
  const { debug = true } = options || {};
  const handlers = new Map<string, Set<(data: unknown) => void>>();

  const log = (message: string, data?: unknown): void => {
    if (debug) {
      if (data !== undefined) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  };

  return {
    on: (event: string, handler: (data: unknown) => void): void => {
      if (!handlers.has(event)) {
        handlers.set(event, new Set());
      }
      handlers.get(event)!.add(handler);
      log(`[Mock WS] Registered handler for '${event}'`);
    },

    off: (event: string, handler?: (data: unknown) => void): void => {
      if (!handler) {
        handlers.delete(event);
        log(`[Mock WS] Removed all handlers for '${event}'`);
      } else {
        handlers.get(event)?.delete(handler);
        log(`[Mock WS] Removed handler for '${event}'`);
      }
    },

    emit: (event: string, data: unknown): void => {
      log(`[Mock WS] Emitting '${event}' with data:`, data);
      const eventHandlers = handlers.get(event);
      if (eventHandlers) {
        const errors: Error[] = [];
        eventHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            log(`[Mock WS] Error in handler for '${event}':`, error);
            errors.push(error instanceof Error ? error : new Error(String(error)));
          }
        });
        // Propagate first handler error to surface issues in tests
        if (errors.length > 0) {
          throw errors[0];
        }
      }
    },

    getHandlers: (event: string): Set<(data: unknown) => void> => {
      return handlers.get(event) || new Set();
    }
  };
}

/**
 * Context for providing mock WebSocket client to stories
 */
const MockWebSocketContext = createContext<MockWebSocketClient | null>(null);

/**
 * Hook to use mock WebSocket client in stories
 */
export function useMockWebSocket(): MockWebSocketClient {
  const context = useContext(MockWebSocketContext);
  if (!context) {
    throw new Error('useMockWebSocket must be used within MockWebSocketProvider');
  }
  return context;
}

/**
 * Props for MockWebSocketProvider
 */
interface MockWebSocketProviderProps {
  children: ReactNode;
  client?: MockWebSocketClient;
}

/**
 * Provider component for stories requiring WebSocket event simulation
 */
export function MockWebSocketProvider({
  children,
  client
}: MockWebSocketProviderProps) {
  const mockClient = client || createMockWebSocketClient();

  return (
    <MockWebSocketContext.Provider value={mockClient}>
      {children}
    </MockWebSocketContext.Provider>
  );
}

/**
 * Utility hook to simulate WebSocket events in tests
 * Returns a function that can be called to emit events
 */
export function useWebSocketEventSimulator(): (event: string, data: unknown) => void {
  const client = useMockWebSocket();

  return useCallback((event: string, data: unknown): void => {
    client.emit(event, data);
  }, [client]);
}

/**
 * Common WebSocket event types for documentation robotics
 */
export const WebSocketEventTypes = {
  ANNOTATION_CREATED: 'annotation:created',
  ANNOTATION_UPDATED: 'annotation:updated',
  ANNOTATION_DELETED: 'annotation:deleted',
  ANNOTATION_RESOLVED: 'annotation:resolved',

  CHANGESET_CREATED: 'changeset:created',
  CHANGESET_UPDATED: 'changeset:updated',
  CHANGESET_APPLIED: 'changeset:applied',
  CHANGESET_DISCARDED: 'changeset:discarded',

  MODEL_LOADED: 'model:loaded',
  MODEL_UPDATED: 'model:updated',

  FILTER_CHANGED: 'filter:changed',
  SELECTION_CHANGED: 'selection:changed'
} as const;
