# Ladle Story Catalog Organization (83 Stories)

## Navigation Hierarchy Overview

```
Ladle Catalog (http://localhost:8765)
│
├── Views & Layouts / Graph Views (5 stories)
│   ├── BusinessLayerView
│   ├── C4GraphView
│   ├── ChangesetGraphView
│   ├── GraphViewer
│   └── MotivationGraphView
│
├── Views & Layouts / Layout (1 story)
│   └── SharedLayout
│
├── Views & Layouts / Other Views (3 stories)
│   ├── ModelJSONViewer
│   ├── SpecGraphView
│   └── SpecViewer
│
├── Architecture Nodes (12 subcategories)
│   ├── Business (4 stories)
│   │   ├── BusinessCapabilityNode
│   │   ├── BusinessFunctionNode
│   │   ├── BusinessProcessNode
│   │   └── BusinessServiceNode
│   ├── C4 (3 stories)
│   │   ├── ComponentNode
│   │   ├── ContainerNode
│   │   └── ExternalActorNode
│   ├── Containers (1 story)
│   │   └── LayerContainerNode
│   ├── Generic (2 stories)
│   │   ├── BaseFieldListNode
│   │   └── JSONSchemaNode
│   └── Motivation (11 stories)
│       ├── AssessmentNode
│       ├── AssumptionNode
│       ├── ConstraintNode
│       ├── DriverNode
│       ├── GoalNode
│       ├── OutcomeNode
│       ├── PrincipleNode
│       ├── RequirementNode
│       ├── StakeholderNode
│       └── ValueStreamNode
│
├── Architecture Edges (7 stories)
│   ├── General (2 stories)
│   │   ├── CrossLayerEdge
│   │   └── ElbowEdge
│   └── Motivation (5 stories)
│       ├── ConflictsEdge
│       ├── ConstrainsEdge
│       ├── InfluenceEdge
│       ├── RealizesEdge
│       └── RefinesEdge
│
├── Panels & Inspectors / Business (2 stories)
│   ├── BusinessLayerControls
│   └── ProcessInspectorPanel
│
├── Panels & Inspectors / C4 (5 stories)
│   ├── C4BreadcrumbNav
│   ├── C4ControlPanel
│   ├── C4FilterPanel
│   ├── C4InspectorPanel
│   └── C4RightSidebar
│
├── Panels & Inspectors / Common (6 stories)
│   ├── AnnotationPanel
│   ├── BaseInspectorPanel
│   ├── HighlightedPathPanel
│   ├── LayoutPreferencesPanel
│   ├── NodeDetailsPanel
│   └── SchemaInfoPanel
│
├── Panels & Inspectors / Motivation (6 stories)
│   ├── MotivationBreadcrumb
│   ├── MotivationContextMenu
│   ├── MotivationControlPanel
│   ├── MotivationFilterPanel
│   ├── MotivationInspectorPanel
│   └── MotivationRightSidebar
│
├── Panels & Inspectors / Statistics (2 stories)
│   ├── CoverageSummaryPanel
│   └── GraphStatisticsPanel
│
├── Panels & Controls / Common (2 stories)
│   ├── BaseControlPanel
│   └── GraphViewSidebar
│
├── Building Blocks / Actions (2 stories)
│   ├── ExportButtonGroup
│   └── GraphToolbar
│
├── Building Blocks / Data Display (6 stories)
│   ├── AttributesTable
│   ├── ChangesetList
│   ├── ChangesetViewer
│   ├── ExpandableSection
│   ├── FilterPanel
│   └── MetadataGrid
│
├── Building Blocks / Navigation (3 stories)
│   ├── BreadcrumbNav
│   ├── ModelLayersSidebar
│   └── SubTabNavigation
│
├── Building Blocks / Utilities (4 stories)
│   ├── ErrorBoundary
│   ├── MiniMap
│   ├── OverviewPanel
│   └── SpaceMouseHandler
│
├── Primitives / Controls (1 story)
│   └── ViewToggle
│
├── Primitives / Indicators (4 stories)
│   ├── ConnectionStatus
│   ├── LayerTypesLegend
│   ├── OperationLegend
│   └── RelationshipBadge
│
├── Primitives / States (3 stories)
│   ├── EmptyState
│   ├── ErrorState
│   └── LoadingState
│
└── Utilities (1 story)
    └── RenderPropErrorBoundary
```

---

## Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Views & Layouts / Graph Views** | 5 | Main visualization views |
| **Views & Layouts / Layout** | 1 | Container layouts |
| **Views & Layouts / Other Views** | 3 | Secondary views |
| **Architecture Nodes** | 21 | Component node types (12 subcategories) |
| **Architecture Edges** | 7 | Relationship edge types |
| **Panels & Inspectors / Business** | 2 | Business layer panels |
| **Panels & Inspectors / C4** | 5 | C4 model panels |
| **Panels & Inspectors / Common** | 6 | Shared inspector panels |
| **Panels & Inspectors / Motivation** | 6 | Motivation layer panels |
| **Panels & Inspectors / Statistics** | 2 | Analysis & stats panels |
| **Panels & Controls / Common** | 2 | Base control components |
| **Building Blocks / Actions** | 2 | Action buttons & toolbars |
| **Building Blocks / Data Display** | 6 | Tables, lists, filters |
| **Building Blocks / Navigation** | 3 | Navigation components |
| **Building Blocks / Utilities** | 4 | Utility components |
| **Primitives / Controls** | 1 | Control primitives |
| **Primitives / Indicators** | 4 | Status/legend indicators |
| **Primitives / States** | 3 | State displays (empty, error, loading) |
| **Utilities** | 1 | Miscellaneous utilities |
| **TOTAL** | **83** | All stories |

---

## File Locations by Category

### Views & Layouts (9 stories)
```
src/core/components/
├── GraphViewer.stories.tsx

src/apps/embedded/components/
├── BusinessLayerView.stories.tsx
├── C4GraphView.stories.tsx
├── ChangesetGraphView.stories.tsx
├── ModelJSONViewer.stories.tsx
├── MotivationGraphView.stories.tsx
├── SharedLayout.stories.tsx
├── SpecGraphView.stories.tsx
└── SpecViewer.stories.tsx
```

### Architecture Nodes (21 stories)
```
src/core/nodes/
├── business/
│   └── BusinessCapabilityNode.stories.tsx
│       BusinessFunctionNode.stories.tsx
│       BusinessProcessNode.stories.tsx
│       BusinessServiceNode.stories.tsx
├── c4/
│   └── ComponentNode.stories.tsx
│       ContainerNode.stories.tsx
│       ExternalActorNode.stories.tsx
├── containers/
│   └── LayerContainerNode.stories.tsx
├── generic/
│   └── BaseFieldListNode.stories.tsx
│       JSONSchemaNode.stories.tsx
└── motivation/
    └── AssessmentNode.stories.tsx
        AssumptionNode.stories.tsx
        ConstraintNode.stories.tsx
        DriverNode.stories.tsx
        GoalNode.stories.tsx
        OutcomeNode.stories.tsx
        PrincipleNode.stories.tsx
        RequirementNode.stories.tsx
        StakeholderNode.stories.tsx
        ValueStreamNode.stories.tsx
```

### Architecture Edges (7 stories)
```
src/core/edges/
├── general/
│   └── CrossLayerEdge.stories.tsx
│       ElbowEdge.stories.tsx
└── motivation/
    └── ConflictsEdge.stories.tsx
        ConstrainsEdge.stories.tsx
        InfluenceEdge.stories.tsx
        RealizesEdge.stories.tsx
        RefinesEdge.stories.tsx
```

### Panels & Inspectors (21 stories)
```
src/apps/embedded/components/
├── AnnotationPanel.stories.tsx
├── BusinessLayerView.stories.tsx
├── C4BreadcrumbNav.stories.tsx
├── C4ControlPanel.stories.tsx
├── C4FilterPanel.stories.tsx
├── C4InspectorPanel.stories.tsx
├── C4RightSidebar.stories.tsx
├── ChangesetList.stories.tsx
├── CoverageSummaryPanel.stories.tsx
├── GraphStatisticsPanel.stories.tsx
├── HighlightedPathPanel.stories.tsx
├── LayoutPreferencesPanel.stories.tsx
├── MotivationBreadcrumb.stories.tsx
├── MotivationContextMenu.stories.tsx
├── MotivationControlPanel.stories.tsx
├── MotivationFilterPanel.stories.tsx
├── MotivationInspectorPanel.stories.tsx
├── MotivationRightSidebar.stories.tsx
├── NodeDetailsPanel.stories.tsx
├── SchemaInfoPanel.stories.tsx
└── businessLayer/
    ├── BusinessLayerControls.stories.tsx
    └── ProcessInspectorPanel.stories.tsx
```

### Panels & Controls (2 stories)
```
src/core/components/base/
├── BaseControlPanel.stories.tsx
└── GraphViewSidebar.stories.tsx
```

