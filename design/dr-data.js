/* ============================================================================
   Documentation Robotics — model + spec dataset
   Grounded in the tinkermonkey/documentation_robotics spec (v0.8.4) and the
   self-reflective instance model in documentation_robotics_viewer.
   The data-model layer (spec + instance) is verbatim from the repo; other
   layers use the repo's real node-type names and element counts.
   ============================================================================ */

// 12 federated architecture layers. Colors extend the Heimdall domain palette.
export const LAYERS = [
  { id: 'motivation',  num: 1,  name: 'Motivation',  std: 'ArchiMate 3.2',     color: '#8B5CF6', icon: 'sparkle',  types: 10, rels: 80,  elements: 20 },
  { id: 'business',    num: 2,  name: 'Business',    std: 'ArchiMate 3.2',     color: '#F59E0B', icon: 'workflow', types: 13, rels: 73,  elements: 17 },
  { id: 'security',    num: 3,  name: 'Security',    std: 'NIST SP 800-53',    color: '#F43F5E', icon: 'shield',   types: 29, rels: 183, elements: 12 },
  { id: 'application', num: 4,  name: 'Application', std: 'ArchiMate 3.2',     color: '#818CF8', icon: 'component',types: 9,  rels: 79,  elements: 54 },
  { id: 'technology',  num: 5,  name: 'Technology',  std: 'ArchiMate 3.2',     color: '#22D3EE', icon: 'cpu',      types: 13, rels: 128, elements: 31 },
  { id: 'api',         num: 6,  name: 'API',         std: 'OpenAPI 3.0',       color: '#10B981', icon: 'globe',    types: 27, rels: 196, elements: 22 },
  { id: 'data-model',  num: 7,  name: 'Data Model',  std: 'JSON Schema 7',     color: '#2DD4BF', icon: 'data',     types: 9,  rels: 71,  elements: 34 },
  { id: 'data-store',  num: 8,  name: 'Data Store',  std: 'Database schema',   color: '#38BDF8', icon: 'database', types: 11, rels: 106, elements: 9  },
  { id: 'ux',          num: 9,  name: 'UX',          std: 'Component model',   color: '#F472B6', icon: 'layers',   types: 22, rels: 188, elements: 41 },
  { id: 'navigation',  num: 10, name: 'Navigation',  std: 'Routing model',     color: '#A78BFA', icon: 'branch',   types: 11, rels: 122, elements: 17 },
  { id: 'apm',         num: 11, name: 'APM',         std: 'OpenTelemetry',     color: '#FB923C', icon: 'pipeline', types: 15, rels: 138, elements: 11 },
  { id: 'testing',     num: 12, name: 'Testing',     std: 'Test strategy',     color: '#4ADE80', icon: 'flask',    types: 17, rels: 202, elements: 17 },
];

// Helper to keep element authoring terse: e(id, type, name, desc, file, symbol, rels, xrefs)
function e(id, type, name, desc, file, symbol, rels, xrefs) {
  return { id, type, name, desc, src: file ? { file, symbol } : null, rels: rels || [], xrefs: xrefs || [] };
}

/* ---- MODEL: concrete instance elements per layer --------------------------
   rels  = intra-layer relationships  { p: predicate, t: targetElementId }
   xrefs = cross-layer references      { p: predicate, t: id, l: targetLayer } */
