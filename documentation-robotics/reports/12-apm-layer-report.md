# APM

[← Back to README](../README.md)

Observability, monitoring, metrics, logging, and tracing.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 8     |
| Intra-Layer Relationships | 7     |
| Inter-Layer Relationships | 2     |
| Inbound Relationships     | 0     |
| Outbound Relationships    | 2     |

**Cross-Layer References**:

- **Downstream layers**: [Application](./05-application-layer-report.md), [Business](./02-business-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph apm
    apm_alert_playwright_test_failure_alert["Playwright Test Failure Alert"]
    apm_alert_web_socket_disconnect_alert["WebSocket Disconnect Alert"]
    apm_instrumentationconfig_browser_error_instrumentation["Browser Error Instrumentation"]
    apm_instrumentationscope_error_tracker_instrumentation_scope["Error Tracker Instrumentation Scope"]
    apm_logconfiguration_browser_console_error_log_configuration["Browser Console Error Log Configuration"]
    apm_metricinstrument_web_socket_connection_state_gauge["WebSocket Connection State Gauge"]
    apm_metricinstrument_web_socket_reconnection_attempt_counter["WebSocket Reconnection Attempt Counter"]
    apm_resource_embedded_app_resource["Embedded App Resource"]
    apm_alert_web_socket_disconnect_alert -->|monitors| apm_metricinstrument_web_socket_connection_state_gauge
    apm_instrumentationconfig_browser_error_instrumentation -->|serves| apm_instrumentationscope_error_tracker_instrumentation_scope
    apm_instrumentationscope_error_tracker_instrumentation_scope -->|aggregates| apm_metricinstrument_web_socket_connection_state_gauge
    apm_logconfiguration_browser_console_error_log_configuration -->|serves| apm_resource_embedded_app_resource
    apm_metricinstrument_web_socket_connection_state_gauge -->|depends-on| apm_instrumentationscope_error_tracker_instrumentation_scope
    apm_metricinstrument_web_socket_reconnection_attempt_counter -->|depends-on| apm_instrumentationscope_error_tracker_instrumentation_scope
    apm_resource_embedded_app_resource -->|aggregates| apm_metricinstrument_web_socket_connection_state_gauge
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
  apm --> application
  apm --> business
  class apm current
```

## Inter-Layer Relationships Table

| Relationship ID                                                | Source Node                                                    | Dest Node                                                   | Dest Layer    | Predicate  | Cardinality  | Strength |
| -------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- | ------------- | ---------- | ------------ | -------- |
| `apm.logconfiguration.monitors.business.businessservice`       | `apm.logconfiguration.browser-console-error-log-configuration` | `business.businessservice.architecture-model-visualization` | `business`    | `monitors` | many-to-many | medium   |
| `apm.metricinstrument.monitors.application.applicationservice` | `apm.metricinstrument.web-socket-reconnection-attempt-counter` | `application.applicationservice.web-socket-client`          | `application` | `monitors` | many-to-many | medium   |

## Element Reference

### Playwright Test Failure Alert {#playwright-test-failure-alert}

**ID**: `apm.alert.playwright-test-failure-alert`

**Type**: `alert`

Critical alert triggered when the Playwright E2E test suite exits with failures (tests/e2e only — unit/integration/component tests now run under Vitest, not Playwright); indicates a regression in the built production bundle's shell, views, chat, annotations, or accessibility behavior.

#### Attributes

| Name      | Value                                  |
| --------- | -------------------------------------- |
| condition | playwright test exit code not equals 0 |
| severity  | critical                               |

### WebSocket Disconnect Alert {#websocket-disconnect-alert}

**ID**: `apm.alert.web-socket-disconnect-alert`

**Type**: `alert`

Warning alert triggered when the DR CLI WebSocket connection drops and falls back to REST-only polling mode; indicates the real-time model update channel is unavailable.

#### Attributes

| Name      | Value                                  |
| --------- | -------------------------------------- |
| condition | connectionStore.status === 'rest-mode' |
| severity  | warning                                |

#### Relationships

| Type        | Related Element                                          | Predicate  | Direction |
| ----------- | -------------------------------------------------------- | ---------- | --------- |
| intra-layer | `apm.metricinstrument.web-socket-connection-state-gauge` | `monitors` | outbound  |

### Browser Error Instrumentation {#browser-error-instrumentation}

**ID**: `apm.instrumentationconfig.browser-error-instrumentation`

**Type**: `instrumentationconfig`

Manual browser error instrumentation configuration for the embedded viewer; the errorTracker service captures runtime exceptions, classifies them by category (network, rendering, data, auth), and logs structured error records.

#### Attributes

| Name                | Value                  |
| ------------------- | ---------------------- |
| instrumentationType | manual                 |
| type                | browser-error-tracking |

#### Relationships

| Type        | Related Element                                                | Predicate | Direction |
| ----------- | -------------------------------------------------------------- | --------- | --------- |
| intra-layer | `apm.instrumentationscope.error-tracker-instrumentation-scope` | `serves`  | outbound  |

### Error Tracker Instrumentation Scope {#error-tracker-instrumentation-scope}

**ID**: `apm.instrumentationscope.error-tracker-instrumentation-scope`

**Type**: `instrumentationscope`

Named instrumentation scope for the errorTracker and exceptionClassifier services; groups all error/exception signals produced by the frontend error handling subsystem.

#### Attributes

| Name                   | Value |
| ---------------------- | ----- |
| droppedAttributesCount | 0     |

#### Relationships

| Type        | Related Element                                                | Predicate    | Direction |
| ----------- | -------------------------------------------------------------- | ------------ | --------- |
| intra-layer | `apm.instrumentationconfig.browser-error-instrumentation`      | `serves`     | inbound   |
| intra-layer | `apm.metricinstrument.web-socket-connection-state-gauge`       | `aggregates` | outbound  |
| intra-layer | `apm.metricinstrument.web-socket-connection-state-gauge`       | `depends-on` | inbound   |
| intra-layer | `apm.metricinstrument.web-socket-reconnection-attempt-counter` | `depends-on` | inbound   |

### Browser Console Error Log Configuration {#browser-console-error-log-configuration}

**ID**: `apm.logconfiguration.browser-console-error-log-configuration`

**Type**: `logconfiguration`

Log configuration for browser console error capture; the errorTracker service writes structured error records with classification category, stack trace, and context; minimum severity ERROR.

#### Attributes

| Name            | Value                         |
| --------------- | ----------------------------- |
| minimumSeverity | ERROR                         |
| serviceName     | documentation-robotics-viewer |

#### Relationships

| Type        | Related Element                                             | Predicate  | Direction |
| ----------- | ----------------------------------------------------------- | ---------- | --------- |
| inter-layer | `business.businessservice.architecture-model-visualization` | `monitors` | outbound  |
| intra-layer | `apm.resource.embedded-app-resource`                        | `serves`   | outbound  |

### WebSocket Connection State Gauge {#websocket-connection-state-gauge}

**ID**: `apm.metricinstrument.web-socket-connection-state-gauge`

**Type**: `metricinstrument`

Gauge instrument tracking the current DR CLI WebSocket connection state (1=connected, 0=disconnected); sourced from connectionStore connection status transitions; enables alerting on connection loss.

#### Attributes

| Name | Value |
| ---- | ----- |
| type | Gauge |
| unit | state |

#### Relationships

| Type        | Related Element                                                | Predicate    | Direction |
| ----------- | -------------------------------------------------------------- | ------------ | --------- |
| intra-layer | `apm.alert.web-socket-disconnect-alert`                        | `monitors`   | inbound   |
| intra-layer | `apm.instrumentationscope.error-tracker-instrumentation-scope` | `aggregates` | inbound   |
| intra-layer | `apm.instrumentationscope.error-tracker-instrumentation-scope` | `depends-on` | outbound  |
| intra-layer | `apm.resource.embedded-app-resource`                           | `aggregates` | inbound   |

### WebSocket Reconnection Attempt Counter {#websocket-reconnection-attempt-counter}

**ID**: `apm.metricinstrument.web-socket-reconnection-attempt-counter`

**Type**: `metricinstrument`

Counter tracking cumulative WebSocket reconnection attempts; incremented by the websocketClient reconnect loop; measures connection stability over a session.

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | Counter  |
| unit | attempts |

#### Relationships

| Type        | Related Element                                                | Predicate    | Direction |
| ----------- | -------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `application.applicationservice.web-socket-client`             | `monitors`   | outbound  |
| intra-layer | `apm.instrumentationscope.error-tracker-instrumentation-scope` | `depends-on` | outbound  |

### Embedded App Resource {#embedded-app-resource}

**ID**: `apm.resource.embedded-app-resource`

**Type**: `resource`

OpenTelemetry-style resource identity for the browser-based embedded architecture viewer; identifies the frontend service unit producing all observability signals.

#### Attributes

| Name                   | Value |
| ---------------------- | ----- |
| droppedAttributesCount | 0     |

#### Relationships

| Type        | Related Element                                                | Predicate    | Direction |
| ----------- | -------------------------------------------------------------- | ------------ | --------- |
| intra-layer | `apm.logconfiguration.browser-console-error-log-configuration` | `serves`     | inbound   |
| intra-layer | `apm.metricinstrument.web-socket-connection-state-gauge`       | `aggregates` | outbound  |

---

Generated: 2026-09-19T15:37:38.405Z | Model Version: 0.1.0