### Building Blocks (15 stories)
```
src/apps/embedded/components/
├── ExportButtonGroup.stories.tsx
├── FilterPanel.stories.tsx
├── GraphToolbar.stories.tsx
├── ModelLayersSidebar.stories.tsx
├── SubTabNavigation.stories.tsx
├── common/
│   ├── AttributesTable.stories.tsx
│   ├── ChangesetViewer.stories.tsx
│   ├── ExpandableSection.stories.tsx
│   └── MetadataGrid.stories.tsx
└── shared/
    ├── BreadcrumbNav.stories.tsx
    ├── EmptyState.stories.tsx
    ├── ErrorState.stories.tsx
    ├── LoadingState.stories.tsx
    └── ViewToggle.stories.tsx
```

### Building Blocks / Utilities (4 stories)
```
src/core/components/
├── OverviewPanel.stories.tsx
├── RenderPropErrorBoundary.stories.tsx
├── SpaceMouseHandler.stories.tsx
└── base/
    └── RenderPropErrorBoundary.stories.tsx
```

### Primitives (8 stories)
```
src/apps/embedded/components/
├── ConnectionStatus.stories.tsx
├── LayerTypesLegend.stories.tsx
├── OperationLegend.stories.tsx
└── shared/
    └── RelationshipBadge.stories.tsx (implied)
```

---

## Adding New Stories

### Step 1: Create Story File
Create `ComponentName.stories.tsx` alongside component:

```typescript
import type { StoryDefault, Story } from '@ladle/react';
import { MyComponent } from './MyComponent';

export default {
  title: 'Category / Subcategory / ComponentName',
} satisfies StoryDefault;

export const Default: Story = () => <MyComponent />;
export const Loading: Story = () => <MyComponent loading />;
export const Error: Story = () => <MyComponent error="Failed" />;
```

### Step 2: Choose Category
Select appropriate category from above:
- **Views & Layouts**: Full-page views and layouts
- **Architecture Nodes**: React Flow node components
- **Architecture Edges**: React Flow edge components
- **Panels & Inspectors**: Context-aware panels (use architecture layer if specific)
- **Panels & Controls**: Layout controls and sidebars
- **Building Blocks**: Reusable UI components
- **Primitives**: Basic UI elements
- **Utilities**: Miscellaneous components

### Step 3: Use Existing Category
Stories are automatically picked up by glob pattern `src/**/*.stories.tsx` and organized by their `title` field.

The `storyOrder` configuration in `.ladle/config.mjs` will place your story in the correct position automatically.

---

## Example Story Titles

### Good Examples
- `Architecture Nodes / Motivation / GoalNode` ✓
- `Panels & Inspectors / C4 / C4ControlPanel` ✓
- `Building Blocks / Data Display / ChangesetList` ✓
- `Primitives / States / LoadingState` ✓

### Anti-patterns (to avoid)
- `MyComponent` (no category) ✗
- `Core / GraphViewer` (vague category) ✗
- `All Components / Various / MyComp` (unclear hierarchy) ✗

---

## Testing Stories

```bash
# View stories in browser
npm run catalog:dev
# Open http://localhost:8765

# Run story validation tests
npm run test:stories

# Generate new story tests
npm run test:stories:generate
```

---

## Implementation Impact

When `.ladle/config.mjs` is updated with `storyOrder` configuration:

1. **Before**: Stories appear alphabetically
   - C4GraphView, C4FilterPanel, C4RightSidebar, ...
   - Alphabetical but semantically scattered

2. **After**: Stories grouped by category then alphabetically
   - Views & Layouts (GraphViewer, BusinessLayerView, ...)
   - Architecture Nodes (all node types)
   - Architecture Edges (all edge types)
   - Panels & Inspectors (context panels)
   - etc.

This creates a logical flow for users learning the component system.

---

## Quick Reference: Category Descriptions

| Category | Purpose | Examples |
|----------|---------|----------|
| **Views** | Full-page visualizations | GraphViewer, C4GraphView |
| **Nodes** | Graph component building blocks | GoalNode, BusinessServiceNode |
| **Edges** | Relationship connections | RefinesEdge, ConflictsEdge |
| **Panels** | Context-aware UI panels | C4ControlPanel, MotivationFilterPanel |
| **Controls** | Global layout controls | BaseControlPanel, GraphViewSidebar |
| **Building Blocks** | Reusable intermediate components | ChangesetList, BreadcrumbNav |
| **Primitives** | Low-level UI elements | ViewToggle, EmptyState |
| **Utilities** | Helper components | RenderPropErrorBoundary |
