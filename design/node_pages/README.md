# Handoff: Documentation Robotics Viewer

## Overview

A three-pane IDE-style viewer for the Documentation Robotics federated architecture model
(`github.com/tinkermonkey/documentation_robotics`). It lets an architect browse the 12-layer
spec and the extracted model side by side: a hierarchical left nav (Model / Schema / Changesets
→ Layer → Node), a main panel that toggles between a **graph view** and a **page view**, a
right-hand inspector, and a DrBot chat drawer scoped to the current selection.

The dataset in the prototype is the spec describing *itself* — a self-reflective model — so the
content is real and demonstrates every node/relationship shape the viewer must handle.

## About the Design Files

The files in this bundle are **design references created in HTML**. They are prototypes that show
intended look and behavior — not production code to lift directly. The task is to **recreate these
designs in the target codebase's existing environment** (React + `@tinkermonkey/heimdall-ui` is the
natural target here) using its established patterns, routing, and data layer. If no environment
exists yet, pick the most appropriate framework and implement the designs there.

The prototype is authored as a single self-contained component with inline styles for streaming
reasons specific to the design tool. **Do not carry inline styles into production** — translate
them into the codebase's component/CSS conventions. Where the prototype hand-rolls markup that
duplicates a real Heimdall component (see "Known prototype shortcuts"), use the real component.

## Fidelity

**High-fidelity.** Colors, typography, spacing, density, and interactions are final and follow the
Heimdall Design System (amber accent, slate-navy shell, light/dark canvas). Recreate pixel-for-pixel
using `@tinkermonkey/heimdall-ui` components and its token layer rather than re-deriving values.
Layout numbers below are exact.

---

## Data model (what the UI renders)

Sourced from `tinkermonkey/documentation_robotics@main`, `spec/`:

**Layer** (`spec/layers/NN-name.layer.json`)
- `layer_id` (e.g. `data-model`), `number` (1–12), `name`, `description`
- `inspired_by`: `{ standard, version, url }` — e.g. JSON Schema Draft 7, ArchiMate 3.2,
  NIST SP 800-53 5.1, OpenAPI 3.0, OpenTelemetry, IEEE 829-2008
- node-type list (186 spec node types across the 12 layers)

**Spec node** (`spec/schemas/nodes/<layer>/<type>.node.schema.json`, extends
`spec/schemas/base/spec-node.schema.json`)
- required: `id`, `path`, `spec_node_id`, `type`, `name`
- attribute schema (name, JSON type, required flag)

**Spec relationship** (`spec/schemas/base/spec-node-relationship.schema.json`)
- `predicate`, source type, destination type + destination layer, `cardinality`, `strength`,
  `required`

**Model node** (extracted instance)
- `path` = `<layer>.<type>.<id>`, `id` (uuid), `spec_node_id`, `type`, `layer_id`, `name`, description
- `source_reference` (`spec/schemas/base/source-references.schema.json`): provenance
  (extracted | manual), `file`, `symbol`, repository, commit
- `metadata`: `created_at`, `updated_at`, `created_by`, `version`
- relationships: intra-layer (`model-node-relationship.schema.json`) and cross-layer xrefs

The 12 layers, in order: Motivation, Business, Security, Application, Technology, API,
Data Model, Data Store, UX, Navigation, APM, Testing.

---

## Screens / Views

### 1. Shell

**Purpose:** persistent chrome around every view.

