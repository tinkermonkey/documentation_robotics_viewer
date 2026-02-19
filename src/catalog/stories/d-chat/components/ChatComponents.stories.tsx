import type { Meta, StoryObj } from '@storybook/react';
import { ChatTextContent } from '@/apps/embedded/components/chat/ChatTextContent';
import { ThinkingBlock } from '@/apps/embedded/components/chat/ThinkingBlock';
import { ToolInvocationCard } from '@/apps/embedded/components/chat/ToolInvocationCard';
import { UsageStatsBadge } from '@/apps/embedded/components/chat/UsageStatsBadge';
import { ChatMessage } from '@/apps/embedded/components/chat/ChatMessage';
import { ChatInput } from '@/apps/embedded/components/chat/ChatInput';
import type { ChatMessage as ChatMessageType } from '@/apps/embedded/types/chat';

const meta = {
  title: 'D Chat / Components / ChatComponents',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>; 

/**
 * Storybook Stories for Chat Components
 * Comprehensive component variations for validation and visual testing
 */

// ============================================================================
// ChatTextContent Stories
// ============================================================================

export const ChatTextContentBasic: Story = { render: () => (
  <ChatTextContent
    content="This is plain text content without any formatting."
    isStreaming={false}
  />
) };

export const ChatTextContentMarkdown: Story = { render: () => (
  <ChatTextContent
    content="This is **bold text** and *italic text* and a [link](https://example.com) and `inline code`."
    isStreaming={false}
  />
) };

export const ChatTextContentCodeBlock: Story = { render: () => (
  <ChatTextContent
    content={`Here's a code block:\n\`\`\`javascript\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n\`\`\``}
    isStreaming={false}
  />
) };

export const ChatTextContentTable: Story = { render: () => (
  <ChatTextContent
    content={`| Feature | Status |\n|---------|--------|\n| Chat | Active |\n| Tools | Active |\n| Thinking | Active |`}
    isStreaming={false}
  />
) };

export const ChatTextContentStreaming: Story = { render: () => (
  <ChatTextContent
    content="This content is currently streaming..."
    isStreaming={true}
  />
) };

export const ChatTextContentMixed: Story = { render: () => (
  <ChatTextContent
    content={`# Heading\n\nThis is **bold** and *italic* text.\n\n\`\`\`python\ndef hello():\n    print("Hello")\n\`\`\`\n\nAnd a [link](https://example.com) to check out.`}
    isStreaming={false}
  />
) };

export const ChatTextContentBlockquote: Story = { render: () => (
  <ChatTextContent
    content={`> This is a blockquote\n> with multiple lines\n> to demonstrate formatting`}
    isStreaming={false}
  />
) };

export const ChatTextContentLists: Story = { render: () => (
  <ChatTextContent
    content={`## Unordered List\n- Item 1\n- Item 2\n- Item 3\n\n## Ordered List\n1. First\n2. Second\n3. Third`}
    isStreaming={false}
  />
) };

// ============================================================================
// ThinkingBlock Stories
// ============================================================================

export const ThinkingBlockDefault: Story = { render: () => (
  <ThinkingBlock
    content="I'm thinking about how to solve this problem. Let me consider the requirements and come up with the best approach."
    isStreaming={false}
    defaultExpanded={false}
  />
) };

export const ThinkingBlockExpanded: Story = { render: () => (
  <ThinkingBlock
    content="I'm thinking about how to solve this problem. Let me consider the requirements and come up with the best approach."
    isStreaming={false}
    defaultExpanded={true}
  />
) };

export const ThinkingBlockWithDuration: Story = { render: () => (
  <ThinkingBlock
    content="I analyzed the problem carefully and determined the optimal solution."
    durationMs={2500}
    isStreaming={false}
    defaultExpanded={false}
  />
) };

export const ThinkingBlockStreaming: Story = { render: () => (
  <ThinkingBlock
    content="Analyzing requirements... considering edge cases... formulating response..."
    isStreaming={true}
    defaultExpanded={true}
  />
) };

export const ThinkingBlockLongContent: Story = { render: () => (
  <ThinkingBlock
    content={`This is a very long thinking block that demonstrates how the component handles content that exceeds 100 characters.
The preview will be truncated when collapsed. When expanded, the full thinking process will be visible to the user.
This allows users to understand the reasoning behind the assistant's response without overwhelming the UI.`}
    isStreaming={false}
    defaultExpanded={false}
  />
) };

export const ThinkingBlockShortContent: Story = { render: () => (
  <ThinkingBlock
    content="Brief thought"
    isStreaming={false}
    defaultExpanded={false}
  />
) };

// ============================================================================
// ToolInvocationCard Stories
// ============================================================================

export const ToolInvocationCardExecuting: Story = { render: () => (
  <ToolInvocationCard
    toolName="calculator"
    toolInput={{ expression: "2 + 2" }}
    status={{ state: 'executing' }}
    timestamp="2024-01-15T10:30:00Z"
  />
) };

export const ToolInvocationCardComplete: Story = { render: () => (
  <ToolInvocationCard
    toolName="calculator"
    toolInput={{ expression: "2 + 2" }}
    toolOutput="4"
    status={{ state: 'completed', result: '4' }}
    timestamp="2024-01-15T10:30:00Z"
    duration={245}
  />
) };

export const ToolInvocationCardError: Story = { render: () => (
  <ToolInvocationCard
    toolName="calculator"
    toolInput={{ expression: "invalid" }}
    toolOutput="SyntaxError: invalid expression"
    status={{ state: 'failed', error: 'SyntaxError: invalid expression' }}
    timestamp="2024-01-15T10:30:00Z"
    duration={150}
  />
) };

export const ToolInvocationCardLongOutput: Story = { render: () => (
  <ToolInvocationCard
    toolName="search"
    toolInput={{ query: "documentation" }}
    toolOutput={`[
  { "title": "Getting Started", "url": "https://example.com/start", "score": 0.98 },
  { "title": "API Reference", "url": "https://example.com/api", "score": 0.95 },
  { "title": "Examples", "url": "https://example.com/examples", "score": 0.87 }
]`}
    status={{ state: 'completed', result: 'Found 3 results' }}
    timestamp="2024-01-15T10:30:00Z"
    duration={420}
  />
) };

export const ToolInvocationCardComplexInput: Story = { render: () => (
  <ToolInvocationCard
    toolName="database_query"
    toolInput={{
      table: "users",
      filters: { active: true, role: "admin" },
      limit: 10,
      sort: { created_at: "desc" }
    }}
    toolOutput='Retrieved 3 users'
    status={{ state: 'completed', result: 'Retrieved 3 users' }}
    timestamp="2024-01-15T10:30:00Z"
    duration={320}
  />
) };

export const ToolInvocationCardNoOutput: Story = { render: () => (
  <ToolInvocationCard
    toolName="logger"
    toolInput={{ message: "Event logged", level: "info" }}
    status={{ state: 'completed' }}
    timestamp="2024-01-15T10:30:00Z"
    duration={50}
  />
) };

// ============================================================================
// UsageStatsBadge Stories
// ============================================================================

export const UsageStatsBadgeSmall: Story = { render: () => (
  <UsageStatsBadge
    inputTokens={50}
    outputTokens={75}
    totalTokens={125}
  />
) };

export const UsageStatsBadgeMedium: Story = { render: () => (
  <UsageStatsBadge
    inputTokens={500}
    outputTokens={750}
    totalTokens={1250}
  />
) };

export const UsageStatsBadgeLarge: Story = { render: () => (
  <UsageStatsBadge
    inputTokens={5000}
    outputTokens={7500}
    totalTokens={12500}
  />
) };

export const UsageStatsBadgeFormatted: Story = { render: () => (
  <UsageStatsBadge
    inputTokens={1234}
    outputTokens={1234}
    totalTokens={2468}
  />
) };

export const UsageStatsBadgeHighVolume: Story = { render: () => (
  <UsageStatsBadge
    inputTokens={50000}
    outputTokens={75000}
    totalTokens={125000}
  />
) };

// ============================================================================
// ChatMessage Stories
// ============================================================================

export const ChatMessageUser: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-1',
      role: 'user',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'text',
          content: 'Hello, what can you help me with?',
          timestamp: new Date().toISOString()
        }
      ]
    };
    return <ChatMessage message={message} />;
  },
};

