# Data Model

[← Back to README](../README.md)

Data entities, relationships, and data structure definitions.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 23    |
| Intra-Layer Relationships | 14    |
| Inter-Layer Relationships | 16    |
| Inbound Relationships     | 0     |
| Outbound Relationships    | 16    |

**Cross-Layer References**:

- **Downstream layers**: [Business](./02-business-layer-report.md), [Motivation](./01-motivation-layer-report.md), [Security](./04-security-layer-report.md), [Technology](./06-technology-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph data_model
    data_model_objectschema_annotation["Annotation"]
    data_model_objectschema_annotation_create["AnnotationCreate"]
    data_model_objectschema_chat_conversation["ChatConversation"]
    data_model_objectschema_chat_message["ChatMessage"]
    data_model_objectschema_extracted_reference["ExtractedReference"]
    data_model_objectschema_json_rpc_request["JsonRpcRequest"]
    data_model_objectschema_layer["Layer"]
    data_model_objectschema_meta_model["MetaModel"]
    data_model_objectschema_model_element["ModelElement"]
    data_model_objectschema_model_metadata["ModelMetadata"]
    data_model_objectschema_predicate_definition["PredicateDefinition"]
    data_model_objectschema_reference["Reference"]
    data_model_objectschema_relationship["Relationship"]
    data_model_objectschema_relationship_type["RelationshipType"]
    data_model_objectschema_source_reference["SourceReference"]
    data_model_objectschema_spec_layer_data["SpecLayerData"]
    data_model_objectschema_spec_node_relationship["SpecNodeRelationship"]
    data_model_objectschema_tool_invocation_content["ToolInvocationContent"]
    data_model_objectschema_web_socket_event_map["WebSocketEventMap"]
    data_model_objectschema_web_socket_message["WebSocketMessage"]
    data_model_schemadefinition_annotation_id["AnnotationId"]
    data_model_schemadefinition_changeset_id["ChangesetId"]
    data_model_schemadefinition_element_id["ElementId"]
    data_model_objectschema_annotation_create -->|extends| data_model_objectschema_annotation
    data_model_objectschema_chat_conversation -->|extends| data_model_objectschema_chat_message
    data_model_objectschema_meta_model -->|extends| data_model_objectschema_layer
    data_model_objectschema_model_element -->|extends| data_model_objectschema_relationship
    data_model_objectschema_predicate_definition -->|extends| data_model_objectschema_relationship
    data_model_objectschema_relationship_type -->|extends| data_model_objectschema_relationship
    data_model_objectschema_source_reference -->|extends| data_model_objectschema_model_element
    data_model_objectschema_spec_layer_data -->|extends| data_model_objectschema_spec_node_relationship
    data_model_objectschema_tool_invocation_content -->|extends| data_model_objectschema_chat_message
    data_model_objectschema_web_socket_event_map -->|extends| data_model_objectschema_web_socket_message
    data_model_objectschema_web_socket_message -->|extends| data_model_objectschema_json_rpc_request
    data_model_schemadefinition_annotation_id -->|specializes| data_model_schemadefinition_changeset_id
    data_model_schemadefinition_element_id -->|composes| data_model_schemadefinition_annotation_id
    data_model_schemadefinition_element_id -->|specializes| data_model_schemadefinition_annotation_id
  end
```

## Inter-Layer Dependencies

```mermaid
flowchart TB
  classDef current fill:#f9f,stroke:#333,stroke-width:2px
  motivation["Motivation"]
  business["Business"]
  product["Product"]
  security["Security"]
  application["Application"]
  technology["Technology"]
  api["API"]
  data_model["Data Model"]
  data_store["Data Store"]
  ux["UX"]
  navigation["Navigation"]
  apm["APM"]
  testing["Testing"]
  data_model --> business
  data_model --> motivation
  data_model --> security
  data_model --> technology
  class data_model current
```

## Inter-Layer Relationships Table

| Relationship ID                                                                        | Source Node                                   | Dest Node                                       | Dest Layer   | Predicate    | Cardinality  | Strength |
| -------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------- | ------------ | ------------ | ------------ | -------- |
| `0e1d8c49-81ae-41e3-9453-1e989bbffb26-references-7c85d8fc-3635-45fa-a83c-36f184763cab` | `0e1d8c49-81ae-41e3-9453-1e989bbffb26`        | `7c85d8fc-3635-45fa-a83c-36f184763cab`          | `business`   | `references` | unknown      | unknown  |
| `389d0672-e5c3-4d4e-acc9-227e8f5521f7-references-c20e00b6-ef86-415a-92a3-3e9fd9dc7cd6` | `389d0672-e5c3-4d4e-acc9-227e8f5521f7`        | `c20e00b6-ef86-415a-92a3-3e9fd9dc7cd6`          | `business`   | `references` | unknown      | unknown  |
| `3ce0eb35-ba57-4f87-8b0b-ba127cac026a-references-7c85d8fc-3635-45fa-a83c-36f184763cab` | `3ce0eb35-ba57-4f87-8b0b-ba127cac026a`        | `7c85d8fc-3635-45fa-a83c-36f184763cab`          | `business`   | `references` | unknown      | unknown  |
| `57b0c4b1-46b4-49bc-993d-bf7b6cecf206-realizes-ffa6bf4a-5281-402f-90d8-a895173fc4ba`   | `57b0c4b1-46b4-49bc-993d-bf7b6cecf206`        | `ffa6bf4a-5281-402f-90d8-a895173fc4ba`          | `business`   | `realizes`   | unknown      | unknown  |
| `582fd707-9e0d-4a98-9b47-b3cda7b26c3d-realizes-ea84399d-45dc-4fef-a5a1-759c9b5b5870`   | `582fd707-9e0d-4a98-9b47-b3cda7b26c3d`        | `ea84399d-45dc-4fef-a5a1-759c9b5b5870`          | `business`   | `realizes`   | unknown      | unknown  |
| `801c2caa-ec19-4175-bec8-970067823754-satisfies-0fa2ddb9-02df-426f-9c9c-89b857b9dc78`  | `801c2caa-ec19-4175-bec8-970067823754`        | `0fa2ddb9-02df-426f-9c9c-89b857b9dc78`          | `security`   | `satisfies`  | unknown      | unknown  |
| `a0080aee-7e84-4c2c-8d76-0cd604bfd7f5-realizes-ea84399d-45dc-4fef-a5a1-759c9b5b5870`   | `a0080aee-7e84-4c2c-8d76-0cd604bfd7f5`        | `ea84399d-45dc-4fef-a5a1-759c9b5b5870`          | `business`   | `realizes`   | unknown      | unknown  |
| `cfe8d725-4f64-4eae-b2fa-825e4a774a3a-realizes-ffa6bf4a-5281-402f-90d8-a895173fc4ba`   | `cfe8d725-4f64-4eae-b2fa-825e4a774a3a`        | `ffa6bf4a-5281-402f-90d8-a895173fc4ba`          | `business`   | `realizes`   | unknown      | unknown  |
| `cfe8d725-4f64-4eae-b2fa-825e4a774a3a-references-8b70a28c-08e2-414c-b641-95335ac2a463` | `cfe8d725-4f64-4eae-b2fa-825e4a774a3a`        | `8b70a28c-08e2-414c-b641-95335ac2a463`          | `business`   | `references` | unknown      | unknown  |
| `data-model.objectschema.realizes.business.businessobject`                             | `data-model.objectschema.extracted-reference` | `business.businessobject.architecture-model`    | `business`   | `realizes`   | many-to-many | medium   |
| `data-model.objectschema.realizes.business.businessobject`                             | `data-model.objectschema.model-metadata`      | `business.businessobject.architecture-model`    | `business`   | `realizes`   | many-to-many | medium   |
| `data-model.objectschema.realizes.business.businessobject`                             | `data-model.objectschema.reference`           | `business.businessobject.architecture-model`    | `business`   | `realizes`   | many-to-many | medium   |
| `data-model.schemadefinition.satisfies.motivation.constraint`                          | `data-model.schemadefinition.annotation-id`   | `motivation.constraint.type-script-strict-mode` | `motivation` | `satisfies`  | many-to-many | medium   |
| `data-model.schemadefinition.depends-on.technology.systemsoftware`                     | `data-model.schemadefinition.changeset-id`    | `technology.systemsoftware.type-script-59`      | `technology` | `depends-on` | many-to-many | medium   |
| `data-model.schemadefinition.satisfies.motivation.constraint`                          | `data-model.schemadefinition.changeset-id`    | `motivation.constraint.type-script-strict-mode` | `motivation` | `satisfies`  | many-to-many | medium   |
| `data-model.schemadefinition.satisfies.motivation.constraint`                          | `data-model.schemadefinition.element-id`      | `motivation.constraint.type-script-strict-mode` | `motivation` | `satisfies`  | many-to-many | medium   |

## Element Reference

### Annotation {#annotation}

**ID**: `data-model.objectschema.annotation`

**Type**: `objectschema`

User annotation attached to a specific architecture model element; includes author, markdown content, resolution state, and an optional thread of replies.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                             | Predicate | Direction |
| ----------- | ------------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.annotation-create` | `extends` | inbound   |

### AnnotationCreate {#annotationcreate}

**ID**: `data-model.objectschema.annotation-create`

**Type**: `objectschema`

Request payload for creating a new annotation; requires target elementId and content text.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                      | Predicate | Direction |
| ----------- | ------------------------------------ | --------- | --------- |
| intra-layer | `data-model.objectschema.annotation` | `extends` | outbound  |

### ChatConversation {#chatconversation}

**ID**: `data-model.objectschema.chat-conversation`

**Type**: `objectschema`

Chat conversation grouping metadata; holds conversation ID, title, creation/update timestamps, and message count.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                        | Predicate | Direction |
| ----------- | -------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.chat-message` | `extends` | outbound  |

### ChatMessage {#chatmessage}

**ID**: `data-model.objectschema.chat-message`

**Type**: `objectschema`

Multi-part chat conversation message; contains a role (user/assistant/system), ordered content parts (text, tool invocations, thinking, usage, errors), and streaming state.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                                   | Predicate | Direction |
| ----------- | ------------------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.chat-conversation`       | `extends` | inbound   |
| intra-layer | `data-model.objectschema.tool-invocation-content` | `extends` | inbound   |

### ExtractedReference {#extractedreference}

**ID**: `data-model.objectschema.extracted-reference`

**Type**: `objectschema`

Raw reference metadata captured during YAML parsing before cross-layer resolution; stores property name, reference type, and target identifier or UUID.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                              | Predicate  | Direction |
| ----------- | -------------------------------------------- | ---------- | --------- |
| inter-layer | `business.businessobject.architecture-model` | `realizes` | outbound  |

### JsonRpcRequest {#jsonrpcrequest}

**ID**: `data-model.objectschema.json-rpc-request`

**Type**: `objectschema`

JSON-RPC 2.0 request envelope used for all chat WebSocket messages; carries jsonrpc version string, method name, typed params, and request ID for correlation.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                              | Predicate | Direction |
| ----------- | -------------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.web-socket-message` | `extends` | inbound   |

### Layer {#layer}

**ID**: `data-model.objectschema.layer`

**Type**: `objectschema`

Individual architecture layer within the MetaModel; contains a flat list of elements, intra-layer relationships, and visual configuration.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                      | Predicate | Direction |
| ----------- | ------------------------------------ | --------- | --------- |
| intra-layer | `data-model.objectschema.meta-model` | `extends` | inbound   |

### MetaModel {#metamodel}

**ID**: `data-model.objectschema.meta-model`

**Type**: `objectschema`

Root container for the loaded architecture model; holds all layers, cross-layer references, and metadata. Loaded from DR CLI REST API response and stored in modelStore.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                 | Predicate | Direction |
| ----------- | ------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.layer` | `extends` | outbound  |

### ModelElement {#modelelement}

**ID**: `data-model.objectschema.model-element`

**Type**: `objectschema`

Base element interface for all architecture layer elements; holds the element ID (dot-notation), type, name, properties, visual positioning, and intra-layer relationship references.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                            | Predicate | Direction |
| ----------- | ------------------------------------------ | --------- | --------- |
| intra-layer | `data-model.objectschema.relationship`     | `extends` | outbound  |
| intra-layer | `data-model.objectschema.source-reference` | `extends` | inbound   |

### ModelMetadata {#modelmetadata}

**ID**: `data-model.objectschema.model-metadata`

**Type**: `objectschema`

Metadata bag attached to the MetaModel root; includes author, timestamps, parse errors, element/layer counts, and cross-layer reference statistics.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                              | Predicate  | Direction |
| ----------- | -------------------------------------------- | ---------- | --------- |
| inter-layer | `business.businessobject.architecture-model` | `realizes` | outbound  |

### PredicateDefinition {#predicatedefinition}

**ID**: `data-model.objectschema.predicate-definition`

**Type**: `objectschema`

Full predicate metadata from the v0.8.3 predicate catalog; carries predicate name, inverse name, category, description, optional ArchiMate alignment, semantic properties (directionality/transitivity/symmetry/reflexivity), default strength, and fieldPaths for dynamic reference discovery

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                        | Predicate | Direction |
| ----------- | -------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.relationship` | `extends` | outbound  |

### Reference {#reference}

**ID**: `data-model.objectschema.reference`

**Type**: `objectschema`

Cross-layer reference connecting an element in one architecture layer to an element in another; carries source/target layer IDs, element IDs, and validation status.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                              | Predicate  | Direction |
| ----------- | -------------------------------------------- | ---------- | --------- |
| inter-layer | `business.businessobject.architecture-model` | `realizes` | outbound  |

### Relationship {#relationship}

**ID**: `data-model.objectschema.relationship`

**Type**: `objectschema`

Typed relationship between two elements within the same layer; supports 15 ArchiMate and custom relationship types (composition, aggregation, realization, serving, access, data-flow, etc.).

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                                | Predicate | Direction |
| ----------- | ---------------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.model-element`        | `extends` | inbound   |
| intra-layer | `data-model.objectschema.predicate-definition` | `extends` | inbound   |
| intra-layer | `data-model.objectschema.relationship-type`    | `extends` | inbound   |

### RelationshipType {#relationshiptype}

**ID**: `data-model.objectschema.relationship-type`

**Type**: `objectschema`

TypeScript enum providing dot-notation access to the full v0.8.3 predicate catalog; covers motivation, business, structural, process, data, API, testing, security, and UI/navigation predicates; kept for backwards compatibility alongside the RelationshipTypeValue union type

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                        | Predicate | Direction |
| ----------- | -------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.relationship` | `extends` | outbound  |

### SourceReference {#sourcereference}

**ID**: `data-model.objectschema.source-reference`

**Type**: `objectschema`

Tracks where a model element was extracted from; holds provenance type (extracted/manual/inferred/generated), a list of SourceLocation entries (file + optional symbol), and optional repository context (URL + commit SHA)

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                         | Predicate | Direction |
| ----------- | --------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.model-element` | `extends` | outbound  |

### SpecLayerData {#speclayerdata}

**ID**: `data-model.objectschema.spec-layer-data`

**Type**: `objectschema`

Structured spec data for a single architecture layer loaded from .dr/spec/\*.json; contains layer metadata (id, number, name, description), a map of node type name to JSON schema, and an array of SpecNodeRelationship entries

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                                  | Predicate | Direction |
| ----------- | ------------------------------------------------ | --------- | --------- |
| intra-layer | `data-model.objectschema.spec-node-relationship` | `extends` | outbound  |

### SpecNodeRelationship {#specnoderelationship}

**ID**: `data-model.objectschema.spec-node-relationship`

**Type**: `objectschema`

Valid relationship definition between two spec node types; specifies source and destination spec node IDs and their layers, predicate, cardinality, strength, and whether the relationship is required

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                           | Predicate | Direction |
| ----------- | ----------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.spec-layer-data` | `extends` | inbound   |

### ToolInvocationContent {#toolinvocationcontent}

**ID**: `data-model.objectschema.tool-invocation-content`

**Type**: `objectschema`

Chat content part representing an AI tool invocation; tracks tool name, typed input parameters, and execution status (executing/completed/failed) with result or error.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                        | Predicate | Direction |
| ----------- | -------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.chat-message` | `extends` | outbound  |

### WebSocketEventMap {#websocketeventmap}

**ID**: `data-model.objectschema.web-socket-event-map`

**Type**: `objectschema`

Typed event map for all WebSocket client events: connect, disconnect, message, error, close, reconnecting, rest-mode, max-reconnect-attempts.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                              | Predicate | Direction |
| ----------- | -------------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.web-socket-message` | `extends` | outbound  |

### WebSocketMessage {#websocketmessage}

**ID**: `data-model.objectschema.web-socket-message`

**Type**: `objectschema`

Base WebSocket protocol message with discriminating type string; all real-time server messages extend this interface.

#### Attributes

| Name | Value  |
| ---- | ------ |
| type | object |

#### Relationships

| Type        | Related Element                                | Predicate | Direction |
| ----------- | ---------------------------------------------- | --------- | --------- |
| intra-layer | `data-model.objectschema.web-socket-event-map` | `extends` | inbound   |
| intra-layer | `data-model.objectschema.json-rpc-request`     | `extends` | outbound  |

### AnnotationId {#annotationid}

**ID**: `data-model.schemadefinition.annotation-id`

**Type**: `schemadefinition`

Branded string type for annotation IDs; cannot be assigned from ElementId or ChangesetId at compile time.

#### Attributes

| Name  | Value        |
| ----- | ------------ |
| title | AnnotationId |
| type  | string       |

#### Relationships

| Type        | Related Element                                 | Predicate     | Direction |
| ----------- | ----------------------------------------------- | ------------- | --------- |
| inter-layer | `motivation.constraint.type-script-strict-mode` | `satisfies`   | outbound  |
| intra-layer | `data-model.schemadefinition.changeset-id`      | `specializes` | outbound  |
| intra-layer | `data-model.schemadefinition.element-id`        | `composes`    | inbound   |
| intra-layer | `data-model.schemadefinition.element-id`        | `specializes` | inbound   |

### ChangesetId {#changesetid}

**ID**: `data-model.schemadefinition.changeset-id`

**Type**: `schemadefinition`

Branded string type for changeset IDs; cannot be assigned from ElementId or AnnotationId at compile time.

#### Attributes

| Name  | Value       |
| ----- | ----------- |
| title | ChangesetId |
| type  | string      |

#### Relationships

| Type        | Related Element                                 | Predicate     | Direction |
| ----------- | ----------------------------------------------- | ------------- | --------- |
| inter-layer | `technology.systemsoftware.type-script-59`      | `depends-on`  | outbound  |
| inter-layer | `motivation.constraint.type-script-strict-mode` | `satisfies`   | outbound  |
| intra-layer | `data-model.schemadefinition.annotation-id`     | `specializes` | inbound   |

### ElementId {#elementid}

**ID**: `data-model.schemadefinition.element-id`

**Type**: `schemadefinition`

Branded string type for architecture element IDs (dot-notation format: layer.type.name); prevents accidental mixing with AnnotationId or ChangesetId at compile time.

#### Attributes

| Name  | Value     |
| ----- | --------- |
| title | ElementId |
| type  | string    |

#### Relationships

| Type        | Related Element                                 | Predicate     | Direction |
| ----------- | ----------------------------------------------- | ------------- | --------- |
| inter-layer | `motivation.constraint.type-script-strict-mode` | `satisfies`   | outbound  |
| intra-layer | `data-model.schemadefinition.annotation-id`     | `composes`    | outbound  |
| intra-layer | `data-model.schemadefinition.annotation-id`     | `specializes` | outbound  |

---

Generated: 2026-09-19T15:37:38.405Z | Model Version: 0.1.0
