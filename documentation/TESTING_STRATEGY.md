# Testing Strategy (post-Heimdall rebuild)

**Status:** Implemented (June 2026). The previous Playwright + Storybook suite was removed during the Heimdall
UX rebuild; this is the suite that replaced it. Delivered across Phases A–D: **262 Vitest tests**
(`tests/unit` + `tests/integration` + `tests/components`) and **20 Playwright E2E tests** (`tests/e2e`,
incl. axe a11y), with CI in `.github/workflows/test.yml`. This document is both the original scope and the
as-built reference — the sections below describe what was built.

## Goals & philosophy

- **Test our code, not our dependencies.** Heimdall components are tested upstream; the `dr` CLI/API is
  tested in its own repo. We test: the **data transforms**, the **chat adapter**, the **UI store**, our
  **component composition**, and the **end-to-end flows** that wire it all to the live API.
- **Lock in the load-bearing logic and the bugs we already fixed** (dotted-id link resolution, chat
  double-emit, op-count folding) — these are the regressions that would hurt most.
- **Fast feedback first.** Pure-function unit tests (no DOM, no network) form the base of the pyramid;
  E2E is a thin top layer over the real `dr visualize` server.

## Framework choice

| Layer | Tool | Why |
|---|---|---|
| Unit + integration | **Vitest** | Vite-native (shares `vite.config`), fast, ESM/TS out of the box, built-in mocking + coverage. Replaces the old (unusual) Playwright-as-unit-runner setup. |
| Component / DOM | **Vitest + @testing-library/react + happy-dom** | Render our `ui/` composition with mocked `data/` hooks + a real `uiStore`; assert DOM + interactions. |
| API mocking | **MSW** (Mock Service Worker) | Intercept `fetch` for `/api/*` in hook/component tests against captured fixtures; deterministic, no live server. |
| E2E | **Playwright** | Drive the built bundle (or dev server) against a real `dr visualize` backend; mirrors the manual chrome-devtools verification done during the rebuild. |
| Accessibility | **@axe-core/playwright** (E2E) + axe in component tests | WCAG 2.1 AA on key views, both canvas tones. |

**Proposed dev deps:** `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`,
`@testing-library/jest-dom`, `happy-dom`, `msw`, `@playwright/test`, `@axe-core/playwright`.

**Scripts:** `test` (vitest run), `test:watch`, `test:cov`, `test:e2e` (playwright), `test:e2e:headed`.

## Proposed structure

```
tests/
├── unit/                  # pure functions, no DOM/network (Vitest)
│   ├── modelGraph.spec.ts
│   ├── specGraph.spec.ts
│   ├── relationships.spec.ts
│   ├── changesets.spec.ts
│   ├── chatAdapter.spec.ts
│   ├── domain.spec.ts
│   └── uiStore.spec.ts
├── integration/           # infra + hooks with mocked transport (Vitest + MSW)
│   ├── websocketClient.spec.ts
│   ├── jsonRpcHandler.spec.ts
│   ├── chatService.spec.ts
│   └── dataHooks.spec.ts       # useModel/useSpec/useChangesets/useAnnotations vs MSW
├── components/            # @testing-library + happy-dom
│   ├── NavTree.spec.tsx
│   ├── Inspector.spec.tsx
│   ├── Canvas.spec.tsx
│   ├── ChangesetCanvas.spec.tsx
│   ├── ChatPanel.spec.tsx
│   └── AnnotationsSection.spec.tsx
├── e2e/                   # Playwright vs `dr visualize`
│   ├── shell.spec.ts
│   ├── model-view.spec.ts
│   ├── schema-view.spec.ts
│   ├── changesets.spec.ts
│   ├── chat.spec.ts
│   └── annotations.spec.ts
├── fixtures/              # captured API responses (model/spec/changesets), small .dr model for E2E
└── helpers/               # render-with-providers, MSW handlers, CDP/Playwright setup
```

## Priority 1 — pure data-layer unit tests (start here)

Highest value, fastest, no infra. These cover the logic that broke (or could break) the app silently.

- **`modelGraph.ts`** — the most important target.
  - `slugifyName()` — the slug rule that resolved **445/445** live links (hyphenate only at lower→Upper
    boundaries, strip dots: `2.1` → `21`). Table-driven cases incl. acronyms, numbers, punctuation.
  - `dottedId(node)` = `{layer}.{type}.{slug(name)}`.
  - dual-index: a links payload referencing nodes by **both** UUID and dotted id resolves with zero
    unresolved (regression test against a captured `/api/model` fixture — assert all `links` resolve).
  - `nodesForLayer` / `edgesForLayer` — layer filtering; edges only when both endpoints are in the layer;
    deterministic grid positions are stable.
- **`chatAdapter.ts` (`toHeimdallMessages`)** — risk #3, recently fixed.
  - `user`→user, `assistant`/`system`→bot; consecutive `text` parts coalesce into one markdown body.
  - tool status mapping `executing→running`, `completed→success`, `failed→error`; tool input/result/error
    surfaced.
  - interleaved `text`+`thinking`+`tool` parts split into correctly **ordered** bot rows.
  - `error` → inline error; `usage` → meta line; empty/streaming messages don't throw.
