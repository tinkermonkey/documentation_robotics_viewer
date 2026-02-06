/**
 * Chat Service
 * High-level API for chat operations using JSON-RPC 2.0 protocol
 * Handles chat messages, status checking, and cancellation
 */

import { jsonRpcHandler } from './jsonRpcHandler';
import { useChatStore } from '../stores/chatStore';
import { logError, logWarning } from './errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';
import {
  ChatStatusResult,
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
      return { state: 'executing' };
  }
}

/**
 * Chat Service
 * Provides a high-level API for chat operations
 */
export class ChatService {
  private currentConversationId: string | null = null;
  private currentRequestId: string | null = null;

  constructor() {
    this.setupNotificationHandlers();
  }

  /**
   * Setup handlers for server notifications
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
   */
  async getStatus(): Promise<SDKStatus> {
    try {
      const result = await jsonRpcHandler.sendRequest<ChatStatusResult>(
        'chat.status',
        {}
      );

      // Update store
      const store = useChatStore.getState();
      store.setSdkStatus({
        sdkAvailable: result.sdkAvailable,
        sdkVersion: result.sdkVersion,
        errorMessage: result.errorMessage,
      });

      return {
        sdkAvailable: result.sdkAvailable,
        sdkVersion: result.sdkVersion,
        errorMessage: result.errorMessage,
      };
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
   * Send a chat message
   * @param message - The user message to send
   * @returns Promise that resolves when streaming is complete
   */
  async sendMessage(message: string): Promise<ChatSendResult> {
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
        { message } as ChatSendParams,
        60000 // 60 second timeout for streaming
      );

      // Update assistant message - remove streaming flag
      store.updateMessage(assistantMessageId, { isStreaming: false });

      // Update store state
      store.setStreaming(false);

      return result;
    } catch (error) {
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
   * Cancel an ongoing chat operation
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
   * Handle text response chunk notification
   */
  private handleResponseChunk(params: any): void {
    const store = useChatStore.getState();
    const currentMessage = store.getCurrentStreamingMessage();

    if (!currentMessage) {
      logWarning('Received response chunk but no streaming message');
      return;
    }

    // Use store action to properly track state changes
    store.appendTextContent(currentMessage.id, params.content);
  }

  /**
   * Handle tool invocation notification
   *
   * Matches tool invocations by unique tool_use_id (from Anthropic API)
   * instead of tool_name. This allows multiple invocations of the same tool
   * to be tracked independently.
   */
  private handleToolInvoke(params: ChatToolInvokeParams): void {
    const store = useChatStore.getState();
    const currentMessage = store.getCurrentStreamingMessage();

    if (!currentMessage) {
      logWarning('Received tool invoke but no streaming message');
      return;
    }

    // Convert wire format to discriminated union
    const toolStatus = convertToolStatus(params.status, params.result, params.error);

    // Match by unique tool_use_id instead of tool_name
    const existingTool = currentMessage.parts.find(
      (p) => p.type === 'tool_invocation' && (p as any).toolUseId === params.tool_use_id
    ) as ToolInvocationContent | undefined;

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
        toolName: params.toolName,
        toolInput: params.toolInput,
        status: toolStatus,
        timestamp: params.timestamp || new Date().toISOString(),
      } as ToolInvocationContent);
    }
  }

  /**
   * Handle thinking content notification
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
   * Handle usage notification
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
   * Handle error notification
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
   * Reset chat service state
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
