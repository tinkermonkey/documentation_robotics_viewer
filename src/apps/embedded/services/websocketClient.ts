/**
 * WebSocket Client Service
 * Manages WebSocket connection to the DR CLI server
 * Features: auto-reconnect, exponential backoff, event handling, token authentication
 *
 * Authentication:
 * - Tokens are passed via Sec-WebSocket-Protocol header (browser-compatible)
 * - Format: new WebSocket(url, ['token', 'ACTUAL_TOKEN'])
 * - Browser sends: Sec-WebSocket-Protocol: token, ACTUAL_TOKEN
 * - Fallback to no-auth if token is not present
 */

import { logError } from './errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';
import type { JsonRpcRequest, JsonRpcNotification } from '../types/chat';
import type { WebSocketMessage, EventHandler, WebSocketEventMap } from '../types/websocket';

/**
 * Messages that can be sent over WebSocket
 * Includes both WebSocket protocol messages (with type) and JSON-RPC messages
 */
type WebSocketSendMessage = WebSocketMessage | JsonRpcRequest | JsonRpcNotification;

/**
 * Interface for WebSocket client - implemented by both real WebSocketClient and mocks
 */
export interface WebSocketClientInterface {
  setToken(token: string | null): void;
  connect(): void;
  disconnect(): void;
  subscribe(topics: string[]): void;
  send(message: WebSocketSendMessage): boolean;
  on<K extends keyof WebSocketEventMap>(event: K, handler: EventHandler<WebSocketEventMap[K]>): void;
  on(event: string, handler: EventHandler<unknown>): void;
  off<K extends keyof WebSocketEventMap>(event: K, handler: EventHandler<WebSocketEventMap[K]>): void;
  off(event: string, handler: EventHandler<unknown>): void;
  /** Direct WebSocket connection state (true only if ws.readyState === OPEN) */
  readonly isConnected: boolean;
  /** High-level state machine: connecting, connected, disconnected, or reconnecting */
  readonly connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  readonly transportMode: 'websocket' | 'rest' | 'detecting';
}

export class WebSocketClient implements WebSocketClientInterface {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000; // Start at 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: number = 30000; // 30 seconds
  private eventHandlers: Map<string, Set<EventHandler<unknown>>> = new Map();
  private isIntentionallyClosed: boolean = false;
  private subscribedTopics: string[] = [];
  private mode: 'websocket' | 'rest' | 'detecting' = 'detecting';
  private connectionTimeout: NodeJS.Timeout | null = null;
  private maxConnectionAttempts: number = 3; // Try connecting 3 times before falling back
  private connectionErrors: Error[] = []; // Buffer for capturing errors during detection phase

  constructor(url: string, token: string | null = null) {
    this.url = url;
    this.token = token;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    console.log('[WebSocket] Token updated:', token ? 'present' : 'cleared');
  }

