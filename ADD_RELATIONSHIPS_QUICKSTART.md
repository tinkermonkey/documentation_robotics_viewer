# Quick Start: Adding Relationships to DR Model

This guide provides ready-to-run commands to establish core relationships in the documentation_robotics_viewer model.

## Prerequisites

```bash
cd /Users/austinsand/workspace/documentation_robotics_viewer/documentation-robotics
```

## Phase 1: Core Cross-Layer Traceability (30-45 min)

### Goal: Establish 3 complete end-to-end traces

#### Trace 1: Visualize Architecture Goal → Services → API → Data

```bash
# 1. Business realizes Goal
dr relationship add business.service.architecture-visualization \
  motivation.goal.visualize-architecture \
  --type supports-goals

# 2. Application realizes Business
dr relationship add application.service.graph-builder \
  business.service.architecture-visualization \
  --type realizes

dr relationship add application.service.node-transformer \
  business.service.architecture-visualization \
  --type realizes

dr relationship add application.service.layout-engine \
  business.service.architecture-visualization \
  --type realizes

# 3. API exposes Application
dr relationship add api.operation.get-model \
  application.service.reference-server \
  --type exposes

# 4. API uses Data Model
dr relationship add api.operation.get-model \
  data_model.object-schema.meta-model \
  --type uses-schemas

# 5. Application uses Data Model
dr relationship add application.service.graph-builder \
  data_model.object-schema.business-graph \
  --type uses-schemas

dr relationship add application.service.motivation-graph-builder \
  data_model.object-schema.motivation-graph \
  --type uses-schemas

# 6. UX supports Business Capability
dr relationship add ux.view.model-graph-screen \
  business.capability.visualization \
  --type supports

# Verify trace
dr trace motivation.goal.visualize-architecture
dr trace business.service.architecture-visualization
```

#### Trace 2: Data Management Goal → Services

```bash
# Add goal if missing
# dr add motivation goal model-data-management

# Business realizes Goal
dr relationship add business.service.model-data-management \
  motivation.goal.visualize-architecture \
  --type supports-goals

# Application realizes Business
dr relationship add application.service.data-loader \
  business.service.model-data-management \
  --type realizes

dr relationship add application.service.yaml-parser \
  business.service.model-data-management \
  --type realizes

dr relationship add application.service.json-schema-parser \
  business.service.model-data-management \
  --type realizes

# API exposes Application
dr relationship add api.operation.get-spec \
  application.service.data-loader \
  --type exposes

# Verify
dr trace business.service.model-data-management
```

#### Trace 3: Export Documentation Goal → Services

```bash
# Business realizes Goal
# (assuming we have an export goal, or link to visualization goal)
dr relationship add business.service.documentation-export \
  motivation.goal.visualize-architecture \
  --type supports-goals

# Application realizes Business
dr relationship add application.service.business-export-service \
  business.service.documentation-export \
  --type realizes

dr relationship add application.service.motivation-export-service \
  business.service.documentation-export \
  --type realizes

dr relationship add application.service.c4-export-service \
  business.service.documentation-export \
  --type realizes

# Technology enables Application
dr relationship add application.service.business-export-service \
  technology.library.html-to-image \
  --type uses

# Verify
dr trace business.service.documentation-export
```

### Validation After Phase 1

```bash
# Check relationship count (should be 15+)
dr info | grep -i relationship

# Validate
dr validate --relationships

# Check conformance
dr conformance --layers business application api
```

---

## Phase 2: Security & Governance (20-30 min)

### Add Security Protection

```bash
# Protect public API endpoints
dr relationship add api.operation.websocket-connect \
  security.policy.local-access \
  --type protected-by

dr relationship add api.operation.get-model \
  security.policy.local-access \
  --type protected-by

dr relationship add api.operation.get-spec \
  security.policy.local-access \
  --type protected-by

# Link threats to resources
dr relationship add security.threat.unauthorized-file-access \
  security.secure-resource.file-system \
  --type threatens

dr relationship add security.threat.path-traversal \
  security.secure-resource.file-system \
  --type threatens

dr relationship add security.threat.websocket-hijacking \
  security.secure-resource.websocket \
  --type threatens

# Link countermeasures to threats
dr relationship add security.countermeasure.path-validation \
  security.threat.path-traversal \
  --type mitigates

dr relationship add security.countermeasure.file-system-sandboxing \
  security.threat.unauthorized-file-access \
  --type mitigates

dr relationship add security.countermeasure.websocket-origin-validation \
  security.threat.websocket-hijacking \
  --type mitigates

# Link roles to permissions
dr relationship add security.role.user \
  security.permission.read-model-files \
  --type has-permission

dr relationship add security.role.user \
  security.permission.write-model-files \
  --type has-permission

dr relationship add security.role.viewer \
  security.permission.read-model-files \
  --type has-permission
```

