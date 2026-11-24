/**
 * c4Export — the C4 diagram on screen, taken out of the viewer. Pure, except
 * `toPng` (it rasterises through the browser's canvas).
 *
 *  - `toSvg`: a self-contained SVG drawn from the laid-out view (not a DOM
 *    capture): boundary, cards, right-angle arrows and their labels, every
 *    colour and font inlined, and the marks the screen shows.
 *  - `toPlantUml`: C4-PlantUML (the C4 stdlib include for the level): people,
 *    systems, containers and components by kind, the scope as a boundary, an
 *    arrow per drawn relationship, marks as `$tags` with a legend.
 *  - `toStructurizr`: a Structurizr DSL workspace holding this diagram's
 *    elements, nested as Structurizr requires (components in a container,
 *    containers in the system), and ONE view of the level's kind that
 *    includes exactly the drawn elements; marks as tags with styles.
 *
 * Each holds exactly the boxes and arrows drawn: what the diagram leaves out
 * (outsiders past the cap, unplaced model elements) stays out. Identifiers are
 * made valid and unique per format, and text is escaped.
 *
 * Marks come in as C4 Export Marks, built by the UI from the same resolution
 * `C4Diagram` draws with (`ui/c4DiagramMarks.ts`), with colours resolved.
 */

import { C4_SYSTEM_ID, c4Ancestors, type C4Element, type C4Kind, type C4Model } from './c4Model';
import type { C4View, C4ViewElement } from './c4Views';
import { C4_CARD, c4EdgeLabel, type C4Layout } from './c4Layout';

export type C4LineStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'groove';

/** What a mark on a drawn box or arrow becomes in an export. */
export interface C4ExportMark {
  /** An overlay status (`added`) or a verdict (`v-missing`): the tag in the text formats. */
  status: string;
  glyph: string;
  /** The words, the first the chip's ("moved from Old Home"). */
  words: string[];
  /** The status's own words, the same for every box or arrow it marks ("moved"): a legend's. */
  legend: string;
  /** A CSS colour (`#rrggbb` or `rgb(…)`), null for no outline. */
  color: string | null;
  /** A card's outline style, null for none. */
  lineStyle: C4LineStyle | null;
  lineWidth: number;
  /** An arrow's dash pattern, null for solid. */
  dash: string | null;
}

export interface C4ExportMarks {
  /** View element id → its mark. */
  elements: ReadonlyMap<string, C4ExportMark>;
  /** View relationship id → its mark. */
  relationships: ReadonlyMap<string, C4ExportMark>;
  /** View element id → its roll-up chip ("3 changes inside"). */
  inside: ReadonlyMap<string, string>;
  /** Removed boxes drawn back as ghosts. */
  ghosts: ReadonlySet<string>;
}

export const NO_MARKS: C4ExportMarks = { elements: new Map(), relationships: new Map(), inside: new Map(), ghosts: new Set() };

/** The canvas colours an SVG is drawn in, by token (`--canvas-bg`), as CSS colours. */
export type C4ExportPalette = Readonly<Record<string, string>>;

/** The tokens an export reads; the UI resolves them from the live canvas. */
export const EXPORT_TOKENS = [
  '--canvas-bg',
  '--canvas-surface',
  '--canvas-card',
  '--canvas-border',
  '--canvas-fg-1',
  '--canvas-fg-2',
  '--canvas-fg-3',
  '--canvas-fg-4',
  '--accent-primary',
  '--status-violet',
  '--status-cyan',
  '--status-emerald',
  '--status-rose',
  '--status-amber',
] as const;

/** Heimdall's light canvas: the colours used when none are given. */
export const LIGHT_PALETTE: C4ExportPalette = {
  '--canvas-bg': '#ffffff',
  '--canvas-surface': '#ffffff',
  '--canvas-card': '#ffffff',
  '--canvas-border': '#e5e9ee',
  '--canvas-fg-1': '#0b1220',
  '--canvas-fg-2': '#475569',
  '--canvas-fg-3': '#64748b',
  '--canvas-fg-4': '#94a3b8',
  '--accent-primary': '#fbbf24',
  '--status-violet': '#8b5cf6',
  '--status-cyan': '#22d3ee',
  '--status-emerald': '#10b981',
  '--status-rose': '#f43f5e',
  '--status-amber': '#f59e0b',
};

