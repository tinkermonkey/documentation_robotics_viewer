# Refinement Workflows Documentation

This document describes the CLI commands and automation workflows for running layout quality refinement loops.

## Overview

The refinement workflow system provides:
- Automated layout quality testing for all diagram types
- Interactive refinement with visual feedback
- Comprehensive metrics reporting
- Regression detection against baselines
- CI/CD integration for automated quality gates

## Quick Start

```bash
# Run all refinement tests
npm run refine:all

# Generate metrics report
npm run metrics:report

# Check for regressions
npm run metrics:regression-check
```

## NPM Scripts Reference

### Refinement Scripts

| Script | Description |
|--------|-------------|
| `npm run refine:motivation` | Run refinement tests for motivation diagrams |
| `npm run refine:business` | Run refinement tests for business process diagrams |
| `npm run refine:c4` | Run refinement tests for C4 architecture diagrams |
| `npm run refine:interactive` | Open headed browser for interactive refinement |
| `npm run refine:all` | Run all refinement tests |

### Metrics Scripts

| Script | Description |
|--------|-------------|
| `npm run metrics:report` | Generate comprehensive quality metrics report |
| `npm run metrics:regression-check` | Compare current metrics against baselines |
| `npm run metrics:update-baselines` | Update baseline metrics (use after intentional changes) |
| `npm run metrics:all` | Run all metrics tests |

## Detailed Usage

### Diagram-Specific Refinement

Each diagram type has its own refinement test suite that evaluates layout quality:

```bash
# Motivation Layer
npm run refine:motivation

# Output:
# - Layout quality scores for different algorithms
# - Refinement iteration tracking
# - Quality threshold checks
```

```bash
# Business Layer
npm run refine:business

# Output:
# - Process hierarchy analysis
# - Edge length uniformity metrics
# - Layout algorithm comparison
```

```bash
# C4 Architecture
npm run refine:c4

# Output:
# - Container relationship clarity
# - Crossing analysis
# - Multi-level C4 metrics
```

### Interactive Refinement

For visual inspection and manual refinement:

```bash
npm run refine:interactive
```

This opens a headed browser where you can:
- Observe layout changes in real-time
- Capture screenshots during iterations
- Compare different layout algorithms
- Test zoom/pan interactions

### Metrics Report Generation

Generate a comprehensive quality report:

```bash
npm run metrics:report
```

**Output Files:**
- `test-results/metrics/metrics-report.json` - Full JSON report
- `test-results/metrics/metrics-summary.csv` - CSV for analysis
- `test-results/metrics/quality-issues-report.json` - Identified issues

**Report Contents:**
- Overall quality scores for each diagram type
- Layout algorithm comparison
- Individual metric breakdowns
- Quality recommendations

### Regression Checking

Compare current metrics against established baselines:

```bash
npm run metrics:regression-check
```

**Regression Thresholds:**
- **Minor** (< 5% decrease): Logged but not blocking
- **Moderate** (5-10% decrease): Warning, blocks in strict mode
- **Severe** (> 10% decrease): Fails the check

**Quality Floor:** 0.5 minimum acceptable score

**Strict Mode:**
```bash
STRICT_REGRESSION=true npm run metrics:regression-check
```

### Updating Baselines

After intentional layout changes, update the baselines:

```bash
npm run metrics:update-baselines
```

This creates/updates `test-results/baselines/quality-baselines.json`.

## Test Output Structure

```
test-results/
├── baselines/
│   └── quality-baselines.json       # Baseline metrics for regression checks
├── metrics/
│   ├── metrics-report.json          # Comprehensive quality report
│   ├── metrics-summary.csv          # CSV summary for analysis
│   ├── motivation-detailed-report.json
│   ├── business-detailed-report.json
│   ├── c4-detailed-report.json
│   ├── regression-report.json       # Regression check results
│   ├── quality-issues-report.json   # Identified quality issues
│   ├── metrics-history-report.json  # Historical tracking
│   └── github-summary.md            # GitHub Actions summary
└── refinement/
    ├── motivation/
    │   └── motivation-metrics-report.json
    ├── business/
    │   └── business-metrics-report.json
    ├── c4/
    │   └── c4-metrics-report.json
    └── interactive/
        ├── session-report-*.json    # Interactive session logs
        └── *.png                     # Screenshots
```

