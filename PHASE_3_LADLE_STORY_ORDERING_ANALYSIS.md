# Phase 3: Implement Ladle Configuration for Story Ordering - Analysis

## Executive Summary

**Issue**: Implement Ladle story ordering configuration to organize 83+ stories into a logical, user-friendly navigation hierarchy.

**Status**: Ready for implementation

**Scope**: Extend `.ladle/config.mjs` with `storyOrder` configuration to define semantic story grouping and alphabetical ordering within categories.

---

## Current State

### Existing Ladle Setup

**Location**: `/workspace/.ladle/config.mjs`

```javascript
/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: [
    "src/**/*.stories.tsx",
    "src/**/*.stories.mdx"
  ],
  viteConfig: "./vite.config.catalog.ts",
  outDir: "dist/catalog"
};
```

**Current Behavior**:
- Stories are discovered automatically via glob patterns
- Navigation is **alphabetically sorted** by default
- No explicit ordering or categorization control

### Story Inventory (83 stories)

**Location**: Distributed across project:
- `/workspace/src/apps/embedded/components/` - 48 stories
- `/workspace/src/core/components/` - 16 stories
- `/workspace/src/core/nodes/` - 12 stories
- `/workspace/src/core/edges/` - 5 stories
- `/workspace/src/catalog/` - 2 stories

**Story Naming Pattern**:
Stories use semantic hierarchical titles like:
- `Architecture Nodes / Business / BusinessCapabilityNode`
- `Panels & Inspectors / C4 / C4ControlPanel`
- `Views & Layouts / Graph Views / GraphViewer`
- `Building Blocks / Data Display / ChangesetList`

### Story Categories (Current Titles)

```
1. Architecture Edges / General
   - CrossLayerEdge
   - ElbowEdge

2. Architecture Edges / Motivation
   - ConflictsEdge, ConstrainsEdge, InfluenceEdge
   - RealizesEdge, RefinesEdge

3. Architecture Nodes / Business
   - BusinessCapabilityNode, BusinessFunctionNode
   - BusinessProcessNode, BusinessServiceNode

4. Architecture Nodes / C4
   - ComponentNode, ContainerNode, ExternalActorNode

5. Architecture Nodes / Containers
   - LayerContainerNode

6. Architecture Nodes / Generic
   - BaseFieldListNode, JSONSchemaNode

7. Architecture Nodes / Motivation
   - AssessmentNode, AssumptionNode, ConstraintNode
   - DriverNode, GoalNode, OutcomeNode
   - PrincipleNode, RequirementNode
   - StakeholderNode, ValueStreamNode

8. Building Blocks / Actions
   - ExportButtonGroup, GraphToolbar

9. Building Blocks / Data Display
   - AttributesTable, ChangesetList, ChangesetViewer
   - ExpandableSection, FilterPanel, MetadataGrid

10. Building Blocks / Navigation
    - BreadcrumbNav, ModelLayersSidebar, SubTabNavigation

11. Building Blocks / Utilities
    - ErrorBoundary, MiniMap, OverviewPanel, SpaceMouseHandler

12. Panels & Controls / Common
    - BaseControlPanel, GraphViewSidebar

13. Panels & Inspectors / Business
    - BusinessLayerControls, ProcessInspectorPanel

14. Panels & Inspectors / C4
    - C4BreadcrumbNav, C4ControlPanel, C4FilterPanel
    - C4InspectorPanel, C4RightSidebar

15. Panels & Inspectors / Common
    - AnnotationPanel, BaseInspectorPanel, HighlightedPathPanel
    - LayoutPreferencesPanel, NodeDetailsPanel, SchemaInfoPanel

16. Panels & Inspectors / Motivation
    - MotivationBreadcrumb, MotivationContextMenu
    - MotivationControlPanel, MotivationFilterPanel
    - MotivationInspectorPanel, MotivationRightSidebar

17. Panels & Inspectors / Statistics
    - CoverageSummaryPanel, GraphStatisticsPanel

18. Primitives / Controls
    - ViewToggle

19. Primitives / Indicators
    - ConnectionStatus, LayerTypesLegend, OperationLegend, RelationshipBadge

20. Primitives / States
    - EmptyState, ErrorState, LoadingState

21. Utilities
    - RenderPropErrorBoundary

22. Views & Layouts / Graph Views
    - BusinessLayerView, C4GraphView, ChangesetGraphView
    - GraphViewer, MotivationGraphView

23. Views & Layouts / Layout
    - SharedLayout

24. Views & Layouts / Other Views
    - ModelJSONViewer, SpecGraphView, SpecViewer
```

---

## Ladle Configuration Documentation

### `storyOrder` Feature (Ladle 5.x)

**What it does**: Customizes the order of stories in the navigation sidebar instead of default alphabetical sorting.

**Syntax Options**:

