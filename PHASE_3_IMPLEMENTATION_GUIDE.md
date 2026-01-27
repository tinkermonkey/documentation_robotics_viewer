# Phase 3: Implementation Guide - Ladle Story Ordering

## Overview

This guide provides step-by-step instructions for implementing story ordering in Ladle configuration.

**Issue**: Issue #173 - Phase 3: Implement Ladle configuration for story ordering

**Target File**: `/workspace/.ladle/config.mjs`

**Current Version**: 9 lines (basic configuration)

**Final Version**: ~45 lines (with story ordering)

---

## Current Configuration

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

---

## Implementation Approach

### Choice: Function-based Sorting

We'll implement `storyOrder` as a **function** because:

1. **Flexibility**: Can match partial story titles and handle future additions
2. **Readability**: Clear category order in a simple array
3. **Maintainability**: Easy to adjust category order without touching story files
4. **Fallback Logic**: Unlisted stories sort alphabetically at the end

### Strategy: Category-First Sorting

The function will:
1. Define semantic category order (8 main categories)
2. For each story ID, find which category it belongs to
3. Sort by category order first, then alphabetically within category
4. Ensure all 83 stories remain visible

---

## Implementation Code

### Option 1: Simple Category Array (Recommended)

```javascript
/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: [
    "src/**/*.stories.tsx",
    "src/**/*.stories.mdx"
  ],
  viteConfig: "./vite.config.catalog.ts",
  outDir: "dist/catalog",

  /**
   * Story ordering configuration for organized navigation sidebar.
   *
   * Instead of default alphabetical sorting, this function organizes
   * stories into semantic categories reflecting the component system's
   * logical hierarchy:
   *
   * 1. Views & Layouts - Main visualization and layout containers
   * 2. Architecture Nodes - React Flow node components for graph visualization
   * 3. Architecture Edges - React Flow edge components for relationships
   * 4. Panels & Inspectors - Context-aware panels for element inspection
   * 5. Panels & Controls - Layout control components and sidebars
   * 6. Building Blocks - Reusable intermediate components
   * 7. Primitives - Low-level UI elements and state displays
   * 8. Utilities - Miscellaneous utility components
   *
   * Within each category, stories are sorted alphabetically.
   */
  storyOrder: (storyIds) => {
    // Define the semantic order of story categories
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
      // Find which category this story belongs to
      // by checking if the story ID includes the category name
      const categoryA = categoryOrder.find(cat => a.includes(cat)) || '';
      const categoryB = categoryOrder.find(cat => b.includes(cat)) || '';

      // Get the index of each category in our preferred order
      const categoryIndexA = categoryOrder.indexOf(categoryA);
      const categoryIndexB = categoryOrder.indexOf(categoryB);

      // Primary sort: by category order
      // (Returns -1, 0, or 1 depending on category position)
      if (categoryIndexA !== categoryIndexB) {
        return categoryIndexA - categoryIndexB;
      }

      // Secondary sort: alphabetically within same category
      // (Uses standard string comparison)
      return a.localeCompare(b);
    });
  }
};
```

---

## Step-by-Step Implementation

### Step 1: Open Configuration File

```bash
# Open the Ladle configuration file
code /workspace/.ladle/config.mjs
```

### Step 2: Add storyOrder Function

After the `outDir` line, add the `storyOrder` function as shown above in "Option 1".

### Step 3: Verify Syntax

The file should have proper JavaScript syntax:
- ✓ Valid export statement
- ✓ Function parameter `storyIds`
- ✓ Array comparison logic
- ✓ String comparison using `localeCompare()`

### Step 4: Test Configuration

```bash
# Start Ladle server to test configuration
npm run catalog:dev
```

Then:
1. Open browser to http://localhost:8765
2. Check browser console for any warnings
3. Verify sidebar shows stories in the expected order:
   - Views & Layouts first (GraphViewer, BusinessLayerView, etc.)
   - Then Architecture Nodes (all node types grouped)
   - Then Architecture Edges
   - Then Panels & Inspectors
   - etc.

### Step 5: Verify All Stories Are Visible

Count stories in each category in the sidebar. Expected counts:

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

If all 83 stories appear, implementation is successful!

### Step 6: Run Tests

```bash
# Verify stories load without errors
npm run test:stories

# Should see output like:
# ✓ all-stories (481+ story variations)
# ✓ No console errors
# ✓ All components render successfully
```

