/**
 * Mock WebSocket Client for Ladle Stories
 * Provides a no-op implementation that prevents connection errors
 */

type EventHandler = (data: any) => void;

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class MockWebSocketClient {
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private mode: 'rest' = 'rest';

  constructor() {
    // Mock is always in REST mode
  }

  setToken(_token: string | null): void {
    // No-op
  }

  connect(): void {
    // Immediately emit REST mode and connected events
    setTimeout(() => {
      this.emit('rest-mode', {});
      this.emit('connect', {});
      this.emit('connected', { mode: 'rest' });
    }, 0);
  }

  disconnect(): void {
    // No-op
  }

  subscribe(_topics: string[]): void {
    // No-op
  }

  send(_message: WebSocketMessage): void {
    // No-op
  }

  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  get isConnected(): boolean {
    return true; // Always "connected" in REST mode
  }

  get connectionState(): 'connected' {
    return 'connected';
  }

  get transportMode(): 'rest' {
    return this.mode;
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[MockWebSocket] Error in event handler for ${event}:`, error);
        }
      });
    }
  }
}

// Create mock singleton instance
export const mockWebsocketClient = new MockWebSocketClient();
