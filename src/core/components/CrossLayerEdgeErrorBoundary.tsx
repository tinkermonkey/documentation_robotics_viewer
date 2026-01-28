/**
 * Cross-Layer Edge Error Boundary Component
 *
 * Protects the React Flow graph from crashes caused by errors in cross-layer edge
 * rendering. Catches and displays user-friendly error messages while preventing
 * the entire application from crashing.
 *
 * This error boundary specifically handles:
 * - Null/undefined edge data rendering errors
 * - Path calculation failures (getBezierPath errors)
 * - Navigation promise rejection errors
 * - Label rendering errors
 * - Any runtime errors within edge component trees
 */

import React, { ReactNode } from 'react';
import { useCrossLayerStore } from '../stores/crossLayerStore';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackUI?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary Component for Cross-Layer Edges
 *
 * Catches errors during rendering of cross-layer edge components and displays
 * a user-friendly fallback UI. Logs errors for debugging and stores critical
 * errors in the cross-layer store for UI consumption.
 *
 * @param props - Component props with children and optional fallback UI
 * @returns JSX element with error handling
 */
export class CrossLayerEdgeErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private storeSetError: ((error: any) => void) | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Increment error counter to track recurring errors
    this.setState((state) => ({
      errorCount: state.errorCount + 1,
    }));

    // Log error details for debugging
    console.error(
      '[CrossLayerEdgeErrorBoundary] Error caught:',
      {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorCount: this.state.errorCount + 1,
      }
    );

    // Determine if this is a critical error that needs UI notification
    const isCritical = this.shouldNotifyUI(error);

    if (isCritical) {
      // Get the store's setLastError action
      const state = useCrossLayerStore.getState();
      state.setLastError({
        message: `Critical error rendering cross-layer edges: ${error.message}`,
        timestamp: Date.now(),
        type: 'extraction_error',
      });
    }
  }

  /**
   * Determine if an error is critical and should be displayed to the user
   * Critical errors are those that prevent entire sections from rendering
   */
  private shouldNotifyUI(error: Error): boolean {
    const criticalKeywords = [
      'Cannot read',
      'Cannot set',
      'is not a function',
      'Cannot convert',
      'Unexpected token',
    ];

    return criticalKeywords.some((keyword) =>
      error.message.includes(keyword)
    );
  }

  /**
   * Reset error boundary state - called when user dismisses the error
   */
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    });

    // Clear error from store
    const state = useCrossLayerStore.getState();
    state.clearLastError();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided, otherwise use default
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      // Default fallback UI
      return (
        <div
          className="flex flex-col items-center justify-center p-8 bg-red-50 border-2 border-red-200 rounded-lg m-4"
          role="alert"
          aria-live="assertive"
          data-testid="cross-layer-edge-error-boundary"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Rendering Cross-Layer Connections
            </h3>

            <p className="text-sm text-red-700 mb-4 max-w-md">
              {this.state.error?.message ||
                'An unexpected error occurred while rendering cross-layer edges'}
            </p>

            {this.state.errorCount > 1 && (
              <p className="text-xs text-red-600 mb-4">
                This error has occurred {this.state.errorCount} times.
                {this.state.errorCount > 5 &&
                  ' Please refresh the page if the problem persists.'}
              </p>
            )}

            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
              aria-label="Reset cross-layer edge rendering"
            >
              Try Again
            </button>
          </div>

          {/* Development-only error details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 w-full max-w-lg">
              <summary className="text-xs text-red-600 cursor-pointer font-medium">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-48 text-red-900">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
