import React from 'react';

interface ChatPanelErrorBoundaryProps {
  children: React.ReactNode;
}

interface ChatPanelErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ChatPanelErrorBoundary Component
 *
 * Catches React rendering errors in ChatPanel and its sub-components.
 * Prevents a single chat error from crashing the entire application.
 *
 * Handles errors from:
 * - ChatPanel message rendering
 * - ChatMessage component errors
 * - ChatInput component errors
 * - Child component initialization failures
 *
 * Usage:
 * ```tsx
 * <ChatPanelErrorBoundary>
 *   <ChatPanelContainer />
 * </ChatPanelErrorBoundary>
 * ```
 */
export class ChatPanelErrorBoundary extends React.Component<
  ChatPanelErrorBoundaryProps,
  ChatPanelErrorBoundaryState
> {
  static displayName = 'ChatPanelErrorBoundary';

  constructor(props: ChatPanelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChatPanelErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console for debugging
    console.error('[ChatPanelErrorBoundary] Caught error:', error);
    console.error('[ChatPanelErrorBoundary] Error info:', errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col h-full bg-white dark:bg-gray-800 border rounded-lg p-6"
          data-testid="chat-panel-error-boundary"
          role="alert"
        >
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="max-w-md text-center">
              {/* Error Icon */}
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 0a9 9 0 11-9-9 9 9 0 019 9z"
                  />
                </svg>
              </div>

              {/* Error Message */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Chat Error
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                An error occurred in the chat component. Please try refreshing the page or clearing
                your browser cache.
              </p>

              {/* Error Details (Collapsible) */}
              {this.state.error && (
                <details className="mt-4 mb-4 text-left">
                  <summary className="cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-2">
                    Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
                    <p className="break-words mb-2">{this.state.error.toString()}</p>
                    {this.state.error.stack && (
                      <pre className="break-words text-xs">{this.state.error.stack}</pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white text-sm font-medium rounded transition-colors"
                  data-testid="chat-error-reset-button"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
                  data-testid="chat-error-reload-button"
                >
                  Reload Page
                </button>
              </div>

              {/* Support Message */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                If the problem persists, please check the browser console for more details or
                contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