/** A token's value as Heimdall writes it (`"244 63 94"` or `"244, 63, 94"`) as `#rrggbb`; null if it isn't one. */
export function tokenToHex(value: string): string | null {
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  const parts = v.replace(/^rgba?\(|\)$/g, '').split(/[\s,/]+/).filter(Boolean).slice(0, 3).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  return `#${parts.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
}

const KIND_LABELS: Record<C4Kind, string> = {
  person: 'Person',
  system: 'Software System',
  'external-system': 'External System',
  container: 'Container',
  component: 'Component',
};

/** The accent band per kind, as `c4-diagram.css` draws it. */
const KIND_ACCENT: Record<C4Kind, string> = {
  person: '--status-violet',
  system: '--accent-primary',
  container: '--status-cyan',
  component: '--status-emerald',
  'external-system': '--canvas-fg-4',
};

function kindLine(element: C4Element): string {
  return element.technology ? `${KIND_LABELS[element.kind]}: ${element.technology}` : KIND_LABELS[element.kind];
}

/** The diagram's title, as its accessible name says it. */
export function exportTitle(view: Pick<C4View, 'level' | 'scope'>): string {
  if (view.level === 'context') return 'System context diagram';
  return `${view.level === 'container' ? 'Container' : 'Component'} diagram of ${view.scope?.name ?? 'the system'}`;
}

export type C4ExportFormat = 'svg' | 'png' | 'structurizr' | 'plantuml';

export const EXPORT_EXTENSIONS: Record<C4ExportFormat, string> = {
  svg: 'svg',
  png: 'png',
  structurizr: 'dsl',
  plantuml: 'puml',
};

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      // Drop the accents NFKD split off, so "Résumé" reads "resume", not "re-sume".
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'diagram'
  );
}

/** `<level>-<scope>.<ext>`: `container-software-system.svg`, `component-graph-canvas.puml`. */
export function exportFileName(view: Pick<C4View, 'level' | 'scope'>, format: C4ExportFormat): string {
  const scope = view.level === 'context' ? 'system' : slug(view.scope?.name ?? 'system');
  return `${view.level}-${scope}.${EXPORT_EXTENSIONS[format]}`;
}

/* ---- SVG ------------------------------------------------------------------- */

/** Escapes text for XML content and attribute values. */
export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Characters XML 1.0 can't hold at all.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** Wraps `text` at words into at most `lines` lines of `chars`; the last ends in an ellipsis when text is left over. */
export function wrap(text: string, chars: number, lines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const out: string[] = [];
  let line = '';
  let i = 0;
  for (; i < words.length; i++) {
    const word = cut(words[i], chars);
    const next = line ? `${line} ${word}` : word;
    if (next.length <= chars) {
      line = next;
      continue;
    }
    out.push(line);
    line = word;
    if (out.length === lines) break;
  }
  if (out.length < lines && line) {
    out.push(line);
    i = words.length;
  }
  if (i < words.length && out.length > 0) {
    // One ellipsis: drop the one `cut` may already have put on the last line.
    const last = out[out.length - 1].replace(/…$/, '');
    out[out.length - 1] = `${last.slice(0, chars - 1).trimEnd()}…`;
  }
  return out;
}

function cut(text: string, chars: number): string {
  return text.length > chars ? `${text.slice(0, Math.max(0, chars - 1))}…` : text;
}

/** An outline style as SVG strokes: a dash pattern, and a second ring for `double`. */
function outlineStroke(style: C4LineStyle, width: number): { dash: string | null; double: boolean; width: number } {
  switch (style) {
    case 'dashed':
      return { dash: `${width * 3} ${width * 2}`, double: false, width };
    case 'dotted':
      return { dash: `${width} ${width * 1.5}`, double: false, width };
    case 'double':
      return { dash: null, double: true, width: 1 };
    default:
      return { dash: null, double: false, width };
  }
}

const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";
/** Room around the layout for the marks and chips that sit outside a card. */
const MARGIN = 24;

/**
 * The laid-out view as a standalone SVG document: what `C4Diagram` draws,
 * without the pan, zoom, selection or toolbar.
 */
export function toSvg(
  view: C4View,
  layout: C4Layout,
  marks: C4ExportMarks = NO_MARKS,
  palette: C4ExportPalette = LIGHT_PALETTE,
): string {
  const c = (token: string) => palette[token] ?? LIGHT_PALETTE[token] ?? '#000000';
  const width = Math.ceil(layout.width + MARGIN * 2);
  const height = Math.ceil(layout.height + MARGIN * 2);
  const title = exportTitle(view);
  const relOf = new Map(view.relationships.map((r) => [r.id, r]));
  const out: string[] = [];

  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${-MARGIN} ${-MARGIN} ${width} ${height}" role="img" aria-labelledby="c4-title">`,
    `<title id="c4-title">${xmlEscape(title)}</title>`,
    `<rect x="${-MARGIN}" y="${-MARGIN}" width="${width}" height="${height}" fill="${c('--canvas-bg')}"/>`,
  );

  // Arrowheads: plain, and one per marked colour.
  const markerIds = new Map<string, string>();
  const markerFor = (color: string | null) => {
    const key = color ?? c('--canvas-fg-3');
    let id = markerIds.get(key);
    if (!id) markerIds.set(key, (id = `c4-arrow-${markerIds.size}`));
    return id;
  };
  markerFor(null);
  for (const mark of marks.relationships.values()) if (mark.color) markerFor(mark.color);
  out.push('<defs>');
  for (const [color, id] of markerIds) {
    out.push(
      `<marker id="${id}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,4.5 L0,9 z" fill="${color}"/></marker>`,
    );
  }
  out.push('</defs>');

  if (layout.boundary && view.scope) {
    const b = layout.boundary;
    out.push(
      `<g data-c4="boundary"><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="10" fill="${c('--canvas-surface')}" fill-opacity="0.55" stroke="${c('--canvas-fg-3')}" stroke-width="1.25" stroke-dasharray="7 5"/>`,
      `<text x="${b.x + 16}" y="${b.y + 26}" font-family="${SANS}" font-size="13" font-weight="600" fill="${c('--canvas-fg-2')}">${xmlEscape(`${view.scope.name} [${KIND_LABELS[view.scope.kind]}]`)}</text></g>`,
    );
  }

  for (const edge of layout.edges) {
    const rel = relOf.get(edge.id);
    if (!rel) continue;
    const mark = marks.relationships.get(rel.id);
    const base = c4EdgeLabel(rel.labels, rel.count);
    const label = cut(mark ? `${mark.glyph} ${base}` : base, 28);
    const stroke = mark?.color ?? c('--canvas-fg-3');
    const dash = mark?.dash ? ` stroke-dasharray="${mark.dash}"` : '';
    const strokeWidth = mark?.color ? 2 : 1.25;
    out.push(
      `<g data-c4="edge" data-status="${xmlEscape(mark?.status ?? '')}"><title>${xmlEscape(mark ? `${base}: ${mark.words[0] ?? ''}` : base)}</title>`,
      `<polyline points="${edge.points.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"${dash} marker-end="url(#${markerFor(mark?.color ?? null)})"/>`,
    );
    if (edge.label && label) {
      const l = edge.label;
      out.push(
        `<rect x="${l.x}" y="${l.y}" width="${l.width}" height="${l.height}" rx="4" fill="${c('--canvas-bg')}" fill-opacity="0.92"/>`,
        `<text x="${l.x + l.width / 2}" y="${l.y + l.height / 2}" text-anchor="middle" dominant-baseline="central" font-family="${MONO}" font-size="10" fill="${c('--canvas-fg-2')}">${xmlEscape(label)}</text>`,
      );
    }
    out.push('</g>');
  }

  view.elements.forEach((item, index) => {
    const box = layout.boxes.get(item.id);
    if (box) out.push(svgCard(item, box, index, marks, c));
  });

  out.push('</svg>');
  return out.join('\n');
}

