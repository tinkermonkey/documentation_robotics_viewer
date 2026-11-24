---
name: documentation_robotics_viewer-build
description: Build the embedded viewer bundle that the dr CLI serves, and check its output
user_invocable: true
---

# Build the viewer bundle

The viewer ships as one static bundle that the `dr` CLI serves (`dr serve` / `dr visualize --viewer-path`).

## Build

```bash
npm run build
```

It runs, in order:

1. `client:generate`: `openapi-typescript docs/api-spec.yaml` → `src/core/types/api-client.ts`, then
   `scripts/generate-api-client.js` → `src/core/services/generatedApiClient.ts`.
2. `client:check-version`: `scripts/check-api-version.js` compares the spec's version with `.api-version-cache.json`.
3. `vite build --config vite.config.embedded.ts` → `dist/embedded/`.
4. `package:embedded`: `scripts/package-embedded.cjs` copies it to `dist/embedded/dr-viewer-bundle/`, writes its
   `manifest.json`, and copies the licences of what the bundle redistributes (elkjs, Heimdall's fonts) into `licenses/`.
   It fails if Heimdall stops shipping the font licences.

The build rewrites the "Generated at" timestamp in `generatedApiClient.ts`. If the spec didn't change, restore it:
`git checkout src/core/services/generatedApiClient.ts`.

## Check the output

```bash
ls -lh dist/embedded/dr-viewer-bundle/assets/
```

- `main-*.js`, `vendor-*.js` and one `main-*.css`; the C4 layout's `elk.bundled-*.js` is a separate chunk loaded on first use.
- The Inter / JetBrains Mono `woff2` files sit in `assets/` (imported from `@tinkermonkey/heimdall-ui/fonts`).

## Serve it

```bash
dr serve --foreground --viewer-path dist/embedded/dr-viewer-bundle
```

Open the link it prints (the token is in the fragment). See CLAUDE.md "Data / API" for a scratch farm.

## Before you finish

`npx tsc --noEmit`, `npm run test:types` and `npm test` must pass too.
