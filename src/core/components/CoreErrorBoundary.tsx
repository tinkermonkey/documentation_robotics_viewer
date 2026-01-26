import React from 'react';

interface CoreErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface CoreErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * CoreErrorBoundary Component
 *
 * Framework-agnostic error boundary for core components.
 * Catches React rendering errors from custom nodes, edges, and layout engines.
 *
 * Usage:
 * ```tsx
 * <CoreErrorBoundary fallback={<div>Graph rendering failed</div>}>
 *   <GraphViewerInner model={model} />
 * </CoreErrorBoundary>
 * ```
 */
export class CoreErrorBoundary extends React.Component<CoreErrorBoundaryProps, CoreErrorBoundaryState> {
  constructor(props: CoreErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CoreErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[CoreErrorBoundary] Caught rendering error:', error);
    console.error('[CoreErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-testid="error-boundary"
          className="flex flex-col items-center justify-center w-full h-full p-6 bg-white dark:bg-gray-900"
        >
          <div className="w-full max-w-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5">
            <h3 className="m-0 mb-3 text-base font-semibold text-red-900 dark:text-red-300">
              Graph Rendering Error
            </h3>
            <p className="m-0 mb-4 text-sm text-red-800 dark:text-red-400 leading-relaxed">
              Failed to render the graph. This may be due to invalid node data, layout calculation errors, or a component rendering issue.
            </p>
            {this.state.error && (
              <details className="text-xs text-red-800 dark:text-red-400 mb-4">
                <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto font-mono m-0 max-h-36 border border-red-200 dark:border-red-700">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white text-sm font-medium rounded cursor-pointer transition-colors"
              data-testid="error-boundary-retry"
            >
              Retry Rendering
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

CoreErrorBoundary.displayName = 'CoreErrorBoundary';
