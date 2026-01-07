# Documentation Robotics Model - Comprehensive Gap Analysis

**Analysis Date:** 2026-01-07
**Model Version:** 0.7.0
**Current Statistics:**
- Total Elements: 365
- Cross-Layer Relationships: 267 (intra-layer only)
- Validation Status: PASSED (strict mode)
- Model Completeness: ~90%

---

## Executive Summary

This gap analysis identifies the remaining 10% of work needed to achieve 100% model completeness. The model has strong coverage across all 12 layers with 365 elements documented. However, **critical gaps exist in cross-layer relationship documentation** (only intra-layer relationships are tracked), incomplete property documentation, and several missing architectural elements.

**Key Findings:**
- **CRITICAL:** Cross-layer relationships are NOT tracked in `relationships.yaml` (only intra-layer)
- **HIGH:** Missing UX components (53 files vs 130 modeled, ~23 missing)
- **HIGH:** APM layer severely underrepresented (5 elements vs 20+ needed)
- **MEDIUM:** Missing data model entities and incomplete API operations
- **MEDIUM:** Testing layer lacks actual test suite mappings

---

## 1. CRITICAL GAPS

### 1.1 Cross-Layer Relationship Tracking (CRITICAL)

**Gap Type:** Missing Relationships
**Priority:** CRITICAL
**Impact:** Model claims 267 cross-layer relationships but `relationships.yaml` only contains intra-layer relationships

**Description:**
The manifest reports 267 total relationships, but the `relationships.yaml` file contains ONLY intra-layer relationships (within same layer). Cross-layer relationships are embedded in element properties using x-extensions but are NOT tracked centrally.

**Evidence:**
```yaml
# All relationships in relationships.yaml are intra-layer:
- source: application.service.graph-builder
  target: application.service.node-transformer
  layer: application  # Same layer

- source: ux.component.shared-layout
  target: ux.component.model-layers-sidebar
  layer: ux  # Same layer
```

**Missing:**
- No relationships tracked between layers (e.g., API → Application, Application → Data Model)
- Cross-layer links exist in x-properties but aren't in central registry
- No validation that x-references are bidirectional

**Recommendation:**
1. Extract all x-archimate-ref, x-realizes, x-uses, x-accesses from element properties
2. Add cross-layer relationships to `relationships.yaml` with `category: cross-layer`
3. Implement bidirectional validation

**Example Missing Relationships:**
```yaml
# From API to Application layer
- source: api.operation.health-check
  target: application.service.reference-server
  predicate: implemented-by
  layer: api → application
  category: cross-layer

# From Application to Data Model
- source: application.service.model-store
  target: data_model.entity.meta-model
  predicate: accesses
  layer: application → data_model
  category: cross-layer
```

---

### 1.2 Missing Core Data Model Entities (CRITICAL)

**Gap Type:** Missing Elements
**Priority:** CRITICAL
**Impact:** Data model lacks fundamental entity types that are referenced throughout the application

**Missing Entities:**
1. **`data_model.entity.meta-model`** (Referenced by 5+ services)
2. **`data_model.entity.layer`** (Referenced by 6+ services)
3. **`data_model.entity.model-element`** (Referenced by 10+ services)
4. **`data_model.entity.relationship`** (Referenced by graph builders)
5. **`data_model.entity.business-graph`**
6. **`data_model.entity.business-service`**
7. **`data_model.entity.business-capability`**

**Evidence:**
```yaml
# From application.service.yaml-parser:
x-accesses:
  - data_model.entity.meta-model      # DOES NOT EXIST
  - data_model.entity.layer           # DOES NOT EXIST
  - data_model.entity.model-element   # DOES NOT EXIST
```

**Recommendation:**
Add these entities to `model/07_data_model/objects.yaml`:
```yaml
meta-model:
  id: data_model.entity.meta-model
  name: Meta Model
  type: object
  documentation: Root meta-model entity containing layers, relationships, and metadata

layer:
  id: data_model.entity.layer
  name: Layer
  type: object
  documentation: Layer entity representing a DR architectural layer

model-element:
  id: data_model.entity.model-element
  name: Model Element
  type: object
  documentation: Generic model element with ID, name, type, and properties
```

---

## 2. HIGH PRIORITY GAPS

### 2.1 APM/Observability Layer - Severely Incomplete (HIGH)

**Gap Type:** Missing Elements
**Priority:** HIGH
**Impact:** Only 5 elements (1 metric, 3 performance, 1 reliability) vs 20+ needed for comprehensive observability

