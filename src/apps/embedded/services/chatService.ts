/**
 * Chat Service
 * High-level API for chat operations using JSON-RPC 2.0 protocol
 * Handles chat messages, status checking, and cancellation
 */

import { jsonRpcHandler } from './jsonRpcHandler';
import { useChatStore } from '../stores/chatStore';
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
  ThinkingContent,
  UsageContent,
} from '../types/chat';

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
      console.error('[ChatService] Failed to get status:', error);
      const status: SDKStatus = {
        sdkAvailable: false,
        sdkVersion: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
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
        { message } as Record<string, unknown>,
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
        {} as Record<string, unknown>,
        5000 // 5 second timeout for cancel
      );

      // Update store
      store.setStreaming(false);

      return result;
    } catch (error) {
      console.error('[ChatService] Failed to cancel:', error);
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
      console.warn('[ChatService] Received response chunk but no streaming message');
      return;
    }

    // Use store action to properly track state changes
    store.appendTextContent(currentMessage.id, params.content);
  }

  /**
   * Handle tool invocation notification
   */
  private handleToolInvoke(params: any): void {
    const store = useChatStore.getState();
    const currentMessage = store.getCurrentStreamingMessage();

    if (!currentMessage) {
      console.warn('[ChatService] Received tool invoke but no streaming message');
      return;
    }

    // Find existing tool invocation or create new one
    const existingTool = currentMessage.parts.find(
      (p) => p.type === 'tool_invocation' && (p as any).toolName === params.tool_name
    ) as ToolInvocationContent | undefined;

    if (existingTool) {
      // Update existing tool
      store.updateToolInvocation(currentMessage.id, params.tool_name, {
        status: params.status,
        result: params.result || existingTool.result,
        error: params.error || existingTool.error,
      });
    } else {
      // Add new tool invocation
      store.appendPart(currentMessage.id, {
        type: 'tool_invocation',
        toolName: params.tool_name,
        toolInput: params.tool_input,
        status: params.status,
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
      console.warn('[ChatService] Received thinking but no streaming message');
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
      console.warn('[ChatService] Received usage but no streaming message');
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
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
