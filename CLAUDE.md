# Claude Code Development Guide

## Project Overview

React visualization tool for multi-layer architecture documentation models, built on the **Heimdall design
system**. The app is both **served from** and **fed data by** the Documentation Robotics (`dr`) CLI — it is a
thin, Heimdall-native front end over the CLI's REST + WebSocket API.

**Tech Stack:** React 19 + TypeScript, `@tinkermonkey/heimdall-ui` (Heimdall design system, pinned via npm),
Vite 6, Tailwind CSS v4, TanStack Router + TanStack Query, Zustand 5.

**12 Architecture Layers:** Motivation, Business, Security, Application, Technology, API, Data Model,
Data Store, UX, Navigation, APM, Testing.

> **History:** The UX was fully rebuilt on Heimdall (June 2026), replacing the previous React Flow +
> Flowbite + Storybook + Playwright stack. There is **no React Flow, Flowbite, Storybook, or Playwright**
> in the codebase. The data/infrastructure layer (API client, WS/JSON-RPC, chat service, data stores,
> types) was kept; the entire presentation layer is new and lives under `src/apps/embedded/ui` + `data`.

## Development Principles

1. **Read first, always** - NEVER modify code you haven't read
2. **Edit, don't create** - prefer editing existing files; follow the patterns already in `ui/` and `data/`
3. **Compose Heimdall** - build screens from `@tinkermonkey/heimdall-ui` components + tokens, not from scratch
4. **Use TypeScript strictly** - all files strongly typed; `npx tsc --noEmit` must stay clean
5. **Test thoroughly** - run `npm test` (Vitest) before completing; for UI behavior also verify live with
   chrome-devtools / CDP (see Local Development and Testing)
6. **Avoid over-engineering** - only make requested changes

## Component Organization

```
src/
├── apps/embedded/              # The application
│   ├── main.tsx               # Boot: magic-link token + fetch interceptor + Heimdall css/fonts + RouterProvider
│   ├── router.tsx             # TanStack hash router; RootShell runs the WS bootstrap; routes drive uiStore.view
│   ├── AuthRoute.tsx          # Magic-link token capture
│   ├── ui/                    # NEW Heimdall-based UX layer (presentation only)
│   │   ├── AppShell.tsx       # 4-pane flex frame (topbar / nav rail / canvas / chat drawer / statusbar)
│   │   ├── Topbar.tsx LeftRail.tsx NavTree.tsx StatusBar.tsx
│   │   ├── Canvas.tsx Inspector.tsx               # Model + Schema views (branch on uiStore.view);
│   │   │                                          # Inspector is a Heimdall DetailDrawer overlay INSIDE Canvas, not an AppShell column
│   │   ├── ChangesetCanvas.tsx ChangesetInspector.tsx   # Changesets keeps a permanent Inspector column (not a drawer)
│   │   ├── ChangesetInbox.tsx ChangesetReviewPanel.tsx ChangeInspector.tsx ApplyReview.tsx  # per-change review
│   │   ├── reviewParts.tsx changeset-review.css   # review chips/swatches + styles
│   │   ├── ChangesetImpactView.tsx # Changesets › Impact tab: reach of the changed elements as lanes
│   │   ├── Tier1Panel.tsx     # Changesets inbox: Tier 1 state + month's spend (GET /api/tier1), read-only
│   │   ├── ChatDrawer.tsx ChatPanel.tsx chatAdapter.ts   # DrBot live chat
│   │   ├── AnnotationsSection.tsx                 # Inspector annotations (Model elements)
│   │   ├── uiStore.ts         # Zustand UI state: view/layer/selection/changeset/canvasDark/chatOpen/wide/expanded
│   │   ├── domain.ts          # 12-layer slug→color/label map
│   │   └── domain-and-nav.css # 12-domain swatch CSS + nav-item helpers (Heimdall's bundle lacks DR domains)
│   ├── data/                  # Stateless hooks + transforms over the API (no UI)
│   │   ├── useModel.ts useSpec.ts useChangesets.ts useAnnotations.ts   # React Query hooks
│   │   ├── modelGraph.ts      # /api/model → GraphCanvas nodes/edges; dottedId() + dual-index link resolver
│   │   ├── specGraph.ts       # /api/spec → node-type graph
│   │   ├── relationships.ts   # in/out/cross-layer RelationshipLink derivation
│   │   ├── reach.ts followDepth.ts   # whole-model Heimdall layered index + inspector "followed across layers" reach
│   │   ├── changesetImpact.ts # changeset over the model → multi-origin reach subgraph + per-layer blast radius
│   │   ├── changesetReview.ts useChangesetReview.ts  # pure review model + verdict hook (server or localStorage)
│   │   ├── tier1.ts useTier1.ts  # Tier 1 wire types (ChangeOrigin, Tier1Status) + origin/spend helpers + status hook
│   │   └── changesets.ts      # changeset op-row + diff helpers
│   ├── services/              # KEPT infra: websocketClient, jsonRpcHandler, chatService, errorTracker, embeddedDataLoader, chatValidation
│   ├── stores/                # KEPT data stores: annotationStore, authStore, changesetStore, chatStore, connectionStore
│   ├── types/                 # chat, annotations, websocket, brands
│   └── utils/                 # fetchInterceptor (auth header), etc.
├── core/                      # Framework-agnostic, NO app/route deps
│   ├── services/generatedApiClient.ts   # AUTO-GENERATED from docs/api-spec.yaml (npm run client:generate)
│   ├── services/exceptionClassifier.ts
│   ├── stores/                # modelStore, layerStore, elementStore, crossLayerStore
│   └── types/                 # model.ts, layers.ts, api-client.ts (generated), exceptions.ts
├── index.css                  # Tailwind v4 import + Heimdall css/fonts + domain swatch / nav helper CSS
```

