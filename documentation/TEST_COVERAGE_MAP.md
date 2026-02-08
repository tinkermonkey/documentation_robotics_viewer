# Test Coverage Map

Complete mapping of tests to features, services, and components. Use this guide to find tests for any feature or to understand test organization.

## Quick Navigation

- [How to Find Tests for a Feature](#how-to-find-tests-for-a-feature)
- [Test File Organization](#test-file-organization)
- [Service Test Coverage (31 Services)](#service-test-coverage)
- [Component & Node Test Coverage (135 Components)](#component--node-test-coverage)
- [Layer Test Coverage](#layer-test-coverage)
- [Integration Test Coverage](#integration-test-coverage)
- [Test Statistics](#test-statistics)
- [Coverage Gaps](#coverage-gaps)

---

## How to Find Tests for a Feature

### Scenario 1: "I need to test business layer functionality"

**Go to**: Tests by Layer → Business Layer

```
Feature: Business service visualization
Location: tests/c4-business-architecture-view.spec.ts
Related Services: businessGraphBuilder.spec.ts, businessLayerParser.spec.ts
Related Components: tests/unit/nodes/businessNodes.spec.ts
```

### Scenario 2: "I need to find tests for the dataLoader service"

**Go to**: Service Test Coverage

```
Service: dataLoader.ts
Status: ⚠️ Untested (CRITICAL)
What to do: Add tests in tests/unit/services/dataLoader.spec.ts
```

### Scenario 3: "I want to test a new business component"

**Go to**: Component Test Coverage

```
Component: BusinessInspectorPanel.tsx
Story File: BusinessInspectorPanel.stories.tsx
Story Tests: tests/stories/all-stories.spec.ts (auto-validated)
Pattern Tests: tests/unit/base/BaseInspectorPanel.spec.ts
```

### Scenario 4: "I changed the YAML parser, what tests might break?"

**Go to**: Data Pipeline Tests

```
Service: yamlParser.ts
Status: ⚠️ Untested
Impacts: dataLoader → nodeTransformer → graphBuilder
Should Test: YAML instance parsing, type inference, dot-notation resolution
```

---

## Test File Organization

```
tests/
├── unit/                              # Isolated service & utility tests
│   ├── services/                      # Service logic tests
│   │   ├── businessGraphBuilder.spec.ts  [35 tests] ✅
│   │   ├── businessLayerParser.spec.ts   [20 tests] ✅
│   │   ├── nodeTransformer.spec.ts       [30 tests] ✅
│   │   ├── exceptionClassifier.spec.ts   [10 tests] ✅
│   │   ├── workerPool.spec.ts            [8 tests] ✅
│   │   ├── crossLayerProcessor.spec.ts   [6 tests] ✅
│   │   ├── crossLayerReferenceResolver.spec.ts [8 tests] ✅
│   │   ├── crossLayerLinksExtractor.spec.ts [5 tests] ✅
│   │   ├── c4Parser.spec.ts               [15 tests] ✅
│   │   ├── c4ViewTransformer.spec.ts      [12 tests] ✅
│   │   ├── chatValidation.spec.ts         [10 tests] ✅
│   │   ├── errorTracker.spec.ts           [8 tests] ✅
│   │   ├── jsonRpcHandler.spec.ts         [8 tests] ✅
│   │   ├── motivationGraphBuilder.spec.ts [25 tests] ✅
│   │   ├── motivationGraphTransformer.spec.ts [18 tests] ✅
│   │   ├── dataLoader.spec.ts             [0 tests] ⚠️ NEEDED
│   │   ├── yamlParser.spec.ts             [0 tests] ⚠️ NEEDED
│   │   ├── jsonSchemaParser.spec.ts       [0 tests] ⚠️ NEEDED
│   │   ├── businessExportService.spec.ts  [0 tests] ⚠️ NEEDED
│   │   ├── c4ExportService.spec.ts        [0 tests] ⚠️ NEEDED
│   │   ├── motivationExportService.spec.ts [0 tests] ⚠️ NEEDED
│   │   └── ... (other services)
│   │
│   ├── nodes/                         # Node component tests
│   │   ├── businessNodes.spec.ts         [Tests for 4 business nodes] ✅
│   │   ├── motivationNodes.spec.ts       [Tests for 3 motivation nodes] ✅
│   │   └── ... (other node tests)
│   │
│   ├── base/                          # Base component tests
│   │   ├── BaseInspectorPanel.spec.ts    [Tests for base pattern] ✅
│   │   ├── BaseControlPanel.spec.ts      [Tests for base pattern] ✅
│   │   └── GraphViewSidebar.spec.ts      [Tests for base pattern] ✅
│   │
│   ├── layout/                        # Layout algorithm tests
│   │   ├── verticalLayout.spec.ts        [Layout algorithm] ✅
│   │   ├── hierarchicalLayout.spec.ts    [Layout algorithm] ✅
│   │   ├── forceDirectedLayout.spec.ts   [Layout algorithm] ✅
│   │   ├── swimlaneLayout.spec.ts        [Layout algorithm] ✅
│   │   ├── gridLayout.spec.ts            [Layout algorithm] ✅
│   │   ├── circleLayout.spec.ts          [Layout algorithm] ✅
│   │   ├── treeLayout.spec.ts            [Layout algorithm] ✅
│   │   └── layoutSelector.spec.ts        [Algorithm selection] ✅
│   │
│   ├── hooks/                         # Custom hook tests
│   │   ├── useBusinessFilters.spec.ts    [Filtering logic] ✅
│   │   ├── useBusinessFocus.spec.ts      [Focus state] ✅
│   │   └── ... (other hook tests)
│   │
│   └── preferences/                   # Store & persistence tests
│       ├── layoutPreferences.spec.ts     [Preference persistence] ✅
│       └── annotationStore.spec.ts       [Annotation storage] ✅
│
├── integration/                       # Cross-component data flow tests
│   ├── dataLoadingPipeline.spec.ts       [Parser → Transformer → Builder] ⚠️ NEEDED
│   ├── c4ParserIntegration.spec.ts       [C4 parsing flow] ✅
│   ├── preferencePersistence.spec.ts     [Store persistence] ✅
│   └── crossLayerIntegration.spec.ts     [Cross-layer processing] ⚠️ NEEDED
│
├── e2e/                              # End-to-end Playwright tests
│   ├── c4-architecture-view.spec.ts     [C4 visualization] ✅
│   ├── c4-*-view.spec.ts                [Individual C4 views] ✅ (5 files)
│   ├── embedded-*.spec.ts               [Layer visualizations] ✅ (10+ files)
│   └── ... (other E2E tests)
│
├── stories/                          # Auto-generated story validation
│   ├── all-stories.spec.ts              [481 story validations] ✅
│   └── README.md                        [Story test documentation]
│
└── README.md                          # Complete testing guide

Total: ~65 test files, ~800+ tests
```

---

## Service Test Coverage

### Status Legend
- ✅ Well Tested (10+ tests, good coverage)
- 🟡 Partially Tested (3-9 tests, basic coverage)
- ⚠️ Untested (0 tests, NEEDS TESTS)
- ⚠️ **CRITICAL** (0 tests, impacts core functionality)
- ⚠️ **STUB** (Unfinished implementation)

### Core Services

| Service | Location | Tests | File | Status | Priority |
|---------|----------|-------|------|--------|----------|
| businessGraphBuilder | `src/core/services/` | 35 | `businessGraphBuilder.spec.ts` | ✅ | — |
| businessLayerParser | `src/core/services/` | 20 | `businessLayerParser.spec.ts` | ✅ | — |
| nodeTransformer | `src/core/services/` | 30 | `nodeTransformer.spec.ts` | ✅ | — |
| exceptionClassifier | `src/core/services/` | 10 | `exceptionClassifier.spec.ts` | ✅ | — |
| workerPool | `src/core/services/` | 8 | `workerPool.spec.ts` | ✅ | — |
| crossLayerProcessor | `src/core/services/` | 6 | `crossLayerProcessor.spec.ts` | 🟡 | — |
| crossLayerReferenceResolver | `src/core/services/` | 8 | `crossLayerReferenceResolver.spec.ts` | 🟡 | — |
| crossLayerLinksExtractor | `src/core/services/` | 5 | `crossLayerLinksExtractor.spec.ts` | 🟡 | — |
| **dataLoader** | `src/core/services/` | 0 | NEEDS CREATION | ⚠️ **CRITICAL** | HIGH |
| **yamlParser** | `src/core/services/` | 0 | NEEDS CREATION | ⚠️ **CRITICAL** | HIGH |
| **jsonSchemaParser** | `src/core/services/` | 0 | NEEDS CREATION | ⚠️ **CRITICAL** | HIGH |
| specParser | `src/core/services/` | 0 | — | ⚠️ | MEDIUM |
| businessNodeTransformer | `src/core/services/` | 0 | — | ⚠️ | MEDIUM |
| **businessExportService** | `src/core/services/` | 0 | NEEDS CREATION | ⚠️ | MEDIUM |
| **exportUtils** | `src/core/services/` | 0 | NEEDS CREATION | ⚠️ | MEDIUM |
| githubService | `src/core/services/` | 0 | — | ⚠️ | LOW |
| impactAnalysisService | `src/core/services/` | 0 | — | ⚠️ **STUB** | LOW |
| layerLayoutConfig | `src/core/services/` | 0 | — | ⚠️ | MEDIUM |
| localFileLoader | `src/core/services/` | 0 | — | ⚠️ | MEDIUM |
| crossLayerReferenceExtractor | `src/core/services/` | 0 | — | ⚠️ | MEDIUM |

### Embedded Services

| Service | Location | Tests | File | Status | Priority |
|---------|----------|-------|------|--------|----------|
| c4Parser | `src/apps/embedded/services/` | 15 | `c4Parser.spec.ts` | ✅ | — |
| c4ViewTransformer | `src/apps/embedded/services/` | 12 | `c4ViewTransformer.spec.ts` | ✅ | — |
| motivationGraphBuilder | `src/apps/embedded/services/` | 25 | `motivationGraphBuilder.spec.ts` | ✅ | — |
| motivationGraphTransformer | `src/apps/embedded/services/` | 18 | `motivationGraphTransformer.spec.ts` | ✅ | — |
| chatValidation | `src/apps/embedded/services/` | 10 | `chatValidation.spec.ts` | 🟡 | — |
| errorTracker | `src/apps/embedded/services/` | 8 | `errorTracker.spec.ts` | 🟡 | — |
| jsonRpcHandler | `src/apps/embedded/services/` | 8 | `jsonRpcHandler.spec.ts` | 🟡 | — |
| **c4ExportService** | `src/apps/embedded/services/` | 0 | NEEDS CREATION | ⚠️ | MEDIUM |
| **motivationExportService** | `src/apps/embedded/services/` | 0 | NEEDS CREATION | ⚠️ | MEDIUM |
| **chatService** | `src/apps/embedded/services/` | 0 | NEEDS CREATION | ⚠️ **CRITICAL** | HIGH |
| **websocketClient** | `src/apps/embedded/services/` | 0 | NEEDS CREATION | ⚠️ **CRITICAL** | HIGH |
| **embeddedDataLoader** | `src/apps/embedded/services/` | 0 | NEEDS CREATION | ⚠️ | MEDIUM |
| **changesetGraphBuilder** | `src/apps/embedded/services/` | 0 | NEEDS CREATION | ⚠️ | MEDIUM |
| coverageAnalyzer | `src/apps/embedded/services/` | 0 | — | ⚠️ | LOW |

---

## Component & Node Test Coverage

### Node Components

| Node Type | Component | Story File | Story Tests | Status |
|-----------|-----------|-----------|-------------|--------|
| **Business Nodes (4)** | — | — | — | — |
| Service | BusinessServiceNode.tsx | BusinessServiceNode.stories.tsx | auto-validated | ✅ |
| Process | BusinessProcessNode.tsx | BusinessProcessNode.stories.tsx | auto-validated | ✅ |
| Function | BusinessFunctionNode.tsx | BusinessFunctionNode.stories.tsx | auto-validated | ✅ |
| Capability | BusinessCapabilityNode.tsx | BusinessCapabilityNode.stories.tsx | auto-validated | ✅ |
| **Motivation Nodes (3)** | — | — | — | — |
| Goal | GoalNode.tsx | GoalNode.stories.tsx | auto-validated | ✅ |
| Stakeholder | StakeholderNode.tsx | StakeholderNode.stories.tsx | auto-validated | ✅ |
| Constraint | ConstraintNode.tsx | ConstraintNode.stories.tsx | auto-validated | ✅ |
| **All Nodes (135 total)** | — | — | 481 stories | ✅ |

### Base Components

| Component | Tests | Location | Status |
|-----------|-------|----------|--------|
| BaseInspectorPanel | Tested | `tests/unit/base/BaseInspectorPanel.spec.ts` | ✅ |
| BaseControlPanel | Tested | `tests/unit/base/BaseControlPanel.spec.ts` | ✅ |
| GraphViewSidebar | Tested | `tests/unit/base/GraphViewSidebar.spec.ts` | ✅ |
| RenderPropErrorBoundary | Tested | `tests/unit/base/RenderPropErrorBoundary.spec.ts` | ✅ |

### Story Validation

All components with `.stories.tsx` files are auto-validated:
- **Total Stories**: 481
- **Coverage**: 100% (all stories validated)
- **Test File**: `tests/stories/all-stories.spec.ts`
- **Validations**:
  - ✅ Story loads without HTTP errors
  - ✅ No unexpected console errors
  - ✅ No error boundary triggers
  - ✅ Source file exists for every story

---

## Layer Test Coverage

### Business Layer

| Feature | Test File | Tests | Status |
|---------|-----------|-------|--------|
| Graph Building | `businessGraphBuilder.spec.ts` | 35 | ✅ |
| Parsing | `businessLayerParser.spec.ts` | 20 | ✅ |
| Node Transformation | `nodeTransformer.spec.ts` | 30 | ✅ |
| Node Components (4) | `businessNodes.spec.ts` | Tests | ✅ |
| Visualization | `c4-business-architecture-view.spec.ts` | E2E | ✅ |
| **Export** | `businessExportService.spec.ts` | 0 | ⚠️ NEEDED |
| **Data Loading** | `dataLoader.spec.ts` | 0 | ⚠️ NEEDED |

### Motivation Layer

| Feature | Test File | Tests | Status |
|---------|-----------|-------|--------|
| Graph Building | `motivationGraphBuilder.spec.ts` | 25 | ✅ |
| Transformation | `motivationGraphTransformer.spec.ts` | 18 | ✅ |
| Node Components (3) | `motivationNodes.spec.ts` | Tests | ✅ |
| Visualization | `embedded-motivation-*.spec.ts` | E2E | ✅ |
| **Export** | `motivationExportService.spec.ts` | 0 | ⚠️ NEEDED |

### C4 Architecture Layer

| Feature | Test File | Tests | Status |
|---------|-----------|-------|--------|
| Parsing | `c4Parser.spec.ts` | 15 | ✅ |
| View Transformation | `c4ViewTransformer.spec.ts` | 12 | ✅ |
| System View | `c4-system-view.spec.ts` | E2E | ✅ |
| Container View | `c4-container-view.spec.ts` | E2E | ✅ |
| Component View | `c4-component-view.spec.ts` | E2E | ✅ |
| **Export** | `c4ExportService.spec.ts` | 0 | ⚠️ NEEDED |

### Other Layers

| Layer | Coverage | E2E Tests | Status |
|-------|----------|-----------|--------|
| Technology | Partial | `embedded-technology-*.spec.ts` | 🟡 |
| API | Partial | `embedded-api-*.spec.ts` | 🟡 |
| DataModel | Partial | `embedded-datamodel-*.spec.ts` | 🟡 |
| UX | Partial | `embedded-ux-*.spec.ts` | 🟡 |
| Security | Partial | `embedded-security-*.spec.ts` | 🟡 |
| Navigation | Partial | `embedded-navigation-*.spec.ts` | 🟡 |
| APM | Partial | `embedded-apm-*.spec.ts` | 🟡 |

---

## Integration Test Coverage

### Data Pipeline Tests

**Data Pipeline**: YAML/JSON → Parser → Transformer → Graph Builder

| Stage | Service | Test Status | File | Priority |
|-------|---------|-------------|------|----------|
| Loading | dataLoader | ⚠️ Untested | — | **HIGH** |
| Parsing YAML | yamlParser | ⚠️ Untested | — | **HIGH** |
| Parsing JSON | jsonSchemaParser | ⚠️ Untested | — | **HIGH** |
| Transformation | nodeTransformer | ✅ 30 tests | `nodeTransformer.spec.ts` | — |
| Graph Building | businessGraphBuilder | ✅ 35 tests | `businessGraphBuilder.spec.ts` | — |
| **Integration** | All stages | ⚠️ Untested | NEEDS CREATION | **HIGH** |

**What's Missing**:
- Round-trip test: Load YAML → Parse → Transform → Build → Verify nodes/edges
- Type inference validation for untyped elements
- Cross-layer reference resolution during pipeline
- Error handling for malformed inputs at each stage

### Cross-Layer Tests

| Feature | Test Status | File | Priority |
|---------|------------|------|----------|
| Reference Extraction | ⚠️ Untested | — | MEDIUM |
| Reference Resolution | ✅ 8 tests | `crossLayerReferenceResolver.spec.ts` | — |
| Link Extraction | ✅ 5 tests | `crossLayerLinksExtractor.spec.ts` | — |
| Cross-Layer Processing | ✅ 6 tests | `crossLayerProcessor.spec.ts` | — |
| **End-to-End** | ⚠️ Untested | NEEDS CREATION | **HIGH** |

### Export Pipeline Tests

| Export Type | Service | Test Status | File | Priority |
|-------------|---------|-------------|------|----------|
| Business PNG | businessExportService | ⚠️ Untested | — | MEDIUM |
| Business SVG | businessExportService | ⚠️ Untested | — | MEDIUM |
| Business JSON | businessExportService | ⚠️ Untested | — | MEDIUM |
| C4 Views | c4ExportService | ⚠️ Untested | — | MEDIUM |
| Motivation Views | motivationExportService | ⚠️ Untested | — | MEDIUM |
| Export Utils | exportUtils | ⚠️ Untested | — | MEDIUM |

### Real-Time Communication Tests

| Feature | Service | Test Status | File | Priority |
|---------|---------|-------------|------|----------|
| JSON-RPC Protocol | jsonRpcHandler | ✅ 8 tests | `jsonRpcHandler.spec.ts` | — |
| **WebSocket Client** | websocketClient | ⚠️ Untested | — | **HIGH** |
| **Chat Service** | chatService | ⚠️ Untested | — | **HIGH** |
| Chat Validation | chatValidation | ✅ 10 tests | `chatValidation.spec.ts` | — |
| Error Tracking | errorTracker | ✅ 8 tests | `errorTracker.spec.ts` | — |

---

## Test Statistics

### Overall Coverage

```
Total Test Files:     65
Total Test Cases:     ~800+
Estimated Coverage:   ~60% (primarily components & happy paths)
Untested Services:    20 (critical gaps in data pipeline & exports)
```

### By Category

| Category | Files | Tests | Status |
|----------|-------|-------|--------|
| Unit Tests | 40+ | ~450 | ✅ Good |
| Integration Tests | 5 | ~50 | 🟡 Partial |
| E2E Tests | 15+ | ~200+ | ✅ Good |
| Story Tests | 1 | 481 | ✅ Excellent |
| **Total** | **~65** | **~800+** | ✅ Comprehensive |

### By Service Type

| Service Type | Total | Tested | % Coverage |
|--------------|-------|--------|------------|
| Core Services | 16 | 8 | 50% |
| Embedded Services | 15 | 7 | 47% |
| **CRITICAL GAPS** | 7 | 0 | **0%** |

---

## Coverage Gaps

### Critical Gaps (MUST TEST)

**Data Pipeline** - 3 untested services that impact entire data flow:
1. `dataLoader.ts` - Model loading orchestration
   - No tests for file/URL loading
   - No type inference validation
   - No error handling tests
   - **Impact**: Core feature unusable without working data loading

2. `yamlParser.ts` - YAML instance model parsing
   - No dot-notation → UUID conversion tests
   - No type inference tests
   - No compatibility tests with JSON Schema format
   - **Impact**: YAML format support untested

3. `jsonSchemaParser.ts` - JSON Schema parsing
   - No schema validation tests
   - No $ref resolution tests
   - **Impact**: JSON format support untested

**Real-Time Communication** - 2 untested services:
4. `websocketClient.ts` - WebSocket connection management
   - No connection lifecycle tests
   - No message send/receive tests
   - No reconnection logic tests
   - **Impact**: All real-time features untested

5. `chatService.ts` - Chat operations
   - No message creation tests
   - No context validation tests
   - **Impact**: Chat feature untested

### High Priority Gaps (SHOULD TEST)

**Export Services** - 3 untested services:
- `businessExportService.ts` - Business layer export
- `c4ExportService.ts` - C4 view export
- `motivationExportService.ts` - Motivation view export
- **Impact**: No validation that exports generate correct formats

### Medium Priority Gaps (NICE TO TEST)

**Incomplete Services**:
- `changesetGraphBuilder.ts` - Changeset visualization
- `embeddedDataLoader.ts` - Embedded app data loading
- `impactAnalysisService.ts` - Impact analysis (stub)

**Utility Services**:
- `exportUtils.ts` - Export helpers
- `businessNodeTransformer.ts` - Business-specific node transformation
- `crossLayerReferenceExtractor.ts` - Reference extraction

---

## How to Add Tests

### Step 1: Choose Test Location

```
Feature → Service      → tests/unit/services/{ServiceName}.spec.ts
Feature → Component    → tests/unit/components/{ComponentName}.spec.ts
Feature → Integration  → tests/integration/{Feature}Integration.spec.ts
Feature → E2E         → tests/embedded-{feature}.spec.ts
```

### Step 2: Follow Test Pattern

```typescript
// tests/unit/services/myService.spec.ts
import { test, expect } from '@playwright/test';
import { MyService } from '../../src/path/MyService';

test.describe('MyService', () => {
  let service: MyService;

  test.beforeEach(() => {
    service = new MyService();
  });

  test('should do something when X happens', () => {
    // Arrange
    const input = { /* ... */ };

    // Act
    const result = service.method(input);

    // Assert
    expect(result).toEqual({ /* ... */ });
  });
});
```

### Step 3: Run & Verify

```bash
# Run your new tests
npm test -- tests/unit/services/myService.spec.ts

# Run all tests to ensure no regressions
npm test

# Run E2E tests
npm run test:e2e
```

---

## Maintaining Test Coverage

### When Adding Features

1. ✅ Write unit tests for new services
2. ✅ Write integration tests for data pipelines
3. ✅ Write E2E tests for user-visible features
4. ✅ Update story files for new components
5. ✅ Run full test suite before committing

### When Modifying Services

1. ✅ Run affected service tests
2. ✅ Run integration tests using that service
3. ✅ Run E2E tests for affected features
4. ✅ Check test coverage didn't decrease

### Before Merging PR

```bash
# Full test suite check
npm test                  # Unit + integration
npm run test:e2e         # E2E tests
npm run test:stories     # Story validation
```

---

## Test Infrastructure

### Test Runners

**Default Tests**: `playwright.config.ts`
- Runs unit + integration tests
- No external servers required
- ~6 seconds runtime

**E2E Tests**: `playwright.e2e.config.ts`
- Starts Python reference server + Vite dev server
- Tests full embedded app
- ~30-60 seconds runtime

**Story Tests**: `playwright.refinement.config.ts`
- Validates 481 component stories
- Requires `npm run catalog:dev`
- Story auto-generation: `npm run test:stories:generate`

### Test Fixtures & Mocks

**Catalog Fixtures**: `src/catalog/fixtures/`
- Mock data for all node types
- Sample models (8 variants)
- Annotation fixtures (10 patterns)

**Mock Providers**: `src/catalog/providers/`
- MockStoreProvider - Zustand store factories
- MockWebSocketProvider - WebSocket simulation
- ReactFlowDecorator - React Flow context wrapper

### Test Data

**Public Datasets**: `tests/fixtures/public-datasets/`
- 10 complete layer datasets with READMEs
- Business, Motivation, UX, APM, Technology, Security, Navigation, Datastore, C4

---

## Related Documentation

- `tests/README.md` - Complete testing guide with setup instructions
- `TESTING_STRATEGY.md` - Testing philosophy and gap analysis
- `SERVICES_REFERENCE.md` - All services and their test status
- `COMPONENT_API_REFERENCE.md` - Component testing patterns
- `CLAUDE.md` - Implementation patterns and critical rules

---

## Summary

**Key Points**:
1. **800+ tests** provide comprehensive coverage
2. **7 critical gaps** in data pipeline and real-time services
3. **Find tests** by layer, service, or component using this map
4. **Add tests** by creating file in appropriate tests/ subdirectory
5. **Maintain coverage** by testing before committing
6. **Use fixtures** from `src/catalog/` for test data

**Next Steps**:
- [See TESTING_STRATEGY.md for gap analysis](./TESTING_STRATEGY.md)
- [See tests/README.md for setup guide](../tests/README.md)
- [Add tests for critical services](#coverage-gaps)
