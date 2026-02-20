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
  'connect': Record<string, unknown>;
  'disconnect': Record<string, unknown>;
  'message': WebSocketMessage;
  'error': { error: Event };
  'close': { code: number; reason: string };
  'reconnecting': { attempt: number; delay: number };
  'rest-mode': Record<string, unknown>;
  'max-reconnect-attempts': { attempts: number };
}

/**
 * Generic event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void;
