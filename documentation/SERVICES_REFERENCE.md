# Services Reference Guide

Complete documentation of all 31 services in the Documentation Robotics Viewer, organized by layer and function.

## Table of Contents

- [Core Services (16)](#core-services)
  - [Data Loading & Parsing (4)](#data-loading--parsing)
  - [Graph Building & Layout (4)](#graph-building--layout)
  - [Cross-Layer Processing (4)](#cross-layer-processing)
  - [Export & Analysis (4)](#export--analysis)
- [Embedded Services (15)](#embedded-services)
  - [C4 Architecture (3)](#c4-architecture)
  - [Motivation Layer (3)](#motivation-layer)
  - [Data Management (4)](#data-management)
  - [Real-time Communication (2)](#real-time-communication)
  - [Chat & Validation (3)](#chat--validation)

---

## Core Services

### Data Loading & Parsing

#### 1. `dataLoader.ts` - Model Loading Orchestration
**Location**: `src/core/services/dataLoader.ts`
**Purpose**: Orchestrates loading and parsing of architecture models from various sources
**Status**: ⚠️ **Untested** (CRITICAL)

**Key Methods**:
- `loadModel(source: string)` - Load model from file, URL, or YAML instance
- `parseModel(content: string)` - Parse raw model content to typed structure
- `validateModel(model: Model)` - Validate model schema and cross-references
- `loadLayers(model: Model)` - Extract and load individual layers

**Dependencies**:
- `yamlParser` - YAML instance model parsing
- `jsonSchemaParser` - JSON Schema validation
- `specParser` - Layer specification parsing

**Usage Example**:
```typescript
import { dataLoader } from '@/core/services/dataLoader';

// Load from file
const model = await dataLoader.loadModel('path/to/model.yaml');

// Load from URL
const model = await dataLoader.loadModel('https://example.com/model.json');

// Validate before transformation
const isValid = dataLoader.validateModel(model);
```

**Error Handling**:
- Throws `ParseError` for malformed YAML/JSON
- Throws `ValidationError` for schema violations
- Throws `LoadError` for file/network issues

**Test Coverage**: None yet - **SHOULD TEST**
- Happy path loading (YAML, JSON, URL)
- Error cases (malformed files, missing files)
- Type inference for untyped elements
- Cross-reference validation

---

#### 2. `yamlParser.ts` - YAML Instance Model Parsing
**Location**: `src/core/services/yamlParser.ts`
**Purpose**: Parse YAML instance models with dot-notation IDs into typed structures
**Status**: ⚠️ **Untested** (CRITICAL)

**Supported Formats**:
- **YAML Instances**: `business.function.calculateTax` → UUID with inference
- **JSON Schema**: UUID-based with explicit types
- **Manifest Format**: Directory with layer-specific files

**Key Methods**:
- `parseYamlInstance(yaml: string)` - Parse YAML instance format
- `inferTypes(elements: Element[])` - Auto-infer element types from context
- `resolveDotNotation(id: string)` - Convert dot-notation to internal UUID
- `validateLayerStructure(layer: Layer)` - Validate YAML layer format

**Usage Example**:
```typescript
import { yamlParser } from '@/core/services/yamlParser';

const yaml = `
business:
  function:
    calculateTax:
      description: Calculate tax for transaction
      properties:
        complexity: high
`;

const model = yamlParser.parseYamlInstance(yaml);
// Returns { id: 'uuid-123', type: 'function', layer: 'business', ... }
```

**Key Behaviors**:
- Dot-notation IDs automatically converted to UUIDs
- Element types inferred from parent context
- Missing properties filled with defaults
- Full compatibility with JSON Schema format

**Test Coverage**: None yet - **SHOULD TEST**
- Dot-notation parsing and conversion
- Type inference from hierarchy
- Default property handling
- Compatibility with existing JSON Schema models
- Large model parsing performance

---

#### 3. `jsonSchemaParser.ts` - JSON Schema Model Parsing
**Location**: `src/core/services/jsonSchemaParser.ts`
**Purpose**: Parse JSON Schema format models with explicit UUIDs and types
**Status**: ⚠️ **Untested** (CRITICAL)

**Key Methods**:
- `parseJsonSchema(json: object)` - Parse JSON Schema format
- `validateSchema(json: object)` - Validate against JSON Schema spec
- `extractLayers(schema: object)` - Extract individual layers from schema
- `resolveReferences(schema: object)` - Resolve $ref pointers

**Format Example**:
```json
{
  "version": "1.0.0",
  "layers": {
    "business": {
      "elements": [
        {
          "id": "uuid-123",
          "type": "service",
          "name": "PaymentService",
          "properties": {}
        }
      ]
    }
  }
}
```

**Test Coverage**: None yet - **SHOULD TEST**
- Valid schema parsing
- Reference resolution ($ref pointers)
- Schema validation errors
- Large schema performance
- Backward compatibility with existing models

---

#### 4. `specParser.ts` - Layer Specification Parsing
**Location**: `src/core/services/specParser.ts`
**Purpose**: Parse layer-specific specifications and validation rules
**Status**: 📝 Partially documented

**Key Methods**:
- `parseLayerSpec(spec: object)` - Parse layer specification
- `getElementTypes(layer: string)` - Get valid element types for layer
- `getValidProperties(layer: string, type: string)` - Get allowed properties
- `validateElement(element: Element)` - Validate element against spec

**Usage**:
```typescript
import { specParser } from '@/core/services/specParser';

// Get valid types for business layer
const types = specParser.getElementTypes('business');
// Returns ['service', 'process', 'function', 'capability']

// Validate element against spec
const isValid = specParser.validateElement(element);
```

---

### Graph Building & Layout

#### 5. `businessGraphBuilder.ts` - Business Layer Graph Construction
**Location**: `src/core/services/businessGraphBuilder.ts`
**Purpose**: Build complete business layer graph with hierarchy, metrics, and indices
**Status**: ✅ **Well Tested** (35 unit tests in `businessGraphBuilder.spec.ts`)

**Key Methods**:
- `build(elements: BusinessElement[], relationships: Relationship[])` - Build complete graph
- `calculateHierarchy(elements: BusinessElement[])` - Calculate element hierarchy
- `calculateMetrics(elements: BusinessElement[])` - Calculate metrics per element
- `buildIndices(elements: BusinessElement[])` - Build lookup indices for performance

**Returns**:
```typescript
interface BusinessGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  hierarchy: HierarchyTree;
  metrics: ElementMetrics[];
  indices: {
    byType: Map<string, GraphNode[]>;
    byLayer: Map<string, GraphNode[]>;
    byParent: Map<string, GraphNode[]>;
  };
}
```

**Test Coverage**: ✅ Comprehensive
- Element transformation to nodes
- Relationship transformation to edges
- Hierarchy calculation
- Metric aggregation
- Index creation and lookup performance

---

#### 6. `nodeTransformer.ts` - Element to React Flow Node Conversion
**Location**: `src/core/services/nodeTransformer.ts`
**Purpose**: Transform architecture elements to React Flow node structure
**Status**: ✅ **Well Tested** (30 unit tests in `nodeTransformer.spec.ts`)

**Key Methods**:
- `getNodeTypeForElement(element: Element)` - Map element to node type
- `extractNodeData(element: Element, nodeType: string)` - Extract node data from element
- `precalculateDimensions(element: Element, nodeType: string)` - Calculate node dimensions
- `createNodePosition(element: Element, layout: Layout)` - Create node position

**Usage**:
```typescript
import { nodeTransformer } from '@/core/services/nodeTransformer';

const element = { id: 'e1', type: 'service', name: 'PaymentService' };
const nodeType = nodeTransformer.getNodeTypeForElement(element);
// Returns 'businessServiceNode'

const nodeData = nodeTransformer.extractNodeData(element, nodeType);
// Returns { elementId: 'e1', label: 'PaymentService', ... }
```

**Supported Node Types**:
- Business: ServiceNode, ProcessNode, FunctionNode, CapabilityNode
- Motivation: GoalNode, StakeholderNode, ConstraintNode
- Technology, API, DataModel, UX, etc.

---

#### 7. `businessNodeTransformer.ts` - Business Node Transformation
**Location**: `src/core/services/businessNodeTransformer.ts`
**Purpose**: Transform business-specific elements to React Flow nodes
**Status**: ⚠️ **Untested** (MODERATE)

**Key Methods**:
- `transformBusinessService(element: BusinessElement)` - Transform service element
- `transformBusinessProcess(element: BusinessElement)` - Transform process element
- `transformBusinessFunction(element: BusinessElement)` - Transform function element
- `addBusinessMetadata(node: GraphNode, element: BusinessElement)` - Add business-specific data

**Business-Specific Data**:
```typescript
interface BusinessNodeData {
  elementId: string;
  label: string;
  type: 'service' | 'process' | 'function' | 'capability';
  businessMetrics: {
    complexity: 'low' | 'medium' | 'high';
    riskLevel: number;
    criticality: number;
    costBenefit: number;
  };
  ownership: {
    team: string;
    department: string;
    owner: string;
  };
}
```

---

#### 8. `layoutConfig.ts` - Layout Engine Configuration
**Location**: `src/core/services/layerLayoutConfig.ts`
**Purpose**: Configure layout algorithms by layer size and type
**Status**: 📝 Partially documented

**Supported Layouts**:
- **Vertical**: Default, good for hierarchy visualization
- **Hierarchical**: Best for tree-like structures
- **ForceDirected**: Physics simulation, good for relationships
- **Swimlane**: For process flows
- **Grid**: For uniform element distribution

**Selection Strategy**:
```typescript
// Auto-select based on element count
- <50 nodes: Vertical or Hierarchical
- 50-200 nodes: Swimlane or ForceDirected
- 200+ nodes: Grid with viewport culling
```

---

### Cross-Layer Processing

#### 9. `crossLayerProcessor.ts` - Cross-Layer Integration Pipeline
**Location**: `src/core/services/crossLayerProcessor.ts`
**Purpose**: Orchestrate cross-layer reference processing and relationship management
**Status**: ✅ **Tested** (6 unit tests in `crossLayerProcessor.spec.ts`)

**Key Methods**:
- `processReferences(model: Model)` - Process all cross-layer references
- `resolveLinks(references: Reference[])` - Resolve reference targets
- `validateCrossLayerRelationships(model: Model)` - Validate relationship integrity
- `buildCrossLayerGraph(model: Model)` - Build complete cross-layer dependency graph

**Reference Resolution**:
```typescript
// Before
{ source: 'business.service.payment', target: 'api.operation.payment-processor' }

// After (resolved)
{
  sourceElement: BusinessServiceElement,
  targetElement: ApiOperationElement,
  type: 'implements',
  validated: true
}
```

---

#### 10. `crossLayerReferenceExtractor.ts` - Reference Extraction
**Location**: `src/core/services/crossLayerReferenceExtractor.ts`
**Purpose**: Extract cross-layer references from model elements
**Status**: ⚠️ **Untested** (MODERATE)

**Key Methods**:
- `extractReferences(model: Model)` - Extract all cross-layer references
- `findReferencesFromElement(element: Element)` - Extract references from single element
- `validateReferenceTarget(source: Element, target: string)` - Check if reference is valid

**Reference Types**:
- `implements` - Business service implements API operation
- `realizes` - API operation realizes technology component
- `depends_on` - Capability depends on other capability
- `supports` - Security policy supports business capability

---

#### 11. `crossLayerReferenceResolver.ts` - Reference Resolution
**Location**: `src/core/services/crossLayerReferenceResolver.ts`
**Purpose**: Resolve cross-layer references to actual elements
**Status**: ✅ **Tested** (8 unit tests in `crossLayerReferenceResolver.spec.ts`)

**Key Methods**:
- `resolve(reference: Reference)` - Resolve reference to target element
- `resolveAll(references: Reference[])` - Resolve multiple references
- `validateResolution(reference: Reference)` - Check resolution validity
- `reportUnresolved(references: Reference[])` - Report missing targets

**Error Handling**:
- Throws `UnresolvedReferenceError` for missing targets
- Logs warnings for broken references
- Returns partial resolution results with error details

---

#### 12. `crossLayerLinksExtractor.ts` - Link Extraction & Processing
**Location**: `src/core/services/crossLayerLinksExtractor.ts`
**Purpose**: Extract and process links between cross-layer elements
**Status**: ✅ **Tested** (5 unit tests in `crossLayerLinksExtractor.spec.ts`)

**Key Methods**:
- `extractLinks(model: Model)` - Extract all cross-layer links
- `buildLinkGraph(links: Link[])` - Create link dependency graph
- `findDependencies(element: Element)` - Find all dependencies of element
- `findDependents(element: Element)` - Find all elements depending on this element

**Usage Example**:
```typescript
import { crossLayerLinksExtractor } from '@/core/services/crossLayerLinksExtractor';

const links = crossLayerLinksExtractor.extractLinks(model);
const deps = crossLayerLinksExtractor.findDependencies(paymentService);
// Returns all API operations, technology components, etc. that payment service depends on
```

---

### Export & Analysis

#### 13. `businessExportService.ts` - Business Layer Export
**Location**: `src/core/services/businessExportService.ts`
**Purpose**: Export business layer graphs to PNG, SVG, JSON with traceability
**Status**: ⚠️ **Untested** (MODERATE)

**Key Methods**:
- `exportToPng(graph: BusinessGraph)` - Export to PNG image
- `exportToSvg(graph: BusinessGraph)` - Export to SVG vector
- `exportToJson(graph: BusinessGraph)` - Export to JSON with full traceability
- `generateReport(graph: BusinessGraph)` - Generate markdown report

**Export Features**:
- Traceability tracking (what elements were changed)
- Impact analysis (what elements are affected)
- Full graph metadata preservation
- Custom styling per export format

**Test Coverage**: None yet - **SHOULD TEST**
- PNG export with correct dimensions
- SVG export with proper styling
- JSON export with full traceability data
- Report generation accuracy

---

#### 14. `exportUtils.ts` - Export Utilities
**Location**: `src/core/services/exportUtils.ts`
**Purpose**: Shared utilities for all export services
**Status**: ⚠️ **Untested** (MODERATE)

**Key Methods**:
- `sanitizeFilename(name: string)` - Create valid filename
- `generateExportTimestamp()` - Create timestamped filename
- `applyExportStyling(graph: Graph, style: ExportStyle)` - Apply custom styling
- `validateExportSize(data: any)` - Check file size and compress if needed

**Usage**:
```typescript
import { exportUtils } from '@/core/services/exportUtils';

const filename = exportUtils.generateExportTimestamp('business-graph');
// Returns 'business-graph-2025-02-08T14-30-45.json'

const sanitized = exportUtils.sanitizeFilename('Service/Name\\Invalid');
// Returns 'ServiceNameInvalid'
```

---

#### 15. `impactAnalysisService.ts` - Impact Analysis
**Location**: `src/core/services/impactAnalysisService.ts`
**Purpose**: Analyze impact of changes across layers
**Status**: ⚠️ **Stub** (INCOMPLETE)

**Planned Methods**:
- `analyzeImpact(element: Element, change: Change)` - Analyze what changes affect
- `findUpstreamImpact(element: Element)` - Find upstream dependencies
- `findDownstreamImpact(element: Element)` - Find downstream dependents
- `generateImpactReport(analysis: ImpactAnalysis)` - Create impact report

**Impact Types**:
- Direct impact (element itself changes)
- Upstream impact (dependent elements affected)
- Downstream impact (dependents affected)
- Cross-layer impact (across multiple layers)

**Note**: Currently a stub - **NEEDS IMPLEMENTATION**

---

#### 16. `exceptionClassifier.ts` - Exception Classification
**Location**: `src/core/services/exceptionClassifier.ts`
**Purpose**: Classify and categorize exceptions from model loading/parsing
**Status**: ✅ **Tested** (10 unit tests in `exceptionClassifier.spec.ts`)

**Exception Categories**:
- `ParseError` - YAML/JSON parsing failures
- `ValidationError` - Schema or business rule violations
- `ReferenceError` - Cross-layer reference issues
- `TransformError` - Transformation to React Flow failed
- `LayoutError` - Layout calculation failed
- `ExportError` - Export operation failed

**Key Methods**:
- `classify(error: Error)` - Classify error into category
- `formatError(error: ClassifiedError)` - Format for display
- `isFatal(error: ClassifiedError)` - Check if error stops processing
- `suggest(error: ClassifiedError)` - Suggest recovery actions

**Usage**:
```typescript
import { exceptionClassifier } from '@/core/services/exceptionClassifier';

try {
  model = parser.parse(content);
} catch (error) {
  const classified = exceptionClassifier.classify(error);
  if (classified.isFatal) {
    showError(classified.message);
  } else {
    logWarning(classified.message);
  }
}
```

---

## Embedded Services

### C4 Architecture

#### 17. `c4Parser.ts` - C4 Model Parsing
**Location**: `src/apps/embedded/services/c4Parser.ts`
**Purpose**: Parse C4 architecture model files (XMI, XML, JSON formats)
**Status**: ✅ **Tested** (15 unit tests in `c4Parser.spec.ts`)

**Supported Formats**:
- **Structurizr JSON** - Native C4 DSL format
- **XMI** - UML diagram format
- **Custom JSON** - Simplified format

**Key Methods**:
- `parseC4Model(content: string, format: 'json' | 'xmi')` - Parse C4 model
- `extractC4Elements(model: C4Model)` - Extract System/Container/Component/Code levels
- `buildC4Hierarchy(elements: C4Element[])` - Build C4 level hierarchy

**C4 Levels**:
```typescript
1. System - Top level (System as a whole)
2. Container - Major application components
3. Component - Components within container
4. Code - Code-level elements
```

---

#### 18. `c4ViewTransformer.ts` - C4 View Transformation
**Location**: `src/apps/embedded/services/c4ViewTransformer.ts`
**Purpose**: Transform C4 elements to specific C4 views (System, Container, Component)
**Status**: ✅ **Tested** (12 unit tests in `c4ViewTransformer.spec.ts`)

**Key Methods**:
- `transformToSystemView(model: C4Model)` - Create System Context view
- `transformToContainerView(model: C4Model, system: C4System)` - Create Container view
- `transformToComponentView(model: C4Model, container: C4Container)` - Create Component view
- `transformToCodeView(model: C4Model, component: C4Component)` - Create Code view

**View Filters**:
Each view automatically filters to relevant elements and relationships for that level.

---

#### 19. `c4ExportService.ts` - C4 Export
**Location**: `src/apps/embedded/services/c4ExportService.ts`
**Purpose**: Export C4 views to PNG, SVG, Markdown
**Status**: ⚠️ **Untested** (MODERATE)

**Key Methods**:
- `exportViewToPng(view: C4View)` - Export C4 view to PNG
- `exportViewToSvg(view: C4View)` - Export C4 view to SVG
- `exportModelToMarkdown(model: C4Model)` - Generate C4 documentation
- `generateC4Reports(model: C4Model)` - Create all views + documentation

---

### Motivation Layer

#### 20. `motivationGraphBuilder.ts` - Motivation Layer Graph
**Location**: `src/apps/embedded/services/motivationGraphBuilder.ts`
**Purpose**: Build complete motivation layer graph (Goals, Stakeholders, Constraints)
**Status**: ✅ **Tested** (25 unit tests in `motivationGraphBuilder.spec.ts`)

**Key Methods**:
- `build(elements: MotivationElement[])` - Build complete graph
- `buildGoalTree(goals: Goal[])` - Build goal hierarchy
- `buildStakeholderNetwork(stakeholders: Stakeholder[])` - Build stakeholder relationships
- `linkConstraints(constraints: Constraint[])` - Link constraints to goals/stakeholders

**Graph Structure**:
```typescript
interface MotivationGraph {
  goals: GoalNode[];
  stakeholders: StakeholderNode[];
  constraints: ConstraintNode[];
  relationships: {
    goalDependencies: Edge[];
    stakeholderInfluence: Edge[];
    constraintApplications: Edge[];
  };
}
```

---

#### 21. `motivationGraphTransformer.ts` - Motivation Transform
**Location**: `src/apps/embedded/services/motivationGraphTransformer.ts`
**Purpose**: Transform motivation elements to React Flow nodes
**Status**: ✅ **Tested** (18 unit tests in `motivationGraphTransformer.spec.ts`)

**Transforms**:
- Goal → GoalNode with color coding by type
- Stakeholder → StakeholderNode with role indicators
- Constraint → ConstraintNode with severity indicators

---

#### 22. `motivationExportService.ts` - Motivation Export
**Location**: `src/apps/embedded/services/motivationExportService.ts`
**Purpose**: Export motivation layer views
**Status**: ⚠️ **Untested** (MODERATE)

**Exports**:
- Goal hierarchy diagrams
- Stakeholder influence maps
- Constraint impact reports

---

### Data Management

#### 23. `embeddedDataLoader.ts` - Embedded App Data Loading
**Location**: `src/apps/embedded/services/embeddedDataLoader.ts`
**Purpose**: Load models with embedded app-specific features (annotations, preferences)
**Status**: ⚠️ **Untested** (MODERATE)

**Key Methods**:
- `loadWithPreferences(modelId: string)` - Load model with user preferences
- `loadWithAnnotations(modelId: string)` - Load model with annotations
- `mergePreferences(model: Model, prefs: UserPreferences)` - Merge user preferences
- `mergeAnnotations(model: Model, annotations: Annotation[])` - Add annotations

---

#### 24. `changesetGraphBuilder.ts` - Changeset Graph Construction
**Location**: `src/apps/embedded/services/changesetGraphBuilder.ts`
**Purpose**: Build graphs showing architecture changes from changesets
**Status**: ⚠️ **Untested** (MODERATE)

**Key Methods**:
- `buildChangeGraph(changeset: Changeset)` - Build graph of changes
- `visualizeAdded(changeset: Changeset)` - Show added elements
- `visualizeRemoved(changeset: Changeset)` - Show removed elements
- `visualizeModified(changeset: Changeset)` - Show modified elements

**Visualization**:
- Added elements highlighted in green
- Removed elements highlighted in red
- Modified elements highlighted in yellow
- Change type indicators

---

#### 25. `coverageAnalyzer.ts` - Coverage Analysis
**Location**: `src/apps/embedded/services/coverageAnalyzer.ts`
**Purpose**: Analyze model coverage and completeness
**Status**: 📝 Partially documented

**Metrics**:
- Element coverage (% of layer modeled)
- Relationship coverage (% of relationships captured)
- Type coverage (% of elements with explicit types)
- Property coverage (% of properties filled vs available)

---

#### 26. `chatService.ts` - Chat Operations
**Location**: `src/apps/embedded/services/chatService.ts`
**Purpose**: Handle chat operations (create, update, validation)
**Status**: ⚠️ **Untested** (CRITICAL)

**Key Methods**:
- `createChatMessage(message: ChatMessage)` - Create new message
- `updateChatContext(context: ChatContext)` - Update conversation context
- `validateChatContent(content: string)` - Validate message content
- `formatChatForModel(messages: ChatMessage[])` - Format for model context

**Integration**:
- Uses WebSocket for real-time updates
- Uses JSON-RPC for operations
- Integrates with architectural model context

---

### Real-time Communication

#### 27. `websocketClient.ts` - WebSocket Client
**Location**: `src/apps/embedded/services/websocketClient.ts`
**Purpose**: WebSocket connection management for real-time updates
**Status**: ⚠️ **Untested** (CRITICAL)

**Key Methods**:
- `connect(url: string)` - Establish WebSocket connection
- `disconnect()` - Close connection
- `send(message: any)` - Send message
- `on(event: string, handler: Function)` - Subscribe to event
- `off(event: string, handler: Function)` - Unsubscribe from event

**Events**:
- `annotation:created` - New annotation added
- `annotation:updated` - Annotation modified
- `annotation:deleted` - Annotation removed
- `changeset:applied` - Changeset applied
- `model:updated` - Model changed

**Usage**:
```typescript
import { websocketClient } from '@/apps/embedded/services/websocketClient';

websocketClient.on('annotation:created', (annotation) => {
  updateStore(annotation);
});

websocketClient.send({
  method: 'annotation.create',
  params: { text: 'New annotation' }
});
```

---

#### 28. `jsonRpcHandler.ts` - JSON-RPC Protocol Handler
**Location**: `src/apps/embedded/services/jsonRpcHandler.ts`
**Purpose**: Handle JSON-RPC 2.0 protocol for WebSocket communication
**Status**: ✅ **Tested** (8 unit tests in `jsonRpcHandler.spec.ts`)

**Key Methods**:
- `parseRequest(data: string)` - Parse JSON-RPC request
- `handleRequest(request: JsonRpcRequest)` - Route to appropriate handler
- `createResponse(id: string, result: any)` - Create success response
- `createError(id: string, error: RpcError)` - Create error response

**Supported Methods**:
- `annotation.create` - Create annotation
- `annotation.update` - Update annotation
- `annotation.delete` - Delete annotation
- `changeset.apply` - Apply changeset
- `model.validate` - Validate model

---

### Chat & Validation

#### 29. `chatValidation.ts` - Chat Validation
**Location**: `src/apps/embedded/services/chatValidation.ts`
**Purpose**: Validate chat messages and conversation context
**Status**: ✅ **Tested** (10 unit tests in `chatValidation.spec.ts`)

**Key Methods**:
- `validateMessage(message: ChatMessage)` - Check message validity
- `validateContext(context: ChatContext)` - Check context validity
- `checkTokenBudget(messages: ChatMessage[])` - Check token usage
- `formatForModel(messages: ChatMessage[])` - Format for LLM context

**Validations**:
- Message length constraints
- Content policy checks
- Context relevance validation
- Token budget enforcement

---

#### 30. `errorTracker.ts` - Error Tracking
**Location**: `src/apps/embedded/services/errorTracker.ts`
**Purpose**: Track and report errors during session
**Status**: ✅ **Tested** (8 unit tests in `errorTracker.spec.ts`)

**Key Methods**:
- `trackError(error: Error, context: ErrorContext)` - Log error with context
- `getErrors(filter: ErrorFilter)` - Retrieve tracked errors
- `clearErrors()` - Clear error log
- `exportErrors()` - Export errors for debugging

**Error Context**:
- When error occurred
- What operation was in progress
- User action that triggered it
- Model state at time of error

---

#### 31. `githubService.ts` - GitHub Integration
**Location**: `src/apps/embedded/services/githubService.ts`
**Purpose**: GitHub integration for model loading and sharing
**Status**: 📝 Partially implemented

**Planned Features**:
- Load models from GitHub repositories
- Save changes back to GitHub
- Create pull requests for model changes
- Share architecture models via GitHub URLs

**Not Yet Implemented**:
- Full OAuth flow
- PR creation
- Repository management

---

## Service Dependencies & Data Flow

### Data Loading Pipeline

```
User Input
    ↓
dataLoader
    ↓
┌─────────────────────────────┐
│   Format-Specific Parser    │
├─────────────────────────────┤
│ • yamlParser                │
│ • jsonSchemaParser          │
│ • specParser                │
└─────────────────────────────┘
    ↓
exceptionClassifier (error handling)
    ↓
crossLayerProcessor (reference resolution)
    ↓
┌─────────────────────────────┐
│   Layer-Specific Builder    │
├─────────────────────────────┤
│ • businessGraphBuilder      │
│ • motivationGraphBuilder    │
│ • c4ViewTransformer         │
└─────────────────────────────┘
    ↓
nodeTransformer / businessNodeTransformer
    ↓
React Flow Graph
```

### Cross-Layer Integration

```
Model
    ↓
crossLayerLinksExtractor
    ↓
crossLayerReferenceExtractor
    ↓
crossLayerReferenceResolver
    ↓
crossLayerProcessor
    ↓
Fully Resolved Model with Cross-Layer References
```

### Real-time Updates Pipeline

```
User Action (Chat/Changeset)
    ↓
websocketClient.send(message)
    ↓
jsonRpcHandler.handleRequest()
    ↓
chatService / changesetGraphBuilder
    ↓
websocketClient.on('event')
    ↓
Store Update (Zustand)
    ↓
React Re-render
```

---

## Testing Status Summary

| Service | Tests | Status | Priority |
|---------|-------|--------|----------|
| businessGraphBuilder | 35 | ✅ Excellent | — |
| nodeTransformer | 30 | ✅ Excellent | — |
| motivationGraphBuilder | 25 | ✅ Excellent | — |
| businessLayerParser | 20 | ✅ Excellent | — |
| exceptionClassifier | 10 | ✅ Good | — |
| crossLayerProcessor | 6 | ✅ Good | — |
| crossLayerReferenceResolver | 8 | ✅ Good | — |
| crossLayerLinksExtractor | 5 | ✅ Good | — |
| c4Parser | 15 | ✅ Good | — |
| c4ViewTransformer | 12 | ✅ Good | — |
| motivationGraphTransformer | 18 | ✅ Good | — |
| chatValidation | 10 | ✅ Good | — |
| errorTracker | 8 | ✅ Good | — |
| jsonRpcHandler | 8 | ✅ Good | — |
| **dataLoader** | 0 | ⚠️ **CRITICAL** | HIGH |
| **yamlParser** | 0 | ⚠️ **CRITICAL** | HIGH |
| **jsonSchemaParser** | 0 | ⚠️ **CRITICAL** | HIGH |
| **businessExportService** | 0 | ⚠️ Untested | MEDIUM |
| **c4ExportService** | 0 | ⚠️ Untested | MEDIUM |
| **motivationExportService** | 0 | ⚠️ Untested | MEDIUM |
| **exportUtils** | 0 | ⚠️ Untested | MEDIUM |
| **websocketClient** | 0 | ⚠️ **CRITICAL** | HIGH |
| **chatService** | 0 | ⚠️ **CRITICAL** | HIGH |
| **embeddedDataLoader** | 0 | ⚠️ Untested | MEDIUM |
| **changesetGraphBuilder** | 0 | ⚠️ Untested | MEDIUM |
| coverageAnalyzer | 0 | ⚠️ Untested | LOW |
| crossLayerReferenceExtractor | 0 | ⚠️ Untested | MEDIUM |
| **impactAnalysisService** | 0 | ⚠️ **STUB** | LOW |
| githubService | 0 | ⚠️ **INCOMPLETE** | LOW |

---

## How to Use This Guide

**Finding a Service**:
1. Search by name (e.g., "businessGraphBuilder")
2. Search by purpose (e.g., "export business layer")
3. Navigate via layer (e.g., "Data Loading & Parsing")

**Understanding a Service**:
1. Read "Purpose" for quick summary
2. Check "Status" to know if it's tested
3. Review "Key Methods" for available operations
4. See "Usage Example" for code reference
5. Check "Test Coverage" for testing notes

**Testing a Service**:
1. Look for "Test Coverage" section
2. If marked "Untested" or "CRITICAL", add tests
3. See `tests/README.md` for testing patterns

**Service Dependencies**:
1. Review "Key Methods" section
2. Check "Dependencies" list
3. Review data flow diagrams above

---

## Next Steps

See also:
- `CLAUDE.md` - Development guide with implementation patterns
- `tests/README.md` - Complete testing guide
- `documentation/IMPLEMENTATION_LOG.md` - Phase-by-phase implementation history
- `TESTING_STRATEGY.md` - Testing philosophy and gap analysis