  /**
   * Get WebSocket protocols for authentication
   * Uses Sec-WebSocket-Protocol header to pass token
   * This is the standard way to pass auth tokens for browser WebSocket connections
   */
  private getAuthProtocols(): string[] | undefined {
    if (!this.token) {
      return undefined;
    }

    // Pass token as two-part protocol: ['token', 'ACTUAL_TOKEN']
    // Browser sends: Sec-WebSocket-Protocol: token, ACTUAL_TOKEN
    // Server responds with: Sec-WebSocket-Protocol: token
    return ['token', this.token];
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    // If we've determined REST mode, don't try to connect
    if (this.mode === 'rest') {
      console.log('[WebSocket] Using REST mode, skipping WebSocket connection');
      this.emit('rest-mode', {});
      return;
    }

    this.isIntentionallyClosed = false;

    // Only log connection attempts during detection phase
    if (this.mode === 'detecting') {
      console.log(`[WebSocket] Attempting WebSocket connection (attempt ${this.reconnectAttempts + 1}/${this.maxConnectionAttempts})...`);
    }

    try {
      // Use protocols parameter to pass auth token instead of query params
      // This sends the token via Sec-WebSocket-Protocol header
      const protocols = this.getAuthProtocols();

      this.ws = new WebSocket(this.url, protocols);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);

      // Set connection timeout for initial detection
      if (this.mode === 'detecting') {
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.log('[WebSocket] Connection timeout during detection phase');
            this.ws.close();
          }
        }, 3000); // 3 second timeout
      }
    } catch (error) {
      if (this.mode === 'detecting') {
        console.debug('[WebSocket] Connection error during detection:', error);
        this.handleConnectionFailure();
        // Capture error for debugging
        this.connectionErrors.push(error instanceof Error ? error : new Error(String(error)));
      } else {
        logError(
          ERROR_IDS.WS_CONNECTION_ERROR,
          'WebSocket connection error',
          { error: error instanceof Error ? error.message : String(error) }
        );
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Get captured connection errors from detection phase (for debugging)
   */
  getConnectionErrors(): Error[] {
    return [...this.connectionErrors];
  }

  /**
   * Assert we're in test environment, throwing early for test hooks
   * Reduces duplication of environment checks across test methods
   */
  private assertTestEnvironment(): void {
    if (!isTestEnvironment()) {
      console.warn('[WebSocket] Test hook called in production - ignoring');
      throw new Error('[WebSocket] Test hook not available in production');
    }
  }

  /**
   * TEST HOOK: Trigger a WebSocket close event (for testing reconnection logic)
   * Only available in test environment - checked via isTestEnvironment() function
   */
  triggerCloseForTesting(): void {
    try {
      this.assertTestEnvironment();
    } catch {
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] TEST: Forcing close event');
      // Trigger onclose handler by closing the connection
      this.ws.close(1000, 'Test-triggered close');
    } else {
      console.warn('[WebSocket] TEST: Cannot close, not connected');
    }
  }

  /**
   * TEST HOOK: Simulate exhausted reconnection attempts (for testing failure handling)
   * Only available in test environment - checked via isTestEnvironment() function
   */
  simulateMaxReconnectAttemptsForTesting(): void {
    try {
      this.assertTestEnvironment();
    } catch {
      return;
    }

    console.log('[WebSocket] TEST: Simulating max reconnect attempts');
    this.reconnectAttempts = this.maxReconnectAttempts;
    // Trigger the max-reconnect event
    logError(
      ERROR_IDS.WS_MAX_RECONNECT_ATTEMPTS,
      'Max reconnection attempts reached (TEST SIMULATION)',
      { attempts: this.reconnectAttempts }
    );
    this.emit('max-reconnect-attempts', { attempts: this.reconnectAttempts });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    this.cancelReconnect();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('[WebSocket] Disconnected');
    this.emit('disconnect', {});
  }

  /**
   * Subscribe to topics
   */
  subscribe(topics: string[]): void {
    this.subscribedTopics = topics;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        topics: topics
      });
    }
  }

  /**
   * Send a message to the server
   * @returns true if message was sent, false if connection is not open
   */
  send(message: WebSocketSendMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        logError(
          ERROR_IDS.WS_SEND_FAILED,
          'Failed to send WebSocket message',
          { error: error instanceof Error ? error.message : String(error), message }
        );
        return false;
      }
    } else {
      logError(
        ERROR_IDS.WS_NOT_CONNECTED,
        'Cannot send message, WebSocket not connected',
        { connectionState: this.ws?.readyState, message }
      );
      return false;
    }
  }

  /**
   * Register an event handler
   * Supports both typed WebSocket events and custom message types from the server
   */
  on<K extends keyof WebSocketEventMap>(event: K, handler: EventHandler<WebSocketEventMap[K]>): void;
  on(event: string, handler: EventHandler<unknown>): void;
  on<K extends keyof WebSocketEventMap>(event: K | string, handler: EventHandler<unknown>): void {
    if (!this.eventHandlers.has(event as string)) {
      this.eventHandlers.set(event as string, new Set());
    }
    this.eventHandlers.get(event as string)!.add(handler as EventHandler<unknown>);
  }

  /**
   * Unregister an event handler
   * Supports both typed WebSocket events and custom message types from the server
   */
  off<K extends keyof WebSocketEventMap>(event: K, handler: EventHandler<WebSocketEventMap[K]>): void;
  off(event: string, handler: EventHandler<unknown>): void;
  off<K extends keyof WebSocketEventMap>(event: K | string, handler: EventHandler<unknown>): void {
    const handlers = this.eventHandlers.get(event as string);
    if (handlers) {
      handlers.delete(handler as EventHandler<unknown>);
    }
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  get connectionState(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (!this.ws) {
      return this.reconnectTimer ? 'reconnecting' : 'disconnected';
    }

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return this.reconnectTimer ? 'reconnecting' : 'disconnected';
      default:
        return 'disconnected';
    }
  }

  /**
   * Get current transport mode
   */
  get transportMode(): 'websocket' | 'rest' | 'detecting' {
    return this.mode;
  }

  /**
   * Handle connection failure during detection phase
   */
  private handleConnectionFailure(): void {
    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxConnectionAttempts) {
      // Switch to REST mode and log collected errors from detection phase
      console.log('[WebSocket] Server does not support WebSocket, using REST mode');
      if (this.connectionErrors.length > 0) {
        console.warn('[WebSocket] Connection attempts failed with the following errors:');
        this.connectionErrors.forEach((error, index) => {
          console.warn(`  [${index + 1}] ${error.message}`);
        });
      }
      this.mode = 'rest';
      this.reconnectAttempts = 0;
      this.emit('rest-mode', {});
      this.emit('connect', {}); // Still emit connect for REST mode
    } else {
      // Try again
      setTimeout(() => this.connect(), 500);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    console.log('[WebSocket] Connected successfully');
    this.mode = 'websocket';
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.startHeartbeat();
    this.emit('connect', {});

    // Resubscribe to topics if any
    if (this.subscribedTopics.length > 0) {
      this.subscribe(this.subscribedTopics);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      const messageType = message.type ?? 'message';
      console.log('[WebSocket] Received:', messageType);

      // Emit event for this message type
      this.emit(messageType, message);

      // Also emit a generic 'message' event
      this.emit('message', message);
    } catch (error) {
      logError(
        ERROR_IDS.WS_MESSAGE_PARSE_FAILED,
        'Failed to parse WebSocket message',
        { error: error instanceof Error ? error.message : String(error), data: event.data }
      );
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    // Use existing test environment detection to avoid duplication
    const isTestEnv = isTestEnvironment();

    // Capture error during detection for later debugging
    if (this.mode === 'detecting') {
      const errorMsg = event instanceof ErrorEvent ? event.message : String(event);
      this.connectionErrors.push(new Error(`[Attempt ${this.reconnectAttempts + 1}/${this.maxConnectionAttempts}] ${errorMsg}`));
      console.debug('[WebSocket] Connection error during detection (attempt %d/%d): %s',
        this.reconnectAttempts + 1,
        this.maxConnectionAttempts,
        errorMsg
      );
    } else if (!isTestEnv) {
      // Full error logging outside test environments
      logError(
        ERROR_IDS.WS_ERROR_EVENT,
        'WebSocket error event',
        { error: event instanceof ErrorEvent ? event.message : String(event) }
      );
    } else {
      // In test environments, log at debug level to reduce noise but still emit the error event
      console.debug('[WebSocket] Error in test environment:', event);
    }

    // Always emit error event regardless of environment
    // Tests can choose to ignore or handle these events as needed
    this.emit('error', { error: event });
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Handle detection phase closures
    if (this.mode === 'detecting') {
      this.handleConnectionFailure();
      return;
    }

    console.log(`[WebSocket] Closed (code: ${event.code}, reason: ${event.reason})`);
    this.stopHeartbeat();
    this.emit('close', { code: event.code, reason: event.reason });

    // Attempt to reconnect unless intentionally closed or in REST mode
    if (!this.isIntentionallyClosed && this.mode !== 'rest') {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logError(
        ERROR_IDS.WS_MAX_RECONNECT_ATTEMPTS,
        'Max reconnection attempts reached',
        { attempts: this.reconnectAttempts }
      );
      this.emit('max-reconnect-attempts', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Cancel scheduled reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat/keepalive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logError(
            ERROR_IDS.WS_EVENT_HANDLER_ERROR,
            `Error in WebSocket event handler for '${event}'`,
            { error: error instanceof Error ? error.message : String(error), event }
          );
        }
      });
    }
  }
}