**Architecture Rules:**
- **`ui/`**: presentation only. Composes Heimdall components; reads/writes `uiStore` (Zustand). No data fetching
  logic beyond calling `data/` hooks.
- **`data/`**: stateless hooks + pure transforms over the REST API via TanStack Query. No JSX.
- **`core/`**: NO route/store-from-app dependencies. Kept infrastructure and generated types only.
- **Stores**: Zustand only (NO React context for state). Data stores in `stores/`; UI state in `ui/uiStore.ts`.
- **Generated code**: never hand-edit `core/types/api-client.ts` or `core/services/generatedApiClient.ts` —
  regenerate with `npm run client:generate` (runs in `npm run build`).

## Design System: Heimdall

Package `@tinkermonkey/heimdall-ui`, published to npm and pinned to an exact version (no `^`/`~` range —
`npm view @tinkermonkey/heimdall-ui versions` before bumping, and confirm `package-lock.json` actually
resolves it via `https://registry.npmjs.org/...` rather than reusing a stale git-resolved lockfile entry;
`npm install` alone won't force that switch if the currently-locked version number already satisfies the
new range, even when the resolution mechanism changed — use `npm install @tinkermonkey/heimdall-ui@<version>
--save-exact` to force a real re-resolve). Components imported from the package; `main.tsx` imports
`@tinkermonkey/heimdall-ui/css` and `@tinkermonkey/heimdall-ui/fonts` once, after `./index.css`.

**Tokens** are CSS custom properties — **always consume tokens, never raw hex**:
- Shell (always dark): `--shell-bg`, `--shell-surface`, `--shell-border`, `--shell-fg-1..4`
- Canvas (light default, flips with `body.dark-canvas`): `--canvas-bg`, `--canvas-surface`, `--canvas-card`,
  `--canvas-border`, `--canvas-fg-1..4`
- Accent: `--accent-primary` = amber `#FBBF24` (Heimdall's default; matches the design)
- Status: `--status-ok/-warn/-error/-emerald/-cyan/-amber/-rose/-violet`

Use them as `rgb(var(--canvas-bg))` etc. so the **dark-canvas toggle** (`uiStore.toggleCanvasDark` →
`body.classList.toggle('dark-canvas')`) flips every canvas region automatically.

**Key Heimdall components in use:** `GraphCanvas` / `GraphNode` / `GraphEdge` / `GraphInspector` /
`GraphToolbar` / `DetailDrawer`, `PageHeader`, `NavItem`, `Statusbar`, `SegmentedControl`, `ChatContainer` /
`ChatMessage` (+ `ToolBlock` / `ThinkingBlock`) / `ChatComposer` / `ChatSuggestions` / `ChatMarkdownContent`,
`DiffViewer` / `SideBySideDiff`, `StatTile` / `StatGrid`, `StatusBadge` / `Badge` / `Chip`, `Button`,
`TextArea` / `TextInput`, `Select`, `Modal` / `ConfirmDialog` / `Toast`, `RowMenu`, `KVGrid`, `Icon`, and
from 0.10's layered-graph framework the headless `buildLayeredIndex` / `computeReach` (+ `followOptionLabel`).
heimdall-ui 0.11's `useLayeredGraph` + `GraphCanvas layout="layer-lanes"` drive the Changesets Impact
tab; the other framework views (`LayerStack`, `AdjacencyMatrix`, `HivePlot`, `LayeredGraphExplorer`) are
not used yet. (We
hand-roll the `AppShell` and 3-level `NavTree` rather than using `ShellLayout`/`Sidebar`, which are
single-canvas / 2-level only.)

**Domain colors (load-bearing):** the 12 DR layer colors are NOT in Heimdall's bundle. They live in
`src/apps/embedded/ui/domain.ts` and are applied to graph node swatches via
`.graph-node[data-domain="<slug>"] .graph-node__swatch { background: <hex> }` in `domain-and-nav.css`.
Pass `domainColor` = the **layer slug** (e.g. `data-model`), not a hex.

**Styling Rules:**
1. Compose Heimdall components + tokens; Tailwind v4 utilities only for the custom shell layout.
2. NEVER hardcode hex in canvas regions — use `rgb(var(--canvas-*))` so dark mode flips it.
3. NEVER use dot notation — `List.Item` → `ListItem`.
4. Add `data-testid` to interactive elements (for the future E2E suite).

## Data / API (the DR CLI)

The `dr visualize` server (default `:8080`) serves the built viewer AND the data API.

**REST:**
- `GET /health` → `{ status, version }` (no auth)
- `GET /api/model` → `{ nodes:[{id(UUID), spec_node_id, type, layer_id, name, description, attributes,
  source_reference, metadata}], links:[{id, source, target, type, source_layer_id?, target_layer_id?}] }`
- `GET /api/layers/:name`, `GET /api/spec` (per-layer `nodeSchemas` + `relationshipSchemas`),
  `GET /api/changesets`, `GET /api/changesets/:id` (+ `revision`, `origin`, `unstaged` tombstones, `review`,
  delete `blockers`), `PUT /api/changesets/:id/review` (`{ decisions: [{ sequence, verdict|null, note? }] }`),
  `POST /api/changesets/:id/commit` (optional `{ drop, deleteBlockedLinks }` → `dropped`, `linksDeleted`) /
  `POST /api/changesets/:id/discard` (staged only; 404 unknown, 409 not staged or model drifted, 422 failed
  validation or deletes still in use — body `{ error, blockers? }`)
- `GET /api/tier1` → Tier 1 state + this month's spend (`Tier1Status`; read-only, never a credential value; an
  older dr CLI answers 404). Each change in `GET /api/changesets/:id` (and `unstaged[].change`) may carry
  `origin: { by: tier0|tier1|agent, rule?, provider?, model?, upstream?, p?: { layer, type }, confirmed? }`
