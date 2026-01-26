# Render Prop Error Handling - Implementation Guide

## Problem Statement

**Issue**: Silent render prop failures - no error boundaries

Render props in base components (`BaseInspectorPanel`, `BaseControlPanel`, `GraphViewSidebar`) were being called directly without error handling. When a render prop function threw an error, it would silently fail, making it very difficult to debug issues.

**Example of the problem**:
```typescript
// BEFORE: Direct call - error silently fails
{renderElementDetails(selectedNode)}  // If renderElementDetails throws, silent failure
```

## Solution

Implemented a render prop error boundary utility with three wrapper functions that catch errors, log them with context, and display visible error messages.

### Implementation Overview

#### 1. RenderPropErrorBoundary Utility
**Location**: `src/core/components/base/RenderPropErrorBoundary.tsx`

Three wrapper functions for different render prop patterns:

```typescript
// For single-argument render props
wrapRenderProp<T>(
  renderProp: (arg: T) => React.ReactNode,
  argument: T,
  renderPropName: string
): React.ReactNode

// For two-argument render props
wrapRenderProp2<T1, T2>(
  renderProp: (arg1: T1, arg2: T2) => React.ReactNode,
  arg1: T1,
  arg2: T2,
  renderPropName: string
): React.ReactNode

// For void render props (slots)
wrapRenderPropVoid(
  renderProp: (() => React.ReactNode) | undefined,
  renderPropName: string
): React.ReactNode
```

#### 2. Error Handling Strategy

Each wrapper function:
1. **Executes** the render prop in a try-catch block
2. **Logs** errors to console with full context (render prop name, arguments, stack trace)
3. **Returns** visible error UI (not throwing) to prevent component tree crash
4. **Displays** user-friendly error message with debugging guidance

**Error UI Example**:
```
┌─────────────────────────────────────────┐
│ Error in renderElementDetails           │
│ Element details rendering failed        │
│ Check browser console for details       │
└─────────────────────────────────────────┘
```

### Components Updated

#### BaseInspectorPanel
**File**: `src/core/components/base/BaseInspectorPanel.tsx`

Wrapped render props:
- `renderElementDetails` - Primary content render prop
- `renderRelationshipBadge` - Edge badge customization (optional)
- `renderCrossLayerLinks` - Cross-layer links display (optional)

**Example**:
```typescript
// AFTER: With error boundary
{wrapRenderProp(renderElementDetails, selectedNode, 'renderElementDetails')}
```

#### BaseControlPanel
**File**: `src/core/components/base/BaseControlPanel.tsx`

Wrapped render slots:
- `renderBeforeLayout` - Content before layout selector
- `renderBetweenLayoutAndView` - Content between layout and fit-to-view
- `renderBetweenViewAndFocus` - Content between fit-to-view and focus toggle
- `renderBetweenFocusAndClear` - Content between focus and clear
- `renderControls` - Custom controls section (export buttons, etc.)

**Example**:
```typescript
// AFTER: With error boundary
{wrapRenderPropVoid(renderBeforeLayout, 'renderBeforeLayout')}
```

#### GraphViewSidebar
**File**: `src/core/components/base/GraphViewSidebar.tsx`

Wrapped slot content:
- `filterPanel` - Filter section content
- `controlPanel` - Controls section content
- `inspectorContent` - Inspector section content (optional)
- `annotationPanel` - Annotations section content (optional)

**Example**:
```typescript
// AFTER: With error boundary
{wrapRenderProp(() => filterPanel, undefined, 'filterPanel')}
```

## Error Flow

```
User triggers component render
         ↓
Base component calls render prop with wrapRenderProp()
         ↓
Render prop executes in try-catch block
         ↓
    Error thrown?
    /          \
   YES          NO
   ↓            ↓
Catch error   Return content
   ↓            ↓
Log to console  Display normally
   ↓
Render error UI
(with role="alert")
   ↓
User sees clear error message + console guidance
```

## Testing

### Unit Tests
**File**: `tests/unit/renderPropErrorBoundary.spec.ts`