**Current Coverage:**
- 1 metric (render-time)
- 3 performance indicators
- 1 reliability indicator
- 14 additional performance metrics exist in APM but not modeled

**Missing Metrics:**
1. **Layout Calculation Time** (referenced but not modeled)
2. **Node Render Count** (referenced but not modeled)
3. **Edge Render Count** (referenced but not modeled)
4. **Memory Usage** (referenced but not modeled)
5. **WebSocket Latency** (referenced but not modeled)
6. **Annotation Load Time** (referenced but not modeled)
7. **Changeset Load Time** (referenced but not modeled)
8. **Model Parse Time** (referenced but not modeled)
9. **Validation Time** (referenced but not modeled)
10. **Export Generation Time** (referenced but not modeled)
11. **Screenshot Capture Time** (referenced but not modeled)
12. **Similarity Calculation Time** (referenced but not modeled)
13. **Quality Score Calculation Time** (referenced but not modeled)
14. **Metrics History Size** (referenced but not modeled)

**Missing Reliability Indicators:**
1. Error rates per service
2. WebSocket connection uptime
3. Model loading success rate
4. Export operation success rate

**Missing Alerts:**
1. Performance degradation alerts
2. Memory leak detection
3. API endpoint failure alerts
4. Layout timeout warnings

**Recommendation:**
Expand `model/11_apm/` with:
- `metrics.yaml` - Add all 14 missing performance metrics
- `reliabilitys.yaml` - Add error rates, success rates, uptime metrics
- `alerts.yaml` - Add alert policies for critical thresholds

---

### 2.2 Missing UX Components (HIGH)

**Gap Type:** Missing Elements
**Priority:** HIGH
**Impact:** 53 component files in codebase but only ~86 custom UX elements modeled (unclear mapping)

**Current Coverage:**
- 86 custom components
- 35 interactions
- 3 dashboards, 3 details, 3 lists

**Missing Components (Examples from codebase):**
1. **LayoutPreferencesPanel** (exists in code, not modeled)
2. **SchemaInfoPanel** (exists in code, not modeled)
3. **FilterPanel** (base component, not modeled)
4. **BreadcrumbNav** (base component, not modeled)
5. **OverviewPanel** (referenced but not modeled)
6. **LayerTypesLegend** (referenced but not modeled)
7. **OperationLegend** (referenced but not modeled)
8. **SpaceMouseHandler** (referenced but not modeled)
9. **LayoutHistory** (referenced but not modeled)
10. **ScreenshotDiffVisualization** (referenced but not modeled)
11. **NodeDetailsPanel** (referenced but not modeled)
12. **HighlightedPathPanel** (referenced but not modeled)
13. **MetricsDashboard** (referenced but not modeled)
14. **SessionHistoryBrowser** (referenced but not modeled)
15. **BusinessLayerControls** (referenced but not modeled)
16. **ModeSelector** (referenced but not modeled)
17. **ConnectionStatus** (exists in code, not modeled)
18. **ErrorBoundary** (exists in code, not modeled)
19. **GraphToolbar** (exists in code, not modeled)
20. **MiniMap** (exists in code, not modeled)

**Missing Node Components:**
The model doesn't capture React Flow custom node types:
- GoalNode, RequirementNode, PrincipleNode, ConstraintNode
- AssessmentNode, AssumptionNode, DriverNode, OutcomeNode, StakeholderNode, ValueStreamNode
- BusinessCapabilityNode, BusinessFunctionNode, BusinessServiceNode
- ComponentNode, ContainerNode, ExternalActorNode
- JSONSchemaNode, BaseFieldListNode, LayerContainerNode

**Missing Edge Components:**
- CrossLayerEdge, InfluenceEdge, RealizesEdge

**Recommendation:**
1. Map all 53 component files to UX elements
2. Add custom node types to ux.component entries
3. Document component hierarchies and composition patterns

---

### 2.3 Missing Application Components (HIGH)

**Gap Type:** Missing Elements
**Priority:** HIGH
**Impact:** 20 components modeled but key components missing