function svgCard(
  item: C4ViewElement,
  box: { x: number; y: number },
  index: number,
  marks: C4ExportMarks,
  c: (token: string) => string,
): string {
  const { element } = item;
  const { width: w, height: h } = C4_CARD;
  const { x, y } = box;
  const ghost = marks.ghosts.has(item.id);
  const mark = marks.elements.get(item.id);
  const inside = marks.inside.get(item.id);
  const datastore = element.shape === 'datastore';
  const rx = element.kind === 'person' ? 22 : datastore ? 14 : 8;
  const accent = c(KIND_ACCENT[element.kind]);
  const fill = !item.inScope || ghost ? c('--canvas-surface') : c('--canvas-card');
  const borderDash = ghost ? ' stroke-dasharray="1.5 2.5"' : !item.inScope ? ' stroke-dasharray="5 3"' : '';
  const parts: string[] = [
    `<g data-c4="card" data-c4-id="${xmlEscape(item.id)}" data-kind="${element.kind}"${mark ? ` data-status="${xmlEscape(mark.status)}"` : ''}${ghost ? ' opacity="0.7"' : ''}>`,
  ];
  const words = mark?.words ?? [];
  parts.push(`<title>${xmlEscape([element.name, kindLine(element), ...words, ...(inside ? [inside] : [])].join(', '))}</title>`);

  if (mark?.color && mark.lineStyle) {
    const o = outlineStroke(mark.lineStyle, mark.lineWidth || 2);
    const ring = (inset: number) =>
      `<rect x="${x - inset}" y="${y - inset}" width="${w + inset * 2}" height="${h + inset * 2}" rx="${rx + 4}" fill="none" stroke="${mark.color}" stroke-width="${o.width}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;
    parts.push(ring(7));
    if (o.double) parts.push(ring(4.5));
  }

  // The card, its accent band at the top (and at the bottom for a data store), clipped to its corners.
  const clip = `c4-clip-${index}`;
  parts.push(
    `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${c('--canvas-border')}" stroke-width="1"${borderDash}/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="4" fill="${accent}" clip-path="url(#${clip})"/>`,
  );
  if (datastore) parts.push(`<rect x="${x}" y="${y + h - 4}" width="${w}" height="4" fill="${accent}" clip-path="url(#${clip})"/>`);

  const textOpacity = ghost ? ' opacity="0.62"' : '';
  let ty = y + 22;
  const nameLines = wrap(element.name, 27, 2);
  for (const line of nameLines) {
    parts.push(`<text x="${x + 12}" y="${ty}" font-family="${SANS}" font-size="13" font-weight="600" fill="${c('--canvas-fg-1')}"${textOpacity}>${xmlEscape(line)}</text>`);
    ty += 16;
  }
  parts.push(`<text x="${x + 12}" y="${ty}" font-family="${MONO}" font-size="10" fill="${c('--canvas-fg-2')}"${textOpacity}>${xmlEscape(cut(`[${kindLine(element)}]`, 34))}</text>`);
  ty += 16;
  if (element.description) {
    const room = Math.max(1, Math.floor((y + h - 6 - ty) / 15) + 1);
    for (const line of wrap(element.description, 36, room)) {
      parts.push(`<text x="${x + 12}" y="${ty}" font-family="${SANS}" font-size="11" fill="${c('--canvas-fg-2')}"${textOpacity}>${xmlEscape(line)}</text>`);
      ty += 15;
    }
  }
  if (item.drillable && !ghost) {
    parts.push(`<text x="${x + w - 12}" y="${y + 22}" text-anchor="end" font-family="${MONO}" font-size="10" fill="${c('--canvas-fg-3')}">${item.childCount} ›</text>`);
  }

  const chip = (text: string, cx: number, cy: number, border: string, anchorEnd: boolean) => {
    const label = cut(text, 32);
    const cw = Math.round(label.length * 6.2 + 16);
    const left = anchorEnd ? cx - cw : cx;
    return `<g><rect x="${left}" y="${cy}" width="${cw}" height="18" rx="9" fill="${c('--canvas-card')}" stroke="${border}" stroke-width="1.5"/><text x="${left + 8}" y="${cy + 9}" dominant-baseline="central" font-family="${SANS}" font-size="10.5" fill="${c('--canvas-fg-1')}">${xmlEscape(label)}</text></g>`;
  };
  if (mark && (mark.glyph || mark.color) && words[0]) {
    parts.push(chip(`${mark.glyph ? `${mark.glyph} ` : ''}${words[0]}`, x + 10, y - 16, mark.color ?? c('--canvas-border'), false));
  }
  if (inside) parts.push(chip(inside, x + w - 10, y + h - 2, c('--canvas-fg-3'), true));

  parts.push('</g>');
  return parts.join('');
}

/** The largest canvas every browser draws: Safari's area limit, and a side well inside Chrome's and Firefox's. */
const MAX_CANVAS_PIXELS = 16_000_000;
const MAX_CANVAS_SIDE = 16_384;

/** The scale a `width` × `height` PNG is drawn at: `scale`, or less when that canvas would be too large to draw. */
export function pngScale(width: number, height: number, scale = 2): number {
  const fit = Math.min(scale, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)), MAX_CANVAS_SIDE / width, MAX_CANVAS_SIDE / height);
  return Math.max(0.1, Math.floor(fit * 100) / 100);
}