## CI/CD Integration

### GitHub Actions Workflow

The `layout-regression.yml` workflow runs automatically on PRs that touch:
- `src/core/layout/**`
- `src/core/services/metrics/**`
- `src/core/services/comparison/**`
- `src/apps/embedded/services/refinement/**`
- `tests/refinement/**`
- `tests/metrics/**`

**Workflow Features:**
- Automatic regression detection
- PR comments with quality summary
- Artifact upload for investigation
- Baseline updates on main branch

### Manual Workflow Trigger

```bash
# Via GitHub Actions UI:
# 1. Go to Actions tab
# 2. Select "Layout Quality Regression Check"
# 3. Click "Run workflow"
# 4. Optionally enable "Update baselines" or "Strict mode"
```

### PR Comment Format

When running on PRs, the workflow posts a comment with:
- Overall pass/fail status
- Summary table of checks
- Regression counts by severity
- Instructions for investigation

## Quality Metrics

### Core Metrics (greadability.js)

| Metric | Description | Weight |
|--------|-------------|--------|
| Crossing Number | Edge crossing density (1 = none) | 25-30% |
| Crossing Angle | Quality of crossing angles (1 = ideal 70°) | 10-15% |
| Angular Resolution Min | Minimum edge spacing at nodes | 15-20% |
| Angular Resolution Dev | Uniformity of edge angles | 10-15% |

### Extended Metrics

| Metric | Description | Weight |
|--------|-------------|--------|
| Edge Length Uniformity | Consistency of edge lengths | 10-25% |
| Node Occlusion | Overlapping node count | 10-15% |
| Aspect Ratio | Layout bounding box ratio | (informational) |
| Density | Graph connectivity | (informational) |

### Diagram-Specific Weights

**Motivation Diagrams:**
- Prioritize crossing minimization (30%)
- Higher angular resolution weight (20%)

**Business Diagrams:**
- Prioritize edge length uniformity (25%)
- Balance between crossings and spacing

**C4 Diagrams:**
- Prioritize crossing minimization (30%)
- Clear container relationships
- No node occlusion tolerance

## Troubleshooting

### Common Issues

**"No baselines found"**
```bash
# Create initial baselines
npm run metrics:update-baselines
```

**"Severe regression detected"**
1. Run `npm run metrics:regression-check` locally
2. Review `test-results/metrics/regression-report.json`
3. If intentional, update baselines
4. If unintentional, fix the layout code

**"Tests timing out"**
```bash
# Increase timeout in playwright config
# Or run specific test:
npx playwright test tests/refinement/motivation-refinement.spec.ts --timeout=60000
```

### Debug Mode

```bash
# Run with Playwright debug UI
npx playwright test tests/refinement/motivation-refinement.spec.ts --debug

# Run with headed browser and slow motion
npx playwright test tests/refinement/motivation-refinement.spec.ts --headed --slowmo=500
```

### Verbose Output

```bash
# Enable verbose logging
DEBUG=pw:api npm run refine:motivation
```

## Best Practices

1. **Run regression checks before PR**
   ```bash
   npm run metrics:regression-check
   ```

2. **Update baselines after intentional changes**
   ```bash
   npm run metrics:update-baselines
   git add test-results/baselines/
   git commit -m "Update layout quality baselines"
   ```

3. **Review quality reports regularly**
   ```bash
   npm run metrics:report
   cat test-results/metrics/quality-issues-report.json | jq '.issues'
   ```

4. **Use interactive mode for visual verification**
   ```bash
   npm run refine:interactive
   ```

5. **Set up baseline snapshots in CI**
   - Baselines are stored as GitHub artifacts
   - Automatically updated on main branch merges

## API Reference

### Quality Score Calculation

```typescript
import { calculateLayoutQuality } from '../src/core/services/metrics/graphReadabilityService';

const report = calculateLayoutQuality(nodes, edges, 'hierarchical', 'motivation');

console.log(report.overallScore);     // 0.0 - 1.0
console.log(report.metrics);          // Core metrics
console.log(report.extendedMetrics);  // Extended metrics
```

### Regression Detection

