# API Client Generation

This document describes the auto-generated API client system that provides type-safe fetch methods and React Query hooks.

## Overview

The API client is auto-generated from the OpenAPI specification (`docs/api-spec.yaml`). This ensures client code always stays in sync with the API definition.

### Generated Files

- **`src/core/services/generatedApiClient.ts`** - Auto-generated client with fetch methods and React Query hooks
- **`src/core/types/api-client.ts`** - Auto-generated TypeScript types from OpenAPI spec

### Regenerate Client

```bash
npm run client:generate
```

This runs two generators:
1. `openapi-typescript` - Generates type definitions
2. `generate-api-client.js` - Generates client class and React Query hooks

## Usage

### Using the Fetch Client

```typescript
import { getApiClient, setApiToken } from '@/core/services/generatedApiClient';

// Get the client singleton
const client = getApiClient('http://localhost:8080');

// Set authentication token
setApiToken('your-token');

// Call endpoints
const health = await client.gethealth();
const spec = await client.getapispec();
const model = await client.getapimodel();
```

### Using React Query Hooks

```typescript
import {
  useGethealth,
  useGetapispec,
  createApiQueryClient
} from '@/core/services/generatedApiClient';
import { QueryClientProvider } from '@tanstack/react-query';

// Wrap app with QueryClientProvider
const queryClient = createApiQueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourComponents />
    </QueryClientProvider>
  );
}

// Use hooks in components
function MyComponent() {
  const { data, isLoading, error } = useGethealth();
  const { data: spec } = useGetapispec();

  return (
    <div>
      {isLoading ? 'Loading...' : data && 'Health: OK'}
    </div>
  );
}
```

### Hooks with Path Parameters

For endpoints with path parameters, pass them as arguments:

```typescript
// GET /api/layers/{layerName}
const { data: layer } = useGetapilayerslayerName('business');

// GET /api/elements/{elementId}
const { data: element } = useGetapielementselementId('abc123');
```

### Query Configuration

Customize React Query behavior:

```typescript
import { useGethealth } from '@/core/services/generatedApiClient';

const { data } = useGethealth({
  staleTime: 1000 * 60 * 10, // 10 minutes
  retry: 3,
  enabled: someCondition
});
```

## Versioning

The API version is automatically checked during build:

```bash
npm run build
  ↓
npm run client:generate  # Generate types and client
npm run client:check-version  # Check for breaking changes
npm run vite build  # Build app (only if version check passes)
```

### Version Check Behavior

The check compares the current API version in `docs/api-spec.yaml` against a cached baseline:

- **Patch change** (0.1.0 → 0.1.1): INFO message, build continues
- **Minor change** (0.1.0 → 0.2.0): WARNING message, build continues
- **Major change** (0.1.0 → 1.0.0): ERROR, build fails with instructions

### Acknowledge Version Changes

If a major version change is intentional, acknowledge it:

```bash
npm run client:check-version -- --force
```

This updates the baseline to the new version.

## API Endpoints

All endpoints from the OpenAPI spec are available as methods:

| Method | Endpoint | Client Method |
|--------|----------|----------------|
| GET | `/health` | `gethealth()` |
| GET | `/api/spec` | `getapispec()` |
| GET | `/api/model` | `getapimodel()` |
| GET | `/api/layers/{layerName}` | `getapilayerslayerName(name)` |
| GET | `/api/elements/{elementId}` | `getapielementselementId(id)` |
| GET | `/api/changesets` | `getapichangesets()` |
| POST | `/api/annotations` | `postapiannotations(body)` |
| PUT | `/api/annotations/{id}` | `putapiannotationsannotationId(id, body)` |
| DELETE | `/api/annotations/{id}` | `deleteapiannotationsannotationId(id)` |
| ... | ... | ... |

See `docs/api-spec.yaml` for complete endpoint list.

## Troubleshooting

### Client Not Regenerating

If changes to the OpenAPI spec don't appear in the client:

```bash
npm run client:generate
```

### Type Errors with Generated Client

Generated types might differ from expected. Check the generated file:

```bash
cat src/core/services/generatedApiClient.ts
```

### Version Check Failures

If version check blocks your build unexpectedly:

```bash
npm run client:check-version -- --force
```

This acknowledges the version change and proceeds.

## How It Works

### Client Generation (`generate-api-client.js`)

1. Parses `docs/api-spec.yaml` to extract endpoint definitions
2. For each endpoint, generates:
   - A fetch method on the `ApiClient` class
   - A React Query hook for GET endpoints
   - A React Query mutation hook for POST/PUT/DELETE
3. Includes authentication token injection and error handling
4. Writes to `src/core/services/generatedApiClient.ts`

### Type Generation (`openapi-typescript`)

1. Parses OpenAPI spec
2. Generates TypeScript interfaces for request/response types
3. Writes to `src/core/types/api-client.ts`

### Version Checking (`check-api-version.js`)

1. Reads current API version from spec
2. Compares against cached baseline (`.api-version-cache.json`)
3. Analyzes semantic version difference
4. Updates cache and reports changes to developer