/**
 * The SVG as a PNG at `scale` (2: sharp on a high-density screen), lowered by
 * `pngScale` when the canvas would be too large for the browser. Browser
 * only: it draws the SVG into a canvas.
 */
export async function toPng(svg: string, width: number, height: number, requested = 2): Promise<Blob> {
  const scale = pngScale(width, height, requested);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The SVG could not be drawn as an image.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser has no 2D canvas.');
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The PNG could not be made.'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The SVG's own size (layout plus the margin for marks), for `toPng`. */
export function svgSize(layout: Pick<C4Layout, 'width' | 'height'>): { width: number; height: number } {
  return { width: Math.ceil(layout.width + MARGIN * 2), height: Math.ceil(layout.height + MARGIN * 2) };
}

/* ---- identifiers and text, for the text formats ----------------------------- */

/** Valid, unique identifiers (`[A-Za-z_][A-Za-z0-9_]*`) for view element ids. */
function identifiers(ids: Iterable<string>, reserved: Iterable<string> = []): Map<string, string> {
  const used = new Set(reserved);
  const out = new Map<string, string>();
  for (const id of ids) {
    if (out.has(id)) continue;
    const last = id.split('.').pop() ?? id;
    let base = last.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'element';
    if (/^[0-9]/.test(base)) base = `e_${base}`;
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}_${n}`;
    used.add(name);
    out.set(id, name);
  }
  return out;
}

/** Text inside a double-quoted string, on one line: a quote becomes a single quote. */
function quoted(text: string | undefined): string {
  return `"${(text ?? '').replace(/\s+/g, ' ').replace(/"/g, "'").replace(/\\/g, '/').trim()}"`;
}

