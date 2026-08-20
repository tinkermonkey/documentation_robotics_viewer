/**
 * pageData — pure transforms building the **page view** (design/node_pages
 * README section 3) for the three record kinds the page scaffold renders:
 *
 *   - `layerPageData`     — focus:'layer'  (Model or Schema section)
 *   - `specNodePageData`  — focus:'node', view:'spec'  (a spec node-type)
 *   - `modelNodePageData` — focus:'node', view:'model' (a model element)
 *
 * Each returns a `PageData`: header fields, a breadcrumb trail, a narrative
 * description, a 4-stat grid, a two-column facts list, and a set of row
 * tables — mirroring the design's `page()` builder, but derived from the
 * real `/api/model` + `/api/spec` shapes (see `useModel.ts` / `modelGraph.ts`
 * / `specGraph.ts`) rather than the prototype's stub dataset.
 *
 * Table/fact/crumb rows carry a `PageNavTarget` instead of an onClick closure
 * so this module stays pure (no store/JSX deps, per the `data/` layer rule);
 * `PageView.tsx` translates a target into the matching `uiStore` action.
 */

import type { ModelDerived, ModelNode } from './useModel';
import { type ModelIndex, resolveEndpoint, dottedId } from './modelGraph';
import {
  type SpecPayload,
  type SpecLayerSchema,
  type SpecNodeSchema,
  type SpecRelationshipSchema,
  schemaForLayer,
  shortName,
  cardShort,
  intraRelCount,
  attributeRows,
} from './specGraph';
import { layerColor, layerLabel, layerStandard, isLayerSlug } from '../ui/domain';

// ─── Shared row/target shapes ──────────────────────────────────────────────

export type PageNavTarget =
  | { kind: 'section'; view: 'model' | 'spec' }
  | { kind: 'layer'; view: 'model' | 'spec'; layerId: string }
  | { kind: 'element'; elementId: string; layerId: string }
  | { kind: 'specNode'; specNodeId: string; layerId: string }
  /** Navigate to an element's page AND highlight one of its edges on arrival
   *  (Phase 6: clicking an edge predicate reference — BA req 28-30). `elementId`/
   *  `layerId` are always the EDGE'S SOURCE node, not necessarily the node whose
   *  page the predicate cell was rendered on (an incoming-relationship predicate
   *  points back at the other end). */
  | { kind: 'elementWithEdge'; elementId: string; layerId: string; edgeId: string };

export interface PageCrumb {
  label: string;
  target?: PageNavTarget;
  current?: boolean;
}

export interface PageStat {
  label: string;
  value: string | number;
  color: string;
}

export interface PageFact {
  key: string;
  value: string;
  /** true = 12px sans prose value (name/description); default = 11px mono. */
  prose?: boolean;
}

export type PageCellKind = 'name' | 'mono' | 'dim' | 'num';

/**
 * Marks a cell as a node-type or predicate reference (Phase 5: hover
 * tooltips on existing surfaces) — `PageView.tsx`'s `Cell` renders these
 * wrapped in `NodeTypeBadge` / `PredicateTooltip` instead of plain text, so
 * hovering/focusing them shows the identical rich tooltip the graph and
 * Inspector surfaces do.
 */
export type PageCellTooltip =
  | { kind: 'nodeType'; layerId: string; typeId: string }
  | {
      kind: 'predicate';
      predicate: string;
      sourceTypeLabel: string;
      destinationTypeLabel: string;
      /** Present only when this predicate reflects a real `/api/model` link (not
       *  a Schema-view relationship SCHEMA, which has no live edge to highlight) —
       *  carries what `PageView.tsx` needs to build an `elementWithEdge` nav
       *  target (Phase 6, BA req 28-30). */
      edge?: { edgeId: string; sourceElementId: string; sourceLayerId: string };
    };

export interface PageCell {
  text: string;
  kind: PageCellKind;
  color?: string;
  tooltip?: PageCellTooltip;
}

