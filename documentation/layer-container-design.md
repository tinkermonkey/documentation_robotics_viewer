# Layer Container Design Specification

## Overview

Layer containers provide visual grouping and organization of architectural elements on the canvas. Each layer is represented as a swimlane-style container with a vertical title bar and bounding border, clearly delineating which elements belong to each architectural layer.

## Design Goals

1. **Visual Clarity**: Instantly identify which elements belong to which layer
2. **Professional Appearance**: Clean, modern design consistent with enterprise architecture tools
3. **Non-Intrusive**: Containers frame content without overwhelming the view
4. **Consistent Identity**: Each layer type has a distinctive, consistent color scheme
5. **Scalability**: Support layers with varying numbers and sizes of elements

## Visual Design

### Layout Structure

```
┌─┐────────────────────────────────────────────────┐
│B│  ┌──────────┐    ┌──────────┐                 │
│u│  │ Element  │───▶│ Element  │                 │
│s│  │    1     │    │    2     │                 │
│i│  └──────────┘    └──────────┘                 │
│n│                                                 │
│e│  ┌──────────┐                                  │
│s│  │ Element  │                                  │
│s│  │    3     │                                  │
│ │  └──────────┘                                  │
└─┘────────────────────────────────────────────────┘
```

### Component Anatomy

#### 1. Vertical Title Bar (Left Edge)
- **Width**: 40px fixed
- **Text**: Layer name, vertically oriented (rotated -90°)
- **Background**: Layer-specific color (darker shade)
- **Text Color**: White or high-contrast color
- **Font**: System font, bold, 14px
- **Alignment**: Centered vertically and horizontally within bar

#### 2. Content Area (Main Container)
- **Background**: Layer-specific color with transparency (5-10% opacity)
- **Padding**: 30px (top/bottom), 40px (left/right)
- **Min Height**: 150px
- **Min Width**: 400px
- **Expands**: To fit all contained elements with padding

#### 3. Border
- **Style**: Solid
- **Width**: 2px
- **Color**: Layer-specific color (same as title bar)
- **Corners**: Slightly rounded (border-radius: 4px on right side only)
- **Left Edge**: No border (merged with title bar)

#### 4. Shadow (Optional Enhancement)
- **Box Shadow**: `0 2px 8px rgba(0, 0, 0, 0.1)`
- **Purpose**: Adds depth, separates layers visually

## Layer Color Scheme

Each layer type has a consistent color used across all instances:

| Layer Type | Primary Color | RGB | Title Bar | Content Background |
|------------|---------------|-----|-----------|-------------------|
| **Motivation** | Dark Green | `#2e7d32` | `#2e7d32` | `rgba(46, 125, 50, 0.08)` |
| **Business** | Dark Orange | `#e65100` | `#e65100` | `rgba(230, 81, 0, 0.08)` |
| **Security** | Dark Pink | `#c2185b` | `#c2185b` | `rgba(194, 24, 91, 0.08)` |
| **Application** | Dark Blue | `#1565c0` | `#1565c0` | `rgba(21, 101, 192, 0.08)` |
| **Technology** | Purple | `#6a1b9a` | `#6a1b9a` | `rgba(106, 27, 154, 0.08)` |
| **API** | Teal | `#00695c` | `#00695c` | `rgba(0, 105, 92, 0.08)` |
| **DataModel** | Dark Gray | `#424242` | `#424242` | `rgba(66, 66, 66, 0.08)` |
| **Datastore** | Brown | `#5d4037` | `#5d4037` | `rgba(93, 64, 55, 0.08)` |
| **UX** | Indigo | `#283593` | `#283593` | `rgba(40, 53, 147, 0.08)` |
| **Navigation** | Amber | `#f57f17` | `#f57f17` | `rgba(245, 127, 23, 0.08)` |
| **APM Observability** | Dark Brown | `#4e342e` | `#4e342e` | `rgba(78, 52, 46, 0.08)` |
| **Federated Architecture** | Teal-Green | `#00897b` | `#00897b` | `rgba(0, 137, 123, 0.08)` |