### Step 7: Browser Testing

Manually verify in the catalog:
1. Click each category to expand/collapse
2. Click several stories to ensure they render
3. Check browser console (F12) for warnings or errors
4. Test on mobile viewport (sidebar should remain usable)

---

## Testing Checklist

- [ ] Config file syntax is valid (no TypeScript errors)
- [ ] Ladle starts without crashing (`npm run catalog:dev`)
- [ ] All 83 stories appear in sidebar
- [ ] Stories grouped into correct categories
- [ ] Within categories, stories sorted alphabetically
- [ ] No duplicate stories showing
- [ ] No console warnings about missing story IDs
- [ ] Clicking stories loads them correctly
- [ ] `npm run test:stories` passes
- [ ] Mobile viewport renders correctly

---

## Troubleshooting

### Problem: "Some stories not appearing"

**Solution**: Verify the category names in `categoryOrder` array exactly match the beginning of story titles.

Check story titles:
```bash
find /workspace/src -name "*.stories.tsx" -exec grep -h "title:" {} \; | sort -u | head -20
```

Ensure your `categoryOrder` categories match the first part of titles.

### Problem: "Stories appearing in wrong order"

**Solution**: Check the `categoryOrder` array order. The first item appears first in sidebar.

Correct order (recommended):
```javascript
const categoryOrder = [
  'Views & Layouts',           // First (appears at top)
  'Architecture Nodes',        // Second
  'Architecture Edges',        // Third
  // ... rest of categories
  'Utilities'                  // Last (appears at bottom)
];
```

### Problem: "Ladle won't start after config change"

**Solution**: Check JavaScript syntax:
- [ ] Opening and closing braces matched
- [ ] String quotes consistent (all `'` or all `"`)
- [ ] Function definition correct: `storyOrder: (storyIds) => { ... }`
- [ ] All statements end with semicolon

Validate with:
```bash
node -c /workspace/.ladle/config.mjs  # Check syntax
```

### Problem: "Console warning about Ladle config"

**Solution**: Common warning formats:

1. **"Story not found: ..."**
   - A story ID in `storyOrder` doesn't exist
   - Remove non-existent IDs from config

2. **"Duplicate entry: ..."**
   - A story appears twice in `storyOrder`
   - Remove duplicates (Ladle auto-removes them anyway)

3. **"No storyOrder match: ..."**
   - A story doesn't match any category in `categoryOrder`
   - Add the missing category to `categoryOrder`

---

## Configuration Variations

### Alternative 1: Wildcard Patterns (Simpler)

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

**Pros**: Less code, no function logic
**Cons**: Less flexibility, harder to customize sub-category order

### Alternative 2: Strict Array (More Control)

```javascript
storyOrder: [
  // Views & Layouts section
  "Views & Layouts / Graph Views / GraphViewer",
  "Views & Layouts / Graph Views / BusinessLayerView",
  // ... all 83 stories listed explicitly
]
```

**Pros**: Maximum control
**Cons**: Tedious to maintain, must update every time a story is added

### Alternative 3: Multi-level Hierarchy (Complex)

```javascript
storyOrder: (storyIds) => {
  const priority = {
    'Views & Layouts / Graph Views': 1,
    'Views & Layouts / Layout': 2,
    'Views & Layouts / Other Views': 3,
    'Architecture Nodes / Business': 10,
    // ... more granular ordering
  };

  return storyIds.sort((a, b) => {
    const priorityA = Object.entries(priority).find(([key]) => a.includes(key))?.[1] ?? 999;
    const priorityB = Object.entries(priority).find(([key]) => b.includes(key))?.[1] ?? 999;
    return priorityA - priorityB || a.localeCompare(b);
  });
}
```

**Pros**: Fine-grained control per subcategory
**Cons**: More complex, harder to maintain

---

## After Implementation

### Documentation Updates

1. **Update CLAUDE.md** (if needed):
   - Add section about story organization
   - Include category descriptions
   - Link to organization reference

2. **Create guide for new contributors**:
   - How to name story titles
   - Which category to choose
   - Examples of good story titles

3. **Maintain story inventory**:
   - Keep `/workspace/STORY_CATALOG_ORGANIZATION.md` up-to-date
   - Update counts when new stories added

### Future Enhancements

After Phase 3 is complete, consider:

