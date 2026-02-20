# API Infrastructure Implementation Guide

## Purpose

This guide provides implementation steps to address three critical gaps in API infrastructure identified during code review:

1. **CI/CD Integration for API Spec Synchronization**
2. **API Client Generation from OpenAPI Spec**
3. **MSW (Mock Service Worker) Testing Strategy**

This is a reference document for developers implementing these enhancements. For context on why these gaps exist, see the PR review analysis.

---

## Gap 1: CI/CD Integration for API Spec Synchronization

### What's Implemented ✅
- `scripts/sync-api-spec.sh` - Fetches latest API spec from upstream repository
- `npm run sync:api-spec` - Script is available in `package.json`
- Basic OpenAPI validation in the sync script

### What's Missing ❌
- **Not in CI pipeline** - `.github/workflows/ci.yml` does not run spec synchronization
- **Not in pre-commit hooks** - `scripts/pre-commit-check.sh` does not include sync check
- **No drift detection** - CI doesn't fail when upstream spec differs from tracked version
- **No automatic PR creation** - Changes to API spec are not automatically committed/PR'd
- **No scheduled sync** - No automated schedule to detect upstream changes

### Why This Matters

Without CI/CD integration:
- Developers may work with stale API specs
- Drift between upstream and local spec is invisible until runtime
- Manual reminder email = poor developer experience
- No audit trail of spec changes
- Breaking API changes discovered late in development

### Implementation Steps

#### Step 1: Add Spec Drift Detection to CI

```yaml
# .github/workflows/ci.yml
- name: Check API spec drift
  run: |
    bash scripts/sync-api-spec.sh
    if git diff --quiet docs/api-spec.yaml; then
      echo "✓ API spec is in sync with upstream"
    else
      echo "⚠ API spec differs from upstream. Run 'npm run sync:api-spec' locally."
      git diff docs/api-spec.yaml
      exit 1
    fi
```

**Placement**: In `build-and-test` job, after dependency installation (so sync script can run), before tests.

**Impact**: Pull requests will fail if the API spec is stale, forcing developers to sync before merge.

#### Step 2: Add Sync Check to Pre-commit Hook

```bash
# scripts/pre-commit-check.sh
# (add after type check)

# 3. Check API spec
echo -e "${GREEN}3. Checking API spec...${NC}"
bash scripts/sync-api-spec.sh
if ! git diff --quiet docs/api-spec.yaml; then
  echo -e "${RED}API spec changed. Review with: git diff docs/api-spec.yaml${NC}"
  git add docs/api-spec.yaml
  echo -e "${GREEN}API spec changes staged.${NC}"
else
  echo -e "${GREEN}API spec is in sync.${NC}"
fi
```

**Why**: Catches spec changes before commit, ensures all commits have current spec.

#### Step 3: Optional - Scheduled Upstream Sync

```yaml
# .github/workflows/sync-api-spec.yml (new file)
name: Sync API Spec

on:
  schedule:
    # Daily at 2am UTC
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
    - uses: actions/checkout@v4
    - name: Sync API spec
      run: bash scripts/sync-api-spec.sh
    - name: Create PR if changed
      if: github.event_name == 'schedule' && !env.ACT
      uses: peter-evans/create-pull-request@v5
      with:
        commit-message: 'chore: sync API spec with upstream'
        title: 'Sync: API spec updates'
        branch: 'chore/sync-api-spec'
        body: 'Automated sync of API spec from upstream. Review changes carefully.'
```

**When to use**: If upstream changes frequently and you want visibility without manual intervention.

---

## Gap 2: API Client Generation from OpenAPI Spec

### What's Implemented ✅
- Manual REST client in `embeddedDataLoader.ts` (interfaces defined by hand)
- Manual WebSocket client in `websocketClient.ts` (types defined by hand)
- `docs/api-spec.yaml` is synced from upstream

### What's Missing ❌
- **No code generation from OpenAPI** - No tools like `openapi-typescript`, `openapi-typescript-fetch`, or `orval`
- **No generated types** - Manual type definitions are duplicated and drift-prone
- **No generated fetch utilities** - Each endpoint requires manual fetch wrapping
- **Type safety not enforced** - Manual types don't prevent invalid API calls at compile time

### Why This Matters

Manual API clients lead to:
- **Type drift**: Hand-written interfaces diverge from actual API (common cause of bugs)
- **Duplicated effort**: Same endpoint defined multiple times (service, test mock, type)
- **Runtime failures**: Invalid request shapes only caught at runtime
- **Breaking changes hidden**: API changes require manual type updates in multiple files
- **Developer overhead**: New endpoints require manual service layer + type definitions

### Recommended Approach: `openapi-typescript`

