# Testing Strategy - Documentation Robotics Viewer

## Problem Statement

**Issue**: E2E tests passed while graph rendering failed completely (0 nodes displayed despite 182 elements loaded).

**Root Cause**: Tests validated DOM structure and API responses but not:
- Actual data correctness (element types)
- Visual rendering output
- Data pipeline integrity
- Console errors during rendering

## Testing Philosophy

```
Fast Unit Tests (milliseconds)
    ↓
Integration Tests (seconds)
    ↓
E2E Tests with Validation (seconds)
    ↓
Visual Regression Tests (manual/automated)
```

**Goal**: Catch bugs at the lowest (fastest) level possible.

---

## 1. Unit Tests (Fast, Isolated)

### ⚠️ Server-Side (Partially Implemented)

**Implemented Files**:
- `tests/unit/motivationGraphBuilder.spec.ts` - Tests for motivation layer graph building logic

**Planned But Not Yet Implemented**:
- `tests/unit/server-model-loading.spec.ts` - Would test model loading from server
- `tests/unit/type-inference-coverage.spec.ts` - Would test type inference from YAML properties

**Coverage Needed**:
- ❌ Type inference from YAML properties
- ❌ Element creation and structure validation
- ❌ Relationship parsing
- ❌ Layer-by-layer validation
- ❌ Type coverage verification

**Why These Are Important**: They would test the actual data transformation logic in isolation before data reaches the client.

---

### ❌ Client-Side Services (MISSING - CRITICAL GAP)

#### A. NodeTransformer Tests

**File**: `tests/unit/services/nodeTransformer.spec.ts`

**What to Test**:
```typescript
describe('NodeTransformer', () => {
  test('should transform MetaModel elements to React Flow nodes', () => {
    const model = createMockModel({
      layers: {
        business: {
          elements: [{
            id: 'test-1',
            type: 'service',
            name: 'Test Service',
            properties: { /* ... */ }
          }]
        }
      }
    });

    const transformer = new NodeTransformer(new VerticalLayerLayout());
    const result = await transformer.transformModel(model);

    // CRITICAL: Verify nodes were created
    expect(result.nodes).toHaveLength(1);

    // CRITICAL: Verify node has correct type
    expect(result.nodes[0].type).toBe('service-node');

    // CRITICAL: Verify node has required data
    expect(result.nodes[0].data).toMatchObject({
      elementId: 'test-1',
      layerId: 'business',
      label: 'Test Service'
    });

    // CRITICAL: Verify node has position
    expect(result.nodes[0].position).toBeDefined();
    expect(result.nodes[0].position.x).toBeGreaterThan(0);
    expect(result.nodes[0].position.y).toBeGreaterThan(0);
  });

  test('should handle elements with unknown type', () => {
    const model = createMockModel({
      layers: {
        business: {
          elements: [{
            id: 'test-1',
            type: 'unknown',  // This was the actual bug!
            name: 'Test'
          }]
        }
      }
    });

    const transformer = new NodeTransformer(new VerticalLayerLayout());
    const result = await transformer.transformModel(model);

    // Should either:
    // 1. Create a generic node, OR
    // 2. Skip the element and log warning
    // But MUST NOT crash or silently fail
    expect(result.nodes.length).toBeGreaterThanOrEqual(0);
  });

  test('should create edges for relationships', () => {
    const model = createMockModel({
      layers: { /* ... */ },
      relationships: [{
        id: 'rel-1',
        sourceId: 'elem-1',
        targetId: 'elem-2',
        type: 'uses'
      }]
    });

    const result = await transformer.transformModel(model);

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({
      source: 'elem-1',
      target: 'elem-2',
      type: 'uses'
    });
  });
});
```

**Why This Matters**: This would have caught the `type: 'unknown'` bug immediately.

---

#### B. DataLoader Tests

**File**: `tests/unit/services/dataLoader.spec.ts`

