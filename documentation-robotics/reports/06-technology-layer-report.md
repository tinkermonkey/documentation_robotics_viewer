# Technology

[← Back to README](../README.md)

Infrastructure, platforms, systems, and technology components.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 24    |
| Intra-Layer Relationships | 21    |
| Inter-Layer Relationships | 9     |
| Inbound Relationships     | 2     |
| Outbound Relationships    | 7     |

**Cross-Layer References**:

- **Upstream layers**: [UX](./10-ux-layer-report.md)
- **Downstream layers**: [API](./07-api-layer-report.md), [Application](./05-application-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph technology
    technology_artifact_docker_agent_image["Docker Agent Image"]
    technology_artifact_embedded_app_bundle["Embedded App Bundle"]
    technology_artifact_open_api_specification["OpenAPI Specification"]
    technology_node_docker_agent_container["Docker Agent Container"]
    technology_node_vite_dev_server["Vite Dev Server"]
    technology_path_app_to_dr_cli_https_path["App to DR CLI HTTPS Path"]
    technology_path_app_to_dr_cli_web_socket_path["App to DR CLI WebSocket Path"]
    technology_systemsoftware_heimdall_ui["Heimdall UI"]
    technology_systemsoftware_nodejs["Node.js"]
    technology_systemsoftware_playwright["Playwright"]
    technology_systemsoftware_react_19["React 19"]
    technology_systemsoftware_tailwind_css_v4["Tailwind CSS v4"]
    technology_systemsoftware_tan_stack_react_query["TanStack React Query"]
    technology_systemsoftware_tan_stack_router["TanStack Router"]
    technology_systemsoftware_type_script_59["TypeScript 5.9"]
    technology_systemsoftware_vite_6["Vite 6"]
    technology_systemsoftware_zustand_5["Zustand 5"]
    technology_technologyinterface_rest_https_interface["REST HTTPS Interface"]
    technology_technologyinterface_web_socket_interface["WebSocket Interface"]
    technology_technologyprocess_open_api_type_generation["OpenAPI Type Generation"]
    technology_technologyprocess_playwright_test_execution["Playwright Test Execution"]
    technology_technologyprocess_vite_build_pipeline["Vite Build Pipeline"]
    technology_technologyservice_dr_cli_rest_server["DR CLI REST Server"]
    technology_technologyservice_web_socket_model_service["WebSocket Model Service"]
    technology_artifact_docker_agent_image -->|realizes| technology_systemsoftware_nodejs
    technology_artifact_embedded_app_bundle -->|realizes| technology_systemsoftware_vite_6
    technology_node_docker_agent_container -->|composes| technology_systemsoftware_playwright
    technology_node_docker_agent_container -->|composes| technology_technologyinterface_rest_https_interface
    technology_node_docker_agent_container -->|composes| technology_technologyinterface_web_socket_interface
    technology_path_app_to_dr_cli_https_path -->|connects| technology_node_docker_agent_container
    technology_path_app_to_dr_cli_web_socket_path -->|connects| technology_node_docker_agent_container
    technology_systemsoftware_playwright -->|depends-on| technology_systemsoftware_nodejs
    technology_systemsoftware_react_19 -->|depends-on| technology_systemsoftware_nodejs
    technology_systemsoftware_tan_stack_router -->|depends-on| technology_systemsoftware_react_19
    technology_systemsoftware_type_script_59 -->|depends-on| technology_systemsoftware_nodejs
    technology_systemsoftware_vite_6 -->|depends-on| technology_systemsoftware_nodejs
    technology_systemsoftware_zustand_5 -->|depends-on| technology_systemsoftware_react_19
    technology_technologyinterface_rest_https_interface -->|assigned-to| technology_technologyservice_dr_cli_rest_server
    technology_technologyinterface_rest_https_interface -->|serves| technology_technologyprocess_open_api_type_generation
    technology_technologyinterface_rest_https_interface -->|serves| technology_technologyprocess_vite_build_pipeline
    technology_technologyinterface_web_socket_interface -->|assigned-to| technology_technologyservice_web_socket_model_service
    technology_technologyinterface_web_socket_interface -->|serves| technology_technologyprocess_playwright_test_execution
    technology_technologyprocess_open_api_type_generation -->|accesses| technology_artifact_open_api_specification
    technology_technologyprocess_vite_build_pipeline -->|accesses| technology_artifact_embedded_app_bundle
    technology_technologyprocess_vite_build_pipeline -->|realizes| technology_technologyservice_dr_cli_rest_server
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
  technology --> api
  technology --> application
  ux --> technology
  class technology current
```

## Inter-Layer Relationships Table

| Relationship ID                                                     | Source Node                                       | Dest Node                                                           | Dest Layer    | Predicate    | Cardinality  | Strength |
| ------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- | ------------- | ------------ | ------------ | -------- |
| `technology.node.serves.application.applicationcomponent`           | `technology.node.vite-dev-server`                 | `application.applicationcomponent.app-shell`                        | `application` | `serves`     | many-to-many | medium   |
| `technology.systemsoftware.serves.application.applicationcomponent` | `technology.systemsoftware.heimdall-ui`           | `application.applicationcomponent.app-shell`                        | `application` | `serves`     | many-to-many | medium   |
| `technology.systemsoftware.serves.application.applicationcomponent` | `technology.systemsoftware.heimdall-ui`           | `application.applicationcomponent.changeset-impact-view`            | `application` | `serves`     | many-to-many | medium   |
| `technology.systemsoftware.serves.application.applicationcomponent` | `technology.systemsoftware.heimdall-ui`           | `application.applicationcomponent.graph-canvas`                     | `application` | `serves`     | many-to-many | medium   |
| `technology.systemsoftware.serves.application.applicationcomponent` | `technology.systemsoftware.tailwind-css-v4`       | `application.applicationcomponent.app-shell`                        | `application` | `serves`     | many-to-many | medium   |
| `technology.systemsoftware.serves.application.applicationcomponent` | `technology.systemsoftware.tan-stack-react-query` | `application.applicationcomponent.graph-canvas`                     | `application` | `serves`     | many-to-many | medium   |
| `technology.technologyservice.serves.api.openapidocument`           | `technology.technologyservice.dr-cli-rest-server` | `api.openapidocument.dr-cli-visualization-server-open-api-document` | `api`         | `serves`     | many-to-many | medium   |
| `ux.view.depends-on.technology.systemsoftware`                      | `ux.view.changesets-view`                         | `technology.systemsoftware.heimdall-ui`                             | `technology`  | `depends-on` | many-to-many | medium   |
| `ux.view.depends-on.technology.systemsoftware`                      | `ux.view.model-view`                              | `technology.systemsoftware.heimdall-ui`                             | `technology`  | `depends-on` | many-to-many | medium   |

## Element Reference

### Docker Agent Image {#docker-agent-image}

**ID**: `technology.artifact.docker-agent-image`

**Type**: `artifact`

Docker container image for the Claude Code agent runtime, defined in Dockerfile.agent; used for isolated DR CLI beta testing

#### Attributes

| Name         | Value           |
| ------------ | --------------- |
| artifactType | container-image |

#### Relationships

| Type        | Related Element                    | Predicate  | Direction |
| ----------- | ---------------------------------- | ---------- | --------- |
| intra-layer | `technology.systemsoftware.nodejs` | `realizes` | outbound  |

### Embedded App Bundle {#embedded-app-bundle}

**ID**: `technology.artifact.embedded-app-bundle`

**Type**: `artifact`

Production Vite build output; bundled React application (JS/CSS) packaged as an embeddable archive via package-embedded.cjs script

#### Attributes

| Name         | Value   |
| ------------ | ------- |
| artifactType | archive |

#### Relationships

| Type        | Related Element                                    | Predicate  | Direction |
| ----------- | -------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.systemsoftware.vite-6`                 | `realizes` | outbound  |
| intra-layer | `technology.technologyprocess.vite-build-pipeline` | `accesses` | inbound   |

### OpenAPI Specification {#openapi-specification}

**ID**: `technology.artifact.open-api-specification`

**Type**: `artifact`

OpenAPI 3.0 REST API contract (docs/api-spec.yaml) describing the DR CLI server endpoints; source for TypeScript client generation

#### Attributes

| Name         | Value         |
| ------------ | ------------- |
| artifactType | configuration |

#### Relationships

| Type        | Related Element                                         | Predicate  | Direction |
| ----------- | ------------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyprocess.open-api-type-generation` | `accesses` | inbound   |

### Docker Agent Container {#docker-agent-container}

**ID**: `technology.node.docker-agent-container`

**Type**: `node`

Container runtime node for the Claude Code agent process; defined by Dockerfile.agent, provides isolated execution environment for DR CLI beta test runs

#### Attributes

| Name     | Value     |
| -------- | --------- |
| nodeType | container |

#### Relationships

| Type        | Related Element                                       | Predicate  | Direction |
| ----------- | ----------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.systemsoftware.playwright`                | `composes` | outbound  |
| intra-layer | `technology.technologyinterface.rest-https-interface` | `composes` | outbound  |
| intra-layer | `technology.technologyinterface.web-socket-interface` | `composes` | outbound  |
| intra-layer | `technology.path.app-to-dr-cli-https-path`            | `connects` | inbound   |
| intra-layer | `technology.path.app-to-dr-cli-web-socket-path`       | `connects` | inbound   |

### Vite Dev Server {#vite-dev-server}

**ID**: `technology.node.vite-dev-server`

**Type**: `node`

Development HTTP server node running on port 3001; spawned by Vite with HMR, hosts the embedded app during local development and E2E testing

#### Attributes

| Name     | Value     |
| -------- | --------- |
| nodeType | container |

#### Relationships

| Type        | Related Element                              | Predicate | Direction |
| ----------- | -------------------------------------------- | --------- | --------- |
| inter-layer | `application.applicationcomponent.app-shell` | `serves`  | outbound  |

### App to DR CLI HTTPS Path {#app-to-dr-cli-https-path}

**ID**: `technology.path.app-to-dr-cli-https-path`

**Type**: `path`

HTTPS communication path from browser application to the DR CLI REST server; carries JSON model management requests and responses

#### Attributes

| Name     | Value          |
| -------- | -------------- |
| pathType | point-to-point |
| protocol | https          |

#### Relationships

| Type        | Related Element                          | Predicate  | Direction |
| ----------- | ---------------------------------------- | ---------- | --------- |
| intra-layer | `technology.node.docker-agent-container` | `connects` | outbound  |

### App to DR CLI WebSocket Path {#app-to-dr-cli-websocket-path}

**ID**: `technology.path.app-to-dr-cli-web-socket-path`

**Type**: `path`

Persistent WebSocket path between browser application and DR CLI server; carries JSON-RPC 2.0 real-time model update messages

#### Attributes

| Name     | Value         |
| -------- | ------------- |
| pathType | bidirectional |
| protocol | websocket     |

#### Relationships

| Type        | Related Element                          | Predicate  | Direction |
| ----------- | ---------------------------------------- | ---------- | --------- |
| intra-layer | `technology.node.docker-agent-container` | `connects` | outbound  |

### Heimdall UI {#heimdall-ui}

**ID**: `technology.systemsoftware.heimdall-ui`

**Type**: `systemsoftware`

@tinkermonkey/heimdall-ui — the Heimdall design system, pinned from a git commit; provides the app shell components (PageHeader, GraphCanvas, GraphInspector, ChatContainer, SideBySideDiff, StatTile, etc.) and the real force-directed GraphCanvas layout engine that replaced the old React Flow + custom layout-engine stack in the June 2026 UX rebuild

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                                          | Predicate    | Direction |
| ----------- | -------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationcomponent.app-shell`             | `serves`     | outbound  |
| inter-layer | `application.applicationcomponent.changeset-impact-view` | `serves`     | outbound  |
| inter-layer | `application.applicationcomponent.graph-canvas`          | `serves`     | outbound  |
| inter-layer | `ux.view.changesets-view`                                | `depends-on` | inbound   |
| inter-layer | `ux.view.model-view`                                     | `depends-on` | inbound   |

### Node.js {#node-js}

**ID**: `technology.systemsoftware.nodejs`

**Type**: `systemsoftware`

JavaScript runtime environment powering the build toolchain, dev server, and test execution pipeline

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                            | Predicate    | Direction |
| ----------- | ------------------------------------------ | ------------ | --------- |
| intra-layer | `technology.artifact.docker-agent-image`   | `realizes`   | inbound   |
| intra-layer | `technology.systemsoftware.playwright`     | `depends-on` | inbound   |
| intra-layer | `technology.systemsoftware.react-19`       | `depends-on` | inbound   |
| intra-layer | `technology.systemsoftware.type-script-59` | `depends-on` | inbound   |
| intra-layer | `technology.systemsoftware.vite-6`         | `depends-on` | inbound   |

### Playwright {#playwright}

**ID**: `technology.systemsoftware.playwright`

**Type**: `systemsoftware`

@playwright/test 1.60 — end-to-end browser automation framework; runs the tests/e2e suite (~20 tests) against the built production bundle served by dr visualize, including @axe-core/playwright WCAG 2.1 AA checks on every view in light + dark. No longer used for unit/integration tests or Storybook (both removed in the Heimdall rebuild) — those run under Vitest.

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                          | Predicate    | Direction |
| ----------- | ---------------------------------------- | ------------ | --------- |
| intra-layer | `technology.node.docker-agent-container` | `composes`   | inbound   |
| intra-layer | `technology.systemsoftware.nodejs`       | `depends-on` | outbound  |

### React 19 {#react-19}

**ID**: `technology.systemsoftware.react-19`

**Type**: `systemsoftware`

Core UI rendering framework; component-based architecture with concurrent rendering, used via Vite plugin for JSX transformation

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                              | Predicate    | Direction |
| ----------- | -------------------------------------------- | ------------ | --------- |
| intra-layer | `technology.systemsoftware.nodejs`           | `depends-on` | outbound  |
| intra-layer | `technology.systemsoftware.tan-stack-router` | `depends-on` | inbound   |
| intra-layer | `technology.systemsoftware.zustand-5`        | `depends-on` | inbound   |

### Tailwind CSS v4 {#tailwind-css-v4}

**ID**: `technology.systemsoftware.tailwind-css-v4`

**Type**: `systemsoftware`

Utility-first CSS framework v4 with PostCSS pipeline; all styling via utility classes, dark mode variants required on all components

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                              | Predicate | Direction |
| ----------- | -------------------------------------------- | --------- | --------- |
| inter-layer | `application.applicationcomponent.app-shell` | `serves`  | outbound  |

### TanStack React Query {#tanstack-react-query}

**ID**: `technology.systemsoftware.tan-stack-react-query`

**Type**: `systemsoftware`

@tanstack/react-query 5.51 — data-fetching/caching layer over the DR CLI REST API; powers the data/ hooks (useModel, useSpec, useChangesets, useAnnotations) that replaced the old client-side YAML/JSON-Schema parsing services

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                                 | Predicate | Direction |
| ----------- | ----------------------------------------------- | --------- | --------- |
| inter-layer | `application.applicationcomponent.graph-canvas` | `serves`  | outbound  |

### TanStack Router {#tanstack-router}

**ID**: `technology.systemsoftware.tan-stack-router`

**Type**: `systemsoftware`

@tanstack/react-router 1.139 — fully type-safe file-based client-side router; powers the embedded app route hierarchy

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                      | Predicate    | Direction |
| ----------- | ------------------------------------ | ------------ | --------- |
| intra-layer | `technology.systemsoftware.react-19` | `depends-on` | outbound  |

### TypeScript 5.9 {#typescript-5-9}

**ID**: `technology.systemsoftware.type-script-59`

**Type**: `systemsoftware`

Statically-typed JavaScript superset providing compile-time type safety across all source files, strict mode enabled

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                    | Predicate    | Direction |
| ----------- | ---------------------------------- | ------------ | --------- |
| intra-layer | `technology.systemsoftware.nodejs` | `depends-on` | outbound  |

### Vite 6 {#vite-6}

**ID**: `technology.systemsoftware.vite-6`

**Type**: `systemsoftware`

Next-generation build toolchain and HMR dev server for the React application; handles TypeScript compilation, bundling, and WASM file copying

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `technology.artifact.embedded-app-bundle` | `realizes`   | inbound   |
| intra-layer | `technology.systemsoftware.nodejs`        | `depends-on` | outbound  |

### Zustand 5 {#zustand-5}

**ID**: `technology.systemsoftware.zustand-5`

**Type**: `systemsoftware`

Lightweight Zustand state management library; provides multiple isolated stores (modelStore, layerStore, elementStore, crossLayerStore, etc.) with no Redux/Context coupling

#### Attributes

| Name         | Value      |
| ------------ | ---------- |
| softwareType | middleware |

#### Relationships

| Type        | Related Element                      | Predicate    | Direction |
| ----------- | ------------------------------------ | ------------ | --------- |
| intra-layer | `technology.systemsoftware.react-19` | `depends-on` | outbound  |

### REST HTTPS Interface {#rest-https-interface}

**ID**: `technology.technologyinterface.rest-https-interface`

**Type**: `technologyinterface`

HTTPS interface point exposing DR CLI REST API endpoints to the browser application; typed against the generated OpenAPI client

#### Attributes

| Name     | Value |
| -------- | ----- |
| protocol | https |

#### Relationships

| Type        | Related Element                                         | Predicate     | Direction |
| ----------- | ------------------------------------------------------- | ------------- | --------- |
| intra-layer | `technology.node.docker-agent-container`                | `composes`    | inbound   |
| intra-layer | `technology.technologyservice.dr-cli-rest-server`       | `assigned-to` | outbound  |
| intra-layer | `technology.technologyprocess.open-api-type-generation` | `serves`      | outbound  |
| intra-layer | `technology.technologyprocess.vite-build-pipeline`      | `serves`      | outbound  |

### WebSocket Interface {#websocket-interface}

**ID**: `technology.technologyinterface.web-socket-interface`

**Type**: `technologyinterface`

WebSocket interface providing full-duplex communication channel for real-time JSON-RPC 2.0 model update notifications

#### Attributes

| Name     | Value     |
| -------- | --------- |
| protocol | websocket |

#### Relationships

| Type        | Related Element                                          | Predicate     | Direction |
| ----------- | -------------------------------------------------------- | ------------- | --------- |
| intra-layer | `technology.node.docker-agent-container`                 | `composes`    | inbound   |
| intra-layer | `technology.technologyservice.web-socket-model-service`  | `assigned-to` | outbound  |
| intra-layer | `technology.technologyprocess.playwright-test-execution` | `serves`      | outbound  |

### OpenAPI Type Generation {#openapi-type-generation}

**ID**: `technology.technologyprocess.open-api-type-generation`

**Type**: `technologyprocess`

Code-generation process using openapi-typescript to produce src/core/types/api-client.ts from the OpenAPI spec; enforces client-server type contract at build time

#### Relationships

| Type        | Related Element                                       | Predicate  | Direction |
| ----------- | ----------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyinterface.rest-https-interface` | `serves`   | inbound   |
| intra-layer | `technology.artifact.open-api-specification`          | `accesses` | outbound  |

### Playwright Test Execution {#playwright-test-execution}

**ID**: `technology.technologyprocess.playwright-test-execution`

**Type**: `technologyprocess`

Automated test pipeline running 1170 Playwright tests across unit, integration, and E2E configs (playwright.config.ts, playwright.e2e.config.ts, playwright.auth.config.ts)

#### Relationships

| Type        | Related Element                                       | Predicate | Direction |
| ----------- | ----------------------------------------------------- | --------- | --------- |
| intra-layer | `technology.technologyinterface.web-socket-interface` | `serves`  | inbound   |

### Vite Build Pipeline {#vite-build-pipeline}

**ID**: `technology.technologyprocess.vite-build-pipeline`

**Type**: `technologyprocess`

Automated build sequence: copy WASM assets → generate OpenAPI client → check API version → Vite bundle → package embedded artifact; produces the deployable app

#### Relationships

| Type        | Related Element                                       | Predicate  | Direction |
| ----------- | ----------------------------------------------------- | ---------- | --------- |
| intra-layer | `technology.technologyinterface.rest-https-interface` | `serves`   | inbound   |
| intra-layer | `technology.artifact.embedded-app-bundle`             | `accesses` | outbound  |
| intra-layer | `technology.technologyservice.dr-cli-rest-server`     | `realizes` | outbound  |

### DR CLI REST Server {#dr-cli-rest-server}

**ID**: `technology.technologyservice.dr-cli-rest-server`

**Type**: `technologyservice`

HTTP compute service exposing the DR model management REST API; the embedded app connects to this service to read/write architecture model elements

#### Attributes

| Name        | Value   |
| ----------- | ------- |
| serviceType | compute |

#### Relationships

| Type        | Related Element                                                     | Predicate     | Direction |
| ----------- | ------------------------------------------------------------------- | ------------- | --------- |
| inter-layer | `api.openapidocument.dr-cli-visualization-server-open-api-document` | `serves`      | outbound  |
| intra-layer | `technology.technologyinterface.rest-https-interface`               | `assigned-to` | inbound   |
| intra-layer | `technology.technologyprocess.vite-build-pipeline`                  | `realizes`    | inbound   |

### WebSocket Model Service {#websocket-model-service}

**ID**: `technology.technologyservice.web-socket-model-service`

**Type**: `technologyservice`

Persistent WebSocket messaging service on the DR CLI server; delivers real-time model change events to connected browser clients via JSON-RPC 2.0

#### Attributes

| Name        | Value     |
| ----------- | --------- |
| serviceType | messaging |

#### Relationships

| Type        | Related Element                                       | Predicate     | Direction |
| ----------- | ----------------------------------------------------- | ------------- | --------- |
| intra-layer | `technology.technologyinterface.web-socket-interface` | `assigned-to` | inbound   |

---

Generated: 2026-11-12T13:57:21.197Z | Model Version: 0.1.0
