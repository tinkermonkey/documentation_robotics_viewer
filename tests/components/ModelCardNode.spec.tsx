// @vitest-environment happy-dom
/**
 * ModelCardNode.spec.tsx — the card-style Model graph node (GraphCanvas's
 * `renderNode`, see Canvas.tsx's `renderCardNode` + data/modelGraph.ts's
 * `nodesWithCardData`).
 *
 * A pure presentational component (no data hooks, no store) — rendered
 * directly with Testing Library, not `renderWithProviders`. Covers the three
 * inter-layer connection cases the acceptance criteria call out (0, some,
 * and more than the CARD_CROSS_LINK_CAP of 5) plus the keyboard/focus
 * accessibility parity with the default pill GraphNode.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import { ModelCardNode } from '@/apps/embedded/ui/ModelCardNode';
import type { CardData } from '@/apps/embedded/data/modelGraph';
import type { SpecPayload } from '@/apps/embedded/data/specGraph';

const NODE_ID = 'node-1';

function cardData(overrides: Partial<CardData> = {}): CardData {
  return {
    intraCount: 0,
    crossLinks: [],
    crossTotal: 0,
    ...overrides,
  };
}

describe('ModelCardNode — connection counts', () => {
  it('renders 0 inter-layer connections with no cross-links section', () => {
    render(
      <ModelCardNode
        id={NODE_ID}
        label="Auth Service"
        kind="component"
        domainColor="application"
        cardData={cardData({ intraCount: 3 })}
      />,
    );

    expect(screen.getByTestId(`model-card-intra-count-${NODE_ID}`)).toHaveTextContent(
      '3 intra-layer',
    );
    expect(screen.getByTestId(`model-card-cross-count-${NODE_ID}`)).toHaveTextContent(
      '0 inter-layer',
    );
    expect(screen.queryByTestId(`model-card-cross-links-${NODE_ID}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`model-card-overflow-${NODE_ID}`)).not.toBeInTheDocument();
  });

  it('enumerates some (<=5) inter-layer connections with no overflow indicator', () => {
    render(
      <ModelCardNode
        id={NODE_ID}
        label="Auth Service"
        kind="component"
        domainColor="application"
        cardData={cardData({
          intraCount: 2,
          crossTotal: 3,
          crossLinks: [
            { predicate: 'realizes', targetId: 't1', targetName: 'Login Flow', targetLayer: 'ux' },
            { predicate: 'secures', targetId: 't2', targetName: 'Token Policy', targetLayer: 'security' },
            { predicate: 'invokes', targetId: 't3', targetName: 'Token API', targetLayer: 'api' },
          ],
        })}
      />,
    );

    const list = screen.getByTestId(`model-card-cross-links-${NODE_ID}`);
    expect(list).toHaveTextContent('realizes · Login Flow');
    expect(list).toHaveTextContent('secures · Token Policy');
    expect(list).toHaveTextContent('invokes · Token API');
    expect(screen.getByTestId(`model-card-cross-count-${NODE_ID}`)).toHaveTextContent(
      '3 inter-layer',
    );
    expect(screen.queryByTestId(`model-card-overflow-${NODE_ID}`)).not.toBeInTheDocument();
  });

  it('caps enumeration at 5 and shows a "…" overflow indicator beyond that', () => {
    const crossLinks = Array.from({ length: 5 }, (_, i) => ({
      predicate: 'relates-to',
      targetId: `t${i}`,
      targetName: `Target ${i}`,
      targetLayer: 'api',
    }));

    render(
      <ModelCardNode
        id={NODE_ID}
        label="Auth Service"
        kind="component"
        domainColor="application"
        cardData={cardData({ intraCount: 1, crossTotal: 8, crossLinks })}
      />,
    );

    const list = screen.getByTestId(`model-card-cross-links-${NODE_ID}`);
    expect(list.querySelectorAll('.graph-node__cross-link')).toHaveLength(6); // 5 enumerated + overflow
    expect(screen.getByTestId(`model-card-cross-count-${NODE_ID}`)).toHaveTextContent(
      '8 inter-layer',
    );
    const overflow = screen.getByTestId(`model-card-overflow-${NODE_ID}`);
    expect(overflow).toHaveTextContent('…');
    expect(overflow).toHaveAttribute('aria-label', '3 more inter-layer connections');
  });

  it('renders with no cardData at all (defaults to zero counts, no cross-links)', () => {
    render(<ModelCardNode id={NODE_ID} label="Untracked Node" />);

    expect(screen.getByTestId(`model-card-intra-count-${NODE_ID}`)).toHaveTextContent(
      '0 intra-layer',
    );
    expect(screen.getByTestId(`model-card-cross-count-${NODE_ID}`)).toHaveTextContent(
      '0 inter-layer',
    );
  });
});

describe('ModelCardNode — kind badge NodeTypeTooltip (Phase 5)', () => {
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

  it('shows the NodeTypeTooltip on hover of the kind badge when the type resolves', () => {
    render(
      <ModelCardNode
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

  it('renders the plain kind badge (no tooltip) when spec is not provided', () => {
    render(
      <ModelCardNode
        id={NODE_ID}
        label="Auth Service"
        kind="component"
        domainColor="application"
      />,
    );

    fireEvent.focus(screen.getByText('component'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('ModelCardNode — selection + accessibility parity with the pill GraphNode', () => {
  it('clicking the card calls onSelect with its id (and stops propagation)', () => {
    const onSelect = vi.fn();
    render(<ModelCardNode id={NODE_ID} label="Auth Service" onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId(`model-card-node-${NODE_ID}`));
    expect(onSelect).toHaveBeenCalledWith(NODE_ID);
  });

  it('is a keyboard-focusable button that activates on Enter/Space', () => {
    const onSelect = vi.fn();
    render(<ModelCardNode id={NODE_ID} label="Auth Service" onSelect={onSelect} />);

    const card = screen.getByTestId(`model-card-node-${NODE_ID}`);
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-pressed', 'false');

    fireEvent.keyDown(card, { key: 'Enter', target: card, currentTarget: card });
    expect(onSelect).toHaveBeenCalledWith(NODE_ID);

    onSelect.mockClear();
    fireEvent.keyDown(card, { key: ' ', target: card, currentTarget: card });
    expect(onSelect).toHaveBeenCalledWith(NODE_ID);
  });

  it('reflects selected state via the "selected" class and aria-pressed', () => {
    render(<ModelCardNode id={NODE_ID} label="Auth Service" onSelect={() => {}} selected />);

    const card = screen.getByTestId(`model-card-node-${NODE_ID}`);
    expect(card).toHaveClass('graph-node--card', 'selected');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('has no role/tabIndex when onSelect is not provided (read-only usage)', () => {
    render(<ModelCardNode id={NODE_ID} label="Auth Service" />);
    const card = screen.getByTestId(`model-card-node-${NODE_ID}`);
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabIndex');
  });
});
