/**
 * WebSocket Client Service
 * Manages WebSocket connection to the Python CLI server
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

type EventHandler = (data: any) => void;

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketClient {
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
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
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
   * TEST HOOK: Trigger a WebSocket close event (for testing reconnection logic)
   * Only available in development/test mode via window flag
   */
  triggerCloseForTesting(): void {
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
   * Only available in development/test mode via window flag
   */
  simulateMaxReconnectAttemptsForTesting(): void {
    console.log('[WebSocket] TEST: Simulating max reconnect attempts');
    this.reconnectAttempts = this.maxReconnectAttempts;
    // Trigger the max-reconnect event
    logError(
      ERROR_IDS.WS_MAX_RECONNECT_ATTEMPTS,
      'Max reconnection attempts reached (TEST SIMULATION)',
      { attempts: this.reconnectAttempts }
    );
    this.emit('max-reconnect-attempts', { attempts: this.reconnectAttempts, isTest: true });
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
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }

  /**
   * Register an event handler
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
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
      console.log('[WebSocket] Received:', message.type);

      // Emit event for this message type
      this.emit(message.type, message);

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
      // In test environments, log at debug level instead of error
      console.debug('[WebSocket] Error in test environment:', event);
    }

    // Emit error event unless in test environment
    if (!isTestEnv) {
      this.emit('error', { error: event });
    }
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
  private emit(event: string, data: any): void {
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
function isTestEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Storybook environment (runs on port 61001 by default)
  if (window.location.port === '61001') return true;

  // Check for Playwright test environment
  if ((window as any).__PLAYWRIGHT__) return true;

  // Check for explicit mock flag (used in Storybook test environment)
  if ((window as any).__STORYBOOK_MOCK_WEBSOCKET__) return true;

  // Check if we're in a test environment by looking for test-specific globals
  if ((window as any).__karma__ || (window as any).jasmine || (window as any).jest) return true;

  return false;
}

// Create singleton instance
// In test environments, use a mock that never attempts WebSocket connections
// In production, use the real WebSocketClient
let websocketClient: WebSocketClient | any;

if (isTestEnvironment()) {
  // Import mock client dynamically to avoid bundling it in production
  // Create a simple inline mock that implements the same interface
  const mockHandlers = new Map<string, Set<EventHandler>>();

  websocketClient = {
    setToken: () => {},
    connect: () => {
      // Immediately emit REST mode events without any WebSocket connection attempt
      setTimeout(() => {
        const handlers = mockHandlers.get('rest-mode');
        if (handlers) handlers.forEach(h => h({}));
        const connectHandlers = mockHandlers.get('connect');
        if (connectHandlers) connectHandlers.forEach(h => h({}));
      }, 0);
    },
    disconnect: () => {},
    subscribe: () => {},
    send: () => {},
    on: (event: string, handler: EventHandler) => {
      if (!mockHandlers.has(event)) {
        mockHandlers.set(event, new Set());
      }
      mockHandlers.get(event)!.add(handler);
    },
    off: (event: string, handler: EventHandler) => {
      const handlers = mockHandlers.get(event);
      if (handlers) handlers.delete(handler);
    },
    // TEST HOOKS for Playwright tests
    triggerCloseForTesting: () => {
      console.log('[WebSocket Mock] TEST: Triggering close event');
      const handlers = mockHandlers.get('close');
      if (handlers) handlers.forEach(h => h({ code: 1000, reason: 'Test-triggered close' }));
    },
    simulateMaxReconnectAttemptsForTesting: () => {
      console.log('[WebSocket Mock] TEST: Simulating max reconnect attempts');
      const handlers = mockHandlers.get('max-reconnect-attempts');
      if (handlers) handlers.forEach(h => h({ attempts: 10, isTest: true }));
    },
    get isConnected() { return true; },
    get connectionState() { return 'connected' as const; },
    get transportMode() { return 'rest' as const; }
  };
} else if (typeof window !== 'undefined') {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  websocketClient = new WebSocketClient(wsUrl, null);
} else {
  // Node.js/SSR environment: create a mock WebSocket client
  const mockHandlers = new Map<string, Set<EventHandler>>();

  websocketClient = {
    setToken: () => {},
    connect: () => {
      setTimeout(() => {
        const handlers = mockHandlers.get('rest-mode');
        if (handlers) handlers.forEach(h => h({}));
        const connectHandlers = mockHandlers.get('connect');
        if (connectHandlers) connectHandlers.forEach(h => h({}));
      }, 0);
    },
    disconnect: () => {},
    subscribe: () => {},
    send: () => {},
    on: (event: string, handler: EventHandler) => {
      if (!mockHandlers.has(event)) {
        mockHandlers.set(event, new Set());
      }
      mockHandlers.get(event)!.add(handler);
    },
    off: (event: string, handler: EventHandler) => {
      const handlers = mockHandlers.get(event);
      if (handlers) handlers.delete(handler);
    },
    get isConnected() { return true; },
    get connectionState() { return 'connected' as const; },
    get transportMode() { return 'rest' as const; }
  };
}

export { websocketClient };

// Expose websocketClient to window in test environments for Playwright access
if (typeof window !== 'undefined' && isTestEnvironment()) {
  (window as any).__WEBSOCKET_CLIENT__ = websocketClient;
}