function hexOf(color: string | null): string | null {
  return color ? tokenToHex(color) : null;
}

/** The marks on the diagram, once per status, in the order they first appear. */
function usedMarks(marks: ReadonlyMap<string, C4ExportMark>): C4ExportMark[] {
  const seen = new Map<string, C4ExportMark>();
  for (const mark of marks.values()) if (!seen.has(mark.status)) seen.set(mark.status, mark);
  return [...seen.values()];
}

/* ---- C4-PlantUML --------------------------------------------------------------- */

const PLANTUML_INCLUDE: Record<C4View['level'], string> = {
  context: 'C4_Context.puml',
  container: 'C4_Container.puml',
  component: 'C4_Component.puml',
};

const PLANTUML_LINE: Partial<Record<C4LineStyle, string>> = {
  dashed: 'DashedLine()',
  dotted: 'DottedLine()',
  double: 'BoldLine()',
  groove: 'BoldLine()',
};

function plantUmlMacro(element: C4Element): string {
  const db = element.shape === 'datastore' ? 'Db' : '';
  switch (element.kind) {
    case 'person':
      return 'Person';
    case 'external-system':
      return `System_Ext${db}`;
    case 'system':
      return `System${db}`;
    case 'container':
      return `Container${db}`;
    default:
      return `Component${db}`;
  }
}

