/**
 * ChatPanelErrorBoundary Component Stories
 *
 * Error boundary wrapper for ChatPanel that catches rendering errors
 * and prevents the chat component from crashing the entire application.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { ChatPanelErrorBoundary } from '@/apps/embedded/components/ChatPanelErrorBoundary';

const meta = {
  title: 'D Chat / ChatPanelErrorBoundary',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Healthy content - no errors
 * Shows the error boundary with healthy child content
 */
export const HealthyContent: Story = {
  render: () => (
    <div className="w-full max-w-md h-96">
      <ChatPanelErrorBoundary>
        <div
          className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg p-6"
          data-testid="chat-panel-healthy"
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md text-center">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Chat Ready
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The chat panel is working correctly and ready to use.
              </p>
            </div>
          </div>
        </div>
      </ChatPanelErrorBoundary>
    </div>
  ),
};


/**
 * With mock chat content
 * Shows the error boundary containing simulated chat messages
 */
export const WithMockContent: Story = {
  render: () => (
    <div className="w-full max-w-md h-96">
      <ChatPanelErrorBoundary>
        <div
          className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg"
          data-testid="chat-panel-with-content"
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              DrBot Chat
            </h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Assistant message */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-900 dark:text-white">
                    Hello! How can I help you with your architecture today?
                  </p>
                </div>
              </div>
            </div>

            {/* User message */}
            <div className="flex gap-2 justify-end">
              <div className="flex-1 max-w-xs">
                <div className="bg-blue-500 rounded-lg p-3">
                  <p className="text-sm text-white">
                    I need to understand the data flow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">
                Send
              </button>
            </div>
          </div>
        </div>
      </ChatPanelErrorBoundary>
    </div>
  ),
};

/**
 * Recovery demonstration
 * Shows that the error boundary can recover after an error occurs
 */
export const Recoverable: Story = {
  render: () => (
    <div className="w-full max-w-md h-auto">
      <ChatPanelErrorBoundary>
        <div
          className="p-6 bg-white dark:bg-gray-800 border rounded-lg"
          data-testid="chat-panel-recoverable"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Error Boundary Status
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This error boundary can catch and recover from rendering errors
            in the ChatPanel component tree.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs text-blue-700 dark:text-blue-300">
            When a child component throws an error, the boundary displays a fallback UI
            and allows the user to recover or retry.
          </div>
        </div>
      </ChatPanelErrorBoundary>
    </div>
  ),
};
