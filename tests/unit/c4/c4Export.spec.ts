// @vitest-environment happy-dom
/**
 * c4Export — the drawn C4 view as SVG, C4-PlantUML and a Structurizr DSL
 * workspace: exactly the boxes and arrows drawn, valid identifiers, escaped
 * text, and the marks of an overlay or a comparison.
 */

import { describe, it, expect } from 'vitest';
import { buildC4Model, C4_SYSTEM_ID } from '@/apps/embedded/data/c4/c4Model';
import { buildC4View, type C4View } from '@/apps/embedded/data/c4/c4Views';
import { C4_CARD, type C4Layout } from '@/apps/embedded/data/c4/c4Layout';
import {
  exportFileName,
  LIGHT_PALETTE,
  tokenToHex,
  toPlantUml,
  toStructurizr,
  toSvg,
  wrap,
  type C4ExportMark,
  type C4ExportMarks,
} from '@/apps/embedded/data/c4/c4Export';
import { derive, link, node, ref, sampleModel } from './fixture';

const { model, n } = sampleModel();
const c4 = buildC4Model(model);

/** A stand-in grid layout: every box, a boundary on scoped views, a straight route per arrow with a label. */
function grid(view: C4View): C4Layout {
  const boxes = new Map(view.elements.map((e, i) => [e.id, { x: 40 + (i % 4) * 280, y: 80 + Math.floor(i / 4) * 170, ...C4_CARD }]));
  const centre = (id: string) => {
    const b = boxes.get(id)!;
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  return {
    width: 1200,
    height: 120 + Math.ceil(view.elements.length / 4) * 170,
    boxes,
    boundary: view.scope ? { x: 20, y: 20, width: 1160, height: 400 } : null,
    edges: view.relationships.map((r) => {
      const a = centre(r.sourceId);
      const b = centre(r.targetId);
      return { id: r.id, points: [a, b], label: { x: (a.x + b.x) / 2 - 30, y: (a.y + b.y) / 2 - 9, width: 60, height: 18 } };
    }),
  };
}

function parse(svg: string): Document {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

const missing: C4ExportMark = {
  status: 'v-missing',
  glyph: '∅',
  words: ['planned, not built'],
  color: '#f43f5e',
  lineStyle: 'dotted',
  lineWidth: 2,
  dash: '2 4',
};
const added: C4ExportMark = { status: 'added', glyph: '+', words: ['added'], color: '#10b981', lineStyle: 'solid', lineWidth: 2, dash: null };

function marksOn(view: C4View): C4ExportMarks {
  const first = view.elements.find((e) => e.inScope)!;
  const rel = view.relationships[0];
  return {
    elements: new Map([[first.id, missing]]),
    relationships: new Map(rel ? [[rel.id, added]] : []),
    inside: new Map([[first.id, '3 inside · 1 ∅']]),
    ghosts: new Set(),
  };
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const balanced = (text: string) => (text.match(/{/g) ?? []).length === (text.match(/}/g) ?? []).length;

describe('c4Export: SVG', () => {
  it('draws the boundary, a card per element and an arrow per relationship, nothing more', () => {
    const view = buildC4View(c4, 'container', C4_SYSTEM_ID);
    const doc = parse(toSvg(view, grid(view)));
    expect(doc.querySelectorAll('[data-c4="card"]')).toHaveLength(view.elements.length);
    expect(doc.querySelectorAll('[data-c4="edge"]')).toHaveLength(view.relationships.length);
    expect(doc.querySelector('[data-c4="boundary"]')?.textContent).toContain('Software system [Software System]');
    expect(doc.querySelector('title')?.textContent).toBe('Container diagram of Software system');
    // Colours and fonts are inlined: no CSS variables, no stylesheet.
    const svg = toSvg(view, grid(view));
    expect(svg).not.toMatch(/var\(--/);
    expect(svg).not.toContain('<style');
    expect(svg).toContain(`fill="${LIGHT_PALETTE['--canvas-bg']}"`);
  });

  it('has no boundary on a context diagram', () => {
    const view = buildC4View(c4, 'context', null);
    const doc = parse(toSvg(view, grid(view)));
    expect(doc.querySelector('[data-c4="boundary"]')).toBeNull();
    expect(doc.querySelector(`[data-c4-id="${C4_SYSTEM_ID}"]`)).not.toBeNull();
  });

  it('escapes the text it draws', () => {
    const odd = node('application.applicationcomponent', 'Parse <A> & "B"', { type: 'internal' }, "it's <b>bold</b>");
    const m = derive([...model.nodes, odd], [...model.links, link(odd, 'uses', n.tooltip)]);
    const drawn = buildC4Model(m);
    const view = buildC4View(drawn, 'component', drawn.elementOf.get(odd.id) ? drawn.byId.get(drawn.elementOf.get(odd.id)!)!.parentId : null);
    const svg = toSvg(view, grid(view));
    const doc = parse(svg);
    expect(svg).not.toContain('<A>');
    expect(doc.querySelector(`[data-c4-id="${CSS.escape(ref(odd))}"]`)?.textContent).toContain('Parse <A> & "B"');
  });

  it('draws a mark as an outline, a chip with its glyph and words, and a dashed coloured arrow', () => {
    const view = buildC4View(c4, 'container', C4_SYSTEM_ID);
    const marks = marksOn(view);
    const doc = parse(toSvg(view, grid(view), marks));
    const [id] = [...marks.elements.keys()];
    const card = doc.querySelector(`[data-c4-id="${CSS.escape(id)}"]`)!;
    expect(card.getAttribute('data-status')).toBe('v-missing');
    expect([...card.querySelectorAll('rect')].some((r) => r.getAttribute('stroke') === '#f43f5e' && r.getAttribute('stroke-dasharray'))).toBe(true);
    expect(card.textContent).toContain('∅ planned, not built');
    expect(card.textContent).toContain('3 inside · 1 ∅');
    const edge = doc.querySelector('[data-c4="edge"][data-status="added"]')!;
    expect(edge.querySelector('polyline')?.getAttribute('stroke')).toBe('#10b981');
    expect(edge.querySelector('text')?.textContent?.startsWith('+ ')).toBe(true);
  });

  it('wraps a long name at words and ends what is left over with an ellipsis', () => {
    expect(wrap('one two three four five', 9, 2)).toEqual(['one two', 'three…']);
    expect(wrap('short', 9, 2)).toEqual(['short']);
    expect(wrap('Supercalifragilistic', 8, 1)).toEqual(['Superca…']);
  });
});

describe('c4Export: C4-PlantUML', () => {
  it('writes a context diagram with the level include, each element by kind and no boundary', () => {
    const view = buildC4View(c4, 'context', null);
    const puml = toPlantUml(view);
    expect(puml.startsWith('@startuml\n!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml')).toBe(true);
    expect(puml.trimEnd().endsWith('@enduml')).toBe(true);
    expect(puml).toContain('System(system, "Software system"');
    expect(puml).toMatch(/^Person\(reviewer, "Reviewer"/m);
    expect(puml).not.toMatch(/_Boundary\(/);
    for (const kind of view.elements.map((e) => e.element.kind)) {
      const macro = { person: 'Person(', system: 'System(', 'external-system': 'System_Ext(', container: 'Container', component: 'Component' }[kind];
      expect(puml).toContain(macro);
    }
  });

  it('puts a container diagram inside the system boundary, with a data store and an arrow per relationship', () => {
    const view = buildC4View(c4, 'container', C4_SYSTEM_ID);
    const puml = toPlantUml(view);
    expect(puml).toContain('C4_Container.puml');
    expect(puml).toMatch(/^System_Boundary\(system, "Software system"\) \{$/m);
    expect(puml).toMatch(/^ {2}ContainerDb\(local_storage, "Local Storage", "localstorage"/m);
    expect(puml.match(/^Rel\(/gm)).toHaveLength(view.relationships.length);
    expect(balanced(puml)).toBe(true);
    for (const m of puml.matchAll(/^\s*(?:\w+)\((\w+),/gm)) expect(m[1]).toMatch(IDENT);
  });

  it('puts a component diagram inside its container, and writes marks as tags with a legend', () => {
    const scope = c4.elementOf.get(n.app.id)!;
    const view = buildC4View(c4, 'component', scope);
    const puml = toPlantUml(view, marksOn(view));
    expect(puml).toContain('C4_Component.puml');
    expect(puml).toMatch(/^Container_Boundary\(viewer, "Viewer"\) \{$/m);
    expect(puml).toContain('AddElementTag("v-missing", $borderColor="#f43f5e", $borderStyle=DottedLine(), $borderThickness="2", $legendText="∅ planned, not built")');
    expect(puml).toContain('AddRelTag("added", $lineColor="#10b981", $textColor="#10b981", $legendText="+ added")');
    expect(puml).toContain('$tags="v-missing"');
    expect(puml).toMatch(/^Rel\(.*\$tags="added"\)$/m);
    expect(puml).toContain('SHOW_LEGEND()');
  });

  it('keeps identifiers valid and unique, and quotes safe', () => {
    const a = node('application.applicationcomponent', '9 Lives "Cache"', { type: 'internal' });
    const b = node('application.applicationcomponent', '9-lives cache!', { type: 'internal' });
    const m = derive([...model.nodes, a, b], [...model.links, link(a, 'uses', b)]);
    const drawn = buildC4Model(m);
    const view = buildC4View(drawn, 'component', drawn.byId.get(drawn.elementOf.get(a.id)!)!.parentId);
    const puml = toPlantUml(view);
    const aliases = [...puml.matchAll(/^\s*Component\((\w+),/gm)].map((x) => x[1]);
    expect(new Set(aliases).size).toBe(aliases.length);
    for (const alias of aliases) expect(alias).toMatch(IDENT);
    expect(puml).toContain(`"9 Lives 'Cache'"`);
  });
});

describe('c4Export: Structurizr DSL', () => {
  it('writes a container view of the system including exactly the drawn elements', () => {
    const view = buildC4View(c4, 'container', C4_SYSTEM_ID);
    const dsl = toStructurizr(view, c4);
    expect(dsl).toMatch(/^workspace "Software system" "Container diagram of Software system" \{$/m);
    expect(dsl).toMatch(/^ {4}system = softwareSystem "Software system"/m);
    expect(dsl).toMatch(/^ {6}viewer = container "Viewer"/m);
    expect(dsl).toMatch(/^ {4}container system "container-software-system" "Container diagram of Software system" \{$/m);
    const include = dsl.match(/^ {6}include (.*)$/m)![1].split(' ');
    expect(include).toHaveLength(view.elements.length);
    expect(dsl.match(/^ {4}\w+ -> \w+ /gm)).toHaveLength(view.relationships.length);
    expect(balanced(dsl)).toBe(true);
  });

  it('writes a system context view with people and external systems outside the system', () => {
    const view = buildC4View(c4, 'context', null);
    const dsl = toStructurizr(view, c4);
    expect(dsl).toMatch(/^ {4}systemContext system /m);
    expect(dsl).toMatch(/^ {4}reviewer = person "Reviewer"/m);
    for (const e of view.elements.filter((e) => e.element.kind === 'external-system')) {
      expect(dsl).toContain(`softwareSystem "${e.element.name}"`);
    }
    expect(dsl).toMatch(/"External"/);
  });

  it('nests a component view inside its container, and writes marks as tags with styles', () => {
    const scope = c4.elementOf.get(n.app.id)!;
    const view = buildC4View(c4, 'component', scope);
    const dsl = toStructurizr(view, c4, marksOn(view));
    expect(dsl).toMatch(/^ {6}viewer = container "Viewer" .* \{$/m);
    expect(dsl).toMatch(/^ {8}\w+ = component "/m);
    expect(dsl).toMatch(/^ {4}component viewer "component-viewer" /m);
    expect(dsl.match(/^ {6}include (.*)$/m)![1].split(' ')).toHaveLength(view.elements.length);
    expect(dsl).toMatch(/^ {6}element "v-missing" \{\n {8}stroke #f43f5e\n {8}strokeWidth 2\n {8}border dotted\n {6}\}$/m);
    expect(dsl).toMatch(/^ {6}relationship "added" \{\n {8}color #10b981\n {8}dashed false\n {6}\}$/m);
    expect(dsl).toMatch(/-> \w+ "[^"]*" "" "added"$/m);
    expect(dsl.startsWith('// v-missing: ∅ planned, not built')).toBe(true);
    expect(balanced(dsl)).toBe(true);
  });
});

describe('c4Export: names and colours', () => {
  it('names a file after the diagram', () => {
    expect(exportFileName(buildC4View(c4, 'context', null), 'svg')).toBe('context-system.svg');
    expect(exportFileName(buildC4View(c4, 'container', C4_SYSTEM_ID), 'structurizr')).toBe('container-software-system.dsl');
    expect(exportFileName(buildC4View(c4, 'component', c4.elementOf.get(n.app.id)!), 'plantuml')).toBe('component-viewer.puml');
  });

  it("reads Heimdall's token values as hex", () => {
    expect(tokenToHex('244 63 94')).toBe('#f43f5e');
    expect(tokenToHex(' 16, 185, 129 ')).toBe('#10b981');
    expect(tokenToHex('#ABCDEF')).toBe('#abcdef');
    expect(tokenToHex('')).toBeNull();
    expect(tokenToHex('300 0 0')).toBeNull();
  });
});
