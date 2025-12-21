# Visualization Optimization Loop

This document describes the architecture and operation of the visualization optimization system, which provides automated layout quality assessment, reference diagram comparison, and human-in-the-loop refinement capabilities.

## Quick Reference: Ladle-Based Testing

**Current Status**: ✅ The refinement testing system now uses **Ladle** (component story viewer) for optimal isolation and performance.

| Aspect | Details |
|--------|---------|
| **Environment** | `http://localhost:6006` (Ladle catalog) |
| **Test Files** | `tests/refinement/*.ladle.spec.ts` |
| **Stories** | `src/apps/embedded/components/refinement/*.stories.tsx` |
| **Config** | `playwright.refinement.config.ts` |
| **Startup Time** | ~2-3 seconds (40% faster than embedded app) |
| **Key Command** | `npm run refine:all` |

**Why Ladle?**
- Better component isolation (no global store pollution)
- Faster test execution (2-3s vs 3-5s)
- Automated discovery via `/meta.json` API
- Cleaner screenshots (preview mode eliminates UI chrome)
- Scalable test organization

**For Migration from Embedded App Tests**: See [REFINEMENT_WORKFLOWS.md](./REFINEMENT_WORKFLOWS.md#migration-guide-from-embedded-app-to-ladle)

## Overview

The visualization optimization loop is a feedback-driven system that improves diagram layouts through:

1. **Quantitative Metrics**: Automated measurement of layout quality using greadability.js
2. **Visual Comparison**: SSIM and perceptual hash comparison against reference diagrams
3. **Human Feedback**: Interactive refinement with parameter adjustment suggestions
4. **Regression Detection**: Baseline comparison to prevent quality degradation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VISUALIZATION OPTIMIZATION LOOP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Input      │    │   Layout     │    │   Render     │                  │
│  │   Model      │───▶│   Engine     │───▶│   Diagram    │                  │
│  │              │    │              │    │              │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                             ▲                    │                          │
│                             │                    ▼                          │
│                    ┌────────┴───────┐    ┌──────────────┐                  │
│                    │   Parameter    │    │   Capture    │                  │
│                    │   Adjustment   │    │   Screenshot │                  │
│                    │                │    │              │                  │
│                    └────────▲───────┘    └──────────────┘                  │
│                             │                    │                          │
│  ┌──────────────┐          │                    ▼                          │
│  │   Human      │    ┌─────┴────────┐    ┌──────────────┐                  │
│  │   Feedback   │───▶│   Feedback   │◀───│   Quality    │                  │
│  │   Panel      │    │   Translator │    │   Scoring    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                  │                          │
│                                                  ▼                          │
│                             ┌─────────────────────────────┐                │
│                             │ ┌─────────┐   ┌───────────┐ │                │
│                             │ │Readabil │   │ Visual    │ │                │
│                             │ │Metrics  │ + │ Similarity│ │                │
│                             │ └─────────┘   └───────────┘ │                │
│                             │     Combined Quality Score  │                │
│                             └─────────────────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## System Architecture

### Component Overview

```
src/
├── core/
│   ├── layout/                          # Layout Engines
│   │   ├── business/
│   │   │   ├── HierarchicalBusinessLayout.ts
│   │   │   ├── ForceDirectedBusinessLayout.ts
│   │   │   ├── SwimlaneBusinessLayout.ts
│   │   │   └── MatrixBusinessLayout.ts
│   │   ├── verticalLayerLayout.ts
│   │   ├── motivationLayouts.ts
│   │   ├── edgeBundling.ts
│   │   └── semanticZoomController.ts
│   │
│   ├── services/
│   │   ├── metrics/                     # Quality Metrics
│   │   │   ├── graphReadabilityService.ts
│   │   │   └── metricsHistoryService.ts
│   │   │
│   │   ├── comparison/                  # Visual Comparison
│   │   │   ├── imageSimilarityService.ts
│   │   │   ├── screenshotService.ts
│   │   │   ├── qualityScoreService.ts
│   │   │   └── heatmapService.ts
│   │   │
│   │   └── reference/                   # Reference Diagrams
│   │       └── referenceDiagramService.ts
│   │
│   └── types/
│       └── referenceDiagram.ts
│
└── apps/embedded/
    ├── services/refinement/             # Feedback Processing
    │   └── feedbackToParameterService.ts
    │
    ├── components/refinement/           # UI Components
    │   ├── RefinementFeedbackPanel.tsx
    │   ├── SideBySideComparison.tsx
    │   └── MetricsDashboard.tsx
    │
    ├── hooks/
    │   └── useRefinementSession.ts
    │
    └── types/
        └── refinement.ts
```

### Data Flow

```
Input Model (JSON/YAML)
         │
         ▼
┌─────────────────────┐
│  Model Parser       │  businessLayerParser, yamlParser
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Graph Builder      │  BusinessGraph, MotivationGraph, C4Graph
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Node Transformer   │  Convert to ReactFlow format
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Layout Engine      │  Calculate positions
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  ReactFlow Render   │  Display diagram
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Screenshot Service │  Capture rendered diagram
└─────────────────────┘
         │
         ├──────────────────────────────┐
         ▼                              ▼
┌─────────────────────┐    ┌─────────────────────┐
│  Readability        │    │  Image Similarity   │
│  Metrics            │    │  Comparison         │
│  (greadability.js)  │    │  (SSIM + Perceptual)│
└─────────────────────┘    └─────────────────────┘
         │                              │
         └──────────────┬───────────────┘
                        ▼
              ┌─────────────────────┐
              │  Combined Quality   │
              │  Score              │
              └─────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
┌─────────────────────┐    ┌─────────────────────┐
│  Regression Check   │    │  Human Feedback     │
│  (vs Baseline)      │    │  (if needed)        │
└─────────────────────┘    └─────────────────────┘
                                       │
                                       ▼
                          ┌─────────────────────┐
                          │  Parameter          │
                          │  Adjustment         │
                          └─────────────────────┘
                                       │
                                       ▼
                              (Back to Layout Engine)
```

## Core Services

### 1. Graph Readability Service

**Location**: `src/core/services/metrics/graphReadabilityService.ts`

Provides quantitative layout quality measurement using [greadability.js](https://github.com/cmu-vis-idc/greadability.js).

#### Metrics Calculated

| Metric | Description | Ideal Value |
|--------|-------------|-------------|
| Crossing Number | Edge crossing density (normalized) | 1.0 (no crossings) |
| Crossing Angle | Quality of crossing angles | 1.0 (70° ideal) |
| Angular Resolution Min | Minimum edge spacing at nodes | 1.0 |
| Angular Resolution Dev | Uniformity of edge angles | 1.0 |

#### Extended Metrics

| Metric | Description |
|--------|-------------|
| Edge Length | Statistics (min, max, mean, stdDev) |
| Node-Node Occlusion | Overlapping node count |
| Aspect Ratio | Layout bounding box ratio |
| Density | Graph connectivity measure |

#### API

```typescript
import {
  calculateLayoutQuality,
  LayoutQualityReport,
  DiagramType,
  LayoutType,
} from '@/core/services/metrics/graphReadabilityService';

// Calculate quality metrics for a rendered diagram
const report: LayoutQualityReport = calculateLayoutQuality(
  nodes,          // ReactFlow nodes
  edges,          // ReactFlow edges
  'hierarchical', // Layout algorithm used
  'business'      // Diagram type
);

console.log(report.overallScore);     // 0.0 - 1.0
console.log(report.metrics);          // Core readability metrics
console.log(report.extendedMetrics);  // Extended metrics
console.log(report.warnings);         // Quality warnings
```

#### Diagram-Type Weights

Different diagram types use different metric weights:

**Motivation Diagrams**:
- Crossing minimization: 30%
- Angular resolution: 20%

**Business Process Diagrams**:
- Edge length uniformity: 25%
- Balanced crossings/spacing

**C4 Architecture Diagrams**:
- Crossing minimization: 30%
- No node occlusion tolerance

---

### 2. Image Similarity Service

**Location**: `src/core/services/comparison/imageSimilarityService.ts`

Provides visual comparison between generated and reference diagrams.

#### Methods

| Method | Description | Performance |
|--------|-------------|-------------|
| SSIM | Structural Similarity Index | <500ms |
| Perceptual Hash | 64-bit average hash | <50ms |
| Combined | Both methods weighted | <600ms |

#### API

```typescript
import {
  compareImages,
  compareWithSSIM,
  compareWithPerceptualHash,
  SimilarityResult,
  getSimilarityClass,
} from '@/core/services/comparison/imageSimilarityService';

// Full comparison (SSIM + Perceptual Hash)
const result: SimilarityResult = await compareImages(
  generatedImage,  // ImageData or base64 string
  referenceImage,
  { windowSize: 8, k1: 0.01, k2: 0.03 }
);

console.log(result.ssim.mssim);              // 0.0 - 1.0
console.log(result.perceptualHash.similarity);// 0.0 - 1.0
console.log(result.combinedScore);            // Weighted average

// Get quality classification
const qualityClass = getSimilarityClass(result.combinedScore);
// 'excellent' | 'good' | 'fair' | 'poor'
```

---

### 3. Quality Score Service

**Location**: `src/core/services/comparison/qualityScoreService.ts`

Combines readability metrics and visual similarity into a unified quality score.

#### Score Composition

```
Combined Score = (Readability × 0.6) + (Similarity × 0.4)
```

(default weights, configurable via options)

Default weights prioritize layout quality (60%) over visual matching (40%).

#### Quality Classes

| Score Range | Class | Description |
|-------------|-------|-------------|
| 0.90 - 1.00 | Excellent | Near optimal layout |
| 0.80 - 0.89 | Good | Minor improvements possible |
| 0.70 - 0.79 | Acceptable | Meets minimum standards |
| 0.60 - 0.69 | Poor | Significant issues |
| < 0.60 | Unacceptable | Major layout problems |

#### API

```typescript
import {
  calculateCombinedScore,
  compareQualityScores,
  getImprovementSuggestions,
  CombinedQualityScore,
} from '@/core/services/comparison/qualityScoreService';

// Calculate combined score
const score: CombinedQualityScore = await calculateCombinedScore(
  nodes,
  edges,
  'hierarchical',
  'c4',
  generatedScreenshot,
  referenceImage,
  {
    readabilityWeight: 0.6,
    similarityWeight: 0.4,
    qualityThreshold: 0.7,
  }
);

console.log(score.combinedScore);    // 0.0 - 1.0
console.log(score.qualityClass);     // Classification
console.log(score.meetsThreshold);   // Boolean

// Compare before/after refinement
const comparison = compareQualityScores(scoreBefore, scoreAfter);
console.log(comparison.improvement); // +/- delta
console.log(comparison.improved);    // Boolean

// Get improvement suggestions
const suggestions = getImprovementSuggestions(score, score.breakdown.graphMetrics);
// Array of specific suggestions based on weak metrics
```

---

### 4. Metrics History Service

**Location**: `src/core/services/metrics/metricsHistoryService.ts`

Tracks metrics over time and detects regressions.

#### Regression Detection

| Severity | Threshold | Action |
|----------|-----------|--------|
| None | < 2% decrease | Pass |
| Minor | 2-5% decrease | Warning |
| Moderate | 5-10% decrease | Block in strict mode |
| Severe | > 10% decrease | Fail |

#### Quality Floor

Minimum acceptable score: **0.5**

Scores below this floor trigger immediate failure regardless of regression status.

#### API

```typescript
import { MetricsHistoryService } from '@/core/services/metrics/metricsHistoryService';

const service = new MetricsHistoryService();

// Record a metrics snapshot
service.recordSnapshot(qualityReport, 'business', 'hierarchical');

// Check for regressions
const regression = service.detectRegression(currentReport);
if (regression.hasRegression) {
  console.log(`Severity: ${regression.severity}`);
  console.log(`Change: ${regression.overallPercentageChange}%`);
  console.log(`Metric changes: ${regression.metricChanges}`);
}

// Get historical trends
const history = service.getHistory('business', 'hierarchical');
```

---

### 5. Reference Diagram Service

**Location**: `src/core/services/reference/referenceDiagramService.ts`

Manages canonical reference diagrams as quality targets.

#### Reference Types

- `c4-context`: C4 System Context diagrams
- `c4-container`: C4 Container diagrams
- `c4-component`: C4 Component diagrams
- `motivation-ontology`: ArchiMate motivation diagrams
- `business-process`: BPMN-style process diagrams

#### API

```typescript
import {
  loadReferenceDiagram,
  loadReferenceDiagramsByType,
  getBaselineMetrics,
  validateReferenceDiagram,
} from '@/core/services/reference/referenceDiagramService';

// Load a specific reference diagram
const diagram = await loadReferenceDiagram('c4-bigbank-context-v1');

// Load all diagrams of a type
const c4Diagrams = await loadReferenceDiagramsByType('c4-context');

// Get baseline metrics for comparison
const baseline = await getBaselineMetrics('c4-bigbank-context-v1');

// Validate reference diagram structure
const validation = validateReferenceDiagram(diagram);
if (!validation.isValid) {
  console.error('Errors:', validation.errors);
}
```

See [REFERENCE_DIAGRAMS.md](./REFERENCE_DIAGRAMS.md) for the complete catalog.

---

### 6. Feedback to Parameter Service

**Location**: `src/apps/embedded/services/refinement/feedbackToParameterService.ts`

Translates human feedback into layout parameter adjustments.

#### Feedback Structure

```typescript
interface HumanFeedback {
  aspect: 'spacing' | 'alignment' | 'grouping' | 'routing' | 'overall';
  direction: 'increase' | 'decrease' | 'acceptable';
  intensity: 'slight' | 'moderate' | 'significant';
  notes?: string;
}
```

#### Parameter Ranges

| Parameter | Range | Default | Affects |
|-----------|-------|---------|---------|
| `forceDirected.chargeStrength` | -5000 to 0 | -1000 | Node repulsion |
| `forceDirected.linkDistance` | 50 to 500 | 150 | Edge length |
| `forceDirected.centerForce` | 0 to 1 | 0.5 | Center pull |
| `forceDirected.iterations` | 50 to 500 | 300 | Simulation steps |
| `hierarchical.nodeSpacing` | 50 to 200 | 100 | Horizontal spacing |
| `hierarchical.rankSpacing` | 80 to 300 | 150 | Vertical spacing |

#### Intensity Multipliers

| Intensity | Multiplier | Effect |
|-----------|------------|--------|
| Slight | 0.1x | 10% of base delta |
| Moderate | 0.25x | 25% of base delta |
| Significant | 0.5x | 50% of base delta |

#### API

```typescript
import {
  translateFeedbackToParameters,
  PARAMETER_RANGES,
  FeedbackTranslationResult,
} from '@/apps/embedded/services/refinement/feedbackToParameterService';

const feedback: HumanFeedback = {
  aspect: 'spacing',
  direction: 'increase',
  intensity: 'moderate',
  notes: 'Nodes are too crowded',
};

const result: FeedbackTranslationResult = translateFeedbackToParameters(
  feedback,
  currentParameters
);

console.log(result.suggestions);           // Parameter change suggestions
console.log(result.updatedParameters);     // New parameter values
console.log(result.confidence);            // Confidence in suggestions
```

---

## Layout Engines

### Available Algorithms

| Engine | Location | Best For |
|--------|----------|----------|
| Hierarchical | `business/HierarchicalBusinessLayout.ts` | Process flows, org charts |
| Force-Directed | `business/ForceDirectedBusinessLayout.ts` | Relationship networks |
| Swimlane | `business/SwimlaneBusinessLayout.ts` | Role-based processes |
| Matrix | `business/MatrixBusinessLayout.ts` | Cross-functional maps |
| Vertical Layer | `verticalLayerLayout.ts` | Multi-layer architectures |
| Motivation | `motivationLayouts.ts` | Goals, stakeholders |

### Layout Factory Pattern

```typescript
import { getLayoutEngine } from '@/core/layout/business';

// Get appropriate engine for algorithm
const engine = getLayoutEngine('hierarchical');

// Calculate layout
const result = await engine.calculate(graph, options);

// Result contains positioned nodes and edges
console.log(result.nodes);    // Positioned ReactFlow nodes
console.log(result.edges);    // Routed edges
console.log(result.metadata); // Layout statistics
```

### Web Worker Support

For graphs with >100 nodes, layout calculations are offloaded to a Web Worker:

```
┌─────────────────────┐    ┌─────────────────────┐
│   Main Thread       │    │   Web Worker        │
│                     │    │                     │
│ graph, options ─────┼────┼─▶ dagre.layout()   │
│                     │    │                     │
│ positions ◀─────────┼────┼── result           │
│                     │    │                     │
│ Apply to ReactFlow  │    │                     │
└─────────────────────┘    └─────────────────────┘
```

**Worker Location**: `/public/workers/layoutWorker.js`

**Threshold**: >100 nodes triggers worker usage

**Timeout**: 30 seconds maximum

---

## Refinement UI Components

### RefinementFeedbackPanel

Collects human feedback on layout quality.

**Features**:
- Aspect selection (spacing, alignment, grouping, routing, overall)
- Direction toggle (increase/decrease/acceptable)
- Intensity slider (slight/moderate/significant)
- Optional notes field

### SideBySideComparison

Displays reference and generated diagrams side-by-side.

**Features**:
- Synchronized zoom/pan
- Difference highlighting
- Toggle overlay mode
- Quality score display

### MetricsDashboard

Tracks refinement iteration progress.

**Features**:
- Score timeline chart
- Metric breakdown table
- Iteration history
- Improvement delta display

---

## Testing

### Test Execution Environment

The refinement testing system has been migrated to use **Ladle** (component story viewer) for better isolation and performance. This provides:
- **40% faster startup** (2-3s vs 3-5s for full embedded app)
- **Better isolation** (stories run independently without global store pollution)
- **Automated discovery** (stories discovered via `/meta.json` API)
- **Cleaner captures** (preview mode eliminates UI chrome)

**Current Environment**: `http://localhost:6006` (Ladle catalog)

**Legacy Environment** (deprecated): `http://localhost:3001` (Vite embedded app)

### Test Suites

#### Ladle-Based Tests (Current - Recommended)

| Suite | Location | Purpose | Status |
|-------|----------|---------|--------|
| Motivation Refinement | `tests/refinement/motivation-refinement.ladle.spec.ts` | Motivation layout quality | ✅ Current |
| Business Refinement | `tests/refinement/business-refinement.ladle.spec.ts` | Business process layouts | ✅ Current |
| C4 Refinement | `tests/refinement/c4-refinement.ladle.spec.ts` | C4 architecture layouts | ✅ Current |
| Application Refinement | `tests/refinement/application-refinement.ladle.spec.ts` | Application layer layouts | ✅ Current |
| Security Refinement | `tests/refinement/security-refinement.ladle.spec.ts` | Security layer layouts | ✅ Current |
| Technology Refinement | `tests/refinement/technology-refinement.ladle.spec.ts` | Technology layer layouts | ✅ Current |
| API Refinement | `tests/refinement/api-refinement.ladle.spec.ts` | API layer layouts | ✅ Current |
| Data Model Refinement | `tests/refinement/datamodel-refinement.ladle.spec.ts` | Data model layer layouts | ✅ Current |
| Datastore Refinement | `tests/refinement/datastore-refinement.ladle.spec.ts` | Datastore layer layouts | ✅ Current |
| UX Refinement | `tests/refinement/ux-refinement.ladle.spec.ts` | UX layer layouts | ✅ Current |
| Navigation Refinement | `tests/refinement/navigation-refinement.ladle.spec.ts` | Navigation layer layouts | ✅ Current |
| APM Refinement | `tests/refinement/apm-refinement.ladle.spec.ts` | APM/Observability layer layouts | ✅ Current |
| Cross-Layer Refinement | `tests/refinement/crosslayer-refinement.ladle.spec.ts` | Cross-layer relationships | ✅ Current |
| Metrics Report | `tests/metrics/metrics-report.spec.ts` | Report generation | ✅ Current |
| Regression | `tests/metrics/regression-check.spec.ts` | Baseline comparison | ✅ Current |

#### Legacy Embedded App Tests (Deprecated)

| Suite | Location | Purpose | Status |
|-------|----------|---------|--------|
| Motivation Refinement | `tests/refinement/motivation-refinement.spec.ts` | Motivation layout quality | ⚠️ Deprecated |
| Business Refinement | `tests/refinement/business-refinement.spec.ts` | Business process layouts | ⚠️ Deprecated |
| C4 Refinement | `tests/refinement/c4-refinement.spec.ts` | C4 architecture layouts | ⚠️ Deprecated |
| Interactive | `tests/refinement/interactive-refinement.spec.ts` | Manual inspection | ⚠️ Deprecated |

**Deprecation Notice**: The legacy embedded app test files (`*.spec.ts` without `.ladle` suffix) are no longer maintained. Please migrate to Ladle-based tests. See [REFINEMENT_WORKFLOWS.md](./REFINEMENT_WORKFLOWS.md#migration-guide-from-embedded-app-to-ladle) for migration instructions.

### Running Tests

#### Current Approach (Ladle-Based)

```bash
# All Ladle-based refinement tests
npm run refine:all

# Specific diagram type
npm run refine:motivation
npm run refine:business
npm run refine:c4

# Interactive mode (headed browser with Ladle)
npm run refine:interactive

# Metrics generation (uses Ladle)
npm run metrics:report
npm run metrics:regression-check

# Run only Ladle tests (exclude deprecated embedded app tests)
npx playwright test tests/refinement/*.ladle.spec.ts --config=playwright.refinement.config.ts
```

#### Configuration

The `playwright.refinement.config.ts` is configured for Ladle:

```typescript
use: {
  baseURL: 'http://localhost:6006',  // Ladle port
},
webServer: {
  command: 'npm run catalog:dev',    // Start Ladle
  url: 'http://localhost:6006/meta.json',
},
```

### Story-Based Test Organization

Refinement tests are organized as Ladle stories for better isolation:

```
src/apps/embedded/components/refinement/
├── MotivationLayoutTest.stories.tsx     # Motivation layer tests
├── BusinessLayoutTest.stories.tsx       # Business layer tests
├── TechnologyLayoutTest.stories.tsx     # Technology layer tests
├── ApplicationLayoutTest.stories.tsx    # Application layer tests
├── SecurityLayoutTest.stories.tsx       # Security layer tests
├── APILayoutTest.stories.tsx            # API layer tests
├── DataModelLayoutTest.stories.tsx      # Data model layer tests
├── UXLayoutTest.stories.tsx             # UX layer tests
├── NavigationLayoutTest.stories.tsx     # Navigation layer tests
├── APMLayoutTest.stories.tsx            # APM/Observability layer tests
├── C4LayoutTest.stories.tsx             # C4 architecture tests
├── CrossLayerLayoutTest.stories.tsx     # Cross-layer tests
├── MetricsDashboard.stories.tsx         # Metrics visualization
└── SideBySideComparison.stories.tsx     # Reference comparison
```

Each story file includes:
- **Small graph variant** - Tests with <10 nodes
- **Medium graph variant** - Tests with 10-50 nodes
- **Large graph variant** - Tests with >50 nodes
- **Algorithm variants** - Different layout algorithm options

Tests automatically discover stories via the Ladle `/meta.json` API.

### Test Helpers

Utility functions in `tests/refinement/helpers/`:

```typescript
// Story discovery and URL generation
getStoryUrl(storyId, mode)      // Generate story URL with optional preview mode
discoverRefinementStories(page) // Auto-discover all refinement stories

// DOM extraction for metrics calculation
extractNodePositions(page)      // Get node positions from rendered diagram
extractEdges(page)              // Get edge connections from DOM
positionsToNodes(positions)     // Convert positions to node objects for metrics
```

See [REFINEMENT_WORKFLOWS.md](./REFINEMENT_WORKFLOWS.md) for detailed workflow documentation and migration guidance.

---

## Performance Targets

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Layout (100 nodes) | < 200ms | Dagre + caching |
| Layout (500 nodes) | < 3s | Web Worker |
| SSIM Comparison | < 500ms | Canvas-based |
| Perceptual Hash | < 50ms | Optimized DCT |
| Full Quality Score | < 1s | Combined pipeline |
| Screenshot Capture | < 2s | Playwright + retina |
| Heatmap Generation | < 300ms | Canvas diff |

---

## Best Practices

### 1. Run Regression Checks Before PR

```bash
npm run metrics:regression-check
```

### 2. Update Baselines After Intentional Changes

```bash
npm run metrics:update-baselines
git add test-results/baselines/
git commit -m "Update layout quality baselines"
```

### 3. Use Interactive Mode for Visual Verification

```bash
npm run refine:interactive
```

### 4. Monitor Quality Metrics in CI

The `layout-regression.yml` workflow runs automatically on relevant PRs.

### 5. Document Reference Diagrams

When adding new reference diagrams, follow the process in [REFERENCE_DIAGRAMS.md](./REFERENCE_DIAGRAMS.md#adding-new-reference-diagrams).

---

## Related Documentation

- [REFINEMENT_WORKFLOWS.md](./REFINEMENT_WORKFLOWS.md) - CLI commands and automation
- [REFERENCE_DIAGRAMS.md](./REFERENCE_DIAGRAMS.md) - Reference diagram catalog
- [TROUBLESHOOTING_LAYOUT.md](./TROUBLESHOOTING_LAYOUT.md) - Common issues and solutions
- [layout-algorithms.md](./layout-algorithms.md) - Layout algorithm details
- [C4_VISUALIZATION.md](./C4_VISUALIZATION.md) - C4 model specifics

---

**Last Updated**: 2025-12-05
**Version**: 1.0.0
