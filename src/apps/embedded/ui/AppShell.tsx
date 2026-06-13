/**
 * AppShell — the 5-pane flex frame.
 *
 *   column [ Topbar 54px ]
 *          [ row: LeftRail 244px | Canvas flex:1 | Inspector 320px (+ chat slot) ]
 *          [ StatusBar 28px ]
 *
 * Full 100vh, min-width 880px. The dark shell consumes Heimdall shell tokens
 * (`rgb(var(--shell-*))`); the canvas + inspector consume canvas tokens so the
 * `.dark-canvas` toggle flips them. Canvas + Inspector are empty placeholders in
 * this phase (a PageHeader stub lives in the canvas); graph + inspector content
 * arrive in Phase 2, chat in Phase 5.
 */

import { useEffect } from 'react';
import { PageHeader } from '@tinkermonkey/heimdall-ui';
import { Topbar } from './Topbar';
import { LeftRail } from './LeftRail';
import { StatusBar } from './StatusBar';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import { useUiStore } from './uiStore';
import { layerColor, layerLabel, layerStandard } from './domain';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';

/** Canvas placeholder — PageHeader stub + empty graph region (Phase 2 fills it). */
function CanvasPlaceholder() {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const { derived: model } = useModel();
  const { derived: spec } = useSpec();

  const slug = layerId ?? '';
  const label = layerId ? layerLabel(layerId) : 'Model';
  const standard = spec.byLayer[slug]?.standard || layerStandard(slug);
  const elementCount = layerId ? model.countsByLayer[slug] ?? 0 : model.nodes.length;

  const eyebrowText =
    view === 'spec'
      ? `META-MODEL${standard ? ` · ${standard}` : ''}`
      : `INSTANCE MODEL${standard ? ` · ${standard}` : ''}`;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'rgb(var(--canvas-bg))',
        borderTopLeftRadius: 8,
        overflow: 'hidden',
      }}
      data-testid="canvas"
    >
      <PageHeader
        style={{ flex: 'none', padding: '16px 22px 14px' }}
        eyebrow={
          <>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                flex: 'none',
                background: layerColor(slug),
                display: 'inline-block',
              }}
            />
            <span>{eyebrowText}</span>
          </>
        }
        title={label}
        idChip={layerId ?? view}
        actions={
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              color: 'rgb(var(--canvas-fg-3))',
            }}
          >
            {elementCount} elements
          </span>
        }
      />
      {/* graph region placeholder — Phase 2 renders <GraphCanvas> here */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }} />
    </div>
  );
}

/** Inspector placeholder — empty 320px pane (Phase 2 renders GraphInspector). */
function InspectorPlaceholder() {
  return (
    <div
      style={{
        width: 320,
        flex: 'none',
        borderLeft: '1px solid rgb(var(--canvas-border))',
        background: 'rgb(var(--canvas-surface))',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      data-testid="inspector"
    />
  );
}

/** Default layer to open on first load (mirrors the design's initial state). */
const DEFAULT_LAYER = 'data-model';

/**
 * Seed an initial layer + element selection once the model loads, so the Model
 * view renders a populated graph + inspector instead of an empty prompt. Prefers
 * the design's default layer, falling back to the first populated layer.
 */
function useDefaultSelection() {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const { derived: model } = useModel();

  useEffect(() => {
    if (view !== 'model' || layerId || model.nodes.length === 0) return;
    const layer =
      model.nodesByLayer[DEFAULT_LAYER]?.length
        ? DEFAULT_LAYER
        : Object.keys(model.nodesByLayer)[0];
    if (!layer) return;
    const first = model.nodesByLayer[layer]?.[0];
    if (first) navigateToElement(first.id, layer);
  }, [view, layerId, model, navigateToElement]);
}

export function AppShell() {
  const view = useUiStore((s) => s.view);
  const isModel = view === 'model';

  useDefaultSelection();

  return (
    <div
      style={{
        height: '100vh',
        minWidth: 880,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgb(var(--shell-bg))',
        color: 'rgb(var(--shell-fg-1))',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
      data-testid="app-shell"
    >
      <Topbar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          position: 'relative',
        }}
      >
        <LeftRail />
        {/* Model view: live graph + inspector. Spec/Changesets: Phase 3/4 placeholders. */}
        {isModel ? <Canvas /> : <CanvasPlaceholder />}
        {isModel ? <Inspector /> : <InspectorPlaceholder />}
        {/* ChatDrawer slot — Phase 5 */}
      </div>
      <StatusBar />
    </div>
  );
}

export default AppShell;
