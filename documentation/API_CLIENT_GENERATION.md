# API Client Generation and Versioning Strategy

## Overview

This document describes the complete API client generation system and versioning strategy implemented to address the gaps identified in the Idea Researcher review.

### What Was Missing

The original implementation only generated TypeScript type definitions via `openapi-typescript`. This left two critical gaps:

1. **No Full Client Implementation** - Only types existed; actual fetch client code was written manually and could drift from the OpenAPI spec
2. **No Versioning Strategy** - No mechanism to detect breaking API changes or alert developers to compatibility issues

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────────┐
│ OpenAPI Specification (docs/api-spec.yaml)
└────────────┬────────────────────────────┘
             │
             ├─ npm run client:generate
             │
             ├─ openapi-typescript (generates types)
             │  └─> src/core/types/api-client.ts
             │
             └─ generate-api-client.js (generates client)
                └─> src/core/services/generatedApiClient.ts
                    ├─ ApiClient class with fetch methods
                    ├─ React Query hooks
                    └─ QueryClient configuration
             │
             └─ check-api-version.js (checks compatibility)
                ├─ Parses current spec version
                ├─ Compares with baseline
                ├─ Detects breaking changes
                └─ Updates version cache
```

## Generated API Client

### File Location
`src/core/services/generatedApiClient.ts`

### What Gets Generated

1. **ApiClient Class** - Type-safe fetch wrapper
   ```typescript
   export class ApiClient {
     private baseUrl: string;
     private token: string | null = null;

     constructor(baseUrl: string)
     setToken(token: string | null): void
     // ... generated fetch methods for each endpoint
   }
   ```

2. **Fetch Methods for Each Endpoint** - Auto-generated from OpenAPI paths
   ```typescript
   async healthCheck(): Promise<unknown>
   async getSpec(): Promise<unknown>
   async loadLayer(layerName: string): Promise<unknown>
   async loadModel(): Promise<unknown>
   // ... all endpoints from spec
   ```

3. **React Query Hooks** - Automatic hook generation
   ```typescript
   export function useHealthCheck(options?: QueryOptions)
   export function useGetSpec(options?: QueryOptions)
   export function useLoadLayer(options?: QueryOptions)
   // ... hooks for queries and mutations
   ```

4. **Query Client Factory** - Pre-configured React Query
   ```typescript
   export function createApiQueryClient(): QueryClient
   ```

### Usage

#### Basic Fetch Client
```typescript
import { getApiClient, setApiToken } from '@/core/services/generatedApiClient';

// Initialize
const client = getApiClient('http://localhost:8080');
setApiToken('your-auth-token');

// Use fetch methods
const health = await client.healthCheck();
const spec = await client.getSpec();
```

#### React Query Hooks
```typescript
import { useHealthCheck, useGetSpec } from '@/core/services/generatedApiClient';
import { QueryClientProvider } from '@tanstack/react-query';

