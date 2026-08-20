// @vitest-environment happy-dom
/**
 * PredicateTooltip.spec.tsx — the "edge" rich hover tooltip content variant
 * (ui/PredicateTooltip.tsx): predicate definition + a
 * source-type → predicate → destination-type diagram. Pure presentational,
 * rendered directly (no data hooks/store), focus opens the tooltip
 * immediately so these tests don't need fake timers.
 */

import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { PredicateTooltip } from '@/apps/embedded/ui/PredicateTooltip';

describe('PredicateTooltip', () => {
  it('renders the predicate name, its known definition, and the type diagram', () => {
    render(
      <PredicateTooltip
        predicate="depends-on"
        sourceTypeLabel="API Endpoint"
        destinationTypeLabel="Data Store"
      >
        <button>edge</button>
      </PredicateTooltip>,
    );

    fireEvent.focus(screen.getByText('edge'));

    const tooltip = screen.getByRole('tooltip');
    // "depends-on" appears twice: the card title and the diagram's predicate label.
    expect(within(tooltip).getAllByText('depends-on').length).toBe(2);
    expect(
      within(tooltip).getByText('Element requires another to function'),
    ).toBeInTheDocument();

    const diagram = screen.getByTestId('predicate-tooltip-diagram');
    expect(within(diagram).getByText('API Endpoint')).toBeInTheDocument();
    expect(within(diagram).getByText('Data Store')).toBeInTheDocument();
    expect(within(diagram).getAllByText('depends-on').length).toBeGreaterThan(0);
  });

  it('falls back to a generic message for an unrecognized predicate', () => {
    render(
      <PredicateTooltip
        predicate="not-a-real-predicate"
        sourceTypeLabel="Foo"
        destinationTypeLabel="Bar"
      >
        <button>edge</button>
      </PredicateTooltip>,
    );

    fireEvent.focus(screen.getByText('edge'));

    expect(
      screen.getByText('No definition available for this predicate.'),
    ).toBeInTheDocument();
    // The diagram still renders even without a known definition.
    const diagram = screen.getByTestId('predicate-tooltip-diagram');
    expect(within(diagram).getByText('Foo')).toBeInTheDocument();
    expect(within(diagram).getByText('Bar')).toBeInTheDocument();
  });
});