- Annotations CRUD: `GET/POST /api/annotations`, `GET/PATCH/DELETE /api/annotations/:id`,
  `GET/POST /api/annotations/:id/replies`

**WebSocket (JSON-RPC 2.0, `ws://:8080/ws`):** notifications `model` / `changesets` / `annotations`; chat
methods `chat.send` / `chat.status` / `chat.cancel` with streaming notifications `chat.response.chunk` /
`chat.tool.invoke` / `chat.thinking` / `chat.usage` / `chat.error`.

**Auth:** Bearer token. `main.tsx` captures a magic-link `?token`, stores it, and cleans the URL;
`utils/fetchInterceptor` adds the `Authorization` header; the WS authenticates via `Sec-WebSocket-Protocol`.
For local dev use `dr visualize --no-auth`.

**Data-shape gotchas (see `data/modelGraph.ts`):**
- `/api/model` `links[]` reference nodes by **UUID OR a canonical dotted id** `{layer}.{type}.{slug(name)}`.
  `dottedId()` builds it and the index keys nodes under both so all links resolve. The dotted id is also the
  **`elementId` the annotations API expects** (not the UUID).
- `/api/spec` node types come from `Object.keys(nodeSchemas)` — `layer.node_types` can be empty.
  `relationshipSchemas` carry `predicate`, `cardinality`, and cross-layer endpoints.

## Views & Features

- **Model view** — per-layer instance `GraphCanvas` (domain-colored nodes + intra-layer edges) +
  `GraphInspector` (properties, in/out + cross-layer relationships with click-to-navigate). `GraphCanvas` is
  keyed by `view:layerId:graphLayout:nodeMarginPreset` so it recenters on switch.
- **Schema view** — per-layer node-type graph + inspector from `/api/spec` (attributes, predicate edges with
  cardinality).
- **Inspector selection drawer** (`Inspector.tsx`, both Model + Schema) — a Heimdall `DetailDrawer` overlay
  floating over the graph area's right edge, not a permanent sidebar column: translucent/blurred, auto-hides
  (`open={!!metadata}`) when nothing's selected, resizable via its own left-edge handle (local `width` state,
  default 320px). Rendered inside `Canvas.tsx`'s `position: relative` graph wrapper (must be — that's the
  ancestor `DetailDrawer` overlays), graph-mode only. Changesets keeps its own permanent
  `ChangesetInspector` column (not converted to a drawer). Its two "free" corners (top-left/bottom-left —
  the right edge is flush against the canvas) are rounded via a `.detail-drawer` override in
  `domain-and-nav.css` using `--radius-lg`, the same "normal" radius other floating Heimdall panels use;
  Heimdall's own `DetailDrawer.css` ships it flush (no radius at all).
