/**
 * C4ExportMenu — the Architecture view's Export control: the diagram on
 * screen as SVG, PNG, Structurizr DSL or C4-PlantUML, downloaded as a file
 * named after the diagram (`<level>-<scope>.<ext>`).
 *
 * The export holds exactly what is drawn: the view, its layout, and the marks
 * of an overlay or a comparison, resolved by `c4DiagramMarks.ts` as the
 * diagram resolves them. The images take the canvas's live colours, so a dark
 * canvas exports dark. Heimdall's `RowMenu` gives the keyboard menu; every
 * item is disabled until the diagram is laid out, and a polite status line
 * says what was downloaded (or why it wasn't).
 */

import { useState } from 'react';
import { Icon, RowMenu, type RowMenuAction } from '@tinkermonkey/heimdall-ui';
import {
  EXPORT_TOKENS,
  LIGHT_PALETTE,
  exportFileName,
  pngScale,
  svgSize,
  toPlantUml,
  toPng,
  toStructurizr,
  toSvg,
  tokenToHex,
  type C4ExportFormat,
  type C4ExportPalette,
} from '../data/c4/c4Export';
import type { C4Layout } from '../data/c4/c4Layout';
import type { C4Model } from '../data/c4/c4Model';
import type { C4View } from '../data/c4/c4Views';
import { toExportMarks, type C4DiagramMarkSource } from './c4DiagramMarks';

const FORMATS: { id: C4ExportFormat; label: string; type: string }[] = [
  { id: 'svg', label: 'SVG image', type: 'image/svg+xml' },
  { id: 'png', label: 'PNG image (2x)', type: 'image/png' },
  { id: 'structurizr', label: 'Structurizr DSL', type: 'text/plain' },
  { id: 'plantuml', label: 'C4-PlantUML', type: 'text/plain' },
];

/** The canvas's colours as the export draws them: the live tokens, else Heimdall's light canvas. */
export function readExportPalette(root: Element = document.body): C4ExportPalette {
  const style = getComputedStyle(root);
  const palette: Record<string, string> = { ...LIGHT_PALETTE };
  for (const token of EXPORT_TOKENS) {
    const hex = tokenToHex(style.getPropertyValue(token));
    if (hex) palette[token] = hex;
  }
  return palette;
}

/** Saves `blob` as `name` through a temporary link. */
export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL goes.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface C4ExportMenuProps {
  view: C4View;
  /** Null until the diagram is laid out: the menu's items are disabled. */
  layout: C4Layout | null;
  /** The C4 model the view was drawn from (Structurizr nests by its ancestors). */
  model: C4Model;
  marks: C4DiagramMarkSource;
}

export function C4ExportMenu({ view, layout, model, marks }: C4ExportMenuProps) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (format: C4ExportFormat) => {
    if (!layout || busy) return;
    const name = exportFileName(view, format);
    setBusy(true);
    // Clear the status first, so the same message after a repeat export is announced again.
    setStatus('');
    let message: string;
    try {
      const palette = readExportPalette();
      const exportMarks = toExportMarks(view, marks, (token) => palette[token] ?? LIGHT_PALETTE[token] ?? '#000000');
      const type = FORMATS.find((f) => f.id === format)!.type;
      let blob: Blob;
      let note = '';
      if (format === 'svg' || format === 'png') {
        const svg = toSvg(view, layout, exportMarks, palette);
        if (format === 'svg') blob = new Blob([svg], { type });
        else {
          const { width, height } = svgSize(layout);
          const scale = pngScale(width, height, 2);
          if (scale < 2) note = ` at ${scale}x (too large for 2x)`;
          blob = await toPng(svg, width, height, 2);
        }
      } else {
        const text = format === 'plantuml' ? toPlantUml(view, exportMarks) : toStructurizr(view, model, exportMarks);
        blob = new Blob([text], { type: `${type};charset=utf-8` });
      }
      downloadBlob(blob, name);
      message = `Downloaded ${name}${note}`;
    } catch (error) {
      message = `Couldn't export ${name}: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      setBusy(false);
    }
    // A moment after the clear, so a screen reader hears the new message.
    window.setTimeout(() => setStatus(message), 100);
  };

  const actions: RowMenuAction[] = FORMATS.map((f) => ({
    id: f.id,
    label: f.label,
    icon: 'download',
    disabled: !layout || busy,
  }));

  return (
    <div className="c4-export" data-testid="c4-export">
      <RowMenu
        actions={actions}
        onAction={(id) => void run(id as C4ExportFormat)}
        placement="bottom-end"
        triggerLabel={layout ? 'Export the diagram' : 'Export the diagram (once it is laid out)'}
        trigger={
          <span className="c4-export__trigger">
            <Icon name="download" size={14} aria-hidden="true" />
            <span>Export</span>
            <Icon name="chevronDown" size={12} aria-hidden="true" />
          </span>
        }
        data-testid="c4-export-menu"
      />
      <span className="heimdall-visually-hidden" role="status" aria-live="polite" data-testid="c4-export-status">
        {status}
      </span>
    </div>
  );
}

export default C4ExportMenu;
