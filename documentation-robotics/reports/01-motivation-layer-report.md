# Motivation

[← Back to README](../README.md)

Goals, requirements, drivers, and strategic outcomes of the architecture.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 18    |
| Intra-Layer Relationships | 24    |
| Inter-Layer Relationships | 28    |
| Inbound Relationships     | 28    |
| Outbound Relationships    | 0     |

**Cross-Layer References**:

- **Upstream layers**: [API](./07-api-layer-report.md), [Application](./05-application-layer-report.md), [Business](./02-business-layer-report.md), [Data Model](./08-data-model-layer-report.md), [Testing](./13-testing-layer-report.md), [UX](./10-ux-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph motivation
    motivation_constraint_browser_only_deployment["Browser-Only Deployment"]
    motivation_constraint_dr_cli_server_dependency["DR CLI Server Dependency"]
    motivation_constraint_type_script_strict_mode["TypeScript Strict Mode"]
    motivation_driver_architecture_documentation_complexity["Architecture Documentation Complexity"]
    motivation_driver_team_distributed_review_needs["Team Distributed Review Needs"]
    motivation_goal_accelerate_architecture_documentation["Accelerate Architecture Documentation"]
    motivation_goal_enable_real_time_collaboration["Enable Real-Time Collaboration"]
    motivation_goal_ensure_accessible_architecture_views["Ensure Accessible Architecture Views"]
    motivation_goal_visualize_multi_layer_architecture_models["Visualize Multi-Layer Architecture Models"]
    motivation_principle_core_app_architectural_separation["Core-App Architectural Separation"]
    motivation_principle_read_first_always["Read First, Always"]
    motivation_principle_zustand_only_state_management["Zustand-Only State Management"]
    motivation_requirement_dr_cli_server_integration["DR CLI Server Integration"]
    motivation_requirement_embedded_deployment_mode["Embedded Deployment Mode"]
    motivation_requirement_wcag_21_aa_compliance["WCAG 2.1 AA Compliance"]
    motivation_stakeholder_architecture_team["Architecture Team"]
    motivation_stakeholder_development_team["Development Team"]
    motivation_stakeholder_dr_cli_server["DR CLI Server"]
    motivation_constraint_browser_only_deployment -->|constrains| motivation_requirement_embedded_deployment_mode
    motivation_constraint_dr_cli_server_dependency -->|constrains| motivation_requirement_dr_cli_server_integration
    motivation_constraint_type_script_strict_mode -->|constrains| motivation_requirement_dr_cli_server_integration
    motivation_constraint_type_script_strict_mode -->|constrains| motivation_requirement_wcag_21_aa_compliance
    motivation_driver_architecture_documentation_complexity -->|influence| motivation_goal_visualize_multi_layer_architecture_models
    motivation_driver_team_distributed_review_needs -->|influence| motivation_goal_accelerate_architecture_documentation
    motivation_driver_team_distributed_review_needs -->|influence| motivation_goal_enable_real_time_collaboration
    motivation_goal_accelerate_architecture_documentation -->|influence| motivation_principle_read_first_always
    motivation_goal_enable_real_time_collaboration -->|influence| motivation_principle_zustand_only_state_management
    motivation_goal_ensure_accessible_architecture_views -->|influence| motivation_requirement_wcag_21_aa_compliance
    motivation_goal_visualize_multi_layer_architecture_models -->|influence| motivation_principle_core_app_architectural_separation
    motivation_principle_core_app_architectural_separation -->|influence| motivation_goal_accelerate_architecture_documentation
    motivation_principle_core_app_architectural_separation -->|influence| motivation_goal_visualize_multi_layer_architecture_models
    motivation_principle_read_first_always -->|influence| motivation_goal_accelerate_architecture_documentation
    motivation_principle_zustand_only_state_management -->|influence| motivation_requirement_dr_cli_server_integration
    motivation_requirement_dr_cli_server_integration -->|realizes| motivation_goal_visualize_multi_layer_architecture_models
    motivation_requirement_embedded_deployment_mode -->|realizes| motivation_goal_accelerate_architecture_documentation
    motivation_requirement_wcag_21_aa_compliance -->|realizes| motivation_goal_ensure_accessible_architecture_views
    motivation_stakeholder_architecture_team -->|associated-with| motivation_requirement_dr_cli_server_integration
    motivation_stakeholder_architecture_team -->|influence| motivation_goal_visualize_multi_layer_architecture_models
    motivation_stakeholder_development_team -->|associated-with| motivation_requirement_wcag_21_aa_compliance
    motivation_stakeholder_development_team -->|influence| motivation_goal_enable_real_time_collaboration
    motivation_stakeholder_dr_cli_server -->|associated-with| motivation_constraint_dr_cli_server_dependency
    motivation_stakeholder_dr_cli_server -->|associated-with| motivation_driver_architecture_documentation_complexity
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
  api --> motivation
  application --> motivation
  business --> motivation
  data_model --> motivation
  testing --> motivation
  ux --> motivation
  class motivation current
```

## Inter-Layer Relationships Table

| Relationship ID                                                                       | Source Node                                   | Dest Node                                                   | Dest Layer   | Predicate   | Cardinality  | Strength |
| ------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------- | ------------ | ----------- | ------------ | -------- |
| `03823476-93f8-4ab4-8c51-cd93bf459ff0-realizes-59d25358-33d1-4c2d-b8fb-2a03ab216ae6`  | `03823476-93f8-4ab4-8c51-cd93bf459ff0`        | `59d25358-33d1-4c2d-b8fb-2a03ab216ae6`                      | `motivation` | `realizes`  | unknown      | unknown  |
| `13b1a5ff-1cea-4ca0-b557-81f4629f2736-satisfies-6ffaff00-8bf8-4580-98ff-8d2a612a9021` | `13b1a5ff-1cea-4ca0-b557-81f4629f2736`        | `6ffaff00-8bf8-4580-98ff-8d2a612a9021`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `35295e18-08a8-4ca0-ada3-40a017cb4318-realizes-462e2931-4c7c-4051-a9ac-8817c270d650`  | `35295e18-08a8-4ca0-ada3-40a017cb4318`        | `462e2931-4c7c-4051-a9ac-8817c270d650`                      | `motivation` | `realizes`  | unknown      | unknown  |
| `35295e18-08a8-4ca0-ada3-40a017cb4318-satisfies-e748118c-b989-43fe-b0d2-9121e931fcd2` | `35295e18-08a8-4ca0-ada3-40a017cb4318`        | `e748118c-b989-43fe-b0d2-9121e931fcd2`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `5308e41f-71c9-4ca6-8dfc-11d8b0483ce8-realizes-59d25358-33d1-4c2d-b8fb-2a03ab216ae6`  | `5308e41f-71c9-4ca6-8dfc-11d8b0483ce8`        | `59d25358-33d1-4c2d-b8fb-2a03ab216ae6`                      | `motivation` | `realizes`  | unknown      | unknown  |
| `83c81f34-4376-4ff9-8fb4-98f3ecbc6d68-satisfies-e748118c-b989-43fe-b0d2-9121e931fcd2` | `83c81f34-4376-4ff9-8fb4-98f3ecbc6d68`        | `e748118c-b989-43fe-b0d2-9121e931fcd2`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `b66b613e-27b6-4d90-909f-3aa81570de15-satisfies-fc86a033-81bd-4933-abb8-b24076577123` | `b66b613e-27b6-4d90-909f-3aa81570de15`        | `fc86a033-81bd-4933-abb8-b24076577123`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `business.businessservice.realizes.motivation.goal`                                   | `business.businessservice.schema-exploration` | `motivation.goal.visualize-multi-layer-architecture-models` | `motivation` | `realizes`  | many-to-many | medium   |
| `data-model.schemadefinition.satisfies.motivation.constraint`                         | `data-model.schemadefinition.annotation-id`   | `motivation.constraint.type-script-strict-mode`             | `motivation` | `satisfies` | many-to-many | medium   |
| `data-model.schemadefinition.satisfies.motivation.constraint`                         | `data-model.schemadefinition.changeset-id`    | `motivation.constraint.type-script-strict-mode`             | `motivation` | `satisfies` | many-to-many | medium   |
| `data-model.schemadefinition.satisfies.motivation.constraint`                         | `data-model.schemadefinition.element-id`      | `motivation.constraint.type-script-strict-mode`             | `motivation` | `satisfies` | many-to-many | medium   |
| `dc2da0b6-3de0-44d1-840f-5d49cc976cd9-satisfies-e748118c-b989-43fe-b0d2-9121e931fcd2` | `dc2da0b6-3de0-44d1-840f-5d49cc976cd9`        | `e748118c-b989-43fe-b0d2-9121e931fcd2`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-53fad2bb-e97d-44a2-83cf-61201e992163` | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `53fad2bb-e97d-44a2-83cf-61201e992163`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-6ffaff00-8bf8-4580-98ff-8d2a612a9021` | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `6ffaff00-8bf8-4580-98ff-8d2a612a9021`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-9df37bbd-8ffd-4d80-899f-9437aa03282a` | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `9df37bbd-8ffd-4d80-899f-9437aa03282a`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-9fe1281a-2547-416f-872f-38e1b066db15` | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `9fe1281a-2547-416f-872f-38e1b066db15`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-b3d7f834-dc3f-49fd-8044-8b6aca045dbe` | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `b3d7f834-dc3f-49fd-8044-8b6aca045dbe`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-satisfies-e748118c-b989-43fe-b0d2-9121e931fcd2` | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `e748118c-b989-43fe-b0d2-9121e931fcd2`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-supports-462e2931-4c7c-4051-a9ac-8817c270d650`  | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `462e2931-4c7c-4051-a9ac-8817c270d650`                      | `motivation` | `supports`  | unknown      | unknown  |
| `de956804-eabb-4548-8389-73cb6c63ef2f-supports-ef84b64d-883c-4471-9b56-a58574bac2b9`  | `de956804-eabb-4548-8389-73cb6c63ef2f`        | `ef84b64d-883c-4471-9b56-a58574bac2b9`                      | `motivation` | `supports`  | unknown      | unknown  |
| `dfc6509e-98f5-479a-bfe9-14bfddbb838a-satisfies-fc86a033-81bd-4933-abb8-b24076577123` | `dfc6509e-98f5-479a-bfe9-14bfddbb838a`        | `fc86a033-81bd-4933-abb8-b24076577123`                      | `motivation` | `satisfies` | unknown      | unknown  |
| `e642ad79-62ea-47a4-ae04-d512d0ef7881-realizes-731285cc-dc15-4c64-a342-a933ce00bd61`  | `e642ad79-62ea-47a4-ae04-d512d0ef7881`        | `731285cc-dc15-4c64-a342-a933ce00bd61`                      | `motivation` | `realizes`  | unknown      | unknown  |
| `ux.uxspec.satisfies.motivation.requirement`                                          | `ux.uxspec.authentication-spec`               | `motivation.requirement.dr-cli-server-integration`          | `motivation` | `satisfies` | many-to-many | medium   |
| `ux.view.satisfies.motivation.requirement`                                            | `ux.view.changesets-view`                     | `motivation.requirement.wcag-21-aa-compliance`              | `motivation` | `satisfies` | many-to-many | medium   |
| `ux.view.supports.motivation.goal`                                                    | `ux.view.changesets-view`                     | `motivation.goal.enable-real-time-collaboration`            | `motivation` | `supports`  | many-to-many | medium   |
| `ux.view.satisfies.motivation.requirement`                                            | `ux.view.model-view`                          | `motivation.requirement.wcag-21-aa-compliance`              | `motivation` | `satisfies` | many-to-many | medium   |
| `ux.view.supports.motivation.goal`                                                    | `ux.view.model-view`                          | `motivation.goal.visualize-multi-layer-architecture-models` | `motivation` | `supports`  | many-to-many | medium   |
| `ux.view.satisfies.motivation.requirement`                                            | `ux.view.schema-view`                         | `motivation.requirement.wcag-21-aa-compliance`              | `motivation` | `satisfies` | many-to-many | medium   |

## Element Reference

### Browser-Only Deployment {#browser-only-deployment}

**ID**: `motivation.constraint.browser-only-deployment`

**Type**: `constraint`

Viewer is a pure browser SPA with no server-side rendering; all data fetched from external DR CLI server

#### Attributes

| Name           | Value     |
| -------------- | --------- |
| constraintType | technical |

#### Relationships

| Type        | Related Element                                   | Predicate    | Direction |
| ----------- | ------------------------------------------------- | ------------ | --------- |
| intra-layer | `motivation.requirement.embedded-deployment-mode` | `constrains` | outbound  |

### DR CLI Server Dependency {#dr-cli-server-dependency}

**ID**: `motivation.constraint.dr-cli-server-dependency`

**Type**: `constraint`

Viewer has no standalone mode; requires a running DR CLI server at localhost:8080 to load model data

#### Attributes

| Name           | Value          |
| -------------- | -------------- |
| constraintType | organizational |

#### Relationships

| Type        | Related Element                                    | Predicate         | Direction |
| ----------- | -------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.requirement.dr-cli-server-integration` | `constrains`      | outbound  |
| intra-layer | `motivation.stakeholder.dr-cli-server`             | `associated-with` | inbound   |

### TypeScript Strict Mode {#typescript-strict-mode}

**ID**: `motivation.constraint.type-script-strict-mode`

**Type**: `constraint`

All source files must be strongly typed TypeScript; no any types in production code

#### Attributes

| Name           | Value     |
| -------------- | --------- |
| constraintType | technical |

#### Relationships

| Type        | Related Element                                    | Predicate    | Direction |
| ----------- | -------------------------------------------------- | ------------ | --------- |
| inter-layer | `data-model.schemadefinition.annotation-id`        | `satisfies`  | inbound   |
| inter-layer | `data-model.schemadefinition.changeset-id`         | `satisfies`  | inbound   |
| inter-layer | `data-model.schemadefinition.element-id`           | `satisfies`  | inbound   |
| intra-layer | `motivation.requirement.dr-cli-server-integration` | `constrains` | outbound  |
| intra-layer | `motivation.requirement.wcag-21-aa-compliance`     | `constrains` | outbound  |

### Architecture Documentation Complexity {#architecture-documentation-complexity}

**ID**: `motivation.driver.architecture-documentation-complexity`

**Type**: `driver`

12-layer architecture model spanning motivation through testing is too complex to communicate via static diagrams; interactive tooling needed

#### Attributes

| Name     | Value       |
| -------- | ----------- |
| category | operational |

#### Relationships

| Type        | Related Element                                             | Predicate         | Direction |
| ----------- | ----------------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.goal.visualize-multi-layer-architecture-models` | `influence`       | outbound  |
| intra-layer | `motivation.stakeholder.dr-cli-server`                      | `associated-with` | inbound   |

### Team Distributed Review Needs {#team-distributed-review-needs}

**ID**: `motivation.driver.team-distributed-review-needs`

**Type**: `driver`

Architecture review must support asynchronous collaboration; annotations and real-time sync reduce review cycle time

#### Attributes

| Name     | Value       |
| -------- | ----------- |
| category | operational |

#### Relationships

| Type        | Related Element                                         | Predicate   | Direction |
| ----------- | ------------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.goal.accelerate-architecture-documentation` | `influence` | outbound  |
| intra-layer | `motivation.goal.enable-real-time-collaboration`        | `influence` | outbound  |

### Accelerate Architecture Documentation {#accelerate-architecture-documentation}

**ID**: `motivation.goal.accelerate-architecture-documentation`

**Type**: `goal`

Reduce friction in creating and reviewing architecture documentation by integrating directly with DR CLI model files

#### Attributes

| Name     | Value |
| -------- | ----- |
| priority | high  |

#### Relationships

| Type        | Related Element                                          | Predicate   | Direction |
| ----------- | -------------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.driver.team-distributed-review-needs`        | `influence` | inbound   |
| intra-layer | `motivation.principle.read-first-always`                 | `influence` | outbound  |
| intra-layer | `motivation.principle.core-app-architectural-separation` | `influence` | inbound   |
| intra-layer | `motivation.principle.read-first-always`                 | `influence` | inbound   |
| intra-layer | `motivation.requirement.embedded-deployment-mode`        | `realizes`  | inbound   |

### Enable Real-Time Collaboration {#enable-real-time-collaboration}

**ID**: `motivation.goal.enable-real-time-collaboration`

**Type**: `goal`

Support concurrent architecture review via real-time WebSocket model sync and collaborative annotations

#### Attributes

| Name     | Value |
| -------- | ----- |
| priority | high  |

#### Relationships

| Type        | Related Element                                      | Predicate   | Direction |
| ----------- | ---------------------------------------------------- | ----------- | --------- |
| inter-layer | `ux.view.changesets-view`                            | `supports`  | inbound   |
| intra-layer | `motivation.driver.team-distributed-review-needs`    | `influence` | inbound   |
| intra-layer | `motivation.principle.zustand-only-state-management` | `influence` | outbound  |
| intra-layer | `motivation.stakeholder.development-team`            | `influence` | inbound   |

### Ensure Accessible Architecture Views {#ensure-accessible-architecture-views}

**ID**: `motivation.goal.ensure-accessible-architecture-views`

**Type**: `goal`

Meet WCAG 2.1 AA accessibility standards so all team members can use the viewer regardless of assistive technology needs; standard now documented directly in CLAUDE.md (documentation/ACCESSIBILITY.md was removed in the Heimdall rebuild) and enforced by axe-core Playwright checks on every view in light + dark

#### Attributes

| Name     | Value  |
| -------- | ------ |
| priority | medium |

#### Relationships

| Type        | Related Element                                | Predicate   | Direction |
| ----------- | ---------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.requirement.wcag-21-aa-compliance` | `influence` | outbound  |
| intra-layer | `motivation.requirement.wcag-21-aa-compliance` | `realizes`  | inbound   |

### Visualize Multi-Layer Architecture Models {#visualize-multi-layer-architecture-models}

**ID**: `motivation.goal.visualize-multi-layer-architecture-models`

**Type**: `goal`

Provide interactive, navigable visualization of 12-layer architecture models using React Flow graph rendering

#### Attributes

| Name     | Value    |
| -------- | -------- |
| priority | critical |

#### Relationships

| Type        | Related Element                                           | Predicate   | Direction |
| ----------- | --------------------------------------------------------- | ----------- | --------- |
| inter-layer | `business.businessservice.schema-exploration`             | `realizes`  | inbound   |
| inter-layer | `ux.view.model-view`                                      | `supports`  | inbound   |
| intra-layer | `motivation.driver.architecture-documentation-complexity` | `influence` | inbound   |
| intra-layer | `motivation.principle.core-app-architectural-separation`  | `influence` | outbound  |
| intra-layer | `motivation.principle.core-app-architectural-separation`  | `influence` | inbound   |
| intra-layer | `motivation.requirement.dr-cli-server-integration`        | `realizes`  | inbound   |
| intra-layer | `motivation.stakeholder.architecture-team`                | `influence` | inbound   |

### Core-App Architectural Separation {#core-app-architectural-separation}

**ID**: `motivation.principle.core-app-architectural-separation`

**Type**: `principle`

Strict boundary: Core layer has no route/store dependencies; only App components may use embedded stores and route context

#### Attributes

| Name     | Value        |
| -------- | ------------ |
| category | architecture |

#### Relationships

| Type        | Related Element                                             | Predicate   | Direction |
| ----------- | ----------------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.goal.visualize-multi-layer-architecture-models` | `influence` | inbound   |
| intra-layer | `motivation.goal.accelerate-architecture-documentation`     | `influence` | outbound  |
| intra-layer | `motivation.goal.visualize-multi-layer-architecture-models` | `influence` | outbound  |

### Read First, Always {#read-first-always}

**ID**: `motivation.principle.read-first-always`

**Type**: `principle`

Never modify code without reading it first; always understand existing patterns before introducing changes

#### Attributes

| Name     | Value       |
| -------- | ----------- |
| category | operational |

#### Relationships

| Type        | Related Element                                         | Predicate   | Direction |
| ----------- | ------------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.goal.accelerate-architecture-documentation` | `influence` | inbound   |
| intra-layer | `motivation.goal.accelerate-architecture-documentation` | `influence` | outbound  |

### Zustand-Only State Management {#zustand-only-state-management}

**ID**: `motivation.principle.zustand-only-state-management`

**Type**: `principle`

All global state managed via Zustand stores; no Redux, no React Context for state — Context used only for providers

#### Attributes

| Name     | Value        |
| -------- | ------------ |
| category | architecture |

#### Relationships

| Type        | Related Element                                    | Predicate   | Direction |
| ----------- | -------------------------------------------------- | ----------- | --------- |
| intra-layer | `motivation.goal.enable-real-time-collaboration`   | `influence` | inbound   |
| intra-layer | `motivation.requirement.dr-cli-server-integration` | `influence` | outbound  |

### DR CLI Server Integration {#dr-cli-server-integration}

**ID**: `motivation.requirement.dr-cli-server-integration`

**Type**: `requirement`

Viewer must connect to DR CLI REST API and WebSocket JSON-RPC endpoint to load and sync model data

#### Attributes

| Name            | Value      |
| --------------- | ---------- |
| priority        | critical   |
| requirementType | functional |

#### Relationships

| Type        | Related Element                                             | Predicate         | Direction |
| ----------- | ----------------------------------------------------------- | ----------------- | --------- |
| inter-layer | `ux.uxspec.authentication-spec`                             | `satisfies`       | inbound   |
| intra-layer | `motivation.constraint.dr-cli-server-dependency`            | `constrains`      | inbound   |
| intra-layer | `motivation.constraint.type-script-strict-mode`             | `constrains`      | inbound   |
| intra-layer | `motivation.principle.zustand-only-state-management`        | `influence`       | inbound   |
| intra-layer | `motivation.goal.visualize-multi-layer-architecture-models` | `realizes`        | outbound  |
| intra-layer | `motivation.stakeholder.architecture-team`                  | `associated-with` | inbound   |

### Embedded Deployment Mode {#embedded-deployment-mode}

**ID**: `motivation.requirement.embedded-deployment-mode`

**Type**: `requirement`

Viewer must support deployment as an embedded iframe within the DR CLI local web interface using hash-based routing

#### Attributes

| Name            | Value      |
| --------------- | ---------- |
| priority        | high       |
| requirementType | functional |

#### Relationships

| Type        | Related Element                                         | Predicate    | Direction |
| ----------- | ------------------------------------------------------- | ------------ | --------- |
| intra-layer | `motivation.constraint.browser-only-deployment`         | `constrains` | inbound   |
| intra-layer | `motivation.goal.accelerate-architecture-documentation` | `realizes`   | outbound  |

### WCAG 2.1 AA Compliance {#wcag-2-1-aa-compliance}

**ID**: `motivation.requirement.wcag-21-aa-compliance`

**Type**: `requirement`

All interactive components must pass axe-core automated accessibility testing and meet WCAG 2.1 Level AA; verified via @axe-core/playwright in tests/e2e/a11y.spec.ts against every view in light + dark canvas mode

#### Attributes

| Name            | Value   |
| --------------- | ------- |
| priority        | high    |
| requirementType | quality |

#### Relationships

| Type        | Related Element                                        | Predicate         | Direction |
| ----------- | ------------------------------------------------------ | ----------------- | --------- |
| inter-layer | `ux.view.changesets-view`                              | `satisfies`       | inbound   |
| inter-layer | `ux.view.model-view`                                   | `satisfies`       | inbound   |
| inter-layer | `ux.view.schema-view`                                  | `satisfies`       | inbound   |
| intra-layer | `motivation.constraint.type-script-strict-mode`        | `constrains`      | inbound   |
| intra-layer | `motivation.goal.ensure-accessible-architecture-views` | `influence`       | inbound   |
| intra-layer | `motivation.goal.ensure-accessible-architecture-views` | `realizes`        | outbound  |
| intra-layer | `motivation.stakeholder.development-team`              | `associated-with` | inbound   |

### Architecture Team {#architecture-team}

**ID**: `motivation.stakeholder.architecture-team`

**Type**: `stakeholder`

Architects who create DR models and use the viewer to communicate architecture decisions

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | internal |

#### Relationships

| Type        | Related Element                                             | Predicate         | Direction |
| ----------- | ----------------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.requirement.dr-cli-server-integration`          | `associated-with` | outbound  |
| intra-layer | `motivation.goal.visualize-multi-layer-architecture-models` | `influence`       | outbound  |

### Development Team {#development-team}

**ID**: `motivation.stakeholder.development-team`

**Type**: `stakeholder`

Internal engineering team that builds and maintains the documentation_robotics_viewer

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | internal |

#### Relationships

| Type        | Related Element                                  | Predicate         | Direction |
| ----------- | ------------------------------------------------ | ----------------- | --------- |
| intra-layer | `motivation.requirement.wcag-21-aa-compliance`   | `associated-with` | outbound  |
| intra-layer | `motivation.goal.enable-real-time-collaboration` | `influence`       | outbound  |

### DR CLI Server {#dr-cli-server}

**ID**: `motivation.stakeholder.dr-cli-server`

**Type**: `stakeholder`

System dependency: DR CLI server that must be running to serve model data to the viewer

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | external |

#### Relationships

| Type        | Related Element                                           | Predicate         | Direction |
| ----------- | --------------------------------------------------------- | ----------------- | --------- |
| intra-layer | `motivation.constraint.dr-cli-server-dependency`          | `associated-with` | outbound  |
| intra-layer | `motivation.driver.architecture-documentation-complexity` | `associated-with` | outbound  |

---

Generated: 2026-11-12T13:57:21.197Z | Model Version: 0.1.0
