/**
 * Chat Input Component
 * Form component for message input and submission
 * Handles keyboard shortcuts, SDK status, and streaming state
 */

import { useState, useCallback, useRef, memo } from 'react';
import { SDKStatus } from '../../types/chat';

export interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  onCancel?: () => Promise<void>;
  isStreaming?: boolean;
  isSending?: boolean;
  sdkStatus?: SDKStatus | null;
  disabled?: boolean;
  placeholder?: string;
  testId?: string;
}

export const ChatInput = memo(
  ({
    onSendMessage,
    onCancel,
    isStreaming = false,
    isSending = false,
    sdkStatus,
    disabled = false,
    placeholder = 'Type a message... (Cmd/Ctrl+Enter to send)',
    testId = 'chat-input'
  }: ChatInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const chatAvailable = sdkStatus?.sdkAvailable ?? false;
    const isDisabled = disabled || isStreaming || !chatAvailable || isSending;

    // Handle message submission
    const handleSendMessage = useCallback(async () => {
      if (!inputValue.trim() || isDisabled) {
        return;
      }

      const message = inputValue.trim();
      setInputValue('');

      try {
        await onSendMessage(message);
      } catch (error) {
        console.error('[ChatInput] Failed to send message:', error);
        // Restore input on error
        setInputValue(message);
      }
    }, [inputValue, isDisabled, onSendMessage]);

    // Handle cancel button
    const handleCancel = useCallback(async () => {
      if (onCancel) {
        try {
          await onCancel();
        } catch (error) {
          console.error('[ChatInput] Failed to cancel:', error);
        }
      }
    }, [onCancel]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl+Enter to send
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }
    }, [handleSendMessage]);

    return (
      <div className="px-4 py-3 border-t dark:border-gray-700" data-testid={testId}>
        {!chatAvailable && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded p-2 mb-3 text-sm text-yellow-800 dark:text-yellow-200">
            [Warning] {sdkStatus?.errorMessage || 'Chat service is not available'}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={chatAvailable ? placeholder : 'Chat unavailable'}
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
    );
  }
);

ChatInput.displayName = 'ChatInput';
