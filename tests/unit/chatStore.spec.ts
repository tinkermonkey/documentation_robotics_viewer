/**
 * Chat Store Tests
 * Unit tests for chat store actions and selectors
 */

import { test, expect } from '@playwright/test';
import { useChatStore } from '@/apps/embedded/stores/chatStore';
import { ChatMessage, TextContent, ToolInvocationContent, UsageContent } from '@/apps/embedded/types/chat';

// Helper function to create test messages
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

test.describe('Chat Store', () => {
  test.beforeEach(() => {
    // Clear store before each test
    useChatStore.setState({
      messages: [],
      activeConversationId: null,
      isStreaming: false,
      sdkStatus: null,
      error: null,
    });
  });

  test.describe('State Initialization', () => {
    test('should have empty initial state', () => {
      const state = useChatStore.getState();

      expect(state.messages).toEqual([]);
      expect(state.activeConversationId).toBeNull();
      expect(state.isStreaming).toBe(false);
      expect(state.sdkStatus).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  test.describe('Basic Actions', () => {
    test('should set active conversation ID', () => {
      const store = useChatStore.getState();
      store.setActiveConversationId('conv-123');

      expect(useChatStore.getState().activeConversationId).toBe('conv-123');
    });

    test('should clear active conversation ID', () => {
      useChatStore.setState({ activeConversationId: 'conv-123' });
      const store = useChatStore.getState();
      store.setActiveConversationId(null);

      expect(useChatStore.getState().activeConversationId).toBeNull();
    });

    test('should set streaming status', () => {
      const store = useChatStore.getState();
      store.setStreaming(true);

      expect(useChatStore.getState().isStreaming).toBe(true);

      store.setStreaming(false);
      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    test('should set SDK status', () => {
      const store = useChatStore.getState();
      const status = {
        sdkAvailable: true,
        sdkVersion: '0.8.1',
        errorMessage: null,
      };

      store.setSdkStatus(status);

      expect(useChatStore.getState().sdkStatus).toEqual(status);
    });

    test('should set error message', () => {
      const store = useChatStore.getState();
      store.setError('Connection failed');

      expect(useChatStore.getState().error).toBe('Connection failed');
    });

    test('should clear error message', () => {
      useChatStore.setState({ error: 'Some error' });
      const store = useChatStore.getState();
      store.setError(null);

      expect(useChatStore.getState().error).toBeNull();
    });

    test('should reset all state', () => {
      const store = useChatStore.getState();

      // Set some state
      store.addMessage(createTestMessage('msg-1', 'conv-1'));
      store.setActiveConversationId('conv-1');
      store.setStreaming(true);
      store.setError('Test error');

      // Reset
      store.reset();

      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.activeConversationId).toBeNull();
      expect(state.isStreaming).toBe(false);
      expect(state.sdkStatus).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  test.describe('Message Operations', () => {
    test('should add a message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      const store = useChatStore.getState();

      store.addMessage(message);

      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]).toEqual(message);
    });

    test('should add multiple messages', () => {
      const store = useChatStore.getState();
      const message1 = createTestMessage('msg-1', 'conv-1');
      const message2 = createTestMessage('msg-2', 'conv-1');

      store.addMessage(message1);
      store.addMessage(message2);

      expect(useChatStore.getState().messages).toHaveLength(2);
    });

    test('should update a message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      store.updateMessage('msg-1', { isStreaming: true });

      const updated = useChatStore.getState().messages[0];
      expect(updated.isStreaming).toBe(true);
      expect(updated.id).toBe('msg-1'); // Other properties unchanged
    });

    test('should throw when updating non-existent message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      expect(() => store.updateMessage('msg-999', { isStreaming: true })).toThrow();

      expect(useChatStore.getState().messages[0].isStreaming).toBeUndefined();
    });

    test('should delete a message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      store.deleteMessage('msg-1');

      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    test('should not error when deleting non-existent message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      store.deleteMessage('msg-999');

      expect(useChatStore.getState().messages).toHaveLength(1);
    });
  });

  test.describe('Content Part Operations', () => {
    test('should append a new part to a message', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });

      const newPart: UsageContent = {
        type: 'usage',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        totalCostUsd: 0.002,
        timestamp: new Date().toISOString(),
      };

      const store = useChatStore.getState();
      store.appendPart('msg-1', newPart);

      const updated = useChatStore.getState().messages[0];
      expect(updated.parts).toHaveLength(2);
      expect(updated.parts[1].type).toBe('usage');
    });

    test('should add timestamp to part if not provided', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });

      const newPart: UsageContent = {
        type: 'usage',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        totalCostUsd: 0.002,
        timestamp: '',
      };

      const store = useChatStore.getState();
      store.appendPart('msg-1', newPart);

      const updated = useChatStore.getState().messages[0];
      expect(updated.parts[1].timestamp).toBeTruthy();
      expect(updated.parts[1].timestamp.length).toBeGreaterThan(0);
    });

    test('should append text content to existing text part', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      store.appendTextContent('msg-1', ' continued');

      const updated = useChatStore.getState().messages[0];
      expect(updated.parts).toHaveLength(1); // Still only 1 part
      const textPart = updated.parts[0] as TextContent;
      expect(textPart.content).toContain('Test message msg-1 continued');
    });

    test('should create new text part when last part is not text', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      const usagePart: UsageContent = {
        type: 'usage',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        totalCostUsd: 0.002,
        timestamp: new Date().toISOString(),
      };
      message.parts.push(usagePart);

      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      store.appendTextContent('msg-1', 'New text');

      const updated = useChatStore.getState().messages[0];
      expect(updated.parts).toHaveLength(3); // Original text, usage, new text
      expect(updated.parts[2].type).toBe('text');
      expect((updated.parts[2] as TextContent).content).toBe('New text');
    });

    test('should create first text part when message has no parts', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      message.parts = []; // Empty parts

      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();
      store.appendTextContent('msg-1', 'First text');

      const updated = useChatStore.getState().messages[0];
      expect(updated.parts).toHaveLength(1);
      expect(updated.parts[0].type).toBe('text');
    });

    test('should handle streaming multiple text chunks', () => {
      const message = createTestMessage('msg-1', 'conv-1');
      message.parts = []; // Start empty
      useChatStore.setState({ messages: [message] });

      const store = useChatStore.getState();

      // Simulate streaming chunks
      store.appendTextContent('msg-1', 'Hello ');
      store.appendTextContent('msg-1', 'world');
      store.appendTextContent('msg-1', '!');

      const updated = useChatStore.getState().messages[0];
      expect(updated.parts).toHaveLength(1);
      expect((updated.parts[0] as TextContent).content).toBe('Hello world!');
    });

    test('should update tool invocation status', () => {
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
      const updatedTool = updated.parts[1] as ToolInvocationContent;
      expect(updatedTool.status.state).toBe('completed');
      expect(updatedTool.status.state === 'completed' && updatedTool.status.result).toEqual({ found: 3 });
    });

    test('should throw when updating tool invocation with wrong tool_use_id', () => {
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
      expect(() => store.updateToolInvocation('toolu_wrong', {
        status: { state: 'completed' },
      })).toThrow();

      const updated = useChatStore.getState().messages[0];
      const updatedTool = updated.parts[1] as ToolInvocationContent;
      expect(updatedTool.status.state).toBe('executing'); // Unchanged
    });
  });

  test.describe('Query Operations', () => {
    test('should get last message', () => {
      const message1 = createTestMessage('msg-1', 'conv-1');
      const message2 = createTestMessage('msg-2', 'conv-1');

      useChatStore.setState({ messages: [message1, message2] });

      const store = useChatStore.getState();
      const last = store.getLastMessage();

      expect(last).toEqual(message2);
    });

    test('should return undefined when no messages', () => {
      const store = useChatStore.getState();
      const last = store.getLastMessage();

      expect(last).toBeUndefined();
    });

    test('should get messages by conversation', () => {
      const message1 = createTestMessage('msg-1', 'conv-1');
      const message2 = createTestMessage('msg-2', 'conv-1');
      const message3 = createTestMessage('msg-3', 'conv-2');

      useChatStore.setState({ messages: [message1, message2, message3] });

      const store = useChatStore.getState();
      const conv1Messages = store.getMessagesByConversation('conv-1');

      expect(conv1Messages).toHaveLength(2);
      expect(conv1Messages[0].id).toBe('msg-1');
      expect(conv1Messages[1].id).toBe('msg-2');
    });

    test('should return empty array for non-existent conversation', () => {
      const message1 = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message1] });

      const store = useChatStore.getState();
      const messages = store.getMessagesByConversation('conv-999');

      expect(messages).toHaveLength(0);
    });

    test('should get current streaming message', () => {
      const message1 = createTestMessage('msg-1', 'conv-1');
      const message2 = createTestMessage('msg-2', 'conv-1');
      message2.isStreaming = true;

      useChatStore.setState({ messages: [message1, message2] });

      const store = useChatStore.getState();
      const streaming = store.getCurrentStreamingMessage();

      expect(streaming).toEqual(message2);
    });

    test('should return most recent streaming message', () => {
      const message1 = createTestMessage('msg-1', 'conv-1');
      message1.isStreaming = true;
      const message2 = createTestMessage('msg-2', 'conv-1');
      message2.isStreaming = true;

      useChatStore.setState({ messages: [message1, message2] });

      const store = useChatStore.getState();
      const streaming = store.getCurrentStreamingMessage();

      expect(streaming).toEqual(message2);
    });

    test('should return undefined when no streaming message', () => {
      const message1 = createTestMessage('msg-1', 'conv-1');
      useChatStore.setState({ messages: [message1] });

      const store = useChatStore.getState();
      const streaming = store.getCurrentStreamingMessage();

      expect(streaming).toBeUndefined();
    });
  });

  test.describe('Store Immutability', () => {
    test('should not mutate original message when updating', () => {
      const original = createTestMessage('msg-1', 'conv-1');
      const copy = JSON.parse(JSON.stringify(original));

      useChatStore.setState({ messages: [original] });

      const store = useChatStore.getState();
      store.updateMessage('msg-1', { isStreaming: true });

      expect(original).toEqual(copy);
    });

    test('should not mutate messages array when adding', () => {
      const messages = [createTestMessage('msg-1', 'conv-1')];
      useChatStore.setState({ messages });

      const store = useChatStore.getState();
      store.addMessage(createTestMessage('msg-2', 'conv-1'));

      expect(messages).toHaveLength(1);
    });
  });

  test.describe('Complex Workflows', () => {
    test('should handle complete conversation flow', () => {
      const store = useChatStore.getState();

      // Setup conversation
      store.setActiveConversationId('conv-1');

      // Add user message
      const userMsg = createTestMessage('msg-1', 'conv-1', 'user');
      store.addMessage(userMsg);

      // Start assistant response
      const assistantMsg = createTestMessage('msg-2', 'conv-1', 'assistant');
      assistantMsg.isStreaming = true;
      store.addMessage(assistantMsg);
      store.setStreaming(true);

      // Stream text in chunks
      store.appendTextContent('msg-2', 'The motivation layer');
      store.appendTextContent('msg-2', ' contains ');
      store.appendTextContent('msg-2', 'three main goals.');

      // Add tool invocation
      const toolPart: ToolInvocationContent = {
        type: 'tool_invocation',
        toolUseId: 'toolu_001',
        toolName: 'search_model',
        toolInput: { query: 'goals' },
        status: { state: 'executing' },
        timestamp: new Date().toISOString(),
      };
      store.appendPart('msg-2', toolPart);

      // Complete tool invocation
      store.updateToolInvocation('toolu_001', {
        status: { state: 'completed', result: [{ id: 'goal-1', name: 'Deliver Value' }] },
      });

      // Add usage info
      const usagePart: UsageContent = {
        type: 'usage',
        inputTokens: 150,
        outputTokens: 75,
        totalTokens: 225,
        totalCostUsd: 0.0045,
        timestamp: new Date().toISOString(),
      };
      store.appendPart('msg-2', usagePart);

      // End streaming
      store.updateMessage('msg-2', { isStreaming: false });
      store.setStreaming(false);

      // Verify final state
      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(2);
      expect(state.activeConversationId).toBe('conv-1');
      expect(state.isStreaming).toBe(false);

      const finalMsg = state.messages[1];
      expect(finalMsg.parts).toHaveLength(3); // text (with appends), tool, usage
      expect(finalMsg.isStreaming).toBe(false);
    });
  });
});
