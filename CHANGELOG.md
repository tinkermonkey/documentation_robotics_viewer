# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Change counts on the C4 changeset overlay** (#629): a box's status chip says how many of the changeset's
  changes are behind it ("~ changed · 12 changes", "+ added · 8 changes"; no count when there is one), and so does
  a marked arrow's label ("+ uses · 4 changes"), its tooltip and its row in the list of arrows for assistive
  technology. The changeset bar says how many changes are inside the diagram's scope, each counted once ("81
  changes inside Web App"), the same number as the "N changes inside" chip you followed to get there, since a
  change to a link counts on its arrow and on both of its boxes. The details drawer says the same of a box's
  chip. SVG and PNG exports draw the same chips and labels.

### Changed
- **Changesets in the nav rail, grouped** (#625): the left rail's Changesets section lists staged changesets under
  **Open** (expanded) and applied or discarded ones under **Closed** (collapsed), each with its count, so the ones
  that still need you aren't buried in history. Opening or closing a group adds no history entry; a link to an
  applied changeset opens Closed to show its row. An empty group is hidden.
- README and CLAUDE.md describe the actual stack, test suites and CI workflows; the `-build` and `-api-sync`
  project skills are rewritten for the current build. `js-yaml` (used by the API-client scripts) is declared, and
  the router imports `createHashHistory` from `@tanstack/react-router` rather than an undeclared package.
- `package.json` says MIT, as `LICENSE` does (it said ISC); the workflows run `npm ci` without `--legacy-peer-deps`,
  which the dependencies no longer need.
- DR model: the Exception Classifier says what it does (no "Storybook story error filtering"), and the Tailwind and
  Docker agent-image elements are deleted (changeset `remove-pre-heimdall-leftovers`, staged for the PR).

### Removed
- **Leftovers of the pre-Heimdall stack** (#616). Tailwind is gone (`tailwindcss`, `@tailwindcss/postcss`,
  `autoprefixer`, `postcss.config.js`): the viewer used none of its utilities, and the part of its preflight
  reset the viewer relied on now lives in `src/index.css`, in a cascade layer as before. Every view looks the same in
  light and dark. Also removed: the old `vite.config.ts`, `temp_violations.json`, `results/` (now ignored),
  `Dockerfile.agent` and `.dockerignore`, the unused `scripts/` (`check-port.cjs`, `ci-check.sh`,
  `pre-commit-check.sh`, `setup-hooks.sh`, `generate-api-client.sh`), the Storybook ignore entries, the
  `__STORYBOOK_MOCK_WEBSOCKET__` switch, `tslib`, the dead husky v4 config in `package.json`, and the project
  agents and skills written for React Flow, Flowbite and Storybook.

## [0.16.0] - 2026-11-24

The viewer now runs on the dr CLI's central process (`dr serve`), which serves every project and every git
checkout (main checkout and worktrees) of your farm from one port. Every page belongs to one checkout, the links
`dr visualize`, `review_open` and `project_status` give open the checkout they name, and two tabs on two checkouts
of one project never share data, live updates or DrBot chat (#623, documentation_robotics#1279). It needs a dr CLI
whose central process serves the project- and checkout-scoped routes.

### Added
- **C4 diagram export** (#621): the Architecture view's **Export** menu saves the diagram on screen as SVG, PNG
  (2x), Structurizr DSL or C4-PlantUML, named for its level and scope (for example `container-software-system.svg`).
  A changeset overlay or a plan comparison exports with it: the same rings and chips in SVG and PNG, tags and a
  legend in PlantUML and Structurizr.
- **Checkout routes** (#623): `/#/p/<project>/c/<checkout>/<section>/<view>` for every page. The CLI's link forms
  open what they name: `/#/p/<project>/c/<checkout>/` (the Model view), `.../changesets/<id>` (that changeset in
  the Changesets view), `.../changesets/<id>?element=<id>` (its change to that element selected) and
  `.../elements/<id>` (the Model view on that element). The token comes from the fragment (`?token=` after the
  route) and is removed from the address bar.
- **Project and checkout switcher** in the topbar, from `GET /api/projects` and `.../checkouts`: switching opens
  the same view in the other checkout, and Back returns to the one left.
- **Checkout picker**: a bare `/#/` lists every project with its checkouts (main checkout first, then worktrees,
  with branch, state and staged changesets) and opens the one chosen; a farm with one checkout opens it directly.
  An old unscoped link (`/#/model/graph?layer=...`) opens the picker, which carries its page to the checkout chosen.
- **A checkout that can't be shown** gets a page that says why, with the way back to the picker: unknown or gone
  (a 404), removed while open (`checkout.removed`) or the process stopping (`server.stopping`: a process started again has a new token, so the page says to open the viewer from its link again).
- **DrBot queue**: a reply waiting behind the process's running-turn cap says so (`chat.turn.queued`) until it
  starts (`chat.turn.started`).

### Changed
- **Every project-data call is scoped** to the route's checkout: `/api/projects/{project}/checkouts/{checkout}/...`
  for the model, layers, Tier 1, changesets (commit, discard, review, verification) and annotations. Query keys
  carry the project and checkout, so checkouts never share a cache entry.
- **The websocket subscribes per checkout** (`{action: "subscribe" | "unsubscribe", project, checkout}`), again
  after every reconnect, and drops events stamped for another checkout.
- **DrBot chat** sends `project` and `checkout` with `chat.send`, `chat.cancel` and `chat.status`, and takes only
  its own conversation's frames in its own checkout. A conversation belongs to one checkout: switching checkout
  starts a new one.

### Removed
- The query-string magic link's route (`AuthRoute`): `main.tsx` takes the token from the fragment or the query
  string before the router starts.

## [0.15.0] - 2026-11-23

The C4 diagrams can now show a plan against what was built: every box and arrow the plan or the build touched is
marked built as planned, built differently, planned but not built, or built but not planned, so a plan's outcome
reads at the level of the architecture. The verdicts come from the dr CLI's plan verification. A dr CLI with the
verification route (documentation_robotics#1315) shows them; an older one shows the plan without verdicts and says
so. Works with dr CLI 0.6.0 and later.

### Added
- **Plan vs as built on the C4 diagrams** (#617): compare a plan with its verification record (or any as-built
  changeset) from the changeset bar's **Compare with what was built** or the Changesets view's **Compare on the
  diagrams**. Each mark has a glyph, words and its own outline or line style, never colour alone: `✓ built as
  planned`, `≈ probably built`, `≠ built differently`, `∅ planned, not built`, `? can't be checked`, `+ built, not
  planned`. A box above marked parts says how many it holds. A bar names the pair, picks the as-built changeset,
  gives the CLI's verdict, tallies and explains the marks and says what the diagrams leave out; the details drawer
  lists the verdicts behind a box. The comparison is in the URL (`?built=`), and Back and Forward follow it.

### Chores
- The API spec is synced with the dr CLI's (with the verification route) and the client regenerated (#618).
- The viewer's own model holds the slice 3 plan, landed, and its as-built record (#617, #618).

## [0.14.0] - 2026-11-21

A new **Architecture** view draws the model as C4 diagrams (System Context, Containers and Components), and any
changeset can be laid over them, so a proposed change reads as boxes and arrows added, removed or changed before
Apply. Drift follows the dr CLI 0.7.0 contract: a drifted plan lands over its overlaps instead of being refused.
Works with dr CLI 0.6.0 and 0.7.0.

### Added
- **Architecture view: C4 diagrams** (#612, proof of concept): a fourth top-level view that reads the model as
  C4 System Context, Container and Component diagrams. Drill from a container into its components and back by the
  breadcrumb; select a box for its details and the model elements behind it, which open in the Model view. A line
  under the diagram says how much of the model the rules placed. Laid out with ELK, loaded on first use.
- **A changeset on the C4 diagrams** (#614): pick a changeset in the Architecture view, or use **Open in
  Architecture** in the Changesets view. A staged changeset is drawn applied, an applied one reverted. Changed boxes
  get a ring and a label (`+ added`, `− removed`, `→ moved from X`, `~ changed`), never colour alone; a box whose
  parts changed says how many changes are inside; removed boxes and arrows are drawn back faded and dotted. A bar
  names the changeset, tallies what it does, says what the diagrams leave out and clears the overlay; the details
  drawer lists the changes behind a box, each opening in the Changesets review. The overlay is in the URL
  (`?changeset=`).

### Changed
- **Drift that lands over its overlaps** (#613): with dr CLI 0.7.0 a drifted plan is no longer refused at commit.
  The viewer flags it with an amber badge, lists what landing does to each overlap in the inspector and the Apply
  confirmation, and says when what the base changed couldn't be checked. An older CLI that refuses a drifted
  commit is still warned about as before.
- The Changesets Impact tab shares its change outlines and its changeset netting with the C4 overlay; it looks
  and behaves as before.

### Chores
- The API spec is synced with the dr CLI's and the client regenerated (#613).
- The viewer's own model holds both C4 plans and their as-built records.

## [0.13.0] - 2026-11-20

Finding your way around a model gets easier: search anything by name, browse a layer by node type in the nav
tree, or see its elements as lanes or a hive by type. DrBot opens as a floating panel that no longer reflows the
canvas. Descriptions render as markdown on node pages and changesets. Works with dr CLI 0.5.0 and 0.6.0; the
changeset purposes, drift and upgrade records from 0.12.0 still need 0.6.0.

### Added
- **Search** in the topbar (#601, closes #595): type-ahead over every model element and Schema node type, grouped
  by layer with the best match first. `/` or ⌘K / Ctrl+K focuses it; ↑↓ and Enter choose. Exact, prefix, word-start
  and substring matches come first, then initials-style fuzzy matches when few names match better.
- **Nav tree by node type** (#600, closes #592): a Model layer opens onto its node types, each with its count, and
  each type holds its elements. Groups start collapsed; the selected element's group opens on its own.
- **Model view by type** (#602, closes #594): a View control beside Layout: Graph, Lanes by type or Hive by type.
  Lanes order linked types side by side and fold a lane over 48 elements into "+N more"; Hive is offered for
  layers with three or more types. The choice persists.
- **DrBot as a floating panel** (#603, closes #597): it opens at the top-right of the view, below its header, so
  the canvas and header no longer change size. It sits beside an open Inspector (or takes its place when space
  is short), resizes from its left edge and corner (also by keyboard), and Escape closes it. **Dock** turns it
  into a column that collapses to a rail tab. Size and dock state persist.
- **Descriptions as markdown** on node pages (#599, closes #593): layer, node type and element pages show the
  description in its own section above the facts. Raw HTML is never rendered and `javascript:` links are
  stripped; plain text reads as before.
- **Changeset descriptions as markdown** (#609, closes #588): the changeset header renders the description as
  markdown and folds a long one behind Show more. Each inbox card shows its first paragraph inline.

### Changed
- **Light canvas and DrBot closed on a first visit** (#598, closes #596): both used to start the other way. A
  choice you've made before still wins.
- **One name for a node type everywhere** (#610, closes #605): "Components" in views scoped to one layer (nav tree
  groups, lanes, hive), "Application Component(s)" where layers mix (search, Schema, pages, the Impact tab, review
  rows, the change inspector). The Impact tab's groups and the review rows no longer show raw type ids such as
  `applicationservice`.

### Chores
- The viewer's own DR model moves to spec 0.14.0 with the dr 0.6.0 integration files; `.dr/` is no longer tracked
  (#608). The active-changeset pointer is no longer tracked either (#604).
- The DR model is synced with the code for this release, and the plans for each change above have landed (#606).
- E2E: the Schema view's node-type counts come from the live spec (#607).

## [0.12.0] - 2026-11-19

Changesets are handled by what they're for, and drift shows before you Apply. Tier 1 is visible: who decided
each change, and the month's spend. Changeset purposes, drift and upgrade records need the `dr` CLI's next
release (after 0.5.0). With CLI 0.5.0, every staged changeset is treated as before and the commit's 409 is the
only drift signal. The review API and the Tier 1 panel already work with 0.5.0.

### Added
- **Who decided each change** (#572): an outlined badge under each change's chip says whether a Tier 0 rule,
  the Tier 1 decision model, the agent or a spec upgrade decided it. Hover for the rule, provider, model and
  probabilities. A **Decided by** filter, with counts, narrows the rows.
- **Tier 1 panel** in the Changesets inbox (#572, #582), read-only: state, provider and model, the month's spend
  against the cap with its reset date, where each credential comes from (never its value), and warnings.
  While the answer cache fills, it shows progress, time left and cost so far. It also shows the mode (stage,
  suggest or hide) and, for OpenRouter, which upstreams card text may go to.
- **Changesets by purpose** (#585): the inbox sorts plans and DrBot's changes (Waiting on you / on DrBot),
  changesets extracted from the code (Ready to land as built), verification records (each paired with its
  plan) and upgrade records (#590: what a spec upgrade dropped, to review and discard). Apply and Discard
  appear only when the server allows them, so a record offers Discard only. The history gains a Purpose
  column.
- **Drift before Apply** (#586): a "Base changed since this was staged" badge on the inbox card and the
  changeset header, and the overview lists what changed in the base per layer and which staged changes it
  overlaps, with the reason for each. Apply warns but stays enabled; the server's 409 is the result.
- **Impact tab** (#577): Find (keyboard-driven), focus on one element, Show changes only, filters by op, layer,
  type and link category, and large lanes folded by type.

### Changed
- **Apply lands undecided changes as kept** (#584): it waits only on an undecided delete that's still in use,
  an ask to DrBot, a conflict between decisions, or nothing to land. The button and confirm dialog say how
  many land without a decision.
- **The bulk keep says what it covers** (#590): "Keep all N" before anything is decided, "Keep the other N"
  after, and "Keep N, not the M blocked deletes" when blocked deletes are left out.
- **Review rows and the change inspector are easier to read** (#577): labelled columns, a filled chip for the
  change and an outlined pill for your decision, links drawn as source —predicate→ target, a layer band,
  a link card, a wrapped neighbourhood view and an always-shown source reference.
- **The Product layer has its own colour**, and the left rail counts layers from the spec (#577).
- **A discarded changeset is gone** on a current CLI, which deletes it: Discard returns to the inbox with a
  toast, and a link to one says it's gone (#585).

### Fixed
- **Applied changesets** show each change as Landed or Not applied instead of "Needs decision" (#574, #577).
- **The footer's versions**: SPEC reads the model spec version from `/api/spec`; it showed the API's own
  `0.1.0` for both. The CLI version shows `cli —` until a CLI sends it (#584).
- **The landed-by-layer rows** in the Apply result no longer overlap (#577).

### Removed
- Seven pre-Heimdall stores and `embeddedDataLoader` that nothing imported, about 1,850 lines (#583).

## [0.11.0] - 2026-11-14

Changesets get a review step: a verdict on each change instead of one Apply for the whole changeset. The full
review needs a `dr` CLI with the review API (tinkermonkey/documentation_robotics#1130, in the CLI's next
release). With an older CLI (0.4.0 and earlier) verdicts are kept in this browser, Drop is unavailable, and
Apply commits the whole changeset as before.

### Added
- **Changesets inbox**: the Changesets view opens on Waiting on you / Waiting on DrBot / Applied and discarded,
  with each changeset's progress, who staged it and its revision, instead of opening the first changeset.
- **Per-change review** (#569): Keep / Drop / Ask DrBot on each change, with a note DrBot reads. A summary card
  shows what still needs a decision. Changes are grouped by review weight (Routine field edits can be kept in
  bulk; New elements; New links; Removals; Blocked deletes), by layer or by sequence. Add-then-delete pairs
  fold into a Cancel out section. Dropping an added element drops the changes that need it.
- **Change inspector**: the decision first, then before / after, source reference, related changes and
  comments.
- **Blocked deletes**: a delete whose element other elements still link to offers Delete the links too /
  Keep the element / Ask DrBot.
- **Since your review**: after the changeset is restaged, revised, new and withdrawn changes are shown;
  decisions on unchanged changes carry over.
- **Apply with drops**: the confirm dialog lists what lands, what is left out and links deleted with their
  elements; afterwards the page shows what landed, by layer. Model drift (409), blockers (422) and other
  refusals each get their own message, and nothing is written.

### Fixed
- Apply and Discard stay shut after they succeed until the changeset reads as committed or discarded; the card
  briefly showed Apply live again while the CLI finished writing (#570).
- A dropped link delete that conflicts with a kept element delete is marked on both rows and stays under
  Needs decision (#570).
- The changeset inspector's Added / Modified / Deleted tiles no longer count cancel-out pairs (#570).

## [0.10.0] - 2026-11-12

`@tinkermonkey/heimdall-ui` bumped `0.10.0` → `0.12.0` (exact npm-registry version). No `dr` CLI change is
needed.

### Added
- **Changesets › Impact tab**: a Changes / Impact switch in the changeset header shows what a changeset reaches
  outside itself before you Apply it. The changeset is laid over the model, so a staged changeset's new
  elements and relationships are included. Every changed element is a reach origin, drawn as heimdall-ui layer
  lanes. Long-range links run down a side gutter, and same-layer links share a bundled trunk. Each op has its
  own outline style as well as colour (added, modified, deleted, relationships changed). Click an element to
  isolate its reach. Follow (shared with the Model inspector) and Labels controls sit above the lanes. Changes
  naming an element that's no longer in the model are counted, not dropped.
- **Blast radius** in the Changesets inspector, above Apply / Discard: a per-layer reach strip and list of what
  the changeset touches outside itself.

### Changed
- **Element ids are the model's dotted path** (`layer.type.name`) in the inspector and on element pages, not
  the internal UUID (#559).
- **One nav section open at a time**: opening Model, Schema or Changesets collapses the others. The current
  selection is scrolled into view after any navigation, including a deep link once its data loads. Section
  and layer rows expose `aria-expanded` (#560).
- **Layer pages count all of a layer's relationship schemas**, broken down as within the layer and to other
  layers (#561).
- **Inter-layer nodes** in the Model graph are marked with a dashed border and a faded swatch instead of 60%
  opacity, which dropped their type tag below WCAG AA contrast.
- **Fonts ship inside the bundle**: heimdall-ui 0.11's font CSS uses relative URLs, so the `public/fonts` copy
  and the packaging step that copied it are gone. Their SIL Open Font License texts ship alongside them in
  `licenses/fonts/` (from heimdall-ui 0.12), as the licence requires for redistributed fonts.

### Fixed
- **Review links stuck on "loading changeset…"**: a tab that already held an older server's token kept
  sending it, because the API client cached the token when it loaded. The server refused it until a reload.
  The client now reads the token for each request (#566).
- **A changeset that fails to load says why** in the canvas and the inspector instead of loading forever.
- **Links to elements whose names contain punctuation** (e.g. `Section/View`) resolve again: dotted ids are
  derived with the `dr` CLI's own slug rule (#563).

## [0.9.0] - 2026-11-11

`@tinkermonkey/heimdall-ui` bumped `0.9.4` → `0.10.0`. DrBot conversation memory and live changeset refresh
need the matching `dr` CLI (`conversation_id` on `chat.send`, the `changesets.updated` broadcast).

### Added
- **Followed across layers** in the Model inspector: a Follow control (Direct / +1 layer / +2 layers) lists
  what the selection reaches past its direct links, with a per-layer reach strip.
- **DrBot remembers the conversation**: `chat.send` (and `chat.cancel`) now carry the conversation id, so the
  server resumes DrBot's session and a follow-up can refer to earlier messages. `chatService.reset()` starts a
  new conversation with a new id.
- **Live comments**: annotations and replies another client or an agent writes appear without a reload, from
  the server's `annotation.*` broadcasts.

### Changed
- **Live changeset refresh**: the server's `changesets.updated` broadcast refetches the changesets, so a
  changeset created or staged from the terminal or by DrBot shows up as it happens. This replaces the refetch
  after every DrBot reply.

### Fixed
- **Back to a layer with no selection** clears the selection instead of keeping the element being left.
- **Tooltip text is announced** by screen readers on the focused trigger.

## [0.8.0] - 2026-11-04

`@tinkermonkey/heimdall-ui` bumped `0.8.0` → `0.9.4` (exact npm-registry version), with graph, DrBot and
changeset improvements built on it. Apply / Discard and new changesets appearing without a restart need the
matching `dr` CLI (`POST /api/changesets/:id/{commit,discard}`, per-request changeset reload).

### Added
- **Viewport history** (`?vp=x,y,zoom,tag`): pan/zoom is recorded once it settles and restored on reload and
  back/forward. It only replaces the current history entry. `tag` fingerprints the layout/display settings,
  so a viewport recorded under another layout (an older entry, a shared link) is dropped, not misapplied.
- **Graph controls in the page header**: Layout (Clustered / Organic / Orthogonal), Relations and Inter-layer
  sit beside the graph/page toggle; the header wraps in narrow canvases.
- **Changeset Apply / Discard** in the Changesets inspector, each behind a confirmation. Refusals (failed
  validation, model changed since the changeset was made) show the server's reason inline.
- **DrBot viewer context**: every message carries what's open (view, layer, selected element / node type /
  relationship / changeset) so "this element" resolves; the thread still shows only what you typed.
- **Live model refresh**: the server's `model.updated` broadcast refetches the model and changesets, and
  changesets also refetch when a DrBot reply finishes.

### Changed
- **Organic is the default layout**; Force, Galaxy and Radial-tree left the picker (a saved one falls back to
  Organic).
- **No re-centering on canvas clicks**: clicking a node in the graph no longer pans to it; selecting from
  the nav tree or a link still does.
- **Predicate explanations wait 3s** of hover (they also are click targets), and on graph edges they're placed
  beside the label instead of covering it.
- **Card titles wrap** instead of being cut off by the type tag, which drops to its own line when needed.
- **DrBot replies may take up to 15 minutes** (was 60s, which cut long answers off with an error).

### Fixed
- **Settings flyout** no longer closes when moving slowly from the gear to the panel.
- **DrBot tool steps** now show (the CLI's snake_case, id-less `chat.tool.invoke`) and are marked finished.
- **A dropped connection fails a pending DrBot request at once** instead of leaving it loading until its
  timeout.

### Removed
- **Perimeter ring for inter-layer nodes** under Clustered (added in 0.7.0): since heimdall-ui 0.9.0 sizes
  clusters for real, the estimated ring cut through them. The layout engine places foreign nodes now.

## [0.7.0] - 2026-08-22

Adds **inter-layer nodes** to the Model graph: directly-linked foreign nodes from
other layers now appear on-canvas alongside the layer's own nodes, with dashed
cross-layer edges connecting them.

### Added
- **Inter-layer node overlay** (`GraphControls` → "Inter-layer" toggle, Model
  view only): enables/disables rendering of directly-linked foreign nodes on the
  current layer's graph. Foreign nodes render as pills at 60% opacity with their
  own layer's domain color, providing clear visual subordination. Clicking a
  foreign node navigates to its home layer (same as the cross-layer inspector
  link), rather than selecting within the current layer.
- **Cross-layer edges** appear between native and foreign nodes: dashed stroke
  `[6, 4]` and 40% opacity to visually distinguish them from intra-layer edges.
- **Perimeter ring layout** for `force-clustered` graph layout: foreign nodes
  are placed on a ring around the native cluster, with radius scaled relative to
  both the native node count and the number of foreign nodes, so the ring stays
  visible and non-overlapping regardless of layer size.
- **Structural filter integration**: when "Relations" is set to "Structural",
  foreign nodes whose only cross-layer connections are non-structural predicates
  are hidden (no orphaned foreign nodes with invisible edges).
- **`showInterLayerNodes` preference** persisted to `localStorage` (key:
  `dr-viewer-ui-preferences`), defaulting to `true`. Survives reload alongside
  the other graph preferences.
- **`interLayerNodesAndEdges` / `filterStructuralInterLayer`** pure transforms
  in `data/modelGraph.ts`, with comprehensive Vitest coverage (31 new tests across
  deduplication, perimeter ring geometry, foreign node grouping by layer,
  structural filtering, and edge-case layers).

### Changed
- `GraphCanvas` key in the Model view now includes `showInterLayerNodes` so
  toggling the overlay recenters the graph rather than deferring to the existing
  viewport position.
- `interLayerData` (foreignNodes, crossEdges, foreignNodeIds) is computed once
  per render pass in `Canvas.tsx` and shared between the nodes and edges memos,
  eliminating a duplicate O(links) pass.

## [0.6.1] - 2026-08-21

`@tinkermonkey/heimdall-ui` bumped `0.7.0` → `0.8.0` (exact npm-registry version), and the Model
graph's edge-hover predicate tooltip is migrated onto its new native `GraphCanvas` props.

### Changed
- **Edge hover uses `GraphCanvas`'s native `onEdgeHover`/`edgeTooltip`** (heimdall-ui 0.8.0)
  instead of a DOM-delegation hack that walked the DOM for Heimdall's internal
  `.graph-edge__label` class/`graph-edge-{id}` data-testid convention (a workaround for 0.7.0
  having no per-edge hover callback — see [#536](https://github.com/tinkermonkey/documentation_robotics_viewer/issues/536)).
  `EdgeHoverTooltip.tsx`'s manual portal + placement math is gone; `GraphCanvas` now owns
  positioning and show/hide itself. The hover target is also now the whole edge (its invisible
  hit-stroke included), not just the predicate label — a larger, easier hit area.
- **Hovering an edge no longer shows the accent "hot" highlight** — only Heimdall's default
  gray `:hover` styling plus the predicate tooltip. The accent highlight is now reserved for an
  actual selection or the deliberate cross-navigation highlight (clicking a predicate reference
  in the Edge Inspector). This is a deliberate fix, not a regression: the initial version of this
  migration wired hover into the same `uiStore` field that highlight uses, which re-triggered
  `GraphCanvas`'s full force-layout simulation on every hover in/out — a cost that was previously
  almost unreachable (hover only fired over the tiny predicate label) but became constant once
  hover covered the whole edge.

### Known limitation
- The predicate tooltip's definition text is not reachable to screen readers — heimdall-ui
  renders `edgeTooltip`/`nodeTooltip` content inside an `aria-hidden="true"` layer. The edge's own
  `aria-label` still carries the predicate and both endpoint types. Tracked as
  [#538](https://github.com/tinkermonkey/documentation_robotics_viewer/issues/538) (proposed fix:
  surface the definition in the already-accessible Edge Inspector) and filed upstream against
  heimdall-ui as [tinkermonkey/heimdall#208](https://github.com/tinkermonkey/heimdall/issues/208)
  (asking for a proper `Popover` primitive).

## [0.6.0] - 2026-08-19

`@tinkermonkey/heimdall-ui` bumped `0.5.2` → `0.7.0` (exact npm-registry version), and the
Model/Schema graph experience is substantially reworked on top of it: new layout engines, a
floating Inspector, NavTree selections that actually bring themselves into view, and Fullscreen
that no longer drops half the UI.

### Added
- **Graph layout engines**: `layout="galaxy"` and `layout="force-clustered"` (alongside the
  existing `"force"`), plus a `GraphControls` flyout (Layout / Boundaries / Node margin /
  Relations) mirroring Heimdall's own `GraphLayoutsShowcase` demo — collapsed to a single
  transparent icon by default, opens on hover, focus, or click, closes on Escape.
- **Relations filter**: `showAllRelations`/`isStructuralEdge` edge visibility, backed by a new
  `data/predicates.ts` classifying DR's own predicate catalog into structural vs. relational.
- **NavTree selections auto-center**: `GraphCanvas`'s new `centerOnSelect` pans the viewport to
  keep the current selection in view for any selection origin — a NavTree click, a cross-layer
  "Navigate to X" link, or a URL-restored deep link — not just a direct on-canvas click.
- **Fullscreen includes the overlay chrome**: `fullscreenContainerRef` points the built-in
  toolbar's Fullscreen button at the graph's wrapper instead of `GraphCanvas`'s own root, so
  `GraphControls` and the Inspector stay visible while fullscreen instead of vanishing.
- **Two-way URL routing** for layer/node/changeset selection (`?layer=`/`?node=`/`?changeset=`),
  covering selections from anywhere (NavTree, graph clicks, cross-layer navigation) — a view
  change pushes history, a pure selection change replaces it.
- **localStorage persistence** of theme, DrBot open/closed, and the graph layout preferences,
  deliberately excluding navigation state (the URL router's job instead).

### Changed
- **Inspector is now a floating `DetailDrawer`** over the graph's right edge instead of a
  permanent sidebar column: translucent/blurred, auto-hides when nothing's selected, resizable.
- **Dark canvas is now the default** on a genuine first visit (a returning user's own choice
  always wins after that).
- The built-in zoom/lock/fullscreen toolbar moved to the graph's **bottom-left** corner (was
  bottom-right, which collided with the Inspector drawer whenever a node was selected).

### Fixed
- Switching sections in the nav tree (Model ↔ Schema ↔ Changesets) while a node was selected left
  a stale, cross-view selection id that got baked into the new view's URL as a dead link.
- `GraphControls`' toggle had no click or Escape handling, making it unreachable on touch and
  violating this repo's own "Escape closes overlays" standard.

### CI
- Dropped a dead `Install Playwright browsers` step from `build-and-test` (the tests it ran
  before, `npm test`, never touch a real browser) — on a slow day it could burn the job's entire
  timeout downloading system packages before a single test ran, blocking the release build.

## [0.5.1] - 2026-08-14

### Changed
- `@tinkermonkey/heimdall-ui` bumped from `0.5.1` to `0.5.2` (exact npm-registry version).

## [0.5.0] - 2026-08-13

Adds a **page view** — a document-form alternative to the graph, per [#498](https://github.com/tinkermonkey/documentation_robotics_viewer/issues/498).

### Added
- **Page view** for Model/Schema layers, spec node types, and model elements: breadcrumb, stat grid,
  facts list, and row tables reading the full record without a graph — toggled by a graph/page
  `SegmentedControl` in the canvas header. Every row/breadcrumb segment with a target is a real,
  keyboard-operable navigation link.
- `data/pageData.ts` — pure `layerPageData`/`specNodePageData`/`modelNodePageData` transforms built
  from the real `/api/model` + `/api/spec` shapes, including a full cross-layer relationship-schema
  scan (not just the owning layer) for "valid incoming relationships".
- Heimdall spring-based force layout (`layout="force"`) replaces the deterministic manual grid for
  graph node placement.

### Changed
- `@tinkermonkey/heimdall-ui` moved from a pinned git commit to an exact npm-registry-resolved version.
- `NavTree` now composes Heimdall's real `NavItem` component instead of hand-rolled nav-item markup
  (gains `aria-current="page"` for free).
- The right-hand Inspector hides entirely in page mode — the page view carries the same data at
  greater depth.

### Fixed
- WCAG 2.1 AA color-contrast failure on the new page-view table headers.
- Table-row and breadcrumb hover feedback, which an inline style was permanently shadowing.
- Page-view tables/breadcrumb now expose ARIA table/nav semantics for header-to-cell association.

### Removed
- `design/foundation/` (a stale, fully superseded design-export duplicate).

## [0.4.0] - 2026-06-19

Complete UX rebuild on the **Heimdall design system**.

> 0.4.0 follows 0.2.3 — the `v0.3.0` tag was an internal API-spec-sync bump, not a UX release.

### Changed
- **Rebuilt the entire presentation layer on `@tinkermonkey/heimdall-ui`**, replacing the
  React Flow + Flowbite + Storybook + Playwright stack. The data/infrastructure layer (REST/WebSocket
  API client, JSON-RPC chat service, Zustand data stores, generated types) was kept; the new UX lives
  under `src/apps/embedded/ui` + `data`.
- Two-surface design: an always-dark IDE shell wrapping a light/dark, token-driven canvas.

### Added
- **5-pane Heimdall shell**: topbar, 3-level navigation rail, canvas, inspector, DrBot chat drawer, statusbar.
- **Model view** — per-layer instance graph (`GraphCanvas`) with domain-colored nodes, a relationship
  inspector, and click-to-navigate across layers.
- **Schema view** — per-layer node-type graph with attributes and relationship cardinality from `/api/spec`.
- **Changesets view** — op-coded diff list (add/update/delete) with stat tiles and expandable side-by-side diffs.
- **DrBot chat** — live WebSocket/JSON-RPC streaming assistant drawer.
- **Annotations** — create/edit/resolve/delete + replies in the inspector (REST CRUD).
- Light/dark canvas toggle; self-hosted Inter + JetBrains Mono fonts; brand favicon.
- **Test suite** — 263 Vitest tests (unit/integration/component) + 20 Playwright E2E + axe accessibility,
  wired into CI (`.github/workflows/test.yml`).

### Fixed
- WebSocket double-emit that doubled streamed chat text.
- WCAG 2.1 AA color contrast across the shell and both canvas tones.
- Deterministic API-client codegen (no build-time timestamp churn).
- Robust `/api/model` link resolution (UUID + canonical dotted id resolves all links).

### Removed
- React Flow (`@xyflow/react`) and the Dagre / ELK / D3Force / Graphviz / libavoid layout engines + worker pool.
- Flowbite React, Storybook, and the previous Playwright/Storybook test stack.

## [0.2.3] - 2025-12-20

### Added
- **Schema Integration**: Updated embedded app and reference server to work with latest .dr/schemas spec v0.6.0
  - Server now reads `.manifest.json` and exposes `spec_version` in `/api/spec` response
  - Added relationship catalog support in spec endpoint and client typings
  - Enhanced startup logging with manifest version and relationship catalog detection
  - Added comprehensive TypeScript interfaces for schema manifest and relationship catalog

### Changed
- **Authentication**: Improved token persistence across page refreshes
  - Token now stored in sessionStorage, localStorage, and cookies for maximum reliability
  - Cookie persistence with 30-day expiration and SameSite=Lax security
  - Fallback chain: URL → sessionStorage → localStorage → cookie
  - Handles third-party storage restrictions gracefully
- Updated `embeddedDataLoader.ts` with normalized schema count and relationship catalog handling
- Enhanced `/api/spec` endpoint logging to show spec version and relationship catalog presence

### Fixed
- Fixed token loss on page refresh by implementing multi-layer storage strategy
- Fixed missing relationship catalog in spec responses
- Fixed schema count inconsistency between snake_case and camelCase properties

## [0.2.2] - 2025-12-20

### Fixed
- **Critical**: Fixed graph viewer crashes when layer.elements is undefined
  - Added defensive checks in `nodeTransformer.ts` for missing or invalid elements arrays
  - Added defensive checks in `verticalLayerLayout.ts` to skip layers without elements
  - Added validation for `visual.size` property to prevent NaN values in viewBox
  - Proper default dimensions (180x100) applied when visual properties are missing
  - Prevents "Unexpected value NaN NaN NaN NaN parsing viewBox attribute" error
  - Prevents "can't access property Symbol.iterator, a.elements is undefined" error
- **Setup**: Fixed missing mock data for DR CLI reference server
  - Updated `setup_mock_data.py` to include required `visual.size` property in all elements
  - Added annotations.json creation to support annotation features
  - Mock data now properly initialized with spec.json, model.json, annotations.json, and changesets
  - Fixes "Failed to load annotations: Not Found" error

### Changed
- Mock data structure now includes complete visual properties for all elements
- Enhanced error handling and validation throughout graph rendering pipeline

## [0.2.1] - 2025-12-20

### Fixed
- **Critical**: Fixed authentication token persistence using sessionStorage
  - Previous implementation lost token on page refresh or navigation
  - Token now stored in sessionStorage when first extracted from URL
  - All API calls now check sessionStorage if token not in current URL
  - Fixes 401 Unauthorized and 403 Forbidden errors after page refresh
  - Token persists throughout browser session until tab is closed
- Added comprehensive debug logging for token extraction and storage
- Created `auth-debug.html` diagnostic page for troubleshooting authentication issues

### Changed
- Updated `authStore.ts` to use sessionStorage for token persistence
- Updated `embeddedDataLoader.ts` to check sessionStorage before failing authentication
- Enhanced logging in authentication flow for better debugging

## [0.2.0] - 2025-12-20

### Added
- **Token-Based Authentication**: Full implementation of secure authentication system for DR CLI integration
  - `authStore.ts`: Central authentication state management with Zustand
  - Automatic token extraction from URL query parameters
  - Authorization header injection in all API requests
  - WebSocket authentication via query parameters
  - Backward compatible with non-authenticated local development
- **Reference Server Authentication**: Optional `--auth` flag for testing authentication flow locally
  - Secure token generation using Python's `secrets.token_urlsafe(32)`
  - Magic link display on server startup
  - Authentication middleware with proper static asset handling
  - Support for both `Authorization: Bearer` header and `?token=` query parameter validation
  - Constant-time token comparison to prevent timing attacks
- **Authentication Documentation**:
  - `DR_CLI_INTEGRATION.md`: Comprehensive guide for DR CLI team on authentication implementation
  - `TESTING_AUTHENTICATION.md`: Complete testing guide with scenarios and troubleshooting
  - `test-auth.sh`: Automated authentication testing script
- **Enhanced DR Model**: Expanded architecture model from 140 to 178 elements
  - Added UX layer components, interactions, and screens
  - Added Navigation layer breadcrumbs, menus, and routes
  - Improved model completeness and traceability
- **Claude Code Skills Reorganization**: Restructured DR skills for better organization
  - New layer-specific skills for all 12 DR layers (motivation through testing)
  - Added `dr-advisor` agent for architectural guidance
  - Enhanced `dr-architect` agent capabilities
  - Renamed skills to use consistent `dr_##_layer_name` pattern

### Changed
- Updated `embeddedDataLoader.ts` to inject authentication headers in all fetch requests
- Updated `websocketClient.ts` to support token-based WebSocket authentication
- Enhanced `EmbeddedLayout.tsx` to initialize WebSocket with authentication token
- Refactored reference server static asset detection to properly exclude API endpoints
- Improved Claude Code skill structure for better discoverability

### Fixed
- **Critical**: Fixed reference server static asset detection incorrectly treating `/api/*` paths as static assets
  - API endpoints were bypassing authentication due to missing file extension check
  - Added explicit exclusion of `/api/*` and `/ws` paths from static asset logic
- **Critical**: Fixed Python scoping issue with AuthConfig class using proper `__init__` method
- Fixed breadcrumbs YAML parsing error in navigation layer
- Resolved path resolution issues in embedded app

### Security
- Implemented cryptographically secure token generation for authentication
- Added constant-time token comparison to prevent timing attacks
- Protected API and WebSocket endpoints while keeping static assets public
- Validated authentication implementation matches DR CLI security patterns

## [0.1.0] - 2025-12-06

### Added
- **Motivation Layer**: Visualization of goals, requirements, and stakeholders with force-directed layout.
- **Business Layer**: Visualization of business capabilities and processes with swimlane and hierarchical layouts.
- **C4 Architecture**: Support for Context, Container, and Component diagrams with drill-down capabilities.
- **Embedded Mode**: Dedicated build and configuration for embedding the viewer in other applications.
- **Reference Server**: Python-based reference implementation of the backend API and WebSocket server.
- **Refinement Workflows**: Interactive tools for optimizing graph layouts and visual clarity.
- **Metrics & Testing**: Comprehensive test suite including visual regression, layout quality metrics, and performance benchmarks.
- **Data Model**: Full support for the `documentation-robotics` v1.0.0 meta-model.

### Changed
- Updated project structure to align with the new data model.
- Refactored graph builders to support the new schema definitions.
- Improved layout algorithms for better readability of complex graphs.

### Fixed
- Resolved path resolution issues in the embedded app.
- Fixed connection status indicator visibility in dual-view mode.
- Corrected schema validation for business layer relationships.
