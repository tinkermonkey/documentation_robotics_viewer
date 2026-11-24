# Documentation Robotics Viewer

The browser front end of [Documentation Robotics](https://github.com/tinkermonkey/documentation_robotics) (DR):
it shows a project's multi-layer architecture model, its changesets and C4 diagrams, and hosts DrBot, the
model's chat agent. The `dr` CLI both **serves** the viewer and **feeds it data** over REST + WebSocket; this
repository builds the bundle it serves.

Built on the **Heimdall design system** (`@tinkermonkey/heimdall-ui`): React 19 + TypeScript, Vite 6,
TanStack Router + TanStack Query, Zustand 5, and `elkjs` for the C4 diagram layout.

## Features

- **Model view**: each of the 13 layers (Motivation, Business, Product, Security, Application, Technology, API,
  Data Model, Data Store, UX, Navigation, APM, Testing) as a graph, as lanes or a hive plot by node type, or as a
  page; an inspector with relationships, reach across layers and annotations.
- **Schema view**: the spec's node types and relationship types per layer.
- **Changesets**: an inbox, a change-by-change review (keep / drop / ask DrBot), an Impact tab showing what a
  changeset reaches, drift before Apply, and Apply / Discard.
- **Architecture**: the model drawn as C4 System Context, Container and Component diagrams, with a changeset
  overlay, plan-vs-as-built verdicts and export (SVG, PNG, Structurizr DSL, C4-PlantUML).
- **DrBot**: live chat with the model's agent, in a floating or docked panel.
- Search across elements and node types, light and dark canvas, deep links for every selection.

[CLAUDE.md](CLAUDE.md) describes each feature and the code behind it in detail.

## Project structure

```
src/
├── apps/embedded/        # the application
│   ├── main.tsx          # boot: magic-link token, fetch interceptor, CSS and fonts, router
│   ├── router.tsx        # TanStack hash router: checkout picker, /p/:project/c/:checkout/... shell
│   ├── ui/               # presentation: Heimdall components + the viewer's own CSS files
│   ├── data/             # stateless React Query hooks and pure transforms over the API (no JSX)
│   ├── services/         # WebSocket / JSON-RPC client, chat service, error tracking
│   ├── stores/           # Zustand data stores (auth, chat, connection, checkout, local review)
│   └── types/ utils/ routes/
├── core/                 # framework-agnostic: the generated API client and types
└── index.css             # base reset and font variable, loaded before Heimdall's CSS
tests/
├── unit/ integration/ components/   # Vitest
├── e2e/                             # Playwright + axe, against the built bundle
└── fixtures/ helpers/
docs/api-spec.yaml        # the dr CLI's OpenAPI spec (synced from upstream)
documentation-robotics/   # this project's own DR model and changesets
scripts/                  # build, packaging and API-spec helpers
```

## Getting started

### Prerequisites

- Node.js 20 or later
- The `dr` CLI, recent enough to run `dr serve`: this viewer reads project data through the CLI's per-checkout
  routes. The published `@documentation-robotics/cli` (0.7.1) predates `dr serve`; until a release ships it, build
  the CLI from [documentation_robotics](https://github.com/tinkermonkey/documentation_robotics) main

### Install

```bash
npm install
npx playwright install chromium   # only for the E2E suite
```

### Run against a model

The viewer needs the CLI's central process for its data:

```bash
dr serve --foreground                 # serves the bundled viewer and the API, default port 8080
```

Open the link it prints (`dr visualize` prints one for the current checkout). To work on the viewer with hot
reload, run the Vite dev server, which proxies `/api`, `/health` and `/ws` to `:8080` (`DR_API_URL` /
`DR_WS_URL` point it elsewhere):

```bash
npm run dev                           # http://localhost:3001
```

Then open `http://localhost:3001/#/p/<project>/c/<checkout>/?token=<token>`, with the token from the link the CLI
printed.

### Build

```bash
npm run build                         # → dist/embedded/dr-viewer-bundle
dr serve --foreground --viewer-path dist/embedded/dr-viewer-bundle
```

The build regenerates the API client from `docs/api-spec.yaml`, builds with `vite.config.embedded.ts` and packages
the bundle (with the licences of the fonts and `elkjs` it redistributes).

## Tests

```bash
npm test               # Vitest: unit, integration and component tests
npm run test:types     # type-check the tests
npx tsc --noEmit       # type-check the app
npm run test:cov       # Vitest with coverage
npm run test:e2e       # Playwright E2E + axe WCAG 2.1 AA, light and dark
```

`npm run test:e2e` builds the bundle, and Playwright runs `scripts/e2e-server.sh`: `dr serve` on port 8099 in a
scratch farm whose one project is a clone of the repository's committed model. It then drives every view. It needs
a dr CLI with `dr serve`; until one is published, point it at one built from source:

```bash
DR_CLI="node <documentation_robotics>/cli/dist/cli.js" npm run test:e2e
```

See [documentation/TESTING_STRATEGY.md](documentation/TESTING_STRATEGY.md).

## API spec

`docs/api-spec.yaml` is the dr CLI's OpenAPI spec. `npm run sync:api-spec` fetches it from upstream and
`npm run client:generate` regenerates `src/core/types/api-client.ts` and `src/core/services/generatedApiClient.ts`
(never edit those by hand). The pre-commit hook syncs it on each commit (`HUSKY_OFFLINE=1` skips the fetch).

## CI

GitHub Actions, in [.github/workflows](.github/workflows):

- `test.yml`: the required gate (type checks, Vitest, build), plus a non-blocking Playwright E2E + axe job that
  installs the dr CLI and runs `npm run test:e2e`; it skips, with a warning in the job summary, while the installed
  CLI has no `dr serve`.
- `ci.yml`: checks the API spec is in sync, runs the tests and builds; on a `v*` tag it publishes a GitHub Release
  with the bundle as a zip.
- `sync-api-spec.yml`: daily, opens a PR when the upstream API spec changed.

## License

MIT: see [LICENSE](LICENSE).