/** The drawn view as C4-PlantUML, for the C4-PlantUML stdlib. */
export function toPlantUml(view: C4View, marks: C4ExportMarks = NO_MARKS): string {
  const ids = identifiers([...(view.scope ? [view.scope.id] : []), ...view.elements.map((e) => e.id)]);
  const lines: string[] = [
    '@startuml',
    `!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/${PLANTUML_INCLUDE[view.level]}`,
    '',
    `title ${exportTitle(view).replace(/\s+/g, ' ')}`,
    '',
  ];

  const elementMarks = usedMarks(marks.elements);
  const relMarks = usedMarks(marks.relationships);
  for (const mark of elementMarks) {
    const args = [quoted(mark.status)];
    const hex = hexOf(mark.color);
    if (hex) args.push(`$borderColor=${quoted(hex)}`);
    const line = mark.lineStyle ? PLANTUML_LINE[mark.lineStyle] : undefined;
    if (line) args.push(`$borderStyle=${line}`);
    if (mark.lineWidth > 1) args.push(`$borderThickness=${quoted(String(mark.lineWidth))}`);
    args.push(`$legendText=${quoted(`${mark.glyph} ${mark.legend}`.trim())}`);
    lines.push(`AddElementTag(${args.join(', ')})`);
  }
  for (const mark of relMarks) {
    const args = [quoted(mark.status)];
    const hex = hexOf(mark.color);
    if (hex) args.push(`$lineColor=${quoted(hex)}`, `$textColor=${quoted(hex)}`);
    if (mark.dash) args.push(`$lineStyle=${/^[12] /.test(mark.dash) ? 'DottedLine()' : 'DashedLine()'}`);
    args.push(`$legendText=${quoted(`${mark.glyph} ${mark.legend}`.trim())}`);
    lines.push(`AddRelTag(${args.join(', ')})`);
  }
  if (elementMarks.length + relMarks.length > 0) lines.push('');

  const elementLine = (item: C4ViewElement, indent: string) => {
    const { element } = item;
    const macro = plantUmlMacro(element);
    const args = [ids.get(item.id)!, quoted(element.name)];
    if (macro.startsWith('Container') || macro.startsWith('Component')) args.push(quoted(element.technology));
    args.push(quoted(element.description));
    const mark = marks.elements.get(item.id);
    if (mark) args.push(`$tags=${quoted(mark.status)}`);
    return `${indent}${macro}(${args.join(', ')})`;
  };

  const inside = view.elements.filter((e) => e.inScope);
  const outside = view.elements.filter((e) => !e.inScope);
  if (view.scope) {
    const boundary =
      view.scope.kind === 'system' ? 'System_Boundary' : view.scope.kind === 'container' ? 'Container_Boundary' : 'Boundary';
    const extra = boundary === 'Boundary' ? `, ${quoted(KIND_LABELS[view.scope.kind])}` : '';
    for (const item of outside) lines.push(elementLine(item, ''));
    if (outside.length > 0) lines.push('');
    lines.push(`${boundary}(${ids.get(view.scope.id)!}, ${quoted(view.scope.name)}${extra}) {`);
    for (const item of inside) lines.push(elementLine(item, '  '));
    lines.push('}');
  } else {
    for (const item of view.elements) lines.push(elementLine(item, ''));
  }

  if (view.relationships.length > 0) lines.push('');
  for (const rel of view.relationships) {
    const args = [ids.get(rel.sourceId), ids.get(rel.targetId), quoted(c4EdgeLabel(rel.labels, rel.count))];
    if (!args[0] || !args[1]) continue;
    const mark = marks.relationships.get(rel.id);
    if (mark) args.push(`$tags=${quoted(mark.status)}`);
    lines.push(`Rel(${args.join(', ')})`);
  }

  lines.push('', 'SHOW_LEGEND()', '@enduml', '');
  return lines.join('\n');
}