**Why this tool**:
- Generates **strict TypeScript types** from OpenAPI spec (not just client code)
- Works with **both REST and WebSocket** APIs (you generate types, wrap as needed)
- Low maintenance - single source of truth is the spec
- Zero-dependency output (pure TypeScript interfaces)
- Easy to layer custom fetch/WebSocket logic on top

### Implementation Steps

#### Step 1: Add Dependency

```bash
npm install --save-dev openapi-typescript
```

**Update `package.json` scripts**:

```json
{
  "scripts": {
    "openapi:generate": "openapi-typescript docs/api-spec.yaml -o src/apps/embedded/types/generated/api.types.ts",
    "openapi:generate:watch": "npm run openapi:generate -- --watch",
    "sync:api-spec": "bash scripts/sync-api-spec.sh && npm run openapi:generate"
  }
}
```

#### Step 2: Generate Types

```bash
npm run openapi:generate
```

This creates `src/apps/embedded/types/generated/api.types.ts` with:
- Request/response types for each endpoint
- Parameter types (query, path, body)
- Schema definitions
- **100% aligned with spec** - regenerated on spec changes

#### Step 3: Refactor Manual Clients to Use Generated Types

**Before** (current `embeddedDataLoader.ts`):
```typescript
export interface RelationshipType {
  id: string;
  predicate?: string;
  inversePredicate?: string;
  category?: string;
  description?: string;
}

async function getRelationshipTypes(): Promise<RelationshipType[]> {
  const response = await fetch(`${API_BASE}/relationships/types`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  return data;
}
```

**After** (with generated types):
```typescript
import { paths } from '../types/generated/api.types';

type RelationshipTypesResponse =
  paths['/relationships/types']['get']['responses']['200']['content']['application/json'];

async function getRelationshipTypes(): Promise<RelationshipTypesResponse> {
  const response = await fetch(`${API_BASE}/relationships/types`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

**Benefits**:
- Type comes from spec, not hand-written
- Spec change = type change = compilation error (catch early)
- No duplication across service/test/type files

#### Step 4: Update Tests

Generated types propagate to test mocks:

```typescript
import { paths } from '@/types/generated/api.types';

type RelationshipCatalog =
  paths['/relationships/catalog']['get']['responses']['200']['content']['application/json'];

// Mock factory now type-safe against spec
export const createMockRelationshipCatalog = (): RelationshipCatalog => ({
  version: '1.0.0',
  relationshipTypes: [
    { id: 'contains', predicate: 'contains', category: 'structural' }
  ]
});
```

### Integration with CI/CD

Update the sync script to auto-generate after spec changes:

```bash
# scripts/sync-api-spec.sh (add at end)
if command -v npm &> /dev/null; then
  echo "Regenerating TypeScript types from spec..."
  if npm run openapi:generate; then
    echo "✓ Types regenerated successfully"
  else
    echo "⚠ Type generation failed (non-blocking)"
  fi
fi
```

Now:
- `npm run sync:api-spec` fetches + generates in one command
- CI/CD automatically regenerates types when spec updates
- Developers always have current types

---

## Gap 3: MSW (Mock Service Worker) Testing Strategy

### Current Testing Approach ❌

Tests currently **require running the actual DR CLI server**:

```bash
npm run test:e2e  # Needs: npm run start (in another terminal)
```

**Drawbacks**:
- Complex setup (multiple terminal windows, server management)
- Slow (server startup time for each test run)
- Fragile (network issues, port conflicts, server crashes)
- CI/CD overhead (server infrastructure in pipeline)
- Hard to reproduce failures (depends on server state)

### What MSW Provides ✅

**Mock Service Worker** intercepts fetch/WebSocket at the network level:

```typescript
import { http, ws } from 'msw';
import { setupServer } from 'msw/node';

// Define handlers once, reuse in all tests
const handlers = [
  http.get('/api/relationships/types', () => {
    return HttpResponse.json([
      { id: 'contains', predicate: 'contains' }
    ]);
  }),

  ws('ws://localhost/stream', ({ connection }) => {
    connection.addEventListener('close', () => {
      connection.close(code.GOING_AWAY);
    });
  })
];

const server = setupServer(...handlers);

// Auto-mock all network in tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Advantages**:
- ✅ No server infrastructure needed
- ✅ Fast (instant mock responses)
- ✅ Deterministic (full control over responses)
- ✅ Integrates with existing Playwright tests
- ✅ Works in both Node and browser
- ✅ Same handlers work for unit + E2E tests

### Implementation Steps

#### Step 1: Add MSW Dependency

```bash
npm install --save-dev msw
```

#### Step 2: Create Request Handlers

