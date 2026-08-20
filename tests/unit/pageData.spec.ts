import { describe, it, expect } from 'vitest';
import {
  layerPageData,
  specNodePageData,
  modelNodePageData,
} from '@/apps/embedded/data/pageData';
import { buildModelIndex } from '@/apps/embedded/data/modelGraph';
import type {
  ModelDerived,
  ModelNode,
  ModelLink,
} from '@/apps/embedded/data/useModel';
import type { SpecPayload } from '@/apps/embedded/data/specGraph';
import modelFixture from '../fixtures/model.json';
import specFixture from '../fixtures/spec.json';

// ─── Fixture → ModelDerived (mirrors useModel's derive, no React) ─────────────

interface RawModel {
  nodes: ModelNode[];
  links: ModelLink[];
}

function deriveModel(raw: RawModel): ModelDerived {
  const countsByLayer: Record<string, number> = {};
  const nodesByLayer: Record<string, ModelNode[]> = {};
  for (const node of raw.nodes) {
    const layer = node.layer_id;
    if (!layer) continue;
    countsByLayer[layer] = (countsByLayer[layer] ?? 0) + 1;
    (nodesByLayer[layer] ??= []).push(node);
  }
  return {
    nodes: raw.nodes,
    links: raw.links,
    countsByLayer,
    nodesByLayer,
    relCount: raw.links.length,
  };
}

const model = deriveModel(modelFixture as unknown as RawModel);
const index = buildModelIndex(model);
const spec = specFixture as unknown as SpecPayload;

const META_MODEL_ID = 'cfe8d725-4f64-4eae-b2fa-825e4a774a3a';

// ─── layerPageData (focus: 'layer') ────────────────────────────────────────────