export interface PageRow {
  cells: PageCell[];
  target?: PageNavTarget;
}

export interface PageTable {
  title: string;
  columns: string[];
  /** `grid-template-columns` value, verbatim from the design per table. */
  widths: string;
  rows: PageRow[];
  emptyText: string;
}

export interface PageData {
  eyebrow: string;
  title: string;
  idChip: string;
  meta: string;
  color: string;
  crumbs: PageCrumb[];
  description: string;
  stats: PageStat[];
  factsTitle: string;
  facts: PageFact[];
  tables: PageTable[];
}

// ─── Metric colors (verbatim from the design) ──────────────────────────────
//
// These are fixed accent colors (like the layer swatches in domain.ts), not
// canvas surface/foreground colors, so they intentionally do NOT flip with
// light/dark canvas — same as Heimdall's own `--accent-*`/`--status-*`
// tokens, which are defined once at `:root` with no dark-canvas override.
// Route through the real token/domain-color source instead of re-declaring
// fresh hex literals here: EMERALD/AMBER/REQUIRED_AMBER have an exact
// Heimdall token; INDIGO/VIOLET don't (Heimdall's `--status-violet` is a
// different, more saturated shade), so those two reuse the already-defined,
// already-audited domain palette (`application`/`navigation`) rather than a
// second hardcoded hex source.
const INDIGO = layerColor('application'); // #818CF8
const VIOLET = layerColor('navigation'); // #A78BFA
const EMERALD = 'rgb(var(--status-emerald))';
const AMBER = 'rgb(var(--accent-primary))';
const REQUIRED_AMBER = 'rgb(var(--accent-primary-deep))';

const DASH = '—';

function fmt(value: unknown): string {
  return value === undefined || value === null || value === ''
    ? DASH
    : String(value);
}

function cell(text: unknown, kind: PageCellKind, color?: string): PageCell {
  return { text: fmt(text), kind, color };
}

/** A cell referencing a node type — wrapped in `NodeTypeBadge` by `PageView`. */
function nodeTypeCell(
  text: unknown,
  kind: PageCellKind,
  layerId: string,
  typeId: string,
  color?: string,
): PageCell {
  return { ...cell(text, kind, color), tooltip: { kind: 'nodeType', layerId, typeId } };
}

/** A cell referencing a predicate — wrapped in `PredicateTooltip` by `PageView`.
 *  `edge` (when the predicate reflects a real model link, not a Schema-view
 *  relationship schema) makes the cell independently clickable to the edge's
 *  source node with the edge highlighted (Phase 6, BA req 28-30). */
function predicateCell(
  text: unknown,
  kind: PageCellKind,
  predicate: string,
  sourceTypeLabel: string,
  destinationTypeLabel: string,
  color?: string,
  edge?: { edgeId: string; sourceElementId: string; sourceLayerId: string },
): PageCell {
  return {
    ...cell(text, kind, color),
    tooltip: { kind: 'predicate', predicate, sourceTypeLabel, destinationTypeLabel, edge },
  };
}

function fact(key: string, value: unknown, prose?: boolean): PageFact {
  return { key, value: fmt(value), prose };
}

/** Breadcrumb root + layer segments shared by all three page kinds. */
function baseCrumbs(
  view: 'model' | 'spec',
  layerId: string,
  layerIsCurrent: boolean,
): PageCrumb[] {
  return [
    { label: view === 'spec' ? 'schema' : 'model', target: { kind: 'section', view } },
    {
      label: layerId,
      target: { kind: 'layer', view, layerId },
      current: layerIsCurrent,
    },
  ];
}

// ─── Layer page (focus: 'layer') ───────────────────────────────────────────

const LAYER_NODE_TABLE_WIDTHS = 'minmax(0,1.1fr) minmax(0,1.5fr) 78px';
const LAYER_ELEMENT_TABLE_WIDTHS =
  'minmax(0,1.3fr) minmax(0,1fr) minmax(0,0.9fr) 96px';
