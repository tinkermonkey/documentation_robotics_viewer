/**
 * ChatPanelContainer Component
 * Wrapper for ChatPanel that handles initialization and lifecycle
 * Manages WebSocket connection, SDK status checking, and event listeners
 */

import { useEffect, useState, memo } from 'react';
import { ChatPanel } from './ChatPanel';
import { ChatPanelErrorBoundary } from './ChatPanelErrorBoundary';
import { chatService } from '../services/chatService';
import { useChatStore } from '../stores/chatStore';
import { websocketClient } from '../services/websocketClient';

interface ChatPanelContainerProps {
  title?: string;
  showCostInfo?: boolean;
  testId?: string;
}

const ChatPanelContainerComponent = ({
  title = 'DrBot Chat',
  showCostInfo = true,
  testId = 'chat-panel-container'
}: ChatPanelContainerProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const { setSdkStatus, setError: setStoreError } = useChatStore();

  // Initialize ChatService on mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Check SDK status
        const status = await chatService.getStatus();
        setSdkStatus(status);

        if (!status.sdkAvailable) {
          setInitError(status.errorMessage || 'Chat SDK is not available');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize chat';
        console.error('[ChatPanelContainer] Initialization error:', error);
        setInitError(errorMessage);
        setStoreError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    // Initialize on mount
    initializeChat();

    // Setup WebSocket event listeners for chat events
    const handleConnect = () => {
      // Re-check status when reconnected
      chatService.getStatus().catch(error => {
        console.error('[ChatPanelContainer] Status check failed after reconnect:', error);
      });
    };

    const handleDisconnect = () => {
      setStoreError('Connection lost. Reconnecting...');
    };

    // Listen for connection changes
    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);

    // Cleanup on unmount - pass specific handlers to off()
    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
    };
  }, [setSdkStatus, setStoreError]);

  // Show initialization state
  if (isInitializing) {
    return (
      <div
        className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg"
        data-testid={testId}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400 mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Initializing chat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show initialization error with clean alert
  if (initError) {
    return (
      <div
        className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg"
        data-testid={testId}
      >
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                    Chat Unavailable
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {initError}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wrap ChatPanel with error boundary to catch rendering errors
  return (
    <ChatPanelErrorBoundary>
      <ChatPanel
        title={title}
        showCostInfo={showCostInfo}
        testId={testId}
      />
    </ChatPanelErrorBoundary>
  );
};

ChatPanelContainerComponent.displayName = 'ChatPanelContainer';

export const ChatPanelContainer = memo(ChatPanelContainerComponent);