**What to Test**:
```typescript
describe('DataLoader', () => {
  test('should detect YAML instance format from manifest', () => {
    const files = {
      'manifest.yaml': 'version: 0.1.0\nschema: documentation-robotics-v1',
      'model/business/services.yaml': '...'
    };

    const result = await dataLoader.detectSchemaType(files);
    expect(result).toBe('yaml-instance');
  });

  test('should parse YAML instance model correctly', () => {
    const files = mockYAMLFiles();
    const model = await dataLoader.parseYAMLInstances(files, '/', 'manifest.yaml');

    // CRITICAL: Verify all elements have types
    for (const layer of Object.values(model.layers)) {
      for (const element of layer.elements) {
        expect(element.type).not.toBe('unknown');
        expect(element.type).toBeTruthy();
      }
    }
  });

  test('should handle malformed YAML gracefully', () => {
    const files = {
      'manifest.yaml': 'valid manifest',
      'model/business/bad.yaml': 'invalid: yaml: content: [{'
    };

    const model = await dataLoader.parseYAMLInstances(files, '/', 'manifest.yaml');

    // Should succeed with warnings, not throw
    expect(model.metadata?.warnings).toBeDefined();
    expect(model.metadata?.warnings.length).toBeGreaterThan(0);
  });
});
```

---

#### C. SpecParser Tests

**File**: `tests/unit/services/specParser.spec.ts`

**What to Test**:
```typescript
describe('SpecParser', () => {
  test('should extract element types from JSON Schema definitions', () => {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: {
        Service: { type: 'object', properties: { /* ... */ } },
        Component: { type: 'object', properties: { /* ... */ } }
      }
    };

    const elements = specParser.extractElements(schema, 'Application');

    expect(elements).toHaveLength(2);
    expect(elements[0].type).toBe('service');
    expect(elements[1].type).toBe('component');
  });
});
```

---

### ❌ React Component Tests (MISSING)

#### D. GraphViewer Component Tests

**File**: `tests/unit/components/GraphViewer.spec.tsx`

**What to Test**:
```typescript
import { render, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';

describe('GraphViewer', () => {
  test('should render nodes for valid model', async () => {
    const model = createMockModel({ /* ... */ });

    const { container } = render(
      <ReactFlowProvider>
        <GraphViewer model={model} />
      </ReactFlowProvider>
    );

    // Wait for async rendering
    await waitFor(() => {
      // CRITICAL: Check that React Flow nodes were created
      const nodes = container.querySelectorAll('.react-flow__node');
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  test('should update visibility when layer state changes', async () => {
    const model = createMockModel({ /* ... */ });
    const { container, rerender } = render(
      <ReactFlowProvider>
        <GraphViewer model={model} />
      </ReactFlowProvider>
    );

    // Toggle layer visibility
    act(() => {
      useLayerStore.getState().toggleLayerVisibility('business');
    });

    await waitFor(() => {
      const hiddenNodes = container.querySelectorAll('.react-flow__node[style*="opacity: 0"]');
      expect(hiddenNodes.length).toBeGreaterThan(0);
    });
  });

  test('should handle empty model gracefully', () => {
    const emptyModel = { layers: {}, relationships: [], version: '1.0.0' };

    const { container } = render(
      <ReactFlowProvider>
        <GraphViewer model={emptyModel} />
      </ReactFlowProvider>
    );

    // Should not crash
    expect(container).toBeTruthy();
  });
});
```

---

#### E. SpecGraphView Component Tests

**File**: `tests/unit/components/SpecGraphView.spec.tsx`

