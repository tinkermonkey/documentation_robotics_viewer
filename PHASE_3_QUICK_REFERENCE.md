# Phase 3: Quick Reference Card

## The Task
Add story ordering configuration to Ladle to organize 83 stories into semantic categories.

## The File
```
/workspace/.ladle/config.mjs
```

## The Change
Add `storyOrder` function after `outDir` line.

## The Code (Copy-Paste)

```javascript
  /**
   * Story ordering configuration for organized navigation sidebar.
   *
   * Organizes 83 stories into 8 semantic categories:
   * 1. Views & Layouts
   * 2. Architecture Nodes
   * 3. Architecture Edges
   * 4. Panels & Inspectors
   * 5. Panels & Controls
   * 6. Building Blocks
   * 7. Primitives
   * 8. Utilities
   *
   * Within each category, stories are sorted alphabetically.
   */
  storyOrder: (storyIds) => {
    const categoryOrder = [
      'Views & Layouts',           // Primary visualization views
      'Architecture Nodes',        // Graph node types
      'Architecture Edges',        // Graph edge/relationship types
      'Panels & Inspectors',       // Element inspection panels
      'Panels & Controls',         // Layout control components
      'Building Blocks',           // Reusable UI components
      'Primitives',                // Basic UI elements
      'Utilities'                  // Miscellaneous utilities
    ];

    return storyIds.sort((a, b) => {
      const categoryA = categoryOrder.find(cat => a.includes(cat)) || '';
      const categoryB = categoryOrder.find(cat => b.includes(cat)) || '';
      const indexA = categoryOrder.indexOf(categoryA);
      const indexB = categoryOrder.indexOf(categoryB);

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return a.localeCompare(b);
    });
  }
```

## Story Count by Category

| Category | Count |
|----------|-------|
| Views & Layouts | 9 |
| Architecture Nodes | 21 |
| Architecture Edges | 7 |
| Panels & Inspectors | 21 |
| Panels & Controls | 2 |
| Building Blocks | 15 |
| Primitives | 8 |
| Utilities | 1 |
| **TOTAL** | **83** |

## Test Commands

```bash
# Start Ladle server
npm run catalog:dev

# Run story tests (should pass)
npm run test:stories
```

## Expected Result
Stories in sidebar appear grouped by category, then alphabetically within category. All 83 stories visible.

## Before & After

### Before (Alphabetical)
```
C4BreadcrumbNav
C4ControlPanel
C4FilterPanel
C4GraphView
C4InspectorPanel
ChangesetGraphView
...
GraphViewer
ModelJSONViewer
```

### After (Organized)
```
Views & Layouts
├─ Graph Views
│  ├─ BusinessLayerView
│  ├─ C4GraphView
│  ├─ ChangesetGraphView
│  ├─ GraphViewer
│  └─ MotivationGraphView
├─ Layout
│  └─ SharedLayout
└─ Other Views
   ├─ ModelJSONViewer
   ├─ SpecGraphView
   └─ SpecViewer

Architecture Nodes
├─ Business (4)
├─ C4 (3)
├─ Containers (1)
├─ Generic (2)
└─ Motivation (11)

Architecture Edges
├─ General (2)
└─ Motivation (5)

Panels & Inspectors
├─ Business (2)
├─ C4 (5)
├─ Common (6)
├─ Motivation (6)
└─ Statistics (2)

Panels & Controls (2)
Building Blocks (15)
Primitives (8)
Utilities (1)
```

## Step-by-Step

1. Open `/workspace/.ladle/config.mjs`
2. After line 8 (`outDir: "dist/catalog"`), add a comma
3. Paste the `storyOrder` code above
4. Save file
5. Run `npm run catalog:dev`
6. Verify in browser at http://localhost:8765
7. Confirm all 83 stories visible
8. Run `npm run test:stories` (should pass)

## Verification Checklist

- [ ] File opens without errors
- [ ] Ladle starts (`npm run catalog:dev`)
- [ ] All 83 stories show in sidebar
- [ ] Stories grouped correctly
- [ ] Within groups, alphabetically sorted
- [ ] No console warnings
- [ ] `npm run test:stories` passes
- [ ] Manual clicking loads stories

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Stories not appearing | Check categoryOrder names match exactly |
| Wrong order | Verify categoryOrder sequence |
| Ladle won't start | Check JavaScript syntax (braces, quotes, semicolons) |
| Console warnings | Ensure all story prefixes in categoryOrder |

## Reference Documents

- **Deep Dive**: PHASE_3_LADLE_STORY_ORDERING_ANALYSIS.md
- **Visual Map**: STORY_CATALOG_ORGANIZATION.md
- **Step-by-Step**: PHASE_3_IMPLEMENTATION_GUIDE.md
- **Summary**: PHASE_3_ANALYSIS_SUMMARY.md

## Key Points

✅ **Simple**: One file, ~30 lines of code
✅ **Low Risk**: Configuration only, no code changes
✅ **Non-Breaking**: All 83 stories remain visible
✅ **Tested**: Automated story tests included
✅ **Maintainable**: Clear comments, simple logic

## Time Estimate

- Implementation: 5-10 minutes
- Testing: 10-15 minutes
- Documentation: 5-10 minutes
- **Total**: 30-45 minutes

## Issue Reference

**Issue #173**: Phase 3: Implement Ladle configuration for story ordering

---

**Status**: Ready to implement
**Files to modify**: 1
**Lines to add**: ~30-40
**Risk level**: Low
