/**
 * WebSocket Client Service
 * Manages WebSocket connection to the Python CLI server
 * Features: auto-reconnect, exponential backoff, event handling, token authentication
 */

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
   * Get WebSocket URL with authentication token
   */
  private getAuthenticatedUrl(): string {
    if (!this.token) {
      return this.url;
    }

    // Add token as query parameter
    const separator = this.url.includes('?') ? '&' : '?';
    return `${this.url}${separator}token=${this.token}`;
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
      const authenticatedUrl = this.getAuthenticatedUrl();
      this.ws = new WebSocket(authenticatedUrl);

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
      // Suppress errors during detection phase
      if (this.mode === 'detecting') {
        this.handleConnectionFailure();
      } else {
        console.error('[WebSocket] Connection error:', error);
        this.scheduleReconnect();
      }
    }
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
      // Switch to REST mode
      console.log('[WebSocket] Server does not support WebSocket, using REST mode');
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
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    // Suppress errors during detection phase
    if (this.mode === 'detecting') {
      // Silent error during detection
      return;
    }

    console.error('[WebSocket] Error:', event);
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
      console.error('[WebSocket] Max reconnection attempts reached');
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
          console.error(`[WebSocket] Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}

// Create singleton instance
// Token will be set after initialization via setToken()
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
export const websocketClient = new WebSocketClient(wsUrl, null);
