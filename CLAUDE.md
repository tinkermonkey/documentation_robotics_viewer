# Claude Code Development Guide

## Project Overview

React visualization tool for multi-layer architecture documentation models, built on the **Heimdall design
system**. The app is both **served from** and **fed data by** the Documentation Robotics (`dr`) CLI — it is a
thin, Heimdall-native front end over the CLI's REST + WebSocket API.

**Tech Stack:** React 19 + TypeScript, `@tinkermonkey/heimdall-ui` (Heimdall design system, pinned from git),
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
│   │   ├── AppShell.tsx       # 5-pane flex frame (topbar / nav rail / canvas / inspector / chat drawer / statusbar)
│   │   ├── Topbar.tsx LeftRail.tsx NavTree.tsx StatusBar.tsx
│   │   ├── Canvas.tsx Inspector.tsx               # Model + Schema views (branch on uiStore.view)
│   │   ├── ChangesetCanvas.tsx ChangesetInspector.tsx
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
public/fonts/                  # Self-hosted Inter + JetBrains Mono woff2 (served at /fonts/...)
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

Package `@tinkermonkey/heimdall-ui`, pinned to a git commit. Components imported from the package;
`main.tsx` imports `@tinkermonkey/heimdall-ui/css` and `@tinkermonkey/heimdall-ui/fonts` once, after
`./index.css`.

**Tokens** are CSS custom properties — **always consume tokens, never raw hex**:
- Shell (always dark): `--shell-bg`, `--shell-surface`, `--shell-border`, `--shell-fg-1..4`
- Canvas (light default, flips with `body.dark-canvas`): `--canvas-bg`, `--canvas-surface`, `--canvas-card`,
  `--canvas-border`, `--canvas-fg-1..4`
- Accent: `--accent-primary` = amber `#FBBF24` (Heimdall's default; matches the design)
- Status: `--status-ok/-warn/-error/-emerald/-cyan/-amber/-rose/-violet`

Use them as `rgb(var(--canvas-bg))` etc. so the **dark-canvas toggle** (`uiStore.toggleCanvasDark` →
`body.classList.toggle('dark-canvas')`) flips every canvas region automatically.

**Key Heimdall components in use:** `GraphCanvas` / `GraphNode` / `GraphEdge` / `GraphInspector`,
`PageHeader`, `NavItem`, `Statusbar`, `SegmentedControl`, `ChatContainer` / `ChatMessage` (+ `ToolBlock` /
`ThinkingBlock`) / `ChatComposer` / `ChatSuggestions` / `ChatMarkdownContent`, `DiffViewer` /
`SideBySideDiff`, `StatTile` / `StatGrid`, `StatusBadge` / `Badge` / `Chip`, `Button`, `TextArea` /
`TextInput`, `Select`, `Modal` / `ConfirmDialog` / `Toast`, `RowMenu`, `KVGrid`, `Icon`. (We hand-roll the
5-pane `AppShell` and 3-level `NavTree` rather than using `ShellLayout`/`Sidebar`, which are single-canvas /
2-level only.)

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
  `GET /api/changesets`, `GET /api/changesets/:id`
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
  keyed by `view:layerId` so it recenters on switch.
- **Schema view** — per-layer node-type graph + inspector from `/api/spec` (attributes, predicate edges with
  cardinality).
- **Changesets view** — op-coded diff list (add=emerald / update=cyan / delete=rose) + `StatTile` inspector +
  expandable `SideBySideDiff`.
- **DrBot chat** — 372px drawer (persistent ≥1300px, overlay below) with live WS/JSON-RPC streaming;
  `chatAdapter.ts` maps our `parts` union onto Heimdall's message/tool/thinking blocks.
- **Annotations** — REST CRUD + replies in the inspector for Model elements.
- **Light/dark canvas** toggle in the topbar.

## Local Development & Verification

```bash
# Backend (API + WS): run from a project with a populated .dr model (this repo has one)
dr visualize --no-auth --port 8080 --no-browser

# Frontend (Vite :3001, proxies /api,/health,/ws → :8080)
npm run dev

# Production build → dist/embedded/dr-viewer-bundle (served by: dr visualize --viewer-path <bundle>)
npm run build

# Tests
npm test            # Vitest: unit + integration + component (262 tests, ~1.6s)
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
| Fonts fall back to system | woff2 404 (served as HTML) | Self-hosted under `public/fonts`; keep `@font-face` `/fonts/...` paths |
| Stale UI after an edit | Vite transform cache | Restart dev server + `rm -rf node_modules/.vite` |

## Testing

The Heimdall-era suite (Vitest + Playwright) — see [documentation/TESTING_STRATEGY.md](documentation/TESTING_STRATEGY.md):

- **Vitest** (`npm test`, **262 tests**): `tests/unit/` pure-function transforms (`modelGraph` dotted-id /
  445-link resolution, `chatAdapter`, `changesets` op-folding, `specGraph`, `relationships`, `uiStore`),
  `tests/integration/` infra over a mock WebSocket + MSW (the **WS double-emit** regression, `jsonRpcHandler`,
  `chatService` streaming, data hooks), `tests/components/` Testing Library renders of the `ui/` layer.
  Helpers + real API fixtures live in `tests/helpers/` + `tests/fixtures/`.
- **Playwright** (`npm run test:e2e`, **20 tests** in `tests/e2e/`): drives the **production bundle** served
  by `dr visualize` on a dedicated port — shell, model/schema/changesets views, live chat single-render
  (double-emit), annotations CRUD (self-cleaning), and **axe** WCAG 2.1 AA on every view in light + dark.
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