- **`changesets.ts`** — `normalizeOp` folds `relationship-add`/`relationship-delete` into add/delete (so
  op-row counts reconcile with `stats`, e.g. pr-497 12 add + 15 rel-add = 27); `opMeta` colors;
  `changeDetail` for add/remove/update; `buildDiffLines(before, after)` handles null sides.
- **`specGraph.ts`** — node types from `Object.keys(nodeSchemas)` (non-empty even when `layer.node_types`
  is `[]`); ids `{slug}.{shortname}`; intra-layer edges only (`source_layer===dest_layer`); cardinality
  abbreviation `many-to-many`→`N:N`; cross-layer rels carry the other layer's domain.
- **`relationships.ts`** — out/in/cross-layer derivation; `metadataForElement` curated to
  layer/type/provenance/source (no scalar-attribute spread).
- **`domain.ts`** — `layerColor`/`layerLabel` for all 12 slugs; ordered layer list.
- **`uiStore.ts`** — `toggleCanvasDark` toggles `body.dark-canvas`; `selectNode`/`navigateToElement`
  (cross-layer switches `layerId`, keeps view); `toggleSection`/`toggleLayer`; `setWide` responsive seed.

## Priority 2 — infrastructure regression tests

- **`websocketClient.ts`** — **regression for the double-emit fix**: a JSON-RPC frame (no `type`) must emit
  the generic `message` event **exactly once** (it previously double-dispatched, doubling chat text);
  typed app frames still emit their type + `message`. Plus: reconnect/backoff, `connect()` tears down a
  prior non-OPEN socket (StrictMode orphan guard), auth via `Sec-WebSocket-Protocol`.
- **`jsonRpcHandler.ts`** — request/response id correlation, notification dispatch, timeout handling.
- **`chatService.ts`** — streaming notifications (`chat.response.chunk`/`tool.invoke`/`thinking`/`usage`/
  `error`) mutate `chatStore` correctly; `-32001` surfaces gracefully; one handler registration per
  instance.
- **`dataHooks`** — `useModel/useSpec/useChangesets/useAnnotations` against MSW fixtures: shape mapping,
  single-fetch caching, annotations CRUD invalidation, lazy replies.

## Priority 3 — component / interaction tests

Render with a real `uiStore` + mocked `data/` hooks (or MSW), assert DOM + user interactions:
- **NavTree** — 3 sections → 12 layers with live counts → leaves; active bar; click sets store.
- **Inspector** — properties + in/out relationships; rel click navigates (cross-layer); AnnotationsSection
  shown only for Model elements.
- **Canvas** — PageHeader eyebrow/title/chip/meta per view; GraphCanvas keyed by `view:layerId`.
- **ChangesetCanvas/Inspector** — op-row colors, stat tiles, expandable diff.
- **ChatPanel** — adapter render, suggestions only when ≤1 message, scope label, composer submit.
- **AnnotationsSection** — add/edit/resolve/delete/reply flows against MSW; ConfirmDialog + Toast.

## Priority 4 — E2E (Playwright vs `dr visualize`)

Backend: `dr visualize --no-auth --port <p>` against a **dedicated fixtures `.dr` model** (not a developer's
working model) so counts are deterministic and annotation writes are isolated. Run against either the dev
server or the built bundle (`--viewer-path dist/embedded/dr-viewer-bundle`).

- **shell** — topbar/rail/statusbar dimensions; nav counts == API; connection dot; dark toggle sets
  `body.dark-canvas`.
- **model-view** — layer graph renders with domain-colored swatches (computed color == hex); node click →
  inspector; relationship click → cross-layer navigation.
- **schema-view** — node-type graph; Model vs Schema differ for the same layer.
- **changesets** — op rows + stat tiles; switching changesets updates content.
- **chat** — gated on `chat.status.sdk_available`; send a benign query, assert single-rendered streamed
  answer (covers the double-emit regression end-to-end). Skip/mark if no chat client.
- **annotations** — full CRUD against the fixtures model; **clean up created annotations** in `afterEach`.
- **a11y** — axe scan on each view in light + dark.

## Test data & fixtures

- Capture `/api/model`, `/api/spec`, `/api/changesets`, `/api/changesets/:id` from a known `.dr` model into
  `tests/fixtures/` for deterministic unit/integration tests (a small script that hits a local
  `dr visualize`).
- A committed minimal **fixtures `.dr` model** for E2E (stable element/relationship counts).
- MSW handlers in `tests/helpers/` mirror the REST shape; a fake WS/JSON-RPC harness for chat/notification
  tests.

## CI

- `npm run test` (Vitest, unit+integration+component) on every PR — fast, no external services.
- `npm run test:e2e` in a job that boots `dr visualize` against the fixtures model (or a containerized CLI),
  then runs Playwright against the built bundle.
- Coverage reported for `src/apps/embedded/{ui,data}` and kept infra; **exclude** generated files
  (`core/types/api-client.ts`, `core/services/generatedApiClient.ts`).

## Suggested rollout

1. **Phase A** — Vitest setup + P1 pure-function unit tests + captured fixtures. (Locks in the highest-risk
   logic immediately.)
2. **Phase B** — P2 infra regression tests (incl. the websocket double-emit guard) + MSW data-hook tests.
3. **Phase C** — P3 component tests with @testing-library.
4. **Phase D** — Playwright E2E smoke + critical flows + axe; CI wiring.
