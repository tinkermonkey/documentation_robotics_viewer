/**
 * WebSocket Client Types
 * Shared type definitions for WebSocket communication with DR CLI server
 */

/**
 * Base WebSocket message format
 * Can include optional type field for protocol messages
 */
export interface WebSocketMessage {
  type?: string;
  [key: string]: unknown;
}

/**
 * Messages that can be sent over WebSocket
 * Includes both WebSocket protocol messages (with type) and JSON-RPC messages
 */
export type WebSocketSendMessage = WebSocketMessage | Record<string, unknown>;

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
  /** Emitted when a WebSocket error occurs (connection refused, protocol error, etc.) */
  'error': { error: Event };
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
