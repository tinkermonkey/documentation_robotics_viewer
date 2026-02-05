/**
 * Chat Panel Component
 * Main UI component for chat functionality
 * Displays message list, input form, and streaming indicators
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatService } from '../services/chatService';
import { ChatMessage, TextContent, ErrorContent, ToolInvocationContent, UsageContent } from '../types/chat';

interface ChatPanelProps {
  title?: string;
  showCostInfo?: boolean;
  testId?: string;
}

export const ChatPanel = ({
  title = 'DrBot Chat',
  showCostInfo = true,
  testId = 'chat-panel'
}: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    activeConversationId,
    isStreaming,
    sdkStatus,
    error: storeError
  } = useChatStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming || !sdkStatus?.sdkAvailable) {
      return;
    }

    const message = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      await chatService.sendMessage(message);
    } catch (error) {
      console.error('[ChatPanel] Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isStreaming, sdkStatus?.sdkAvailable]);

  // Handle cancel button
  const handleCancel = useCallback(async () => {
    try {
      await chatService.cancelMessage();
    } catch (error) {
      console.error('[ChatPanel] Failed to cancel:', error);
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Render a single content part
  const renderContentPart = (part: any, index: number) => {
    switch (part.type) {
      case 'text':
        return (
          <div key={index} className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {(part as TextContent).content}
          </div>
        );

      case 'tool_invocation':
        const tool = part as ToolInvocationContent;
        return (
          <div key={index} className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded p-2 text-sm my-2">
            <div className="font-semibold text-blue-900 dark:text-blue-100">
              🔧 {tool.toolName}
            </div>
            <div className="text-blue-800 dark:text-blue-200 text-xs">
              Status: {tool.status}
            </div>
          </div>
        );

      case 'thinking':
        return (
          <div key={index} className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded p-2 text-sm my-2 italic text-purple-700 dark:text-purple-200">
            💭 {part.content}
          </div>
        );

      case 'usage':
        const usage = part as UsageContent;
        return (
          <div key={index} className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded p-2 text-xs my-2 text-green-800 dark:text-green-200">
            📊 Tokens: {usage.totalTokens} | Cost: ${usage.totalCostUsd.toFixed(4)}
          </div>
        );

      case 'error':
        const err = part as ErrorContent;
        return (
          <div key={index} className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded p-2 text-sm my-2 text-red-800 dark:text-red-200">
            ❌ {err.message}
          </div>
        );

      default:
        return null;
    }
  };

  // Render a single message
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
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
  };

  const chatAvailable = sdkStatus?.sdkAvailable;
  const hasError = !!storeError;

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg"
      data-testid={testId}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          {activeConversationId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Conversation: {activeConversationId}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {chatAvailable ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <span className="inline-block w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
              Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <span className="inline-block w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></span>
              Unavailable
            </span>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4" data-testid="messages-container">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-center">
            <div>
              <p className="text-4xl mb-2">💬</p>
              <p>No messages yet. Start a conversation!</p>
              {!chatAvailable && (
                <p className="text-sm mt-2 text-red-600 dark:text-red-400">
                  Chat is not available. Please check SDK status.
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {hasError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900 border-t border-red-200 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-200">
            <span className="font-semibold">Error:</span> {storeError}
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 border-t dark:border-gray-700">
        {!chatAvailable && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded p-2 mb-3 text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ {sdkStatus?.errorMessage || 'Chat service is not available'}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || !chatAvailable || isSending}
            placeholder={
              chatAvailable
                ? 'Type a message... (Cmd/Ctrl+Enter to send)'
                : 'Chat unavailable'
            }
            className="flex-1 px-3 py-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
            data-testid="message-input"
          />
          <div className="flex gap-2">
            {isStreaming ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors"
                disabled={!isStreaming}
                data-testid="cancel-button"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !chatAvailable || isSending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
                data-testid="send-button"
              >
                <span>{isSending ? '...' : 'Send'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cost Info Footer (optional) */}
      {showCostInfo && messages.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          <p>All costs are estimates based on Anthropic API pricing.</p>
        </div>
      )}
    </div>
  );
};

ChatPanel.displayName = 'ChatPanel';