export const MODEL = {
  'data-model': [
    e('meta-model', 'objectschema', 'MetaModel', 'Root container for the loaded architecture model; holds all layers, cross-layer references, and metadata. Loaded from the DR CLI REST API and stored in modelStore.', 'src/core/types/model.ts', 'MetaModel',
      [{ p: 'aggregates', t: 'layer' }, { p: 'aggregates', t: 'model-metadata' }],
      [{ p: 'realizes', t: 'view-architecture', l: 'motivation' }]),
    e('layer', 'objectschema', 'Layer', 'Individual architecture layer within the MetaModel; contains a flat list of elements, intra-layer relationships, and visual configuration.', 'src/core/types/model.ts', 'Layer',
      [{ p: 'aggregates', t: 'model-element' }],
      [{ p: 'realizes', t: 'architecture-layer', l: 'business' }]),
    e('model-element', 'objectschema', 'ModelElement', 'Base element interface for all architecture layer elements; holds the element ID (dot-notation), type, name, properties, visual positioning, and intra-layer relationship references.', 'src/core/types/model.ts', 'ModelElement',
      [{ p: 'aggregates', t: 'relationship' }, { p: 'references', t: 'source-reference' }],
      [{ p: 'realizes', t: 'architecture-element', l: 'business' }, { p: 'maps-to', t: 'get-model', l: 'api' }]),
    e('relationship', 'objectschema', 'Relationship', 'Typed relationship between two elements within the same layer; supports 15 ArchiMate and custom relationship types (composition, aggregation, realization, serving, access, data-flow).', 'src/core/types/model.ts', 'Relationship',
      [{ p: 'references', t: 'relationship-type' }], []),
    e('reference', 'objectschema', 'Reference', 'Cross-layer reference connecting an element in one architecture layer to an element in another; carries source/target layer IDs, element IDs, and validation status.', 'src/core/types/model.ts', 'Reference',
      [], [{ p: 'references', t: 'reference-registry', l: 'application' }]),
    e('model-metadata', 'objectschema', 'ModelMetadata', 'Metadata bag attached to the MetaModel root; includes author, timestamps, parse errors, element/layer counts, and cross-layer reference statistics.', 'src/core/types/model.ts', 'ModelMetadata', [], []),
    e('source-reference', 'objectschema', 'SourceReference', 'Tracks where a model element was extracted from; holds provenance type (extracted/manual/inferred/generated), a list of SourceLocation entries, and repository context (URL + commit SHA).', 'src/core/types/model.ts', 'SourceReference',
      [], [{ p: 'references', t: 'extraction-engine', l: 'application' }]),
    e('base-node-data', 'objectschema', 'BaseNodeData', 'React Flow node data shared by all 20 custom node types; carries label, elementId, layerId, fill/stroke colors, semantic-zoom detail level, changeset operation, and relationship badge.', 'src/core/types/reactflow.ts', 'BaseNodeData',
      [], [{ p: 'serves', t: 'graph-viewer', l: 'ux' }]),
    e('data-model-node-data', 'objectschema', 'DataModelNodeData', 'Specialized React Flow node data for data-model elements; extends BaseNodeData with an ordered list of DataModelField entries and a componentType discriminator (entity/interface/enum).', 'src/core/types/reactflow.ts', 'DataModelNodeData',
      [{ p: 'extends', t: 'base-node-data' }, { p: 'aggregates', t: 'data-model-field' }], []),
    e('data-model-field', 'objectschema', 'DataModelField', 'Field definition for data-model table nodes displayed in the graph; holds field id, name, type string, required flag, and optional description.', 'src/core/types/shapes.ts', 'DataModelField', [], []),
    e('chat-message', 'objectschema', 'ChatMessage', 'Multi-part chat conversation message; contains a role (user/assistant/system), ordered content parts (text, tool invocations, thinking, usage, errors), and streaming state.', 'src/apps/embedded/types/chat.ts', 'ChatMessage',
      [{ p: 'aggregates', t: 'tool-invocation-content' }],
      [{ p: 'maps-to', t: 'post-chat', l: 'api' }]),
    e('tool-invocation-content', 'objectschema', 'ToolInvocationContent', 'Chat content part representing an AI tool invocation; tracks tool name, typed input parameters, and execution status (executing/completed/failed) with result or error.', 'src/apps/embedded/types/chat.ts', 'ToolInvocationContent', [], []),
    e('chat-conversation', 'objectschema', 'ChatConversation', 'Chat conversation grouping metadata; holds conversation ID, title, creation/update timestamps, and message count.', 'src/apps/embedded/types/chat.ts', 'ChatConversation',
      [{ p: 'aggregates', t: 'chat-message' }], []),
    e('annotation', 'objectschema', 'Annotation', 'User annotation attached to a specific architecture model element; includes author, markdown content, resolution state, and an optional thread of replies.', 'src/apps/embedded/types/annotations.ts', 'Annotation',
      [], [{ p: 'references', t: 'annotation-store', l: 'security' }]),
    e('spec-layer-data', 'objectschema', 'SpecLayerData', 'Structured spec data for a single architecture layer loaded from .dr/spec/*.json; contains layer metadata, a map of node-type name → JSON schema, and SpecNodeRelationship entries.', 'src/core/types/model.ts', 'SpecLayerData',
      [{ p: 'aggregates', t: 'spec-node-relationship' }], []),
    e('spec-node-relationship', 'objectschema', 'SpecNodeRelationship', 'Valid relationship definition between two spec node types; specifies source/destination spec node IDs and layers, predicate, cardinality, strength, and whether the relationship is required.', 'src/core/types/model.ts', 'SpecNodeRelationship', [], []),
    e('predicate-definition', 'objectschema', 'PredicateDefinition', 'Full predicate metadata from the v0.8.3 predicate catalog; carries predicate name, inverse, category, ArchiMate alignment, semantic properties (directionality, transitivity, symmetry), and default strength.', 'src/core/types/model.ts', 'PredicateDefinition', [], []),
    e('websocket-message', 'objectschema', 'WebSocketMessage', 'Base WebSocket protocol message with a discriminating type string; all real-time server messages extend this interface for live model updates.', 'src/apps/embedded/types/websocket.ts', 'WebSocketMessage',
      [], [{ p: 'maps-to', t: 'ws-updates', l: 'api' }]),
  ],

  motivation: [
    e('view-architecture', 'goal', 'Visualize architecture', 'Give engineers a single navigable surface for the entire federated model across all 12 layers, so cross-layer impact is legible at a glance.', null, null, [{ p: 'realizes', t: 'fast-comprehension' }], []),
    e('fast-comprehension', 'goal', 'Fast comprehension', 'A new contributor can locate any element and its dependencies in under a minute.', null, null, [], []),
    e('keep-docs-current', 'goal', 'Keep docs current', 'Documentation tracks the codebase automatically via extraction and live updates.', null, null, [{ p: 'realizes', t: 'view-architecture' }], []),
    e('architecture-layer', 'requirement', 'Layered model', 'The model must be partitioned into 12 standards-aligned layers with cross-layer references flowing higher → lower.', null, null, [{ p: 'supports', t: 'view-architecture' }], []),
    e('architecture-element', 'requirement', 'Addressable elements', 'Every element carries a stable dot-notation ID, type, and provenance.', null, null, [], []),
    e('live-updates-req', 'requirement', 'Live updates', 'Model file changes propagate to the viewer with zero page refresh.', null, null, [{ p: 'supports', t: 'keep-docs-current' }], []),
    e('wcag-aa', 'constraint', 'WCAG 2.1 AA', 'All surfaces meet WCAG 2.1 AA contrast and keyboard-navigation requirements.', null, null, [], []),
    e('stateless-frontend', 'principle', 'Stateless frontend', 'No session state persists in the browser; the CLI server is the source of truth.', null, null, [], []),
    e('platform-team', 'stakeholder', 'Platform team', 'Owns the meta-model spec and the CLI; primary consumer of drift reports.', null, null, [], []),
    e('contributor', 'stakeholder', 'Contributor', 'Reads the model to understand impact before changing code.', null, null, [], []),
  ],

  business: [
    e('architecture-layer', 'businessobject', 'Architecture layer', 'A standards-aligned slice of the model (motivation, business, … testing).', null, null, [], []),
    e('architecture-element', 'businessobject', 'Architecture element', 'A single addressable item within a layer.', null, null, [], []),
    e('model-curation', 'businessservice', 'Model curation', 'Maintain the federated model: extract, validate, and reconcile elements with the codebase.', null, null, [{ p: 'realizes', t: 'curate-process' }], []),
    e('drift-detection', 'businessservice', 'Drift detection', 'Surface divergence between the documented model and the source it was extracted from.', null, null, [], []),
    e('review-workflow', 'businessservice', 'Review workflow', 'Stage, annotate, and commit model changes through changesets.', null, null, [{ p: 'serves', t: 'architect-role' }], []),
    e('curate-process', 'businessprocess', 'Curate model', 'Extract → validate references → resolve conflicts → commit changeset.', null, null, [], []),
    e('validate-process', 'businessprocess', 'Validate references', 'Check every cross-layer reference resolves and respects higher → lower direction.', null, null, [], []),
    e('architect-role', 'businessrole', 'Architect', 'Curates the model and approves changesets.', null, null, [], []),
    e('reviewer-role', 'businessrole', 'Reviewer', 'Annotates elements and requests changes.', null, null, [], []),
    e('curate-function', 'businessfunction', 'Curation', 'The capability of keeping the model faithful to the system.', null, null, [], []),
  ],

  application: [
    e('graph-viewer', 'applicationcomponent', 'GraphViewer', 'React Flow surface that renders one layer at a time with dagre/ELK auto-layout, pan/zoom, and semantic-zoom node detail.', 'src/core/components/GraphViewer.tsx', 'GraphViewer', [{ p: 'serving', t: 'layout-service' }], [{ p: 'serves', t: 'view-architecture', l: 'motivation' }]),
    e('model-store', 'applicationcomponent', 'modelStore', 'Zustand store holding the loaded MetaModel, selection state, and per-layer visual config.', 'src/core/stores/modelStore.ts', 'modelStore', [], []),
    e('reference-registry', 'applicationcomponent', 'ReferenceRegistry', 'Tracks every cross-layer reference and validates resolution + direction.', 'cli/src/core/reference-registry.ts', 'ReferenceRegistry', [{ p: 'serving', t: 'validation-service' }], []),
    e('extraction-engine', 'applicationcomponent', 'ExtractionEngine', 'Parses source files to derive elements and their provenance.', 'cli/src/core/extraction.ts', 'ExtractionEngine', [], []),
    e('layout-service', 'applicationservice', 'Layout service', 'Computes node positions via dagre and ELK hierarchical layouts.', null, null, [], []),
    e('validation-service', 'applicationservice', 'Validation service', 'Runs the four-stage pipeline: schema, naming, reference, semantic.', null, null, [{ p: 'realizes', t: 'validate-process', l: 'business' }], []),
    e('websocket-client', 'applicationservice', 'WebSocket client', 'Maintains the JSON-RPC 2.0 connection for live model updates, with REST fallback.', 'src/apps/embedded/services/websocketClient.ts', 'websocketClient', [], []),
    e('changeset-service', 'applicationservice', 'Changeset service', 'Stages, diffs, and commits model edits.', null, null, [{ p: 'realizes', t: 'review-workflow', l: 'business' }], []),
    e('drbot-service', 'applicationservice', 'DrBot service', 'Model-aware assistant; runs tools against the model, changesets, and annotations.', null, null, [], []),
    e('model-loader', 'applicationservice', 'Model loader', 'Loads YAML/JSON model files and assembles the MetaModel.', 'src/core/services/dataLoader.ts', 'EmbeddedDataLoader', [], []),
  ],

  api: [
    e('openapi-document', 'openapidocument', 'DR CLI API', 'The OpenAPI 3.0 document describing the CLI server surface.', null, null, [{ p: 'aggregates', t: 'get-model' }, { p: 'aggregates', t: 'post-chat' }], []),
    e('get-model', 'operation', 'GET /api/model', 'Returns the current architecture model as a MetaModel JSON document.', null, null, [{ p: 'returns', t: 'model-response' }], []),
    e('get-health', 'operation', 'GET /health', 'Liveness probe; no authentication required.', null, null, [], []),
    e('get-spec', 'operation', 'GET /api/spec', 'Returns the compiled meta-model spec (node + relationship schemas).', null, null, [], []),
    e('post-chat', 'operation', 'POST /api/chat', 'Streams a DrBot completion with tool invocations over Server-Sent Events.', null, null, [], []),
    e('ws-updates', 'operation', 'WS /ws', 'JSON-RPC 2.0 channel pushing model, changeset, and annotation updates.', null, null, [], []),
    e('list-changesets', 'operation', 'GET /api/changesets', 'Lists staged changesets with metadata.', null, null, [], []),
    e('model-response', 'response', 'ModelResponse', '200 response body carrying the MetaModel and ModelMetadata.', null, null, [], []),
    e('chat-stream', 'response', 'ChatStream', 'SSE event stream of chat content parts.', null, null, [], []),
    e('bearer-scheme', 'securityscheme', 'Bearer token', 'Optional token-based auth for non-public endpoints.', null, null, [], []),
  ],

  'data-store': [
    e('model-fs', 'database', 'Model filesystem', 'Filesystem-backed store under documentation-robotics/model/ — no database.', null, null, [{ p: 'aggregates', t: 'layer-files' }], []),
    e('changeset-fs', 'database', 'Changeset store', 'Staged changesets under documentation-robotics/changesets/.', null, null, [{ p: 'aggregates', t: 'changeset-files' }], []),
    e('layer-files', 'collection', 'Layer YAML files', 'One directory per layer; one YAML file per element type.', null, null, [], []),
    e('changeset-files', 'collection', 'Changeset files', 'metadata.yaml + changes.yaml per changeset.', null, null, [], []),
    e('manifest-file', 'collection', 'manifest.yaml', 'Orchestrates layer paths, ordering, and element counts.', null, null, [], []),
    e('annotation-store', 'collection', 'Annotations', 'Per-element annotation threads.', null, null, [], []),
    e('spec-cache', 'collection', 'Spec cache', 'Compiled spec dist (.dr/spec/*.json) consumed by the viewer.', null, null, [], []),
  ],

  ux: [
    e('ux-application', 'uxapplication', 'Viewer app', 'The embedded viewer shell: header, tabs, sub-tabs, and the DrBot console.', null, null, [{ p: 'aggregates', t: 'spec-view' }, { p: 'aggregates', t: 'model-view' }], []),
    e('model-view', 'view', 'Model view', 'Graph + details of a concrete instance model.', null, null, [{ p: 'aggregates', t: 'graph-canvas-view' }, { p: 'aggregates', t: 'inspector-view' }], []),
    e('spec-view', 'view', 'Spec view', 'Graph + details of the meta-model spec.', null, null, [], []),
    e('changeset-view', 'view', 'Changeset view', 'List + diff of staged changes.', null, null, [], []),
    e('graph-canvas-view', 'subview', 'Graph canvas', 'Pan/zoom node graph for the active layer.', null, null, [], []),
    e('inspector-view', 'subview', 'Inspector', 'Selected-element detail with cross-layer references.', null, null, [], []),
    e('layer-tree', 'librarycomponent', 'Layer tree', 'Left rail listing layers → element types → elements.', null, null, [], []),
    e('drbot-console', 'librarycomponent', 'DrBot console', 'Context-aware chat drawer scoped to the selection.', null, null, [], []),
    e('node-card', 'librarycomponent', 'Node card', 'Graph node showing type swatch, label, and relationship badge.', null, null, [], []),
    e('filter-bar', 'librarycomponent', 'Filter bar', 'Layer and relationship-type filters above the canvas.', null, null, [], []),
  ],

  navigation: [
    e('nav-graph', 'navigationgraph', 'Viewer routes', 'TanStack Router route graph for the embedded app.', null, null, [{ p: 'aggregates', t: 'route-spec' }, { p: 'aggregates', t: 'route-model' }], []),
    e('route-spec', 'route', '/spec', 'Spec viewer route with graph/details sub-routes.', null, null, [{ p: 'flows-to', t: 'route-model' }], []),
    e('route-model', 'route', '/model', 'Model viewer route with graph/details sub-routes.', null, null, [{ p: 'flows-to', t: 'route-changesets' }], []),
    e('route-changesets', 'route', '/changesets', 'Changeset list + graph route.', null, null, [], []),
    e('route-graph', 'route', '/:tab/graph', 'Graph sub-route shared by spec and model.', null, null, [], []),
    e('route-details', 'route', '/:tab/details', 'Details sub-route shared by spec and model.', null, null, [], []),
    e('main-flow', 'navigationflow', 'Explore flow', 'Spec → Model → Changesets primary traversal.', null, null, [], []),
    e('select-transition', 'navigationtransition', 'Select element', 'Selecting a node opens the inspector and scopes DrBot.', null, null, [], []),
  ],

  security: [
    e('annotation-store', 'secureresource', 'Annotation store', 'Per-element annotations; access gated by reviewer role.', null, null, [], []),
    e('model-api', 'secureresource', 'Model API', 'Read access to the model; optional bearer auth.', null, null, [], []),
    e('reviewer-role-sec', 'role', 'Reviewer', 'Can annotate and request changes.', null, null, [], []),
    e('architect-role-sec', 'role', 'Architect', 'Can commit changesets.', null, null, [], []),
    e('token-auth', 'authenticationconfig', 'Token auth', 'Optional token-based authentication on the CLI server.', null, null, [], []),
    e('read-model-perm', 'permission', 'read:model', 'Read the architecture model.', null, null, [], []),
    e('write-changeset-perm', 'permission', 'write:changeset', 'Stage and commit changesets.', null, null, [], []),
    e('public-class', 'dataclassification', 'Public', 'Model data is non-secret architecture metadata.', null, null, [], []),
  ],

  technology: [
    e('cli-server', 'systemsoftware', 'DR CLI server', 'Node.js Express server: model loading, REST, WebSocket, file watching.', null, null, [{ p: 'serving', t: 'node-runtime' }], []),
    e('vite', 'systemsoftware', 'Vite 6', 'Dev server and build tool for the embedded viewer.', null, null, [], []),
    e('react-19', 'systemsoftware', 'React 19', 'UI runtime for the viewer.', null, null, [], []),
    e('node-runtime', 'node', 'Node.js 18+', 'Runtime hosting the CLI server.', null, null, [], []),
    e('browser', 'node', 'Browser', 'Hosts the embedded viewer SPA.', null, null, [], []),
    e('ws-path', 'path', 'WebSocket /ws', 'Bidirectional JSON-RPC channel between browser and server.', null, null, [], []),
    e('rest-path', 'path', 'HTTP /api', 'Request/response channel for model + spec.', null, null, [], []),
    e('viewer-artifact', 'artifact', 'dist/embedded', 'Built SPA bundle served by the CLI.', null, null, [], []),
  ],

  apm: [
    e('otel-resource', 'resource', 'Viewer service', 'OpenTelemetry resource describing the viewer process.', null, null, [{ p: 'aggregates', t: 'load-metric' }], []),
    e('load-metric', 'metricinstrument', 'model.load.ms', 'Histogram of model load latency.', null, null, [], []),
    e('ws-metric', 'metricinstrument', 'ws.reconnects', 'Counter of WebSocket reconnect attempts.', null, null, [], []),
    e('render-metric', 'metricinstrument', 'graph.render.ms', 'Histogram of graph render time per layer.', null, null, [], []),
    e('ref-metric', 'metricinstrument', 'refs.unresolved', 'Gauge of unresolved cross-layer references.', null, null, [], []),
    e('drift-alert', 'alert', 'Drift detected', 'Fires when extracted provenance diverges from source.', null, null, [], []),
    e('ref-alert', 'alert', 'Unresolved refs', 'Fires when unresolved references exceed threshold.', null, null, [], []),
    e('otel-scope', 'instrumentationscope', 'viewer.telemetry', 'Instrumentation scope for the embedded app.', null, null, [], []),
  ],

  testing: [
    e('coverage-model', 'testcoveragemodel', 'Coverage model', 'Aggregate test coverage across layers and element types.', null, null, [{ p: 'aggregates', t: 'graph-target' }], []),
    e('graph-target', 'testcoveragetarget', 'Graph rendering', 'Target: every layer renders without console errors.', null, null, [], []),
    e('refs-target', 'testcoveragetarget', 'Reference integrity', 'Target: all cross-layer references resolve.', null, null, [], []),
    e('chat-target', 'testcoveragetarget', 'Chat streaming', 'Target: DrBot streams tool invocations correctly.', null, null, [], []),
    e('a11y-req', 'coveragerequirement', 'WCAG AA', 'Requirement: AA contrast + keyboard nav on all surfaces.', null, null, [], []),
    e('e2e-req', 'coveragerequirement', 'E2E flows', 'Requirement: Playwright covers spec/model/changeset flows.', null, null, [], []),
    e('refs-gap', 'coveragegap', 'Live-update gap', 'Gap: WebSocket reconnection storms are under-tested.', null, null, [], []),
    e('summary', 'coveragesummary', 'Coverage summary', '1197 unit + integration + E2E tests at last run.', null, null, [], []),
  ],
};

