/**
 * Chat Service
 * High-level API for chat operations using JSON-RPC 2.0 protocol
 * Handles chat messages, status checking, and cancellation
 */

import { jsonRpcHandler } from './jsonRpcHandler';
import { useChatStore } from '../stores/chatStore';
import { logError, logWarning } from './errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';
import { withChatContext } from '../data/chatContext';
import {
  ChatSendParams,
  ChatSendResult,
  ChatCancelParams,
  ChatCancelResult,
  SDKStatus,
  ChatMessage,
  TextContent,
  ToolInvocationContent,
  ToolInvocationStatus,
  ThinkingContent,
  UsageContent,
  ChatToolInvokeParams,
} from '../types/chat';

/**
 * Convert wire format tool status to discriminated union
 */
function convertToolStatus(wireStatus: string, result?: unknown, error?: string): ToolInvocationStatus {
  switch (wireStatus) {
    case 'executing':
      return { state: 'executing' };
    case 'completed':
      return { state: 'completed', result };
    case 'failed':
      return { state: 'failed', error: error || 'Unknown error' };
    default:
      console.warn(`[ChatService] Unknown tool status: "${wireStatus}", treating as executing`);
      return { state: 'executing' };
  }
}

/**
 * Chat Service
 * Provides a high-level API for chat operations
 */
/** How long chat.send may take before the client gives up. DrBot answers by
 *  running Claude Code with tools against the model, which routinely takes
 *  minutes; the old 60s cap fired mid-answer, showed a timeout error, and
 *  split the rest of the reply into a second message. */
export const CHAT_SEND_TIMEOUT_MS = 15 * 60 * 1000;

export class ChatService {
  private currentConversationId: string | null = null;
  private currentRequestId: string | null = null;
  /** Tools reported without a status. The server sends one notification per
   *  call and never reports completion, so these are marked completed when
   *  the reply moves on (next tool or text) or ends. */
  private statuslessToolIds = new Set<string>();
  private toolIdCounter = 0;

  constructor() {
    this.setupNotificationHandlers();
  }

  /**
   * Setup handlers for server notifications (called in constructor)
   *
   * Side Effects:
   * - Registers 5 notification handlers with `jsonRpcHandler` via `onNotification()`:
   *   1. 'chat.response.chunk' → calls `handleResponseChunk()`
   *   2. 'chat.tool.invoke' → calls `handleToolInvoke()`
   *   3. 'chat.thinking' → calls `handleThinking()`
   *   4. 'chat.usage' → calls `handleUsage()`
   *   5. 'chat.error' → calls `handleError()`
   *
   * These handlers are called asynchronously by the JSON-RPC handler when the server
   * sends notifications during message streaming. Each handler updates the chat store
   * to track the streaming response in real-time.
   *
   * Important: These are notification handlers (fire-and-forget), not request/response pairs.
   * They are triggered independently of the main `sendMessage()` promise resolution.
   */
  private setupNotificationHandlers(): void {
    // Handle text response chunks
    jsonRpcHandler.onNotification('chat.response.chunk', (params: any) => {
      this.handleResponseChunk(params);
    });

    // Handle tool invocations
    jsonRpcHandler.onNotification('chat.tool.invoke', (params: any) => {
      this.handleToolInvoke(params);
    });

    // Handle thinking content
    jsonRpcHandler.onNotification('chat.thinking', (params: any) => {
      this.handleThinking(params);
    });

    // Handle usage information
    jsonRpcHandler.onNotification('chat.usage', (params: any) => {
      this.handleUsage(params);
    });

    // Handle errors
    jsonRpcHandler.onNotification('chat.error', (params: any) => {
      this.handleError(params);
    });
  }

