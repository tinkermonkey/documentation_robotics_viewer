/**
 * Chat Store
 * Manages chat state using Zustand for message history, streaming, and SDK status
 */

import { create } from 'zustand';
import { ChatMessage, TextContent, ChatContent, SDKStatus } from '../types/chat';

interface ChatStore {
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
  updateToolInvocation: (messageId: string, toolName: string, updates: Partial<Exclude<ChatContent, TextContent | ThinkingContent | UsageContent | ErrorContent>>) => void;

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
  setActiveConversationId: (conversationId) => set({ activeConversationId: conversationId }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setSdkStatus: (status) => set({ sdkStatus: status }),

  setError: (error) => set({ error }),

  reset: () => set({
    messages: [],
    activeConversationId: null,
    isStreaming: false,
    sdkStatus: null,
    error: null,
  }),

  // Message operations

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    ),
  })),

  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter((msg) => msg.id !== id),
  })),

  // Content part operations

  /**
   * Append a new content part to a message
   * Creates new part with current timestamp if not provided
   */
  appendPart: (messageId, part) => set((state) => ({
    messages: state.messages.map((msg) => {
      if (msg.id === messageId) {
        // Ensure part has timestamp
        const partWithTimestamp = {
          ...part,
          timestamp: part.timestamp || new Date().toISOString(),
        };
        return {
          ...msg,
          parts: [...msg.parts, partWithTimestamp],
        };
      }
      return msg;
    }),
  })),

  /**
   * Append or update text content in a message
   * Optimized for streaming: appends to existing text part if present,
   * otherwise creates new text part
   */
  appendTextContent: (messageId, content) => set((state) => ({
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
  })),

  /**
   * Update a tool invocation content part by tool name
   * Finds and updates the tool invocation with matching name
   */
  updateToolInvocation: (messageId, toolName, updates) => set((state) => ({
    messages: state.messages.map((msg) => {
      if (msg.id === messageId) {
        const updatedParts = msg.parts.map((part) => {
          if (part.type === 'tool_invocation' && 'toolName' in part && part.toolName === toolName) {
            return { ...part, ...updates };
          }
          return part;
        });
        return {
          ...msg,
          parts: updatedParts,
        };
      }
      return msg;
    }),
  })),

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