```typescript
import { MetricsHistoryService } from '../src/core/services/metrics/metricsHistoryService';

const service = new MetricsHistoryService();
const regression = service.detectRegression(currentReport);

if (regression.hasRegression) {
  console.log(`Severity: ${regression.severity}`);
  console.log(`Change: ${regression.overallPercentageChange}%`);
}
```

### Combined Quality Score

```typescript
import { calculateCombinedScore } from '../src/core/services/comparison/qualityScoreService';

const score = await calculateCombinedScore(
  nodes,
  edges,
  'hierarchical',
  'c4',
  generatedScreenshot,
  referenceImage
);

console.log(score.qualityClass);  // 'excellent' | 'good' | 'acceptable' | 'poor'
console.log(score.meetsThreshold);
```

## Example Refinement Session Walkthrough

This section provides a step-by-step walkthrough of a complete refinement session for improving a C4 container diagram layout.

### Scenario

You've made changes to the C4 container layout algorithm and want to verify the quality hasn't regressed, and potentially improve it.

### Step 1: Check Current Quality

```bash
# Run the C4 refinement tests to see current state
npm run refine:c4
```

**Sample Output:**
```
Running C4 Architecture Refinement Tests...

Test: c4-container-layout-quality
  Layout Algorithm: hierarchical
  Initial Quality Score: 0.72 (acceptable)

  Metrics Breakdown:
    - Crossing Number:      0.85 (good)
    - Crossing Angle:       0.78 (acceptable)
    - Angular Resolution:   0.68 (fair)
    - Edge Length:          0.71 (acceptable)

  Warnings:
    - Angular resolution below target (0.80)
    - 2 edge crossings detected
```

### Step 2: Generate Detailed Report

```bash
npm run metrics:report
```

**Review the report:**
```bash
cat test-results/metrics/c4-detailed-report.json | jq '.metrics'
```

**Sample Report Excerpt:**
```json
{
  "diagramType": "c4",
  "layoutType": "hierarchical",
  "overallScore": 0.72,
  "metrics": {
    "crossingNumber": 0.85,
    "crossingAngle": 0.78,
    "angularResolutionMin": 0.68,
    "angularResolutionDev": 0.72
  },
  "extendedMetrics": {
    "edgeLength": {
      "min": 80,
      "max": 320,
      "mean": 156,
      "stdDev": 45.2
    },
    "nodeNodeOcclusion": 0,
    "aspectRatio": 1.4,
    "density": 0.35
  },
  "warnings": [
    "Angular resolution (0.68) below threshold (0.80)",
    "Edge length variance high (stdDev: 45.2)"
  ],
  "suggestions": [
    "Increase rank spacing to improve angular resolution",
    "Adjust node spacing for more uniform edge lengths"
  ]
}
```

### Step 3: Run Interactive Refinement

```bash
npm run refine:interactive
```

This opens a headed browser. The test pauses at key points:

1. **Initial Layout**: Observe the current layout
2. **After Each Iteration**: See the effect of parameter changes
3. **Final Layout**: Compare before/after

**In the browser:**
- Navigate to the C4 diagram view
- Use the refinement feedback panel
- Provide feedback on layout aspects

### Step 4: Provide Human Feedback

Using the RefinementFeedbackPanel in the UI:

**Iteration 1:**
```
Aspect: spacing
Direction: increase
Intensity: moderate
Notes: "Containers are too close together, edges crossing"
```

**System Response:**
```
Parameter Adjustments:
  - hierarchical.nodeSpacing: 100 → 130 (+30)
  - hierarchical.rankSpacing: 150 → 188 (+38)

Re-calculating layout...

New Quality Score: 0.76 (+0.04)
  - Crossing Number:      0.88 (+0.03)
  - Angular Resolution:   0.73 (+0.05)
```

**Iteration 2:**
```
Aspect: alignment
Direction: increase
Intensity: slight
Notes: "Better, but some nodes not aligned"
```

**System Response:**
```
Parameter Adjustments:
  - hierarchical.nodeSpacing: 130 → 140 (+10)

Re-calculating layout...

New Quality Score: 0.79 (+0.03)
  - Crossing Number:      0.90 (+0.02)
  - Angular Resolution:   0.76 (+0.03)
```

**Iteration 3:**
```
Aspect: overall
Direction: acceptable
Intensity: N/A
Notes: "Layout looks good now"
```