  /**
   * Get current SDK status (available, version, errors)
   *
   * Side Effects:
   * - Updates `chatStore.sdkStatus` via `setSdkStatus()` with the status information
   * - On error: Still updates store with error information before throwing
   * - Logs errors via `logError()` with ERROR_ID `CHAT_GET_STATUS_FAILED`
   *
   * Returns:
   * - SDKStatus object with sdkAvailable, sdkVersion, and errorMessage
   *
   * Throws:
   * - Re-throws the error after logging and updating store state
   *
   * Timeout: 60 seconds
   */
  async getStatus(): Promise<SDKStatus> {
    try {
      const result = await jsonRpcHandler.sendRequest<any>(
        'chat.status',
        {}
      );

      // Convert snake_case from DR CLI server API to camelCase for TypeScript
      const status: SDKStatus = {
        sdkAvailable: result.sdkAvailable ?? result.sdk_available ?? false,
        sdkVersion: result.sdkVersion ?? result.sdk_version ?? null,
        errorMessage: result.errorMessage ?? result.error_message ?? null,
      };

      // Update store
      const store = useChatStore.getState();
      store.setSdkStatus(status);

      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(
        ERROR_IDS.CHAT_GET_STATUS_FAILED,
        'Failed to get status',
        { error: errorMessage }
      );
      const status: SDKStatus = {
        sdkAvailable: false,
        sdkVersion: null,
        errorMessage: errorMessage,
      };
      useChatStore.getState().setSdkStatus(status);
      throw error;
    }
  }

