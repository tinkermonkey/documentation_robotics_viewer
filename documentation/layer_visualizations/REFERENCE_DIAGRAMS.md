# Reference Diagram Library

This document catalogs the canonical reference diagrams used as quality targets for the visualization optimization loop. Each reference diagram serves as an exemplary model of good layout practices for its diagram type.

## Overview

Reference diagrams establish quality baselines for automated layout optimization. They are used to:

1. **Set Quality Targets**: Define what "good" looks like for each diagram type
2. **Enable Similarity Comparison**: Compare generated layouts against exemplary examples
3. **Support Regression Testing**: Detect when layout quality degrades
4. **Guide Optimization**: Provide target metrics for layout improvements

## Directory Structure

```
public/reference-diagrams/
├── manifest.json                 # Index of all reference diagrams
├── c4/
│   ├── c4-bigbank-context-v1.json
│   └── c4-bigbank-container-v1.json
├── motivation/
│   ├── motivation-goal-hierarchy-v1.json
│   └── motivation-stakeholder-concerns-v1.json
└── business/
    ├── business-order-process-v1.json
    └── business-approval-workflow-v1.json
```

## Reference Diagram Schema

Each reference diagram JSON file contains:

```typescript
interface ReferenceDiagram {
  id: string;                    // Unique identifier
  type: ReferenceDiagramType;    // Diagram category
  name: string;                  // Human-readable name
  description?: string;          // Brief description
  source: {
    url: string;                 // Source URL
    citation: string;            // Full citation
    accessedDate: string;        // When accessed
    author?: string;             // Author/organization
  };
  license: string;               // License type
  imagePath: string;             // Path to reference image
  extractedGraph: {              // Graph structure
    nodes: ExtractedNode[];
    edges: ExtractedEdge[];
    boundingBox?: { width, height };
  };
  qualityMetrics: LayoutQualityReport;  // Baseline metrics
  annotations: {
    keyLayoutPatterns: string[];
    exemplaryFeatures: string[];
    applicableScenarios: string[];
    notes?: string;
  };
  version: number;
  lastUpdated: string;
}
```

---

## C4 Model Diagrams

### c4-bigbank-context-v1

**Name**: Big Bank plc System Context

**Description**: C4 context diagram showing the Internet Banking System and its interactions with users and external systems. This is the canonical C4 model example created by Simon Brown.