// Detect if we're in a test/story environment (Storybook or Playwright)
// IMPORTANT: Only check explicit flags, not port-based heuristics
// In test environment, this method returns true and the WebSocket client uses a mock
// (does NOT connect to real server). In production, returns false and uses real WebSocket.
function isTestEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Playwright test environment (set by Playwright test runner)
  if (window.__PLAYWRIGHT__) return true;

  // Check for explicit mock flag (must be set by Storybook/test configuration)
  if (window.__STORYBOOK_MOCK_WEBSOCKET__) return true;

  // Check if we're in a test environment by looking for test-specific globals.
  // - karma: sets window.__karma__ (test runner property)
  // - jasmine: sets window.jasmine (lowercase, global scope)
  // - jest: sets window.jest (lowercase, global scope)
  // These checks gracefully enable mock WebSocket when test frameworks are detected.
  if (window.__karma__ || (window as any).jasmine || (window as any).jest) return true;

  // Note: Do NOT check window.location.port (e.g., port 61001) as this can incorrectly
  // activate the mock client in production environments that use port-based routing
  // or reverse proxies. Only use explicit flags set by the test framework.

  return false;
}

/**
 * Module augmentation to add WebSocket client to window for Playwright tests
 */
declare global {
  interface Window {
    __WEBSOCKET_CLIENT__?: WebSocketClientInterface;
    __INTENTIONAL_DISCONNECT__?: boolean;
    __CONNECTION_STATE__?: string;
    __PLAYWRIGHT__?: boolean;
    __STORYBOOK_MOCK_WEBSOCKET__?: boolean;
    __karma__?: boolean;
    // Note: jasmine and jest use lowercase property names (not __jasmine__, __jest__)
  }
}

