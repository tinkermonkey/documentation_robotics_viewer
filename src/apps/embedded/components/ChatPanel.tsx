/**
 * Chat Panel Component
 * Main UI component for chat functionality
 * Displays message list, input form, and streaming indicators
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatService } from '../services/chatService';
import { ChatMessage, ChatInput } from './chat';

interface ChatPanelProps {
  title?: string;
  showCostInfo?: boolean;
  testId?: string;
}

const ChatPanelComponent = ({
  title = 'DrBot Chat',
  showCostInfo = true,
  testId = 'chat-panel'
}: ChatPanelProps) => {
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const handleSendMessage = useCallback(async (message: string) => {
    setIsSending(true);

    try {
      await chatService.sendMessage(message);
    } catch (error) {
      console.error('[ChatPanel] Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, []);

  // Handle cancel button
  const handleCancel = useCallback(async () => {
    try {
      await chatService.cancelMessage();
    } catch (error) {
      console.error('[ChatPanel] Failed to cancel:', error);
    }
  }, []);

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
              <p className="text-sm mb-2">Chat</p>
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
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
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
      <ChatInput
        onSendMessage={handleSendMessage}
        onCancel={handleCancel}
        isStreaming={isStreaming}
        isSending={isSending}
        sdkStatus={sdkStatus}
      />

      {/* Cost Info Footer (optional) */}
      {showCostInfo && messages.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
          <p>All costs are estimates based on Anthropic API pricing.</p>
        </div>
      )}
    </div>
  );
};

ChatPanelComponent.displayName = 'ChatPanel';

export const ChatPanel = memo(ChatPanelComponent);
