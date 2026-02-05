/**
 * Chat Message Component
 * Renders a single message in the chat history
 * Displays message content with proper styling and content part rendering
 */

import { memo } from 'react';
import { ChatMessage as ChatMessageType, TextContent, ToolInvocationContent, UsageContent, ErrorContent } from '../../types/chat';
import { ChatTextContent, ThinkingBlock, ToolInvocationCard, UsageStatsBadge } from './index';

export interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = memo(({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  // Render a single content part
  const renderContentPart = (part: any, index: number) => {
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
            toolOutput={tool.toolOutput}
            status={tool.status as any}
            timestamp={new Date().toLocaleTimeString()}
            duration={tool.duration}
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
      className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
        }`}
      >
        {message.parts.map((part, idx) => renderContentPart(part, idx))}
        {message.isStreaming && (
          <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse"></span>
            Streaming...
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