```javascript
// Option 1: Array of story IDs in preferred order
storyOrder: [
  "Architecture Nodes",
  "Architecture Edges",
  "Building Blocks",
  "Panels & Inspectors",
  // ... more categories
]

// Option 2: Function that returns ordered array
storyOrder: (storyIds) => {
  const categories = [
    "Architecture Nodes",
    "Architecture Edges",
    // ... define order
  ];

  // Sort storyIds according to categories
  return storyIds.sort((a, b) => {
    const indexA = categories.findIndex(cat => a.includes(cat));
    const indexB = categories.findIndex(cat => b.includes(cat));
    return indexA - indexB;
  });
}

// Option 3: Wildcard patterns with ordering
storyOrder: [
  "Architecture*",  // All architecture-related stories
  "Building Blocks*",
  "Panels*",
  "*"  // Catch-all for unlisted stories
]
```

**Constraints**:
- Omitted stories become invisible in navigation
- Non-existent story IDs trigger warnings
- Duplicate entries are auto-removed
- Must use exact story IDs or patterns

**Story IDs in Ladle**:
Story IDs are generated from the `title` field in story default export:
```typescript
export default {
  title: 'Architecture Nodes / Business / BusinessCapabilityNode'
} satisfies StoryDefault;
```

---

## Implementation Strategy

### Phase 3 Deliverable: Story Ordering Configuration

**Goal**: Create a logical navigation hierarchy that:
1. Groups related components semantically
2. Orders categories by importance and workflow
3. Uses consistent naming patterns
4. Maintains full visibility of all 83 stories

### Recommended Ordering Hierarchy

Based on component architecture and user workflows:

```
1. Getting Started           (Overview, usage guides)
2. Architecture Views         (GraphViewer, BusinessLayerView, C4GraphView)
3. Architecture Nodes         (12 story groups: Business, Motivation, C4, etc.)
4. Architecture Edges         (General, Motivation edges)
5. Panels & Inspectors        (Context-specific panels - Business, C4, Motivation, Common)
6. Panels & Controls          (Layout controls, sidebars)
7. Building Blocks            (Reusable utilities - Data Display, Navigation, Actions)
8. Primitives                 (Basic UI elements - Controls, Indicators, States)
9. Utilities                  (Miscellaneous utilities)
10. Views & Layouts           (Layout containers, complex views)
```

### Implementation File

**Location**: `/workspace/.ladle/config.mjs`

**Current Implementation** (82 lines):
```javascript
/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: [
    "src/**/*.stories.tsx",
    "src/**/*.stories.mdx"
  ],
  viteConfig: "./vite.config.catalog.ts",
  outDir: "dist/catalog",

  // NEW: Story ordering configuration
  storyOrder: (storyIds) => {
    // Define category order
    const categoryOrder = [
      'Views & Layouts / Graph Views',     // Main graph views first
      'Architecture Nodes',                 // Then node types
      'Architecture Edges',                 // Then edge types
      'Panels & Inspectors',                // Then UI panels
      'Panels & Controls',                  // Control panels
      'Building Blocks',                    // Reusable components
      'Primitives',                         // Basic primitives
      'Utilities'                           // Misc utilities
    ];

    // Sort by category order, then alphabetically within category
    return storyIds.sort((a, b) => {
      // Find category match for each story
      const categoryA = categoryOrder.find(cat => a.includes(cat)) || '';
      const categoryB = categoryOrder.find(cat => b.includes(cat)) || '';

      const categoryIndexA = categoryOrder.indexOf(categoryA);
      const categoryIndexB = categoryOrder.indexOf(categoryB);

      // Sort by category first
      if (categoryIndexA !== categoryIndexB) {
        return categoryIndexA - categoryIndexB;
      }

      // Within same category, sort alphabetically
      return a.localeCompare(b);
    });
  }
};
```

---

## Implementation Steps

### Step 1: Update Ladle Configuration
- [ ] Modify `/workspace/.ladle/config.mjs`
- [ ] Add `storyOrder` function with category hierarchy
- [ ] Test configuration against all 83 story IDs

### Step 2: Verify Story Navigation
- [ ] Run `npm run catalog:dev`
- [ ] Verify stories appear in correct order
- [ ] Check for any console warnings about missing IDs
- [ ] Test sidebar collapse/expand functionality

### Step 3: Documentation
- [ ] Document ordering rationale in inline comments
- [ ] Create guide for adding new stories in correct position
- [ ] Update CLAUDE.md with story organization guidance

### Step 4: Testing
- [ ] Run `npm run test:stories` to verify all stories load
- [ ] Run E2E tests to ensure no regressions
- [ ] Manually verify navigation on multiple screen sizes

---

## Story Organization Principles

### Rationale for Recommended Order

1. **Views & Layouts / Graph Views** (First - Primary Views)
   - These are the main entry points to the application
   - GraphViewer, BusinessLayerView, C4GraphView are core components
   - Users navigate TO these views first

2. **Architecture Nodes** (Second - Content Structure)
   - Building blocks of the graph visualization
   - 12 groups covering all layer types (Business, Motivation, C4, etc.)
   - Users need to understand what nodes look like

3. **Architecture Edges** (Third - Relationships)
   - Connect the nodes together
   - Show how entities relate to each other
   - Complement node types

