# UX

[← Back to README](../README.md)

User interface components, screens, and user experience elements.

## Report Index

- [Layer Introduction](#layer-introduction)
- [Intra-Layer Relationships](#intra-layer-relationships)
- [Inter-Layer Dependencies](#inter-layer-dependencies)
- [Inter-Layer Relationships Table](#inter-layer-relationships-table)
- [Element Reference](#element-reference)

## Layer Introduction

| Metric                    | Count |
| ------------------------- | ----- |
| Elements                  | 17    |
| Intra-Layer Relationships | 15    |
| Inter-Layer Relationships | 30    |
| Inbound Relationships     | 4     |
| Outbound Relationships    | 26    |

**Cross-Layer References**:

- **Upstream layers**: [Navigation](./11-navigation-layer-report.md), [Testing](./13-testing-layer-report.md)
- **Downstream layers**: [Business](./02-business-layer-report.md), [Motivation](./01-motivation-layer-report.md), [Product](./03-product-layer-report.md), [Technology](./06-technology-layer-report.md)

## Intra-Layer Relationships

```mermaid
flowchart LR
  subgraph ux
    ux_statepattern_authentication_flow_pattern["Authentication Flow Pattern"]
    ux_statepattern_data_loading_pattern["Data Loading Pattern"]
    ux_subview_change_inspector_panel["Change Inspector Panel"]
    ux_subview_changeset_impact_tab["Changeset Impact Tab"]
    ux_subview_changeset_inbox["Changeset Inbox"]
    ux_subview_changeset_review_list["Changeset Review List"]
    ux_subview_page_view["Page View"]
    ux_subview_tier1_panel["Tier1 Panel"]
    ux_uxapplication_embedded_architecture_viewer["Embedded Architecture Viewer"]
    ux_uxspec_architecture_exploration_spec["Architecture Exploration Spec"]
    ux_uxspec_authentication_spec["Authentication Spec"]
    ux_view_auth_view["Auth View"]
    ux_view_changesets_view["Changesets View"]
    ux_view_dr_bot_chat_drawer["DrBot Chat Drawer"]
    ux_view_inspector_drawer["Inspector Drawer"]
    ux_view_model_view["Model View"]
    ux_view_schema_view["Schema View"]
    ux_statepattern_authentication_flow_pattern -->|specializes| ux_statepattern_data_loading_pattern
    ux_uxapplication_embedded_architecture_viewer -->|aggregates| ux_uxspec_architecture_exploration_spec
    ux_uxspec_architecture_exploration_spec -->|aggregates| ux_view_changesets_view
    ux_uxspec_architecture_exploration_spec -->|aggregates| ux_view_dr_bot_chat_drawer
    ux_uxspec_architecture_exploration_spec -->|aggregates| ux_view_inspector_drawer
    ux_uxspec_architecture_exploration_spec -->|aggregates| ux_view_model_view
    ux_uxspec_architecture_exploration_spec -->|aggregates| ux_view_schema_view
    ux_uxspec_authentication_spec -->|aggregates| ux_view_auth_view
    ux_view_changesets_view -->|composes| ux_subview_change_inspector_panel
    ux_view_changesets_view -->|composes| ux_subview_changeset_impact_tab
    ux_view_changesets_view -->|composes| ux_subview_changeset_inbox
    ux_view_changesets_view -->|composes| ux_subview_changeset_review_list
    ux_view_changesets_view -->|composes| ux_subview_tier1_panel
    ux_view_model_view -->|composes| ux_subview_page_view
    ux_view_schema_view -->|composes| ux_subview_page_view
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
  navigation --> ux
  testing --> ux
  ux --> business
  ux --> motivation
  ux --> product
  ux --> technology
  class ux current
```

## Inter-Layer Relationships Table

| Relationship ID                                | Source Node                                                                                                              | Dest Node                                                    | Dest Layer   | Predicate    | Cardinality  | Strength |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------ | ------------ | ------------ | -------- |
| `navigation.route.maps-to.ux.view`             | `navigation.route.app-shell-sectionview-route`                                                                           | `ux.view.changesets-view`                                    | `ux`         | `maps-to`    | many-to-many | medium   |
| `navigation.route.maps-to.ux.view`             | `navigation.route.app-shell-sectionview-route`                                                                           | `ux.view.model-view`                                         | `ux`         | `maps-to`    | many-to-many | medium   |
| `navigation.route.maps-to.ux.view`             | `navigation.route.app-shell-sectionview-route`                                                                           | `ux.view.schema-view`                                        | `ux`         | `maps-to`    | many-to-many | medium   |
| `testing.testcasesketch.tests.ux.subview`      | `testing.testcasesketch.page-view-shows-the-description-above-the-facts-as-markdown-and-leaves-it-out-of-the-facts-grid` | `ux.subview.page-view`                                       | `ux`         | `tests`      | many-to-many | medium   |
| `ux.uxspec.satisfies.motivation.requirement`   | `ux.uxspec.architecture-exploration-spec`                                                                                | `motivation.requirement.viewer-covers-every-spec-layer`      | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.uxspec.satisfies.motivation.requirement`   | `ux.uxspec.authentication-spec`                                                                                          | `motivation.requirement.dr-cli-server-integration`           | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.view.depends-on.technology.systemsoftware` | `ux.view.changesets-view`                                                                                                | `technology.systemsoftware.heimdall-ui`                      | `technology` | `depends-on` | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.changesets-view`                                                                                                | `product.feature.changeset-inbox`                            | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.changesets-view`                                                                                                | `product.feature.per-change-review`                          | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.changesets-view`                                                                                                | `product.feature.tier1-mode-and-routing`                     | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.changesets-view`                                                                                                | `product.feature.tier1-warming-progress`                     | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.references.business.businessobject`   | `ux.view.changesets-view`                                                                                                | `business.businessobject.changeset`                          | `business`   | `references` | many-to-many | medium   |
| `ux.view.satisfies.motivation.requirement`     | `ux.view.changesets-view`                                                                                                | `motivation.requirement.each-review-change-reads-on-its-own` | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.view.satisfies.motivation.requirement`     | `ux.view.changesets-view`                                                                                                | `motivation.requirement.wcag-21-aa-compliance`               | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.view.serves.business.businessrole`         | `ux.view.changesets-view`                                                                                                | `business.businessrole.architecture-reviewer`                | `business`   | `serves`     | many-to-many | medium   |
| `ux.view.supports.motivation.goal`             | `ux.view.changesets-view`                                                                                                | `motivation.goal.enable-real-time-collaboration`             | `motivation` | `supports`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.dr-bot-chat-drawer`                                                                                             | `product.feature.dr-bot-chat-drawer`                         | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.serves.business.businessrole`         | `ux.view.dr-bot-chat-drawer`                                                                                             | `business.businessrole.model-author`                         | `business`   | `serves`     | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.inspector-drawer`                                                                                               | `product.feature.cross-layer-follow`                         | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.inspector-drawer`                                                                                               | `product.feature.element-annotations`                        | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.references.business.businessobject`   | `ux.view.inspector-drawer`                                                                                               | `business.businessobject.annotation`                         | `business`   | `references` | many-to-many | medium   |
| `ux.view.depends-on.technology.systemsoftware` | `ux.view.model-view`                                                                                                     | `technology.systemsoftware.heimdall-ui`                      | `technology` | `depends-on` | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.model-view`                                                                                                     | `product.feature.model-graph-view`                           | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.references.business.businessobject`   | `ux.view.model-view`                                                                                                     | `business.businessobject.architecture-model`                 | `business`   | `references` | many-to-many | medium   |
| `ux.view.satisfies.motivation.requirement`     | `ux.view.model-view`                                                                                                     | `motivation.requirement.wcag-21-aa-compliance`               | `motivation` | `satisfies`  | many-to-many | medium   |
| `ux.view.serves.business.businessrole`         | `ux.view.model-view`                                                                                                     | `business.businessrole.architecture-reviewer`                | `business`   | `serves`     | many-to-many | medium   |
| `ux.view.supports.motivation.goal`             | `ux.view.model-view`                                                                                                     | `motivation.goal.visualize-multi-layer-architecture-models`  | `motivation` | `supports`   | many-to-many | medium   |
| `ux.view.realizes.product.feature`             | `ux.view.schema-view`                                                                                                    | `product.feature.schema-graph-view`                          | `product`    | `realizes`   | many-to-many | medium   |
| `ux.view.references.business.businessobject`   | `ux.view.schema-view`                                                                                                    | `business.businessobject.architecture-model`                 | `business`   | `references` | many-to-many | medium   |
| `ux.view.satisfies.motivation.requirement`     | `ux.view.schema-view`                                                                                                    | `motivation.requirement.wcag-21-aa-compliance`               | `motivation` | `satisfies`  | many-to-many | medium   |

## Element Reference

### Authentication Flow Pattern {#authentication-flow-pattern}

**ID**: `ux.statepattern.authentication-flow-pattern`

**Type**: `statepattern`

Multi-step UX state machine for the token-based authentication flow; states: unauthenticated → extracting-token → validating → authenticated; handles invalid token rejection.

#### Attributes

| Name     | Value          |
| -------- | -------------- |
| category | authentication |

#### Relationships

| Type        | Related Element                        | Predicate     | Direction |
| ----------- | -------------------------------------- | ------------- | --------- |
| intra-layer | `ux.statepattern.data-loading-pattern` | `specializes` | outbound  |

### Data Loading Pattern {#data-loading-pattern}

**ID**: `ux.statepattern.data-loading-pattern`

**Type**: `statepattern`

Standard data-loading state pattern used across all views; states: idle → loading → loaded/error; with optional retry action on error state.

#### Attributes

| Name     | Value        |
| -------- | ------------ |
| category | data-loading |

#### Relationships

| Type        | Related Element                               | Predicate     | Direction |
| ----------- | --------------------------------------------- | ------------- | --------- |
| intra-layer | `ux.statepattern.authentication-flow-pattern` | `specializes` | inbound   |

### Change Inspector Panel {#change-inspector-panel}

**ID**: `ux.subview.change-inspector-panel`

**Type**: `subview`

The Changesets view's inspector with one change selected: layer band, labelled change and decision, link card, neighbourhood, links with direction, source reference.

#### Attributes

| Name  | Value  |
| ----- | ------ |
| title | Change |

#### Relationships

| Type        | Related Element           | Predicate  | Direction |
| ----------- | ------------------------- | ---------- | --------- |
| intra-layer | `ux.view.changesets-view` | `composes` | inbound   |

### Changeset Impact Tab {#changeset-impact-tab}

**ID**: `ux.subview.changeset-impact-tab`

**Type**: `subview`

The Changesets view's Impact tab: layer lanes of what the changed elements reach, with Find, Show, Follow, filter facets, grouped large lanes and a focus breadcrumb.

#### Relationships

| Type        | Related Element           | Predicate  | Direction |
| ----------- | ------------------------- | ---------- | --------- |
| intra-layer | `ux.view.changesets-view` | `composes` | inbound   |

### Changeset Inbox {#changeset-inbox}

**ID**: `ux.subview.changeset-inbox`

**Type**: `subview`

The Changesets view with no changeset open: changesets sorted by purpose and what they need (waiting on you or on DrBot, ready to land as built, verification records paired with their plan), then the history with each one's purpose.

#### Attributes

| Name  | Value |
| ----- | ----- |
| title | Inbox |

#### Relationships

| Type        | Related Element           | Predicate  | Direction |
| ----------- | ------------------------- | ---------- | --------- |
| intra-layer | `ux.view.changesets-view` | `composes` | inbound   |

### Changeset Review List {#changeset-review-list}

**ID**: `ux.subview.changeset-review-list`

**Type**: `subview`

The Changesets view's Review tab: labelled columns, change chips, decision pills and link chains.

#### Attributes

| Name  | Value  |
| ----- | ------ |
| title | Review |

#### Relationships

| Type        | Related Element           | Predicate  | Direction |
| ----------- | ------------------------- | ---------- | --------- |
| intra-layer | `ux.view.changesets-view` | `composes` | inbound   |

### Page View {#page-view}

**ID**: `ux.subview.page-view`

**Type**: `subview`

The page mode of the Model and Schema views (#/model/page): a layer, node type or element as a detail page with tables and a neighbourhood graph.

#### Attributes

| Name  | Value |
| ----- | ----- |
| title | Page  |

#### Relationships

| Type        | Related Element                                                                                                          | Predicate  | Direction |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- | --------- |
| inter-layer | `testing.testcasesketch.page-view-shows-the-description-above-the-facts-as-markdown-and-leaves-it-out-of-the-facts-grid` | `tests`    | inbound   |
| intra-layer | `ux.view.model-view`                                                                                                     | `composes` | inbound   |
| intra-layer | `ux.view.schema-view`                                                                                                    | `composes` | inbound   |

### Tier1 Panel {#tier1-panel}

**ID**: `ux.subview.tier1-panel`

**Type**: `subview`

Tier 1 state and this month's spend, above the inbox history; while warming, the fill's progress; the mode (stages without the agent / suggests only) and, for OpenRouter, where card text may go.

#### Attributes

| Name  | Value  |
| ----- | ------ |
| title | Tier 1 |

#### Relationships

| Type        | Related Element           | Predicate  | Direction |
| ----------- | ------------------------- | ---------- | --------- |
| intra-layer | `ux.view.changesets-view` | `composes` | inbound   |

### Embedded Architecture Viewer {#embedded-architecture-viewer}

**ID**: `ux.uxapplication.embedded-architecture-viewer`

**Type**: `uxapplication`

The Documentation Robotics Viewer: a React app built on the Heimdall design system and served by `dr visualize`. Dark shell around a light/dark canvas with a sidebar nav tree, Model / Schema / Changesets views (graph or page mode), an inspector drawer, and the DrBot chat drawer.

#### Attributes

| Name    | Value |
| ------- | ----- |
| channel | web   |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| intra-layer | `ux.uxspec.architecture-exploration-spec` | `aggregates` | outbound  |

### Architecture Exploration Spec {#architecture-exploration-spec}

**ID**: `ux.uxspec.architecture-exploration-spec`

**Type**: `uxspec`

The viewer's main experience: browse the model and the spec layer by layer as graphs or pages, inspect elements, review changesets and their impact, and ask DrBot.

#### Relationships

| Type        | Related Element                                         | Predicate    | Direction |
| ----------- | ------------------------------------------------------- | ------------ | --------- |
| inter-layer | `motivation.requirement.viewer-covers-every-spec-layer` | `satisfies`  | outbound  |
| intra-layer | `ux.uxapplication.embedded-architecture-viewer`         | `aggregates` | inbound   |
| intra-layer | `ux.view.changesets-view`                               | `aggregates` | outbound  |
| intra-layer | `ux.view.dr-bot-chat-drawer`                            | `aggregates` | outbound  |
| intra-layer | `ux.view.inspector-drawer`                              | `aggregates` | outbound  |
| intra-layer | `ux.view.model-view`                                    | `aggregates` | outbound  |
| intra-layer | `ux.view.schema-view`                                   | `aggregates` | outbound  |

### Authentication Spec {#authentication-spec}

**ID**: `ux.uxspec.authentication-spec`

**Type**: `uxspec`

UX specification for token-based authentication flow; extracts bearer token from magic link URL query parameter and redirects to the model view on success.

#### Attributes

| Name       | Value  |
| ---------- | ------ |
| experience | visual |

#### Relationships

| Type        | Related Element                                    | Predicate    | Direction |
| ----------- | -------------------------------------------------- | ------------ | --------- |
| inter-layer | `motivation.requirement.dr-cli-server-integration` | `satisfies`  | outbound  |
| intra-layer | `ux.view.auth-view`                                | `aggregates` | outbound  |

### Auth View {#auth-view}

**ID**: `ux.view.auth-view`

**Type**: `view`

Landing view at route /#/; extracts the DR CLI bearer token from the ?token= URL query parameter, persists it to localStorage, and redirects to the model view.

#### Attributes

| Name | Value    |
| ---- | -------- |
| type | embedded |

#### Relationships

| Type        | Related Element                 | Predicate    | Direction |
| ----------- | ------------------------------- | ------------ | --------- |
| intra-layer | `ux.uxspec.authentication-spec` | `aggregates` | inbound   |

### Changesets View {#changesets-view}

**ID**: `ux.view.changesets-view`

**Type**: `view`

One changeset: its change list (Changes) or its reach outside itself (Impact), with the changeset inspector and Apply / Discard for a staged changeset.

#### Attributes

| Name     | Value      |
| -------- | ---------- |
| routable | true       |
| title    | Changesets |
| type     | page       |

#### Relationships

| Type        | Related Element                                              | Predicate    | Direction |
| ----------- | ------------------------------------------------------------ | ------------ | --------- |
| inter-layer | `navigation.route.app-shell-sectionview-route`               | `maps-to`    | inbound   |
| inter-layer | `technology.systemsoftware.heimdall-ui`                      | `depends-on` | outbound  |
| inter-layer | `product.feature.changeset-inbox`                            | `realizes`   | outbound  |
| inter-layer | `product.feature.per-change-review`                          | `realizes`   | outbound  |
| inter-layer | `product.feature.tier1-mode-and-routing`                     | `realizes`   | outbound  |
| inter-layer | `product.feature.tier1-warming-progress`                     | `realizes`   | outbound  |
| inter-layer | `business.businessobject.changeset`                          | `references` | outbound  |
| inter-layer | `motivation.requirement.each-review-change-reads-on-its-own` | `satisfies`  | outbound  |
| inter-layer | `motivation.requirement.wcag-21-aa-compliance`               | `satisfies`  | outbound  |
| inter-layer | `business.businessrole.architecture-reviewer`                | `serves`     | outbound  |
| inter-layer | `motivation.goal.enable-real-time-collaboration`             | `supports`   | outbound  |
| intra-layer | `ux.uxspec.architecture-exploration-spec`                    | `aggregates` | inbound   |
| intra-layer | `ux.subview.change-inspector-panel`                          | `composes`   | outbound  |
| intra-layer | `ux.subview.changeset-impact-tab`                            | `composes`   | outbound  |
| intra-layer | `ux.subview.changeset-inbox`                                 | `composes`   | outbound  |
| intra-layer | `ux.subview.changeset-review-list`                           | `composes`   | outbound  |
| intra-layer | `ux.subview.tier1-panel`                                     | `composes`   | outbound  |

### DrBot Chat Drawer {#drbot-chat-drawer}

**ID**: `ux.view.dr-bot-chat-drawer`

**Type**: `view`

The DrBot assistant, scoped to the current selection: persistent at 1300px and wider, an overlay below.

#### Attributes

| Name     | Value  |
| -------- | ------ |
| routable | false  |
| type     | drawer |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| inter-layer | `product.feature.dr-bot-chat-drawer`      | `realizes`   | outbound  |
| inter-layer | `business.businessrole.model-author`      | `serves`     | outbound  |
| intra-layer | `ux.uxspec.architecture-exploration-spec` | `aggregates` | inbound   |

### Inspector Drawer {#inspector-drawer}

**ID**: `ux.view.inspector-drawer`

**Type**: `view`

Selection details floating over the graph; auto-hides when nothing is selected.

#### Attributes

| Name     | Value  |
| -------- | ------ |
| routable | false  |
| type     | drawer |

#### Relationships

| Type        | Related Element                           | Predicate    | Direction |
| ----------- | ----------------------------------------- | ------------ | --------- |
| inter-layer | `product.feature.cross-layer-follow`      | `realizes`   | outbound  |
| inter-layer | `product.feature.element-annotations`     | `realizes`   | outbound  |
| inter-layer | `business.businessobject.annotation`      | `references` | outbound  |
| intra-layer | `ux.uxspec.architecture-exploration-spec` | `aggregates` | inbound   |

### Model View {#model-view}

**ID**: `ux.view.model-view`

**Type**: `view`

A layer of the model as a graph of its elements (with inter-layer neighbours), or in page mode as the layer / element record.

#### Attributes

| Name     | Value |
| -------- | ----- |
| routable | true  |
| title    | Model |
| type     | page  |

#### Relationships

| Type        | Related Element                                             | Predicate    | Direction |
| ----------- | ----------------------------------------------------------- | ------------ | --------- |
| inter-layer | `navigation.route.app-shell-sectionview-route`              | `maps-to`    | inbound   |
| inter-layer | `technology.systemsoftware.heimdall-ui`                     | `depends-on` | outbound  |
| inter-layer | `product.feature.model-graph-view`                          | `realizes`   | outbound  |
| inter-layer | `business.businessobject.architecture-model`                | `references` | outbound  |
| inter-layer | `motivation.requirement.wcag-21-aa-compliance`              | `satisfies`  | outbound  |
| inter-layer | `business.businessrole.architecture-reviewer`               | `serves`     | outbound  |
| inter-layer | `motivation.goal.visualize-multi-layer-architecture-models` | `supports`   | outbound  |
| intra-layer | `ux.uxspec.architecture-exploration-spec`                   | `aggregates` | inbound   |
| intra-layer | `ux.subview.page-view`                                      | `composes`   | outbound  |

### Schema View {#schema-view}

**ID**: `ux.view.schema-view`

**Type**: `view`

A layer of the spec as a graph of its node types and relationship schemas, or in page mode as the layer / spec node record.

#### Attributes

| Name     | Value  |
| -------- | ------ |
| routable | true   |
| title    | Schema |
| type     | page   |

#### Relationships

| Type        | Related Element                                | Predicate    | Direction |
| ----------- | ---------------------------------------------- | ------------ | --------- |
| inter-layer | `navigation.route.app-shell-sectionview-route` | `maps-to`    | inbound   |
| inter-layer | `product.feature.schema-graph-view`            | `realizes`   | outbound  |
| inter-layer | `business.businessobject.architecture-model`   | `references` | outbound  |
| inter-layer | `motivation.requirement.wcag-21-aa-compliance` | `satisfies`  | outbound  |
| intra-layer | `ux.uxspec.architecture-exploration-spec`      | `aggregates` | inbound   |
| intra-layer | `ux.subview.page-view`                         | `composes`   | outbound  |

---

Generated: 2026-11-19T17:49:06.264Z | Model Version: 0.1.0