**Missing Components:**
1. **application.component.spec-viewer** (referenced by routes)
2. **application.component.changeset-viewer** (referenced by routes)
3. **application.component.business-layer-view** (referenced by routes)
4. **application.component.annotation-panel** (exists in code, referenced in relationships)
5. **application.component.motivation-filter-panel** (referenced in relationships)
6. **application.component.c4-filter-panel** (referenced in relationships)
7. **application.component.motivation-breadcrumb** (referenced in relationships)
8. **application.component.c4-control-panel** (referenced in relationships)
9. **application.component.motivation-control-panel** (referenced in relationships)
10. **application.component.c4-inspector-panel** (referenced in relationships)
11. **application.component.motivation-inspector-panel** (referenced in relationships)
12. **application.component.mode-selector** (referenced in relationships)

**Recommendation:**
Add these components to `model/04_application/components.yaml` with proper x-references to UX layer.

---

### 2.4 Missing Navigation Elements (HIGH)

**Gap Type:** Missing Elements
**Priority:** HIGH
**Impact:** Navigation layer incomplete for actual routing implementation

**Missing Routes:**
1. **navigation.route.model** (redirect route, not modeled but referenced)
2. **navigation.route.spec** (redirect route, not modeled but referenced)
3. **navigation.route.changesets** (redirect route, not modeled but referenced)
4. **navigation.route.index** (root index, referenced in relationships)

**Missing Menus:**
1. **navigation.menu.main-tabs** (referenced in relationships, not modeled)
2. **navigation.menu.model-sub-tabs** (referenced in relationships, not modeled)
3. **navigation.menu.spec-sub-tabs** (referenced in relationships, not modeled)

**Recommendation:**
Add missing routes and menus to `model/10_navigation/`:
- Add redirects to `redirects.yaml`
- Add menus to new `menus.yaml` file

---

## 3. MEDIUM PRIORITY GAPS

### 3.1 Incomplete API Layer Documentation (MEDIUM)

**Gap Type:** Incomplete Properties
**Priority:** MEDIUM
**Impact:** API operations lack complete OpenAPI 3.0.3 specification details

**Issues:**
1. Many operations have incomplete `responses` objects
2. Missing request/response schema references for some operations
3. Security schemes not explicitly defined
4. Missing error response codes (4xx, 5xx)
5. No rate limiting documentation
6. Missing authentication flows

**Missing Operations:**
1. **Update Annotation** (POST/PUT endpoint likely exists)
2. **Delete Annotation** (DELETE endpoint likely exists)
3. **Create Changeset** (mentioned in events but no REST endpoint modeled)
4. **Apply Changeset** (likely exists in CLI integration)

**Recommendation:**
1. Complete all OpenAPI specifications in `model/06_api/operations.yaml`
2. Add security schemes to `model/06_api/security-schemes.yaml`
3. Document error responses and codes
4. Add missing CRUD operations

---

### 3.2 Missing Data Model Object Schemas (MEDIUM)

**Gap Type:** Missing Elements
**Priority:** MEDIUM
**Impact:** Several object schemas referenced but not defined

**Missing Schemas (referenced in code/docs):**
1. **business-graph** (referenced by builders)
2. **business-node** (referenced by builders)
3. **business-edge** (referenced by builders)
4. **cross-layer-link** (referenced by builders)
5. **graph-metrics** (referenced by builders)
6. **motivation-graph** (referenced by builders)
7. **c4graph** (referenced by transformers)
8. **hierarchy-info** (referenced by C4 views)
9. **react-flow-node** (core visualization type)
10. **react-flow-edge** (core visualization type)

**Evidence:**
These are referenced in `relationships.yaml` but don't exist in `model/07_data_model/object-schemas.yaml`.

**Recommendation:**
Add all missing schemas to `model/07_data_model/object-schemas.yaml` with proper JSON Schema Draft 7 definitions.

---

### 3.3 Datastore Layer - Extremely Sparse (MEDIUM)

**Gap Type:** Missing Elements
**Priority:** MEDIUM
**Impact:** Only 1 filesystem + 10 stores vs broader persistence needs

**Current Coverage:**
- 1 filesystem (local-fs)
- 10 Zustand stores

**Missing Datastores:**
1. **LocalStorage persistence** (used by several stores but not modeled)
2. **SessionStorage** (likely used for temporary state)
3. **IndexedDB** (for offline model caching)
4. **Service Worker cache** (for PWA support)

**Missing Store Properties:**
- No persistence strategies documented
- No data retention policies
- No backup/restore procedures
- No size limits or quotas

**Recommendation:**
1. Add browser storage entities to `model/08_datastore/`
2. Document persistence strategies for each store
3. Add data lifecycle policies

---

### 3.4 Testing Layer - Missing Test Suite Mappings (MEDIUM)

