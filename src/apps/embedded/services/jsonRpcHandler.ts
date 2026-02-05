/**
 * JSON-RPC 2.0 Handler
 * Manages JSON-RPC 2.0 protocol over WebSocket
 * Handles request/response correlation, error handling, and message routing
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcErrorResponse,
  JsonRpcMessage,
  JsonRpcError,
  ChatErrorCode,
} from '../types/chat';

/**
 * Represents a pending JSON-RPC request awaiting a response
 */
interface PendingRequest {
  id: string | number;
  method: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * Handler for JSON-RPC 2.0 notifications (server→client without response)
 */
type NotificationHandler = (params: any) => void;

/**
 * JSON-RPC Handler Service
 * Provides type-safe JSON-RPC 2.0 message handling over WebSocket
 */
export class JsonRpcHandler {
  private pendingRequests: Map<string | number, PendingRequest> = new Map();
  private notificationHandlers: Map<string, Set<NotificationHandler>> = new Map();
  private requestTimeout: number = 30000; // 30 seconds
  private requestIdCounter: number = 1;
  private messageListenerAttached: boolean = false;

  constructor() {
    this.ensureMessageListenerAttached();
  }

  /**
   * Ensure message listener is attached to WebSocket client
   */
  private async ensureMessageListenerAttachedAsync(): Promise<void> {
    if (this.messageListenerAttached) return;

    try {
      const module = await import('./websocketClient');
      const { websocketClient } = module;

      websocketClient.on('message', (message: any) => {
        try {
          // Message is already parsed by websocketClient
          this.handleMessage(message as JsonRpcMessage);
        } catch (error) {
          console.error('[JsonRpcHandler] Failed to handle message:', error);
        }
      });

      this.messageListenerAttached = true;
    } catch (error) {
      console.warn('[JsonRpcHandler] Failed to attach message listener:', error);
    }
  }

  private ensureMessageListenerAttached(): void {
    if (this.messageListenerAttached) return;
    // Trigger async attachment
    this.ensureMessageListenerAttachedAsync().catch(() => {});
  }

  /**
   * Send a JSON-RPC request and wait for response
   * @param method - The RPC method name
   * @param params - Optional parameters for the method
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise that resolves with the result or rejects with error
   */
  async sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    timeout?: number
  ): Promise<T> {
    const id = this.generateRequestId();
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      id,
    };

    if (params) {
      request.params = params;
    }

    return new Promise((resolve, reject) => {
      const timeoutMs = timeout ?? this.requestTimeout;
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(
          new Error(
            `JSON-RPC request timeout for method '${method}' after ${timeoutMs}ms`
          )
        );
      }, timeoutMs);

      this.pendingRequests.set(id, {
        id,
        method,
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      this._sendRequestMessage(request, id, timeoutHandle, reject);
    });
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   * @param method - The RPC method name
   * @param params - Optional parameters for the method
   */
  sendNotification(method: string, params?: Record<string, unknown>): void {
    const notification: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      id: this.generateRequestId(),
      ...(params && { params }),
    };

