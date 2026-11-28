---
name: documentation_robotics_viewer-api-sync
description: Sync the dr CLI's OpenAPI spec and regenerate the viewer's typed API client
user_invocable: true
---

# Sync the API spec and regenerate the client

The viewer's REST contract is the dr CLI's `docs/api-spec.yaml` (upstream: `tinkermonkey/documentation_robotics`).
Both generated files come from it; never edit them by hand.

## Steps

```bash
npm run sync:api-spec     # scripts/sync-api-spec.sh: fetch docs/api-spec.yaml from upstream main
npm run client:generate   # → src/core/types/api-client.ts + src/core/services/generatedApiClient.ts
npx tsc --noEmit          # the hooks in src/apps/embedded/data/ must still type-check
npm test
```

`client:generate` runs `openapi-typescript` for the types, then `scripts/generate-api-client.js` for the fetch
functions and React Query hooks (named from the path, e.g. `useGetapiprojectsprojectcheckoutscheckoutmodel`).

## Where the spec reaches the app

- Data hooks call the generated operations: `src/apps/embedded/data/use*.ts`, scoped to the route's checkout
  through `data/checkoutScope.ts`.
- Wire types the viewer validates itself (not trusting the payload): `data/tier1.ts`, `data/changesetDrift.ts`,
  `data/changesetPurpose.ts`, `data/planVerification.ts` (its route isn't in the generated client yet).

## Automation

- `.husky/pre-commit` runs `npm run sync:api-spec` on each commit (`HUSKY_OFFLINE=1` skips it) and says when the
  spec changed but isn't staged.
- No scheduled workflow syncs the spec: `ci.yml` checks it is in sync on each PR; run `npm run sync:api-spec` by hand to update it.
