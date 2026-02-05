/**
 * Chat Message Component
 * Renders a single message in the chat history
 * Displays message content with proper styling and content part rendering
 */

import { memo } from 'react';
import { User, Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType, ChatContent, TextContent, ToolInvocationContent, UsageContent, ErrorContent } from '../../types/chat';
import { ChatTextContent, ThinkingBlock, ToolInvocationCard, UsageStatsBadge } from './index';

export interface ChatMessageProps {
  message: ChatMessageType;
}

// Map tool invocation status from content type to card type
const mapToolStatus = (status: string): 'executing' | 'complete' | 'error' => {
  switch (status) {
    case 'executing':
      return 'executing';
    case 'completed':
      return 'complete';
    case 'failed':
      return 'error';
    default:
      return 'executing';
  }
};

export const ChatMessage = memo(({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Render a single content part
  const renderContentPart = (part: ChatContent, index: number) => {
    switch (part.type) {
      case 'text':
        return (
          <ChatTextContent
            key={index}
            content={(part as TextContent).content}
            isStreaming={false}
          />
        );

      case 'tool_invocation':
        const tool = part as ToolInvocationContent;
        return (
          <ToolInvocationCard
            key={index}
            toolName={tool.toolName}
            toolInput={tool.toolInput || {}}
            toolOutput={typeof tool.result === 'string' ? tool.result : tool.result ? JSON.stringify(tool.result) : undefined}
            status={mapToolStatus(tool.status)}
            timestamp={tool.timestamp}
            duration={undefined}
          />
        );

      case 'thinking':
        return (
          <ThinkingBlock
            key={index}
            content={part.content}
            isStreaming={false}
            defaultExpanded={false}
          />
        );

      case 'usage':
        const usage = part as UsageContent;
        return (
          <UsageStatsBadge
            key={index}
            inputTokens={usage.inputTokens || 0}
            outputTokens={usage.outputTokens || 0}
            totalTokens={usage.totalTokens}
            totalCostUsd={usage.totalCostUsd}
          />
        );

      case 'error':
        const err = part as ErrorContent;
        return (
          <div
            key={index}
            className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded p-2 text-sm my-2 text-red-800 dark:text-red-200"
            data-testid="error-message"
          >
            [Error] {err.message}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`mb-4 flex gap-3 p-4 ${
        isUser
          ? 'justify-end bg-gray-50 dark:bg-gray-800/50'
          : 'justify-start bg-white dark:bg-gray-900'
      }`}
      data-testid={`message-${message.id}`}
    >
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-300" />
          </div>
        </div>
      )}

      <div className="flex-1 max-w-md">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          {isUser ? 'You' : 'Assistant'}
        </div>

        {message.parts.length === 0 && isAssistant && message.isStreaming ? (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span>
            Thinking...
          </div>
        ) : (
          <div className="space-y-2">
            {message.parts.map((part, idx) => renderContentPart(part, idx))}
            {message.isStreaming && message.parts.length > 0 && (
              <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span>
                Streaming...
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
        </div>
      )}
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