    this._sendNotificationMessage(notification, method);
  }

  /**
   * Internal method to send a request message
   */
  private async _sendRequestMessage(
    request: JsonRpcRequest,
    id: string | number,
    timeoutHandle: NodeJS.Timeout,
    reject: (error: Error) => void
  ): Promise<void> {
    try {
      const module = await import('./websocketClient');
      const { websocketClient } = module;
      websocketClient.send(request as any);
    } catch (error) {
      this.pendingRequests.delete(id);
      clearTimeout(timeoutHandle);
      reject(
        new Error(
          `Failed to send JSON-RPC request: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Internal method to send a notification message
   */
  private async _sendNotificationMessage(
    notification: JsonRpcRequest,
    method: string
  ): Promise<void> {
    try {
      const module = await import('./websocketClient');
      const { websocketClient } = module;
      websocketClient.send(notification as any);
    } catch (error) {
      console.error(
        `[JsonRpcHandler] Failed to send notification for method '${method}':`,
        error
      );
    }
  }

  /**
   * Register a handler for a specific JSON-RPC notification method
   * @param method - The notification method name (e.g., 'chat.response.chunk')
   * @param handler - Function to handle the notification
   */
  onNotification(method: string, handler: NotificationHandler): () => void {
    if (!this.notificationHandlers.has(method)) {
      this.notificationHandlers.set(method, new Set());
    }

    const handlers = this.notificationHandlers.get(method)!;
    handlers.add(handler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.notificationHandlers.delete(method);
      }
    };
  }

  /**
   * Handle incoming JSON-RPC message (response or notification)
   */
  private handleMessage(message: JsonRpcMessage): void {
    // Handle response (has id and result/error, not a method)
    if ('result' in message || 'error' in message) {
      this.handleResponse(message as JsonRpcResponse | JsonRpcErrorResponse);
    }
    // Handle notification (has method but no id)
    else if ('method' in message && !('id' in message)) {
      this.handleNotification(message);
    }
  }

  /**
   * Handle JSON-RPC response (success or error)
   */
  private handleResponse(
    response: JsonRpcResponse | JsonRpcErrorResponse
  ): void {
    const { id } = response;
    const pendingRequest = this.pendingRequests.get(id);

    if (!pendingRequest) {
      console.warn(
        `[JsonRpcHandler] Received response for unknown request ID: ${id}`
      );
      return;
    }

    this.pendingRequests.delete(id);
    clearTimeout(pendingRequest.timeout);

    if ('result' in response) {
      pendingRequest.resolve(response.result);
    } else if ('error' in response) {
      const error = this.createError(response.error, pendingRequest.method);
      pendingRequest.reject(error);
    }
  }

  /**
   * Handle JSON-RPC notification (server→client)
   */
  private handleNotification(message: any): void {
    const { method, params } = message;

    if (!method) {
      console.warn('[JsonRpcHandler] Received notification without method');
      return;
    }

    const handlers = this.notificationHandlers.get(method);
    if (!handlers || handlers.size === 0) {
      // No handlers for this notification, which is fine
      return;
    }

    try {
      handlers.forEach((handler) => {
        try {
          handler(params);
        } catch (error) {
          console.error(
            `[JsonRpcHandler] Error in notification handler for '${method}':`,
            error
          );
        }
      });
    } catch (error) {
      console.error(`[JsonRpcHandler] Error handling notification '${method}':`, error);
    }
  }

  /**
   * Create an error object from JSON-RPC error response
   */
  private createError(error: JsonRpcError, method: string): Error {
    const message = `JSON-RPC Error (${error.code}): ${error.message} [method: ${method}]`;
    const err = new Error(message);
    (err as any).code = error.code;
    (err as any).rpcError = error;
    return err;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${this.requestIdCounter++}`;
  }

  /**
   * Clear all pending requests (e.g., on connection close)
   */
  clearPendingRequests(): void {
    this.pendingRequests.forEach(({ timeout }) => {
      clearTimeout(timeout);
    });

    const error = new Error('WebSocket connection closed');
    this.pendingRequests.forEach(({ reject }) => {
      reject(error);
    });

    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Validate JSON-RPC request format
   */
  static validateRequest(request: unknown): request is JsonRpcRequest {
    if (typeof request !== 'object' || request === null) {
      return false;
    }

    const req = request as any;
    return (
      req.jsonrpc === '2.0' &&
      typeof req.method === 'string' &&
      (req.id === undefined || typeof req.id === 'string' || typeof req.id === 'number')
    );
  }

  /**
   * Validate JSON-RPC response format
   */
  static validateResponse(response: unknown): response is JsonRpcResponse | JsonRpcErrorResponse {
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    const resp = response as any;
    if (resp.jsonrpc !== '2.0' || (resp.id === undefined && resp.id !== 0)) {
      return false;
    }

    return ('result' in resp && !('error' in resp)) || ('error' in resp && !('result' in resp));
  }
}

/**
 * Global singleton instance
 */
export const jsonRpcHandler = new JsonRpcHandler();
