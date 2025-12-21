---
description: Report which components lack stories and suggest prioritized action plan
argument-hint: "[--detailed] [--by-tier]"
---

# Catalog Coverage Report

Use the catalog manager agent to identify which components need stories.

## What This Command Does

Analyzes catalog completeness by:

- Finding all components without story files
- Identifying orphaned stories (stories without components)
- Classifying components by complexity tier
- Prioritizing by ease and importance
- Estimating time to full coverage
- Suggesting recommended action plan

## Usage

```
/catalog-coverage
/catalog-coverage --detailed
/catalog-coverage --by-tier
```

## Flags

- `--detailed` - Show component analysis details (props, dependencies)
- `--by-tier` - Group missing stories by complexity tier

## Instructions for Claude Code

When the user runs this command, use the **catalog-manager agent** to generate coverage report.

### Process

1. **Scan Component Files**
   ```bash
   find src -name "*.tsx" ! -name "*.stories.tsx" ! -name "*.test.tsx" ! -name "index.ts"
   ```

2. **Scan Story Files**
   ```bash
   find src -name "*.stories.tsx"
   ```

3. **Cross-reference**
   - Find components without corresponding stories
   - Identify orphaned stories (stories without components)

4. **Classify by Tier**
   - Analyze each unstoryed component
   - Determine complexity tier (1-5)
   - Assess component dependencies

5. **Generate Report**
   ```
   📊 Catalog Coverage Report
   ==========================

   Total Components: 54
   With Stories: 48 (89%)
   Without Stories: 6 (11%)

   Trend: ↑ +1 (previous: 47/53)
   ```

6. **Analyze Patterns**
   - Which tiers are underrepresented?
   - Any problem areas?
   - Dependencies between unstoryed components?

7. **Create Action Plan**
   - Prioritize by tier (easiest first)
   - Estimate time per component
   - Suggest batch strategies

8. **Report Results**
   - Show missing components by tier
   - Provide coverage metrics
   - Give actionable next steps

### Example Coverage Report

**Basic Report** (`/catalog-coverage`)

```
User: /catalog-coverage

Agent: Analyzing catalog coverage...

[Scans components and stories]

📊 Catalog Coverage Report
==========================

Status: 89% Complete (48/54 components have stories)

Coverage Breakdown:
  Tier 1 (Stateless):        5/5   ✓ 100%
  Tier 2 (Interactive):       6/7   ⚠️  86% (1 missing)
  Tier 3 (Store):            15/17  ⚠️  88% (2 missing)
  Tier 4 (React Flow):       18/18  ✓ 100%
  Tier 5 (Composite):         4/7   ⚠️  57% (3 missing)

Trend: ↑ +2 stories this sprint (was 86%)

📋 Missing Stories by Priority

Quick Wins (Tier 1-2, <15 min each):
  [ ] MetadataGrid (Tier 2, interactive table)
  Difficulty: Low | Time: 10 min | Dependencies: None

  Status: RECOMMENDED FIRST

Medium Priority (Tier 3, 30-45 min each):
  [ ] ModelJSONViewer (Tier 3, store-connected)
  Difficulty: Medium | Time: 30 min | Dependencies: modelStore fixture

  [ ] SpecViewer (Tier 3, store-connected)
  Difficulty: Medium | Time: 40 min | Dependencies: specStore fixture

Complex (Tier 4-5, 30-60 min each):
  [ ] LayerContainerNode (Tier 4, React Flow)
  Difficulty: Medium | Time: 20 min | Dependencies: ReactFlowDecorator, dimension constants

  [ ] SpecGraphView (Tier 5, composite)
  Difficulty: High | Time: 60 min | Dependencies: Full model fixture

  [ ] MiniMap (Tier 5, composite)
  Difficulty: High | Time: 45 min | Dependencies: React Flow components

📈 Roadmap to 100%

Phase 1: Quick Wins (15 minutes)
  Goal: Reach 90% coverage
  Tasks:
  - [ ] MetadataGrid story
  Action: /catalog-add src/apps/embedded/components/common/MetadataGrid.tsx

Phase 2: Medium Complexity (90+ minutes)
  Goal: Reach 97% coverage
  Tasks:
  - [ ] ModelJSONViewer story (30 min)
  - [ ] SpecViewer story (40 min)
  - [ ] LayerContainerNode story (20 min)
  Action: /catalog-add -bulk src/...

Phase 3: Complex Components (120+ minutes)
  Goal: Reach 100% coverage
  Tasks:
  - [ ] SpecGraphView (60 min)
  - [ ] MiniMap (45 min)
  - [ ] Integration testing (15 min)

Total time estimate: ~3.5 hours for full coverage

🎯 Recommended Next Action

Start with Phase 1 (Quick Wins):
  /catalog-add src/apps/embedded/components/common/MetadataGrid.tsx

This will get you to 90% quickly, then you can tackle medium priority items.

Would you like me to:
1. Create the MetadataGrid story now?
2. Show detailed component analysis (--detailed)?
3. Generate stories for all missing components in batch?
```

### Detailed Report (`/catalog-coverage --detailed`)

Shows component analysis:

