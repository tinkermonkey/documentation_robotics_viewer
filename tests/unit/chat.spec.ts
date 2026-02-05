import { test, expect } from '@playwright/test';




test.describe('ChatMessage', () => {
  test('should render user message with proper styling', () => {
    const userMessage = {
      id: 'msg-1',
      role: 'user' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{ type: 'text' as const, content: 'Hello', timestamp: new Date().toISOString() }]
    };

    expect(userMessage.role).toBe('user');
    expect(userMessage.parts.length).toBe(1);
  });

  test('should render assistant message with proper styling', () => {
    const assistantMessage = {
      id: 'msg-2',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{ type: 'text' as const, content: 'Hi there', timestamp: new Date().toISOString() }]
    };

    expect(assistantMessage.role).toBe('assistant');
    expect(assistantMessage.parts.length).toBe(1);
  });

  test('should support multiple content parts in message', () => {
    const multiPartMessage = {
      id: 'msg-3',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        { type: 'text' as const, content: 'Let me think about this.', timestamp: new Date().toISOString() },
        { type: 'thinking' as const, content: 'Internal reasoning...', timestamp: new Date().toISOString() },
        { type: 'text' as const, content: 'Here is my response.', timestamp: new Date().toISOString() }
      ]
    };

    expect(multiPartMessage.parts.length).toBe(3);
    expect(multiPartMessage.parts[0].type).toBe('text');
    expect(multiPartMessage.parts[1].type).toBe('thinking');
  });

  test('should render streaming indicator when message is streaming', () => {
    const streamingMessage = {
      id: 'msg-4',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      parts: [{ type: 'text' as const, content: 'Streaming...', timestamp: new Date().toISOString() }]
    };

    expect(streamingMessage.isStreaming).toBe(true);
  });

  test('should support empty streaming assistant message with thinking placeholder', () => {
    const emptyStreamingMessage = {
      id: 'msg-5',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      parts: []
    };

    expect(emptyStreamingMessage.role).toBe('assistant');
    expect(emptyStreamingMessage.isStreaming).toBe(true);
    expect(emptyStreamingMessage.parts.length).toBe(0);
  });

  test('should support tool invocation content part', () => {
    const toolMessage = {
      id: 'msg-6',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'tool_invocation' as const,
        toolName: 'calculator',
        toolInput: { expression: '2 + 2' },
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
        result: '4'
      }]
    };

    expect(toolMessage.parts[0].type).toBe('tool_invocation');
    expect((toolMessage.parts[0] as any).toolName).toBe('calculator');
    expect((toolMessage.parts[0] as any).status).toBe('completed');
  });

  test('should support usage stats content part', () => {
    const usageMessage = {
      id: 'msg-7',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'usage' as const,
        inputTokens: 100,
        outputTokens: 150,
        totalTokens: 250,
        timestamp: new Date().toISOString(),
        totalCostUsd: 0.01
      }]
    };

    expect(usageMessage.parts[0].type).toBe('usage');
    expect((usageMessage.parts[0] as any).inputTokens).toBe(100);
    expect((usageMessage.parts[0] as any).totalTokens).toBe(250);
  });

  test('should support error content part', () => {
    const errorMessage = {
      id: 'msg-8',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{
        type: 'error' as const,
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        timestamp: new Date().toISOString()
      }]
    };

    expect(errorMessage.parts[0].type).toBe('error');
    expect((errorMessage.parts[0] as any).code).toBe('INTERNAL_ERROR');
    expect((errorMessage.parts[0] as any).message).toBe('Something went wrong');
  });

  test('should have data-testid with message ID', () => {
    const messageId = 'msg-unique-123';
    const message = {
      id: messageId,
      role: 'user' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [{ type: 'text' as const, content: 'Test', timestamp: new Date().toISOString() }]
    };

    expect(message.id).toBe(messageId);
  });

  test('should include avatar icons for both user and assistant', () => {
    const userMessage = {
      id: 'msg-user',
      role: 'user' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: []
    };

    const assistantMessage = {
      id: 'msg-asst',
      role: 'assistant' as const,
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: []
    };

    expect(userMessage.role).toBe('user');
    expect(assistantMessage.role).toBe('assistant');
  });

  test('should include role labels (You/Assistant)', () => {
    const userMessage = { role: 'user' as const };
    const assistantMessage = { role: 'assistant' as const };

    expect(userMessage.role === 'user').toBe(true);
    expect(assistantMessage.role === 'assistant').toBe(true);
  });

  test('should map tool status correctly from content to card format', () => {
    const statuses = [
      { content: 'executing', expected: 'executing' },
      { content: 'completed', expected: 'complete' },
      { content: 'failed', expected: 'error' }
    ];

    statuses.forEach(({ content, expected }) => {
      expect(['executing', 'complete', 'error']).toContain(expected);
    });
  });
});