// Create singleton instance
// In browser environments (window is defined), create a real WebSocket client
// In SSR/Node.js environments (window is undefined), use a mock that explicitly fails
let websocketClient: WebSocketClientInterface;

if (typeof window !== 'undefined') {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  websocketClient = new WebSocketClient(wsUrl, null);
} else {
  // Node.js/SSR environment: create a mock WebSocket client that explicitly fails
  // This prevents silent failures where the app thinks it has a real connection
  const mockHandlers = new Map<string, Set<EventHandler<unknown>>>();

  websocketClient = {
    setToken: () => {},
    connect: () => {
      // Emit error event to indicate mock environment cannot create real connection
      setTimeout(() => {
        const errorHandlers = mockHandlers.get('error');
        if (errorHandlers) {
          errorHandlers.forEach(h => h({
            code: 'SSR_ENVIRONMENT',
            message: 'WebSocket not available in SSR/Node.js environment'
          }));
        }
        // Also emit rest-mode event for fallback behavior
        const handlers = mockHandlers.get('rest-mode');
        if (handlers) handlers.forEach(h => h({}));
      }, 0);
    },
    disconnect: () => {},
    subscribe: () => {},
    send: () => {
      // Explicitly fail sends in mock environment
      console.error('[WebSocketClient] Cannot send message in SSR/Node.js environment - use REST API instead');
      return false;
    },
    on: (event: string, handler: EventHandler<unknown>) => {
      if (!mockHandlers.has(event)) {
        mockHandlers.set(event, new Set());
      }
      mockHandlers.get(event)!.add(handler);
    },
    off: (event: string, handler: EventHandler<unknown>) => {
      const handlers = mockHandlers.get(event);
      if (handlers) handlers.delete(handler);
    },
    get isConnected() { return false; },
    get connectionState() { return 'disconnected' as const; },
    get transportMode() { return 'rest' as const; }
  };
}

export { websocketClient };

// Re-export types from websocket.ts for backward compatibility
export type { WebSocketMessage, EventHandler, WebSocketEventMap } from '../types/websocket';

// Expose websocketClient to window in test environments for Playwright access
if (typeof window !== 'undefined' && isTestEnvironment()) {
  window.__WEBSOCKET_CLIENT__ = websocketClient;
}