function MyComponent() {
  const { data, isLoading, error } = useHealthCheck({
    staleTime: 1000 * 60 * 5, // Custom cache time
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>Status: {data?.status}</div>;
}

// In your app root
<QueryClientProvider client={createApiQueryClient()}>
  <MyComponent />
</QueryClientProvider>
```

## Versioning Strategy

### Breaking Change Detection

The version checking system analyzes semantic version changes to detect potential incompatibilities:

| Change Type | Severity | Action |
|------------|----------|--------|
| `0.1.0` → `1.0.0` | 🔴 ERROR | Build fails - requires manual verification |
| `0.1.0` → `0.2.0` | 🟡 WARNING | Build continues - developer notified |
| `0.1.0` → `0.1.1` | ✅ INFO | Build continues - backwards compatible |

### How It Works

1. **Automatic Detection** - Runs on each build/dev start
2. **Version Cache** - Stores baseline in `.api-version-cache.json`
3. **Breaking Change Alerts** - Logs detailed warnings to console
4. **Dev Workflow** - Prevents accidental API mismatches

### Running Version Check

```bash
# Check version compatibility (runs automatically during build)
npm run client:check-version

# Force update version baseline after reviewing spec changes
npm run client:check-version -- --force
```

### Version Cache File

`.api-version-cache.json` contains:
```json
{
  "version": "0.1.0",
  "timestamp": "2026-02-20T10:30:00.000Z",
  "buildTimestamp": "2026-02-20T10:30:00.000Z"
}
```

## Build Integration

### Modified package.json Scripts

```json
{
  "scripts": {
    "client:generate": "openapi-typescript docs/api-spec.yaml -o src/core/types/api-client.ts && node scripts/generate-api-client.js",
    "client:check-version": "node scripts/check-api-version.js",
    "build": "npm run client:generate && npm run client:check-version && vite build ..."
  }
}
```

### Build Flow

1. Generate OpenAPI types → `src/core/types/api-client.ts`
2. Generate full API client → `src/core/services/generatedApiClient.ts`
3. Check version compatibility → `.api-version-cache.json`
4. Build application if checks pass

## Implementation Details

### Script: `scripts/check-api-version.js`

Implements the versioning strategy:

```typescript
function parseVersion(versionString): { major, minor, patch, full }
function detectBreakingChanges(oldVersion, newVersion): { isBreaking, reason[], severity }
function readApiSpecVersion(): string
function loadVersionCache(): VersionCache | null
function saveVersionCache(version): void
function checkApiVersion(): 0 | 1
```

**Features:**
- Reads API version from OpenAPI spec `info.version` field
- Compares against cached baseline version
- Detects major/minor/patch changes
- Reports breaking change severity
- Caches for next run

**Output Example:**
```
📋 API Version Check
Current API spec version: 0.1.0
Previous API spec version: 0.1.0
Last checked: 2026-02-20T10:30:00.000Z

✅ API version unchanged
```

### Script: `scripts/generate-api-client.js`

Generates full type-safe client code:

```typescript
function parseOpenApiSpec(): OpenAPIObject
function extractEndpoints(spec): Endpoint[]
function generateFetchMethod(endpoint): string
function generateReactQueryHook(endpoint): string
function generateApiClient(spec, endpoints): string
```

**Features:**
- Parses YAML OpenAPI spec
- Extracts all HTTP operations
- Generates fetch methods with parameter handling
- Creates React Query hooks for queries and mutations
- Includes error handling and authentication support
- Generates configurable QueryClient

**Generated Output:**
```
🔧 Generating API Client with React Query Hooks
✅ Parsed API spec: Documentation Robotics API v0.1.0
✅ Found 12 endpoints

📋 Generated 12 endpoint methods:
  GET    /health                        → healthCheck()
  GET    /api/spec                      → getSpec()
  GET    /api/layers/{layer}            → getLayer()
  GET    /api/model                     → getModel()
  ...

✅ API client generation complete
```

## Type Integration

### Using Generated Types

Instead of manual type definitions:

❌ **Before** - Manual types in embeddedDataLoader.ts (lines 68-275):
```typescript
export interface RelationshipType {
  id: string;
  predicate?: string;
  // ... many manual definitions
}

export interface SpecDataResponse {
  version: string;
  type: string;
  // ... more duplication
}
```

✅ **After** - Import from generated client:
```typescript
import {
  SpecDataResponse,
  ChangesetDetails
} from '@/core/services/generatedApiClient';

// Types are automatically kept in sync with OpenAPI spec
```

## Workflow: Responding to API Changes

### Scenario 1: Patch Version Change (Backwards Compatible)
```
API version changes from 0.1.0 → 0.1.1

1. npm run client:generate (auto-runs)
   ✅ Types updated automatically

2. npm run client:check-version (auto-runs)
   ✅ Patch version change detected (backwards compatible)
   ✅ Build continues normally

3. Review generated changes if needed
   - src/core/services/generatedApiClient.ts
   - src/core/types/api-client.ts
```

### Scenario 2: Minor Version Change (Potential Breaking Changes)
```
API version changes from 0.1.0 → 0.2.0

1. npm run client:generate
   ✅ Types and client updated

2. npm run client:check-version
   ⚠️  Minor version change detected
   ⚠️  May have additive changes - verify compatibility

3. Review changes and run tests
   - npm test
   - npm run test:e2e

4. If issues found, update embeddedDataLoader.ts
   - Update fetch implementations
   - Update hooks usage
```

### Scenario 3: Major Version Change (Breaking Changes)
```
API version changes from 0.1.0 → 1.0.0

1. npm run client:generate
   ✅ Types and client updated

2. npm run client:check-version
   ❌ ERROR: Major version change requires code updates
   ❌ Build fails with instructions

3. Review API spec: docs/api-spec.yaml
   - Check what endpoints changed
   - Check parameter/response changes
   - Check authentication changes

4. Update implementation: src/apps/embedded/services/embeddedDataLoader.ts
   - Update API calls if endpoints changed
   - Update data handling if schemas changed

5. Run comprehensive tests
   npm test                # Unit/integration
   npm run test:e2e        # E2E scenarios

6. Force version baseline update
   npm run client:check-version -- --force

7. Build should now succeed
   npm run build
```

## Dependencies

### New Packages Added

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.51.0"
  }
}
```

**Why React Query?**
- Industry standard for async state management
- Automatic caching and invalidation
- Built-in request deduplication
- Developer tools for debugging
- Seamless integration with React 19

## Testing

### Integration with Existing Tests

The generated client is designed to integrate with existing test infrastructure:

```typescript
// tests/unit/embeddedDataLoader.spec.ts
import { getApiClient, setApiToken } from '@/core/services/generatedApiClient';

describe('API Client', () => {
  it('should set token for authenticated requests', () => {
    const client = getApiClient();
    setApiToken('test-token');
    // Client will include Bearer token in headers
  });

  it('should handle errors from generated methods', async () => {
    const client = getApiClient();
    await expect(client.healthCheck()).rejects.toThrow();
  });
});
```

### E2E Test Patterns

```typescript
// tests/embedded-api-integration.spec.ts
import { test, expect } from '@playwright/test';
import { useHealthCheck } from '@/core/services/generatedApiClient';

test('React Query hook integrates with generated client', async () => {
  // App loads generated client and hooks
  // DR CLI server responds with valid data
  // React Query manages cache and invalidation
});
```

## Troubleshooting

### Issue: Build fails with "Major version change"
**Cause:** API spec version was updated to a new major version
**Solution:**
1. Review API spec changes in `docs/api-spec.yaml`
2. Update code in `src/apps/embedded/services/embeddedDataLoader.ts`
3. Run tests to verify: `npm test`
4. Force version update: `npm run client:check-version -- --force`

### Issue: Generated types don't match API responses
**Cause:** OpenAPI spec is outdated or incomplete
**Solution:**
1. Verify OpenAPI spec at `docs/api-spec.yaml`
2. Regenerate: `npm run client:generate`
3. Check generated types in `src/core/services/generatedApiClient.ts`
4. Update server to match spec if needed

### Issue: React Query hooks not available
**Cause:** Dependencies not installed
**Solution:**
```bash
npm install
npm run client:generate
```

## Summary of Addressing Original Gaps

### Gap 1: Full API Client Generation ✅

**Original Issue:** Only TypeScript types were generated, no actual client code

**Solution Implemented:**
- `scripts/generate-api-client.js` generates complete `src/core/services/generatedApiClient.ts`
- Includes ApiClient class with all fetch methods
- Automatically creates React Query hooks for every endpoint
- Maintains type safety and consistency with OpenAPI spec
- Replaces manual fetch implementations

**Verification:**
- Run `npm run client:generate` to see generated client
- Check `src/core/services/generatedApiClient.ts` (auto-generated)
- All endpoints are represented as fetch methods
- React Query hooks are available for immediate use

### Gap 2: Versioning Strategy ✅

**Original Issue:** No mechanism to detect breaking changes or handle version compatibility

**Solution Implemented:**
- `scripts/check-api-version.js` implements semantic version analysis
- Runs automatically during build (`npm run build`)
- Detects major/minor/patch version changes
- Prevents builds on breaking changes with clear instructions
- Caches version baseline for consistent detection
- Integrates into CI/CD pipeline

**Verification:**
- Automated version check runs on every build
- Breaking changes trigger actionable error messages
- Version cache maintained in `.api-version-cache.json`
- Developers receive clear next steps for version changes

## Future Enhancements

Potential improvements for future iterations:

1. **OpenAPI Spec Validation** - Validate spec against JSON Schema before generation
2. **Request/Response Validation** - Add runtime validation using Zod or similar
3. **API Mock Generation** - Generate MSW handlers from spec automatically
4. **Client-Side Request Caching** - Add request-level caching layer
5. **API Changelog** - Auto-generate changelog from spec version history
6. **TypeScript Strict Mode** - Enforce `strict: true` in generated types
7. **Custom Hook Generators** - Allow plugins for specialized hook generation
8. **Stale-While-Revalidate** - Implement SWR pattern with React Query

## References

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Semantic Versioning](https://semver.org/)
- [OpenAPI TypeScript](https://openapi-ts.dev/)