- **Graph layout/display controls** — split by how often they're used (Model + Schema views):
  - **Page header** (`GraphHeaderControls` in `Canvas.tsx`, left of the graph/page toggle, graph mode only):
    Layout (`graphLayout`: Clustered `force-clustered` / Organic `organic` default / Orthogonal — the only
    three offered; a persisted force/galaxy/radial-tree falls back to organic), Relations
    (`showAllRelations`), Inter-layer (`showInterLayerNodes`, Model only). The header gets a `canvas-header`
    class whose CSS (`domain-and-nav.css`) lets the actions wrap below the title in a narrow canvas —
    Heimdall's `PageHeader` never wraps and otherwise crushes the title.
  - **Settings flyout** (`GraphControls`, gear top-left over the graph): Display (`nodeDisplay`, Model only),
    Node margin (`nodeMarginPreset`), Boundaries (`showClusterBoundaries`, Clustered only). Collapsed to a
    transparent `.graph-toolbar__btn` icon; hover/focus expands a translucent panel. The gear and panel sit
    in ONE `pointer-events: auto` box with the space between them as `paddingTop` — they used to be
    separate boxes with a pointer-events-none margin between, so a slow move from the gear to the panel
    "left" and closed it. Mouse-leave closes after `FLYOUT_CLOSE_DELAY_MS` (cancelled by re-entering); blur
    closes at once. Collapse is `relatedTarget`-based (`collapseIfLeavingFlyout`), so moving between
    controls inside it doesn't close it.
  "Structural" relations use
  `data/predicates.ts`'s `isStructuralEdge` — a hardcoded DR predicate `category` classification
  (mirrors `ui/domain.ts`'s hardcoded layer colors; not exposed by `/api/model` or `/api/spec`). The
  built-in `GraphToolbar` (zoom/lock/fullscreen + galaxy's live-simulation toggle) is pinned
  `toolbarPosition="bottom-left"` — not bottom-right, which collides with the Inspector `DetailDrawer`
  floating over the graph's right edge whenever a node is selected — forced into a vertical stack via a
  `.graph-toolbar--bottom-left` override in `domain-and-nav.css` (Heimdall only stacks vertically for
  `left-center`/`right-center` natively).
  `GraphCanvas`'s `onBackgroundClick` reuses `selectLayer(layerId)` (clearing `selectedId`/`focus` back to
  `'layer'`) so clicking empty canvas deselects — the only way the Inspector drawer's auto-hide is
  reachable.
- **Selection auto-centers (except on-canvas clicks), Fullscreen includes the overlay chrome** (heimdall-ui
  0.7.0) — `GraphCanvas`'s `centerOnSelect` (Model + Schema) pans to the selected node when the selection
  comes from elsewhere: a NavTree click, a cross-layer navigate-to link, a URL-restored deep link. It is
  turned OFF while the current selection came from clicking that node in the graph (re-centering under the
  pointer was distracting): `Canvas.tsx` records `{ id, navSeq }` in `canvasClick` via `selectFromCanvas`,
  which EVERY on-canvas select path must use — `GraphCanvas`'s `onNodeSelect` and the `ModelCardNode`/
  `PillNode` `onSelect` (they handle their own click). A new selection or a `navSeq` bump re-enables it.
  `fullscreenContainerRef={canvasAreaRef}` — a ref on `Canvas.tsx`'s
  graph-mode `position: relative` wrapper — points the built-in toolbar's Fullscreen button at that
  wrapper instead of `GraphCanvas`'s own root, so `GraphControls` and `Inspector` (both its siblings,
  outside what the native Fullscreen API would otherwise render) stay visible while fullscreen.
