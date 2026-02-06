/**
 * Chat Store
 * Manages chat state using Zustand for message history, streaming, and SDK status
 */

import { create } from 'zustand';
import {
  ChatMessage,
  TextContent,
  ChatContent,
  SDKStatus,
  ToolInvocationContent,
} from '../types/chat';
import {
  validateChatMessage,
  validateChatContent,
  validateConversationId,
  validateErrorMessage,
  validateMessageUpdates,
  validateToolInvocationUpdates,
  validateSDKStatus,
  validateMessageId,
  ChatValidationError,
} from '../services/chatValidation';

export interface ChatStore {
  // State
  messages: ChatMessage[];
  activeConversationId: string | null;
  isStreaming: boolean;
  sdkStatus: SDKStatus | null;
  error: string | null;

  // Basic actions
  setActiveConversationId: (conversationId: string | null) => void;
  setStreaming: (isStreaming: boolean) => void;
  setSdkStatus: (status: SDKStatus | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Message operations
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;

  // Content part operations
  appendPart: (messageId: string, part: ChatContent) => void;
  appendTextContent: (messageId: string, content: string) => void;
  /**
   * Update a tool invocation by toolUseId
   */
  updateToolInvocation: (toolUseId: string, updates: Partial<ToolInvocationContent>) => void;

  // Query operations
  getLastMessage: () => ChatMessage | undefined;
  getMessagesByConversation: (conversationId: string) => ChatMessage[];
  getCurrentStreamingMessage: () => ChatMessage | undefined;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messages: [],
  activeConversationId: null,
  isStreaming: false,
  sdkStatus: null,
  error: null,

  // Basic actions
  setActiveConversationId: (conversationId) => {
    validateConversationId(conversationId);
    set({ activeConversationId: conversationId });
  },

  setStreaming: (isStreaming) => {
    if (typeof isStreaming !== 'boolean') {
      throw new ChatValidationError(
        'INVALID_STREAMING_FLAG',
        'isStreaming must be a boolean',
        { isStreaming }
      );
    }
    set({ isStreaming });
  },

  setSdkStatus: (status) => {
    if (status !== null) {
      validateSDKStatus(status);
    }
    set({ sdkStatus: status });
  },

  setError: (error) => {
    validateErrorMessage(error);
    set({ error });
  },

  reset: () => set({
    messages: [],
    activeConversationId: null,
    isStreaming: false,
    sdkStatus: null,
    error: null,
  }),

  // Message operations

  addMessage: (message) => {
    const MAX_MESSAGES = 1000;
    validateChatMessage(message);
    const currentState = get();

    // Check if max messages limit would be exceeded
    if (currentState.messages.length >= MAX_MESSAGES) {
      throw new ChatValidationError(
        'MAX_MESSAGES_EXCEEDED',
        `Cannot add message: maximum limit of ${MAX_MESSAGES} messages reached`,
        { currentCount: currentState.messages.length, maxLimit: MAX_MESSAGES }
      );
    }

    // Warn if conversationId doesn't match active conversation
    if (currentState.activeConversationId && message.conversationId !== currentState.activeConversationId) {
      console.warn(
        `Message conversationId "${message.conversationId}" does not match active conversationId "${currentState.activeConversationId}"`
      );
    }

    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (id, updates) => {
    validateMessageId(id);
    validateMessageUpdates(updates);
    const currentState = get();

    // Check message exists before calling set()
    const messageExists = currentState.messages.some((msg) => msg.id === id);
    if (!messageExists) {
      throw new ChatValidationError(
        'MESSAGE_NOT_FOUND',
        `Message with id "${id}" not found`,
        { id }
      );
    }

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  deleteMessage: (id) => {
    validateMessageId(id);
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));
  },

  // Content part operations

  /**
   * Append a new content part to a message
   * Creates new part with current timestamp if not provided
   */
  appendPart: (messageId, part) => {
    const MAX_PARTS = 500;
    validateMessageId(messageId);
    validateChatContent(part);
    const currentState = get();

    // Find message and check existence
    const message = currentState.messages.find((msg) => msg.id === messageId);
    if (!message) {
      throw new ChatValidationError(
        'MESSAGE_NOT_FOUND',
        `Message with id "${messageId}" not found`,
        { messageId }
      );
    }

    // Check if max parts limit would be exceeded
    if (message.parts.length >= MAX_PARTS) {
      throw new ChatValidationError(
        'MAX_PARTS_EXCEEDED',
        `Cannot append part: maximum limit of ${MAX_PARTS} parts per message reached`,
        { messageId, currentCount: message.parts.length, maxLimit: MAX_PARTS }
      );
    }

    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          // Ensure part has timestamp
          const partWithTimestamp = {
            ...part,
            timestamp: part.timestamp && part.timestamp.length > 0 ? part.timestamp : new Date().toISOString(),
          };
          return {
            ...msg,
            parts: [...msg.parts, partWithTimestamp],
          };
        }
        return msg;
      }),
    }));
  },

  /**
   * Append or update text content in a message
   * Optimized for streaming: appends to existing text part if present,
   * otherwise creates new text part
   */
  appendTextContent: (messageId, content) => {
    const MAX_PARTS = 500;
    validateMessageId(messageId);
    if (typeof content !== 'string') {
      throw new ChatValidationError(
        'INVALID_TEXT_CONTENT',
        'Content must be a string',
        { content }
      );
    }

    const currentState = get();
    const message = currentState.messages.find((msg) => msg.id === messageId);

    if (!message) {
      throw new ChatValidationError(
        'MESSAGE_NOT_FOUND',
        `Message with id "${messageId}" not found`,
        { messageId }
      );
    }

    // Check if we need to create a new part and if max would be exceeded
    const lastPart = message.parts[message.parts.length - 1];
    const isLastPartText = lastPart && lastPart.type === 'text';
    if (!isLastPartText && message.parts.length >= MAX_PARTS) {
      throw new ChatValidationError(
        'MAX_PARTS_EXCEEDED',
        `Cannot append part: maximum limit of ${MAX_PARTS} parts per message reached`,
        { messageId, currentCount: message.parts.length, maxLimit: MAX_PARTS }
      );
    }

    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          const lastPart = msg.parts[msg.parts.length - 1];

          // If last part is text content, append to it
          if (lastPart && lastPart.type === 'text') {
            const updatedParts = [...msg.parts];
            updatedParts[msg.parts.length - 1] = {
              ...(lastPart as TextContent),
              content: (lastPart as TextContent).content + content,
            };
            return {
              ...msg,
              parts: updatedParts,
            };
          }

          // Otherwise create new text part
          const newPart: TextContent = {
            type: 'text',
            content,
            timestamp: new Date().toISOString(),
          };
          return {
            ...msg,
            parts: [...msg.parts, newPart],
          };
        }
        return msg;
      }),
    }));
  },

  /**
   * Update a tool invocation content part by toolUseId
   * Finds and updates the tool invocation with matching unique ID across all messages
   */
  updateToolInvocation: (toolUseId, updates) => {
    if (typeof toolUseId !== 'string' || toolUseId.length === 0) {
      throw new ChatValidationError(
        'INVALID_TOOL_USE_ID',
        'toolUseId must be a non-empty string',
        { toolUseId }
      );
    }
    validateToolInvocationUpdates(updates);

    const currentState = get();
    let toolFound = false;

    // Check that tool exists before calling set()
    for (const msg of currentState.messages) {
      for (const part of msg.parts) {
        if (part.type === 'tool_invocation' && 'toolUseId' in part && part.toolUseId === toolUseId) {
          toolFound = true;
          break;
        }
      }
      if (toolFound) break;
    }

    if (!toolFound) {
      throw new ChatValidationError(
        'TOOL_NOT_FOUND',
        `Tool invocation with toolUseId "${toolUseId}" not found`,
        { toolUseId }
      );
    }

    set((state) => ({
      messages: state.messages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (part.type === 'tool_invocation' && 'toolUseId' in part && part.toolUseId === toolUseId) {
            return { ...part, ...updates };
          }
          return part;
        })
      })),
    }));
  },

  // Query operations

  /**
   * Get the most recent message
   */
  getLastMessage: () => {
    const messages = get().messages;
    return messages.length > 0 ? messages[messages.length - 1] : undefined;
  },

  /**
   * Filter messages by conversation ID
   */
  getMessagesByConversation: (conversationId) => {
    return get().messages.filter((msg) => msg.conversationId === conversationId);
  },

  /**
   * Get the current streaming message (if one exists)
   * Returns the last message that has isStreaming = true
   */
  getCurrentStreamingMessage: () => {
    const messages = get().messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].isStreaming) {
        return messages[i];
      }
    }
    return undefined;
  },
}));