const LAYER_XREF_TABLE_WIDTHS = 'minmax(0,1fr) minmax(0,0.9fr) minmax(0,1.2fr)';

export function layerPageData(
  view: 'model' | 'spec',
  layerId: string,
  model: ModelDerived,
  index: ModelIndex,
  specRaw: SpecPayload | undefined,
): PageData | null {
  if (!isLayerSlug(layerId)) return null;
  const schema = schemaForLayer(specRaw, layerId);
  const layer = schema?.layer;
  const number = layer?.number;
  const standard = layer?.inspired_by?.standard ?? layerStandard(layerId);
  const nodeSchemas = schema?.nodeSchemas ?? {};
  const typeCount = Object.keys(nodeSchemas).length;
  const relCount = intraRelCount(specRaw, layerId);
  const elements = model.nodesByLayer[layerId] ?? [];
  const color = layerColor(layerId);
  const name = layerLabel(layerId);

  const specRows: PageRow[] = Object.entries(nodeSchemas).map(([short, ns]) => {
    const instances = elements.filter((n) => n.type === short).length;
    return {
      target: { kind: 'specNode', specNodeId: `${layerId}.${short}`, layerId },
      cells: [
        nodeTypeCell(ns.title ?? short, 'name', layerId, short),
        cell(`${layerId}.${short}`, 'dim'),
        cell(instances, 'num'),
      ],
    };
  });

  const elRows: PageRow[] = elements.map((n) => {
    let outCount = 0;
    let xrefCount = 0;
    for (const link of model.links) {
      const src = resolveEndpoint(index, link.source);
      if (!src || src.id !== n.id) continue;
      const tgt = resolveEndpoint(index, link.target);
      if (!tgt) continue;
      if (tgt.layer_id === layerId) outCount += 1;
      else xrefCount += 1;
    }
    return {
      target: { kind: 'element', elementId: n.id, layerId },
      cells: [
        cell(n.name, 'name'),
        nodeTypeCell(n.type, 'mono', layerId, n.type),
        cell(provenanceOf(n), 'dim'),
        cell(`${outCount} · ${xrefCount}`, 'num'),
      ],
    };
  });

  const xrefRows: PageRow[] = [];
  for (const n of elements) {
    for (const link of model.links) {
      const src = resolveEndpoint(index, link.source);
      if (!src || src.id !== n.id) continue;
      const tgt = resolveEndpoint(index, link.target);
      if (!tgt || tgt.layer_id === layerId) continue;
      xrefRows.push({
        target: { kind: 'element', elementId: tgt.id, layerId: tgt.layer_id },
        cells: [
          cell(n.name, 'name'),
          // No `edge` info here — every row in this table is cross-layer by
          // construction (the `tgt.layer_id === layerId` guard above), and the
          // Model graph only ever renders INTRA-layer edges (`edgesForLayer`),
          // so a cross-layer link id could never actually render as
          // highlighted. Attaching one anyway would set inert store state for
          // a click with no visible effect.
          predicateCell(link.type, 'dim', link.type, n.type, tgt.type),
          nodeTypeCell(
            `${tgt.layer_id}.${tgt.type}`,
            'mono',
            tgt.layer_id,
            tgt.type,
            layerColor(tgt.layer_id),
          ),
        ],
      });
    }
  }

  return {
    eyebrow: `LAYER ${fmt(number)} · ${standard}`,
    title: name,
    idChip: layerId,
    meta: `${typeCount} node types · ${relCount} relationship schemas`,
    color,
    crumbs: baseCrumbs(view, layerId, true),
    description:
      `${name} is layer ${fmt(number)} of 12 in the federated model, inspired by ${standard}. ` +
      `The spec defines ${typeCount} node types and ${relCount} valid relationship schemas for ` +
      `this layer; the loaded model holds ${elements.length} elements.`,
    stats: [
      { label: 'NODE TYPES', value: typeCount, color },
      { label: 'RELATIONSHIPS', value: relCount, color: INDIGO },
      { label: 'ELEMENTS', value: elements.length, color: EMERALD },
      { label: 'LAYER', value: `${fmt(number)} / 12`, color: AMBER },
    ],
    factsTitle: 'LAYER SPEC',
    facts: [
      fact('layer_id', layerId),
      fact('number', number),
      fact('name', name, true),
      fact('description', layer?.description, true),
      fact('inspired_by.standard', standard),
      fact('inspired_by.version', layer?.inspired_by?.version),
      fact('inspired_by.url', layer?.inspired_by?.url),
      fact('spec source', `spec/dist/${layerId}.json`),
    ],
    tables: [
      {
        title: 'Spec node types',
        columns: ['node type', 'spec_node_id', 'instances'],
        widths: LAYER_NODE_TABLE_WIDTHS,
        rows: specRows,
        emptyText: 'No node types are published for this layer.',
      },
      {
        title: 'Elements in model',
        columns: ['name', 'type', 'provenance', 'rels · xrefs'],
        widths: LAYER_ELEMENT_TABLE_WIDTHS,
        rows: elRows,
        emptyText: 'No elements of this layer in the loaded model.',
      },
      {
        title: 'Cross-layer references',
        columns: ['from', 'predicate', 'to'],
        widths: LAYER_XREF_TABLE_WIDTHS,
        rows: xrefRows,
        emptyText: 'This layer emits no cross-layer references.',
      },
    ],
  };
}