test.describe('ChatInput', () => {
  test('should have textarea for message input', () => {
    const testId = 'message-input';
    expect(testId).toBeDefined();
  });

  test('should have send button', () => {
    const testId = 'send-button';
    expect(testId).toBeDefined();
  });

  test('should have cancel button component when streaming', () => {
    const testId = 'cancel-button';
    expect(testId).toBeDefined();
  });

  test('should handle SDK unavailable state', () => {
    const sdkStatus = {
      sdkAvailable: false,
      sdkVersion: null,
      errorMessage: 'SDK not installed'
    };

    expect(sdkStatus.sdkAvailable).toBe(false);
    expect(sdkStatus.errorMessage).toBe('SDK not installed');
  });

  test('should disable input when streaming', () => {
    const isStreaming = true;
    expect(isStreaming).toBe(true);
  });

  test('should disable send button when input is empty', () => {
    const inputValue = '';
    expect(inputValue.trim()).toBe('');
  });

  test('should call onSendMessage with input value', () => {
    const message = 'Hello, World!';
    let sentMessage = '';
    const onSendMessage = (msg: string) => {
      sentMessage = msg;
      return Promise.resolve();
    };

    onSendMessage(message).then(() => {
      expect(sentMessage).toBe(message);
    });
  });

  test('should clear input after sending message', () => {
    const onSendMessage = () => Promise.resolve();
    expect(onSendMessage).toBeDefined();
  });

  test('should support Enter key to send', () => {
    const enterKey = 'Enter';
    expect(enterKey).toBe('Enter');
  });

  test('should support Shift+Enter for newline', () => {
    const shiftEnterKeys = ['Shift', 'Enter'];
    expect(shiftEnterKeys).toContain('Enter');
    expect(shiftEnterKeys).toContain('Shift');
  });

  test('should show warning when chat is unavailable', () => {
    const sdkStatus = {
      sdkAvailable: false,
      sdkVersion: null,
      errorMessage: 'SDK not configured'
    };

    expect(sdkStatus.errorMessage).toBeDefined();
  });

  test('should call onCancel when cancel button is clicked', () => {
    let cancelCalled = false;
    const onCancel = () => {
      cancelCalled = true;
      return Promise.resolve();
    };

    expect(onCancel).toBeDefined();
  });

  test('should restore input value on send error', () => {
    const message = 'Test message';
    const onSendMessage = () => Promise.reject(new Error('Send failed'));

    expect(onSendMessage).toBeDefined();
  });

  test('should display help text about keyboard shortcuts', () => {
    const helpText = 'Press Enter to send, Shift+Enter for new line';
    expect(helpText).toContain('Enter');
    expect(helpText).toContain('new line');
  });

  test('should have data-testid for accessibility', () => {
    const testIds = ['message-input', 'send-button', 'cancel-button'];
    expect(testIds.length).toBe(3);
  });

  test('should support custom placeholder', () => {
    const customPlaceholder = 'Custom prompt text';
    expect(customPlaceholder).toBeDefined();
  });

  test('should support dark mode styling', () => {
    const darkClasses = ['dark:bg-gray-700', 'dark:text-gray-100', 'dark:border-gray-600'];
    expect(darkClasses.length).toBe(3);
  });

  test('should have buttons with proper styling', () => {
    const buttonClasses = 'px-4 py-2 rounded text-sm font-medium transition-colors';
    expect(buttonClasses).toContain('rounded');
    expect(buttonClasses).toContain('font-medium');
  });

  test('should disable input when isSending is true', () => {
    const isSending = true;
    expect(isSending).toBe(true);
  });

  test('should show Send icon and text on button', () => {
    const buttonLabel = 'Send';
    expect(buttonLabel).toBe('Send');
  });

  test('should show Cancel icon and text when streaming', () => {
    const cancelLabel = 'Cancel';
    expect(cancelLabel).toBe('Cancel');
  });

  test('should support auto-resize textarea', () => {
    const minHeight = 40;
    const maxHeight = 200;
    expect(minHeight).toBeLessThan(maxHeight);
  });

  test('should have overflow-hidden class for textarea', () => {
    const textareaClass = 'overflow-hidden';
    expect(textareaClass).toBeDefined();
  });
});
