// @vitest-environment happy-dom
/**
 * PillNode.spec.tsx — the pill-style graph node (GraphCanvas's `renderNode`,
 * see Canvas.tsx's `renderPillNode`), used for Model pill display AND always
 * in Schema view. Covers the `NodeTypeBadge` tooltip wiring (both the direct
 * `kind`-as-typeId case and Schema view's explicit `typeId` override) plus
 * accessibility parity with the default pill GraphNode.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import { PillNode } from '@/apps/embedded/ui/PillNode';
import type { SpecPayload } from '@/apps/embedded/data/specGraph';

const NODE_ID = 'node-1';

function buildSpec(): SpecPayload {
  return {
    schemas: {
      'application.json': {
        layer: { id: 'application' },
        nodeSchemas: {
          component: { title: 'Application Component', description: 'A modular unit.' },
        },
        relationshipSchemas: {},
      },
    },
  } as unknown as SpecPayload;
}

describe('PillNode — kind label NodeTypeTooltip', () => {
  it('shows the NodeTypeTooltip on hover using kind as the type id (Model pill mode)', () => {
    render(
      <PillNode
        id={NODE_ID}
        label="Auth Service"
        kind="component"
        domainColor="application"
        spec={buildSpec()}
      />,
    );

    fireEvent.focus(screen.getByText('component'));
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('Application Component')).toBeInTheDocument();
    expect(within(tooltip).getByText('A modular unit.')).toBeInTheDocument();
  });

  it('shows the NodeTypeTooltip using an explicit typeId override (Schema view)', () => {
    render(
      <PillNode
        id="application.component"
        label="Application Component"
        kind="spec node"
        domainColor="application"
        spec={buildSpec()}
        typeId="component"
      />,
    );

    fireEvent.focus(screen.getByText('spec node'));
    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText('Application Component')).toBeInTheDocument();
    expect(within(tooltip).getByText('A modular unit.')).toBeInTheDocument();
  });

  it('renders the plain kind label (no tooltip) when spec is not provided', () => {
    render(
      <PillNode id={NODE_ID} label="Auth Service" kind="component" domainColor="application" />,
    );

    fireEvent.focus(screen.getByText('component'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders no kind label at all when kind is omitted', () => {
    render(<PillNode id={NODE_ID} label="Auth Service" domainColor="application" />);
    expect(screen.queryByText('component')).not.toBeInTheDocument();
  });
});

describe('PillNode — selection + accessibility parity with the default GraphNode', () => {
  it('clicking the node calls onSelect with its id (and stops propagation)', () => {
    const onSelect = vi.fn();
    render(<PillNode id={NODE_ID} label="Auth Service" onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId(`pill-node-${NODE_ID}`));
    expect(onSelect).toHaveBeenCalledWith(NODE_ID);
  });

  it('is a keyboard-focusable button that activates on Enter/Space', () => {
    const onSelect = vi.fn();
    render(<PillNode id={NODE_ID} label="Auth Service" onSelect={onSelect} />);

    const node = screen.getByTestId(`pill-node-${NODE_ID}`);
    expect(node).toHaveAttribute('role', 'button');
    expect(node).toHaveAttribute('tabIndex', '0');
    expect(node).toHaveAttribute('aria-pressed', 'false');

    fireEvent.keyDown(node, { key: 'Enter', target: node, currentTarget: node });
    expect(onSelect).toHaveBeenCalledWith(NODE_ID);

    onSelect.mockClear();
    fireEvent.keyDown(node, { key: ' ', target: node, currentTarget: node });
    expect(onSelect).toHaveBeenCalledWith(NODE_ID);
  });

  it('reflects selected state via the "selected" class and aria-pressed', () => {
    render(<PillNode id={NODE_ID} label="Auth Service" onSelect={() => {}} selected />);

    const node = screen.getByTestId(`pill-node-${NODE_ID}`);
    expect(node).toHaveClass('graph-node', 'selected');
    expect(node).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no role/tabIndex when onSelect is not provided (read-only usage)', () => {
    render(<PillNode id={NODE_ID} label="Auth Service" />);
    const node = screen.getByTestId(`pill-node-${NODE_ID}`);
    expect(node).not.toHaveAttribute('role');
    expect(node).not.toHaveAttribute('tabIndex');
  });
});