```typescript
// tests/mocks/handlers.ts
import { http, ws, HttpResponse } from 'msw';

const API_BASE = '/api';

export const handlers = [
  // GET endpoints
  http.get(`${API_BASE}/relationships/types`, () => {
    return HttpResponse.json([
      { id: 'contains', predicate: 'contains', category: 'structural' }
    ]);
  }),

  http.get(`${API_BASE}/relationships/catalog`, () => {
    return HttpResponse.json({
      version: '1.0.0',
      relationshipTypes: [
        { id: 'contains', predicate: 'contains' }
      ]
    });
  }),

  // POST endpoints
  http.post(`${API_BASE}/annotations`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'new-id', ...body }, { status: 201 });
  }),

  // WebSocket (matches embeddedDataLoader connection)
  ws('ws://localhost:8000/stream', ({ connection }) => {
    connection.addEventListener('message', (event) => {
      if (event.data === 'ping') {
        connection.send('pong');
      }
    });
  })
];
```

#### Step 3: Configure for Test Environment

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// tests/setup.ts (add to Playwright config)
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Step 4: Update Playwright Config

```typescript
// playwright.config.ts
export default defineConfig({
  webServer: [
    // NO NEED for DR CLI server anymore
    {
      command: 'npm run dev:embedded',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
    }
  ],
  // ... rest of config
});
```

#### Step 5: Update Test Expectations

```typescript
// Before: Tests required checking actual DR CLI server state
// After: Tests verify mocked responses directly
test('loads relationship catalog on mount', async ({ page }) => {
  await page.goto('/');

  // Instead of: await page.waitForAPI('ready')
  // Just verify the UI consumed the mocked response
  await expect(page.locator('text=contains')).toBeVisible();
});

test('handles API errors gracefully', async ({ page }) => {
  // Override handler just for this test
  server.use(
    http.get('*/relationships/catalog', () => {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 });
    })
  );

  await page.goto('/');
  await expect(page.locator('text=Error loading')).toBeVisible();
});
```

### Migration Path

1. **Setup MSW Foundation** - Add handlers for existing endpoints, configure server, tests still run with mocks available
   - Add handlers for existing endpoints
   - Configure server
   - Tests still run, now with mocks available

2. **Migrate E2E Tests** - Remove server requirement and update tests to use override handlers for error scenarios
   - Remove `npm run start` requirement
   - Update tests to use `server.use()` for error scenarios
   - Remove server state checking

3. **Expand Coverage and Documentation** - Add handlers for edge cases and extend MSW usage to unit tests
   - Add edge case handlers (timeouts, offline, bad data)
   - Use MSW in unit tests for embeddedDataLoader, websocketClient
   - Document mock patterns for new tests

### Benefits After Implementation

| Aspect | Before (Real Server) | After (MSW) |
|--------|---------------------|------------|
| **Setup** | Multiple terminals, server management | Single `npm test` command |
| **Speed** | ~10s server startup + test time | Instant mock responses |
| **Reliability** | Network/timing dependent | Deterministic |
| **Error Testing** | Hard (network fails) | Easy (override handler) |
| **CI/CD** | Complex (needs server) | Simple (no deps) |
| **Isolation** | Tests may interfere with each other | Full isolation via resetHandlers() |

---

## Implementation Priority

| Gap | Effort | Impact | Priority |
|-----|--------|--------|----------|
| **CI/CD Integration** | 2-3 hours | Prevents type drift | HIGH |
| **API Client Generation** | 4-6 hours | Improves type safety | HIGH |
| **MSW Testing** | 6-8 hours | Simplifies testing | MEDIUM |

**Recommended Order**:
1. **API Spec Sync in CI** (quick, immediate value)
2. **API Client Generation** (pairs with sync, eliminates manual types)
3. **MSW Testing** (longer implementation, deprecates server requirement)

---

## Files to Modify

### Gap 1: CI/CD Integration
- `.github/workflows/ci.yml` - Add drift detection step
- `scripts/pre-commit-check.sh` - Add sync check
- `.github/workflows/sync-api-spec.yml` - New file for scheduled sync (optional)

### Gap 2: API Client Generation
- `package.json` - Add `openapi-typescript` dev dependency
- `src/apps/embedded/types/generated/` - New directory for generated types (added to .gitignore)
- `embeddedDataLoader.ts` - Import and use generated types
- `websocketClient.ts` - Import and use generated types
- Test files using manual types - Import from generated

### Gap 3: MSW Testing
- `tests/mocks/handlers.ts` - New file defining handlers
- `tests/mocks/server.ts` - New file setting up MSW server
- `tests/setup.ts` - Initialize MSW for tests
- `playwright.config.ts` - Remove server dependency
- Existing test files - Update to use MSW patterns

---

## Success Criteria

After implementation:

- ✅ `npm run sync:api-spec` updates both spec and generated types
- ✅ CI fails if local spec differs from upstream
- ✅ All API types come from spec (no hand-written duplicates)
- ✅ Type changes from spec automatically propagate to code
- ✅ Tests run with `npm test` (no separate server needed)
- ✅ Error scenarios fully testable without network failures
- ✅ New developers can run full test suite on first `npm install && npm test`
