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
          data-error-boundary="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: 24,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 600,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 24,
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 18,
                fontWeight: 600,
                color: '#991b1b',
              }}
            >
              Rendering Error
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: 14,
                color: '#7f1d1d',
                lineHeight: 1.6,
              }}
            >
              An error occurred while rendering the visualization. This could be due to invalid node/edge data or a component rendering issue.
            </p>
            {this.state.error && (
              <details style={{ fontSize: 13, color: '#7f1d1d' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 500, marginBottom: 8 }}>
                  Error Details
                </summary>
                <pre
                  style={{
                    backgroundColor: '#fff',
                    padding: 12,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
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