// ─── Spec node page (focus: 'node', view: 'spec') ──────────────────────────

const ATTR_TABLE_WIDTHS = 'minmax(0,1fr) minmax(0,0.8fr) 96px';
const OUT_REL_TABLE_WIDTHS =
  'minmax(0,1fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,0.7fr) 62px';
const IN_REL_TABLE_WIDTHS =
  'minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr)';
const INSTANCE_TABLE_WIDTHS = 'minmax(0,1fr) minmax(0,1.5fr) 96px';

/**
 * Every relationship schema across every layer file — needed to find "valid
 * incoming" schemas declared in OTHER layers' files (a layer's own
 * `relationshipSchemas` only covers rels it declares as source), and reused
 * as the source list for "valid outgoing" too (filtered to this node's id).
 */
function allRelationshipSchemas(
  spec: SpecPayload | undefined,
): SpecRelationshipSchema[] {
  const out: SpecRelationshipSchema[] = [];
  for (const value of Object.values(spec?.schemas ?? {})) {
    const entry = value as SpecLayerSchema;
    if (!entry?.layer?.id) continue;
    out.push(...Object.values(entry.relationshipSchemas ?? {}));
  }
  return out;
}

function titleFor(
  spec: SpecPayload | undefined,
  layer: string,
  specNodeId: string,
): string {
  const short = shortName(layer, specNodeId);
  const ns = schemaForLayer(spec, layer)?.nodeSchemas?.[short];
  return ns?.title ?? short;
}