/* ---- Structurizr DSL ---------------------------------------------------------- */

const STRUCTURIZR_BORDER: Partial<Record<C4LineStyle, string>> = { dashed: 'dashed', dotted: 'dotted' };

/**
 * The drawn view as a Structurizr DSL workspace. `model` gives each drawn
 * element's ancestors, so it can be nested as Structurizr requires: a
 * component inside its nearest container, every container inside the system.
 */
export function toStructurizr(view: C4View, model: C4Model, marks: C4ExportMarks = NO_MARKS): string {
  const drawn = new Map(view.elements.map((e) => [e.id, e.element]));
  // A drawn element as drawn, else from the model (the system, a component's container).
  const byId = (id: string) => drawn.get(id) ?? model.byId.get(id);

  // Who goes where: the system, its containers, their components; people and external systems at the top.
  const system = byId(C4_SYSTEM_ID) ?? view.trail.find((e) => e.kind === 'system');
  const containerOf = (id: string): string | null =>
    c4Ancestors(model, id).slice(1).find((a) => byId(a)?.kind === 'container') ?? null;
  const containers = new Map<string, Set<string>>();
  const topLevel: string[] = [];
  const addContainer = (id: string) => {
    if (!containers.has(id)) containers.set(id, new Set());
  };
  // The view's own container (a Component view's subject) is declared even though it isn't drawn.
  const subject = view.level === 'component' && view.scope
    ? view.scope.kind === 'container'
      ? view.scope.id
      : containerOf(view.scope.id)
    : null;
  const UNASSIGNED = '__unassigned__';
  // A component view needs a container: one whose scope has none gets the Unassigned one.
  const viewContainer = view.level === 'component' ? (subject ?? UNASSIGNED) : null;
  if (viewContainer) addContainer(viewContainer);
  for (const item of view.elements) {
    const { kind } = item.element;
    if (kind === 'person' || kind === 'external-system') topLevel.push(item.id);
    else if (kind === 'container') addContainer(item.id);
    else if (kind === 'component') {
      const parent = containerOf(item.id) ?? UNASSIGNED;
      addContainer(parent);
      containers.get(parent)!.add(item.id);
    }
  }

  const systemId = system?.id ?? C4_SYSTEM_ID;
  const ids = identifiers([systemId, ...containers.keys(), ...view.elements.map((e) => e.id)], ['workspace', 'model', 'views']);
  const tagsOf = (id: string) => {
    const mark = marks.elements.get(id);
    return mark ? quoted(mark.status) : '';
  };
  // Structurizr wants names unique among siblings: people and software systems, a system's containers, a container's components.
  const namesIn = new Map<string, Set<string>>();
  const uniqueName = (parent: string, name: string) => {
    let names = namesIn.get(parent);
    if (!names) namesIn.set(parent, (names = new Set()));
    let unique = name;
    for (let n = 2; names.has(unique.toLowerCase()); n++) unique = `${name} (${n})`;
    names.add(unique.toLowerCase());
    return unique;
  };
  const TOP = '__top__';
  const declare = (keyword: string, id: string, element: C4Element | undefined, withTech: boolean, parent: string) => {
    const args = [quoted(uniqueName(parent, element?.name ?? 'Unassigned')), quoted(element?.description)];
    if (withTech) args.push(quoted(element?.technology));
    const tags = tagsOf(id);
    if (tags) args.push(tags);
    return `${ids.get(id)} = ${keyword} ${args.join(' ')}`;
  };

  const lines: string[] = [`workspace ${quoted(system?.name ?? 'Software system')} ${quoted(exportTitle(view))} {`, '', '  model {'];
  for (const id of topLevel) {
    const element = byId(id)!;
    if (element.kind === 'person') lines.push(`    ${declare('person', id, element, false, TOP)}`);
    else {
      const args = [quoted(uniqueName(TOP, element.name)), quoted(element.description)];
      const tag = marks.elements.get(id)?.status;
      args.push(quoted(['External', ...(tag ? [tag] : [])].join(',')));
      lines.push(`    ${ids.get(id)} = softwareSystem ${args.join(' ')}`);
    }
  }
  lines.push(`    ${declare('softwareSystem', systemId, system, false, TOP)} {`);
  for (const [containerId, components] of containers) {
    const element = containerId === UNASSIGNED ? undefined : byId(containerId);
    const head = `      ${declare('container', containerId, element, true, systemId)}`;
    if (components.size === 0) {
      lines.push(head);
      continue;
    }
    lines.push(`${head} {`);
    for (const id of components) lines.push(`        ${declare('component', id, byId(id), true, containerId)}`);
    lines.push('      }');
  }
  lines.push('    }');

  const rels = view.relationships.filter((r) => ids.has(r.sourceId) && ids.has(r.targetId));
  if (rels.length > 0) lines.push('');
  for (const rel of rels) {
    const args = [quoted(c4EdgeLabel(rel.labels, rel.count))];
    const mark = marks.relationships.get(rel.id);
    if (mark) args.push('""', quoted(mark.status));
    lines.push(`    ${ids.get(rel.sourceId)} -> ${ids.get(rel.targetId)} ${args.join(' ')}`);
  }
  lines.push('  }', '', '  views {');

  const include = view.elements.filter((e) => drawn.has(e.id)).map((e) => ids.get(e.id)!).join(' ');
  const key = quoted(exportFileName(view, 'structurizr').replace(/\.dsl$/, ''));
  const subjectOf: Record<C4View['level'], string> = {
    context: `systemContext ${ids.get(systemId)}`,
    container: `container ${ids.get(systemId)}`,
    component: `component ${ids.get(viewContainer ?? UNASSIGNED)}`,
  };
  lines.push(
    `    ${subjectOf[view.level]} ${key} ${quoted(exportTitle(view))} {`,
    `      include ${include}`,
    '      autoLayout',
    '    }',
  );

  const elementMarks = usedMarks(marks.elements);
  const relMarks = usedMarks(marks.relationships);
  lines.push('', '    styles {', '      element "Person" {', '        shape Person', '      }', '      element "External" {', '        background #999999', '      }');
  for (const mark of elementMarks) {
    lines.push(`      element ${quoted(mark.status)} {`);
    const hex = hexOf(mark.color);
    if (hex) lines.push(`        stroke ${hex}`, `        strokeWidth ${Math.max(2, mark.lineWidth)}`);
    const border = mark.lineStyle ? STRUCTURIZR_BORDER[mark.lineStyle] : undefined;
    if (border) lines.push(`        border ${border}`);
    lines.push('      }');
  }
  for (const mark of relMarks) {
    lines.push(`      relationship ${quoted(mark.status)} {`);
    const hex = hexOf(mark.color);
    if (hex) lines.push(`        color ${hex}`);
    lines.push(`        dashed ${mark.dash ? 'true' : 'false'}`, '      }');
  }
  lines.push('    }', '  }', '', '}', '');

  // A legend of the marks for a reader of the source (Structurizr shows tags in its own key).
  if (elementMarks.length + relMarks.length > 0) {
    const legend = [...elementMarks, ...relMarks].map((m) => `// ${m.status}: ${`${m.glyph} ${m.legend}`.trim()}`);
    return [...legend, '', ...lines].join('\n');
  }
  return lines.join('\n');
}

