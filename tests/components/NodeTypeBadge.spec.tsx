// @vitest-environment happy-dom
/**
 * NodeTypeBadge.spec.tsx — the shared `NodeTypeTooltip` trigger wrapper
 * (ui/NodeTypeBadge.tsx) reused by `ModelCardNode`/`Inspector`/`EdgeInspector`/
 * `PageView`. Pure presentational, rendered directly with a hand-built
 * `SpecPayload` (no data hooks/store).
 */

import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { NodeTypeBadge } from '@/apps/embedded/ui/NodeTypeBadge';
import type { SpecPayload } from '@/apps/embedded/data/specGraph';

function buildSpec(): SpecPayload {
  return {
    schemas: {
      'data-model.json': {
        layer: { id: 'data-model' },
        nodeSchemas: {
          objectschema: { title: 'Object Schema', description: 'A JSON Schema object.' },
          arrayschema: { title: 'Array Schema' },
        },
        relationshipSchemas: {
          'data-model.objectschema.aggregates.data-model.arrayschema': {
            id: 'data-model.objectschema.aggregates.data-model.arrayschema',
            source_spec_node_id: 'data-model.objectschema',
            source_layer: 'data-model',
            destination_spec_node_id: 'data-model.arrayschema',
            destination_layer: 'data-model',
            predicate: 'aggregates',
          },
        },
      },
    },
  } as unknown as SpecPayload;
}

describe('NodeTypeBadge', () => {
  it('wraps the trigger in a NodeTypeTooltip resolved from the spec', () => {
    render(
      <NodeTypeBadge spec={buildSpec()} layerId="data-model" typeId="objectschema">
        <span tabIndex={0}>objectschema</span>
      </NodeTypeBadge>,
    );

    fireEvent.focus(screen.getByText('objectschema'));

    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('Object Schema')).toBeInTheDocument();
    expect(within(tooltip).getByText('data-model.objectschema')).toBeInTheDocument();
    expect(within(tooltip).getByText('A JSON Schema object.')).toBeInTheDocument();
    // The outbound "aggregates" connection to Array Schema is included.
    expect(within(tooltip).getByText('aggregates')).toBeInTheDocument();
    expect(within(tooltip).getByText('Array Schema')).toBeInTheDocument();
  });

  it('renders the trigger unwrapped (no tooltip) when the type is unknown to the spec', () => {
    render(
      <NodeTypeBadge spec={buildSpec()} layerId="data-model" typeId="not-a-real-type">
        <span tabIndex={0}>not-a-real-type</span>
      </NodeTypeBadge>,
    );

    fireEvent.focus(screen.getByText('not-a-real-type'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders the trigger unwrapped when spec is undefined', () => {
    render(
      <NodeTypeBadge spec={undefined} layerId="data-model" typeId="objectschema">
        <span tabIndex={0}>objectschema</span>
      </NodeTypeBadge>,
    );

    fireEvent.focus(screen.getByText('objectschema'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
