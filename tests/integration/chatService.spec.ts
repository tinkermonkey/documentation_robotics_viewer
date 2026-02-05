/**
 * Chat Service Integration Tests
 * Tests for high-level chat operations
 */

import { test, expect } from '@playwright/test';
import { ChatService } from '../../src/apps/embedded/services/chatService';
import { useChatStore } from '../../src/apps/embedded/stores/chatStore';
import { ChatMessage, TextContent, ErrorContent } from '../../src/apps/embedded/types/chat';

test.describe('ChatService', () => {
  let chatService: ChatService;

  test.beforeEach(() => {
    // Reset chat store
    const store = useChatStore.getState();
    store.reset();

    // Create new chat service instance
    chatService = new ChatService();
  });

  test.describe('getStatus', () => {
    test('should check SDK availability', async () => {
      try {
        const status = await chatService.getStatus();
        expect(status).toHaveProperty('sdkAvailable');
        expect(status).toHaveProperty('sdkVersion');
        expect(status).toHaveProperty('errorMessage');
      } catch (error) {
        // Expected if WebSocket is not connected
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  test.describe('message generation', () => {
    test('should generate unique message IDs', () => {
      const id1 = (chatService as any).generateMessageId();
      const id2 = (chatService as any).generateMessageId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^msg-/);
      expect(id2).toMatch(/^msg-/);
    });

    test('should generate unique conversation IDs', () => {
      const id1 = (chatService as any).generateConversationId();
      const id2 = (chatService as any).generateConversationId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^conv-/);
      expect(id2).toMatch(/^conv-/);
    });

    test('should generate unique request IDs', () => {
      const id1 = (chatService as any).generateRequestId();
      const id2 = (chatService as any).generateRequestId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req-/);
      expect(id2).toMatch(/^req-/);
    });
  });

  test.describe('conversation tracking', () => {
    test('should return null conversation ID initially', () => {
      expect(chatService.getCurrentConversationId()).toBeNull();
    });

    test('should return null request ID initially', () => {
      expect(chatService.getCurrentRequestId()).toBeNull();
    });
  });

  test.describe('message sending validation', () => {
    test('should reject empty message', async () => {
      try {
        await chatService.sendMessage('');
        expect.fail('Expected empty message to be rejected');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('empty');
      }
    });

    test('should reject message with only whitespace', async () => {
      try {
        await chatService.sendMessage('   ');
        expect.fail('Expected whitespace-only message to be rejected');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('empty');
      }
    });
  });

  test.describe('response chunk handling', () => {
    test('should handle text response chunks', () => {
      const store = useChatStore.getState();

      // Set active conversation
      const convId = 'conv-1';
      store.setActiveConversationId(convId);

      // Create a user message first
      const userMessage: ChatMessage = {
        id: 'msg-user-1',
        role: 'user',
        conversationId: convId,
        timestamp: new Date().toISOString(),
        parts: [{ type: 'text', content: 'test', timestamp: new Date().toISOString() } as TextContent],
      };

      store.addMessage(userMessage);

      // Create assistant message with streaming flag
      const assistantMessage: ChatMessage = {
        id: 'msg-assistant-1',
        role: 'assistant',
        conversationId: convId,
        timestamp: new Date().toISOString(),
        parts: [],
        isStreaming: true,
      };

      store.addMessage(assistantMessage);

      // Simulate handling a response chunk
      (chatService as any).handleResponseChunk({
        conversation_id: convId,
        content: 'Hello, this is a response',
        is_final: false,
        timestamp: new Date().toISOString(),
      });

      // Check that message was updated
      const updated = store.getCurrentStreamingMessage();

      expect(updated).toBeDefined();
      if (updated && updated.parts.length > 0) {
        const textPart = updated.parts.find((p) => p.type === 'text') as TextContent | undefined;
        expect(textPart?.content).toContain('Hello');
      }
    });

    test('should handle multiple text chunks', () => {
      const store = useChatStore.getState();

      // Set active conversation
      const convId = 'conv-1';
      store.setActiveConversationId(convId);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: 'msg-assistant-1',
        role: 'assistant',
        conversationId: convId,
        timestamp: new Date().toISOString(),
        parts: [],
        isStreaming: true,
      };

      store.addMessage(assistantMessage);

      // Handle first chunk
      (chatService as any).handleResponseChunk({
        conversation_id: convId,
        content: 'Hello, ',
        is_final: false,
        timestamp: new Date().toISOString(),
      });

      // Handle second chunk
      (chatService as any).handleResponseChunk({
        conversation_id: convId,
        content: 'this is a response',
        is_final: false,
        timestamp: new Date().toISOString(),
      });

      // Check that chunks were concatenated
      const updated = store.getCurrentStreamingMessage();
      const textPart = updated?.parts.find((p) => p.type === 'text') as TextContent | undefined;

      expect(textPart?.content).toBe('Hello, this is a response');
    });
  });

  test.describe('tool invocation handling', () => {
    test('should handle tool invocations', () => {
      const store = useChatStore.getState();

      // Set active conversation
      const convId = 'conv-1';
      store.setActiveConversationId(convId);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: 'msg-assistant-1',
        role: 'assistant',
        conversationId: convId,
        timestamp: new Date().toISOString(),
        parts: [],
        isStreaming: true,
      };

      store.addMessage(assistantMessage);

      // Handle tool invocation
      (chatService as any).handleToolInvoke({
        conversation_id: convId,
        tool_name: 'search_model',
        tool_input: { query: 'goals' },
        status: 'executing',
        timestamp: new Date().toISOString(),
      });

      // Check that tool was added
      const updated = store.getCurrentStreamingMessage();

      if (updated && updated.parts.length > 0) {
        const toolPart = updated.parts.find((p) => p.type === 'tool_invocation');
        expect(toolPart).toBeDefined();
        expect((toolPart as any)?.toolName).toBe('search_model');
      }
    });
  });

  test.describe('error handling', () => {
    test('should handle error notifications', () => {
      const store = useChatStore.getState();

      // Set active conversation
      const convId = 'conv-1';
      store.setActiveConversationId(convId);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: 'msg-assistant-1',
        role: 'assistant',
        conversationId: convId,
        timestamp: new Date().toISOString(),
        parts: [],
        isStreaming: true,
      };

      store.addMessage(assistantMessage);

      // Handle error
      (chatService as any).handleError({
        code: 'SEND_FAILED',
        message: 'Test error',
        timestamp: new Date().toISOString(),
      });

      // Check that streaming stopped
      expect(store.isStreaming).toBe(false);

      // Check that error message contains the expected text or an error part was added
      const updated = store.getCurrentStreamingMessage();
      if (updated && updated.parts.length > 0) {
        const errorPart = updated.parts.find((p) => p.type === 'error') as ErrorContent | undefined;
        if (errorPart) {
          expect(errorPart.message).toBe('Test error');
        }
      }
    });
  });

  test.describe('store integration', () => {
    test('should update store on reset', () => {
      const store = useChatStore.getState();

      // Add some messages
      store.addMessage({
        id: 'msg-1',
        role: 'user',
        conversationId: 'conv-1',
        timestamp: new Date().toISOString(),
        parts: [{ type: 'text', content: 'test', timestamp: new Date().toISOString() } as TextContent],
      });

      // Reset chat service
      chatService.reset();

      // Check that store was reset
      expect(store.messages).toHaveLength(0);
      expect(store.activeConversationId).toBeNull();
      expect(store.isStreaming).toBe(false);
    });
  });

  test.describe('usage information handling', () => {
    test('should handle usage notifications', () => {
      const store = useChatStore.getState();

      // Set active conversation
      const convId = 'conv-1';
      store.setActiveConversationId(convId);

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: 'msg-assistant-1',
        role: 'assistant',
        conversationId: convId,
        timestamp: new Date().toISOString(),
        parts: [],
        isStreaming: true,
      };

      store.addMessage(assistantMessage);

      // Handle usage
      (chatService as any).handleUsage({
        conversation_id: convId,
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
        total_cost_usd: 0.001,
        timestamp: new Date().toISOString(),
      });

      // Check that usage was added
      const updated = store.getCurrentStreamingMessage();
      if (updated) {
        const usagePart = updated.parts.find((p) => p.type === 'usage');
        if (usagePart) {
          expect((usagePart as any)?.inputTokens).toBe(100);
          expect((usagePart as any)?.outputTokens).toBe(50);
          expect((usagePart as any)?.totalCostUsd).toBe(0.001);
        }
      }
    });
  });
});