**What to Test**:
```typescript
describe('SpecGraphView', () => {
  test('should convert spec data to model and render', async () => {
    const specData = {
      version: '1.0.0',
      schemas: {
        '01-business-layer.schema.json': { /* ... */ }
      }
    };

    const { container, getByText } = render(<SpecGraphView specData={specData} />);

    // Should show loading state initially
    expect(getByText(/Converting schema/i)).toBeInTheDocument();

    // Should render graph after conversion
    await waitFor(() => {
      expect(container.querySelector('.graph-viewer')).toBeInTheDocument();
    });
  });

  test('should show error for invalid spec data', async () => {
    const invalidData = { version: '1.0.0' }; // Missing schemas

    const { getByText } = render(<SpecGraphView specData={invalidData} />);

    await waitFor(() => {
      expect(getByText(/Invalid spec data/i)).toBeInTheDocument();
    });
  });

  test('should clean schema keys correctly', () => {
    const specData = {
      version: '1.0.0',
      schemas: {
        '01-motivation-layer.schema.json': { /* ... */ },
        '02-business-layer.schema.json': { /* ... */ }
      }
    };

    // Spy on DataLoader to verify correct layer names
    const parseSchemasSpy = jest.spyOn(DataLoader.prototype, 'parseSchemaDefinitions');

    render(<SpecGraphView specData={specData} />);

    await waitFor(() => {
      expect(parseSchemasSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          Motivation: expect.any(Object),
          Business: expect.any(Object)
        }),
        '1.0.0'
      );
    });
  });
});
```

---

## 2. Integration Tests (Cross-Component)

### ❌ Data Pipeline Integration (MISSING - CRITICAL GAP)

#### A. Server-to-Client Data Flow

**File**: `tests/integration/server-to-client.spec.ts`

**What to Test**:
```typescript
describe('Server to Client Data Pipeline', () => {
  test('should load model from server and verify element types', async ({ page, request }) => {
    // 1. Verify server API returns correct data
    const apiResponse = await request.get('http://localhost:8765/api/model');
    const serverModel = await apiResponse.json();

    // CRITICAL: Verify server data quality
    let unknownCount = 0;
    for (const layer of Object.values(serverModel.layers)) {
      for (const element of layer.elements) {
        if (element.type === 'unknown') {
          unknownCount++;
          console.error(`Unknown type: ${element.id}`);
        }
      }
    }
    expect(unknownCount).toBe(0); // Must be ZERO

    // 2. Load page and verify client receives data
    await page.goto('http://localhost:3001');

    // 3. Wait for model to load in client
    await page.waitForFunction(() => {
      return window.modelData && Object.keys(window.modelData.layers).length > 0;
    });

    // 4. Verify client model matches server model
    const clientModel = await page.evaluate(() => window.modelData);
    expect(Object.keys(clientModel.layers)).toEqual(Object.keys(serverModel.layers));
  });
});
```

**Why This Matters**: This validates the complete server → network → client pipeline.

---

#### B. Model-to-Graph Transformation

**File**: `tests/integration/model-to-graph.spec.ts`

**What to Test**:
```typescript
describe('Model to Graph Transformation', () => {
  test('should transform complete model to React Flow nodes', async () => {
    const model = await loadRealExampleModel(); // Use actual example-implementation

    const layoutEngine = new VerticalLayerLayout();
    const transformer = new NodeTransformer(layoutEngine);
    const result = await transformer.transformModel(model);

    // CRITICAL: Every element should produce a node
    const elementCount = Object.values(model.layers)
      .reduce((sum, layer) => sum + layer.elements.length, 0);

    expect(result.nodes.length).toBe(elementCount);

    // CRITICAL: Every node should have a valid type
    for (const node of result.nodes) {
      expect(node.type).toBeTruthy();
      expect(node.type).not.toBe('unknown');
    }

    // CRITICAL: Every node should have position
    for (const node of result.nodes) {
      expect(node.position).toBeDefined();
      expect(node.position.x).toBeGreaterThanOrEqual(0);
      expect(node.position.y).toBeGreaterThanOrEqual(0);
    }

    // CRITICAL: Relationships should produce edges
    expect(result.edges.length).toBeGreaterThan(0);
  });
});
```

---

#### C. Layer Visibility Integration

**File**: `tests/integration/layer-visibility.spec.ts`

**What to Test**:
```typescript
describe('Layer Visibility', () => {
  test('should update graph when layer visibility changes', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.waitForSelector('.react-flow__node');

    // Count initial visible nodes
    const initialCount = await page.locator('.react-flow__node:visible').count();
    expect(initialCount).toBeGreaterThan(0);

    // Toggle a layer off
    await page.click('[data-layer-id="business"] .visibility-toggle');

    // Verify nodes are hidden
    const afterToggleCount = await page.locator('.react-flow__node:visible').count();
    expect(afterToggleCount).toBeLessThan(initialCount);
  });
});
```

