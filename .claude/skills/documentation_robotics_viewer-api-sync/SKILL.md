---
name: documentation_robotics_viewer-api-sync
description: Sync OpenAPI specs and generate TypeScript types
user_invocable: true
args:
generated: true
generation_timestamp: 2026-02-23T16:10:03.055743Z
generation_version: "2.0"
source_project: documentation_robotics_viewer
source_codebase_hash: 00a2f9723e9a7f64
---

# API Sync & Type Generation

Quick-reference skill for **documentation_robotics_viewer** - syncs OpenAPI specs from DR CLI server and generates TypeScript types.

## Usage

```bash
/documentation_robotics_viewer-api-sync
```

## Purpose

Synchronize OpenAPI specifications from the Documentation Robotics CLI server (REST API endpoints) and generate TypeScript type definitions for:

- **DR CLI REST API** (`/api/model`, `/api/validate`, `/api/changeset/*`, etc.)
- **WebSocket JSON-RPC 2.0 Protocol** (model updates, validation events)
- **Authentication Types** (token-based auth, user sessions)
- **Model Element Types** (across 12 architecture layers: Motivation, Business, Security, Application, Technology, API, DataModel, Dataset, UX, Navigation, APM, Testing)

This ensures type safety across the `src/apps/embedded/services/` integration layer and `src/core/types/` model definitions.

## Implementation

### Step 1: Fetch OpenAPI Spec from DR CLI Server

```bash
# Ensure DR CLI server is running (default: http://localhost:3090)
curl http://localhost:3090/api/openapi.json -o openapi.json

# Or use the WebSocket endpoint for real-time schema
# ws://localhost:3090/ws (JSON-RPC 2.0)
```

### Step 2: Generate TypeScript Types

```bash
# Using openapi-typescript (if installed)
npx openapi-typescript openapi.json -o src/core/types/generated/dr-cli-api.ts

# Or using custom type generation script
npm run types:generate
```

### Step 3: Validate Generated Types

```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit

# Run type-related tests
npm test -- tests/unit/types
```

### Step 4: Update Type Imports

Update imports in integration files:
- `src/apps/embedded/services/apiClient.ts` - REST API client types
- `src/apps/embedded/services/websocketClient.ts` - WebSocket message types
- `src/core/types/model.ts` - Core model element types
- `src/core/stores/modelStore.ts` - Store state types

### Critical Files to Check After Sync

1. **`src/core/types/model.ts`** - Core MetaModel types (Element, Relationship, Layer)
2. **`src/core/types/reactflow.ts`** - React Flow node data interfaces (extends BaseNodeData)
3. **`src/apps/embedded/services/apiClient.ts`** - DR CLI REST client
4. **`src/apps/embedded/services/websocketClient.ts`** - DR CLI WebSocket client
5. **`src/apps/embedded/stores/authStore.ts`** - Authentication state types

## Examples

### Example 1: Full Sync Workflow

```bash
# 1. Start DR CLI server (in separate terminal)
dr-cli serve --port 3090

# 2. Run the skill
/documentation_robotics_viewer-api-sync

# 3. Verify types compile
npx tsc --noEmit

# 4. Run integration tests
npm test -- tests/integration/api
```

### Example 2: After DR CLI API Changes

When the DR CLI server adds new endpoints (e.g., `/api/security/analyze`):

```bash
# 1. Update OpenAPI spec
curl http://localhost:3090/api/openapi.json -o openapi.json

# 2. Regenerate types
/documentation_robotics_viewer-api-sync

# 3. Update consuming code
# Edit src/apps/embedded/services/apiClient.ts to use new types

# 4. Add tests for new endpoint
# Create tests/integration/api/security-analyze.spec.ts
```

### Example 3: Type-Safe WebSocket Messages

After regenerating types, use them in WebSocket handlers:

```typescript
// src/apps/embedded/services/websocketClient.ts
import type { ModelUpdateNotification, ValidationEvent } from '@/core/types/generated/dr-cli-api';

// Now fully type-safe
socket.on('model.updated', (msg: ModelUpdateNotification) => {
  modelStore.getState().updateElement(msg.elementId, msg.changes);
});
```

## Related Documentation

- **DR CLI Integration Guide**: `documentation/DR_CLI_INTEGRATION_GUIDE.md` (400+ lines)
- **WebSocket Protocol**: `documentation/WEBSOCKET_JSONRPC_IMPLEMENTATION.md`
- **Type Definitions**: `src/core/types/model.ts`, `src/core/types/reactflow.ts`
- **API Client**: `src/apps/embedded/services/apiClient.ts`

## Troubleshooting

### Issue: Type generation fails

**Check:**
1. DR CLI server is running (`curl http://localhost:3090/health`)
2. OpenAPI spec is valid JSON (`jq . openapi.json`)
3. Node.js version matches project requirements (20.x/22.x)

### Issue: Generated types conflict with existing types

**Solution:**
- Review `src/core/types/model.ts` for manual type definitions
- Use TypeScript module augmentation for extending generated types
- Keep generated types separate in `src/core/types/generated/`

### Issue: Tests fail after type sync

**Solution:**
```bash
# Update test fixtures with new types
npm test -- tests/fixtures/

# Regenerate mock data
npm run test:fixtures:update
```

---

*This skill was automatically generated for the documentation_robotics_viewer project (TypeScript 5.9.3, React 19.2.0, @xyflow/react 12.9.3).*
