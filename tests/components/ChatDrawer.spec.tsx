// @vitest-environment happy-dom
/**
 * ChatDrawer.spec.tsx — the floating DrBot panel and its Dock mode (#597).
 *
 * The four test case sketches of the `drbot-floating-panel` plan:
 *  - the panel steps left of an open Inspector drawer,
 *  - it takes the drawer's place when both don't fit (the drawer returns on close),
 *  - Escape inside closes it and returns focus to the launcher,
 *  - it resizes from its edge and docks as a column.
 *
 * Renders the REAL Topbar, Inspector (against MSW fixtures) and ChatDrawer around
 * a stand-in graph area registered with `useChatAnchor`. happy-dom has no
 * layout, so the area's rect is stubbed to the window sizes the design names.
 */

import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatDrawer } from '@/apps/embedded/ui/ChatDrawer';
import { Topbar } from '@/apps/embedded/ui/Topbar';
import { Inspector } from '@/apps/embedded/ui/Inspector';
import { useChatAnchor } from '@/apps/embedded/ui/chatAnchor';
import { PERSIST_KEY, useUiStore } from '@/apps/embedded/ui/uiStore';
import { useChatStore } from '@/apps/embedded/stores/chatStore';
import type { ChatMessage } from '@/apps/embedded/types/chat';
import { renderWithProviders } from '../helpers/renderWithProviders';

const DATA_LOADER_UUID = 'a5342d6f-daf4-4a6e-a98b-7fada2561798';
/** The nav rail's width: the graph area starts here. */
const RAIL = 244;
/** Topbar + page header: the graph area's top. */
const AREA_TOP = 140;

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  useChatAnchor(ref);
  return (
    <>
      <Topbar />
      <div ref={ref} data-testid="graph-area" tabIndex={-1} style={{ position: 'relative' }}>
        <Inspector />
      </div>
      <ChatDrawer />
    </>
  );
}

/** A window `windowWidth` wide: the graph area runs from the rail to the right edge. */
function stubWindow(windowWidth: number, windowHeight = 900) {
  window.innerWidth = windowWidth;
  window.innerHeight = windowHeight;
  const area = {
    top: AREA_TOP,
    left: RAIL,
    right: windowWidth,
    bottom: windowHeight - 28,
    width: windowWidth - RAIL,
    height: windowHeight - 28 - AREA_TOP,
    x: RAIL,
    y: AREA_TOP,
  };
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const r = this.dataset.testid === 'graph-area' ? area : { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
    return { ...r, toJSON: () => r } as DOMRect;
  });
  return area;
}

function selectElement() {
  act(() => {
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('application');
    useUiStore.getState().selectNode(DATA_LOADER_UUID);
  });
}

const panel = () => screen.getByRole('dialog', { name: 'DrBot' });
const px = (value: string) => Number.parseFloat(value);
const drawer = () => screen.getByTestId('inspector');

beforeEach(() => {
  localStorage.removeItem(PERSIST_KEY);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('drbot panel steps left of an open inspector drawer', () => {
  it('sits left of the drawer at 1440px, without reflowing the graph area', async () => {
    const area = stubWindow(1440);
    renderWithProviders(<Harness />);
    selectElement();
    await screen.findByTestId('inspector-title');

    await userEvent.click(screen.getByTestId('topbar-drbot-toggle'));

    const p = panel();
    expect(p).toHaveAttribute('aria-modal', 'false');
    expect(p).toHaveAttribute('data-placement', 'beside');
    // Its right edge is left of the 320px drawer (plus an 8px gap), below the header.
    expect(px(p.style.right)).toBe(320 + 8);
    expect(px(p.style.top)).toBe(AREA_TOP + 12);
    expect(px(p.style.width)).toBe(440);
    // The drawer stays open; the panel is outside the graph area's flow.
    expect(drawer()).toHaveClass('detail-drawer--open');
    expect(screen.getByTestId('graph-area')).not.toContainElement(p);
    expect(useUiStore.getState().chatCoversDrawer).toBe(false);
    // The panel never reaches the top-left gear or bottom-left toolbar: at least
    // 240px of graph stays on its left.
    const panelLeft = window.innerWidth - px(p.style.right) - px(p.style.width);
    expect(panelLeft - area.left).toBeGreaterThanOrEqual(240);
  });

  it('follows the drawer when it is resized', async () => {
    stubWindow(1440);
    renderWithProviders(<Harness />);
    selectElement();
    await screen.findByTestId('inspector-title');
    act(() => useUiStore.getState().openChat());
    act(() => useUiStore.getState().setInspectorWidth(400));
    expect(px(panel().style.right)).toBe(408);
  });
});

describe("drbot panel takes the drawer's place when both don't fit", () => {
  it('overlays the drawer at 1000px, never the nav rail, and the drawer returns on close', async () => {
    const area = stubWindow(1000);
    renderWithProviders(<Harness />);
    selectElement();
    await screen.findByTestId('inspector-title');
    expect(drawer()).toHaveClass('detail-drawer--open');

    act(() => useUiStore.getState().openChat());

    const p = panel();
    expect(p).toHaveAttribute('data-placement', 'over-drawer');
    expect(px(p.style.right)).toBe(12);
    const panelLeft = window.innerWidth - px(p.style.right) - px(p.style.width);
    expect(panelLeft).toBeGreaterThanOrEqual(area.left);
    await waitFor(() => expect(drawer()).not.toHaveClass('detail-drawer--open'));

    await userEvent.click(within(p).getByTestId('chat-close'));
    expect(screen.queryByRole('dialog', { name: 'DrBot' })).not.toBeInTheDocument();
    await waitFor(() => expect(drawer()).toHaveClass('detail-drawer--open'));
  });

  it('fills a graph area under 720px', () => {
    stubWindow(900);
    renderWithProviders(<Harness />);
    act(() => useUiStore.getState().openChat());
    const p = panel();
    expect(p).toHaveAttribute('data-placement', 'fill');
    expect(px(p.style.width)).toBe(900 - RAIL - 16);
  });
});

describe('escape inside the drbot panel closes it and returns focus to the launcher', () => {
  const TS = '2026-11-19T10:00:00.000Z';
  const message: ChatMessage = {
    id: 'u1',
    role: 'user',
    conversationId: 'c1',
    timestamp: TS,
    parts: [{ type: 'text', content: 'What serves the data loader?', timestamp: TS }],
  };

  it('focuses the composer on open, closes on Escape, keeps the thread', async () => {
    stubWindow(1440);
    renderWithProviders(<Harness />);
    act(() => useChatStore.setState({ messages: [message] }));
    const launcher = screen.getByTestId('topbar-drbot-toggle');

    await userEvent.click(launcher);
    const composer = within(panel()).getByRole('textbox');
    await waitFor(() => expect(composer).toHaveFocus());

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'DrBot' })).not.toBeInTheDocument();
    expect(launcher).toHaveFocus();
    expect(useUiStore.getState().chatOpen).toBe(false);

    await userEvent.click(launcher);
    expect(within(panel()).getByText('What serves the data loader?')).toBeInTheDocument();
  });

  it('Escape on the canvas does not close the panel', () => {
    stubWindow(1440);
    renderWithProviders(<Harness />);
    act(() => useUiStore.getState().openChat());
    fireEvent.keyDown(screen.getByTestId('graph-area'), { key: 'Escape' });
    expect(panel()).toBeInTheDocument();
  });
});

