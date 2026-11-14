// @vitest-environment happy-dom
/**
 * ErrorBoundary.spec.tsx — a render error in one part of the view shows an
 * alert in its place and leaves its siblings rendered (without a boundary,
 * React unmounts the whole viewer).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ErrorBoundary } from '@/apps/embedded/ui/ErrorBoundary';

function Boom(): never {
  throw new Error('Objects are not valid as a React child');
}

afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  it('shows what failed in place, and keeps the rest of the view', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <>
        <p>sibling</p>
        <ErrorBoundary what="this changeset's review">
          <Boom />
        </ErrorBoundary>
      </>,
    );
    expect(screen.getByText('sibling')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't show this changeset's review: Objects are not valid as a React child",
    );
  });

  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary what="x">
        <span>fine</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('gets a fresh try when its key changes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary key="a" what="x">
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(
      <ErrorBoundary key="b" what="x">
        <span>fine</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('fine')).toBeInTheDocument();
  });
});