- **Predicate hover explanations wait 3s** (`PREDICATE_TOOLTIP_DELAY_MS` in `ui/PredicateTooltip.tsx`) —
  predicates are also click targets (navigate / select the edge), and a quick tooltip covered them while
  aiming. `PredicateTooltip` (inspector, page tables, edge inspector) passes it as `RichTooltip`'s
  `openDelay`; keyboard focus still opens immediately. Graph edges do NOT use heimdall's `edgeTooltip` prop
  (it pins the tooltip above the edge midpoint — right over the predicate label it explains, with a fixed
  200ms delay): `Canvas.tsx` feeds `onEdgeHover` into `ui/useHoverDwell.ts` and, after 3s, renders the same
  `TooltipCard` the layer/element pills use (exported from `RichTooltip.tsx`), anchored to the edge's label
  via `ui/edgeTooltipAnchor.ts` and auto-placed on a side with room (`track` follows it through pan/zoom,
  `passThrough` keeps it out of the pointer's way). That hover state is local to Canvas — never route edge
  hover through the store or the `edges` memo (re-runs the layout; see `useEdgeInteraction.ts`).
- **Changesets view: review, change by change** — the view opens on an inbox (`ChangesetInbox`, no
  changeset selected; `AppShell` no longer auto-selects one and hides the inspector column): staged changesets
  *waiting on you* / *waiting on DrBot* (every change decided, some asks) with review progress, then *applied
  and discarded*. Opening/closing a changeset PUSHES history; a `#/changesets/list` entry without `?changeset=`
  is the inbox. A changeset's Review tab (`ChangesetReviewPanel`) gives each change a verdict — Keep / Drop /
  Ask DrBot — instead of one Apply for the lot (DrBot stages under `dr visualize --with-changesets`, never
  commits). `data/changesetReview.ts` is the pure model (see its header): review-weight groups (blocked
  deletes, routine updates with a bulk "Keep N routine", new elements, new links, removals), add-then-delete
  "cancel out" pairs folded away (never a delete with blockers: the server checks every staged delete), effective decisions (a decision on a change rewritten after it no longer
  counts), the server's drop cascade (dropping an add leaves out its links/updates), dropped link deletes a
  kept element delete contradicts (`conflicts`, Apply waits), the since-your-review diff (revised / new /
  withdrawn / carried over, from `revision`, `unstaged` tombstones and `review.lastReviewedRevision`) and the
  apply plan. `reviewCounts` is the decided / total / asked definition shared with the dr CLI's list (total =
  staged minus pair members; a change cascaded from a dropped add counts as decided); the inbox works it out
  from the detail + local verdicts for an older CLI. A kept delete that gains a blocker the reviewer hadn't
  seen (`localReviewStore.blockersSeen`, recorded per keep) goes back to "needs decision". A summary card (headline, tally, pills, `ProgressBar`, Discard / Keep the other N / Apply) and
  Show (Since your review · Needs decision · Decided · All) / Group by (Review weight · Layer · Sequence)
  `SegmentedControl`s sit over the rows. A row selects `uiStore.changeSeq` (not persisted, cleared on a
  changeset switch), and the permanent inspector column becomes `ChangeInspector`: decision + note (Ask DrBot
  with a note also posts it as an annotation on the element — not for an element only this changeset adds), a
  blocked delete's Resolve choices (Delete the links too = keep, Keep the element = drop; radios only pick,
  Confirm records, Clear verdict clears), before/after per changed field (field in amber), source, the
  changeset's other changes on that element, the JSON diff and comments; with no change selected it shows the
  changeset overview (`BlastRadius`, StatTiles). Apply opens `ApplyConfirm` (what lands, what's left out
  incl. cascades, links deleted with their elements) and commits through the generated
  `usePostapichangesetschangesetIdcommit` with body `{ drop, deleteBlockedLinks }` (BOTH lists, always — the
  server only applies reviewed-commit rules when the body names either); a committed changeset shows
  `AppliedResult` (landed by layer, what was left out). Refusals inline: 409 drift ("nothing was written, your
  decisions are kept"), 422 `blockers` (named per delete), else the server's `{ error }`.
  Verdicts: `useChangesetReview` → its own `useMutation` over the generated client's
  `putapichangesetschangesetIdreview`, with hook-level `onMutate` (cancel detail fetches, optimistic write) /
  `onError` (revert only that PUT's verdicts on the CURRENT cached detail — never a stale snapshot, which would
  wipe a websocket refetch) and a mutation `scope` per changeset so PUTs run one at a time, in order; the
  detail refetches when the last queued PUT settles. Apply / Discard clear the changeset's local verdicts. **Older dr CLI**
  (no `review` in the detail, or the PUT answers 404/405 without a JSON `{ error }`): verdicts live in
  localStorage (`stores/localReviewStore.ts`, key `dr-viewer-local-review`, by changeset id + sequence), Drop
  is hidden with an explanation, and Apply sends no body. The generated mutation hooks are typed without
  variables — pass a body through `mutateWithBody`. Two hooks in `AppShell` keep the cache fresh past its
  5-minute `staleTime`: `useLiveModelUpdates` (`data/useModel.ts`) refetches model + changesets on the
  server's `model.updated` WebSocket broadcast (any model-file write: CLI, DrBot, an Apply);
  `useLiveChangesetUpdates` (`data/useChangesets.ts`) refetches changesets on the server's
  `changesets.updated` broadcast (any write under `documentation-robotics/changesets/`, every verdict, Apply
  and Discard). Styles: `ui/changeset-review.css` (tokens + Heimdall `--semantic-*` chip colours only).
- **Who decided a change, and Tier 1's spend** — `codebase_extract` records each staged change's `origin`
  (Tier 0 rule / Tier 1 decision model / the agent). The wire types are the generated OpenAPI schemas, aliased
  in `data/tier1.ts` (one place to adjust when the contract moves); read an origin through `originOf`, which
  checks the shape. A review row shows an outlined badge under its op chip (`OriginBadge` in `reviewParts.tsx`:
  Tier 0 neutral, Tier 1 cyan dashed, Agent violet), with rule / provider / model / upstream / probabilities /
  confirmation in a `RichTooltip` on hover; the `ChangeInspector` repeats them in a "Decided by" section (the
  keyboard path: the badge sits inside the row button). A "Decided by" `SegmentedControl` (All / Tier 0 /
  Tier 1 / Agent / No origin, with counts) filters the rows and the since-your-review cards — offered only when
  some change carries an origin; "Keep N routine" then keeps only the shown ones. `Tier1Panel` (in the inbox,
  above the history) reads `GET /api/tier1` via `useTier1`: on / capped / no-credentials / misconfigured get a
  card (state, provider + model, spend bar against the cap — amber with the 80% warning on `nearCap`, rose at
  the cap — reset date, spend per source, where each credential comes from, cache, warnings, `reason`); off
  is one folded line. It offers no action: the server's `note` names the `dr analyzer tier1` command. A 404
  (older dr CLI), 405/501 or a non-Tier1Status body hides it (not retried); other errors show one muted line.
  `useLiveChangesetUpdates` also refetches it.
- **Changeset Impact tab** (heimdall-ui 0.11) — a Review (Changes once applied) / Impact `SegmentedControl` in
  `ChangesetCanvas`'s header swaps the review list for `ChangesetImpactView`: what the changeset reaches
  outside itself, before Apply. `data/changesetImpact.ts` lays the changeset over the model first (a STAGED
  changeset's added elements and `relationship-add`s join the graph; ends of relationship changes are
  marked `relink`), then runs the multi-origin `computeReach` from every marked element at
  `uiStore.inspectorFollow` (shared with the Model inspector's Follow control) and returns the reached
  subgraph. The view renders it as lanes (`skipLayerRouting: 'gutter'`, `intraLinks: 'bundled'`, a
  Reached / All `nodeLabels` toggle) with every origin in a CONTROLLED `selectedIds`; isolation goes
  through `onNodeSelect`, not `onSelectedIdsChange` (the lanes' own click toggles the primary off, which
  never yields a single id). Heimdall's default lane node has no status slot, so ops are a scoped
  `<style>` keyed on `[data-node-id]` (each op a distinct outline style as well as colour) — keeping the
  default node's chips, tags and roving keyboard focus that a `renderNode` would lose. Changes whose
  element isn't in the current model are counted ("n changes not in the model"), not dropped silently.
  `ChangesetInspector`'s `BlastRadius` shows the same reach per layer in the changeset overview. Verify the
  lanes' fit in a visible browser or headless Chrome: a hidden Browser pane throttles animation frames
  and the mount fit never lands.
- **DrBot chat** — 372px drawer (persistent ≥1300px, overlay below) with live WS/JSON-RPC streaming.
  `chat.send` may run for minutes (Claude Code + tools): the client timeout is `CHAT_SEND_TIMEOUT_MS`
  (15 min) — it was 60s, which cut answers off mid-way with a timeout error. The `dr visualize` server's
  `chat.tool.invoke` is snake_case (`tool_name`/`tool_input`) with a `tool_use_id`: once with
  `status: executing`, then again with `completed` or `failed` (a permission denial is `failed`).
  `chatService.handleToolInvoke` matches them by id; a notification without an id or status (an older
  server) gets a local id and is marked completed when the reply moves on (next tool, text) or ends.
  `chat.response.complete` is the end-of-turn result and is ignored. `chat.send` carries the conversation
  id, so the server resumes DrBot's Claude Code session and it remembers the conversation; `reset()` starts
  a new id. The context still goes with each message: `ChatPanel` builds a `<viewer-context>` block (`data/chatContext.ts`: view, layer, selected
  element by name + dotted id + type + uuid, or Schema node type / relationship / changeset) from the live
  store at send time, and `chatService.sendMessage(text, context)` prepends it to the text sent. The thread
  shows only what the user typed.
  `chatAdapter.ts` maps our `parts` union onto Heimdall's message/tool/thinking blocks.
- **Followed across layers** (Model inspector, heimdall-ui 0.10) — below Outgoing/Incoming, a Follow
  control (Direct / +1 layer / +2 layers, `uiStore.inspectorFollow`, persisted, default +1) lists the
  selection's reach past its direct links: `data/reach.ts` builds a whole-model `buildLayeredIndex`
  (`layerBy: 'domainColor'` = layer slug, `LAYER_ORDER` layers) and runs `computeReach`, which continues
  from elements reached over cross-layer links, along cross-layer links, into any layer but the
  selection's own. A reach strip (`.drv-reach-strip`, one segment per layer, width ∝ elements reached,
  domain colours) sits above the rows. A followed row (`FollowedRow`) leads with the target and a `+n` hop
  badge; its arrow + predicate go on the "via X → predicate" line, because they describe the link from the
  via element, not the selection (a leading `→ predicate` read as the selection's own relationship — as in
  Heimdall's `ReachInspector`, not its `GraphInspector`). Its accessible name spells out layer, depth and
  "via X, which <predicate> it" (the visual badge is `aria-hidden`). Direct Outgoing/Incoming rows to
  another layer show that layer's name (`.drv-rel-layer`, `originLayer` prop). `FollowDepth` /
  `FOLLOW_DEPTHS` live in the dependency-free `data/followDepth.ts` so `uiStore` doesn't import
  heimdall-ui. The `.graph-inspector__empty-mini` suppression in `domain-and-nav.css` is scoped to
  `GraphInspector`'s own root so this section's empty state still shows. Not built from the prototype
  (Claude Design canvas, design #6): hop-2 ghost nodes on the graph (would re-run the layout on every
  selection) and the "Open trace in Lanes" link (no Architecture view yet).
- **Annotations** — REST CRUD + replies in the inspector for Model elements. `useLiveAnnotationUpdates`
  (`data/useAnnotations.ts`, mounted in `AppShell`) refetches on the server's `annotation.added` (that
  element's list), `annotation.updated` / `annotation.deleted` (the whole `['annotations']` prefix — they carry
  no `elementId`) and `annotation.reply.added` (that annotation's replies), so comments an agent writes
  through the MCP tools appear without a reload. It only invalidates, so the echo of the viewer's own writes
  never inserts twice. On a delete it drops the replies query only after the lists refetch and only if
  inactive — removing one a still-mounted thread observes refetches it, and that's a 404.
- **Light/dark canvas** toggle in the topbar. **Dark is the default** (`uiStore`'s `canvasDark: true`) —
  applies only on a first-ever visit; a persisted choice always wins after that.
- **Preference persistence** (`uiStore.ts`, `zustand/middleware`'s `persist`) — `canvasDark`, `chatOpen`
  (DrBot open/closed), and the graph settings (`graphLayout`/`showClusterBoundaries`/`showAllRelations`/
  `nodeMarginPreset`/`nodeDisplay`/`showInterLayerNodes`) and the inspector's `inspectorFollow` survive a
  reload via localStorage (key `PERSIST_KEY` = `dr-viewer-ui-preferences`,
  see its `partialize`). Navigation state (view/layerId/selectedId/changesetId/mode/focus/expanded*) is
  deliberately EXCLUDED from persistence — that's the URL router's job instead (below), so the two
  mechanisms never fight over which one is authoritative for "where you are."
- **URL routing for left-panel selections** (`router.tsx`'s `AppShellRoute`) — `?layer=`/`?node=`/
  `?changeset=` search params two-way sync with `uiStore.layerId`/`selectedId`/`changesetId`, on top of
  the existing `:section`/`:view` path sync. Covers selections from ANYWHERE (nav tree clicks, graph node
  clicks, cross-layer navigation), not just the nav tree, since they all drive the same store fields.
  `:view` carries the graph/page mode for Model + Schema (`#/model/page?...`). Destination changes PUSH a
  history entry: view, mode, layer, a deliberate navigation (`uiStore.navSeq`, bumped by
  `navigateToElement`/`navigateToElementWithEdge`/`navigateToSpecNode` — nav-tree leaves, relationship
  links, neighborhood/page-table clicks, inter-layer nodes), or any selection change in page mode. Plain
  on-canvas selection within a layer REPLACES the entry so graph clicks don't flood history. The effect
  skips navigating when the store already matches the URL, so back/forward never push duplicates. An entry with
  `?layer=` but no `?node=`/`?edge=` means nothing is selected: back/forward onto one clears the selection
  being left (otherwise the store → URL effect writes that node back onto the older entry).
- **Viewport history** (`?vp=centerX,centerY,zoom,tag`, heimdall-ui 0.9.4) — `ui/useViewportHistory.ts` spreads
  onto the Model/Schema `GraphCanvas`: it records `uiStore.graphViewport` on `onViewportDwell` (pan/zoom
  settled) and on `onViewportNavigate` (centerOnSelect, toolbar/fullscreen fit — not the mount fit), and
  restores via `initialViewport` (reload/deep link) or a silent `viewportRef.setViewport` (back/forward; the
  silent call also cancels a pending centerOnSelect report). The router mirrors it into `?vp=` and only ever
  REPLACES for it, so each history entry holds the last view seen there. A viewport is tagged with its
  canvas's `graphCanvasKey` (`ui/graphViewport.ts`, also the GraphCanvas React key): a layer, view or layout
  setting change drops it rather than applying world coordinates to a different layout. The URL's `tag` is
  `scopeTag(graphCanvasKey)`: layout/display settings live in each viewer's preferences, not the URL, so a
  `?vp=` from an older history entry or someone else's link only applies when its tag matches the live
  canvas (a tagless three-number link always applies); otherwise the router drops it, replacing the entry in
  place rather than pushing. Kept on page-mode
  URLs so toggling back to graph returns to the same view. After a drag-pan flick the dwell lands ~4–5s
  later (heimdall's inertia tail + 1.5s `dwellMs`).

## Local Development & Verification

```bash
# Backend (API + WS): run from a project with a populated .dr model (this repo has one)
dr visualize --no-auth --port 8080 --no-browser

# Frontend (Vite :3001, proxies /api,/health,/ws → :8080)
npm run dev

# Production build → dist/embedded/dr-viewer-bundle (served by: dr visualize --viewer-path <bundle>)
npm run build

# Tests
npm test            # Vitest: unit + integration + component (~690 tests)
npm run test:watch  # Vitest watch
npm run test:cov    # Vitest with coverage
npm run test:types  # type-check the tests (tsconfig.test.json)
npm run test:e2e    # Playwright E2E (builds + serves the bundle via dr visualize, then drives it)

# Type check (must be clean)
npx tsc --noEmit

# Regenerate the API client from docs/api-spec.yaml
npm run client:generate
```

**Verify changes live** (no test suite yet): open the app with the chrome-devtools MCP (or a headless Chrome
over CDP) and check rendering, console, and network. Machine note: this Vite setup's watcher can serve stale
transforms after edits — if a change doesn't appear, restart the dev server and `rm -rf node_modules/.vite`.

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Node swatch is gray | `domainColor` is a hex, or domain CSS missing | Pass the layer **slug**; ensure `domain-and-nav.css` has `.graph-node[data-domain="<slug>"]` |
| Graph stays panned after switching layer | `GraphCanvas` auto-centers once | Key it by `view:layerId` |
| Edges/relationships empty | Link endpoint id not resolved | Use `modelGraph` dual-index (UUID + dotted id) |
| Annotation POST 400 | Wrong `elementId` | Use `dottedId(node)` (`layer.type.slug`), not the UUID |
| Color doesn't flip in dark mode | Hardcoded hex | Use `rgb(var(--canvas-*))` |
| `DetailDrawer` overlays the wrong region (e.g. whole app row, not just the graph) | Rendered outside the intended `position: relative` ancestor | Render it as a sibling *inside* that ancestor — `Inspector` lives in `Canvas.tsx`'s graph wrapper, not `AppShell.tsx` |
| Floating overlay's buttons are unclickable / read behind another panel | Two absolutely-positioned overlays anchor to the same edge with no explicit stacking order | Prefer moving one to a non-colliding corner if there's a free one (see `GraphToolbar`'s `toolbarPosition="bottom-left"`, moved off `"bottom-right"` specifically to stop colliding with the Inspector `DetailDrawer`); if both must share an edge, give the one that should win an explicit higher `z-index` instead |
| GraphCanvas overflows its box onto content below | Heimdall's `.graph-canvas` has `min-height: 360px`; a smaller fixed-height box with an absolutely positioned canvas can't contain it | Keep the canvas in normal flow (`flex: 1`) inside a box whose min-height is ≥ 360px (see `NeighborhoodGraphView`) |
| A RichTooltip swallows the click on its own trigger | No side had room, so clamping put the card over the trigger and the mouseup landed on it | `computeTooltipPosition` tries all four sides, then sets `overlapsAnchor` → the card gets `pointer-events: none` |
| `?vp=` stripped on load in dev only | StrictMode re-runs the router's store → URL effect with a stale closure where `graphViewport` isn't seeded yet | Read `useUiStore.getState()` inside that effect for the viewport (router.tsx does) |
| Fonts fall back to system | woff2 404 (served as HTML) | Since heimdall-ui 0.11 `@tinkermonkey/heimdall-ui/fonts` uses relative URLs, so Vite emits the woff2 files into `assets/` — keep that import in `main.tsx`; there is no `public/fonts` copy any more. `scripts/package-embedded.cjs` copies the fonts' OFL licence texts into the bundle's `licenses/fonts/` (required when redistributing them) and fails if heimdall-ui stops shipping them |
| Stale UI after an edit | Vite transform cache | Restart dev server + `rm -rf node_modules/.vite`. Before debugging a code change that "isn't taking effect," `fetch()` the source path from the live page and grep the response for a string unique to your edit — cheaper than assuming the logic is wrong |
| `userEvent.click()` on a 2nd element inside a hover-tracked overlay doesn't fire its handler | happy-dom/user-event doesn't reliably exclude a shared ancestor when synthesizing the pointer path between two different click targets, so a spurious `mouseleave` collapses (unmounts) the panel mid-click | Use `fireEvent.click()` for that specific multi-step interaction instead of `userEvent.click()` — confirms it's a test-environment artifact, not a product bug (verify live too) |

## Testing

The Heimdall-era suite (Vitest + Playwright) — see [documentation/TESTING_STRATEGY.md](documentation/TESTING_STRATEGY.md):

- **Vitest** (`npm test`, **~690 tests**): `tests/unit/` pure-function transforms (`modelGraph` dotted-id /
  445-link resolution, `chatAdapter`, `changesets` op-folding, `specGraph`, `relationships`, `reach`, `changesetImpact`, `uiStore`,
  `predicates`), `tests/integration/` infra over a mock WebSocket + MSW (the **WS double-emit** regression,
  `jsonRpcHandler`, `chatService` streaming, data hooks), `tests/components/` Testing Library renders of the
  `ui/` layer. Helpers + real API fixtures live in `tests/helpers/` + `tests/fixtures/`.
- **Playwright** (`npm run test:e2e`, **62 tests** in `tests/e2e/`): drives the **production bundle** served
  by `dr visualize` on a dedicated port — shell, model/schema/changesets views, URL routing + localStorage
  persistence, live chat single-render (double-emit), annotations CRUD (self-cleaning), and **axe** WCAG
  2.1 AA on every view in light + dark.
- **CI**: `.github/workflows/test.yml` — Vitest + `test:types` + build are the required gate; the E2E job is
  separate (boots `dr visualize`).

Tests assert **our** code (transforms, adapter, store, composition, flows) — not Heimdall or the CLI. Add tests
alongside changes; for UI behavior also verify live with chrome-devtools / CDP.

## Accessibility Standards (WCAG 2.1 AA)

All components must meet **WCAG 2.1 Level AA**:
- All interactive elements keyboard accessible; logical tab order; Escape closes overlays; visible focus.
- Heimdall components ship accessible roles/labels — preserve them and pass meaningful `aria-*`/labels.
- Maintain sufficient contrast in both light and dark canvas.

## DR Slash Commands

- `/dr-model <request>` - Add/update/query architecture model elements
- `/dr-validate` - Validate DR model schema and references
- `/dr-changeset <request>` - Manage isolated architecture changes
- `/dr-init [name]` - Initialize new DR architecture model
- `/dr-map <path>` - Generate a DR model from an existing codebase
- `/dr-relate`, `/dr-design`, `/dr-sync`, `/dr-verify`, `/dr-info` - relationship wiring, design, sync, verify, overview

## Notes for Agents

- The project-configured sub-agents and skills named `*-flow-expert`, `*-storybook`, `*-test` (Playwright),
  and `*-patterns` (React Flow) target the **removed** stack and are stale pending update — do not follow
  their React Flow / Flowbite / Storybook guidance.
- When touching the data layer, mind the dotted-id resolution and the `/api/spec` shape above.
