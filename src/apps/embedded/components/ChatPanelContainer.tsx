/**
 * ChatPanelContainer Component
 * Wrapper for ChatPanel that handles initialization and lifecycle
 * Manages WebSocket connection, SDK status checking, and event listeners
 */

import { useEffect, useState } from 'react';
import { ChatPanel } from './ChatPanel';
import { chatService } from '../services/chatService';
import { useChatStore } from '../stores/chatStore';
import { websocketClient } from '../services/websocketClient';

interface ChatPanelContainerProps {
  title?: string;
  showCostInfo?: boolean;
  testId?: string;
}

export const ChatPanelContainer = ({
  title = 'DrBot Chat',
  showCostInfo = true,
  testId = 'chat-panel-container'
}: ChatPanelContainerProps) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const { setSdkStatus, setError: setStoreError, reset: resetChat } = useChatStore();

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
    const handleConnectionChange = (connected: boolean) => {
      if (!connected) {
        setStoreError('Connection lost. Reconnecting...');
      } else {
        // Re-check status when reconnected
        chatService.getStatus().catch(error => {
          console.error('[ChatPanelContainer] Status check failed after reconnect:', error);
        });
      }
    };

    // Listen for connection changes
    websocketClient.on('connect', () => handleConnectionChange(true));
    websocketClient.on('disconnect', () => handleConnectionChange(false));

    // Cleanup on unmount
    return () => {
      websocketClient.off('connect');
      websocketClient.off('disconnect');
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

  // Show initialization error (but still render ChatPanel for user feedback)
  return (
    <>
      {initError && !initError.includes('not available') && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-semibold">Warning:</span> {initError}
          </p>
        </div>
      )}
      <ChatPanel
        title={title}
        showCostInfo={showCostInfo}
        testId={testId}
      />
    </>
  );
};

ChatPanelContainer.displayName = 'ChatPanelContainer';
