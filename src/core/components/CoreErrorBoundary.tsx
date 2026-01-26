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
          data-testid="core-error-boundary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: 24,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 500,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 16,
                fontWeight: 600,
                color: '#991b1b',
              }}
            >
              Graph Rendering Error
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: 16,
                fontSize: 13,
                color: '#7f1d1d',
                lineHeight: 1.6,
              }}
            >
              Failed to render the graph. This may be due to invalid node data, layout calculation errors, or a component rendering issue.
            </p>
            {this.state.error && (
              <details style={{ fontSize: 12, color: '#7f1d1d', marginBottom: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 500, marginBottom: 8 }}>
                  Error Details
                </summary>
                <pre
                  style={{
                    backgroundColor: '#fff',
                    padding: 10,
                    borderRadius: 4,
                    overflow: 'auto',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    margin: 0,
                    maxHeight: 150,
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid="core-error-boundary-retry"
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