### Add Principle Governance

```bash
# Performance principle governs critical services
dr relationship add application.service.graph-builder \
  motivation.principle.performance-first \
  --type governed-by-principles

dr relationship add application.service.layout-engine \
  motivation.principle.performance-first \
  --type governed-by-principles

# Accessibility principle governs UX
dr relationship add ux.view.model-graph-screen \
  motivation.principle.accessibility-by-default \
  --type governed-by-principles

dr relationship add ux.view.motivation-screen \
  motivation.principle.accessibility-by-default \
  --type governed-by-principles

# User-centric principle governs business services
dr relationship add business.service.architecture-visualization \
  motivation.principle.user-centric-design \
  --type governed-by-principles

# Progressive enhancement governs UX components
dr relationship add ux.component.graph-viewer \
  motivation.principle.progressive-enhancement \
  --type governed-by-principles
```

### Validation After Phase 2

```bash
# Check security coverage
dr relationship list security.policy.local-access

# Check principle governance
dr relationship list motivation.principle.performance-first

# Validate all
dr validate --relationships --strict

# Conformance
dr conformance --layers security motivation
```

---

## Phase 3: Technology & Deployment (15-20 min)

### Link Application to Technology Stack

```bash
# Frontend components use React
dr relationship add application.component.viewer-app \
  technology.framework.react \
  --type deployed-on

dr relationship add application.component.graph-view \
  technology.library.react-flow \
  --type deployed-on

# Backend services use FastAPI
dr relationship add application.service.reference-server \
  technology.framework.fastapi \
  --type deployed-on

# Services use libraries
dr relationship add application.service.yaml-parser \
  technology.library.js-yaml \
  --type uses

dr relationship add application.service.business-export-service \
  technology.library.html-to-image \
  --type uses

dr relationship add application.service.local-file-loader \
  technology.library.jszip \
  --type uses

# State management
dr relationship add application.component.viewer-app \
  technology.library.zustand \
  --type uses

# Testing
dr relationship add application.component.viewer-app \
  technology.tool.playwright \
  --type tested-by
```

### Add Constraints

```bash
# Technology constrained by browser compatibility
dr relationship add technology.framework.react \
  motivation.constraint.browser-compatibility \
  --type constrained-by

# Services constrained by performance targets
dr relationship add application.service.graph-builder \
  motivation.constraint.performance-targets \
  --type constrained-by

dr relationship add application.service.layout-engine \
  motivation.constraint.performance-targets \
  --type constrained-by

# UX constrained by accessibility
dr relationship add ux.view.model-graph-screen \
  motivation.constraint.accessibility-requirements \
  --type constrained-by
```

---

## Phase 4: Intra-Layer Hierarchies (20-30 min)

### Motivation Layer Hierarchies

```bash
# Goal decomposition (if you create sub-goals)
# dr add motivation goal fast-rendering
# dr relationship add motivation.goal.visualize-architecture \
#   motivation.goal.fast-rendering \
#   --type aggregates

# Requirements fulfill goals (already done via type field, but can make explicit)
# Stakeholders have interest in goals
# dr relationship add motivation.stakeholder.end-users \
#   motivation.goal.visualize-architecture \
#   --type has-interest
```

### Business Layer Hierarchies

```bash
# Capabilities aggregate sub-capabilities
# Services serve capabilities
dr relationship add business.service.architecture-visualization \
  business.capability.visualization \
  --type serves

dr relationship add business.service.documentation-export \
  business.capability.export \
  --type serves

dr relationship add business.service.model-data-management \
  business.capability.documentation \
  --type serves
```

### Application Layer Composition