describe('layerPageData', () => {
  it('returns null for a layer slug that is not one of the 12 domains', () => {
    expect(layerPageData('model', 'not-a-layer', model, index, spec)).toBeNull();
  });

  it('builds the header/crumbs/description from real spec + model data', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    expect(pg).not.toBeNull();
    expect(pg.eyebrow).toBe('LAYER 7 · JSON Schema Draft 7');
    expect(pg.title).toBe('Data Model'); // layerLabel, not the raw spec `layer.name`
    expect(pg.idChip).toBe('data-model');
    expect(pg.meta).toBe('9 node types · 25 relationship schemas');
    expect(pg.crumbs).toEqual([
      { label: 'model', target: { kind: 'section', view: 'model' } },
      {
        label: 'data-model',
        target: { kind: 'layer', view: 'model', layerId: 'data-model' },
        current: true,
      },
    ]);
    expect(pg.description).toContain('layer 7 of 12');
    expect(pg.description).toContain('9 node types');
    expect(pg.description).toContain('25 valid relationship schemas');
    expect(pg.description).toContain('34 elements');
  });

  it('carries the 4 stats in NODE TYPES / RELATIONSHIPS / ELEMENTS / LAYER order', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    expect(pg.stats.map((s) => s.label)).toEqual([
      'NODE TYPES',
      'RELATIONSHIPS',
      'ELEMENTS',
      'LAYER',
    ]);
    expect(pg.stats.map((s) => s.value)).toEqual([9, 25, 34, '7 / 12']);
  });

  it('LAYER SPEC facts read the real inspired_by + description fields', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    expect(pg.factsTitle).toBe('LAYER SPEC');
    const byKey = Object.fromEntries(pg.facts.map((f) => [f.key, f.value]));
    expect(byKey.layer_id).toBe('data-model');
    expect(byKey.number).toBe('7');
    expect(byKey.name).toBe('Data Model');
    expect(byKey.description).toBe('Layer 7: Data Model Layer');
    expect(byKey['inspired_by.standard']).toBe('JSON Schema Draft 7');
    expect(byKey['inspired_by.version']).toBe('Draft 7');
    expect(byKey['inspired_by.url']).toBe('https://json-schema.org/draft-07/');
  });

  it('Spec node types table has one row per nodeSchemas entry, navigating to the spec node', () => {
    const pg = layerPageData('spec', 'data-model', model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Spec node types')!;
    expect(table.rows).toHaveLength(9);
    const objectSchemaRow = table.rows.find((r) =>
      r.cells.some((c) => c.text === 'ObjectSchema'),
    )!;
    expect(objectSchemaRow.target).toEqual({
      kind: 'specNode',
      specNodeId: 'data-model.objectschema',
      layerId: 'data-model',
    });
    // instances cell (3rd column) matches the real element count for that type.
    expect(objectSchemaRow.cells[2]).toMatchObject({ text: '31', kind: 'num' });
  });

  it('Elements in model table has one row per element in the layer, navigating to it', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Elements in model')!;
    expect(table.rows).toHaveLength(34);
    const metaModelRow = table.rows.find((r) =>
      r.cells.some((c) => c.text === 'MetaModel'),
    )!;
    expect(metaModelRow.target).toEqual({
      kind: 'element',
      elementId: META_MODEL_ID,
      layerId: 'data-model',
    });
    // 1 intra-layer rel (extends -> Layer) · 2 cross-layer xrefs (both target 'business').
    expect(metaModelRow.cells[3].text).toBe('1 · 2');
  });

  it('Cross-layer references table lists MetaModel -> business twice, navigating to the target', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Cross-layer references')!;
    const fromMetaModel = table.rows.filter((r) => r.cells[0].text === 'MetaModel');
    expect(fromMetaModel).toHaveLength(2);
    expect(fromMetaModel.map((r) => r.cells[1].text).sort()).toEqual([
      'realizes',
      'references',
    ]);
    expect(fromMetaModel[0].target).toMatchObject({ kind: 'element', layerId: 'business' });
  });

  // ─── node-type / predicate cell tooltip metadata ─────────────────────────

  it('Spec node types row carries a nodeType tooltip on the type cell', () => {
    const pg = layerPageData('spec', 'data-model', model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Spec node types')!;
    const objectSchemaRow = table.rows.find((r) =>
      r.cells.some((c) => c.text === 'ObjectSchema'),
    )!;
    expect(objectSchemaRow.cells[0].tooltip).toEqual({
      kind: 'nodeType',
      layerId: 'data-model',
      typeId: 'objectschema',
    });
  });

  it('Elements in model row carries a nodeType tooltip on the type cell', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Elements in model')!;
    const metaModelRow = table.rows.find((r) =>
      r.cells.some((c) => c.text === 'MetaModel'),
    )!;
    expect(metaModelRow.cells[1].tooltip).toEqual({
      kind: 'nodeType',
      layerId: 'data-model',
      typeId: 'objectschema',
    });
  });

  it('Cross-layer references row carries predicate + nodeType tooltips', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Cross-layer references')!;
    const row = table.rows.find((r) => r.cells[0].text === 'MetaModel')!;
    expect(row.cells[1].tooltip).toMatchObject({ kind: 'predicate' });
    expect(row.cells[2].tooltip).toMatchObject({ kind: 'nodeType', layerId: 'business' });
  });

  // ─── predicate cells backed by a real model link carry `edge` info ──────

  it('Cross-layer references predicate cells carry no `edge` info — every row here is cross-layer by construction, and the Model graph only ever renders INTRA-layer edges, so a cross-layer link id could never actually render as highlighted', () => {
    const pg = layerPageData('model', 'data-model', model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Cross-layer references')!;
    const row = table.rows.find((r) => r.cells[0].text === 'MetaModel')!;
    const tooltip = row.cells[1].tooltip;
    expect(tooltip?.kind).toBe('predicate');
    if (tooltip?.kind !== 'predicate') throw new Error('unreachable');
    expect(tooltip.edge).toBeUndefined();
  });
});

// ─── specNodePageData (focus: 'node', view: 'spec') ────────────────────────────