**Color Usage Principles:**
- Title bar uses full opacity color for strong identity
- Content area uses 8% opacity for subtle background without overwhelming elements
- Border uses full opacity color matching title bar
- Colors are taken from Material Design palette for professional appearance

## Technical Architecture

### Component Structure

```typescript
/**
 * Props for Layer Container Shape
 */
export interface LayerContainerShapeProps extends MetaModelShapeProps {
  layerType: LayerType;           // Type of layer
  layerName: string;               // Display name
  layerColor: string;              // Primary color (hex)
  containedElements: string[];     // IDs of elements in this layer
  bounds: {                        // Calculated bounds
    width: number;
    height: number;
  };
}

/**
 * Layer Container Shape
 * Renders as a swimlane-style container with vertical title bar
 */
export interface LayerContainerShape
  extends TLBaseShape<'layer-container', LayerContainerShapeProps> {}
```

### Rendering Implementation

The LayerContainer will use HTMLContainer (following the established pattern) for rendering:

```typescript
override renderHTMLContent(shape: LayerContainerShape): JSX.Element {
  const { w, h, layerName, layerColor } = shape.props;
  const titleBarWidth = 40;
  const backgroundOpacity = 0.08;

  return (
    <HTMLContainer
      style={{
        width: w,
        height: h,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        pointerEvents: 'none', // Allow interaction with contained elements
        position: 'relative'
      }}
    >
      {/* Vertical Title Bar */}
      <div
        style={{
          width: titleBarWidth,
          height: h,
          backgroundColor: layerColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px 0 0 4px',
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            whiteSpace: 'nowrap',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}
        >
          {layerName}
        </div>
      </div>

      {/* Content Area with Border */}
      <div
        style={{
          flex: 1,
          height: h,
          backgroundColor: `${layerColor}${Math.round(backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
          border: `2px solid ${layerColor}`,
          borderLeft: 'none',
          borderRadius: '0 4px 4px 0',
          padding: '30px 40px',
          position: 'relative'
        }}
      >
        {/* Content elements are rendered separately by tldraw */}
      </div>
    </HTMLContainer>
  );
}
```

### Z-Index Layering

To ensure proper visual hierarchy:

1. **Layer Containers**: `z-index: -1` (background layer)
2. **Element Shapes**: `z-index: 0` (default, on top of containers)
3. **Arrows/Relationships**: `z-index: 1` (on top of elements)

## Layout Calculation

### Bounds Calculation Algorithm

```typescript
/**
 * Calculate bounds for a layer container based on contained elements
 */
