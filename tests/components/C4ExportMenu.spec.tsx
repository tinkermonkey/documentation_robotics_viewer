// @vitest-environment happy-dom
/**
 * C4ExportMenu.spec.tsx — the Architecture view's Export menu over the MSW
 * model fixture: a keyboard menu of the four formats, disabled until the
 * diagram is laid out, each item a download named after the diagram holding
 * what is drawn, and a status line saying what happened. The layout is a
 * stand-in grid held back until the test lets it go; the PNG rasteriser
 * (a browser canvas) is stubbed.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import type { C4View } from '@/apps/embedded/data/c4/c4Views';
import type { C4Layout } from '@/apps/embedded/data/c4/c4Layout';

const gate = vi.hoisted(() => {
  let open: () => void = () => {};
  const state = { ready: Promise.resolve() as Promise<void> };
  return {
    state,
    hold() {
      state.ready = new Promise<void>((resolve) => (open = resolve));
    },
    release: () => open(),
  };
});

vi.mock('@/apps/embedded/data/c4/c4Layout', async (original) => {
  const actual = await original<typeof import('@/apps/embedded/data/c4/c4Layout')>();
  return {
    ...actual,
    layoutC4View: async (view: C4View): Promise<C4Layout> => {
      await gate.state.ready;
      const boxes = new Map<string, { x: number; y: number; width: number; height: number }>();
      view.elements.forEach((e, i) => boxes.set(e.id, { x: 40 + (i % 6) * 280, y: 60 + Math.floor(i / 6) * 160, ...actual.C4_CARD }));
      return {
        width: 1800,
        height: 200 + Math.ceil(view.elements.length / 6) * 160,
        boxes,
        boundary: view.scope ? { x: 20, y: 20, width: 1760, height: 120 } : null,
        edges: view.relationships.map((r) => ({ id: r.id, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] })),
      };
    },
  };
});

const png = vi.hoisted(() => vi.fn(async () => new Blob(['png'], { type: 'image/png' })));
vi.mock('@/apps/embedded/data/c4/c4Export', async (original) => ({
  ...(await original<typeof import('@/apps/embedded/data/c4/c4Export')>()),
  toPng: png,
}));

import { ArchitectureCanvas } from '@/apps/embedded/ui/ArchitectureCanvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { buildC4Model, C4_SYSTEM_ID } from '@/apps/embedded/data/c4/c4Model';
import { buildC4View } from '@/apps/embedded/data/c4/c4Views';
import type { ModelPayload } from '@/apps/embedded/data/useModel';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { derive } from '../unit/c4/fixture';
import modelFixture from '../fixtures/model.json';

const payload = modelFixture as unknown as ModelPayload;
const c4 = buildC4Model(derive(payload.nodes, payload.links));
const containers = buildC4View(c4, 'container', C4_SYSTEM_ID);

/** Every download: its file name and contents. */
let downloads: { name: string; blob: Blob }[] = [];
beforeEach(() => {
  downloads = [];
  const blobs = new Map<string, Blob>();
  let n = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    const url = `blob:test/${n++}`;
    blobs.set(url, blob as Blob);
    return url;
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push({ name: this.download, blob: blobs.get(this.getAttribute('href') ?? '')! });
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  png.mockClear();
});

const trigger = () => screen.getByTestId('row-menu-trigger');
const item = (id: string) => screen.getByTestId(`row-menu-action-${id}`);

async function renderContainers() {
  renderWithProviders(<ArchitectureCanvas />);
  act(() => useUiStore.getState().showC4('container'));
  await waitFor(() => expect(screen.getByTestId('c4-export')).toBeInTheDocument());
}

describe('C4 export menu', () => {
  it('offers the four formats, all disabled until the diagram is laid out', async () => {
    gate.hold();
    await renderContainers();
    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    const items = screen.getAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['SVG image', 'PNG image (2x)', 'Structurizr DSL', 'C4-PlantUML']);
    for (const i of items) expect(i).toBeDisabled();

    act(() => gate.release());
    await screen.findByTestId('c4-diagram');
    await waitFor(() => expect(item('svg')).not.toBeDisabled());
  });

  it('downloads an SVG named after the diagram, holding exactly the drawn boxes', async () => {
    await renderContainers();
    await screen.findByTestId('c4-diagram');
    fireEvent.click(trigger());
    fireEvent.click(item('svg'));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].name).toBe('container-software-system.svg');
    expect(downloads[0].blob.type).toBe('image/svg+xml');
    const svg = await downloads[0].blob.text();
    expect(svg.match(/data-c4="card"/g)).toHaveLength(containers.elements.length);
    await waitFor(() => expect(screen.getByTestId('c4-export-status')).toHaveTextContent('Downloaded container-software-system.svg'));
    // The menu closes after a choice.
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('downloads the text formats and a 2x PNG', async () => {
    await renderContainers();
    await screen.findByTestId('c4-diagram');
    for (const id of ['structurizr', 'plantuml', 'png']) {
      fireEvent.click(trigger());
      fireEvent.click(item(id));
      await waitFor(() => expect(screen.getByTestId('c4-export-status').textContent).toMatch(new RegExp(`\\.${{ structurizr: 'dsl', plantuml: 'puml', png: 'png' }[id]}$`)));
    }
    expect(downloads.map((d) => d.name)).toEqual(['container-software-system.dsl', 'container-software-system.puml', 'container-software-system.png']);
    expect(await downloads[0].blob.text()).toMatch(/^workspace /);
    expect(await downloads[1].blob.text()).toMatch(/^@startuml/);
    expect(png).toHaveBeenCalledWith(expect.stringContaining('<svg'), expect.any(Number), expect.any(Number), 2);
  });

  it('says so when an export fails, and downloads nothing', async () => {
    png.mockRejectedValueOnce(new Error('no canvas'));
    await renderContainers();
    await screen.findByTestId('c4-diagram');
    fireEvent.click(trigger());
    fireEvent.click(item('png'));
    await waitFor(() =>
      expect(screen.getByTestId('c4-export-status')).toHaveTextContent("Couldn't export container-software-system.png: no canvas"),
    );
    expect(downloads).toHaveLength(0);
  });

  it('is operated from the keyboard: the trigger opens it and arrows move between the items', async () => {
    await renderContainers();
    await screen.findByTestId('c4-diagram');
    trigger().focus();
    fireEvent.click(trigger());
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('menuitem'));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });
});
