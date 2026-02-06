/**
 * Chat Validation Tests
 * Unit tests for chat validation utilities and store operations with validation
 */

import { test, expect } from '@playwright/test';
import {
  ChatValidationError,
  validateMessageId,
  validateRole,
  validateTimestamp,
  validateTextContent,
  validateToolInvocationContent,
  validateChatContent,
  validateChatMessage,
  validateSDKStatus,
  validateConversationId,
  validateErrorMessage,
  validateMessageUpdates,
  validateToolInvocationUpdates,
} from '@/apps/embedded/services/chatValidation';
import { useChatStore } from '@/apps/embedded/stores/chatStore';
import {
  ChatMessage,
  TextContent,
  ToolInvocationContent,
  UsageContent,
  ErrorContent,
  ThinkingContent,
} from '@/apps/embedded/types/chat';

// Helper to create valid test messages
function createTestMessage(
  id: string,
  conversationId: string,
  role: 'user' | 'assistant' = 'assistant'
): ChatMessage {
  return {
    id,
    role,
    conversationId,
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: 'text',
        content: `Test message ${id}`,
        timestamp: new Date().toISOString(),
      } as TextContent,
    ],
  };
}

test.describe('Chat Validation Utilities', () => {
  test.describe('validateMessageId', () => {
    test('should accept valid message ID', () => {
      expect(() => validateMessageId('msg-123')).not.toThrow();
    });

    test('should reject empty string', () => {
      const error = expect.objectContaining({ code: 'INVALID_MESSAGE_ID' });
      expect(() => validateMessageId('')).toThrow();
    });

    test('should reject non-string', () => {
      expect(() => validateMessageId(123)).toThrow(ChatValidationError);
      expect(() => validateMessageId(null)).toThrow(ChatValidationError);
      expect(() => validateMessageId(undefined)).toThrow(ChatValidationError);
    });

    test('should reject whitespace-only string', () => {
      expect(() => validateMessageId('   ')).toThrow(ChatValidationError);
    });
  });

  test.describe('validateRole', () => {
    test('should accept valid roles', () => {
      expect(() => validateRole('user')).not.toThrow();
      expect(() => validateRole('assistant')).not.toThrow();
      expect(() => validateRole('system')).not.toThrow();
    });

    test('should reject invalid role', () => {
      expect(() => validateRole('invalid')).toThrow(ChatValidationError);
      expect(() => validateRole('admin')).toThrow(ChatValidationError);
    });

    test('should reject non-string', () => {
      expect(() => validateRole(123)).toThrow(ChatValidationError);
      expect(() => validateRole(null)).toThrow(ChatValidationError);
    });
  });

  test.describe('validateTimestamp', () => {
    test('should accept valid ISO 8601 timestamps', () => {
      expect(() => validateTimestamp('2024-01-01T12:00:00Z')).not.toThrow();
      expect(() => validateTimestamp('2024-01-01T12:00:00.000Z')).not.toThrow();
      expect(() => validateTimestamp('2024-12-31T23:59:59.999Z')).not.toThrow();
    });

    test('should reject empty string', () => {
      expect(() => validateTimestamp('')).toThrow(ChatValidationError);
    });

    test('should reject invalid format', () => {
      expect(() => validateTimestamp('2024-01-01')).toThrow();
      expect(() => validateTimestamp('invalid')).toThrow();
      expect(() => validateTimestamp('2024-13-01T12:00:00Z')).toThrow();
    });

    test('should reject non-string', () => {
      expect(() => validateTimestamp(123)).toThrow(ChatValidationError);
      expect(() => validateTimestamp(null)).toThrow(ChatValidationError);
    });
  });

  test.describe('validateChatContent', () => {
    test('should accept text content', () => {
      const textContent: TextContent = {
        type: 'text',
        content: 'Hello world',
        timestamp: new Date().toISOString(),
      };
      expect(() => validateChatContent(textContent)).not.toThrow();
    });

    test('should accept tool invocation content', () => {
      const toolContent: ToolInvocationContent = {
        type: 'tool_invocation',
        toolUseId: 'toolu_001',
        toolName: 'search_model',
        toolInput: { query: 'test' },
        status: { state: 'executing' },
        timestamp: new Date().toISOString(),
      };
      expect(() => validateChatContent(toolContent)).not.toThrow();
    });

    test('should accept thinking content', () => {
      const thinkingContent: ThinkingContent = {
        type: 'thinking',
        content: 'Thinking...',
        timestamp: new Date().toISOString(),
      };
      expect(() => validateChatContent(thinkingContent)).not.toThrow();
    });

    test('should accept usage content', () => {
      const usageContent: UsageContent = {
        type: 'usage',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        totalCostUsd: 0.001,
        timestamp: new Date().toISOString(),
      };
      expect(() => validateChatContent(usageContent)).not.toThrow();
    });

    test('should accept error content', () => {
      const errorContent: ErrorContent = {
        type: 'error',
        code: 'TIMEOUT',
        message: 'Request timed out',
        timestamp: new Date().toISOString(),
      };
      expect(() => validateChatContent(errorContent)).not.toThrow();
    });

    test('should reject content without type field', () => {
      expect(() => validateChatContent({ timestamp: new Date().toISOString() })).toThrow(
        ChatValidationError
      );
    });

    test('should reject content without timestamp', () => {
      expect(() => validateChatContent({ type: 'text', content: 'test' })).toThrow(
        ChatValidationError
      );
    });

    test('should reject unknown content type', () => {
      expect(() =>
        validateChatContent({
          type: 'unknown',
          timestamp: new Date().toISOString(),
        })
      ).toThrow();
    });

    test('should reject text content without content field', () => {
      expect(() =>
        validateChatContent({
          type: 'text',
          timestamp: new Date().toISOString(),
        })
      ).toThrow();
    });

    test('should reject tool invocation without toolUseId', () => {
      expect(() =>
        validateChatContent({
          type: 'tool_invocation',
          toolName: 'search',
          toolInput: {},
          status: { state: 'executing' },
          timestamp: new Date().toISOString(),
        })
      ).toThrow();
    });
  });

  test.describe('validateChatMessage', () => {
    test('should accept valid chat message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      expect(() => validateChatMessage(message)).not.toThrow();
    });

    test('should reject message without id', () => {
      const invalid = { ...createTestMessage('msg-1', 'conv-1'), id: '' };
      expect(() => validateChatMessage(invalid)).toThrow();
    });

    test('should reject message without role', () => {
      const invalid = createTestMessage('msg-1', 'conv-1') as any;
      delete invalid.role;
      expect(() => validateChatMessage(invalid)).toThrow();
    });

    test('should reject message with invalid role', () => {
      const invalid = { ...createTestMessage('msg-1', 'conv-1'), role: 'invalid' as any };
      expect(() => validateChatMessage(invalid)).toThrow();
    });

    test('should reject message without conversationId', () => {
      const invalid = { ...createTestMessage('msg-1', 'conv-1'), conversationId: '' };
      expect(() => validateChatMessage(invalid)).toThrow();
    });

    test('should reject message without timestamp', () => {
      const invalid = { ...createTestMessage('msg-1', 'conv-1'), timestamp: '' };
      expect(() => validateChatMessage(invalid)).toThrow();
    });

    test('should reject message without parts array', () => {
      const invalid = createTestMessage('msg-1', 'conv-1') as any;
      delete invalid.parts;
      expect(() => validateChatMessage(invalid)).toThrow();
    });

    test('should reject message with invalid parts content', () => {
      const invalid = createTestMessage('msg-1', 'conv-1');
      invalid.parts = [{ type: 'text', content: 123 } as any]; // invalid content type
      expect(() => validateChatMessage(invalid)).toThrow(ChatValidationError);
    });

    test('should reject message with non-boolean isStreaming', () => {
      const invalid = { ...createTestMessage('msg-1', 'conv-1'), isStreaming: 'true' };
      expect(() => validateChatMessage(invalid)).toThrow();
    });

    test('should accept message with valid isStreaming flag', () => {
      const valid = { ...createTestMessage('msg-1', 'conv-1'), isStreaming: true };
      expect(() => validateChatMessage(valid)).not.toThrow();
    });
  });

  test.describe('validateSDKStatus', () => {
    test('should accept valid SDK status', () => {
      const status = {
        sdkAvailable: true,
        sdkVersion: '0.8.1',
        errorMessage: null,
      };
      expect(() => validateSDKStatus(status)).not.toThrow();
    });

    test('should accept SDK status with error', () => {
      const status = {
        sdkAvailable: false,
        sdkVersion: null,
        errorMessage: 'SDK not found',
      };
      expect(() => validateSDKStatus(status)).not.toThrow();
    });

    test('should reject non-boolean sdkAvailable', () => {
      expect(() =>
        validateSDKStatus({
          sdkAvailable: 'true',
          sdkVersion: null,
          errorMessage: null,
        })
      ).toThrow();
    });

    test('should reject non-string sdkVersion', () => {
      expect(() =>
        validateSDKStatus({
          sdkAvailable: true,
          sdkVersion: 123,
          errorMessage: null,
        })
      ).toThrow(ChatValidationError);
    });
  });

  test.describe('validateConversationId', () => {
    test('should accept valid conversation ID', () => {
      expect(() => validateConversationId('conv-123')).not.toThrow();
    });

    test('should accept null', () => {
      expect(() => validateConversationId(null)).not.toThrow();
    });

    test('should reject empty string', () => {
      expect(() => validateConversationId('')).toThrow(ChatValidationError);
    });

    test('should reject non-string non-null', () => {
      expect(() => validateConversationId(123)).toThrow(ChatValidationError);
      expect(() => validateConversationId(undefined)).toThrow(ChatValidationError);
    });
  });

  test.describe('validateErrorMessage', () => {
    test('should accept valid error message', () => {
      expect(() => validateErrorMessage('Something went wrong')).not.toThrow();
    });

    test('should accept null', () => {
      expect(() => validateErrorMessage(null)).not.toThrow();
    });

    test('should reject non-string non-null', () => {
      expect(() => validateErrorMessage(123)).toThrow(ChatValidationError);
      expect(() => validateErrorMessage(undefined)).toThrow(ChatValidationError);
    });
  });

  test.describe('validateMessageUpdates', () => {
    test('should accept valid partial updates', () => {
      const updates = { isStreaming: true };
      expect(() => validateMessageUpdates(updates)).not.toThrow();
    });

    test('should accept multiple valid updates', () => {
      const updates = { isStreaming: false, conversationId: 'conv-2' };
      expect(() => validateMessageUpdates(updates)).not.toThrow();
    });

    test('should reject updates with invalid id', () => {
      const updates = { id: '' };
      expect(() => validateMessageUpdates(updates)).toThrow(ChatValidationError);
    });

    test('should reject updates with invalid role', () => {
      const updates = { role: 'invalid' as any };
      expect(() => validateMessageUpdates(updates)).toThrow(ChatValidationError);
    });

    test('should reject updates with invalid isStreaming', () => {
      const updates = { isStreaming: 'true' };
      expect(() => validateMessageUpdates(updates)).toThrow(ChatValidationError);
    });

    test('should reject updates with parts field', () => {
      const updates = { parts: [] };
      expect(() => validateMessageUpdates(updates)).toThrow();
    });

    test('should reject non-object updates', () => {
      expect(() => validateMessageUpdates('invalid')).toThrow(ChatValidationError);
      expect(() => validateMessageUpdates(null)).toThrow(ChatValidationError);
    });
  });

  test.describe('validateToolInvocationUpdates', () => {
    test('should accept valid tool updates', () => {
      const updates = {
        status: { state: 'completed' as const, result: { found: 3 } },
      };
      expect(() => validateToolInvocationUpdates(updates)).not.toThrow();
    });

    test('should accept partial status updates', () => {
      const updates = { status: { state: 'executing' as const } };
      expect(() => validateToolInvocationUpdates(updates)).not.toThrow();
    });

    test('should reject invalid status state', () => {
      const updates = { status: { state: 'invalid' } };
      expect(() => validateToolInvocationUpdates(updates)).toThrow();
    });

    test('should reject invalid toolName', () => {
      const updates = { toolName: 123 };
      expect(() => validateToolInvocationUpdates(updates)).toThrow(ChatValidationError);
    });

    test('should reject invalid toolInput', () => {
      const updates = { toolInput: 'invalid' };
      expect(() => validateToolInvocationUpdates(updates)).toThrow(ChatValidationError);
    });

    test('should reject non-object updates', () => {
      expect(() => validateToolInvocationUpdates('invalid')).toThrow(ChatValidationError);
    });
  });
});