/* ---- SPEC: meta-model node types + relationship schemas -------------------
   The data-model layer is verbatim from spec/dist/data-model.json (v0.8.4). */
export const SPEC = {
  'data-model': {
    nodeTypes: [
      { id: 'objectschema', title: 'ObjectSchema', desc: 'Defines validation rules for JSON object instances, specifying named properties, required fields, and constraints on additional or dynamically named properties.', attrs: [ ['type', 'string', true], ['properties', 'object', false], ['required', 'string[]', false], ['additionalProperties', 'string', false], ['minProperties', 'integer', false] ] },
      { id: 'jsonschema', title: 'JSONSchema', desc: 'The root JSON Schema document, identified by $schema (dialect URI) and $id (base URI for $ref resolution), containing type constraints, annotations, and reusable definitions.', attrs: [ ['$schema', 'string', true], ['$id', 'string', true], ['type', 'enum', true], ['definitions', 'object', false] ] },
      { id: 'schemaproperty', title: 'SchemaProperty', desc: 'Defines a single property within a schema, including its type, constraints, validation rules, and documentation. The fundamental building block of data-model structure.', attrs: [ ['type', 'enum', true], ['title', 'string', false], ['format', 'string', false], ['$ref', 'string', false] ] },
      { id: 'schemadefinition', title: 'SchemaDefinition', desc: 'A reusable JSON Schema definition declared under "definitions" and referenced via $ref. Enables DRY schema design and consistent types across entities.', attrs: [ ['title', 'string', true], ['type', 'enum', true], ['format', 'string', false], ['enum', 'string[]', false] ] },
      { id: 'stringschema', title: 'StringSchema', desc: 'Validation rules for JSON string instances: length bounds, regex patterns, and semantic format hints (date-time, email, uri, uuid).', attrs: [ ['type', 'const', false], ['minLength', 'integer', false], ['maxLength', 'integer', false], ['pattern', 'string', false], ['format', 'enum', false] ] },
      { id: 'numericschema', title: 'NumericSchema', desc: 'Validation rules for JSON numeric instances (number or integer), including inclusive/exclusive bounds and divisibility constraints.', attrs: [ ['type', 'enum', true], ['minimum', 'number', false], ['maximum', 'number', false], ['multipleOf', 'number', false] ] },
      { id: 'arrayschema', title: 'ArraySchema', desc: 'Validation rules for JSON array instances, constraining item schemas, cardinality bounds (minItems/maxItems), uniqueness, and contains-subschema matching.', attrs: [ ['type', 'array', false], ['items', 'string', false], ['minItems', 'integer', false], ['uniqueItems', 'boolean', false] ] },
      { id: 'schemacomposition', title: 'SchemaComposition', desc: 'Combines multiple schemas using boolean logic. allOf requires all; anyOf at least one; oneOf exactly one; not inverts the subschema.', attrs: [ ['allOf', 'string[]', false], ['anyOf', 'string[]', false], ['oneOf', 'string[]', false], ['not', 'string', false] ] },
      { id: 'reference', title: 'Reference', desc: 'A JSON Schema $ref pointer that references another schema by URI or JSON Pointer fragment, enabling reuse without duplication.', attrs: [ ['$ref', 'string', false] ] },
    ],
    // [source, predicate, dest, destLayer, cardinality, strength, required]
    rels: [
      ['jsonschema', 'aggregates', 'objectschema', 'data-model', 'many-to-many', 'medium', false],
      ['jsonschema', 'aggregates', 'arrayschema', 'data-model', 'many-to-many', 'medium', false],
      ['jsonschema', 'aggregates', 'schemacomposition', 'data-model', 'many-to-many', 'medium', false],
      ['jsonschema', 'aggregates', 'schemadefinition', 'data-model', 'many-to-many', 'medium', false],
      ['objectschema', 'aggregates', 'schemaproperty', 'data-model', 'many-to-many', 'medium', false],
      ['objectschema', 'extends', 'objectschema', 'data-model', 'many-to-many', 'medium', false],
      ['schemacomposition', 'composes', 'objectschema', 'data-model', 'many-to-many', 'medium', false],
      ['schemadefinition', 'composes', 'schemadefinition', 'data-model', 'many-to-many', 'high', false],
      ['schemadefinition', 'specializes', 'schemadefinition', 'data-model', 'many-to-many', 'medium', false],
      ['reference', 'references', 'schemadefinition', 'data-model', 'many-to-many', 'medium', false],
      ['schemaproperty', 'references', 'objectschema', 'data-model', 'many-to-many', 'medium', false],
      ['schemaproperty', 'references', 'stringschema', 'data-model', 'many-to-many', 'medium', false],
      // cross-layer
      ['objectschema', 'realizes', 'businessobject', 'business', 'many-to-many', 'medium', false],
      ['objectschema', 'maps-to', 'response', 'api', 'many-to-many', 'medium', false],
      ['objectschema', 'maps-to', 'requestbody', 'api', 'many-to-many', 'medium', false],
      ['objectschema', 'satisfies', 'requirement', 'motivation', 'many-to-many', 'medium', false],
      ['objectschema', 'references', 'secureresource', 'security', 'many-to-many', 'medium', false],
      ['objectschema', 'depends-on', 'systemsoftware', 'technology', 'many-to-many', 'medium', false],
      ['jsonschema', 'realizes', 'goal', 'motivation', 'many-to-many', 'medium', false],
      ['jsonschema', 'serves', 'businessservice', 'business', 'many-to-many', 'medium', false],
      ['schemadefinition', 'maps-to', 'collection', 'data-store', 'many-to-many', 'medium', false],
      ['schemadefinition', 'serves', 'operation', 'api', 'many-to-many', 'medium', false],
      ['schemadefinition', 'satisfies', 'dataclassification', 'security', 'many-to-many', 'medium', false],
      ['schemaproperty', 'maps-to', 'parameter', 'api', 'many-to-many', 'medium', false],
    ],
  },
};