---

## 3. Enhanced E2E Tests (Validate Actual Output)

### Current E2E Test Problems

**What's Wrong**:
```typescript
// ❌ BAD: Only checks if container exists
test('graph loads', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await expect(page.locator('.graph-viewer')).toBeVisible();
  // PASSES even if graph is completely empty!
});
```

**What We Need**:
```typescript
// ✅ GOOD: Validates actual content
test('graph renders all elements', async ({ page }) => {
  await page.goto('http://localhost:3001');

  // Wait for graph container
  await page.waitForSelector('.graph-viewer');

  // CRITICAL: Wait for actual nodes to render
  await page.waitForSelector('.react-flow__node', { timeout: 10000 });

  // CRITICAL: Count rendered nodes
  const nodeCount = await page.locator('.react-flow__node').count();
  expect(nodeCount).toBeGreaterThan(0);
  expect(nodeCount).toBe(182); // Exact count for example-implementation

  // CRITICAL: Verify nodes have labels
  const nodesWithText = await page.locator('.react-flow__node:has-text("")').count();
  expect(nodesWithText).toBe(nodeCount); // All nodes should have text

  // CRITICAL: Check for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.waitForTimeout(2000); // Let any async errors surface
  expect(errors).toHaveLength(0);
});
```

---

### Enhanced E2E Test Suite

**File**: `tests/e2e/graph-rendering-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Graph Rendering Validation', () => {
  test('should render correct number of nodes for example model', async ({ page }) => {
    await page.goto('http://localhost:3001');

    // Load example implementation
    await page.click('text=Load Demo Data');

    // Wait for rendering to complete
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    await page.waitForTimeout(1000); // Let layout settle

    // CRITICAL: Count nodes
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log(`Rendered ${nodeCount} nodes`);

    // Should match element count from server
    expect(nodeCount).toBe(182);
  });

  test('should render nodes with visible labels', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.react-flow__node');

    // Check that nodes have visible text
    const nodes = await page.locator('.react-flow__node').all();

    for (const node of nodes.slice(0, 10)) { // Sample first 10
      const text = await node.textContent();
      expect(text?.trim()).toBeTruthy(); // Should have non-empty text
    }
  });

  test('should render edges between nodes', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.react-flow__node');

    // CRITICAL: Verify edges exist
    const edgeCount = await page.locator('.react-flow__edge').count();
    console.log(`Rendered ${edgeCount} edges`);

    expect(edgeCount).toBeGreaterThan(0);
  });

  test('should not have console errors during rendering', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:3001');
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // CRITICAL: No errors should occur
    if (errors.length > 0) {
      console.error('Console errors detected:', errors);
    }
    expect(errors).toHaveLength(0);
  });

  test('should render nodes in correct layers', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.react-flow__node');

    // Get layer container positions
    const layers = await page.evaluate(() => {
      const layerContainers = document.querySelectorAll('[data-layer-id]');
      return Array.from(layerContainers).map(el => ({
        id: el.getAttribute('data-layer-id'),
        y: el.getBoundingClientRect().y
      }));
    });

    // Layers should be stacked vertically
    expect(layers.length).toBeGreaterThan(0);

    // Each layer should be below the previous
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i].y).toBeGreaterThan(layers[i-1].y);
    }
  });

  test('should match visual snapshot', async ({ page }) => {
    await page.goto('http://localhost:3001');
    await page.click('text=Load Demo Data');
    await page.waitForSelector('.react-flow__node');
    await page.waitForTimeout(2000); // Let layout settle

    // CRITICAL: Visual regression test
    await expect(page).toHaveScreenshot('graph-full-render.png', {
      maxDiffPixels: 100 // Allow minor rendering differences
    });
  });
});
```

---

## 4. Test Execution Strategy

### Development Workflow