### Step 5: Review Session Results

The session generates a report at `test-results/refinement/interactive/session-report-{timestamp}.json`:

```json
{
  "sessionId": "c4-refinement-2025-12-05T10-30-00",
  "diagramType": "c4",
  "layoutType": "hierarchical",
  "iterations": [
    {
      "iteration": 0,
      "qualityScore": 0.72,
      "parameters": {
        "nodeSpacing": 100,
        "rankSpacing": 150
      },
      "feedback": null
    },
    {
      "iteration": 1,
      "qualityScore": 0.76,
      "parameters": {
        "nodeSpacing": 130,
        "rankSpacing": 188
      },
      "feedback": {
        "aspect": "spacing",
        "direction": "increase",
        "intensity": "moderate"
      },
      "improvement": 0.04
    },
    {
      "iteration": 2,
      "qualityScore": 0.79,
      "parameters": {
        "nodeSpacing": 140,
        "rankSpacing": 188
      },
      "feedback": {
        "aspect": "alignment",
        "direction": "increase",
        "intensity": "slight"
      },
      "improvement": 0.03
    }
  ],
  "finalScore": 0.79,
  "totalImprovement": 0.07,
  "duration": "3m 45s",
  "status": "completed"
}
```

### Step 6: Update Layout Defaults (If Appropriate)

If the new parameters should become the defaults:

1. Update the layout engine configuration:
   ```typescript
   // src/core/layout/business/HierarchicalBusinessLayout.ts
   const DEFAULT_OPTIONS = {
     nodeSpacing: 140,  // Was 100
     rankSpacing: 188,  // Was 150
     // ...
   };
   ```

2. Run tests to verify:
   ```bash
   npm run refine:c4
   npm run metrics:regression-check
   ```

3. Update baselines:
   ```bash
   npm run metrics:update-baselines
   ```

4. Commit changes:
   ```bash
   git add src/core/layout/business/HierarchicalBusinessLayout.ts
   git add test-results/baselines/quality-baselines.json
   git commit -m "Improve C4 container layout defaults based on refinement session"
   ```

### Step 7: Verify No Regressions

```bash
npm run metrics:regression-check
```

**Expected Output:**
```
Regression Check Results:

  C4 Diagrams:
    Baseline Score: 0.72
    Current Score:  0.79
    Change:         +9.7% (improvement)
    Status:         PASS

  Business Diagrams:
    Baseline Score: 0.81
    Current Score:  0.81
    Change:         0.0%
    Status:         PASS

  Motivation Diagrams:
    Baseline Score: 0.85
    Current Score:  0.84
    Change:         -1.2% (minor)
    Status:         PASS

Overall: 3/3 passed, 0 regressions detected
```

### Session Summary

| Phase | Duration | Result |
|-------|----------|--------|
| Initial Assessment | 30s | Score: 0.72 |
| Report Analysis | 1m | Identified weak metrics |
| Interactive Refinement | 3m | 3 iterations |
| Verification | 30s | No regressions |
| **Total** | **~5m** | **+9.7% improvement** |

### Tips for Effective Refinement

1. **Start with metrics report** - Understand which metrics are weak before starting
2. **Use moderate intensity first** - Avoid overcorrecting
3. **Focus on one aspect at a time** - Makes it easier to attribute improvements
4. **Take screenshots** - Visual comparison helps validate metrics
5. **Document your rationale** - Use the notes field to explain changes
6. **Verify other diagram types** - Layout changes may affect other views

---

## Related Documentation

- [VISUALIZATION_OPTIMIZATION.md](./VISUALIZATION_OPTIMIZATION.md) - System architecture overview
- [REFERENCE_DIAGRAMS.md](./REFERENCE_DIAGRAMS.md) - Reference diagram catalog
- [TROUBLESHOOTING_LAYOUT.md](./TROUBLESHOOTING_LAYOUT.md) - Common issues and solutions
- [Layout Algorithms](./layout-algorithms.md) - Detailed layout algorithm documentation
- [C4 Visualization](./C4_VISUALIZATION.md) - C4 diagram specifics
- [YAML Models](./claude_thoughts/YAML_MODELS.md) - Model format specification

---

**Last Updated:** 2025-12-05
**Version:** 1.0.0