describe('specNodePageData', () => {
  it('returns null when the node type is not published for the layer', () => {
    expect(specNodePageData('data-model', 'data-model.no-such-type', spec, model)).toBeNull();
  });

  it('builds header/stats from the real ObjectSchema node schema', () => {
    const pg = specNodePageData('data-model', 'data-model.objectschema', spec, model)!;
    expect(pg.eyebrow).toBe('SPEC NODE · JSON Schema Draft 7');
    expect(pg.title).toBe('ObjectSchema');
    expect(pg.idChip).toBe('data-model.objectschema');
    expect(pg.meta).toBe('8 attributes · 31 instances');
    expect(pg.description).toContain('Defines validation rules for JSON object instances');
    expect(pg.crumbs[pg.crumbs.length - 1]).toEqual({ label: 'objectschema', current: true });
    expect(pg.stats.map((s) => [s.label, s.value])).toEqual([
      ['ATTRIBUTES', 8],
      ['OUTGOING TYPES', 13],
      ['INCOMING TYPES', 21],
      ['INSTANCES', 31],
    ]);
  });

  it('SPEC NODE facts read allOf/$id from the real payload, and required is honest ("—") when the base list is not inlined', () => {
    const pg = specNodePageData('data-model', 'data-model.objectschema', spec, model)!;
    const byKey = Object.fromEntries(pg.facts.map((f) => [f.key, f.value]));
    expect(byKey.extends).toBe('urn:dr:spec:base:spec-node');
    expect(byKey.schema).toBe('urn:dr:spec:node:data-model.objectschema');
    // The real payload never inlines the base schema's required field list
    // (id/path/spec_node_id/type/name) into a node type's own schema entry —
    // showing a guessed constant here would be a fabricated fact.
    expect(byKey.required).toBe('—');
  });

  it('Attributes table flags only the schema-required attribute', () => {
    const pg = specNodePageData('data-model', 'data-model.objectschema', spec, model)!;
    const table = pg.tables.find((t) => t.title === 'Attributes')!;
    expect(table.rows).toHaveLength(8);
    const typeRow = table.rows.find((r) => r.cells[0].text === 'type')!;
    expect(typeRow.cells[2]).toMatchObject({
      text: 'required',
      color: 'rgb(var(--accent-primary-deep))',
    });
    const propertiesRow = table.rows.find((r) => r.cells[0].text === 'properties')!;
    expect(propertiesRow.cells[2]).toMatchObject({ text: 'optional', color: undefined });
    // Attribute rows carry no navigation target — they're not clickable.
    expect(table.rows.every((r) => r.target === undefined)).toBe(true);
  });

  it('Valid incoming relationships scans every layer schema, not just the owning layer', () => {
    const pg = specNodePageData('data-model', 'data-model.objectschema', spec, model)!;
    const table = pg.tables.find((t) => t.title === 'Valid incoming relationships')!;
    expect(table.rows).toHaveLength(21);
    // At least one incoming relationship should originate from another layer.
    const crossLayer = table.rows.some(
      (r) => r.target && r.target.kind === 'specNode' && r.target.layerId !== 'data-model',
    );
    expect(crossLayer).toBe(true);
  });

  it('Valid outgoing/incoming rows carry predicate + nodeType tooltips', () => {
    const pg = specNodePageData('data-model', 'data-model.objectschema', spec, model)!;
    const outTable = pg.tables.find((t) => t.title === 'Valid outgoing relationships')!;
    expect(outTable.rows[0].cells[0].tooltip).toMatchObject({
      kind: 'predicate',
      sourceTypeLabel: 'objectschema',
    });
    expect(outTable.rows[0].cells[1].tooltip).toMatchObject({ kind: 'nodeType' });

    const inTable = pg.tables.find((t) => t.title === 'Valid incoming relationships')!;
    expect(inTable.rows[0].cells[0].tooltip).toMatchObject({ kind: 'nodeType' });
    expect(inTable.rows[0].cells[1].tooltip).toMatchObject({
      kind: 'predicate',
      destinationTypeLabel: 'objectschema',
    });
  });

  it('Valid outgoing/incoming predicate cells carry no `edge` info — these are relationship SCHEMAS, not live model links', () => {
    const pg = specNodePageData('data-model', 'data-model.objectschema', spec, model)!;
    const outTable = pg.tables.find((t) => t.title === 'Valid outgoing relationships')!;
    const outTooltip = outTable.rows[0].cells[0].tooltip;
    expect(outTooltip?.kind).toBe('predicate');
    if (outTooltip?.kind === 'predicate') expect(outTooltip.edge).toBeUndefined();

    const inTable = pg.tables.find((t) => t.title === 'Valid incoming relationships')!;
    const inTooltip = inTable.rows[0].cells[1].tooltip;
    expect(inTooltip?.kind).toBe('predicate');
    if (inTooltip?.kind === 'predicate') expect(inTooltip.edge).toBeUndefined();
  });
});

