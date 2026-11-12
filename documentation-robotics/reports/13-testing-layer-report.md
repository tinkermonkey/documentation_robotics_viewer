# Testing

[← Back to README](../README.md)

Test strategies, test cases, test data, and test coverage.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 6     |
| Intra-Layer Relationships | 5     |
| Inter-Layer Relationships | 13    |
| Inbound Relationships     | 0     |
| Outbound Relationships    | 13    |

**Cross-Layer References**:

- **Downstream layers**: [Application](./05-application-layer-report.md), [Motivation](./01-motivation-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph testing
    testing_contextvariation_functional_unit_test_context["Functional Unit Test Context"]
    testing_coveragerequirement_all_partitions_unit_test_requirement["All-Partitions Unit Test Requirement"]
    testing_coveragesummary_overall_test_coverage_summary["Overall Test Coverage Summary"]
    testing_testcoveragemodel_viewer_test_coverage_model["Viewer Test Coverage Model"]
    testing_testcoveragetarget_cross_component_integration_test_coverage["Cross-Component Integration Test Coverage"]
    testing_testcoveragetarget_service_and_store_unit_test_coverage["Service and Store Unit Test Coverage"]
    testing_testcoveragemodel_viewer_test_coverage_model -->|composes| testing_contextvariation_functional_unit_test_context
    testing_testcoveragemodel_viewer_test_coverage_model -->|composes| testing_coveragesummary_overall_test_coverage_summary
    testing_testcoveragemodel_viewer_test_coverage_model -->|composes| testing_testcoveragetarget_cross_component_integration_test_coverage
    testing_testcoveragemodel_viewer_test_coverage_model -->|composes| testing_testcoveragetarget_service_and_store_unit_test_coverage
    testing_testcoveragetarget_service_and_store_unit_test_coverage -->|composes| testing_coveragerequirement_all_partitions_unit_test_requirement
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
  testing --> application
  testing --> motivation
  class testing current
```

## Inter-Layer Relationships Table

| Relationship ID                                                                       | Source Node                                                            | Dest Node                                                  | Dest Layer    | Predicate   | Cardinality  | Strength |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- | ------------- | ----------- | ------------ | -------- |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-53fad2bb-e97d-44a2-83cf-61201e992163` | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `53fad2bb-e97d-44a2-83cf-61201e992163`                     | `motivation`  | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-6ffaff00-8bf8-4580-98ff-8d2a612a9021` | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `6ffaff00-8bf8-4580-98ff-8d2a612a9021`                     | `motivation`  | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-9df37bbd-8ffd-4d80-899f-9437aa03282a` | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `9df37bbd-8ffd-4d80-899f-9437aa03282a`                     | `motivation`  | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-9fe1281a-2547-416f-872f-38e1b066db15` | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `9fe1281a-2547-416f-872f-38e1b066db15`                     | `motivation`  | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-b3d7f834-dc3f-49fd-8044-8b6aca045dbe` | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `b3d7f834-dc3f-49fd-8044-8b6aca045dbe`                     | `motivation`  | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-e748118c-b989-43fe-b0d2-9121e931fcd2` | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `e748118c-b989-43fe-b0d2-9121e931fcd2`                     | `motivation`  | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-supports-462e2931-4c7c-4051-a9ac-8817c270d650`  | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `462e2931-4c7c-4051-a9ac-8817c270d650`                     | `motivation`  | `supports`  | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-supports-ef84b64d-883c-4471-9b56-a58574bac2b9`  | `de956804-eabb-4548-8389-73cb6c63ef2f`                                 | `ef84b64d-883c-4471-9b56-a58574bac2b9`                     | `motivation`  | `supports`  | unknown      | unknown  |
| `testing.testcoveragetarget.covers.application.applicationservice`                    | `testing.testcoveragetarget.cross-component-integration-test-coverage` | `application.applicationservice.chat-service`              | `application` | `covers`    | many-to-many | medium   |
| `testing.testcoveragetarget.covers.application.applicationservice`                    | `testing.testcoveragetarget.cross-component-integration-test-coverage` | `application.applicationservice.web-socket-client`         | `application` | `covers`    | many-to-many | medium   |
| `testing.testcoveragetarget.covers.application.applicationservice`                    | `testing.testcoveragetarget.service-and-store-unit-test-coverage`      | `application.applicationservice.changeset-impact-analysis` | `application` | `covers`    | many-to-many | medium   |
| `testing.testcoveragetarget.covers.application.applicationservice`                    | `testing.testcoveragetarget.service-and-store-unit-test-coverage`      | `application.applicationservice.layered-reach`             | `application` | `covers`    | many-to-many | medium   |
| `testing.testcoveragetarget.covers.application.applicationservice`                    | `testing.testcoveragetarget.service-and-store-unit-test-coverage`      | `application.applicationservice.model-graph-transform`     | `application` | `covers`    | many-to-many | medium   |

## Element Reference

### Functional Unit Test Context {#functional-unit-test-context}

**ID**: `testing.contextvariation.functional-unit-test-context`

**Type**: `contextvariation`

Standard functional test context for unit, integration, and component tests; runs under Vitest (node/happy-dom environments) against mock data via MSW/mock WebSocket; fastest feedback loop (~262 tests, ~1.6s). Playwright is no longer used for unit/integration tests — it now covers only tests/e2e.

#### Attributes

| Name        | Value      |
| ----------- | ---------- |
| contextType | functional |

#### Relationships

| Type        | Related Element                                        | Predicate  | Direction |
| ----------- | ------------------------------------------------------ | ---------- | --------- |
| intra-layer | `testing.testcoveragemodel.viewer-test-coverage-model` | `composes` | inbound   |

### All-Partitions Unit Test Requirement {#all-partitions-unit-test-requirement}

**ID**: `testing.coveragerequirement.all-partitions-unit-test-requirement`

**Type**: `coveragerequirement`

Requirement that all public service methods and store actions have at least one test covering each logical partition; all-partitions criteria applied to dataLoader, nodeTransformer, crossLayerProcessor, and all store methods.

#### Attributes

| Name             | Value          |
| ---------------- | -------------- |
| coverageCriteria | all-partitions |
| priority         | high           |

#### Relationships

| Type        | Related Element                                                   | Predicate  | Direction |
| ----------- | ----------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `testing.testcoveragetarget.service-and-store-unit-test-coverage` | `composes` | inbound   |

### Overall Test Coverage Summary {#overall-test-coverage-summary}

**ID**: `testing.coveragesummary.overall-test-coverage-summary`

**Type**: `coveragesummary`

Aggregate coverage status across the full test suite: Vitest unit/integration/component suite (~262 tests, tests/unit + tests/integration + tests/components) plus a Playwright E2E suite (~20 tests, tests/e2e) driving the built production bundle with axe-core WCAG 2.1 AA checks. Storybook stories no longer exist (removed in the Heimdall rebuild). Line/branch coverage is now available via @vitest/coverage-v8 (npm run test:cov), though CI's required gate runs plain vitest run.

#### Attributes

| Name              | Value |
| ----------------- | ----- |
| totalRequirements | 3     |
| totalSketches     | 0     |
| totalTargets      | 8     |

#### Relationships

| Type        | Related Element                                        | Predicate  | Direction |
| ----------- | ------------------------------------------------------ | ---------- | --------- |
| intra-layer | `testing.testcoveragemodel.viewer-test-coverage-model` | `composes` | inbound   |

### Viewer Test Coverage Model {#viewer-test-coverage-model}

**ID**: `testing.testcoveragemodel.viewer-test-coverage-model`

**Type**: `testcoveragemodel`

Root IEEE 829-style test coverage model for the documentation_robotics_viewer application; spans unit, integration, component, E2E, and accessibility (axe-core) test types. Unit/integration/component tests run under Vitest; E2E and accessibility tests run under Playwright against the built bundle. Storybook-based story testing was removed in the June 2026 Heimdall UX rebuild.

#### Attributes

| Name        | Value                         |
| ----------- | ----------------------------- |
| application | documentation-robotics-viewer |
| version     | 1.0                           |

#### Relationships

| Type        | Related Element                                                        | Predicate  | Direction |
| ----------- | ---------------------------------------------------------------------- | ---------- | --------- |
| intra-layer | `testing.contextvariation.functional-unit-test-context`                | `composes` | outbound  |
| intra-layer | `testing.coveragesummary.overall-test-coverage-summary`                | `composes` | outbound  |
| intra-layer | `testing.testcoveragetarget.cross-component-integration-test-coverage` | `composes` | outbound  |
| intra-layer | `testing.testcoveragetarget.service-and-store-unit-test-coverage`      | `composes` | outbound  |

### Cross-Component Integration Test Coverage {#cross-component-integration-test-coverage}

**ID**: `testing.testcoveragetarget.cross-component-integration-test-coverage`

**Type**: `testcoveragetarget`

Coverage target for integration tests verifying cross-component data flows: node transformer pipeline, cross-layer worker integration, libavoid routing, chat service, and preference persistence; 7 files under tests/integration/.

#### Attributes

| Name       | Value            |
| ---------- | ---------------- |
| priority   | high             |
| targetType | integration-flow |

#### Relationships

| Type        | Related Element                                        | Predicate  | Direction |
| ----------- | ------------------------------------------------------ | ---------- | --------- |
| inter-layer | `application.applicationservice.chat-service`          | `covers`   | outbound  |
| inter-layer | `application.applicationservice.web-socket-client`     | `covers`   | outbound  |
| intra-layer | `testing.testcoveragemodel.viewer-test-coverage-model` | `composes` | inbound   |

### Service and Store Unit Test Coverage {#service-and-store-unit-test-coverage}

**ID**: `testing.testcoveragetarget.service-and-store-unit-test-coverage`

**Type**: `testcoveragetarget`

Coverage target for unit testing of all core services (dataLoader, nodeTransformer, yamlParser, crossLayerProcessor, etc.) and Zustand stores; ~40 spec files under tests/unit/; 1170 total tests via playwright.config.ts.

#### Attributes

| Name       | Value        |
| ---------- | ------------ |
| priority   | high         |
| targetType | ui-component |

#### Relationships

| Type        | Related Element                                                    | Predicate  | Direction |
| ----------- | ------------------------------------------------------------------ | ---------- | --------- |
| inter-layer | `application.applicationservice.changeset-impact-analysis`         | `covers`   | outbound  |
| inter-layer | `application.applicationservice.layered-reach`                     | `covers`   | outbound  |
| inter-layer | `application.applicationservice.model-graph-transform`             | `covers`   | outbound  |
| intra-layer | `testing.testcoveragemodel.viewer-test-coverage-model`             | `composes` | inbound   |
| intra-layer | `testing.coveragerequirement.all-partitions-unit-test-requirement` | `composes` | outbound  |

---

Generated: 2026-11-12T13:57:21.197Z | Model Version: 0.1.0