describe('drbot panel resizes from its edge and docks as a column', () => {
  it('resizes within 340–820px by keyboard and pointer, and persists the size', () => {
    stubWindow(1600);
    renderWithProviders(<Harness />);
    act(() => useUiStore.getState().openChat());
    const edge = screen.getByRole('separator', { name: 'Resize DrBot' });
    expect(edge).toHaveAttribute('aria-valuemin', '340');
    expect(edge).toHaveAttribute('aria-valuemax', '820');

    fireEvent.keyDown(edge, { key: 'ArrowLeft' });
    expect(useUiStore.getState().chatPanelSize.width).toBe(456);
    fireEvent.keyDown(edge, { key: 'ArrowRight', shiftKey: true });
    expect(useUiStore.getState().chatPanelSize.width).toBe(392);
    fireEvent.keyDown(edge, { key: 'Home' });
    expect(useUiStore.getState().chatPanelSize.width).toBe(340);
    fireEvent.keyDown(edge, { key: 'End' });
    expect(useUiStore.getState().chatPanelSize.width).toBe(820);

    // Dragging the edge leftward widens; past the limit it clamps.
    fireEvent.keyDown(edge, { key: 'Home' });
    fireEvent.pointerDown(edge, { button: 0, clientX: 1000, clientY: 300, pointerId: 1 });
    fireEvent.pointerMove(edge, { clientX: 900, clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(edge, { pointerId: 1 });
    expect(useUiStore.getState().chatPanelSize.width).toBe(440);

    // The corner also changes the height, never below 360px.
    const corner = screen.getByTestId('chat-panel-corner');
    fireEvent.pointerDown(corner, { button: 0, clientX: 1000, clientY: 600, pointerId: 2 });
    fireEvent.pointerMove(corner, { clientX: 1000, clientY: 100, pointerId: 2 });
    fireEvent.pointerUp(corner, { pointerId: 2 });
    expect(useUiStore.getState().chatPanelSize.height).toBe(360);

    const stored = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}');
    expect(stored.state.chatPanelSize).toEqual({ width: 440, height: 360 });
  });

  it('docks as a resizable column that collapses to a rail tab', async () => {
    stubWindow(1440);
    renderWithProviders(<Harness />);
    act(() => useUiStore.getState().openChat());

    await userEvent.click(screen.getByTestId('chat-dock'));
    const column = screen.getByRole('complementary', { name: 'DrBot' });
    expect(column).toHaveAttribute('data-mode', 'dock');
    expect(column.style.width).toBe('420px');

    const splitter = within(column).getByRole('separator', { name: 'Resize DrBot' });
    expect(splitter).toHaveAttribute('aria-valuemin', '320');
    expect(splitter).toHaveAttribute('aria-valuemax', '760');
    fireEvent.keyDown(splitter, { key: 'End' });
    expect(column.style.width).toBe('760px');

    await userEvent.click(within(column).getByTestId('chat-dock-collapse'));
    expect(screen.queryByRole('complementary', { name: 'DrBot' })).not.toBeInTheDocument();
    const rail = screen.getByTestId('chat-dock-rail');
    expect(screen.getByTestId('topbar-drbot-toggle')).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(rail);
    expect(screen.getByRole('complementary', { name: 'DrBot' })).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}');
    expect(stored.state).toMatchObject({ chatDocked: true, chatDockWidth: 760, chatDockCollapsed: false });

    // Float returns it over the canvas.
    await userEvent.click(screen.getByTestId('chat-undock'));
    expect(panel()).toHaveAttribute('data-mode', 'float');
  });
});