```bash
# Components compose other components
dr relationship add application.component.viewer-app \
  application.component.graph-view \
  --type composes

dr relationship add application.component.viewer-app \
  application.component.motivation-graph-view \
  --type composes

dr relationship add application.component.viewer-app \
  application.component.c4-graph-view \
  --type composes

# Services use other services
dr relationship add application.service.graph-builder \
  application.service.node-transformer \
  --type uses

dr relationship add application.service.graph-builder \
  application.service.layout-engine \
  --type uses

dr relationship add application.service.data-loader \
  application.service.yaml-parser \
  --type uses

dr relationship add application.service.data-loader \
  application.service.json-schema-parser \
  --type uses
```

### UX Component Composition

```bash
# Screens compose components
# dr relationship add ux.view.model-graph-screen \
#   ux.component.graph-viewer \
#   --type composes

# Interactions trigger other interactions
# (requires more detailed modeling)
```

---

## Phase 5: APM & Testing (Optional, 15-20 min)

### Add Monitoring Relationships

```bash
# First, create metrics if they don't exist
# dr add apm metric graph-render-time
# dr add apm metric layout-calculation-time

# Then link to services
# dr relationship add apm.metric.graph-render-time \
#   application.service.graph-builder \
#   --type monitors

# dr relationship add apm.metric.layout-calculation-time \
#   application.service.layout-engine \
#   --type monitors
```

### Add Test Coverage

```bash
# Link test cases to services
# (requires creating test case elements first)
# dr relationship add testing.test-case.graph-rendering-test \
#   application.service.graph-builder \
#   --type tests
```

---

## Verification & Quality Checks

### After Each Phase

```bash
# 1. Check relationship count increased
dr info

# 2. Validate relationships
dr validate --relationships

# 3. Check conformance improvements
dr conformance --json

# 4. Trace key elements
dr trace motivation.goal.visualize-architecture
dr trace business.service.architecture-visualization
dr trace application.service.graph-builder

# 5. List relationships for specific elements
dr relationship list business.service.architecture-visualization
dr relationship list application.service.graph-builder
```

### Final Validation

```bash
# Complete validation
dr validate --all --strict

# Conformance report
dr conformance --verbose

# Export model to see relationships
dr export archimate --output exports/

# Visualize to see connections
dr visualize
```

---

## Expected Relationship Counts

| Phase | Added | Cumulative | Time |
|-------|-------|------------|------|
| Phase 1: Core Traces | 15-20 | 15-20 | 30-45 min |
| Phase 2: Security & Governance | 20-25 | 35-45 | 20-30 min |
| Phase 3: Technology | 15-20 | 50-65 | 15-20 min |
| Phase 4: Hierarchies | 20-30 | 70-95 | 20-30 min |
| Phase 5: APM/Testing | 10-15 | 80-110 | 15-20 min |
| **Total** | **80-110** | **80-110** | **1.5-2.5 hrs** |

---

## Common Issues & Solutions

### Issue: "Element not found"
```bash
# List elements to verify IDs
dr list <layer> <type>

# Search for element
dr search "<name>"

# Show element details
dr show <element-id>
```

### Issue: "Invalid relationship type"
```bash
# Check valid relationship types
dr relationship add --help

# Common types:
# - supports-goals
# - governed-by-principles
# - realizes
# - exposes
# - uses-schemas
# - protected-by
# - mitigates
# - threatens
```

### Issue: Relationship not showing in trace
```bash
# Ensure relationship was added
dr relationship list <element-id>

# Re-validate
dr validate --relationships

# Check both directions
dr relationship list <source-id>
dr relationship list <target-id>
```

---

## Tips for Success

1. **Work in batches** - Add 5-10 relationships, then validate
2. **Use tab completion** - Element IDs are long, use shell completion
3. **Verify as you go** - Run `dr trace` after each major addition
4. **Document patterns** - Note which relationship types work well
5. **Start simple** - Focus on core traces first, expand later
6. **Use exports** - Export to ArchiMate/Mermaid to visualize progress

---

## Next Steps After Adding Relationships

1. **Visualize the model** - `dr visualize` to see connections
2. **Run impact analysis** - Analyze change impacts across layers
3. **Generate documentation** - Export with rich traceability
4. **Establish conventions** - Document relationship patterns for team
5. **Automate validation** - Add relationship checks to CI/CD

---

**Created:** 2026-01-04
**For Model:** documentation_robotics_viewer
**Estimated Total Time:** 1.5-2.5 hours for 80-110 relationships
