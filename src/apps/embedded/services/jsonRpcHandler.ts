/**
 * JSON-RPC 2.0 Handler
 * Manages JSON-RPC 2.0 protocol over WebSocket
 * Handles request/response correlation, error handling, and message routing
 */

import {
  JsonRpcRequest,
  JsonRpcNotification,
  JsonRpcResponse,
  JsonRpcErrorResponse,
  JsonRpcMessage,
  JsonRpcError,
} from '../types/chat';
import { logError, logWarning } from './errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';
import type { WebSocketClientInterface } from './websocketClient';

/**
 * Represents a pending JSON-RPC request awaiting a response
 */
interface PendingRequest {
  id: string | number;
  method: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

/**
 * Handler for JSON-RPC 2.0 notifications (server→client without response)
 */
type NotificationHandler = (params: Record<string, unknown>) => void;

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
  private messageListenerAttachmentInProgress: boolean = false;
  private cachedWebSocketClient: WebSocketClientInterface | null = null;

  constructor() {
    this.ensureMessageListenerAttached();
  }

  /**
   * Get cached or load WebSocket client
   */
  private async getWebSocketClient(): Promise<WebSocketClientInterface> {
    if (this.cachedWebSocketClient) {
      return this.cachedWebSocketClient;
    }

    try {
      const module = await import('./websocketClient');
      this.cachedWebSocketClient = module.websocketClient as WebSocketClientInterface;
      return this.cachedWebSocketClient;
    } catch (error) {
      const errorMessage = 'Failed to load WebSocket client - JSON-RPC communication will not be available';
      logError(
        ERROR_IDS.JSONRPC_WEBSOCKET_LOAD_FAILED,
        errorMessage,
        {},
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Ensure message listener is attached to WebSocket client
   *
   * NOTE: This uses a two-flag synchronization pattern to prevent race conditions:
   * 1. messageListenerAttachmentInProgress prevents duplicate attachment attempts
   * 2. messageListenerAttached tracks successful attachment completion
   * This prevents multiple concurrent attachment attempts when sendRequest() is called rapidly.
   */
  private async ensureMessageListenerAttachedAsync(): Promise<void> {
    // Already attached
    if (this.messageListenerAttached) return;

    // Prevent duplicate attachment attempts if already in progress
    if (this.messageListenerAttachmentInProgress) return;

    // Mark attachment as in progress to prevent concurrent attempts
    this.messageListenerAttachmentInProgress = true;

    try {
      const websocketClient = await this.getWebSocketClient();

      websocketClient.on('message', (message: Record<string, unknown>) => {
        try {
          // Message is already parsed by websocketClient
          // Type guard: validate message structure before casting
          if (!this.isValidJsonRpcMessage(message)) {
            logError(
              ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
              'Invalid JSON-RPC message structure - missing required fields',
              { message: String(message) }
            );
            return;
          }
          this.handleMessage(message);
        } catch (error) {
          // Distinguish between message handling errors and programming bugs
          // Message validation/handling errors (expected failures)
          if (
            error instanceof TypeError &&
            (error.message.includes('Cannot read property') ||
             error.message.includes('Cannot access property'))
          ) {
            // Invalid message structure - expected in some cases
            logError(
              ERROR_IDS.JSONRPC_MESSAGE_PARSE_FAILED,
              'Invalid JSON-RPC message structure',
              { error: error instanceof Error ? error.message : String(error), message: String(message) },
              error instanceof Error ? error : new Error(String(error))
            );
          } else {
            // Programming error or unexpected exception - log as bug
            logError(
              ERROR_IDS.JSONRPC_MESSAGE_HANDLER_ERROR,
              'Unexpected error while handling JSON-RPC message - possible programming bug',
              {
                error: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                message: String(message),
                stack: error instanceof Error ? error.stack : undefined
              },
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }
      });

      this.messageListenerAttached = true;
    } catch (error) {
      // Use structured error logging instead of console.warn
      // This error is critical because it prevents any JSON-RPC responses from being received
      logError(
        ERROR_IDS.JSONRPC_ATTACH_LISTENER_FAILED,
        'Failed to attach message listener to WebSocket - JSON-RPC responses will not be received',
        { error: error instanceof Error ? error.message : String(error) },
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.messageListenerAttachmentInProgress = false;
    }
  }

  private ensureMessageListenerAttached(): void {
    // Fast path: if already attached, return immediately
    if (this.messageListenerAttached) return;

    // If attachment is already in progress from another call, skip to avoid duplicate attempts
    if (this.messageListenerAttachmentInProgress) return;

    // Trigger async attachment and log any failures
    this.ensureMessageListenerAttachedAsync().catch((error) => {
      logError(
        ERROR_IDS.JSONRPC_ATTACH_LISTENER_BACKGROUND_FAILED,
        'Failed to attach message listener in background',
        { error: error instanceof Error ? error.message : String(error) }
      );
    });
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
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
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
      const websocketClient = await this.getWebSocketClient();
      const sendSuccess = websocketClient.send(request);

      if (!sendSuccess) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutHandle);
        const errorMessage = `Failed to send JSON-RPC request: WebSocket not connected`;
        logError(
          ERROR_IDS.JSONRPC_SEND_REQUEST_FAILED,
          errorMessage,
          { method: request.method }
        );
        reject(new Error(errorMessage));
      }
    } catch (error) {
      this.pendingRequests.delete(id);
      clearTimeout(timeoutHandle);
      const errorMessage = `Failed to send JSON-RPC request: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logError(
        ERROR_IDS.JSONRPC_SEND_REQUEST_FAILED,
        errorMessage,
        { error: error instanceof Error ? error.message : String(error), method: request.method }
      );
      reject(new Error(errorMessage));
    }
  }

  /**
   * Internal method to send a notification message
   */
  private async _sendNotificationMessage(
    notification: JsonRpcNotification,
    method: string
  ): Promise<void> {
    try {
      const websocketClient = await this.getWebSocketClient();
      const sendSuccess = websocketClient.send(notification);

      if (!sendSuccess) {
        logError(
          ERROR_IDS.JSONRPC_SEND_NOTIFICATION_FAILED,
          `Failed to send notification for method '${method}': WebSocket not connected`,
          { method }
        );
      }
    } catch (error) {
      logError(
        ERROR_IDS.JSONRPC_SEND_NOTIFICATION_FAILED,
        `Failed to send notification for method '${method}'`,
        { error: error instanceof Error ? error.message : String(error), method }
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
      const errorMessage = `Received JSON-RPC response for unknown request ID: ${id}. This may indicate a timing issue or protocol error.`;
      logError(
        ERROR_IDS.JSONRPC_UNKNOWN_RESPONSE_ID,
        errorMessage,
        { responseId: id },
        new Error(errorMessage)
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
  private handleNotification(message: JsonRpcNotification): void {
    const { method, params } = message;

    if (!method) {
      logWarning('Received notification without method');
      return;
    }

    const handlers = this.notificationHandlers.get(method);
    if (!handlers || handlers.size === 0) {
      // No handlers for this notification, which is fine
      return;
    }

    // Execute handlers - catch both sync and async errors
    handlers.forEach((handler) => {
      try {
        const result = handler(params ?? {}) as unknown;

        // If handler returns a promise, catch async errors
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).catch((error: Error) => {
            logError(
              ERROR_IDS.JSONRPC_NOTIFICATION_HANDLER_ERROR,
              `Error in notification handler for '${method}'`,
              { error: error instanceof Error ? error.message : String(error), method }
            );
          });
        }
      } catch (error) {
        // Catch synchronous errors
        logError(
          ERROR_IDS.JSONRPC_NOTIFICATION_HANDLER_ERROR,
          `Error in notification handler for '${method}'`,
          { error: error instanceof Error ? error.message : String(error), method }
        );
      }
    });
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

    const req = request as Record<string, unknown>;
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

    const resp = response as Record<string, unknown>;
    if (resp.jsonrpc !== '2.0' || (resp.id === undefined && resp.id !== 0)) {
      return false;
    }

    return ('result' in resp && !('error' in resp)) || ('error' in resp && !('result' in resp));
  }

  /**
   * Validate if a message is a valid JSON-RPC message structure
   */
  private isValidJsonRpcMessage(message: unknown): message is JsonRpcMessage {
    if (typeof message !== 'object' || message === null) {
      return false;
    }

    const msg = message as Record<string, unknown>;
    if (msg.jsonrpc !== '2.0') {
      return false;
    }

    // Must be either a response (with id and result/error) or notification (with method, no id)
    const hasId = 'id' in msg;
    const hasMethod = 'method' in msg;
    const hasResult = 'result' in msg;
    const hasError = 'error' in msg;

    // Response: has id and either result or error (but not both)
    if (hasId && (hasResult || hasError)) {
      return (hasResult && !hasError) || (!hasResult && hasError);
    }

    // Notification: has method but no id
    if (hasMethod && !hasId) {
      return true;
    }

    // Request: has method and id (not handled by this handler, but valid)
    if (hasMethod && hasId) {
      return true;
    }

    return false;
  }
}

/**
 * Global singleton instance
 */
export const jsonRpcHandler = new JsonRpcHandler();