```
User: /catalog-coverage --detailed

📊 Coverage Report (Detailed Analysis)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MISSING COMPONENTS (6)

1. MetadataGrid
   Status: ✗ No story
   File: src/apps/embedded/components/common/MetadataGrid.tsx

   Analysis:
   - Component Type: Tier 2 (Interactive presentational)
   - Props: { data: Record<string, any>; onCellChange?: fn; editable?: boolean }
   - Dependencies: Flowbite Table, React hooks
   - No external stores or context requirements

   Story Complexity: LOW
   Estimated Time: 10 minutes

   Suggested Variants:
   - Default (basic data grid)
   - Editable (with cell change handler)
   - Large dataset (performance test)

   Blocking: None (can story independently)

2. ModelJSONViewer
   Status: ✗ No story
   File: src/apps/embedded/components/ModelJSONViewer.tsx

   Analysis:
   - Component Type: Tier 3 (Store-connected)
   - Props: { modelId?: string; expanded?: boolean }
   - Dependencies: modelStore (Zustand), syntax highlighter
   - Requires: Mock model store with sample data

   Story Complexity: MEDIUM
   Estimated Time: 30 minutes

   Suggested Variants:
   - Empty state (no model loaded)
   - Collapsed (initial state)
   - Expanded with large model
   - With syntax errors

   Blocking: None (modelStore fixture exists)
   Prerequisite: MetadataGrid (not really, but recommended to do first)

... [more details for each missing component]
```

### By-Tier Report (`/catalog-coverage --by-tier`)

Organizes by complexity:

```
User: /catalog-coverage --by-tier

📊 Coverage by Complexity Tier

TIER 1 (Stateless) - 100% COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Count: 5/5 components
Coverage: 100%

All stateless components have stories:
✓ LoadingState
✓ ErrorState
✓ EmptyState
✓ OperationLegend
✓ BreadcrumbNav

Status: Ready for production ✓

TIER 2 (Interactive) - 86% COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Count: 6/7 components
Coverage: 86%

Storyed: ✓ 6
  ✓ FilterPanel
  ✓ SubTabNavigation
  ✓ ExpandableSection
  ... [more]

Missing: ✗ 1
  [ ] MetadataGrid (EASY - 10 min)

Next step: Story MetadataGrid for 100%

TIER 3 (Store-Connected) - 88% COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Count: 15/17 components
Coverage: 88%

Storyed: ✓ 15
  ✓ AnnotationPanel
  ✓ NodeDetailsPanel
  ✓ SchemaInfoPanel
  ... [more]

Missing: ✗ 2
  [ ] ModelJSONViewer (MEDIUM - 30 min)
  [ ] SpecViewer (MEDIUM - 40 min)

Dependencies: modelStore, specStore (fixtures exist)
Next step: Story these 2 for 100%

TIER 4 (React Flow) - 100% COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Count: 18/18 components
Coverage: 100%

All React Flow nodes and edges have stories:
✓ All 10 motivation nodes
✓ All 3 business nodes
✓ All 3 C4 nodes
✓ All 7 edges

Status: Production ready ✓

TIER 5 (Composite) - 57% COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Count: 4/7 components
Coverage: 57%

Storyed: ✓ 4
  ✓ MotivationGraphView
  ✓ C4GraphView
  ✓ ChangesetGraphView
  ✓ GraphViewer

Missing: ✗ 3
  [ ] SpecGraphView (COMPLEX - 60 min)
  [ ] MiniMap (COMPLEX - 45 min)
  [ ] LayerContainerNode (MEDIUM - 20 min)

Dependencies: Full ReactFlow setup, model fixtures
Priority: Lower (these are less commonly demoed)

═══════════════════════════════════════════════════

OVERALL: 48/54 (89%)

Tier 1: ✓ Done (focus on Tier 2-3)
Tier 2: ⚠️  1 quick win left
Tier 3: ⚠️  2 medium items
Tier 4: ✓ Complete
Tier 5: ⚠️  3 complex items

Recommended action: Story Tier 2-3 items for 97% coverage before tackling Tier 5.
```

### Error Reporting

**Orphaned Stories** (stories without components):

```
⚠️  Orphaned Stories Found (2)

These story files exist but their components are missing or renamed:

1. src/core/nodes/old/DeletedNode.stories.tsx
   No matching component found

   Action: Remove orphaned story
   Command: rm src/core/nodes/old/DeletedNode.stories.tsx

2. src/apps/embedded/components/OldLayout.stories.tsx
   No matching component found

   Action: Remove orphaned story or verify component location

Would you like me to clean these up?
```

### Progress Tracking

Reports coverage trends:

```
📈 Coverage Progress

Current:  48/54 (89%)
Previous: 47/53 (89%)
Trend:    ↑ +1 story

Sprint 1: 42/50 (84%)
Sprint 2: 45/52 (87%)
Sprint 3: 47/53 (89%)
Sprint 4: 48/54 (89%) ← Current

Rate: +2 stories/sprint average
At this rate: Full coverage in ~3 sprints

Acceleration needed: Focus on Tier 2-3 quick wins
to reach 100% faster.
```

## Best Practices

1. **Regular reporting** - Run coverage report weekly
2. **Prioritize by tier** - Do quick wins first
3. **Track trends** - Monitor improvement over time
4. **Fix blockers** - Address dependencies before complex items
5. **Celebrate progress** - Acknowledge coverage improvements

## Related Commands

- `/catalog-add` - Create stories for identified missing components
- `/catalog-validate` - Check if existing stories build correctly
- `npm run catalog:dev` - Preview catalog in browser