4. **Panels & Inspectors** (Fourth - Interaction)
   - Context panels that appear when interacting with graph
   - Show element details, annotations, controls
   - Enable editing and analysis

5. **Panels & Controls** (Fifth - Navigation/Layout)
   - Layout controls, sidebars
   - Manage view state and preferences
   - Support navigation

6. **Building Blocks** (Sixth - Reusable Components)
   - Data display tables, lists, filters
   - Navigation breadcrumbs, sidebars
   - Export buttons, toolbars

7. **Primitives** (Seventh - Basic Elements)
   - Low-level UI components
   - Status indicators, legends, badges
   - Form controls, state displays

8. **Utilities** (Last - Miscellaneous)
   - Error boundaries, special handlers
   - Helpers and utilities

### Sub-Category Alphabetical Ordering

Within each category, stories are ordered alphabetically:
- `Architecture Nodes / Business / BusinessCapabilityNode`
- `Architecture Nodes / Business / BusinessFunctionNode`
- `Architecture Nodes / Business / BusinessProcessNode`
- `Architecture Nodes / Business / BusinessServiceNode`
- `Architecture Nodes / C4 / ComponentNode`
- etc.

---

## Configuration Options for Future Enhancement

### Option 1: Wildcard Patterns (Simple)
```javascript
storyOrder: [
  "Views & Layouts*",
  "Architecture Nodes*",
  "Architecture Edges*",
  "Panels*",
  "Building Blocks*",
  "Primitives*",
  "Utilities*"
]
```

**Pros**: Simpler, less code
**Cons**: Less control, harder to customize sub-categories

### Option 2: Multi-level Hierarchy (Complex)
```javascript
storyOrder: (storyIds) => {
  const hierarchy = {
    'Views & Layouts': {
      'Graph Views': ['GraphViewer', 'BusinessLayerView', 'C4GraphView', 'MotivationGraphView'],
      'Layout': ['SharedLayout'],
      'Other Views': ['ModelJSONViewer', 'SpecGraphView', 'SpecViewer']
    },
    'Architecture Nodes': { /* ... */ },
    // ... more categories
  };

  return storyIds.sort((a, b) => {
    // Complex sorting logic based on hierarchy
  });
}
```

**Pros**: Fine-grained control
**Cons**: More complex, harder to maintain

### Option 3: External Configuration File (Scalable)
```javascript
// .ladle/config.mjs
import storyOrderConfig from './storyOrder.json';

export default {
  // ... other config
  storyOrder: storyOrderConfig
};
```

**Pros**: Easier to maintain, reuse elsewhere
**Cons**: Extra file to manage

---

## Success Criteria

- [ ] All 83 stories are visible in Ladle catalog navigation
- [ ] Stories are organized into logical groups
- [ ] Navigation order follows semantic hierarchy
- [ ] Within categories, stories are alphabetically sorted
- [ ] No console warnings about missing story IDs
- [ ] `npm run catalog:dev` loads without errors
- [ ] `npm run test:stories` passes (all story validation)
- [ ] Manual navigation verification completed

---

## Testing the Implementation

### Visual Test Procedure

```bash
# Terminal 1: Start Ladle server
npm run catalog:dev
# Open browser to http://localhost:8765

# Verify:
# 1. Sidebar shows stories in recommended order
# 2. All 83 stories are visible (count sections)
# 3. No console errors about missing IDs
# 4. Clicking stories loads them correctly
```

### Automated Test Procedure

```bash
# Terminal: Run story tests
npm run test:stories

# Should see:
# ✓ All 481+ story variations render
# ✓ No console errors during rendering
# ✓ Components load without exceptions
```

---

## Related Documentation

- **Ladle Config Docs**: https://ladle.dev/docs/config
- **Story Organization**: `.ladle/config.mjs`
- **Story Files**: `src/**/*.stories.tsx` (83 files)
- **Test Stories**: `npm run test:stories`
- **Test Configuration**: `scripts/generate-story-tests.cjs`

---

## Notes for Implementation

1. **Case Sensitivity**: Story IDs are case-sensitive - verify exact matches
2. **Partial Matching**: Use `includes()` to match partial story paths
3. **Fallback Stories**: Any unlisted stories won't appear - test thoroughly
4. **Performance**: Sorting function runs on each navigation - keep logic simple
5. **Comments**: Add detailed comments explaining ordering rationale

---

## Future Enhancements

After Phase 3 implementation:

1. **Phase 4**: Add search/filter functionality to story catalog
2. **Phase 5**: Implement story metadata (tags, descriptions, examples)
3. **Phase 6**: Create story templates for consistent new story structure
4. **Phase 7**: Auto-generate documentation from stories

---

## Conclusion

Phase 3 implementation adds `storyOrder` configuration to `.ladle/config.mjs` with a function that:
1. Defines semantic category order
2. Sorts stories within categories alphabetically
3. Maintains full visibility of all 83 stories
4. Creates logical navigation hierarchy for users

**Estimated Implementation Time**: 30-45 minutes
**File Changes**: 1 file (`.ladle/config.mjs`)
**Lines Added**: ~30-40 lines
**Testing Time**: 15-20 minutes