**Source**: [Structurizr DSL Example](https://structurizr.com/dsl?example=big-bank-plc)

**Citation**: Brown, S. (2024). Big Bank plc - Structurizr DSL Example. Structurizr.

**License**: CC-BY-4.0

**Key Layout Patterns**:
- Radial arrangement around central system
- External systems positioned at periphery
- User at top center (entry point)

**Exemplary Features**:
- No edge crossings
- Balanced spacing between elements
- Clear visual hierarchy (user → system → dependencies)
- Consistent edge lengths
- Adequate whitespace

**Baseline Metrics**:
| Metric | Value |
|--------|-------|
| Overall Score | 0.91 |
| Crossing Number | 1.00 |
| Crossing Angle | 1.00 |
| Angular Resolution Min | 0.85 |
| Angular Resolution Dev | 0.88 |
| Node Count | 4 |
| Edge Count | 4 |

---

### c4-bigbank-container-v1

**Name**: Big Bank plc Container Diagram

**Description**: C4 container diagram showing the internal architecture of the Internet Banking System. Demonstrates a typical web application architecture with API layer and multiple backends.

**Source**: [Structurizr DSL Example](https://structurizr.com/dsl?example=big-bank-plc)

**Citation**: Brown, S. (2024). Big Bank plc - Structurizr DSL Example. Structurizr.

**License**: CC-BY-4.0

**Key Layout Patterns**:
- Hierarchical top-down flow
- User at top (entry point)
- Presentation layer in middle
- API gateway centralized
- Data/external systems at bottom

**Exemplary Features**:
- Minimal edge crossings (1-2 max)
- Clear layer separation
- Symmetrical arrangement of similar elements
- Consistent horizontal spacing within layers
- API as central orchestration point

**Baseline Metrics**:
| Metric | Value |
|--------|-------|
| Overall Score | 0.86 |
| Crossing Number | 0.93 |
| Crossing Angle | 0.88 |
| Angular Resolution Min | 0.80 |
| Angular Resolution Dev | 0.82 |
| Node Count | 8 |
| Edge Count | 10 |

---

## Motivation/Ontology Diagrams

### motivation-goal-hierarchy-v1

**Name**: Goal Hierarchy with Requirements

**Description**: ArchiMate-style motivation diagram showing a hierarchical goal structure with stakeholders, drivers, and requirements. Based on patterns from the ArchiMate 3.2 specification.

**Source**: [ArchiMate 3.2 Specification - Motivation Elements](https://pubs.opengroup.org/architecture/archimate3-doc/ch-Motivation-Elements.html)

**Citation**: The Open Group. (2022). ArchiMate 3.2 Specification - Motivation Elements. The Open Group.

**License**: Fair Use (educational, based on ArchiMate specification patterns)

**Key Layout Patterns**:
- Hierarchical top-down (stakeholders → drivers → goals → requirements)
- Symmetric distribution of sub-goals
- Requirements aligned below their parent goals

**Exemplary Features**:
- No edge crossings
- Clear visual hierarchy reflecting ArchiMate layers
- Consistent vertical spacing between layers
- Balanced horizontal distribution
- Related elements grouped together

**Baseline Metrics**:
| Metric | Value |
|--------|-------|
| Overall Score | 0.89 |
| Crossing Number | 1.00 |
| Crossing Angle | 1.00 |
| Angular Resolution Min | 0.82 |
| Angular Resolution Dev | 0.85 |
| Node Count | 12 |
| Edge Count | 11 |

---

### motivation-stakeholder-concerns-v1

**Name**: Stakeholder Concerns and Assessments

**Description**: ArchiMate-style stakeholder viewpoint showing stakeholders, their concerns (drivers), and SWOT-style assessments. Based on patterns from the ArchiMate 3.2 specification.

**Source**: [ArchiMate 3.2 Specification - Example Viewpoints](https://pubs.opengroup.org/architecture/archimate3-doc/ch-Example-Viewpoints.html)

**Citation**: The Open Group. (2022). ArchiMate 3.2 Specification - Example Viewpoints. The Open Group.

**License**: Fair Use (educational, based on ArchiMate specification patterns)

**Key Layout Patterns**:
- Hierarchical with organizational structure at top
- Drivers grouped by stakeholder responsibility
- SWOT assessments in horizontal row
- Convergent goal at bottom

**Exemplary Features**:
- Minimal edge crossings
- Clear stakeholder-driver associations
- SWOT elements visually aligned
- Convergent layout showing multiple inputs to single goal
- Consistent element sizing within types

**Baseline Metrics**:
| Metric | Value |
|--------|-------|
| Overall Score | 0.84 |
| Crossing Number | 0.92 |
| Crossing Angle | 0.85 |
| Angular Resolution Min | 0.78 |
| Angular Resolution Dev | 0.80 |
| Node Count | 12 |
| Edge Count | 14 |

---

## Business Process Diagrams

### business-order-process-v1

**Name**: Order Fulfillment Process

**Description**: BPMN-style business process diagram showing a typical order fulfillment workflow. Based on patterns from the BPMN 2.0 specification examples.

**Source**: [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/PDF/)

**Citation**: Object Management Group. (2011). Business Process Model and Notation (BPMN) Version 2.0. OMG.

**License**: Fair Use (educational, based on OMG BPMN specification patterns)

**Key Layout Patterns**:
- Left-to-right flow (BPMN convention)
- Exception paths above main flow
- Parallel activities stacked vertically
- Gateways aligned on main flow axis

**Exemplary Features**:
- No edge crossings
- Consistent horizontal spacing between activities
- Clear exception/alternate paths
- Parallel gateway fork/join clearly visible
- End events positioned at flow termination points

**Baseline Metrics**:
| Metric | Value |
|--------|-------|
| Overall Score | 0.88 |
| Crossing Number | 1.00 |
| Crossing Angle | 1.00 |
| Angular Resolution Min | 0.78 |
| Angular Resolution Dev | 0.82 |
| Node Count | 15 |
| Edge Count | 15 |

---

### business-approval-workflow-v1

**Name**: Multi-Level Approval Workflow

**Description**: Business process diagram showing a multi-level approval workflow with escalation. Demonstrates common patterns for approval chains in enterprise processes.

**Source**: [Camunda BPMN 2.0 Tutorial](https://camunda.com/bpmn/)

**Citation**: Camunda. (2024). BPMN 2.0 Tutorial - Process Modeling. Camunda.

**License**: CC-BY-4.0

**Key Layout Patterns**:
- Left-to-right main flow
- Decision branches create vertical paths
- Merge points align paths back to main flow
- Rejection path below main flow

**Exemplary Features**:
- No edge crossings
- Symmetric decision branches
- Clear happy path vs rejection path
- Consistent task sizing
- Gateway decision points clearly labeled

**Baseline Metrics**:
| Metric | Value |
|--------|-------|
| Overall Score | 0.90 |
| Crossing Number | 1.00 |
| Crossing Angle | 1.00 |
| Angular Resolution Min | 0.82 |
| Angular Resolution Dev | 0.86 |
| Node Count | 11 |
| Edge Count | 11 |

---

## Usage

### Loading Reference Diagrams

```typescript
import {
  loadReferenceDiagram,
  loadReferenceDiagramsByType,
  getBaselineMetrics,
  getReferenceDiagramSummaries,
} from '@/core/services/reference';

// Load a specific reference diagram
const diagram = await loadReferenceDiagram('c4-bigbank-context-v1');

// Load all diagrams of a type
const c4Diagrams = await loadReferenceDiagramsByType('c4-context');

// Get baseline metrics for optimization target
const baseline = await getBaselineMetrics('motivation-ontology');

// Get summaries for UI display
const summaries = await getReferenceDiagramSummaries();
```

### Calculating Metrics for Comparison

```typescript
import { calculateExtractedGraphMetrics } from '@/core/services/reference';

// Calculate metrics from an extracted graph
const metrics = calculateExtractedGraphMetrics(
  diagram.extractedGraph,
  'c4-context',
  'force-directed'
);

// Compare against baseline
const improvement = (metrics.overallScore - baseline.overallScore) / baseline.overallScore;
```

### Validation

```typescript
import { validateReferenceDiagram } from '@/core/services/reference';

const validation = validateReferenceDiagram(diagram);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

---

## Adding New Reference Diagrams

### Step 1: Research and Selection

1. Identify authoritative sources for the diagram type
2. Select examples that demonstrate best practices
3. Verify licensing allows usage
4. Document source URL, citation, and access date

### Step 2: Graph Extraction

1. Manually identify all nodes with positions and dimensions
2. Document all edges with source/target relationships
3. Calculate bounding box dimensions
4. Record element types and metadata

### Step 3: Metrics Calculation

1. Use `calculateExtractedGraphMetrics()` to compute baseline metrics
2. Verify metrics are within expected ranges
3. Document any anomalies or special considerations

### Step 4: Create JSON File

1. Follow the naming convention: `{type}-{source}-{variant}-v{version}.json`
2. Include all required fields
3. Add detailed annotations explaining exemplary features
4. Place in appropriate subdirectory

### Step 5: Update Manifest

Add the new diagram to `manifest.json`:

```json
{
  "id": "new-diagram-id",
  "name": "Human Readable Name",
  "type": "diagram-type",
  "nodeCount": 10,
  "edgeCount": 12,
  "overallScore": 0.85
}
```

### Step 6: Document

Add an entry to this file with:
- Name and description
- Source and citation
- License information
- Key layout patterns
- Exemplary features
- Baseline metrics table

---

## Quality Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| 0.90 - 1.00 | Excellent - Near optimal layout |
| 0.80 - 0.89 | Good - Minor improvements possible |
| 0.70 - 0.79 | Acceptable - Some layout issues |
| 0.60 - 0.69 | Fair - Significant improvements needed |
| < 0.60 | Poor - Major layout problems |

---

## License Summary

| Diagram ID | License |
|------------|---------|
| c4-bigbank-context-v1 | CC-BY-4.0 |
| c4-bigbank-container-v1 | CC-BY-4.0 |
| motivation-goal-hierarchy-v1 | Fair Use (educational) |
| motivation-stakeholder-concerns-v1 | Fair Use (educational) |
| business-order-process-v1 | Fair Use (educational) |
| business-approval-workflow-v1 | CC-BY-4.0 |

All reference diagrams are used for educational and research purposes. Diagrams based on specification patterns (ArchiMate, BPMN) are derivative works created for this project, not reproductions of copyrighted materials.

---

## References

1. Brown, S. The C4 Model for Software Architecture. https://c4model.com/
2. Structurizr. https://structurizr.com/
3. The Open Group. ArchiMate 3.2 Specification. https://pubs.opengroup.org/architecture/archimate32-doc.singlepage/
4. Object Management Group. BPMN 2.0 Specification. https://www.omg.org/spec/BPMN/2.0/
5. Camunda. BPMN 2.0 Tutorial. https://camunda.com/bpmn/

---

**Last Updated**: 2025-12-05
**Version**: 1.0.0