test.describe('Chat Store with Validation', () => {
  test.beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      messages: [],
      activeConversationId: null,
      isStreaming: false,
      sdkStatus: null,
      error: null,
    });
  });

  test.describe('setActiveConversationId with validation', () => {
    test('should accept valid conversation ID', () => {
      const store = useChatStore.getState();
      store.setActiveConversationId('conv-123');
      expect(useChatStore.getState().activeConversationId).toBe('conv-123');
    });

    test('should accept null', () => {
      const store = useChatStore.getState();
      store.setActiveConversationId('conv-123');
      store.setActiveConversationId(null);
      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

    test('should reject empty string', () => {
      const store = useChatStore.getState();
      expect(() => store.setActiveConversationId('')).toThrow(ChatValidationError);
    });

    test('should reject non-string non-null', () => {
      const store = useChatStore.getState();
      expect(() => store.setActiveConversationId(123 as any)).toThrow(ChatValidationError);
    });
  });

  test.describe('setStreaming with validation', () => {
    test('should accept boolean true', () => {
      const store = useChatStore.getState();
      store.setStreaming(true);
      expect(useChatStore.getState().isStreaming).toBe(true);
    });

    test('should accept boolean false', () => {
      const store = useChatStore.getState();
      store.setStreaming(false);
      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    test('should reject non-boolean', () => {
      const store = useChatStore.getState();
      expect(() => store.setStreaming('true' as any)).toThrow(ChatValidationError);
      expect(() => store.setStreaming(1 as any)).toThrow(ChatValidationError);
    });
  });

  test.describe('setSdkStatus with validation', () => {
    test('should accept valid SDK status', () => {
      const store = useChatStore.getState();
      const status = {
        sdkAvailable: true,
        sdkVersion: '0.8.1',
        errorMessage: null,
      };
      store.setSdkStatus(status);
      expect(useChatStore.getState().sdkStatus).toEqual(status);
    });

    test('should accept null', () => {
      const store = useChatStore.getState();
      store.setSdkStatus(null);
      expect(useChatStore.getState().sdkStatus).toBeNull();
    });

    test('should reject invalid SDK status', () => {
      const store = useChatStore.getState();
      expect(() =>
        store.setSdkStatus({
          sdkAvailable: 'true',
          sdkVersion: null,
          errorMessage: null,
        } as any)
      ).toThrow(ChatValidationError);
    });
  });

  test.describe('setError with validation', () => {
    test('should accept valid error message', () => {
      const store = useChatStore.getState();
      store.setError('Connection failed');
      expect(useChatStore.getState().error).toBe('Connection failed');
    });

    test('should accept null', () => {
      const store = useChatStore.getState();
      store.setError('error');
      store.setError(null);
      expect(useChatStore.getState().error).toBeNull();
    });

    test('should reject non-string non-null', () => {
      const store = useChatStore.getState();
      expect(() => store.setError(123 as any)).toThrow(ChatValidationError);
    });
  });

  test.describe('addMessage with validation', () => {
    test('should add valid message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      const store = useChatStore.getState();
      store.addMessage(message);
      expect(useChatStore.getState().messages).toHaveLength(1);
    });

    test('should reject message with invalid id', () => {
      const message = { ...createTestMessage('msg-1', 'conv-1'), id: '' };
      const store = useChatStore.getState();
      expect(() => store.addMessage(message)).toThrow(ChatValidationError);
    });

    test('should reject message with invalid role', () => {
      const message = { ...createTestMessage('msg-1', 'conv-1'), role: 'invalid' as any };
      const store = useChatStore.getState();
      expect(() => store.addMessage(message)).toThrow(ChatValidationError);
    });

    test('should reject message with empty conversationId', () => {
      const message = { ...createTestMessage('msg-1', 'conv-1'), conversationId: '' };
      const store = useChatStore.getState();
      expect(() => store.addMessage(message)).toThrow(ChatValidationError);
    });

    test('should reject message with invalid parts', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      message.parts = [{ type: 'text', content: 123 } as any];
      const store = useChatStore.getState();
      expect(() => store.addMessage(message)).toThrow(ChatValidationError);
    });
  });

  test.describe('updateMessage with validation', () => {
    test('should update existing message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      store.updateMessage('msg-1', { isStreaming: true });
      expect(useChatStore.getState().messages[0].isStreaming).toBe(true);
    });

    test('should reject update with invalid message ID', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.updateMessage('', { isStreaming: true })).toThrow(ChatValidationError);
    });

    test('should reject update with invalid updates', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.updateMessage('msg-1', { parts: [] })).toThrow(ChatValidationError);
    });

    test('should reject update for non-existent message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.updateMessage('msg-999', { isStreaming: true })).toThrow();
    });
  });

  test.describe('deleteMessage with validation', () => {
    test('should delete existing message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      store.deleteMessage('msg-1');
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    test('should reject delete with invalid message ID', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.deleteMessage('')).toThrow(ChatValidationError);
    });

    test('should not error when deleting non-existent message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      store.deleteMessage('msg-999');
      expect(useChatStore.getState().messages).toHaveLength(1);
    });
  });

  test.describe('appendPart with validation', () => {
    test('should append valid part', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      const newPart: UsageContent = {
        type: 'usage',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        totalCostUsd: 0.001,
        timestamp: new Date().toISOString(),
      };
      store.appendPart('msg-1', newPart);
      expect(useChatStore.getState().messages[0].parts).toHaveLength(2);
    });

    test('should reject append with invalid message ID', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      const part: TextContent = {
        type: 'text',
        content: 'test',
        timestamp: new Date().toISOString(),
      };
      expect(() => store.appendPart('', part)).toThrow(ChatValidationError);
    });

    test('should reject append with invalid content', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.appendPart('msg-1', { type: 'text' } as any)).toThrow(ChatValidationError);
    });

    test('should reject append for non-existent message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      const part: TextContent = {
        type: 'text',
        content: 'test',
        timestamp: new Date().toISOString(),
      };
      expect(() => store.appendPart('msg-999', part)).toThrow();
    });
  });

  test.describe('appendTextContent with validation', () => {
    test('should append text content to existing message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      store.appendTextContent('msg-1', ' additional text');
      const updated = useChatStore.getState().messages[0];
      expect((updated.parts[0] as TextContent).content).toContain('additional text');
    });

    test('should reject append with invalid message ID', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.appendTextContent('', 'test')).toThrow(ChatValidationError);
    });

    test('should reject append with non-string content', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.appendTextContent('msg-1', 123 as any)).toThrow(ChatValidationError);
    });

    test('should reject append for non-existent message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.appendTextContent('msg-999', 'test')).toThrow();
    });
  });

  test.describe('updateToolInvocation with validation', () => {
    test('should update existing tool invocation', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      const toolPart: ToolInvocationContent = {
        type: 'tool_invocation',
        toolUseId: 'toolu_001',
        toolName: 'search_model',
        toolInput: { query: 'goals' },
        status: { state: 'executing' },
        timestamp: new Date().toISOString(),
      };
      message.parts.push(toolPart);
      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      store.updateToolInvocation('toolu_001', {
        status: { state: 'completed', result: { found: 3 } },
      });

      const updated = useChatStore.getState().messages[0];
      const tool = updated.parts[1] as ToolInvocationContent;
      expect(tool.status.state).toBe('completed');
    });

    test('should reject update with invalid toolUseId', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() => store.updateToolInvocation('', { status: { state: 'executing' } })).toThrow(
        ChatValidationError
      );
    });

    test('should reject update with invalid updates', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      const toolPart: ToolInvocationContent = {
        type: 'tool_invocation',
        toolUseId: 'toolu_001',
        toolName: 'search',
        toolInput: {},
        status: { state: 'executing' },
        timestamp: new Date().toISOString(),
      };
      message.parts.push(toolPart);
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() =>
        store.updateToolInvocation('toolu_001', { status: { state: 'invalid' } as any })
      ).toThrow(ChatValidationError);
    });

    test('should reject update for non-existent tool', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });
      const store = useChatStore.getState();
      expect(() =>
        store.updateToolInvocation('toolu_999', { status: { state: 'executing' } })
      ).toThrow();
    });
  });

  test.describe('Complex Validation Scenarios', () => {
    test('should handle streaming with validation', () => {
      const store = useChatStore.getState();

      // Setup
      const userMsg = createTestMessage('msg-1', 'conv-1', 'user');
      const assistantMsg = createTestMessage('msg-2', 'conv-1', 'assistant');
      assistantMsg.isStreaming = true;

      store.addMessage(userMsg);
      store.addMessage(assistantMsg);
      store.setStreaming(true);

      // Stream text chunks
      store.appendTextContent('msg-2', 'Hello ');
      store.appendTextContent('msg-2', 'world');

      // End streaming
      store.updateMessage('msg-2', { isStreaming: false });
      store.setStreaming(false);

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.messages[1].isStreaming).toBe(false);
    });

    test('should prevent adding invalid message after valid setup', () => {
      const store = useChatStore.getState();
      const validMsg = createTestMessage('msg-1', 'conv-1');
      store.addMessage(validMsg);

      const invalidMsg = { ...validMsg, id: '' };
      expect(() => store.addMessage(invalidMsg)).toThrow(ChatValidationError);

      // Original message should still be in store
      expect(useChatStore.getState().messages).toHaveLength(1);
    });

    test('should handle rapid updates with validation', () => {
      const store = useChatStore.getState();
      const message = createTestMessage('msg-1', 'conv-1');
      store.addMessage(message);

      // Rapid updates
      store.updateMessage('msg-1', { isStreaming: true });
      store.appendTextContent('msg-1', 'chunk1');
      store.appendTextContent('msg-1', 'chunk2');
      store.updateMessage('msg-1', { isStreaming: false });

      const updated = useChatStore.getState().messages[0];
      expect((updated.parts[0] as TextContent).content).toBe('Test message msg-1chunk1chunk2');
      expect(updated.isStreaming).toBe(false);
    });
  });
});