**Gap Type:** Missing Relationships
**Priority:** MEDIUM
**Impact:** Test case sketches exist but no mapping to actual test files

**Current Coverage:**
- 11 test-case-sketches
- 2 coverage-targets
- 1 coverage-requirement
- 2 context-variations

**Missing:**
1. **Actual test file references** (tests/\*.spec.ts files not mapped)
2. **Test suites** (groups of related tests)
3. **Test fixtures** (test data)
4. **Test environments** (local, CI, staging)
5. **Coverage metrics** (actual %, not just targets)

**Actual Test Files to Map (~35 files):**
```
tests/embedded-app.spec.ts
tests/embedded-dual-view.spec.ts
tests/c4-architecture-view.spec.ts
tests/motivation-view.spec.ts
tests/metrics/regression-check.spec.ts
tests/metrics/metrics-report.spec.ts
tests/unit/c4ViewTransformer.spec.ts
tests/unit/graphReadability.spec.ts
... (30+ more)
```

**Recommendation:**
1. Add test-suite entities mapping to actual .spec.ts files
2. Link test suites to coverage targets
3. Document test data fixtures
4. Add test environment configurations

---

### 3.5 Missing Technology Stack Elements (MEDIUM)

**Gap Type:** Missing Elements
**Priority:** MEDIUM
**Impact:** Several core technologies not documented

**Missing Technologies:**
1. **Docker** (mentioned in Dockerfile.agent)
2. **Git/GitHub** (used for version control and releases)
3. **NPM** (package manager)
4. **ESLint** (code quality)
5. **Prettier** (code formatting)
6. **Ladle** (component development, stories exist)
7. **React Testing Library** (for component tests)
8. **Axe-core** (for accessibility tests)
9. **SSIM** (similarity comparison, mentioned in services)

**Missing Infrastructure:**
1. Build pipelines
2. CI/CD configuration
3. Deployment targets (cloud, on-prem)

**Recommendation:**
Expand `model/05_technology/stacks.yaml` with:
- Development tools (Docker, ESLint, Prettier)
- Testing tools (React Testing Library, Axe-core)
- Build/deployment infrastructure

---

### 3.6 Security Layer - Missing Security Implementations (MEDIUM)

**Gap Type:** Missing Elements
**Priority:** MEDIUM
**Impact:** Security layer has policies and threats but lacks implementation details

**Current Coverage:**
- 1 security-policy
- 1 policy-rule
- 2 roles
- 4 permissions
- 5 preventive countermeasures
- 1 detective countermeasure
- 4 threats

**Missing:**
1. **Authentication mechanisms** (OAuth2, JWT, magic links)
2. **Authorization matrix** (role-permission mappings)
3. **Encryption standards** (algorithms, key management)
4. **Security testing** (penetration tests, security scans)
5. **Compliance mappings** (GDPR, SOC2, etc.)
6. **Security monitoring** (SIEM integration, alerts)

**Missing Threats:**
1. CSRF attacks
2. SQL injection (if applicable)
3. Denial of Service
4. Data exfiltration
5. Session hijacking

**Recommendation:**
1. Add authentication/authorization mechanisms
2. Document encryption implementations
3. Add comprehensive threat model
4. Link security controls to compliance requirements

---

## 4. LOW PRIORITY GAPS

### 4.1 Incomplete Element Documentation (LOW)

**Gap Type:** Incomplete Properties
**Priority:** LOW
**Impact:** Many elements lack descriptions, rationale, or documentation URLs

**Statistics:**
- ~15% of elements have empty or minimal documentation
- ~30% lack rationale for design decisions
- ~40% don't link to external documentation

**Examples:**
```yaml
# Minimal documentation
node-transformer:
  id: application.service.node-transformer
  name: Node Transformer
  type: service
  documentation: Converts model elements to React Flow nodes
  # Missing: Rationale, algorithm details, performance characteristics
```

**Recommendation:**
1. Audit all elements for documentation completeness
2. Add rationale properties explaining "why" decisions were made
3. Link to external documentation (GitHub, ADRs, RFCs)

---

### 4.2 Missing Business Capabilities (LOW)

**Gap Type:** Missing Elements
**Priority:** LOW
**Impact:** Only 3 capabilities modeled vs broader business context

**Current Coverage:**
- 3 capabilities (Visualization, Documentation, Export)
- 6 services