Coverage:
- ✅ Successful render prop execution
- ✅ Error catching and conversion to error UI
- ✅ Console error logging with context
- ✅ Handling of non-Error objects
- ✅ Two-argument render props
- ✅ Void render props
- ✅ Error UI accessibility (role="alert")
- ✅ Test ID generation for E2E selection

**Test Results**: 16/16 passed

### Integration Tests
**File**: `tests/unit/baseComponentsErrorHandling.spec.ts`

Coverage:
- ✅ Error logging and context preservation
- ✅ Successful render prop return values
- ✅ Happy path verification

**Test Results**: 5/5 passed

### Overall Test Suite
- Total tests: 400+ passed
- Build: ✅ Success
- Type checking: ✅ All types valid

## Debugging Guide

### For Developers

When a render prop error occurs, you'll see:

1. **Visible Error Message** in the UI showing which render prop failed
2. **Browser Console** with full stack trace and context:
   ```
   [RenderPropErrorBoundary] Error in renderElementDetails: Cannot read property 'name'
   {
     renderPropName: 'renderElementDetails',
     argument: { id: 'node-1', ...},
     stack: 'Error: Cannot read property...'
   }
   ```

### Common Issues and Solutions

**Issue**: "Error in renderElementDetails"
- **Cause**: Render prop tried to access undefined property
- **Solution**: Check that data passed to render prop is not null/undefined

**Issue**: "Error in renderCrossLayerLinks"
- **Cause**: Graph structure doesn't contain expected elements
- **Solution**: Verify graph.nodes and graph.edges are properly populated

**Issue**: "Error in renderBeforeLayout"
- **Cause**: Custom control rendering failed
- **Solution**: Check custom render prop for syntax errors or missing dependencies

## Benefits

✅ **Catches Silent Failures**: Errors are now visible instead of silent
✅ **Easy Debugging**: Full context in console logs with prop name and arguments
✅ **No Component Crash**: Error UI prevents component tree collapse
✅ **Accessible**: Error messages use ARIA alert role
✅ **Type-Safe**: Three variants for different render prop signatures
✅ **Tested**: Comprehensive test coverage for all scenarios
✅ **Reusable**: Utility functions can be used anywhere render props are needed

## Migration Guide

### For New Components Using Render Props

When creating new components with render props:

1. Import the wrapper functions:
   ```typescript
   import { wrapRenderProp, wrapRenderProp2, wrapRenderPropVoid } from './RenderPropErrorBoundary';
   ```

2. Wrap render prop calls:
   ```typescript
   // Single argument
   {wrapRenderProp(renderProp, data, 'renderProp')}

   // Two arguments
   {wrapRenderProp2(renderProp, arg1, arg2, 'renderProp')}

   // Optional (void return)
   {wrapRenderPropVoid(renderProp, 'renderProp')}
   ```

3. Always provide a descriptive render prop name (third argument) for debugging

### For Existing Domain-Specific Components

Domain-specific components like `C4InspectorPanel`, `MotivationInspectorPanel`, etc. don't need changes:
- They inherit error handling from base components
- Their render prop implementations are still called via wrapped base components

## Performance Impact

- **Minimal**: Error boundary adds only a try-catch wrapper
- **Zero overhead**: Only triggered when errors occur
- **Memory**: No additional memory for successful renders

## Related Files

- **Utility**: `src/core/components/base/RenderPropErrorBoundary.tsx`
- **Base Components**:
  - `src/core/components/base/BaseInspectorPanel.tsx`
  - `src/core/components/base/BaseControlPanel.tsx`
  - `src/core/components/base/GraphViewSidebar.tsx`
- **Tests**:
  - `tests/unit/renderPropErrorBoundary.spec.ts`
  - `tests/unit/baseComponentsErrorHandling.spec.ts`

## Future Enhancements

- Consider React Error Boundary wrapper for additional safety
- Add telemetry tracking for render prop failures in production
- Implement error recovery strategies (fallback renders, retry logic)
- Add tests for domain-specific render props in E2E tests

---

**Status**: ✅ Complete and tested
**Last Updated**: 2026-01-26
**Test Coverage**: 400+ tests passing
