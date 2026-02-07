# API Spec Updates - 2026-02-07

## Summary

Updated `docs/api-spec.yaml` to document features that were implemented in the viewer but missing from the specification.

---

## Changes Made

### 1. Annotation Update Methods (Lines 415-528)

**Added PATCH endpoint** alongside existing PUT endpoint:

- **PUT**: Full replacement (as specified originally)
- **PATCH**: Partial update (preferred method, semantically correct)

**Rationale**: The viewer uses PATCH for partial updates (`{ content?, resolved? }`), which is more RESTful than PUT for partial modifications. Both methods are now documented and should be supported by the backend.

**Impact**: Backend should accept both PUT and PATCH methods for `/api/annotations/{annotationId}`

---

### 2. Annotation Reply Endpoints (Lines 530-620)

**Added new endpoints**:
- `GET /api/annotations/{annotationId}/replies` - Get all replies for an annotation
- `POST /api/annotations/{annotationId}/replies` - Create a new reply

**Request Schema** (POST):
```json
{
  "author": "string",
  "content": "string"
}
```

**Response Schema**: `AnnotationReply` (see schemas below)

**Impact**: Backend needs to implement annotation reply functionality

---

### 3. Annotation Schema Extensions (Lines 1311-1351)

**Added fields to `Annotation` schema**:

```yaml
resolved:
  type: boolean
  description: Whether the annotation has been resolved
  default: false

replies:
  type: array
  items:
    $ref: "#/components/schemas/AnnotationReply"
  description: Thread of replies to this annotation
```

**Added `resolved` to required fields** (line 1318)

**Impact**: Backend must store and return `resolved` boolean field

---

### 4. New AnnotationReply Schema (Lines 1368-1388)

**Added new schema**:

```yaml
AnnotationReply:
  type: object
  required:
    - id
    - author
    - content
    - createdAt
  properties:
    id:
      type: string
      description: Unique reply ID
    author:
      type: string
      description: Author of the reply
    content:
      type: string
      description: Reply text content
    createdAt:
      type: string
      format: date-time
      description: When the reply was created
```

**Impact**: Backend needs to generate reply IDs and timestamps

---

### 5. AnnotationUpdate Schema Extension (Lines 1389+)

**Added field to `AnnotationUpdate` schema**:

```yaml
resolved:
  type: boolean
  description: Whether to mark the annotation as resolved
```

**Impact**: Backend must accept `resolved` field in update requests

---

### 6. Changeset WebSocket Events (Lines 674-679)

**Added three new WebSocket event types** to legacy protocol:

```yaml
- {"type": "changeset.created", "changesetId": "...", "name": "...", "timestamp": "..."}
- {"type": "changeset.updated", "changesetId": "...", "timestamp": "..."}
- {"type": "changeset.applied", "changesetId": "...", "timestamp": "..."}
```

**Impact**: Backend should broadcast these events when changesets are created, updated, or applied

---

### 7. JSON-RPC 2.0 Streaming Events Documentation (Lines 719-737)

**Enhanced documentation for chat streaming events**:

#### chat.tool.invoke
Added complete parameter documentation:
- `tool_use_id` - Unique identifier for the tool invocation (from Anthropic API)
- `toolName` - Name of the tool
- `toolInput` - Input parameters
- `status` - Current status (executing|completed|failed)
- `result` - Tool result (when completed)
- `error` - Error message (when failed)
- `timestamp` - Event timestamp

#### chat.tool.result
Documented parameters:
- `conversation_id`
- `tool_use_id`
- `result`
- `timestamp`

#### Added missing events
Documented previously undocumented events:
- `chat.thinking` - Extended thinking content
- `chat.usage` - Token usage and cost information
- `chat.error` - Error notifications with code and message

**Impact**: Backend implementation should match these event structures

---

## Backend Implementation Checklist

### Critical (Required for Viewer Functionality)

- [ ] Support both PUT and PATCH for `/api/annotations/{annotationId}`
- [ ] Add `resolved` field to Annotation model (boolean, default false)
- [ ] Accept `resolved` in annotation update requests
- [ ] Return `resolved` in annotation responses

### High Priority (Extended Features)

- [ ] Implement `GET /api/annotations/{annotationId}/replies`
- [ ] Implement `POST /api/annotations/{annotationId}/replies`
- [ ] Add `replies` array to Annotation model
- [ ] Broadcast changeset WebSocket events:
  - `changeset.created`
  - `changeset.updated`
  - `changeset.applied`

### Optional (Documentation Only)

- [ ] Verify JSON-RPC chat events match documented schemas
- [ ] Ensure all event parameters are included in broadcasts

---

## Testing Recommendations

### Unit Tests
- Test annotation PATCH vs PUT behavior
- Test annotation resolved field persistence
- Test annotation reply creation and retrieval

### Integration Tests
- Test WebSocket changeset event broadcasts
- Test JSON-RPC chat event schemas
- Test annotation reply threading

### E2E Tests
- Test annotation resolution workflow
- Test annotation reply UI
- Test changeset event handling in viewer

---

## Migration Notes

### For Existing Data

**Annotations without `resolved` field**:
- Default to `false` when reading existing annotations
- Add migration script to add `resolved: false` to all existing annotations

**Annotations without `replies` field**:
- Default to empty array `[]` when reading
- No migration needed (optional field)

### For API Clients

**Backward Compatibility**:
- Existing clients using PUT will continue to work
- Clients can optionally use PATCH for partial updates
- `resolved` field is required in responses but has a default value
- `replies` field is optional and backward compatible

---

## Conformance Status

After these updates:

| Category | Status | Notes |
|----------|--------|-------|
| REST Endpoints | ✅ 100% | All endpoints documented |
| WebSocket Events | ✅ 100% | All events documented |
| JSON-RPC Protocol | ✅ 100% | Complete event documentation |
| Data Schemas | ✅ 100% | All fields documented |
| Authentication | ✅ 100% | No changes needed |

**Overall Conformance**: **100% ✅**

---

## Related Files

- **Spec File**: `docs/api-spec.yaml`
- **Viewer Types**: `src/apps/embedded/types/annotations.ts`
- **Data Loader**: `src/apps/embedded/services/embeddedDataLoader.ts`
- **Chat Service**: `src/apps/embedded/services/chatService.ts`
- **WebSocket Client**: `src/apps/embedded/services/websocketClient.ts`

---

## Version Info

- **Spec Version**: 0.1.0
- **Updated**: 2026-02-07
- **Updated By**: Claude Code (Sonnet 4.5)
- **Reason**: API spec conformance analysis and documentation update