**Missing Capabilities:**
1. **Model Authoring** (create/edit model elements)
2. **Collaboration** (multi-user editing, comments)
3. **Version Control** (model versioning, branching)
4. **Search & Discovery** (find elements, search model)
5. **Reporting** (generate architecture reports)
6. **Integration** (API access, webhooks)
7. **Administration** (user management, settings)

**Recommendation:**
Expand `model/02_business/capabilities.yaml` with future-state capabilities.

---

### 4.3 Missing Motivation Layer Elements (LOW)

**Gap Type:** Missing Elements
**Priority:** LOW
**Impact:** Motivation layer could be more comprehensive

**Current Coverage:**
- 3 goals
- 4 principles
- 4 constraints
- 1 customer (internal)
- 2 internal stakeholders

**Missing:**
1. **Requirements** (specific functional/non-functional requirements)
2. **Assumptions** (architectural assumptions)
3. **Drivers** (business/technical drivers)
4. **Assessments** (architecture trade-offs)
5. **Outcomes** (expected results)
6. **External Stakeholders** (end users, partners)

**Recommendation:**
Complete motivation layer with comprehensive goals, requirements, and stakeholder analysis.

---

### 4.4 Missing UX Screen/View Elements (LOW)

**Gap Type:** Missing Elements
**Priority:** LOW
**Impact:** UX layer lacks explicit screen/view definitions

**Current Coverage:**
- 130 components/interactions
- No explicit screen definitions (views)

**Missing Views:**
1. **ux.view.motivation-screen** (referenced in navigation)
2. **ux.view.model-graph-screen** (referenced in navigation)
3. **ux.view.model-json-screen** (referenced in navigation)
4. **ux.view.spec-view** (referenced in navigation)
5. **ux.view.architecture-screen** (referenced in navigation)
6. **ux.view.changesets-graph-screen** (referenced in navigation)
7. **ux.view.spec-graph-screen** (referenced in navigation)
8. **ux.view.graph-refinement** (referenced in navigation)

**Recommendation:**
Add view type to UX layer schema and model all screens/views referenced by navigation routes.

---

## 5. ARCHITECTURAL DEBT & QUALITY ISSUES

### 5.1 Inconsistent ID Naming Conventions

**Issue:** Some element IDs use inconsistent plural forms
- `capabilitie` instead of `capability`
- `reliabilitys` instead of `reliability`
- `security-policie` instead of `security-policy`

**Impact:** Breaks automation and makes querying difficult

**Recommendation:** Normalize all element type IDs to singular form.

---

### 5.2 Missing Bidirectional Relationship Validation

**Issue:** Cross-layer relationships are one-directional
- `x-realizes` exists but no inverse `x-realized-by` validation
- `x-uses` exists but no `x-used-by` tracking

**Impact:** Can't trace relationships upstream

**Recommendation:** Implement bidirectional link validation in DR CLI.

---

### 5.3 No Element Lifecycle Documentation

**Issue:** No documentation of element lifecycle states
- Draft vs. Approved vs. Deprecated
- Review status
- Change history

**Impact:** Can't track model evolution or manage deprecation

**Recommendation:** Add lifecycle metadata to element schema.

---

## 6. SUMMARY RECOMMENDATIONS

### Immediate Actions (Next 2 Weeks)

1. **Extract and centralize cross-layer relationships** (CRITICAL)
   - Parse all x-references from element properties
   - Add to `relationships.yaml` with `category: cross-layer`
   - Validate bidirectional consistency

2. **Add missing data model entities** (CRITICAL)
   - meta-model, layer, model-element, relationship, etc.
   - Fix all broken x-accesses references

3. **Complete APM layer** (HIGH)
   - Add 14 missing performance metrics
   - Add reliability indicators
   - Add alert policies

4. **Map UX components** (HIGH)
   - Audit all 53 component files
   - Add missing components to model
   - Document node/edge custom types

### Short-Term Actions (Next Month)

5. **Complete API layer** (MEDIUM)
   - Add missing operations
   - Complete OpenAPI specs
   - Document security schemes

6. **Expand testing layer** (MEDIUM)
   - Map actual test files to test-case-sketches
   - Add test suites
   - Document coverage metrics

7. **Fill navigation gaps** (HIGH)
   - Add missing routes and redirects
   - Add menu elements
   - Complete route-to-view mappings

### Long-Term Actions (Next Quarter)

8. **Complete datastore layer** (MEDIUM)
   - Add browser storage entities
   - Document persistence strategies
   - Add data lifecycle policies

9. **Expand security layer** (MEDIUM)
   - Add authentication/authorization mechanisms
   - Complete threat model
   - Link to compliance requirements

