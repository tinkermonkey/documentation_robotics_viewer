# Cross-Layer Components Integration Guide

## Overview

This document describes how to integrate the new `CrossLayerFilterPanel` and `CrossLayerBreadcrumb` components into your application routes.

## Components Created

### 1. CrossLayerFilterPanel
**Location:** `src/apps/embedded/components/CrossLayerFilterPanel.tsx`

A filter panel that allows users to control which cross-layer links are visible.

**Features:**
- Master toggle for showing/hiding all cross-layer links
- Target layer filters (checkboxes for each layer)
- Relationship type filters (checkboxes for each reference type)
- Visual counts showing visible/total references
- Select All / Deselect All buttons per section
- Clear All Filters button

**Dependencies:**
- `useCrossLayerStore` - manages visibility and filter state
- `useModelStore` - accesses model references for count calculation

**Usage:**
```tsx
import { CrossLayerFilterPanel } from '@/apps/embedded/components/CrossLayerFilterPanel';

<CrossLayerFilterPanel />
```

### 2. CrossLayerBreadcrumb
**Location:** `src/apps/embedded/components/CrossLayerBreadcrumb.tsx`

A breadcrumb navigation component that displays the path when traversing cross-layer links.

**Features:**
- Shows navigation history (up to 5 steps)
- Displays layer and element information
- Clear navigation history button
- Auto-hides when no navigation history exists

**Dependencies:**
- `useCrossLayerStore` - accesses and manages navigation history
- `useModelStore` - resolves layer information

**Usage:**
```tsx
import { CrossLayerBreadcrumb } from '@/apps/embedded/components/CrossLayerBreadcrumb';

<CrossLayerBreadcrumb />
```

## Integration Points

### Option 1: Add to Existing Sidebars (Recommended)

Add the `CrossLayerFilterPanel` to your right sidebar components alongside other filters. For example, in `MotivationRightSidebar.tsx`:

```tsx
import { CrossLayerFilterPanel } from '@/apps/embedded/components/CrossLayerFilterPanel';

export const MotivationRightSidebar = memo<MotivationRightSidebarProps>(({...}) => {
  // ... existing code ...

  return (
    <GraphViewSidebar
      filterPanel={
        <div className="space-y-4">
          <MotivationFilterPanel {...filterProps} />
          <div className="border-t border-gray-200 dark:border-gray-700" />
          <CrossLayerFilterPanel />
        </div>
      }
      // ... rest of props ...
    />
  );
});
```

### Option 2: Add to Route Header

Add the `CrossLayerBreadcrumb` at the top of your route content:

```tsx
import { CrossLayerBreadcrumb } from '@/apps/embedded/components/CrossLayerBreadcrumb';

return (
  <div className="flex flex-col h-full">
    <CrossLayerBreadcrumb />
    <div className="flex-1 overflow-auto">
      {/* Graph content here */}
    </div>
  </div>
);
```

### Option 3: Standalone Usage

Use either component independently in custom layouts:

```tsx
import { CrossLayerFilterPanel } from '@/apps/embedded/components/CrossLayerFilterPanel';
import { CrossLayerBreadcrumb } from '@/apps/embedded/components/CrossLayerBreadcrumb';

export const CustomView = () => {
  return (
    <>
      <header>
        <CrossLayerBreadcrumb />
      </header>
      <aside>
        <CrossLayerFilterPanel />
      </aside>
    </>
  );
};
```

## State Management

Both components use the `useCrossLayerStore` Zustand store, which manages:

- **Visibility**: `visible` - whether cross-layer links should be shown
- **Target Layer Filters**: `targetLayerFilters` - Set of layers to show links pointing to
- **Relationship Type Filters**: `relationshipTypeFilters` - Set of reference types to show
- **Navigation History**: `navigationHistory` - breadcrumb trail (max 5 steps)

### Key Store Actions

```ts
// Visibility control
useCrossLayerStore.getState().toggleVisible();
useCrossLayerStore.getState().setVisible(true);

// Filter management
useCrossLayerStore.getState().addTargetLayerFilter(LayerType.Business);
useCrossLayerStore.getState().clearTargetLayerFilters();

useCrossLayerStore.getState().addRelationshipTypeFilter(ReferenceType.Goal);
useCrossLayerStore.getState().clearRelationshipTypeFilters();

// Navigation history
useCrossLayerStore.getState().pushNavigation(step);
useCrossLayerStore.getState().popNavigation();
useCrossLayerStore.getState().clearNavigationHistory();
```

## Data Flow

```
User interacts with CrossLayerFilterPanel
    ↓
Store state updates (useCrossLayerStore)
    ↓
useCrossLayerLinks hook re-evaluates
    ↓
Filtered edges passed to GraphViewer
    ↓
Cross-layer links rendered in graph
```

## Testing

### Unit Tests
Run tests with:
```bash
npm test -- tests/unit/crossLayerComponents.spec.ts
```

Tests verify:
- Store state mutations
- Filter behavior
- Navigation history management
- Component visibility conditions

### Integration Testing
E2E tests should verify:
- Toggle visibility of cross-layer links
- Filter by target layer
- Filter by relationship type
- Navigate through breadcrumb trail
- Verify edges render correctly

## Styling

Both components use:
- **Tailwind CSS** for all styling
- **Flowbite React** components (Button, Checkbox, Label, Badge, etc.)
- **Dark mode support** with `dark:` variants
- **Lucide React** icons

## Accessibility

Features include:
- Semantic HTML with ARIA labels
- Keyboard navigation support
- Clear visual feedback
- Proper color contrast
- Label associations for form elements

## Performance Considerations

### CrossLayerFilterPanel
- `useMemo` for filter count calculations
- Efficient Set operations for filter toggling
- Memoized component to prevent unnecessary re-renders

### CrossLayerBreadcrumb
- Auto-hides when empty (returns null)
- Lightweight rendering of navigation history
- Memoized component

## Browser Compatibility

Both components work with:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Android Chrome 90+)

## Migration Guide

If you're updating an existing route to use these components:

1. Import the components
2. Add CrossLayerFilterPanel to your right sidebar
3. Add CrossLayerBreadcrumb to your route header
4. Ensure model is loaded (components handle missing data gracefully)
5. Test filter interactions in your application

## Troubleshooting

### CrossLayerFilterPanel not showing
- Check if model has references: `model?.references?.length > 0`
- Component returns null if no references exist
- Verify `useCrossLayerStore` is initialized

### CrossLayerBreadcrumb not showing
- Component auto-hides when navigation history is empty
- Check `useCrossLayerStore` state: `navigationHistory.length > 0`

### Filters not working
- Verify `useCrossLayerLinks` hook is being used in your graph viewer
- Check store subscription: `useCrossLayerStore((state) => state.targetLayerFilters)`
- Ensure edge filtering is applied in graph builder

## Future Enhancements

Potential improvements:
- Drag-and-drop filter organization
- Filter presets (save/load filter configurations)
- Breadcrumb click navigation to specific elements
- Cross-layer link analytics and statistics
- Visual weight indication for frequently referenced elements
- Bidirectional reference tracking