  /**
   * Send a chat message and stream the assistant response
   *
   * Side Effects (in order):
   * 1. Generates new message and conversation IDs if needed
   * 2. Updates `this.currentConversationId` instance variable
   * 3. Calls `chatStore.setActiveConversationId()` to update active conversation
   * 4. Calls `chatStore.addMessage()` to add user message
   * 5. Calls `chatStore.addMessage()` to add empty assistant message with `isStreaming: true`
   * 6. Calls `chatStore.setStreaming(true)` to mark streaming state as active
   * 7. Calls `chatStore.setError(null)` to clear any previous errors
   * 8. Updates `this.currentRequestId` with new request ID
   * 9. Sends JSON-RPC request to server (triggers notification handlers: chunk, tool, thinking, usage, error)
   * 10. On success: Calls `chatStore.updateMessage()` to mark assistant message as not streaming
   * 11. On success: Calls `chatStore.setStreaming(false)` to clear streaming state
   * 12. On error: Calls `chatStore.setStreaming(false)`
   * 13. On error: Calls `chatStore.setError()` with error message
   * 14. On error: Calls `chatStore.appendPart()` to add error part to assistant message
   * 15. On error: Logs error via `logError()` with ERROR_ID `CHAT_SEND_FAILED`
   *
   * Important: While this method is awaiting the JSON-RPC response, server notifications
   * are handled asynchronously by notification handlers, which update the assistant message's
   * parts array (text chunks, tool invocations, thinking, usage) in real-time.
   *
   * Parameters:
   * - message: User message text (must not be empty)
   *
   * Returns:
   * - ChatSendResult with conversationId, status, totalCostUsd, timestamp
   *
   * Throws:
   * - Error from JSON-RPC request (after updating store state and logging)
   *
   * Timeout: CHAT_SEND_TIMEOUT_MS (15 minutes); a closed socket fails it at once.
   */
  async sendMessage(message: string, context?: string | null): Promise<ChatSendResult> {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const store = useChatStore.getState();

    // Create user message
    const userMessageId = this.generateMessageId();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      conversationId: this.currentConversationId || this.generateConversationId(),
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'text',
          content: message,
          timestamp: new Date().toISOString(),
        } as TextContent,
      ],
    };

    // Update conversation ID
    this.currentConversationId = userMessage.conversationId;
    store.setActiveConversationId(this.currentConversationId);

    // Add user message to store
    store.addMessage(userMessage);

    // Create assistant message for streaming response
    const assistantMessageId = this.generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      conversationId: userMessage.conversationId,
      timestamp: new Date().toISOString(),
      parts: [],
      isStreaming: true,
    };

    // Add assistant message to store
    store.addMessage(assistantMessage);

    // Set streaming state
    store.setStreaming(true);
    store.setError(null);

    // Send message via JSON-RPC
    try {
      // Generate request ID for this send operation
      this.currentRequestId = this.generateRequestId();

      const result = await jsonRpcHandler.sendRequest<ChatSendResult>(
        'chat.send',
        // The thread shows `message`; DrBot also gets what the user has open
        // (see data/chatContext.ts — the server only accepts `message`).
        { message: withChatContext(message, context ?? null) } as ChatSendParams,
        CHAT_SEND_TIMEOUT_MS
      );

      this.completeStatuslessTools();
      // Update assistant message - remove streaming flag
      store.updateMessage(assistantMessageId, { isStreaming: false });

      // Update store state
      store.setStreaming(false);

      return result;
    } catch (error) {
      this.completeStatuslessTools();
      // Update store with error
      store.setStreaming(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      store.setError(errorMessage);

      logError(
        ERROR_IDS.CHAT_SEND_FAILED,
        'Failed to send message',
        { error: errorMessage, message }
      );

      // Add error to assistant message
      store.appendPart(assistantMessageId, {
        type: 'error',
        code: 'SEND_FAILED',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Cancel an ongoing message streaming operation
   *
   * Side Effects:
   * - Sends JSON-RPC request to server to cancel the operation
   * - On success: Calls `chatStore.setStreaming(false)` to clear streaming state
   * - On error: Calls `chatStore.setStreaming(false)` anyway (ensures consistent state)
   * - On error: Logs error via `logError()` with ERROR_ID `CHAT_CANCEL_FAILED`
   * - On error: Still clears streaming state even if cancel request fails
   *
   * Returns:
   * - ChatCancelResult with cancelled boolean and conversationId
   *
   * Throws:
   * - Error from JSON-RPC request (after updating store state and logging)
   *
   * Note: Store state is cleared even on error to prevent UI from being stuck in streaming state
   *
   * Timeout: 5 seconds (short timeout for cancellation requests)
   */
  async cancelMessage(): Promise<ChatCancelResult> {
    const store = useChatStore.getState();

    try {
      const result = await jsonRpcHandler.sendRequest<ChatCancelResult>(
        'chat.cancel',
        {} as ChatCancelParams,
        5000 // 5 second timeout for cancel
      );

      // Update store
      store.setStreaming(false);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError(
        ERROR_IDS.CHAT_CANCEL_FAILED,
        'Failed to cancel',
        { error: errorMessage }
      );
      store.setStreaming(false);
      throw error;
    }
  }

  /**
   * Handle text response chunk notification (called by JSON-RPC handler)
   *
   * Side Effects:
   * - Gets the currently streaming message from store via `getCurrentStreamingMessage()`
   * - If no streaming message exists: Logs warning via `logWarning()`
   * - If streaming message exists: Calls `chatStore.appendTextContent()` to append chunk
   *
   * Design Note: Uses smart text appending that consolidates consecutive text chunks
   * into a single text part for performance, rather than creating multiple parts.
   * This is an optimization for streaming - if the last part is text, appends to it;
   * otherwise creates new text part.
   *
   * Parameters:
   * - params.content: Text chunk from server
   */
  private handleResponseChunk(params: any): void {
    const store = useChatStore.getState();
    const currentMessage = store.getCurrentStreamingMessage();

    if (!currentMessage) {
      logWarning('Received response chunk but no streaming message');
      return;
    }

    // Text after a tool call means that tool has finished.
    this.completeStatuslessTools();
    // Use store action to properly track state changes
    store.appendTextContent(currentMessage.id, params.content);
  }

  /** Marks every tool that arrived without a status as completed. */
  private completeStatuslessTools(): void {
    if (this.statuslessToolIds.size === 0) return;
    const store = useChatStore.getState();
    for (const id of this.statuslessToolIds) {
      try {
        store.updateToolInvocation(id, { status: { state: 'completed', result: undefined } });
      } catch {
        // The message was cleared (new conversation) — nothing to update.
      }
    }
    this.statuslessToolIds.clear();
  }

  /**
   * Handle tool invocation notification (called by JSON-RPC handler)
   *
   * Critical Design: Matches by `toolUseId` (unique identifier from Anthropic API),
   * NOT by `toolName`. This allows the same tool to be called multiple times with
   * separate tracking of each invocation's status independently.
   *
   * Side Effects:
   * 1. Gets the currently streaming message from store via `getCurrentStreamingMessage()`
   * 2. If no streaming message exists: Logs warning via `logWarning()`
   * 3. Converts wire format status to discriminated union via `convertToolStatus()`
   * 4. Searches message parts for existing tool by `toolUseId`
   * 5. If tool exists: Calls `chatStore.updateToolInvocation()` to update status only
   * 6. If tool is new: Calls `chatStore.appendPart()` to add new ToolInvocationContent
   *
   * Tool Status Tracking:
   * - Wire format (executing/completed/failed) → Discriminated union:
   *   - { state: 'executing' } - tool is running
   *   - { state: 'completed', result } - tool finished successfully
   *   - { state: 'failed', error } - tool failed with error
   *
   * Parameters:
   * - params.tool_use_id: Unique identifier for this tool invocation (from Anthropic)
   * - params.toolName: Name of the tool being invoked
   * - params.toolInput: Input parameters passed to the tool
   * - params.status: Current status (executing/completed/failed)
   * - params.result: (optional) Result if completed
   * - params.error: (optional) Error message if failed
   * - params.timestamp: (optional) Timestamp of invocation
   */
  private handleToolInvoke(params: ChatToolInvokeParams): void {
    const store = useChatStore.getState();
    const currentMessage = store.getCurrentStreamingMessage();

    if (!currentMessage) {
      logWarning('Received tool invoke but no streaming message');
      return;
    }

    const toolName = params.toolName ?? params.tool_name ?? 'tool';
    const toolInput = params.toolInput ?? params.tool_input ?? {};

    // No tool_use_id: the server sends each call once, so every notification
    // is a new call. Give it a local id so the store can track it.
    if (!params.tool_use_id) {
      // A new call means the previous one has finished.
      this.completeStatuslessTools();
      const toolUseId = `local-tool-${++this.toolIdCounter}`;
      store.appendPart(currentMessage.id, {
        type: 'tool_invocation',
        toolUseId,
        toolName,
        toolInput,
        status: params.status
          ? convertToolStatus(params.status, params.result, params.error)
          : { state: 'executing' },
        timestamp: params.timestamp || new Date().toISOString(),
      } as ToolInvocationContent);
      if (!params.status || params.status === 'executing') this.statuslessToolIds.add(toolUseId);
      return;
    }

    // Convert wire format to discriminated union
    const toolStatus = convertToolStatus(params.status ?? 'executing', params.result, params.error);

    // Match by unique tool_use_id instead of tool_name
    const existingTool = currentMessage.parts.find(
      (p) => p.type === 'tool_invocation' && (p as any).toolUseId === params.tool_use_id
    ) as ToolInvocationContent | undefined;

    // No status at all: nothing will ever report this tool finishing, so treat
    // it like an id-less one and mark it completed when the reply moves on or
    // ends. A tool reported as 'executing' is left for its own completion.
    if (params.status === undefined) {
      this.statuslessToolIds.add(params.tool_use_id);
    } else {
      this.statuslessToolIds.delete(params.tool_use_id);
    }

    if (existingTool) {
      // Update existing tool invocation
      store.updateToolInvocation(params.tool_use_id, {
        status: toolStatus,
      });
    } else {
      // Add new tool invocation
      store.appendPart(currentMessage.id, {
        type: 'tool_invocation',
        toolUseId: params.tool_use_id,
        toolName,
        toolInput,
        status: toolStatus,
        timestamp: params.timestamp || new Date().toISOString(),
      } as ToolInvocationContent);
    }
  }

  /**
   * Handle thinking content notification (called by JSON-RPC handler)
   *
   * Side Effects:
   * - Gets the currently streaming message from store via `getCurrentStreamingMessage()`
   * - If no streaming message exists: Logs warning via `logWarning()`
   * - If streaming message exists: Calls `chatStore.appendPart()` to add ThinkingContent
   *
   * Parameters:
   * - params.content: Thinking text from extended thinking feature
   * - params.timestamp: (optional) Timestamp of thinking content
   */
  private handleThinking(params: any): void {
    const store = useChatStore.getState();
    const currentMessage = store.getCurrentStreamingMessage();

    if (!currentMessage) {
      logWarning('Received thinking but no streaming message');
      return;
    }

    store.appendPart(currentMessage.id, {
      type: 'thinking',
      content: params.content,
      timestamp: params.timestamp || new Date().toISOString(),
    } as ThinkingContent);
  }

  /**
   * Handle usage notification (called by JSON-RPC handler)
   *
   * Side Effects:
   * - Gets the currently streaming message from store via `getCurrentStreamingMessage()`
   * - If no streaming message exists: Logs warning via `logWarning()`
   * - If streaming message exists: Calls `chatStore.appendPart()` to add UsageContent
   *
   * Note: Usage information is typically sent once at the end of streaming response
   * and includes token counts and cost information.
   *
   * Parameters:
   * - params.input_tokens: Number of input tokens consumed
   * - params.output_tokens: Number of output tokens generated
   * - params.total_tokens: Total tokens (input + output)
   * - params.total_cost_usd: Total cost in USD
   * - params.timestamp: (optional) Timestamp of usage information
   */
  private handleUsage(params: any): void {
    const store = useChatStore.getState();
    const currentMessage = store.getCurrentStreamingMessage();

    if (!currentMessage) {
      logWarning('Received usage but no streaming message');
      return;
    }

    store.appendPart(currentMessage.id, {
      type: 'usage',
      inputTokens: params.input_tokens,
      outputTokens: params.output_tokens,
      totalTokens: params.total_tokens,
      totalCostUsd: params.total_cost_usd,
      timestamp: params.timestamp || new Date().toISOString(),
    } as UsageContent);
  }

  /**
   * Handle error notification (called by JSON-RPC handler)
   *
   * Side Effects:
   * 1. Calls `chatStore.setError()` with error message to update global error state
   * 2. Calls `chatStore.setStreaming(false)` to stop streaming state
   * 3. Gets the currently streaming message from store via `getCurrentStreamingMessage()`
   * 4. If streaming message exists: Calls `chatStore.appendPart()` to add ErrorContent
   *
   * Note: This handler ensures that stream is stopped immediately when server error
   * occurs, and the error is both stored globally and in the message history for UI.
   *
   * Parameters:
   * - params.message: Error message from server
   * - params.code: (optional) Error code from server
   * - params.timestamp: (optional) Timestamp of error
   */
  private handleError(params: any): void {
    const store = useChatStore.getState();
    const errorMessage = params.message || 'Unknown error';

    store.setError(errorMessage);
    store.setStreaming(false);

    const currentMessage = store.getCurrentStreamingMessage();
    if (currentMessage) {
      store.appendPart(currentMessage.id, {
        type: 'error',
        code: params.code || 'UNKNOWN_ERROR',
        message: errorMessage,
        timestamp: params.timestamp || new Date().toISOString(),
      });
    }
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get current conversation ID
   */
  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }

  /**
   * Get current request ID
   */
  getCurrentRequestId(): string | null {
    return this.currentRequestId;
  }

  /**
   * Reset chat service state to initial conditions
   *
   * Side Effects:
   * 1. Sets `this.currentConversationId` to null
   * 2. Sets `this.currentRequestId` to null
   * 3. Calls `chatStore.reset()` which clears:
   *    - All messages array
   *    - activeConversationId
   *    - isStreaming flag
   *    - error message
   *    - sdkStatus
   *
   * Note: This completely clears the chat state. Any ongoing streaming is interrupted.
   * Use this when ending a chat session or starting a new independent conversation.
   */
  reset(): void {
    this.currentConversationId = null;
    this.currentRequestId = null;
    const store = useChatStore.getState();
    store.reset();
  }
}

/**
 * Global singleton instance
 */
export const chatService = new ChatService();