export const ChatMessageAssistant: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-2',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'text',
          content: "I can help you with a wide range of tasks! I'm knowledgeable about programming, writing, analysis, and more.",
          timestamp: new Date().toISOString()
        }
      ]
    };
    return <ChatMessage message={message} />;
  },
};

export const ChatMessageWithThinking: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-3',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'thinking',
          content: 'The user is asking about my capabilities. I should provide a comprehensive overview.',
          timestamp: new Date().toISOString()
        },
        {
          type: 'text',
          content: 'I can assist with: writing, coding, analysis, and much more!',
          timestamp: new Date().toISOString()
        }
      ]
    };
    return <ChatMessage message={message} />;
  },
};

export const ChatMessageWithUsage: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-4',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'text',
          content: 'Here is my response with token usage information included.',
          timestamp: new Date().toISOString()
        },
        {
          type: 'usage',
          inputTokens: 150,
          outputTokens: 200,
          totalTokens: 350,
          totalCostUsd: 0.00125,
          timestamp: new Date().toISOString()
        }
      ]
    };
    return <ChatMessage message={message} />;
  },
};

export const ChatMessageWithToolInvocation: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-5',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'text',
          content: 'Let me search for that information.',
          timestamp: new Date().toISOString()
        },
        {
          type: 'tool_invocation',
          toolUseId: 'tool-use-1',
          toolName: 'search',
          toolInput: { query: 'example' },
          status: { state: 'completed', result: 'Found 10 results' },
          timestamp: new Date().toISOString()
        }
      ]
    };
    return <ChatMessage message={message} />;
  },
};