```bash
# 1. Fast feedback loop (< 5 seconds)
npm run test:unit

# 2. Medium feedback (< 30 seconds)
npm run test:integration

# 3. Full validation (< 2 minutes)
npm run test:e2e

# 4. Complete suite (CI/CD)
npm test
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:unit": "vitest run tests/unit/**/*.spec.ts",
    "test:unit:watch": "vitest tests/unit/**/*.spec.ts",
    "test:integration": "playwright test tests/integration --config=playwright.unit.config.ts",
    "test:e2e": "playwright test tests/e2e",
    "test:e2e:validation": "playwright test tests/e2e/graph-rendering-validation.spec.ts",
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 5. What Would Have Caught the Bug

**The Bug**: 90% of elements had `type: 'unknown'`, graph rendered 0 nodes.

**Tests That Would Have Caught It**:

1. ✅ **Unit Test - Server Type Inference** (we have this now)
   ```typescript
   expect(element.type).not.toBe('unknown');
   ```

2. ❌ **Unit Test - NodeTransformer** (MISSING)
   ```typescript
   // Would have failed when trying to map 'unknown' to node type
   expect(node.type).toBeTruthy();
   ```

3. ❌ **Integration Test - Model to Graph** (MISSING)
   ```typescript
   expect(result.nodes.length).toBe(elementCount);
   ```

4. ❌ **E2E Test - Node Count Validation** (MISSING)
   ```typescript
   expect(nodeCount).toBe(182); // Would have been 0!
   ```

**Current E2E Tests**: Only checked DOM structure, not actual rendering.

---

## 6. Implementation Priority

### Phase 1: Critical Gaps (IMMEDIATE)
1. ✅ Server-side unit tests (DONE)
2. ❌ Enhanced E2E validation tests (graph-rendering-validation.spec.ts)
3. ❌ NodeTransformer unit tests
4. ❌ Server-to-client integration test

### Phase 2: Component Coverage (HIGH)
5. ❌ GraphViewer component tests
6. ❌ SpecGraphView component tests
7. ❌ DataLoader service tests

### Phase 3: Comprehensive Coverage (MEDIUM)
8. ❌ SpecParser tests
9. ❌ Layer visibility integration tests
10. ❌ Visual regression tests

### Phase 4: Continuous Monitoring (ONGOING)
11. Console error monitoring in all E2E tests
12. Performance benchmarks
13. Bundle size tracking

---

## 7. Success Metrics

**Current State**:
- ⚠️ Server unit tests: 1 test file (motivationGraphBuilder.spec.ts)
- ❌ Client unit tests: 0 tests
- ⚠️ Integration tests: 1 test file (server-to-client.spec.ts)
- ⚠️ E2E tests: Multiple test files but validation needs improvement

**Target State**:
- ✅ Server unit tests: 7+ passing
- ✅ Client unit tests: 20+ passing
- ✅ Integration tests: 10+ passing
- ✅ E2E tests: 30+ passing with rendering validation

**Quality Gates**:
- All tests must pass before merge
- E2E tests must verify actual node count
- No console errors allowed in E2E tests
- Visual regression tests must match snapshots

---

## 8. Tools & Setup

### Unit Testing (React Components)
- **Vitest** + **React Testing Library**
- Fast, isolated tests
- Mock external dependencies

### Integration Testing
- **Playwright** with real server
- Test cross-component interactions
- Validate data pipeline

### E2E Testing
- **Playwright** with full stack
- Visual regression with screenshot comparison
- Console error monitoring

### Configuration Files
- `vitest.config.ts` - Unit test config
- `playwright.unit.config.ts` - Integration tests
- `playwright.config.ts` - E2E tests

---

## Conclusion

**The Problem**: E2E tests passed because they only checked "does the page load?" not "does it actually render correctly?"

**The Solution**: Multi-layered testing that validates:
1. Data correctness (unit tests)
2. Data flow (integration tests)
3. Actual rendering (enhanced E2E tests)
4. Visual output (regression tests)

**Next Steps**:
1. Implement enhanced E2E validation tests
2. Add NodeTransformer unit tests
3. Create server-to-client integration test
4. Gradually build out remaining test coverage

This strategy ensures bugs are caught at the fastest (cheapest) level possible, with comprehensive validation at each layer.