// ─── modelNodePageData (focus: 'node', view: 'model') ──────────────────────────

describe('modelNodePageData', () => {
  it('returns null when the element does not exist or lives in another layer', () => {
    expect(modelNodePageData('data-model', 'no-such-id', model, index, spec)).toBeNull();
    expect(modelNodePageData('business', META_MODEL_ID, model, index, spec)).toBeNull();
  });

  it('builds header/stats/facts for MetaModel from real links + metadata', () => {
    const pg = modelNodePageData('data-model', META_MODEL_ID, model, index, spec)!;
    expect(pg.eyebrow).toBe('ELEMENT · Data Model');
    expect(pg.title).toBe('MetaModel');
    expect(pg.idChip).toBe(META_MODEL_ID);
    // 2 cross-layer (realizes/references -> business) + 1 intra-layer (extends -> Layer,
    // via the dotted-id link form) outgoing; 1 incoming (extends <- YAMLModelData).
    expect(pg.meta).toBe('3 outgoing · 1 incoming');
    expect(pg.stats.map((s) => [s.label, s.value])).toEqual([
      ['INTRA-LAYER', 1],
      ['CROSS-LAYER', 2],
      ['INCOMING', 1],
      ['VERSION', '1'],
    ]);
    const byKey = Object.fromEntries(pg.facts.map((f) => [f.key, f.value]));
    // The canonical dotted id (`{layer}.{type}.{slug(name)}`), NOT
    // `layer.type.UUID` — matches the id `/api/model` links + the
    // annotations API actually use (see modelGraph.ts's `dottedId`).
    expect(byKey.path).toBe('data-model.objectschema.meta-model');
    expect(byKey.id).toBe(META_MODEL_ID);
    expect(byKey['source_reference.provenance']).toBe('extracted');
    expect(byKey['source_reference.file']).toBe('src/core/types/model.ts');
    expect(byKey['source_reference.symbol']).toBe('MetaModel');
    expect(byKey['metadata.created_by']).toBe('—'); // absent in the real payload
  });

  it('Outgoing relationships table lists all 3 real links (intra + cross-layer) by name', () => {
    const pg = modelNodePageData('data-model', META_MODEL_ID, model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Outgoing relationships')!;
    expect(table.rows).toHaveLength(3);
    const byPredicate = Object.fromEntries(
      table.rows.map((r) => [r.cells[0].text, r]),
    );
    expect(byPredicate.realizes.cells[1].text).toBe('Architecture Model');
    expect(byPredicate.realizes.cells[2]).toMatchObject({ text: 'business' });
    expect(byPredicate.realizes.target).toMatchObject({
      kind: 'element',
      layerId: 'business',
    });
    expect(byPredicate.references.cells[1].text).toBe('Cross-Layer Reference Resolution');
    // The intra-layer link (referenced by dotted id, not UUID) still resolves.
    expect(byPredicate.extends.cells[1].text).toBe('Layer');
    expect(byPredicate.extends.cells[2]).toMatchObject({ text: 'data-model' });
  });

  it('Conforms to table points at the owning spec node type', () => {
    const pg = modelNodePageData('data-model', META_MODEL_ID, model, index, spec)!;
    const table = pg.tables.find((t) => t.title === 'Conforms to')!;
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0].target).toEqual({
      kind: 'specNode',
      specNodeId: 'data-model.objectschema',
      layerId: 'data-model',
    });
    expect(table.rows[0].cells[2].text).toBe('8 attrs');
  });

  it('Conforms to / Outgoing / Incoming rows carry nodeType + predicate tooltips', () => {
    const pg = modelNodePageData('data-model', META_MODEL_ID, model, index, spec)!;

    const conforms = pg.tables.find((t) => t.title === 'Conforms to')!;
    expect(conforms.rows[0].cells[0].tooltip).toEqual({
      kind: 'nodeType',
      layerId: 'data-model',
      typeId: 'objectschema',
    });

    const out = pg.tables.find((t) => t.title === 'Outgoing relationships')!;
    const realizesRow = out.rows.find((r) => r.cells[0].text === 'realizes')!;
    expect(realizesRow.cells[0].tooltip).toMatchObject({
      kind: 'predicate',
      predicate: 'realizes',
      sourceTypeLabel: 'objectschema',
    });

    const inc = pg.tables.find((t) => t.title === 'Incoming relationships')!;
    expect(inc.rows).toHaveLength(1);
    expect(inc.rows[0].cells[1].tooltip).toMatchObject({ kind: 'predicate' });
    expect(inc.rows[0].cells[2].tooltip).toMatchObject({ kind: 'nodeType' });
  });

  it('An intra-layer outgoing predicate cell carries `edge` info pointing at the real link', () => {
    const pg = modelNodePageData('data-model', META_MODEL_ID, model, index, spec)!;

    // "extends" -> Layer is the one INTRA-layer outgoing link (per the
    // "Outgoing relationships table" test above); "realizes"/"references" are
    // cross-layer (-> business) and must carry no `edge` — the Model graph
    // only ever renders INTRA-layer edges, so a cross-layer link id could
    // never actually render as highlighted.
    const out = pg.tables.find((t) => t.title === 'Outgoing relationships')!;
    const extendsRow = out.rows.find((r) => r.cells[0].text === 'extends')!;
    const extendsTooltip = extendsRow.cells[0].tooltip;
    expect(extendsTooltip?.kind).toBe('predicate');
    if (extendsTooltip?.kind !== 'predicate') throw new Error('unreachable');
    expect(extendsTooltip.edge).toEqual({
      edgeId: expect.any(String),
      sourceElementId: META_MODEL_ID,
      sourceLayerId: 'data-model',
    });

    const realizesRow = out.rows.find((r) => r.cells[0].text === 'realizes')!;
    const realizesTooltip = realizesRow.cells[0].tooltip;
    expect(realizesTooltip?.kind).toBe('predicate');
    if (realizesTooltip?.kind !== 'predicate') throw new Error('unreachable');
    expect(realizesTooltip.edge).toBeUndefined();
  });

  it('The (intra-layer) incoming predicate cell carries `edge` info pointing at the real link + its source', () => {
    const pg = modelNodePageData('data-model', META_MODEL_ID, model, index, spec)!;

    // Incoming: the OTHER element (YAMLModelData) is the edge's source, not MetaModel.
    const inc = pg.tables.find((t) => t.title === 'Incoming relationships')!;
    expect(inc.rows).toHaveLength(1);
    const inTooltip = inc.rows[0].cells[1].tooltip;
    expect(inTooltip?.kind).toBe('predicate');
    if (inTooltip?.kind !== 'predicate') throw new Error('unreachable');
    expect(inTooltip.edge).toEqual({
      edgeId: expect.any(String),
      sourceElementId: inc.rows[0].target && inc.rows[0].target.kind === 'element'
        ? inc.rows[0].target.elementId
        : undefined,
      sourceLayerId: 'data-model',
    });
    expect(inTooltip.edge?.sourceElementId).not.toBe(META_MODEL_ID);
  });
});
