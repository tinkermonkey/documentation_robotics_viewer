# Product

[← Back to README](../README.md)

Product features, capabilities, personas, and milestones.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 26    |
| Intra-Layer Relationships | 44    |
| Inter-Layer Relationships | 49    |
| Inbound Relationships     | 33    |
| Outbound Relationships    | 16    |

**Cross-Layer References**:

- **Upstream layers**: [API](./07-api-layer-report.md), [Application](./05-application-layer-report.md), [Testing](./13-testing-layer-report.md), [UX](./10-ux-layer-report.md)
- **Downstream layers**: [Business](./02-business-layer-report.md), [Motivation](./01-motivation-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph product
    product_feature_change_origin_badges["Change Origin Badges"]
    product_feature_changeset_impact_tab["Changeset Impact Tab"]
    product_feature_changeset_inbox["Changeset Inbox"]
    product_feature_cross_layer_follow["Cross-Layer Follow"]
    product_feature_dr_bot_chat_drawer["DrBot Chat Drawer"]
    product_feature_element_annotations["Element Annotations"]
    product_feature_model_graph_view["Model Graph View"]
    product_feature_model_view_by_type["Model View by Type"]
    product_feature_page_view["Page View"]
    product_feature_per_change_review["Per-Change Review"]
    product_feature_schema_graph_view["Schema Graph View"]
    product_feature_tier1_mode_and_routing["Tier1 Mode And Routing"]
    product_feature_tier1_spend_panel["Tier1 Spend Panel"]
    product_feature_tier1_warming_progress["Tier1 Warming Progress"]
    product_persona_architecture_reviewer["Architecture Reviewer"]
    product_persona_model_author["Model Author"]
    product_softwarecapability_changeset_review["Changeset Review"]
    product_softwarecapability_model_annotation["Model Annotation"]
    product_softwarecapability_model_chat["Model Chat"]
    product_softwarecapability_model_visualization["Model Visualization"]
    product_softwarecapability_schema_exploration["Schema Exploration"]
    product_userworkflow_review_a_staged_changeset["Review a Staged Changeset"]
    product_workflowstep_apply_the_kept_changes["Apply the Kept Changes"]
    product_workflowstep_check_the_reach["Check the Reach"]
    product_workflowstep_decide_each_change["Decide Each Change"]
    product_workflowstep_pick_a_changeset_to_review["Pick a Changeset to Review"]
    product_feature_change_origin_badges -->|realizes| product_softwarecapability_changeset_review
    product_feature_change_origin_badges -->|serves| product_persona_architecture_reviewer
    product_feature_changeset_impact_tab -->|realizes| product_softwarecapability_changeset_review
    product_feature_changeset_impact_tab -->|serves| product_persona_architecture_reviewer
    product_feature_changeset_inbox -->|realizes| product_softwarecapability_changeset_review
    product_feature_changeset_inbox -->|serves| product_persona_architecture_reviewer
    product_feature_cross_layer_follow -->|realizes| product_softwarecapability_model_visualization
    product_feature_cross_layer_follow -->|serves| product_persona_architecture_reviewer
    product_feature_dr_bot_chat_drawer -->|realizes| product_softwarecapability_model_chat
    product_feature_dr_bot_chat_drawer -->|serves| product_persona_model_author
    product_feature_element_annotations -->|realizes| product_softwarecapability_model_annotation
    product_feature_element_annotations -->|serves| product_persona_architecture_reviewer
    product_feature_model_graph_view -->|realizes| product_softwarecapability_model_visualization
    product_feature_model_graph_view -->|serves| product_persona_architecture_reviewer
    product_feature_model_graph_view -->|serves| product_persona_model_author
    product_feature_model_view_by_type -->|realizes| product_softwarecapability_model_visualization
    product_feature_model_view_by_type -->|serves| product_persona_architecture_reviewer
    product_feature_model_view_by_type -->|serves| product_persona_model_author
    product_feature_page_view -->|realizes| product_softwarecapability_model_visualization
    product_feature_page_view -->|serves| product_persona_architecture_reviewer
    product_feature_per_change_review -->|realizes| product_softwarecapability_changeset_review
    product_feature_per_change_review -->|serves| product_persona_architecture_reviewer
    product_feature_schema_graph_view -->|realizes| product_softwarecapability_schema_exploration
    product_feature_schema_graph_view -->|serves| product_persona_model_author
    product_feature_tier1_mode_and_routing -->|depends-on| product_feature_tier1_spend_panel
    product_feature_tier1_mode_and_routing -->|realizes| product_softwarecapability_changeset_review
    product_feature_tier1_mode_and_routing -->|serves| product_persona_model_author
    product_feature_tier1_spend_panel -->|realizes| product_softwarecapability_changeset_review
    product_feature_tier1_spend_panel -->|serves| product_persona_model_author
    product_feature_tier1_warming_progress -->|depends-on| product_feature_tier1_spend_panel
    product_feature_tier1_warming_progress -->|realizes| product_softwarecapability_changeset_review
    product_feature_tier1_warming_progress -->|serves| product_persona_model_author
    product_userworkflow_review_a_staged_changeset -->|composes| product_workflowstep_apply_the_kept_changes
    product_userworkflow_review_a_staged_changeset -->|composes| product_workflowstep_check_the_reach
    product_userworkflow_review_a_staged_changeset -->|composes| product_workflowstep_decide_each_change
    product_userworkflow_review_a_staged_changeset -->|composes| product_workflowstep_pick_a_changeset_to_review
    product_userworkflow_review_a_staged_changeset -->|serves| product_persona_architecture_reviewer
    product_workflowstep_apply_the_kept_changes -->|uses| product_feature_per_change_review
    product_workflowstep_check_the_reach -->|flows-to| product_workflowstep_apply_the_kept_changes
    product_workflowstep_check_the_reach -->|uses| product_feature_changeset_impact_tab
    product_workflowstep_decide_each_change -->|flows-to| product_workflowstep_check_the_reach
    product_workflowstep_decide_each_change -->|uses| product_feature_per_change_review
    product_workflowstep_pick_a_changeset_to_review -->|flows-to| product_workflowstep_decide_each_change
    product_workflowstep_pick_a_changeset_to_review -->|uses| product_feature_changeset_inbox
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
  api --> product
  application --> product
  product --> business
  product --> motivation
  testing --> product
  ux --> product
  class product current
```

## Inter-Layer Relationships Table

| Relationship ID                                                      | Source Node                                                                                                                   | Dest Node                                                          | Dest Layer   | Predicate    | Cardinality  | Strength |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------ | ------------ | ------------ | -------- |
| `api.operation.exposes.product.feature`                              | `api.operation.get-api-tier1`                                                                                                 | `product.feature.tier1-mode-and-routing`                           | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.get-api-tier1`                                                                                                 | `product.feature.tier1-spend-panel`                                | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.get-api-tier1`                                                                                                 | `product.feature.tier1-warming-progress`                           | `product`    | `exposes`    | many-to-many | medium   |
| `api.operation.exposes.product.feature`                              | `api.operation.put-api-changesets-changeset-id-review`                                                                        | `product.feature.per-change-review`                                | `product`    | `exposes`    | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.change-origin-helpers`                                                                        | `product.feature.change-origin-badges`                             | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.changeset-impact-analysis`                                                                    | `product.feature.changeset-impact-tab`                             | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.changeset-review-model`                                                                       | `product.softwarecapability.changeset-review`                      | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.chat-service`                                                                                 | `product.softwarecapability.model-chat`                            | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.layered-reach`                                                                                | `product.feature.cross-layer-follow`                               | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.model-graph-transform`                                                                        | `product.softwarecapability.model-visualization`                   | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.page-data-builder`                                                                            | `product.feature.page-view`                                        | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.spec-graph-transform`                                                                         | `product.softwarecapability.schema-exploration`                    | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.type-bands`                                                                                   | `product.feature.model-view-by-type`                               | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.softwarecapability` | `application.applicationservice.use-annotations`                                                                              | `product.softwarecapability.model-annotation`                      | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.use-changeset-review`                                                                         | `product.feature.per-change-review`                                | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.use-tier1`                                                                                    | `product.feature.tier1-mode-and-routing`                           | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.use-tier1`                                                                                    | `product.feature.tier1-spend-panel`                                | `product`    | `realizes`   | many-to-many | medium   |
| `application.applicationservice.realizes.product.feature`            | `application.applicationservice.use-tier1`                                                                                    | `product.feature.tier1-warming-progress`                           | `product`    | `realizes`   | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                   | `product.feature.dr-bot-chat-drawer`                                                                                          | `motivation.requirement.dr-bot-opens-without-reflowing-the-canvas` | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                   | `product.feature.dr-bot-chat-drawer`                                                                                          | `motivation.requirement.wcag-21-aa-compliance`                     | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                   | `product.feature.model-graph-view`                                                                                            | `motivation.requirement.viewer-covers-every-spec-layer`            | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                   | `product.feature.model-view-by-type`                                                                                          | `motivation.requirement.wcag-21-aa-compliance`                     | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.feature.satisfies.motivation.requirement`                   | `product.feature.per-change-review`                                                                                           | `motivation.requirement.each-review-change-reads-on-its-own`       | `motivation` | `satisfies`  | many-to-many | medium   |
| `product.persona.references.business.businessrole`                   | `product.persona.architecture-reviewer`                                                                                       | `business.businessrole.architecture-reviewer`                      | `business`   | `references` | many-to-many | medium   |
| `product.persona.references.motivation.stakeholder`                  | `product.persona.architecture-reviewer`                                                                                       | `motivation.stakeholder.architecture-team`                         | `motivation` | `references` | many-to-many | medium   |
| `product.persona.references.business.businessrole`                   | `product.persona.model-author`                                                                                                | `business.businessrole.model-author`                               | `business`   | `references` | many-to-many | medium   |
| `product.persona.references.motivation.stakeholder`                  | `product.persona.model-author`                                                                                                | `motivation.stakeholder.development-team`                          | `motivation` | `references` | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.changeset-review`                                                                                 | `motivation.goal.accelerate-architecture-documentation`            | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.model-annotation`                                                                                 | `motivation.goal.enable-real-time-collaboration`                   | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.model-chat`                                                                                       | `motivation.goal.accelerate-architecture-documentation`            | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.realizes.business.businessfunction`      | `product.softwarecapability.model-visualization`                                                                              | `business.businessfunction.cross-layer-reference-resolution`       | `business`   | `realizes`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.model-visualization`                                                                              | `motivation.goal.visualize-multi-layer-architecture-models`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.softwarecapability.supports.motivation.goal`                | `product.softwarecapability.schema-exploration`                                                                               | `motivation.goal.visualize-multi-layer-architecture-models`        | `motivation` | `supports`   | many-to-many | medium   |
| `product.userworkflow.realizes.business.businessprocess`             | `product.userworkflow.review-a-staged-changeset`                                                                              | `business.businessprocess.changeset-review-flow`                   | `business`   | `realizes`   | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.model-view-control-switches-between-graph-lanes-and-hive-and-persists`                                | `product.feature.model-view-by-type`                               | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.tier1panel-mode-and-routing-lists-open-routers-allowed-upstreams-no-fallbacks-and-no-data-collection` | `product.feature.tier1-mode-and-routing`                           | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.tier1panel-mode-and-routing-says-whether-tier-1-stages-without-the-agent-and-why`                     | `product.feature.tier1-mode-and-routing`                           | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.tier1panel-warming-says-the-cards-are-still-being-built-while-cards-is-null`                          | `product.feature.tier1-warming-progress`                           | `product`    | `tests`      | many-to-many | medium   |
| `testing.testcasesketch.tests.product.feature`                       | `testing.testcasesketch.tier1panel-warming-shows-the-fills-progress-time-left-and-cost-so-far`                                | `product.feature.tier1-warming-progress`                           | `product`    | `tests`      | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.changesets-view`                                                                                                     | `product.feature.changeset-inbox`                                  | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.changesets-view`                                                                                                     | `product.feature.per-change-review`                                | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.changesets-view`                                                                                                     | `product.feature.tier1-mode-and-routing`                           | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.changesets-view`                                                                                                     | `product.feature.tier1-warming-progress`                           | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.dr-bot-chat-drawer`                                                                                                  | `product.feature.dr-bot-chat-drawer`                               | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.inspector-drawer`                                                                                                    | `product.feature.cross-layer-follow`                               | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.inspector-drawer`                                                                                                    | `product.feature.element-annotations`                              | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.model-view`                                                                                                          | `product.feature.model-graph-view`                                 | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.model-view`                                                                                                          | `product.feature.model-view-by-type`                               | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`                                   | `ux.view.schema-view`                                                                                                         | `product.feature.schema-graph-view`                                | `product`    | `realizes`   | many-to-many | medium   |

## Element Reference

### Change Origin Badges {#change-origin-badges}

**ID**: `product.feature.change-origin-badges`

**Type**: `feature`

Who decided each staged change (Tier 0 rule, Tier 1 model, agent), with a Decided by filter.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element                                        | Predicate  | Direction |
| ----------- | ------------------------------------------------------ | ---------- | --------- |
| inter-layer | `application.applicationservice.change-origin-helpers` | `realizes` | inbound   |
| intra-layer | `product.softwarecapability.changeset-review`          | `realizes` | outbound  |
| intra-layer | `product.persona.architecture-reviewer`                | `serves`   | outbound  |

### Changeset Impact Tab {#changeset-impact-tab}

**ID**: `product.feature.changeset-impact-tab`

**Type**: `feature`

What a changeset reaches outside itself, as layer lanes, before Apply.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | high      |
| status   | delivered |

#### Relationships

| Type        | Related Element                                            | Predicate  | Direction |
| ----------- | ---------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.changeset-impact-analysis` | `realizes` | inbound   |
| intra-layer | `product.softwarecapability.changeset-review`              | `realizes` | outbound  |
| intra-layer | `product.persona.architecture-reviewer`                    | `serves`   | outbound  |
| intra-layer | `product.workflowstep.check-the-reach`                     | `uses`     | inbound   |

### Changeset Inbox {#changeset-inbox}

**ID**: `product.feature.changeset-inbox`

**Type**: `feature`

Changesets sorted by what they need from you: plans and DrBot's changes waiting on you or on DrBot (with review progress), extracted changes ready to land as built, verification records paired with the plan they verify, then the history.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | high      |
| status   | delivered |

#### Relationships

| Type        | Related Element                                   | Predicate  | Direction |
| ----------- | ------------------------------------------------- | ---------- | --------- |
| inter-layer | `ux.view.changesets-view`                         | `realizes` | inbound   |
| intra-layer | `product.softwarecapability.changeset-review`     | `realizes` | outbound  |
| intra-layer | `product.persona.architecture-reviewer`           | `serves`   | outbound  |
| intra-layer | `product.workflowstep.pick-a-changeset-to-review` | `uses`     | inbound   |

### Cross-Layer Follow {#cross-layer-follow}

**ID**: `product.feature.cross-layer-follow`

**Type**: `feature`

The inspector's Followed across layers section: the selection's reach past its direct links, by layer.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element                                  | Predicate  | Direction |
| ----------- | ------------------------------------------------ | ---------- | --------- |
| inter-layer | `application.applicationservice.layered-reach`   | `realizes` | inbound   |
| inter-layer | `ux.view.inspector-drawer`                       | `realizes` | inbound   |
| intra-layer | `product.softwarecapability.model-visualization` | `realizes` | outbound  |
| intra-layer | `product.persona.architecture-reviewer`          | `serves`   | outbound  |

### DrBot Chat Drawer {#drbot-chat-drawer}

**ID**: `product.feature.dr-bot-chat-drawer`

**Type**: `feature`

Streaming chat with DrBot that carries the current view and selection as context, in a floating panel that leaves the canvas and the Inspector in place (or a docked column, by choice).

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | high      |
| status   | delivered |

#### Relationships

| Type        | Related Element                                                    | Predicate   | Direction |
| ----------- | ------------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `motivation.requirement.dr-bot-opens-without-reflowing-the-canvas` | `satisfies` | outbound  |
| inter-layer | `motivation.requirement.wcag-21-aa-compliance`                     | `satisfies` | outbound  |
| inter-layer | `ux.view.dr-bot-chat-drawer`                                       | `realizes`  | inbound   |
| intra-layer | `product.softwarecapability.model-chat`                            | `realizes`  | outbound  |
| intra-layer | `product.persona.model-author`                                     | `serves`    | outbound  |

### Element Annotations {#element-annotations}

**ID**: `product.feature.element-annotations`

**Type**: `feature`

Comments and replies on model elements in the inspector, resolved or edited in place.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element                               | Predicate  | Direction |
| ----------- | --------------------------------------------- | ---------- | --------- |
| inter-layer | `ux.view.inspector-drawer`                    | `realizes` | inbound   |
| intra-layer | `product.softwarecapability.model-annotation` | `realizes` | outbound  |
| intra-layer | `product.persona.architecture-reviewer`       | `serves`   | outbound  |

### Model Graph View {#model-graph-view}

**ID**: `product.feature.model-graph-view`

**Type**: `feature`

Per-layer instance graph with Clustered, Organic and Orthogonal layouts, card or pill nodes and the inspector drawer.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | critical  |
| status   | delivered |

#### Relationships

| Type        | Related Element                                         | Predicate   | Direction |
| ----------- | ------------------------------------------------------- | ----------- | --------- |
| inter-layer | `motivation.requirement.viewer-covers-every-spec-layer` | `satisfies` | outbound  |
| inter-layer | `ux.view.model-view`                                    | `realizes`  | inbound   |
| intra-layer | `product.softwarecapability.model-visualization`        | `realizes`  | outbound  |
| intra-layer | `product.persona.architecture-reviewer`                 | `serves`    | outbound  |
| intra-layer | `product.persona.model-author`                          | `serves`    | outbound  |

### Model View by Type {#model-view-by-type}

**ID**: `product.feature.model-view-by-type`

**Type**: `feature`

See one DR layer's elements grouped by node type: lanes (one per type, linked types adjacent) or a hive (one axis per type), chosen in the Model view's View control beside Layout.

#### Attributes

| Name     | Value   |
| -------- | ------- |
| priority | medium  |
| size     | m       |
| status   | planned |

#### Relationships

| Type        | Related Element                                                                                | Predicate   | Direction |
| ----------- | ---------------------------------------------------------------------------------------------- | ----------- | --------- |
| inter-layer | `application.applicationservice.type-bands`                                                    | `realizes`  | inbound   |
| inter-layer | `motivation.requirement.wcag-21-aa-compliance`                                                 | `satisfies` | outbound  |
| inter-layer | `testing.testcasesketch.model-view-control-switches-between-graph-lanes-and-hive-and-persists` | `tests`     | inbound   |
| inter-layer | `ux.view.model-view`                                                                           | `realizes`  | inbound   |
| intra-layer | `product.softwarecapability.model-visualization`                                               | `realizes`  | outbound  |
| intra-layer | `product.persona.architecture-reviewer`                                                        | `serves`    | outbound  |
| intra-layer | `product.persona.model-author`                                                                 | `serves`    | outbound  |

### Page View {#page-view}

**ID**: `product.feature.page-view`

**Type**: `feature`

Layer, node type and element detail pages with tables and a neighbourhood graph.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element                                    | Predicate  | Direction |
| ----------- | -------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.page-data-builder` | `realizes` | inbound   |
| intra-layer | `product.softwarecapability.model-visualization`   | `realizes` | outbound  |
| intra-layer | `product.persona.architecture-reviewer`            | `serves`   | outbound  |

### Per-Change Review {#per-change-review}

**ID**: `product.feature.per-change-review`

**Type**: `feature`

Keep, Drop or Ask DrBot on each change, grouped by review weight, with the change inspector and Apply of the kept ones.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | critical  |
| status   | delivered |

#### Relationships

| Type        | Related Element                                              | Predicate   | Direction |
| ----------- | ------------------------------------------------------------ | ----------- | --------- |
| inter-layer | `api.operation.put-api-changesets-changeset-id-review`       | `exposes`   | inbound   |
| inter-layer | `application.applicationservice.use-changeset-review`        | `realizes`  | inbound   |
| inter-layer | `motivation.requirement.each-review-change-reads-on-its-own` | `satisfies` | outbound  |
| inter-layer | `ux.view.changesets-view`                                    | `realizes`  | inbound   |
| intra-layer | `product.softwarecapability.changeset-review`                | `realizes`  | outbound  |
| intra-layer | `product.persona.architecture-reviewer`                      | `serves`    | outbound  |
| intra-layer | `product.workflowstep.apply-the-kept-changes`                | `uses`      | inbound   |
| intra-layer | `product.workflowstep.decide-each-change`                    | `uses`      | inbound   |

### Schema Graph View {#schema-graph-view}

**ID**: `product.feature.schema-graph-view`

**Type**: `feature`

Per-layer node-type graph with predicates and cardinality.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | medium    |
| status   | delivered |

#### Relationships

| Type        | Related Element                                 | Predicate  | Direction |
| ----------- | ----------------------------------------------- | ---------- | --------- |
| inter-layer | `ux.view.schema-view`                           | `realizes` | inbound   |
| intra-layer | `product.softwarecapability.schema-exploration` | `realizes` | outbound  |
| intra-layer | `product.persona.model-author`                  | `serves`   | outbound  |

### Tier1 Mode And Routing {#tier1-mode-and-routing}

**ID**: `product.feature.tier1-mode-and-routing`

**Type**: `feature`

The Tier 1 panel says whether Tier 1 stages changes without the agent or only suggests them (with the server's reason), and, for OpenRouter, which upstreams may receive card text, with no fallbacks, no data collection and zero data retention when set.

#### Attributes

| Name     | Value   |
| -------- | ------- |
| priority | low     |
| size     | s       |
| status   | planned |

#### Relationships

| Type        | Related Element                                                                                                               | Predicate    | Direction |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `api.operation.get-api-tier1`                                                                                                 | `exposes`    | inbound   |
| inter-layer | `application.applicationservice.use-tier1`                                                                                    | `realizes`   | inbound   |
| inter-layer | `testing.testcasesketch.tier1panel-mode-and-routing-lists-open-routers-allowed-upstreams-no-fallbacks-and-no-data-collection` | `tests`      | inbound   |
| inter-layer | `testing.testcasesketch.tier1panel-mode-and-routing-says-whether-tier-1-stages-without-the-agent-and-why`                     | `tests`      | inbound   |
| inter-layer | `ux.view.changesets-view`                                                                                                     | `realizes`   | inbound   |
| intra-layer | `product.feature.tier1-spend-panel`                                                                                           | `depends-on` | outbound  |
| intra-layer | `product.softwarecapability.changeset-review`                                                                                 | `realizes`   | outbound  |
| intra-layer | `product.persona.model-author`                                                                                                | `serves`     | outbound  |

### Tier1 Spend Panel {#tier1-spend-panel}

**ID**: `product.feature.tier1-spend-panel`

**Type**: `feature`

Tier 1's state and this month's spend against the cap, in the changeset inbox. The warming progress and the mode and routing rows build on it.

#### Attributes

| Name     | Value     |
| -------- | --------- |
| priority | low       |
| status   | delivered |

#### Relationships

| Type        | Related Element                               | Predicate    | Direction |
| ----------- | --------------------------------------------- | ------------ | --------- |
| inter-layer | `api.operation.get-api-tier1`                 | `exposes`    | inbound   |
| inter-layer | `application.applicationservice.use-tier1`    | `realizes`   | inbound   |
| intra-layer | `product.feature.tier1-mode-and-routing`      | `depends-on` | inbound   |
| intra-layer | `product.softwarecapability.changeset-review` | `realizes`   | outbound  |
| intra-layer | `product.persona.model-author`                | `serves`     | outbound  |
| intra-layer | `product.feature.tier1-warming-progress`      | `depends-on` | inbound   |

### Tier1 Warming Progress {#tier1-warming-progress}

**ID**: `product.feature.tier1-warming-progress`

**Type**: `feature`

While Tier 1 warms up (a codebase_index job filling the answer cache), the Tier 1 panel shows how many cards are done out of the total (or that the cards are still being built), when the fill started, about how long it has left and what it has cost so far, and refreshes until the fill ends.

#### Attributes

| Name     | Value   |
| -------- | ------- |
| priority | low     |
| size     | s       |
| status   | planned |

#### Relationships

| Type        | Related Element                                                                                      | Predicate    | Direction |
| ----------- | ---------------------------------------------------------------------------------------------------- | ------------ | --------- |
| inter-layer | `api.operation.get-api-tier1`                                                                        | `exposes`    | inbound   |
| inter-layer | `application.applicationservice.use-tier1`                                                           | `realizes`   | inbound   |
| inter-layer | `testing.testcasesketch.tier1panel-warming-says-the-cards-are-still-being-built-while-cards-is-null` | `tests`      | inbound   |
| inter-layer | `testing.testcasesketch.tier1panel-warming-shows-the-fills-progress-time-left-and-cost-so-far`       | `tests`      | inbound   |
| inter-layer | `ux.view.changesets-view`                                                                            | `realizes`   | inbound   |
| intra-layer | `product.feature.tier1-spend-panel`                                                                  | `depends-on` | outbound  |
| intra-layer | `product.softwarecapability.changeset-review`                                                        | `realizes`   | outbound  |
| intra-layer | `product.persona.model-author`                                                                       | `serves`     | outbound  |

### Architecture Reviewer {#architecture-reviewer}

**ID**: `product.persona.architecture-reviewer`

**Type**: `persona`

Reads a DR model and the changesets proposed against it, decides each change, and leaves comments; usually an architect or engineer reviewing an agent's or a colleague's plan.

#### Attributes

| Name        | Value        |
| ----------- | ------------ |
| category    | primary      |
| proficiency | intermediate |

#### Relationships

| Type        | Related Element                                  | Predicate    | Direction |
| ----------- | ------------------------------------------------ | ------------ | --------- |
| inter-layer | `business.businessrole.architecture-reviewer`    | `references` | outbound  |
| inter-layer | `motivation.stakeholder.architecture-team`       | `references` | outbound  |
| intra-layer | `product.feature.change-origin-badges`           | `serves`     | inbound   |
| intra-layer | `product.feature.changeset-impact-tab`           | `serves`     | inbound   |
| intra-layer | `product.feature.changeset-inbox`                | `serves`     | inbound   |
| intra-layer | `product.feature.cross-layer-follow`             | `serves`     | inbound   |
| intra-layer | `product.feature.element-annotations`            | `serves`     | inbound   |
| intra-layer | `product.feature.model-graph-view`               | `serves`     | inbound   |
| intra-layer | `product.feature.model-view-by-type`             | `serves`     | inbound   |
| intra-layer | `product.feature.page-view`                      | `serves`     | inbound   |
| intra-layer | `product.feature.per-change-review`              | `serves`     | inbound   |
| intra-layer | `product.userworkflow.review-a-staged-changeset` | `serves`     | inbound   |

### Model Author {#model-author}

**ID**: `product.persona.model-author`

**Type**: `persona`

Builds and evolves the DR model with the dr CLI and its agents; uses the viewer to see the result, explore the schema and ask DrBot.

#### Attributes

| Name        | Value    |
| ----------- | -------- |
| category    | primary  |
| proficiency | advanced |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| inter-layer | `business.businessrole.model-author`      | `references` | outbound  |
| inter-layer | `motivation.stakeholder.development-team` | `references` | outbound  |
| intra-layer | `product.feature.dr-bot-chat-drawer`      | `serves`     | inbound   |
| intra-layer | `product.feature.model-graph-view`        | `serves`     | inbound   |
| intra-layer | `product.feature.model-view-by-type`      | `serves`     | inbound   |
| intra-layer | `product.feature.schema-graph-view`       | `serves`     | inbound   |
| intra-layer | `product.feature.tier1-mode-and-routing`  | `serves`     | inbound   |
| intra-layer | `product.feature.tier1-spend-panel`       | `serves`     | inbound   |
| intra-layer | `product.feature.tier1-warming-progress`  | `serves`     | inbound   |

### Changeset Review {#changeset-review}

**ID**: `product.softwarecapability.changeset-review`

**Type**: `softwarecapability`

Review a staged changeset change by change, see what it reaches, and apply or discard it.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                         | Predicate  | Direction |
| ----------- | ------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.changeset-review-model` | `realizes` | inbound   |
| inter-layer | `motivation.goal.accelerate-architecture-documentation` | `supports` | outbound  |
| intra-layer | `product.feature.change-origin-badges`                  | `realizes` | inbound   |
| intra-layer | `product.feature.changeset-impact-tab`                  | `realizes` | inbound   |
| intra-layer | `product.feature.changeset-inbox`                       | `realizes` | inbound   |
| intra-layer | `product.feature.per-change-review`                     | `realizes` | inbound   |
| intra-layer | `product.feature.tier1-mode-and-routing`                | `realizes` | inbound   |
| intra-layer | `product.feature.tier1-spend-panel`                     | `realizes` | inbound   |
| intra-layer | `product.feature.tier1-warming-progress`                | `realizes` | inbound   |

### Model Annotation {#model-annotation}

**ID**: `product.softwarecapability.model-annotation`

**Type**: `softwarecapability`

Comment on model elements, with replies, live across viewers and agents.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                  | Predicate  | Direction |
| ----------- | ------------------------------------------------ | ---------- | --------- |
| inter-layer | `application.applicationservice.use-annotations` | `realizes` | inbound   |
| inter-layer | `motivation.goal.enable-real-time-collaboration` | `supports` | outbound  |
| intra-layer | `product.feature.element-annotations`            | `realizes` | inbound   |

### Model Chat {#model-chat}

**ID**: `product.softwarecapability.model-chat`

**Type**: `softwarecapability`

Ask DrBot about the model, scoped to what is on screen.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                         | Predicate  | Direction |
| ----------- | ------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.chat-service`           | `realizes` | inbound   |
| inter-layer | `motivation.goal.accelerate-architecture-documentation` | `supports` | outbound  |
| intra-layer | `product.feature.dr-bot-chat-drawer`                    | `realizes` | inbound   |

### Model Visualization {#model-visualization}

**ID**: `product.softwarecapability.model-visualization`

**Type**: `softwarecapability`

Render a DR model layer by layer as a navigable graph or as pages, with relationships followed across layers.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                              | Predicate  | Direction |
| ----------- | ------------------------------------------------------------ | ---------- | --------- |
| inter-layer | `application.applicationservice.model-graph-transform`       | `realizes` | inbound   |
| inter-layer | `business.businessfunction.cross-layer-reference-resolution` | `realizes` | outbound  |
| inter-layer | `motivation.goal.visualize-multi-layer-architecture-models`  | `supports` | outbound  |
| intra-layer | `product.feature.cross-layer-follow`                         | `realizes` | inbound   |
| intra-layer | `product.feature.model-graph-view`                           | `realizes` | inbound   |
| intra-layer | `product.feature.model-view-by-type`                         | `realizes` | inbound   |
| intra-layer | `product.feature.page-view`                                  | `realizes` | inbound   |

### Schema Exploration {#schema-exploration}

**ID**: `product.softwarecapability.schema-exploration`

**Type**: `softwarecapability`

Show the DR spec's node types and allowed relationships per layer.

#### Attributes

| Name   | Value     |
| ------ | --------- |
| status | delivered |

#### Relationships

| Type        | Related Element                                             | Predicate  | Direction |
| ----------- | ----------------------------------------------------------- | ---------- | --------- |
| inter-layer | `application.applicationservice.spec-graph-transform`       | `realizes` | inbound   |
| inter-layer | `motivation.goal.visualize-multi-layer-architecture-models` | `supports` | outbound  |
| intra-layer | `product.feature.schema-graph-view`                         | `realizes` | inbound   |

### Review a Staged Changeset {#review-a-staged-changeset}

**ID**: `product.userworkflow.review-a-staged-changeset`

**Type**: `userworkflow`

From the inbox to an applied changeset: open it, decide each change, check its reach, apply what was kept.

#### Attributes

| Name       | Value    |
| ---------- | -------- |
| complexity | moderate |

#### Relationships

| Type        | Related Element                                   | Predicate  | Direction |
| ----------- | ------------------------------------------------- | ---------- | --------- |
| inter-layer | `business.businessprocess.changeset-review-flow`  | `realizes` | outbound  |
| intra-layer | `product.workflowstep.apply-the-kept-changes`     | `composes` | outbound  |
| intra-layer | `product.workflowstep.check-the-reach`            | `composes` | outbound  |
| intra-layer | `product.workflowstep.decide-each-change`         | `composes` | outbound  |
| intra-layer | `product.workflowstep.pick-a-changeset-to-review` | `composes` | outbound  |
| intra-layer | `product.persona.architecture-reviewer`           | `serves`   | outbound  |

### Apply the Kept Changes {#apply-the-kept-changes}

**ID**: `product.workflowstep.apply-the-kept-changes`

**Type**: `workflowstep`

The reviewer confirms what lands and what is left out, and the kept changes are written to the model.

#### Attributes

| Name     | Value               |
| -------- | ------------------- |
| action   | Apply the changeset |
| sequence | 4                   |

#### Relationships

| Type        | Related Element                                  | Predicate  | Direction |
| ----------- | ------------------------------------------------ | ---------- | --------- |
| intra-layer | `product.userworkflow.review-a-staged-changeset` | `composes` | inbound   |
| intra-layer | `product.feature.per-change-review`              | `uses`     | outbound  |
| intra-layer | `product.workflowstep.check-the-reach`           | `flows-to` | inbound   |

### Check the Reach {#check-the-reach}

**ID**: `product.workflowstep.check-the-reach`

**Type**: `workflowstep`

The reviewer sees which existing elements the change reaches in other layers.

#### Attributes

| Name     | Value                                          |
| -------- | ---------------------------------------------- |
| action   | Look at the changeset's impact before applying |
| sequence | 3                                              |

#### Relationships

| Type        | Related Element                                  | Predicate  | Direction |
| ----------- | ------------------------------------------------ | ---------- | --------- |
| intra-layer | `product.userworkflow.review-a-staged-changeset` | `composes` | inbound   |
| intra-layer | `product.workflowstep.apply-the-kept-changes`    | `flows-to` | outbound  |
| intra-layer | `product.feature.changeset-impact-tab`           | `uses`     | outbound  |
| intra-layer | `product.workflowstep.decide-each-change`        | `flows-to` | inbound   |

### Decide Each Change {#decide-each-change}

**ID**: `product.workflowstep.decide-each-change`

**Type**: `workflowstep`

The reviewer keeps, drops or asks about each change, reading its before and after and its links.

#### Attributes

| Name     | Value                       |
| -------- | --------------------------- |
| action   | Give every change a verdict |
| sequence | 2                           |

#### Relationships

| Type        | Related Element                                   | Predicate  | Direction |
| ----------- | ------------------------------------------------- | ---------- | --------- |
| intra-layer | `product.userworkflow.review-a-staged-changeset`  | `composes` | inbound   |
| intra-layer | `product.workflowstep.check-the-reach`            | `flows-to` | outbound  |
| intra-layer | `product.feature.per-change-review`               | `uses`     | outbound  |
| intra-layer | `product.workflowstep.pick-a-changeset-to-review` | `flows-to` | inbound   |

### Pick a Changeset to Review {#pick-a-changeset-to-review}

**ID**: `product.workflowstep.pick-a-changeset-to-review`

**Type**: `workflowstep`

The reviewer sees which staged changesets wait on them and opens one.

#### Attributes

| Name     | Value                                          |
| -------- | ---------------------------------------------- |
| action   | Open a changeset waiting on you from the inbox |
| sequence | 1                                              |

#### Relationships

| Type        | Related Element                                  | Predicate  | Direction |
| ----------- | ------------------------------------------------ | ---------- | --------- |
| intra-layer | `product.userworkflow.review-a-staged-changeset` | `composes` | inbound   |
| intra-layer | `product.workflowstep.decide-each-change`        | `flows-to` | outbound  |
| intra-layer | `product.feature.changeset-inbox`                | `uses`     | outbound  |

---

Generated: 2026-11-19T18:28:15.734Z | Model Version: 0.1.0
