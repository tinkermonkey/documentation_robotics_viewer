import { Story } from '@ladle/react';
import { useState } from 'react';
import { ChatPanel } from '@/apps/embedded/components/ChatPanelContainer';

/**
 * ChatPanelContainer Stories
 *
 * Note: These stories show the ChatPanel component directly to avoid
 * the 30-second timeout that occurs when ChatPanelContainer tries to
 * connect to the chat service in the story environment.
 *
 * For error state demonstration, we show a mock error display.
 */

export const Default: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanel title="DrBot Chat" showCostInfo={true} testId="chat-panel-container" />
  </div>
);

export const WithCustomTitle: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanel title="Architecture Assistant" showCostInfo={true} testId="chat-panel-container" />
  </div>
);

export const WithoutCostInfo: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanel title="DrBot Chat" showCostInfo={false} testId="chat-panel-container" />
  </div>
);

export const WithCustomTestId: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanel title="DrBot Chat" showCostInfo={true} testId="custom-chat-panel" />
  </div>
);

export const AllCustomProps: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanel
      title="Custom Chat"
      showCostInfo={false}
      testId="all-custom"
    />
  </div>
);

/**
 * Error State - Demonstrates what the error display looks like
 * when chat service connection fails
 */
export const ErrorState: Story = () => (
  <div style={{ height: '500px' }}>
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0 -1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414 -1.414L11.414 10l1.293 -1.293a1 1 0 0 0 -1.414 -1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                  Chat Unavailable
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Failed to connect to chat service. Please check your connection and try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
