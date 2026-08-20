// @vitest-environment happy-dom
/**
 * NodeTypeTooltip.spec.tsx — the "node type" rich hover tooltip content
 * variant (ui/NodeTypeTooltip.tsx): full specifier + definition, plus capped
 * inbound/outbound connection type lists. Pure presentational, rendered
 * directly (no data hooks/store); focus opens the tooltip immediately.
 */

import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { NodeTypeTooltip, type NodeTypeConnection } from '@/apps/embedded/ui/NodeTypeTooltip';

function connection(i: number, overrides: Partial<NodeTypeConnection> = {}): NodeTypeConnection {
  return {
    predicate: 'aggregates',
    typeLabel: `Type ${i}`,
    typeId: `data-model.type-${i}`,
    domain: 'data-model',
    ...overrides,
  };
}

describe('NodeTypeTooltip', () => {
  it('renders the specifier, title, and description', () => {
    render(
      <NodeTypeTooltip
        specifier="data-model.objectschema"
        title="Object Schema"
        description="A JSON Schema object definition."
        inbound={[]}
        outbound={[]}
      >
        <button>node-type</button>
      </NodeTypeTooltip>,
    );

    fireEvent.focus(screen.getByText('node-type'));

    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('Object Schema')).toBeInTheDocument();
    expect(within(tooltip).getByText('data-model.objectschema')).toBeInTheDocument();
    expect(
      within(tooltip).getByText('A JSON Schema object definition.'),
    ).toBeInTheDocument();
  });

  it('shows an empty-state message when a direction has no connection types', () => {
    render(
      <NodeTypeTooltip specifier="a.b" title="B" inbound={[]} outbound={[]}>
        <button>node-type</button>
      </NodeTypeTooltip>,
    );

    fireEvent.focus(screen.getByText('node-type'));

    expect(screen.getByTestId('node-type-tooltip-inbound')).toHaveTextContent(
      'No inbound connection types',
    );
    expect(screen.getByTestId('node-type-tooltip-outbound')).toHaveTextContent(
      'No outbound connection types',
    );
  });

  it('enumerates connections up to the cap with no overflow indicator when within it', () => {
    const inbound = [connection(1), connection(2), connection(3)];
    render(
      <NodeTypeTooltip specifier="a.b" title="B" inbound={inbound} outbound={[]} maxConnections={6}>
        <button>node-type</button>
      </NodeTypeTooltip>,
    );

    fireEvent.focus(screen.getByText('node-type'));

    const list = screen.getByTestId('node-type-tooltip-inbound');
    expect(within(list).getAllByText('Type 1', { exact: false })).toHaveLength(1);
    expect(within(list).getByText('Type 2')).toBeInTheDocument();
    expect(within(list).getByText('Type 3')).toBeInTheDocument();
    expect(
      screen.queryByTestId('node-type-tooltip-inbound-overflow'),
    ).not.toBeInTheDocument();
  });

  it('caps the connection list and folds the remainder into a "+N more" row', () => {
    const outbound = Array.from({ length: 9 }, (_, i) => connection(i));
    render(
      <NodeTypeTooltip specifier="a.b" title="B" inbound={[]} outbound={outbound} maxConnections={6}>
        <button>node-type</button>
      </NodeTypeTooltip>,
    );

    fireEvent.focus(screen.getByText('node-type'));

    const list = screen.getByTestId('node-type-tooltip-outbound');
    expect(within(list).getAllByRole('listitem')).toHaveLength(7); // 6 shown + 1 overflow row
    expect(screen.getByTestId('node-type-tooltip-outbound-overflow')).toHaveTextContent(
      '+3 more',
    );
  });
});
