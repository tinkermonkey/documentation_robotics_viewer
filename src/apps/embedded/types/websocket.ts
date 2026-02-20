/**
 * WebSocket Client Types
 * Shared type definitions for WebSocket communication with DR CLI server
 */

/**
 * Base WebSocket message format with required type discriminator
 * All WebSocket protocol messages must specify a type field to ensure
 * valid protocol message construction. Specific message types override
 * this to provide more restrictive type definitions.
 */
export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

/**
 * Specific message types for common protocol messages
 */
export interface PingMessage extends WebSocketMessage {
  type: 'ping';
}

export interface PongMessage extends WebSocketMessage {
  type: 'pong';
}

export interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  topic: string;
}

export interface UnsubscribeMessage extends WebSocketMessage {
  type: 'unsubscribe';
  topic: string;
}

/**
 * Messages that can be sent over WebSocket
 * Includes both WebSocket protocol messages (with type) and JSON-RPC messages
 * Note: JSON-RPC messages must come before WebSocketMessage in union to prevent catch-all matching
 */
export type WebSocketSendMessage =
  | { method: string; params?: unknown; jsonrpc?: string; id?: string | number }  // JsonRpcRequest
  | { method: string; params?: unknown; jsonrpc?: string }  // JsonRpcNotification
  | WebSocketMessage;  // Fallback for protocol messages with optional type field

/**
 * Typed event payloads for WebSocket events
 * Uses mapped event interface pattern with string literal keys mapping to payload types for full type safety.
 * All event names must be explicitly defined here to prevent typos and enable compile-time validation.
 */
export interface WebSocketEventMap {
  /** Emitted when WebSocket connection is successfully established */
  'connect': {};
  /** Emitted when WebSocket connection is closed normally or abnormally */
  'disconnect': {};
  /** Emitted when a message is received from the server */
  'message': WebSocketMessage;
  /** Emitted when a WebSocket error occurs (connection refused, protocol error, etc.). Browser: Event object. SSR mock: code/message. */
  'error': { kind: 'event'; error: Event } | { kind: 'code'; code: string; message: string };
  /** Emitted when WebSocket connection closes with status code and reason */
  'close': { code: number; reason: string };
  /** Emitted when client attempts to reconnect after connection loss */
  'reconnecting': { attempt: number; delay: number };
  /**
   * Emitted when WebSocket connection fails and client falls back to REST API mode
   * This indicates the client will use HTTP REST endpoints instead of WebSocket
   * for all future communication with the server
   */
  'rest-mode': {};
  /** Emitted when maximum reconnection attempts have been reached */
  'max-reconnect-attempts': { attempts: number };
}

/**
 * Generic event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void;
