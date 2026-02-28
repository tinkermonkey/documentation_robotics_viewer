/**
 * Chat Input Component
 * Form component for message input and submission
 * Handles keyboard shortcuts, SDK status, and streaming state
 */

import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
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

export const ChatInput: React.FC<ChatInputProps> = memo(
  ({
    onSendMessage,
    onCancel,
    isStreaming = false,
    isSending = false,
    sdkStatus,
    disabled = false,
    placeholder = 'Type a message...',
    testId = 'chat-input'
  }: ChatInputProps) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const chatAvailable = sdkStatus?.sdkAvailable ?? false;
    const isDisabled = disabled || isStreaming || !chatAvailable || isSending;

    // Auto-resize textarea
    useEffect(() => {
      if (!inputRef.current) return;

      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }, [inputValue]);

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
      // Enter to send (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
        return;
      }
      // Shift+Enter adds newline (default behavior)
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
            className="flex-1 px-3 py-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            style={{ minHeight: '40px', maxHeight: '200px' }}
            data-testid="message-input"
          />
          <div className="flex gap-2">
            {isStreaming ? (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
                disabled={!isStreaming}
                data-testid="cancel-button"
                aria-label="Cancel message streaming"
              >
                <Square className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !chatAvailable || isSending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
                data-testid="send-button"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? '...' : 'Send'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';