export function specNodePageData(
  layerId: string,
  specNodeId: string,
  specRaw: SpecPayload | undefined,
  model: ModelDerived,
): PageData | null {
  const schema = schemaForLayer(specRaw, layerId);
  const short = shortName(layerId, specNodeId);
  const ns: SpecNodeSchema | undefined = schema?.nodeSchemas?.[short];
  if (!ns) return null;

  const color = layerColor(layerId);
  const standard = schema?.layer?.inspired_by?.standard ?? layerStandard(layerId);
  const attrs = attributeRows(ns);
  const instances = (model.nodesByLayer[layerId] ?? []).filter(
    (n) => n.type === short,
  );

  const allRels = allRelationshipSchemas(specRaw);
  const out = allRels.filter((r) => r.source_spec_node_id === specNodeId);
  const inc = allRels.filter((r) => r.destination_spec_node_id === specNodeId);

  const attrRows: PageRow[] = attrs.map((attr) => ({
    cells: [
      cell(attr.name, 'mono'),
      cell(attr.type, 'dim'),
      cell(
        attr.required ? 'required' : 'optional',
        'dim',
        attr.required ? REQUIRED_AMBER : undefined,
      ),
    ],
  }));

  const outRows: PageRow[] = out.map((r) => ({
    target: {
      kind: 'specNode',
      specNodeId: r.destination_spec_node_id,
      layerId: r.destination_layer,
    },
    cells: [
      predicateCell(
        r.predicate,
        'mono',
        r.predicate,
        short,
        shortName(r.destination_layer, r.destination_spec_node_id),
      ),
      nodeTypeCell(
        titleFor(specRaw, r.destination_layer, r.destination_spec_node_id),
        'name',
        r.destination_layer,
        shortName(r.destination_layer, r.destination_spec_node_id),
      ),
      cell(r.destination_layer, 'dim', layerColor(r.destination_layer)),
      cell(r.cardinality ? cardShort(r.cardinality) || r.cardinality : DASH, 'dim'),
      cell(r.strength, 'dim'),
      cell(r.required ? 'yes' : 'no', 'num'),
    ],
  }));

  const incRows: PageRow[] = inc.map((r) => ({
    target: {
      kind: 'specNode',
      specNodeId: r.source_spec_node_id,
      layerId: r.source_layer,
    },
    cells: [
      nodeTypeCell(
        titleFor(specRaw, r.source_layer, r.source_spec_node_id),
        'name',
        r.source_layer,
        shortName(r.source_layer, r.source_spec_node_id),
      ),
      predicateCell(
        r.predicate,
        'mono',
        r.predicate,
        shortName(r.source_layer, r.source_spec_node_id),
        short,
      ),
      cell(r.cardinality ? cardShort(r.cardinality) || r.cardinality : DASH, 'dim'),
      cell(r.strength, 'dim'),
    ],
  }));

  const instRows: PageRow[] = instances.map((n) => ({
    target: { kind: 'element', elementId: n.id, layerId },
    cells: [
      cell(n.name, 'name'),
      cell(dottedId(n), 'dim'),
      cell(provenanceOf(n), 'dim'),
    ],
  }));

  return {
    eyebrow: `SPEC NODE · ${standard}`,
    title: ns.title ?? short,
    idChip: specNodeId,
    meta: `${attrs.length} attributes · ${instances.length} instances`,
    color,
    crumbs: [
      ...baseCrumbs('spec', layerId, false),
      { label: short, current: true },
    ],
    description: ns.description ?? '',
    stats: [
      { label: 'ATTRIBUTES', value: attrs.length, color },
      { label: 'OUTGOING TYPES', value: out.length, color: INDIGO },
      { label: 'INCOMING TYPES', value: inc.length, color: VIOLET },
      { label: 'INSTANCES', value: instances.length, color: EMERALD },
    ],
    factsTitle: 'SPEC NODE',
    facts: [
      fact('spec_node_id', specNodeId),
      fact('layer_id', layerId),
      fact('type', short),
      fact('title', ns.title, true),
      fact('extends', ns.allOf?.[0]?.$ref),
      fact('schema', ns.$id),
      fact(
        'inspired_by',
        schema?.layer?.inspired_by?.version
          ? `${standard} ${schema.layer.inspired_by.version}`
          : standard,
      ),
      // `ns.required` is the base spec-node schema's required field list
      // (id/path/spec_node_id/type/name) when present — but that base list
      // isn't inlined into the per-node-type payload today (it's referenced
      // via `allOf[0].$ref`, not expanded), so this genuinely reads '—' for
      // every node type rather than guessing at a hardcoded stand-in.
      fact('required', ns.required?.join(', ')),
    ],
    tables: [
      {
        title: 'Attributes',
        columns: ['attribute', 'type', 'constraint'],
        widths: ATTR_TABLE_WIDTHS,
        rows: attrRows,
        emptyText: 'No attribute schema is published for this node type.',
      },
      {
        title: 'Valid outgoing relationships',
        columns: [
          'predicate',
          'destination',
          'layer',
          'cardinality',
          'strength',
          'required',
        ],
        widths: OUT_REL_TABLE_WIDTHS,
        rows: outRows,
        emptyText: 'This node type declares no outgoing relationships.',
      },
      {
        title: 'Valid incoming relationships',
        columns: ['source', 'predicate', 'cardinality', 'strength'],
        widths: IN_REL_TABLE_WIDTHS,
        rows: incRows,
        emptyText: 'No other node type declares a relationship into this one.',
      },
      {
        title: 'Instances in model',
        columns: ['name', 'path', 'provenance'],
        widths: INSTANCE_TABLE_WIDTHS,
        rows: instRows,
        emptyText: 'No instances of this node type in the loaded model.',
      },
    ],
  };
}

