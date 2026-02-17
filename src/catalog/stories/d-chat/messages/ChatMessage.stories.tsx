/**
 * ChatMessage Component Stories
 * Demonstrates the main message container with different roles and content types
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ChatMessage } from '@/apps/embedded/components/chat/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/apps/embedded/types/chat';

const meta = {
  title: 'D Chat / Messages / ChatMessage',
  component: ChatMessage,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * User message with simple text
 */
export const UserMessage: Story = {
  render: () => {
const message: ChatMessageType = {
    id: '1',
    role: 'user',
    conversationId: 'conv-1',
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: 'text',
        content: 'Can you help me understand the motivation layer in this architecture?',
        timestamp: new Date().toISOString()
      }
    ]
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>
  
    );
  }
};

/**
 * Assistant message with simple text response
 */
export const AssistantMessage: Story = {
  render: () => {
const message: ChatMessageType = {
    id: '2',
    role: 'assistant',
    conversationId: 'conv-1',
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: 'text',
        content: 'The motivation layer captures the strategic drivers, goals, and stakeholders that guide the architecture. It includes elements like business goals, constraints, and principles that influence design decisions.',
        timestamp: new Date().toISOString()
      }
    ]
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>
  
    );
  }
};

/**
 * Assistant message being streamed
 */
export const StreamingMessage: Story = {
  render: () => {
const message: ChatMessageType = {
    id: '3',
    role: 'assistant',
    conversationId: 'conv-1',
    timestamp: new Date().toISOString(),
    isStreaming: true,
    parts: [
      {
        type: 'text',
        content: 'Let me analyze the business layer for you. I can see several key components including...',
        timestamp: new Date().toISOString()
      }
    ]
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>
  
    );
  }
};

/**
 * Message with tool invocations
 */
export const WithToolInvocations: Story = {
  render: () => {
const message: ChatMessageType = {
    id: '4',
    role: 'assistant',
    conversationId: 'conv-1',
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: 'text',
        content: "Let me search for the stakeholder elements in the model.",
        timestamp: new Date().toISOString()
      },
      {
        type: 'tool_invocation',
        toolUseId: 'tool-1',
        toolName: 'searchModel',
        toolInput: { query: 'stakeholder', layer: 'motivation' },
        status: { state: 'completed', result: { count: 5, elements: ['CEO', 'CTO', 'Product Manager'] } },
        timestamp: new Date().toISOString()
      },
      {
        type: 'text',
        content: "I found 5 stakeholders defined in the motivation layer.",
        timestamp: new Date().toISOString()
      }
    ]
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>
  
    );
  }
};

/**
 * Message with extended thinking
 */
export const WithThinking: Story = {
  render: () => {
const message: ChatMessageType = {
    id: '5',
    role: 'assistant',
    conversationId: 'conv-1',
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: 'thinking',
        content: 'The user is asking about the relationship between goals and constraints. I should first analyze the model structure to identify all goal elements, then trace their relationships to constraint elements. This will require examining the motivation layer graph.',
        timestamp: new Date().toISOString()
      },
      {
        type: 'text',
        content: "Based on the model structure, I can see that your business goals are constrained by three key factors: budget limitations, regulatory compliance, and technical feasibility.",
        timestamp: new Date().toISOString()
      }
    ]
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>
  
    );
  }
};

/**
 * Message with usage statistics
 */
export const WithUsageStats: Story = {
  render: () => {
const message: ChatMessageType = {
    id: '6',
    role: 'assistant',
    conversationId: 'conv-1',
    timestamp: new Date().toISOString(),
    parts: [
      {
        type: 'text',
        content: "I've analyzed all the layers in your architecture model and identified several key relationships between the business and application layers.",
        timestamp: new Date().toISOString()
      },
      {
        type: 'usage',
        inputTokens: 1250,
        outputTokens: 380,
        totalTokens: 1630,
        totalCostUsd: 0.0245,
        timestamp: new Date().toISOString()
      }
    ]
  };

      return (
      
    <div className="p-4 max-w-3xl bg-white dark:bg-gray-800">
      <ChatMessage message={message} />
    </div>
  
    );
  }
};
