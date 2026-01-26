import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches React rendering errors and displays a fallback UI instead of crashing the entire app.
 * Wraps components that might throw during render (e.g., custom nodes/edges).
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <MotivationGraphView />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static displayName = 'ErrorBoundary';

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console for debugging
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided, otherwise default error message
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-testid="error-boundary"
          className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-gray-900"
        >
          <div className="w-full max-w-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="m-0 mb-3 text-lg font-semibold text-red-900 dark:text-red-300">
              Rendering Error
            </h3>
            <p className="m-0 mb-4 text-sm text-red-800 dark:text-red-400 leading-relaxed">
              An error occurred while rendering the visualization. This could be due to invalid node/edge data or a component rendering issue.
            </p>
            {this.state.error && (
              <details className="text-sm text-red-800 dark:text-red-400 mb-4">
                <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                <pre className="bg-white dark:bg-gray-800 p-3 rounded text-xs overflow-auto font-mono m-0 max-h-48 border border-red-200 dark:border-red-700">
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white text-sm font-medium rounded cursor-pointer transition-colors mt-4"
              data-testid="error-boundary-retry"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