**Layout:** full-viewport flex row.
- **Left sidebar** — 264px, shell surface `#13203A`, `border-right: 1px solid var(--shell-border)`.
  Scrollable; scrollbar hidden (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`).
- **Main column** — flex 1, canvas surface. Attaches with `border-top-left-radius: 8px` (the system's
  signature notch). Light canvas `#FFFFFF` by default, dark `#0B1426` when `body.dark-canvas`.
- **Right pane** — 320px inspector (graph mode) or the changeset diff panel. Hidden in page mode.
- **Chat drawer** — right-side drawer, open by default at ≥1300px viewport width.

**Sidebar nav** — 3-level drill-down using Heimdall's `nav-item` classes:
1. Section: Model / Schema / Changesets
2. Layer (12 items, each with a 2.5px colored swatch keyed to its domain color)
3. Node (spec node types under Schema; model elements under Model)

Accordion behavior: opening a section collapses siblings; clicking an already-open layer collapses
it. Chevrons rotate 90° on expand (transition ~140ms ease). Active item: 2px amber left bar +
`shell-surface` background — never a tint fill.

### 2. Graph view (main panel, default)

**Purpose:** see a layer's nodes and edges and their cross-layer links.

- Header: Heimdall `PageHeader` — mono uppercase eyebrow (10px, `0.1em` tracking, `--canvas-fg-3`),
  24px/700/`-0.02em` title, mono id-chip, right-side meta text, no bottom border.
- Body: Heimdall `GraphCanvas`, nodes colored by layer, selected node gets a 1px amber border +
  1px amber outer ring. Clicking a node selects it (and cross-navigates layers when the target is
  in another layer).
- Legend strip beneath the header.

### 3. Page view (main panel, toggled) — the focus of this iteration

**Purpose:** read the full record for the selected item without a graph, and navigate from any row.

Toggled by a 2-item segmented control in the page header's action slot:
- Container: `padding: 3px`, `background: var(--canvas-bg-2)`, `1px solid var(--canvas-border)`,
  `border-radius: 7px`, `display: flex; gap: 4px`.
- Buttons: `padding: 3px 11px`, `border-radius: 5px`, 11px JetBrains Mono, labels `graph` / `page`.
- Selected: `background: var(--canvas-card)`, `color: var(--canvas-fg-1)`,
  `box-shadow: 0 1px 2px rgba(0,0,0,0.08)`. Unselected: `color: var(--canvas-fg-3)`,
  hover → `--canvas-fg-1`.
- Hidden on the Changesets section.

**Page scaffold** (identical for all three page kinds):
`position: absolute; inset: 0; overflow-y: auto; padding: 2px 22px 44px`, inner column
`max-width: 1040px`, `display: flex; flex-direction: column; gap: 28px`.

1. **Breadcrumb** — flex row, `gap: 8px`, 11px JetBrains Mono. Segments
   `model|schema / <layer_id> / <node id>`; separators `/` at `--canvas-fg-4`; current segment
   `--canvas-fg-1`, ancestors `--canvas-fg-3` and clickable (hover → `--canvas-fg-1`).
2. **Description** — 14px/1.6, `--canvas-fg-2`, `max-width: 760px`, `text-wrap: pretty`.
3. **Stat grid** — `grid-template-columns: repeat(4, minmax(0,1fr))`, `gap: 14px`. Each tile:
   `padding: 12px 14px`, `background: var(--canvas-card)`, `1px solid var(--canvas-border)`,
   `border-left: 2px solid <metric color>`, `border-radius: 8px`. Label 10px mono uppercase
   `0.1em` `--canvas-fg-3`; value 28px/700/`-0.02em` `--canvas-fg-1`, `margin-top: 4px`.
4. **Facts block** — mono uppercase section eyebrow, then a two-column grid
   (`repeat(2, minmax(0,1fr))`, `gap: 1px 32px`). Each row:
   `grid-template-columns: minmax(0,150px) minmax(0,1fr)`, `gap: 12px`, `padding: 7px 0`,
   `border-bottom: 1px solid var(--canvas-border)`. Key 11px mono `--canvas-fg-3`,
   `line-height: 1.45`, `overflow-wrap: anywhere`. Value 11px mono `--canvas-fg-1`
   (`overflow-wrap: anywhere`), or 12px sans for prose values (name, description).
5. **Tables** (repeated section) — eyebrow title + a dim mono row count. Header row: mono 10px
   uppercase `0.08em` `--canvas-fg-4`, `padding: 0 10px 7px`,
   `border-bottom: 1px solid var(--canvas-border)`. Data rows: same grid,
   `padding: 9px 10px`, `border-bottom: 1px solid var(--canvas-border)`, `border-radius: 4px`,
   hover `background: var(--canvas-bg-2)`, cursor pointer, whole row navigates. Empty tables show
   a 13px `--canvas-fg-3` sentence instead of a header ("This layer emits no cross-layer
   references.", "No instances of this node type in the loaded model.").

   Cell styles: `name` 13px `--canvas-fg-1`; `mono` 11px mono `--canvas-fg-2`; `dim` 11px mono
   `--canvas-fg-3`; `num` 11px mono right-aligned. Layer cells take that layer's domain color.
   All truncate with `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.

#### 3a. Layer page (focus = layer)
Header eyebrow `LAYER <n> · <standard>`, title = layer name, chip = `layer_id`, meta
`<n> node types · <n> relationship schemas`.
- Stats: NODE TYPES (layer color) · RELATIONSHIPS (`#818CF8`) · ELEMENTS (`#10B981`) ·
  LAYER `n / 12` (`#FBBF24`).
- Facts (LAYER SPEC): `layer_id`, `number`, `name`, `description`, `inspired_by.standard`,
  `inspired_by.version`, `inspired_by.url`, spec source path.
- Tables:
  - **Spec node types** — node type / spec_node_id / instances → spec node page.
  - **Elements in model** — name / type / provenance / rels · xrefs → model node page.
  - **Cross-layer references** — from / predicate / to → the referenced node in its layer.

#### 3b. Spec node page (Schema section, focus = node)
Header eyebrow `SPEC NODE · <standard>`, title = type title, chip = `<layer>.<type>`, meta
`<n> attributes · <n> instances`.
- Stats: ATTRIBUTES (layer color) · OUTGOING TYPES (`#818CF8`) · INCOMING TYPES (`#A78BFA`) ·
  INSTANCES (`#10B981`).
- Facts (SPEC NODE): `spec_node_id`, `layer_id`, `type`, `title`, `extends`
  (`base/spec-node.schema.json`), `schema` (file path), `inspired_by`, `required` field list.
- Tables:
  - **Attributes** — attribute / type / constraint (required in `#B45309`, optional dim).
  - **Valid outgoing relationships** — predicate / destination / layer / cardinality / strength /
    required → destination spec node.
  - **Valid incoming relationships** — source / predicate / cardinality / strength.
  - **Instances in model** — name / path / provenance → model node page.

#### 3c. Model node page (Model section, focus = node)
Header eyebrow `ELEMENT · <layer name>`, title = element name, chip = full `path`, meta
`<n> outgoing · <n> incoming`.
- Stats: INTRA-LAYER (layer color) · CROSS-LAYER (`#818CF8`) · INCOMING (`#A78BFA`) ·
  VERSION (`#FBBF24`).
- Facts (NODE): `path`, `id` (uuid), `spec_node_id`, `type`, `layer_id`, `name`,
  `source_reference.provenance`, `source_reference.file`, `source_reference.symbol`, `repository`,
  `commit`, `metadata.created_at`, `metadata.updated_at`, `metadata.created_by`,
  `metadata.version`.
- Tables:
  - **Conforms to** — spec node / spec_node_id / attribute count → spec node page.
  - **Attributes** — inherited from the conforming spec node type.
  - **Outgoing relationships** — predicate / target / layer / spec_relationship_id (intra-layer
    rels and cross-layer xrefs merged).
  - **Incoming relationships** — source / predicate / type / layer.

### 4. Inspector (right pane, graph mode only)
Heimdall `InspectorPanel`: clean head, borderless relationship rows, node identity + relationship
list. Hidden entirely in page mode — the page carries the same data at greater depth.

### 5. Changesets
Section in the sidebar; main panel shows a diff-style changeset panel with the right pane retained.
Page/graph toggle is hidden here.

### 6. DrBot chat drawer
Heimdall `ChatContainer` inside the drawer (no inner border — the drawer edge provides it). The
scope line reflects the current selection: element name, `<layer> schema`, `<layer> layer`
(page view, layer focus), or the changeset name.

---

## Interactions & Behavior

- **Sidebar → main:** selecting a layer sets `focus: 'layer'` and selects the layer's first node;
  selecting a node sets `focus: 'node'`. Both collapse sibling sections.
- **Mode toggle** persists across selections — switching layers while in page mode stays in page
  mode.
- **Row navigation:** every table row is a link. Rows targeting another layer switch section, layer,
  and selection in one step and expand the sidebar to reveal the target.
- **Breadcrumb:** section segment → section root; layer segment → layer page.
- **Graph node click** selects that node (cross-layer aware).
- **Canvas tone toggle:** light/dark via `body.dark-canvas`.
- **Responsive:** chat drawer opens automatically at ≥1300px; header meta text is suppressed below
  1180px so the title stays on one line.
- **Motion:** hovers and chevron rotation 80–180ms ease. No transforms on press, no ripples.
- Table hover: background lifts one neutral step to `--canvas-bg-2`. Row selection elsewhere:
  `rgba(251,191,36,0.06)` bg + faint amber border.

## State Management

```
view            'model' | 'spec' | 'changesets'
layerId         current layer_id
selectedId      current node/element id
focus           'layer' | 'node'      // which record the page view renders
mode            'graph' | 'page'
canvasDark      boolean
chatOpen        boolean
wide / winW     viewport-derived, for responsive rules
expandedSections / expandedLayers   Set<string>, accordion state
changesetId     current changeset
```

Data fetching in production: layer list + per-layer spec from `spec/dist/*.json` and
`spec/dist/manifest.json`; model nodes from the extraction store. The prototype stubs node uuid /
timestamps / author / version deterministically from the node path (`nodeMeta()` in `dr-data.js`) —
replace with real `metadata` from the store.

## Design Tokens

All from the Heimdall token layer (`colors_and_type.css` / `heimdall-tokens.css` in `assets/`):

- **Shell:** base `#0F1729`, sidebar/topbar `#13203A`, hover/cards `#1B2949`.
- **Canvas:** page `#FFFFFF` / `#0B1426`; inset `#F7F9FB` / `#13203A`; card `#FFFFFF` / `#1B2949`.
  Used via `var(--canvas-bg-2)`, `var(--canvas-card)`, `var(--canvas-border)`,
  `var(--canvas-fg-1..4)`.
- **Accent:** `#FBBF24` → hover `#F59E0B` → deep `#B45309` (CTA / required flags on light canvas).
- **Domain / metric colors:** emerald `#10B981`, amber `#F59E0B`, indigo `#818CF8`,
  violet `#A78BFA`, cyan `#22D3EE`.
- **Type:** Inter (UI), JetBrains Mono (identifiers, eyebrows, table headers, stat numbers, paths).
  Sizes used: 10, 11, 12, 13, 14, 24, 28. Weights 400/500/600/700.
  Eyebrows 10px/500/`0.08–0.12em`/uppercase. Headings `-0.02em`.
- **Radius:** 4px rows, 5px segmented buttons, 7px segmented container, 8px cards/tiles/canvas notch.
- **Borders:** 1px hairline `var(--canvas-border)` / `var(--shell-border)`.
- **Shadows:** only `0 1px 2px rgba(0,0,0,0.08)` on the active segmented button. Cards use borders.
- **Spacing:** 4px scale. Page padding `2px 22px 44px`; section gap 28px; stat gap 14px;
  table row padding `9px 10px`; fact row padding `7px 0`.
- **Focus ring:** `0 0 0 3px rgba(251,191,36,0.18)`. Selection `rgba(251,191,36,0.25)`.

## Assets

- `assets/` — Heimdall token CSS, component CSS, self-hosted Inter + JetBrains Mono woff2.
- `_ds/heimdall-design-system-.../` — the Heimdall component bundle + stylesheets the prototype
  mounts against. In production, depend on `@tinkermonkey/heimdall-ui` (v0.4.0) instead.
- No images, gradients, or icons beyond Heimdall's `ICONS` map. No emoji.

## Known prototype shortcuts (fix in production)

- All styling is inline (a constraint of the design tool). Translate to the codebase's CSS layer.
- The sidebar renders Heimdall's `nav-item` CSS classes directly rather than the `NavItem`
  component (the prototype bundle had a load error). Use the real `NavItem`.
- Node uuid, timestamps, author, and version are deterministically synthesized from the node path.
- Attribute schemas are present only for node types the prototype loaded; production should read
  every `*.node.schema.json`.

## Files

- `Documentation Robotics Viewer.dc.html` — the full prototype (markup + logic). Open directly in a
  browser.
- `dr-data.js` — the dataset: `LAYERS`, `MODEL`, `SPEC`, `CHANGESETS`, `CHAT`, `LAYER_INFO`
  (per-layer `inspired_by` + full 186-type node-type lists, verbatim from the spec), `nodeMeta()`.
- `support.js` — runtime for the prototype file; not part of the design.
- `assets/`, `_ds/` — Heimdall design system CSS, fonts, and component bundle.
- `github.md` — source repo, branch, last sync, and a screen → repo-file map.