/* ---- CHANGESETS: staged edits (from documentation-robotics/changesets) ---- */
export const CHANGESETS = [
  {
    id: 'changeset-1778408430107-w0rwjqryb', name: 'add-apm-observability-layer', author: 'architect', created: '2026-05-10 10:21', status: 'staged',
    summary: 'Introduce the APM layer with OpenTelemetry resources, metric instruments, and drift alerts.',
    stats: { add: 11, mod: 3, del: 0 },
    changes: [
      { op: 'add', kind: 'resource', path: 'apm.resource.viewer-service', detail: 'New OTel resource describing the viewer process' },
      { op: 'add', kind: 'metricinstrument', path: 'apm.metricinstrument.model-load-ms', detail: 'Histogram model.load.ms' },
      { op: 'add', kind: 'metricinstrument', path: 'apm.metricinstrument.refs-unresolved', detail: 'Gauge refs.unresolved' },
      { op: 'add', kind: 'alert', path: 'apm.alert.drift-detected', detail: 'Fires on provenance drift' },
      { op: 'mod', kind: 'applicationservice', path: 'application.applicationservice.drbot-service', detail: 'Wired telemetry emission' },
    ],
  },
  {
    id: 'changeset-1774347422235-u6kjdza1t', name: 'fix-model-attributes-required-fields', author: 'architect', created: '2026-03-21 14:30', status: 'committed',
    summary: 'Mark required attributes on objectschema elements and resolve two dangling references.',
    stats: { add: 0, mod: 9, del: 1 },
    changes: [
      { op: 'mod', kind: 'objectschema', path: 'data-model.objectschema.model-element', detail: 'required: [id, type, name]' },
      { op: 'mod', kind: 'objectschema', path: 'data-model.objectschema.relationship', detail: 'required: [source, target, predicate]' },
      { op: 'del', kind: 'reference', path: 'data-model.objectschema.legacy-node', detail: 'Removed orphaned reference' },
    ],
  },
  {
    id: 'changeset-1774343148574-9pdmbabnz', name: 'extend-chat-content-parts', author: 'reviewer', created: '2026-03-21 09:05', status: 'committed',
    summary: 'Add thinking + usage content parts to ChatMessage and map to the streaming API.',
    stats: { add: 2, mod: 4, del: 0 },
    changes: [
      { op: 'add', kind: 'objectschema', path: 'data-model.objectschema.tool-invocation-content', detail: 'Tool invocation content part' },
      { op: 'mod', kind: 'objectschema', path: 'data-model.objectschema.chat-message', detail: 'Added thinking + usage parts' },
      { op: 'mod', kind: 'operation', path: 'api.operation.post-chat', detail: 'Stream maps to new parts' },
    ],
  },
  {
    id: 'changeset-1774309821523-1gs13ct6s', name: 'seed-self-reflective-model', author: 'architect', created: '2026-03-20 23:50', status: 'committed',
    summary: 'Seed the data-model layer from src/core/types via extraction.',
    stats: { add: 31, mod: 0, del: 0 },
    changes: [
      { op: 'add', kind: 'objectschema', path: 'data-model.objectschema.meta-model', detail: 'Extracted from MetaModel' },
      { op: 'add', kind: 'objectschema', path: 'data-model.objectschema.layer', detail: 'Extracted from Layer' },
      { op: 'add', kind: 'objectschema', path: 'data-model.objectschema.model-element', detail: 'Extracted from ModelElement' },
    ],
  },
];

