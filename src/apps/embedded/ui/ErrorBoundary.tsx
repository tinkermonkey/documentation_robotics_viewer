/**
 * ErrorBoundary — keeps a render error in one part of the view from blanking
 * the whole viewer (React unmounts the entire tree on an uncaught error).
 * Shows a short alert in place of the failed part instead. Used around the
 * parts that render payloads people can hand-edit or an unexpected server can
 * shape: the changeset review panel, the change inspector and the Tier 1
 * panel. Give it a `key` that changes with what it shows (e.g. the changeset
 * id) so a different payload gets a fresh try.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** What failed, for the message: "this changeset's review". */
  what: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[viewer] couldn't show ${this.props.what}:`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="drv-alert" data-testid="error-boundary">
          Couldn&apos;t show {this.props.what}: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