function calculateLayerBounds(
  elements: ModelElement[],
  padding: { top: number; right: number; bottom: number; left: number }
): { x: number; y: number; width: number; height: number } {

  if (elements.length === 0) {
    return {
      x: 0,
      y: 0,
      width: 400,  // Minimum width
      height: 150   // Minimum height
    };
  }

  // Find bounding box of all elements
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(element => {
    const { x, y } = element.visual.position;
    const { width, height } = element.visual.size;

    minX = Math.min(minX, x - width / 2);
    maxX = Math.max(maxX, x + width / 2);
    minY = Math.min(minY, y - height / 2);
    maxY = Math.max(maxY, y + height / 2);
  });

  // Add padding (including title bar width on left)
  const titleBarWidth = 40;
  return {
    x: minX - padding.left - titleBarWidth,
    y: minY - padding.top,
    width: (maxX - minX) + padding.left + padding.right + titleBarWidth,
    height: (maxY - minY) + padding.top + padding.bottom
  };
}
```

### Integration with Vertical Layer Layout

Layer containers are created after element layout is complete:

1. **Layout Elements**: Dagre positions all elements within each layer
2. **Calculate Bounds**: Determine container size based on element positions
3. **Create Containers**: Generate LayerContainer shapes with calculated bounds
4. **Apply Y-Offset**: Position containers vertically with layer spacing
5. **Set Z-Index**: Ensure containers render behind elements

## Implementation Plan

### Phase 1: Core Component (Week 1)

#### Tasks
1. **Create LayerContainerShape class** (`src/shapes/layer/LayerContainerShape.tsx`)
   - Extend MetaModelShapeUtil
   - Implement renderHTMLContent with vertical title bar
   - Add prop validators
   - Configure z-index for background rendering

2. **Register shape** in shape registry (`src/shapes/index.ts`)
   - Add to customShapes array
   - Add to shapeTypeMap

3. **Update ShapeTransformer** (`src/services/shapeTransformer.ts`)
   - Add method to create layer containers after elements
   - Calculate bounds for each layer
   - Create LayerContainer shapes with proper positioning

#### Acceptance Criteria
- [ ] Layer containers render as background frames
- [ ] Vertical title bars display layer names
- [ ] Colors match specification
- [ ] Elements appear on top of containers
- [ ] No interaction conflicts

### Phase 2: Layout Integration (Week 2)

#### Tasks
1. **Enhance VerticalLayerLayout** (`src/layout/verticalLayerLayout.ts`)
   - Add bounds calculation for layer containers
   - Include container metadata in layout result
   - Ensure proper spacing between layers

2. **Update ShapeTransformer workflow**
   - Create containers before elements (for z-index)
   - Link container IDs to layer metadata
   - Handle empty layers gracefully

3. **Test with demo data**
   - Verify all layers render correctly
   - Check alignment and spacing
   - Validate color scheme

#### Acceptance Criteria
- [ ] All layers have visible containers
- [ ] Element positions respect container boundaries
- [ ] Layer spacing is appropriate
- [ ] Demo data displays correctly

### Phase 3: Polish & Optimization (Week 3)

#### Tasks
1. **Visual refinements**
   - Add subtle shadows for depth
   - Adjust opacity for optimal contrast
   - Fine-tune padding and spacing

2. **Performance optimization**
   - Ensure containers don't impact rendering performance
   - Optimize z-index handling
   - Test with large models (1000+ elements)

3. **Documentation updates**
   - Update CLAUDE.md with LayerContainer pattern
   - Add screenshots to documentation
   - Document color scheme usage

#### Acceptance Criteria
- [ ] Professional appearance
- [ ] No performance degradation
- [ ] Complete documentation
- [ ] Visual examples in docs

## Edge Cases & Considerations

### Empty Layers
- Display container with minimum dimensions (400x150px)
- Show layer name but no elements
- Maintain visual consistency with populated layers

### Large Layers
- Container expands to fit all elements
- Ensure title bar height scales with container
- Maintain readability of vertical text

### Overlapping Layers
- Should not occur due to vertical stacking
- Layout engine ensures proper spacing
- Visual feedback if overlap detected

### Layer Visibility Toggle
- When layer is hidden via LayerPanel:
  - Hide container shape
  - Hide contained element shapes
  - Maintain layout positions for when re-enabled

### Cross-Layer Relationships
- Arrows connecting elements in different layers
- Should render on top of containers (z-index: 1)
- Visual clarity maintained across container boundaries

## Testing Strategy

### Unit Tests
```typescript
describe('LayerContainerShape', () => {
  test('renders with correct dimensions', () => {
    // Test bounds calculation
  });

  test('applies correct colors', () => {
    // Test color scheme
  });

  test('vertical text orientation', () => {
    // Test title bar rendering
  });
});
```

### Visual Tests (Playwright)
```typescript
test('layer containers display correctly', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.click('text=Load Demo Data');

  // Verify containers are visible
  const businessLayer = await page.locator('[data-layer="Business"]');
  await expect(businessLayer).toBeVisible();

  // Check color
  const bgColor = await businessLayer.evaluate(
    el => window.getComputedStyle(el).backgroundColor
  );
  expect(bgColor).toContain('230, 81, 0'); // Business layer color

  await page.screenshot({ path: 'test-results/layer-containers.png' });
});
```

### Integration Tests
- Test with all layer types
- Verify with varying numbers of elements
- Test layer visibility toggling
- Verify z-index ordering

## Future Enhancements

### Phase 2+ Features
1. **Collapsible Layers**: Click title bar to collapse/expand layer
2. **Layer Statistics**: Show element count in title bar
3. **Drag to Reorder**: Drag title bar to change layer order
4. **Custom Colors**: User-configurable layer colors
5. **Layer Filtering**: Show/hide multiple layers at once

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode support
- Focus indicators

## Dependencies

### Required
- tldraw v4.2.0+ (HTMLContainer support)
- React 18+ (for rendering)
- TypeScript 5+ (for type safety)

### Existing Code to Modify
- `src/shapes/index.ts` - Register new shape
- `src/services/shapeTransformer.ts` - Create containers
- `src/layout/verticalLayerLayout.ts` - Provide bounds
- `src/types/shapes.ts` - Add container types

### New Files to Create
- `src/shapes/layer/LayerContainerShape.tsx` - Main component
- `src/shapes/layer/index.ts` - Exports
- `tests/layer-container.spec.ts` - Tests
- `documentation/layer-container-design.md` - This document

## Success Metrics

### Functional Requirements
- ✅ All 12 layer types render with containers
- ✅ Containers display at correct positions
- ✅ Elements contained within boundaries
- ✅ Consistent colors across instances
- ✅ No rendering performance issues

### Visual Quality
- ✅ Professional, clean appearance
- ✅ Clear visual hierarchy
- ✅ Readable text at all zoom levels
- ✅ Proper contrast and accessibility
- ✅ Consistent with design specification

### User Experience
- ✅ Easy to identify layer boundaries
- ✅ Quick visual scanning of structure
- ✅ No interference with element interaction
- ✅ Smooth transitions and animations
- ✅ Responsive to viewport changes

## Mockups

### Business Layer Example
```
┌─┐──────────────────────────────────────────────────────────┐
│B│  ⚙️ User Registration        ⚙️ Order Processing         │
│u│  ┌──────────────────┐       ┌──────────────────┐         │
│s│  │                  │──────▶│                  │         │
│i│  │  Business Process│       │  Business Process│         │
│n│  └──────────────────┘       └──────────────────┘         │
│e│                                                            │
│s│  Background: rgba(230, 81, 0, 0.08)                      │
│s│  Border: #e65100 (2px solid)                             │
└─┘──────────────────────────────────────────────────────────┘
   ^                                                         ^
   Title bar: #e65100                              Border: #e65100
```

### Multi-Layer Stack View
```
┌─┐──────────────────────────────────────────┐
│M│  Motivation Layer (Green)                │
│o│  [ Elements... ]                         │
│t│                                           │
└─┘──────────────────────────────────────────┘

┌─┐──────────────────────────────────────────┐
│B│  Business Layer (Orange)                 │
│u│  [ Elements... ]                         │
│s│                                           │
└─┘──────────────────────────────────────────┘

┌─┐──────────────────────────────────────────┐
│S│  Security Layer (Pink)                   │
│e│  [ Elements... ]                         │
│c│                                           │
└─┘──────────────────────────────────────────┘

... (remaining layers)
```

## References

- **Existing Colors**: `src/layout/verticalLayerLayout.ts` (lines 174-191)
- **Shape Pattern**: `CLAUDE.md` (Custom Shape Pattern section)
- **Layout System**: `documentation/layout-algorithms.md`
- **Layer Types**: `src/types/index.ts` (LayerType enum)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-25
**Author**: Claude Code
**Status**: Design Complete - Ready for Implementation