/* ---- DrBot scripted, context-aware conversation --------------------------- */
export const CHAT = {
  suggestions: [
    'What does this element do?',
    'Show cross-layer references',
    'Any unresolved references?',
    'Explain the data-model layer',
  ],
  // Generic responses keyed by intent; {el} / {layer} filled at runtime.
  intents: {
    explainElement: (el, layer) => ({
      thinking: `Resolving ${el.id} in the ${layer.name} layer and reading its provenance + relationships.`,
      tool: { name: 'model.getElement', status: 'success', output: [ { key: 'id', value: `${layer.id}.${el.type}.${el.id}` }, { key: 'type', value: el.type }, { key: 'refs', value: `${el.rels.length} intra · ${el.xrefs.length} cross-layer` } ] },
      body: `**${el.name}** is a \`${el.type}\` in the ${layer.name} layer.\n\n${el.desc}${el.src ? `\n\nExtracted from \`${el.src.symbol}\` in \`${el.src.file}\`.` : ''}`,
    }),
    crossLayer: (el, layer) => ({
      thinking: `Walking outgoing cross-layer references from ${el.id}. References flow higher → lower only.`,
      tool: { name: 'refs.resolve', status: 'success', output: el.xrefs.length ? el.xrefs.map(x => ({ key: x.p, value: `→ ${x.l}.${x.t}` })) : [{ value: 'none' }] },
      body: el.xrefs.length
        ? `**${el.name}** has ${el.xrefs.length} cross-layer reference${el.xrefs.length > 1 ? 's' : ''}:\n\n${el.xrefs.map(x => `- \`${x.p}\` → **${x.l}** · \`${x.t}\``).join('\n')}\n\nAll resolve and respect the higher → lower direction rule.`
        : `**${el.name}** has no cross-layer references — it is a leaf within the ${layer.name} layer.`,
    }),
    unresolved: () => ({
      thinking: 'Scanning the reference registry across all 12 layers for dangling targets.',
      tool: { name: 'validate.references', status: 'success', output: [ { key: 'checked', value: '1,566 refs' }, { key: 'unresolved', value: '0' }, { key: 'direction', value: 'ok' } ] },
      body: 'All **1,566** cross-layer references resolve. No dangling targets, and every reference flows higher → lower. The model is internally consistent.',
    }),
    explainLayer: (layer) => ({
      thinking: `Summarizing the ${layer.name} layer: node types, element count, and standard alignment.`,
      tool: { name: 'spec.getLayer', status: 'success', output: [ { key: 'layer', value: layer.id }, { key: 'node types', value: String(layer.types) }, { key: 'relationships', value: String(layer.rels) }, { key: 'standard', value: layer.std } ] },
      body: `The **${layer.name}** layer (layer ${layer.num} of 12) is aligned to **${layer.std}**. It defines **${layer.types}** node types and **${layer.rels}** valid relationship schemas, and currently holds **${layer.elements}** elements in this model.`,
    }),
    fallback: (el, layer) => ({
      thinking: `Interpreting the question against the ${layer.name} layer${el ? ` and ${el.name}` : ''}.`,
      tool: null,
      body: el
        ? `I can explain **${el.name}**, list its cross-layer references, or check reference integrity. Try one of the suggestions below.`
        : `Select an element in the graph and I'll explain it, trace its references, or validate the model. You can also ask about any of the 12 layers.`,
    }),
  },
};

export const DATA = { LAYERS, MODEL, SPEC, CHANGESETS, CHAT };
export default DATA;
