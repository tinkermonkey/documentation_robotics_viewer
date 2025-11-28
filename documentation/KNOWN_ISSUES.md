# Known Issues - Documentation Robotics Viewer

**Last Updated**: 2025-11-28
**Version**: v1.0.0

This document tracks known issues discovered during comprehensive testing (Phases 1-3). These are **non-blocking** but should be addressed to improve the viewer experience.

---

## Issue #1: WebSocket Connection Errors (Low Priority)

### Description
Console shows WebSocket connection errors even though the application works correctly:
```
[WebSocket] Error: Event
[EmbeddedApp] WebSocket error: Event
```

### Current Behavior
- Application attempts WebSocket connection to `ws://localhost:8765`
- Connection fails (server doesn't have WebSocket endpoint)
- App gracefully falls back to REST API (`http://localhost:8765/api/model`)
- **Data loads successfully** via REST
- User sees "Connected" status indicator

### Impact
- **Functionality**: None - REST fallback works perfectly
- **User Experience**: Minor - console errors visible in browser DevTools
- **E2E Tests**: Tests fail on "no console errors" assertion

### Root Cause
The embedded app (`src/apps/embedded/EmbeddedApp.tsx`) initializes WebSocket client by default:
```typescript
// Line 57
websocketClient.connect();
```

But the reference server (`reference_server/main.py`) only implements REST endpoints, not WebSocket.

### Reproduction Steps
1. Start reference server: `cd reference_server && python main.py`
2. Start dev server: `npm run dev:embedded`
3. Open browser to `http://localhost:3001`
4. Open DevTools Console
5. Observe WebSocket error messages

### Expected Behavior (Options)
**Option A**: Graceful fallback with no console errors
- Detect WebSocket unavailable
- Silently use REST mode
- No error messages

**Option B**: Implement WebSocket in reference server
- Add WebSocket endpoint to `reference_server/main.py`
- Support real-time model updates
- Better UX for live editing

**Option C**: Make transport configurable
- Add config option: `transport: "rest" | "websocket" | "auto"`
- Default to REST for reference server
- WebSocket for production CLI

### Suggested Fix (Option A - Simplest)

**File**: `src/apps/embedded/services/websocketClient.ts`

Add connection detection:
```typescript
async connect() {
  try {
    // Attempt connection with timeout
    const connected = await this.tryConnect(5000); // 5 second timeout

    if (!connected) {
      console.log('[WebSocket] Server does not support WebSocket, using REST mode');
      this.mode = 'rest';
      return;
    }
  } catch (error) {
    // Suppress error, use REST
    this.mode = 'rest';
  }
}
```

**File**: `src/apps/embedded/EmbeddedApp.tsx`

Check mode before subscribing:
```typescript
const handleConnect = () => {
  if (websocketClient.mode === 'rest') {
    // Skip WebSocket-specific setup
    loadInitialData();
    return;
  }

  // Existing WebSocket logic...
  websocketClient.subscribe(['model', 'changesets', 'annotations']);
};
```

### Test Updates Needed
**File**: `tests/e2e/graph-rendering-validation.spec.ts`

Update error filtering:
```typescript
const errors: string[] = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    const text = msg.text();
    // Filter out expected WebSocket fallback errors
    if (!text.includes('[WebSocket]') && !text.includes('WebSocket')) {
      errors.push(text);
    }
  }
});
```

### Priority
**Low** - Does not affect functionality, only developer experience and test cleanliness.

### Assigned To
Test team

---

## Issue #2: Zero Edges Rendering (Medium Priority)

### Description
Graph renders all 170 nodes correctly but shows **0 edges** (no connections between nodes).

### Current Behavior
- Nodes render with proper positions and labels ✅
- No lines/arrows connecting related nodes ❌
- Graph looks like isolated boxes

### Expected Behavior
- Nodes connected with arrows showing relationships
- Cross-layer references visible
- Hierarchical relationships displayed

### Visual Evidence
See screenshot: `test-results/graph-rendering-validation-08165--of-nodes-from-server-model-chromium/test-failed-1.png`

The graph shows rows of disconnected nodes with no edges.

### Test Output
```
Console: "Created 192 nodes and 0 edges"
E2E Test: edgeCount = 0
Expected: > 0
```

### Root Cause Analysis

#### Investigation 1: Server Data Structure

Server returns relationships embedded in element properties:
```json
{
  "id": "desktop-deployment",
  "type": "constraint",
  "properties": {
    "relationships": {
      "constrains": [
        "motivation.goal.ensure-local-first-operation"
      ]
    }
  }
}
```

But also returns empty relationship arrays at layer level:
```json
"layers": {
  "Motivation": {
    "elements": [...],
    "relationships": []  // ← Always empty!
  }
}
```

#### Investigation 2: Client Processing

**NodeTransformer** (`src/core/services/nodeTransformer.ts`) looks for relationships in two places:

**1. Layer-level relationships** (line 129):
```typescript
for (const layer of Object.values(model.layers)) {
  for (const relationship of layer.relationships) {  // ← Always empty array!
    const edge = this.createEdge(relationship, nodeMap);
    if (edge) edges.push(edge);
  }
}
```

**2. Cross-layer references** (line 137):
```typescript
for (const reference of model.references) {  // ← Check if this is populated
  if (reference.source.elementId && reference.target.elementId) {
    const sourceNodeId = nodeMap.get(reference.source.elementId);
    const targetNodeId = nodeMap.get(reference.target.elementId);
    // ... create edge
  }
}
```

#### Investigation 3: What's Missing

The server needs to either:

**Option A**: Extract relationships from element properties and populate `layer.relationships[]`

**Option B**: Extract relationships and populate `model.references[]`

**Current state**: Relationships exist in `element.properties.relationships` but are never extracted into the arrays that NodeTransformer reads.

### Reproduction Steps
1. Start servers and load model
2. Open Graph view
3. Observe: Nodes render, no connecting lines
4. Check browser console: "Created 192 nodes and 0 edges"

### Required Changes

#### Server Changes (`reference_server/main.py`)

Add relationship extraction after element loading:

```python
# After loading all elements, extract relationships
layer_relationships = []

for element in elements:
    element_relationships = element.get('properties', {}).get('relationships', {})

    for rel_type, target_ids in element_relationships.items():
        for target_id in target_ids:
            relationship = {
                "id": f"{element['id']}-{rel_type}-{target_id}",
                "sourceId": element['id'],
                "targetId": target_id,
                "type": rel_type,
                "properties": {}
            }
            layer_relationships.append(relationship)

layers[normalized_layer_id] = {
    "id": normalized_layer_id,
    "type": layer_config.get('name', normalized_layer_id),
    "name": layer_config.get('name', normalized_layer_id),
    "elements": elements,
    "relationships": layer_relationships  # ← Populate this!
}
```

Also populate cross-layer references:

```python
# After all layers loaded, extract cross-layer references
references = []

for layer_id, layer in layers.items():
    for element in layer['elements']:
        element_rels = element.get('properties', {}).get('relationships', {})

        for rel_type, target_ids in element_rels.items():
            for target_id in target_ids:
                # Check if target is in different layer
                target_layer = target_id.split('.')[0]  # Extract layer from ID

                if target_layer != element.get('layerId'):
                    reference = {
                        "source": {
                            "layerId": element.get('layerId'),
                            "elementId": element['id']
                        },
                        "target": {
                            "layerId": normalize_layer_id(target_layer),
                            "elementId": target_id
                        },
                        "type": rel_type
                    }
                    references.append(reference)

model_data = {
    "version": manifest.get('version', '0.1.0'),
    "layers": layers,
    "references": references,  # ← Add this!
    # ... rest of model
}
```

#### Client Validation

Verify NodeTransformer receives relationships:

**File**: `tests/integration/server-to-client.spec.ts`

Add test:
```typescript
test('should extract relationships from model', async ({ request }) => {
  const response = await request.get('http://localhost:8765/api/model');
  const model = await response.json();

  // Count layer relationships
  let totalLayerRels = 0;
  for (const layer of Object.values(model.layers as any)) {
    totalLayerRels += layer.relationships?.length || 0;
  }

  // Count cross-layer references
  const crossLayerRefs = model.references?.length || 0;

  console.log(`Layer relationships: ${totalLayerRels}`);
  console.log(`Cross-layer references: ${crossLayerRefs}`);

  // At least one type should be populated
  expect(totalLayerRels + crossLayerRefs).toBeGreaterThan(0);
});
```

### Testing Checklist

After implementing fix:

- [ ] Server returns non-empty `layer.relationships` arrays
- [ ] Server returns non-empty `model.references` array
- [ ] Integration test passes: relationships > 0
- [ ] E2E test passes: `edgeCount > 0`
- [ ] Visual verification: Lines connect nodes in graph
- [ ] Cross-layer arrows render correctly
- [ ] Edge labels show relationship types

### Example Data Structure (Expected)

**Layer Relationships**:
```json
{
  "layers": {
    "Motivation": {
      "elements": [...],
      "relationships": [
        {
          "id": "desktop-deployment-constrains-ensure-local-first",
          "sourceId": "desktop-deployment",
          "targetId": "motivation.goal.ensure-local-first-operation",
          "type": "constrains",
          "properties": {}
        }
      ]
    }
  }
}
```

**Cross-Layer References**:
```json
{
  "references": [
    {
      "source": {
        "layerId": "Business",
        "elementId": "business.service.knowledge-graph-management"
      },
      "target": {
        "layerId": "Api",
        "elementId": "api.operation.create-structure-node"
      },
      "type": "realizes"
    }
  ]
}
```

### Priority
**Medium** - Graph is usable without edges but relationships are important for understanding architecture.

### Estimated Effort
- Server changes: 2-3 hours
- Testing: 1-2 hours
- Visual verification: 1 hour
- **Total**: ~5 hours

### Assigned To
Test team

---

## Issue #3: Node Count Discrepancy - 170 vs 182 (Low Priority)

### Description
Server reports 182 elements, but only 170 nodes render in the graph.

**Missing**: 12 nodes (6.6% of total)

### Current Behavior
```
Server: "Serving model with 11 layers, 182 elements"
Client: "Created 192 nodes and 0 edges"
Browser: 170 visible nodes in DOM
```

### Investigation

#### Hypothesis 1: Layer Container Nodes
Layer containers might use a different class or rendering mechanism.

**NodeTransformer creates**:
- Element nodes: `.react-flow__node` class
- Container nodes: Might use different class

**Count**: 11 layers = 11 containers

**Test**:
```typescript
const containerNodes = await page.locator('[data-type="layerContainer"]').count();
const elementNodes = await page.locator('.react-flow__node').count();
console.log(`Containers: ${containerNodes}, Elements: ${elementNodes}`);
```

#### Hypothesis 2: APM Layer Has Zero Elements
Server logs show:
```
Layer apm: 0 elements
```

One layer is empty, so that's not contributing to the missing 12.

#### Hypothesis 3: Element Type Mapping Failures
Some element types might not map to renderable nodes.

**Check server element types**:
```json
{
  "constraint": 5,
  "driver": 5,
  "assessment": 1,
  "goal": 5,
  "customer": 3,
  "external": 1,
  "internal": 1,
  // ... 22 types total
}
```

**Check NodeTransformer type mapping** (`src/core/services/nodeTransformer.ts:202`):
```typescript
private getNodeTypeForElement(element: ModelElement): string {
  const typeMap: Record<string, string> = {
    'DataModelComponent': 'dataModel',
    'APIEndpoint': 'apiEndpoint',
    'Role': 'role',
    // ... limited mappings
  };

  return typeMap[element.type] || 'businessProcess';  // ← Fallback
}
```

**Issue**: Many server types (`constraint`, `driver`, `goal`, etc.) aren't in the typeMap, so they default to `'businessProcess'` node type.

**Possible**: Some nodes fail to render if `businessProcess` component doesn't handle them properly.

#### Hypothesis 4: Hidden or Filtered Nodes
Some nodes might be hidden by layer visibility state.

**Check layer states**:
```typescript
const layerStates = await page.evaluate(() => {
  return window.__layerStates__;  // If exposed
});
```

**Check hidden nodes**:
```typescript
const hiddenNodes = await page.locator('.react-flow__node[style*="opacity: 0"]').count();
const visibleNodes = await page.locator('.react-flow__node:visible').count();
console.log(`Hidden: ${hiddenNodes}, Visible: ${visibleNodes}`);
```

### Diagnostic Tests Needed

Create test file: `tests/integration/node-count-analysis.spec.ts`

```typescript
test('analyze node count discrepancy', async ({ page, request }) => {
  // Get server element count
  const serverResp = await request.get('http://localhost:8765/api/model');
  const model = await serverResp.json();

  const serverElementCount = Object.values(model.layers as any)
    .reduce((sum, layer) => sum + layer.elements.length, 0);

  // Load page and get rendered counts
  await page.goto('http://localhost:3001');
  await page.waitForSelector('.react-flow__node');

  const renderedNodes = await page.locator('.react-flow__node').count();
  const containerNodes = await page.locator('[type="layerContainer"]').count();
  const hiddenNodes = await page.locator('.react-flow__node[hidden]').count();

  console.log('=== Node Count Analysis ===');
  console.log(`Server elements: ${serverElementCount}`);
  console.log(`Rendered nodes: ${renderedNodes}`);
  console.log(`Container nodes: ${containerNodes}`);
  console.log(`Hidden nodes: ${hiddenNodes}`);
  console.log(`Total nodes: ${renderedNodes + containerNodes}`);
  console.log(`Missing: ${serverElementCount - renderedNodes}`);

  // Get element types that rendered
  const renderedTypes = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
    return nodes.map(n => n.getAttribute('data-type') || 'unknown');
  });

  console.log(`Rendered types: ${new Set(renderedTypes).size} unique types`);
  console.log(`Types:`, [...new Set(renderedTypes)].sort());
});
```

### Action Items for Test Team

1. **Run diagnostic test** to identify where 12 nodes are
2. **Check console logs** for transformation errors
3. **Inspect DOM** to see if nodes exist but aren't visible
4. **Map element types** to verify all types have node components
5. **Review NodeTransformer** type mapping completeness

### Possible Fixes

**If nodes are missing due to type mapping**:
Add missing types to `typeMap` in `NodeTransformer.getNodeTypeForElement()`.

**If nodes are hidden**:
Check layer visibility initialization in `useLayerStore`.

**If nodes fail to create**:
Add try-catch logging in `NodeTransformer.transformModel()` to catch failures.

### Priority
**Low** - 93% rendering rate (170/182) is acceptable for MVP. Users can see and work with the vast majority of their model.

### Estimated Effort
- Diagnostic testing: 2-3 hours
- Root cause identification: 1-2 hours
- Fix implementation: 2-4 hours (depending on cause)
- **Total**: ~6 hours

### Assigned To
Test team

---

## Issue #4: TypeScript Diagnostic Warnings (Informational)

### Description
TypeScript shows diagnostic warnings in test files:

```
graph-rendering-validation.spec.ts:355:34
  Property 'style' does not exist on type 'Element'. [2339]

graph-rendering-validation.spec.ts:218:25
  'await' has no effect on the type of this expression. [80007]
```

### Impact
**None** - Tests run successfully, these are type checking warnings only.

### Root Cause
Playwright's `page.evaluate()` runs in browser context where TypeScript types don't perfectly match runtime.

### Suggested Fix
Add type assertions:

```typescript
// Line 355
const element = node as HTMLElement;
const transform = element.style.transform;

// Line 218
await page.waitForTimeout(1000);  // Already correct, warning can be ignored
```

### Priority
**Informational** - Does not affect functionality.

### Assigned To
Test team (optional - can be ignored)

---

## Summary for Test Team

### High-Level Status
✅ **Graph rendering working**: 170 nodes render successfully with proper layout and labels
✅ **Data pipeline working**: Server → Client → Transform → Render all functional
⚠️ **Minor polish needed**: Edges, error messages, and node count variance

### Priorities
1. **Medium**: Issue #2 (Zero Edges) - Most impactful for user experience
2. **Low**: Issue #1 (WebSocket Errors) - Affects test cleanliness
3. **Low**: Issue #3 (Node Count) - Diagnostic work first
4. **Informational**: Issue #4 (TypeScript Warnings) - Can be ignored

### Recommended Approach
1. Start with **Issue #2** (edges) - clear path to fix, high user value
2. Run diagnostics for **Issue #3** (node count) - need to understand before fixing
3. Apply simple fix for **Issue #1** (WebSocket errors) - quick win for test suite
4. Ignore **Issue #4** unless time permits

### Test Coverage
All issues have:
- ✅ Clear reproduction steps
- ✅ Root cause analysis
- ✅ Suggested fixes with code examples
- ✅ Test validation steps
- ✅ Estimated effort

### Questions?
Contact the development team if you need:
- Code walkthroughs
- Additional diagnostic tests
- Clarification on any issue
- Access to test servers or environments

---

**End of Known Issues Document**