// ─── Model node page (focus: 'node', view: 'model') ────────────────────────

const CONFORMS_TABLE_WIDTHS = 'minmax(0,1fr) minmax(0,1.5fr) 88px';
const OUT_TABLE_WIDTHS =
  'minmax(0,1fr) minmax(0,1.3fr) minmax(0,0.8fr) minmax(0,1.4fr)';
const IN_TABLE_WIDTHS =
  'minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr)';

interface SourceReference {
  provenance?: string;
  locations?: Array<{ file?: string; symbol?: string }>;
}

function provenanceOf(n: ModelNode): string {
  const ref = n.source_reference as SourceReference | undefined;
  return ref?.provenance ?? 'authored';
}

function sourceLocation(n: ModelNode): { file?: string; symbol?: string } {
  const ref = n.source_reference as SourceReference | undefined;
  return ref?.locations?.find((l) => l.symbol || l.file) ?? {};
}

interface NodeMetadata {
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  version?: string | number;
}

export function modelNodePageData(
  layerId: string,
  elementId: string,
  model: ModelDerived,
  index: ModelIndex,
  specRaw: SpecPayload | undefined,
): PageData | null {
  const n = index.byUuid.get(elementId);
  if (!n || n.layer_id !== layerId) return null;

  const color = layerColor(layerId);
  const layerName = layerLabel(layerId);
  const schema = schemaForLayer(specRaw, layerId);
  const specNode = schema?.nodeSchemas?.[n.type];
  const attrs = attributeRows(specNode);

  const out: PageRow[] = [];
  const inc: PageRow[] = [];
  for (const link of model.links) {
    const src = resolveEndpoint(index, link.source);
    const tgt = resolveEndpoint(index, link.target);
    if (!src || !tgt) continue;
    if (src.id === n.id) {
      const specRelId = `${fmt(src.spec_node_id)}.${link.type}.${fmt(tgt.spec_node_id)}`;
      // `edge` only when intra-layer (tgt shares n's layer) — the Model graph
      // only ever renders INTRA-layer edges (`edgesForLayer`), so a cross-layer
      // link id could never actually render as highlighted; see the identical
      // note on `layerPageData`'s `xrefRows` above.
      const outEdge =
        tgt.layer_id === layerId
          ? { edgeId: link.id, sourceElementId: n.id, sourceLayerId: layerId }
          : undefined;
      out.push({
        target: { kind: 'element', elementId: tgt.id, layerId: tgt.layer_id },
        cells: [
          predicateCell(link.type, 'mono', link.type, n.type, tgt.type, undefined, outEdge),
          cell(tgt.name, 'name'),
          cell(tgt.layer_id, 'dim', layerColor(tgt.layer_id)),
          cell(specRelId, 'dim'),
        ],
      });
    } else if (tgt.id === n.id) {
      // `edge` only when intra-layer (src shares n's layer) — see the note above.
      const incEdge =
        src.layer_id === layerId
          ? { edgeId: link.id, sourceElementId: src.id, sourceLayerId: src.layer_id }
          : undefined;
      inc.push({
        target: { kind: 'element', elementId: src.id, layerId: src.layer_id },
        cells: [
          cell(src.name, 'name'),
          predicateCell(link.type, 'mono', link.type, src.type, n.type, undefined, incEdge),
          nodeTypeCell(src.type, 'dim', src.layer_id, src.type),
          cell(src.layer_id, 'dim', layerColor(src.layer_id)),
        ],
      });
    }
  }
  const intraCount = out.filter(
    (r) => r.target?.kind === 'element' && r.target.layerId === layerId,
  ).length;
  const crossCount = out.length - intraCount;

  const conforms: PageRow[] = [
    {
      target: { kind: 'specNode', specNodeId: `${layerId}.${n.type}`, layerId },
      cells: [
        nodeTypeCell(specNode?.title ?? n.type, 'name', layerId, n.type),
        cell(`${layerId}.${n.type}`, 'dim'),
        cell(`${attrs.length} attrs`, 'num'),
      ],
    },
  ];

  const attrRows: PageRow[] = attrs.map((attr) => ({
    cells: [
      cell(attr.name, 'mono'),
      cell(attr.type, 'dim'),
      cell(
        attr.required ? 'required' : 'optional',
        'dim',
        attr.required ? REQUIRED_AMBER : undefined,
      ),
    ],
  }));

  // The canonical dotted id (`{layer}.{type}.{slug(name)}`) — the same id
  // `/api/model` links reference and the annotations API expects (see
  // modelGraph.ts's `dottedId`), NOT `layer.type.UUID`.
  const path = dottedId(n);
  const loc = sourceLocation(n);
  const meta = (n.metadata ?? {}) as NodeMetadata;

  return {
    eyebrow: `ELEMENT · ${layerName}`,
    title: n.name,
    idChip: n.id,
    meta: `${out.length} outgoing · ${inc.length} incoming`,
    color,
    crumbs: [
      ...baseCrumbs('model', layerId, false),
      { label: n.id, current: true },
    ],
    description: n.description ?? '',
    stats: [
      { label: 'INTRA-LAYER', value: intraCount, color },
      { label: 'CROSS-LAYER', value: crossCount, color: INDIGO },
      { label: 'INCOMING', value: inc.length, color: VIOLET },
      { label: 'VERSION', value: fmt(meta.version), color: AMBER },
    ],
    factsTitle: 'NODE',
    facts: [
      fact('path', path),
      fact('id', n.id),
      fact('spec_node_id', n.spec_node_id ?? `${layerId}.${n.type}`),
      fact('type', n.type),
      fact('layer_id', layerId),
      fact('name', n.name, true),
      fact('source_reference.provenance', provenanceOf(n)),
      fact('source_reference.file', loc.file),
      fact('source_reference.symbol', loc.symbol),
      fact('metadata.created_at', meta.created_at),
      fact('metadata.updated_at', meta.updated_at),
      fact('metadata.created_by', meta.created_by),
      fact('metadata.version', meta.version),
    ],
    tables: [
      {
        title: 'Conforms to',
        columns: ['spec node', 'spec_node_id', 'attributes'],
        widths: CONFORMS_TABLE_WIDTHS,
        rows: conforms,
        emptyText: 'No spec node type resolved for this element.',
      },
      {
        title: 'Attributes',
        columns: ['attribute', 'type', 'constraint'],
        widths: ATTR_TABLE_WIDTHS,
        rows: attrRows,
        emptyText: 'No attribute schema is published for this node type.',
      },
      {
        title: 'Outgoing relationships',
        columns: ['predicate', 'target', 'layer', 'spec_relationship_id'],
        widths: OUT_TABLE_WIDTHS,
        rows: out,
        emptyText: 'This element has no outgoing relationships.',
      },
      {
        title: 'Incoming relationships',
        columns: ['source', 'predicate', 'type', 'layer'],
        widths: IN_TABLE_WIDTHS,
        rows: inc,
        emptyText: 'No other element references this one.',
      },
    ],
  };
}