1. **Phase 4**: Add story search/filter UI to catalog
2. **Phase 5**: Add story metadata (tags, descriptions)
3. **Phase 6**: Auto-generate documentation from stories
4. **Phase 7**: Create story templates for consistency

---

## Code Review Checklist

When reviewing the PR for Phase 3:

- [ ] Configuration file syntax is valid
- [ ] `storyOrder` function exists with correct signature
- [ ] Category order makes semantic sense
- [ ] Comments explain the ordering rationale
- [ ] All 83 stories tested and visible
- [ ] No console errors or warnings in Ladle
- [ ] Tests pass (`npm run test:stories`)
- [ ] No regression in other functionality

---

## Related Files and Commands

### Key Files
- `/workspace/.ladle/config.mjs` - Configuration (to be modified)
- `/workspace/vite.config.catalog.ts` - Vite config for Ladle
- `/workspace/.ladle/components.tsx` - Ladle provider setup

### Related Commands
```bash
npm run catalog:dev       # Start Ladle server
npm run test:stories      # Test all story variations
npm test                  # Run all tests
npm run test:stories:generate  # Auto-generate story tests
```

### Story Locations
```bash
find /workspace/src -name "*.stories.tsx" | wc -l
# Output: 83 files
```

---

## Success Metrics

✅ **Phase 3 Complete When**:
1. Configuration file updated with `storyOrder` function
2. All 83 stories display in organized categories
3. Stories within categories sorted alphabetically
4. No Ladle configuration warnings
5. `npm run catalog:dev` starts successfully
6. `npm run test:stories` passes
7. Manual testing confirms correct ordering
8. Documentation updated

---

## Example Expected Navigation Structure

After implementation, sidebar should show:

```
Ladle Catalog
├─ Views & Layouts
│  ├─ Graph Views
│  │  ├─ BusinessLayerView
│  │  ├─ C4GraphView
│  │  ├─ ChangesetGraphView
│  │  ├─ GraphViewer
│  │  └─ MotivationGraphView
│  ├─ Layout
│  │  └─ SharedLayout
│  └─ Other Views
│     ├─ ModelJSONViewer
│     ├─ SpecGraphView
│     └─ SpecViewer
├─ Architecture Nodes
│  ├─ Business
│  │  ├─ BusinessCapabilityNode
│  │  ├─ BusinessFunctionNode
│  │  ├─ BusinessProcessNode
│  │  └─ BusinessServiceNode
│  ├─ C4
│  │  ├─ ComponentNode
│  │  ├─ ContainerNode
│  │  └─ ExternalActorNode
│  ├─ Containers
│  │  └─ LayerContainerNode
│  ├─ Generic
│  │  ├─ BaseFieldListNode
│  │  └─ JSONSchemaNode
│  └─ Motivation
│     ├─ AssessmentNode
│     ├─ AssumptionNode
│     ├─ ConstraintNode
│     ├─ DriverNode
│     ├─ GoalNode
│     ├─ OutcomeNode
│     ├─ PrincipleNode
│     ├─ RequirementNode
│     ├─ StakeholderNode
│     └─ ValueStreamNode
├─ Architecture Edges
├─ Panels & Inspectors
├─ Panels & Controls
├─ Building Blocks
├─ Primitives
└─ Utilities
```

---

## Questions & Support

**Q: Will this change how stories are stored?**
A: No, the `.stories.tsx` files remain unchanged. Only the navigation order changes.

**Q: Do I need to rename existing stories?**
A: No, existing `title` fields should already follow the category pattern.

**Q: What happens to stories that don't match a category?**
A: They'll appear at the bottom in alphabetical order (fallback).

**Q: Can I add more categories later?**
A: Yes, just add to the `categoryOrder` array. Existing stories will auto-organize.

**Q: Does this affect story content or tests?**
A: No, only the UI navigation order changes.

---

## Summary

Phase 3 implementation adds organized story navigation to the Ladle catalog by:

1. Adding `storyOrder` function to `/workspace/.ladle/config.mjs`
2. Defining semantic category hierarchy
3. Sorting stories by category, then alphabetically
4. Maintaining visibility of all 83 stories
5. Creating logical flow for users learning the component system

**Estimated time**: 30-45 minutes
**Files modified**: 1
**Lines added**: ~30-40
**Testing required**: Browser + CLI tests
**Risk level**: Low (configuration only, no code changes)