export const ChatMessageStreaming: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-6',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'text',
          content: 'This response is currently being streamed to you...',
          timestamp: new Date().toISOString()
        }
      ],
      isStreaming: true
    };
    return <ChatMessage message={message} />;
  },
};

export const ChatMessageStreamingEmpty: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-7',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [],
      isStreaming: true
    };
    return <ChatMessage message={message} />;
  },
};

export const ChatMessageWithError: Story = {
  render: () => {
    const message: ChatMessageType = {
      id: 'msg-8',
      role: 'assistant',
      conversationId: 'conv-1',
      timestamp: new Date().toISOString(),
      parts: [
        {
          type: 'error',
          code: 'SEND_FAILED',
          message: 'Failed to process your request. Please try again.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    return <ChatMessage message={message} />;
  },
};

// ============================================================================
// ChatInput Stories
// ============================================================================

export const ChatInputDefault: Story = { render: () => (
  <ChatInput
    onSendMessage={async (msg: string) => console.log('Sending:', msg)}
    sdkStatus={{ sdkAvailable: true, sdkVersion: '1.0.0', errorMessage: null }}
  />
) };

export const ChatInputStreaming: Story = { render: () => (
  <ChatInput
    onSendMessage={async (msg: string) => console.log('Sending:', msg)}
    onCancel={async () => console.log('Cancelled')}
    isStreaming={true}
    sdkStatus={{ sdkAvailable: true, sdkVersion: '1.0.0', errorMessage: null }}
  />
) };

export const ChatInputDisabledSDK: Story = { render: () => (
  <ChatInput
    onSendMessage={async (msg: string) => console.log('Sending:', msg)}
    sdkStatus={{ sdkAvailable: false, sdkVersion: null, errorMessage: 'SDK not initialized' }}
  />
) };

export const ChatInputSending: Story = { render: () => (
  <ChatInput
    onSendMessage={async (msg: string) => console.log('Sending:', msg)}
    isSending={true}
    sdkStatus={{ sdkAvailable: true, sdkVersion: '1.0.0', errorMessage: null }}
  />
) };

export const ChatInputDisabled: Story = { render: () => (
  <ChatInput
    onSendMessage={async (msg: string) => console.log('Sending:', msg)}
    disabled={true}
    sdkStatus={{ sdkAvailable: true, sdkVersion: '1.0.0', errorMessage: null }}
  />
) };

export const ChatInputCustomPlaceholder: Story = { render: () => (
  <ChatInput
    onSendMessage={async (msg: string) => console.log('Sending:', msg)}
    placeholder="Ask me anything..."
    sdkStatus={{ sdkAvailable: true, sdkVersion: '1.0.0', errorMessage: null }}
  />
) };

// ============================================================================
// Combined Chat Panel Stories (if needed)
// ============================================================================

export const ChatPanelConversation: Story = { render: () => (
  <div className="space-y-4 p-4 bg-white dark:bg-gray-900">
    <div className="text-sm text-gray-500">Conversation Example</div>
    <ChatMessage
      message={{
        id: 'msg-1',
        role: 'user',
        conversationId: 'conv-1',
        timestamp: new Date().toISOString(),
        parts: [{ type: 'text', content: 'What is 2 + 2?', timestamp: new Date().toISOString() }]
      }}
    />
    <ChatMessage
      message={{
        id: 'msg-2',
        role: 'assistant',
        conversationId: 'conv-1',
        timestamp: new Date().toISOString(),
        parts: [
          { type: 'thinking', content: 'Simple arithmetic', timestamp: new Date().toISOString() },
          { type: 'text', content: 'The answer is 4.', timestamp: new Date().toISOString() },
          { type: 'usage', inputTokens: 20, outputTokens: 30, totalTokens: 50, totalCostUsd: 0.0002, timestamp: new Date().toISOString() }
        ]
      }}
    />
    <ChatInput
      onSendMessage={async (msg: string) => console.log('Sending:', msg)}
      sdkStatus={{ sdkAvailable: true, sdkVersion: '1.0.0', errorMessage: null }}
    />
  </div>
) };