10. **Improve documentation quality** (LOW)
    - Audit all element documentation
    - Add rationale properties
    - Link to external documentation

---

## 7. VALIDATION CHECKLIST

Use this checklist to verify 100% model completeness:

### Cross-Layer Relationships
- [ ] All x-archimate-ref extracted to relationships.yaml
- [ ] All x-realizes extracted to relationships.yaml
- [ ] All x-uses extracted to relationships.yaml
- [ ] All x-accesses extracted to relationships.yaml
- [ ] All x-monitored-by extracted to relationships.yaml
- [ ] All x-protected-by extracted to relationships.yaml
- [ ] Bidirectional validation implemented
- [ ] Broken references fixed

### Element Completeness
- [ ] All referenced data_model.entity.* elements exist
- [ ] All referenced ux.view.* elements exist
- [ ] All referenced ux.component.* elements exist
- [ ] All referenced application.component.* elements exist
- [ ] All 53 UX component files mapped
- [ ] All 38 node types documented
- [ ] All edge types documented
- [ ] All 35+ test files mapped

### Layer Completeness
- [ ] APM layer has 20+ metrics
- [ ] APM layer has reliability indicators
- [ ] APM layer has alert policies
- [ ] API layer has complete OpenAPI specs
- [ ] Datastore layer has all persistence types
- [ ] Testing layer maps to actual test files
- [ ] Security layer has authentication mechanisms
- [ ] Navigation layer has all routes/menus

### Property Completeness
- [ ] All elements have documentation
- [ ] All elements have rationale (where applicable)
- [ ] All x-references are valid
- [ ] All API operations have complete responses
- [ ] All stores have persistence strategies
- [ ] All metrics have x-measures references

### Validation Passing
- [ ] `dr validate --strict` passes with 0 errors
- [ ] `dr validate --validate-links` passes with 0 errors
- [ ] `dr validate --strict-links` passes with 0 errors
- [ ] No orphaned elements
- [ ] No circular dependencies
- [ ] Consistent ID naming conventions

---

## 8. METRICS FOR 100% COMPLETENESS

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Total Elements** | 365 | 450+ | 81% |
| **Cross-Layer Relationships** | 0 (centralized) | 150+ | 0% |
| **Intra-Layer Relationships** | 267 | 300+ | 89% |
| **API Operations** | 23 | 30+ | 77% |
| **APM Metrics** | 5 | 20+ | 25% |
| **UX Components** | 130 | 160+ | 81% |
| **Application Services** | 42 | 50+ | 84% |
| **Data Model Objects** | 24 | 35+ | 69% |
| **Test Mappings** | 11 | 35+ | 31% |
| **Documentation Completeness** | 85% | 100% | 85% |

**Overall Estimated Completeness:** 90% → **Target: 100%**

---

## Appendix A: Element Type Distribution

| Layer | Current | Estimated Target | Gap |
|-------|---------|------------------|-----|
| Motivation | 14 | 20 | 6 |
| Business | 9 | 15 | 6 |
| Security | 28 | 35 | 7 |
| Application | 62 | 70 | 8 |
| Technology | 18 | 25 | 7 |
| API | 24 | 32 | 8 |
| Data Model | 24 | 40 | 16 |
| Datastore | 11 | 15 | 4 |
| UX | 130 | 165 | 35 |
| Navigation | 34 | 40 | 6 |
| APM | 5 | 25 | 20 |
| Testing | 16 | 40 | 24 |
| **TOTAL** | **365** | **522** | **157** |

---

## Appendix B: Cross-Layer Relationship Patterns

Expected cross-layer relationships (examples):

```yaml
# Motivation → Business
- motivation.goal.* → business.service.*
- motivation.principle.* → business.service.*

# Business → Application
- business.service.* → application.service.*
- business.capability.* → application.component.*

# Application → Technology
- application.service.* → technology.library.*
- application.component.* → technology.framework.*

# Application → API
- application.service.* → api.operation.*

# API → Data Model
- api.operation.* → data_model.object-schema.*

# Application → Data Model
- application.service.* → data_model.entity.*

# Data Model → Datastore
- data_model.entity.* → datastore.store.*

# Application → UX
- application.component.* → ux.component.*

# UX → Navigation
- ux.view.* → navigation.route.*

# Application → APM
- application.service.* → apm.metric.*

# Testing → Application
- testing.test-case-sketch.* → application.service.*
```

---

**End of Gap Analysis**
