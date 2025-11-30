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
│u│  │ Node     │───▶│ Node     │                 │
│s│  │    1     │    │    2     │                 │
│i│  └──────────┘    └──────────┘                 │
│n│                                                 │
│e│  ┌──────────┐                                  │
│s│  │ Node     │                                  │
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

## Technical Architecture

### Component Structure

The Layer Container is implemented as a custom React Flow node (`LayerContainerNode`).

```typescript
/**
 * Layer Container Node Component
 */
export const LayerContainerNode = memo(({ data, width, height }: NodeProps<LayerContainerNodeData>) => {
  const titleBarWidth = 40;
  const backgroundOpacity = 0.08;
  const layerColor = data.color;

  return (
    <div style={{
      width: width,
      height: height,
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
      pointerEvents: 'none', // Allow interaction with contained elements
      position: 'relative'
    }}>
      {/* Vertical Title Bar */}
      <div style={{
        width: titleBarWidth,
        height: '100%',
        backgroundColor: layerColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px 0 0 4px'
      }}>
        <div style={{
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 14,
          textTransform: 'uppercase'
        }}>
          {data.label}
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        height: '100%',
        backgroundColor: `${layerColor}14`, // ~8% opacity
        border: `2px solid ${layerColor}`,
        borderLeft: 'none',
        borderRadius: '0 4px 4px 0'
      }} />
    </div>
  );
});
```

### Z-Index Layering

To ensure proper visual hierarchy in React Flow:

1. **Layer Containers**: `zIndex: -1` (background layer)
2. **Element Nodes**: `zIndex: 1` (default, on top of containers)
3. **Edges**: `zIndex: 2` (on top of elements)

## Layout Calculation

### Bounds Calculation Algorithm

The `NodeTransformer` calculates the bounds for each layer container:

```typescript
// src/core/services/nodeTransformer.ts

// 1. Calculate layout for all elements
const layout = this.layoutEngine.layout(model.layers);

// 2. Create container nodes based on layout bounds
const containerNode = {
  id: `container-${layerType}`,
  type: 'layerContainer',
  position: { 
    x: layerData.bounds.minX - padding - titleBarWidth, 
    y: layerData.yOffset + layerData.bounds.minY - padding 
  },
  width: titleBarWidth + layerData.bounds.width + (2 * padding),
  height: layerData.bounds.height + (2 * padding),
  style: { zIndex: -1 },
  data: { ... }
};
```

## Implementation Status

- ✅ **Component**: `src/core/nodes/LayerContainerNode.tsx`
- ✅ **Registration**: Registered in `nodeTypes`
- ✅ **Generation**: `NodeTransformer` generates container nodes
- ✅ **Layout**: `VerticalLayerLayout` calculates bounds
- ✅ **Styling**: Colors match the layer specification

## References

- **Implementation**: `src/core/nodes/LayerContainerNode.tsx`
- **Transformer**: `src/core/services/nodeTransformer.ts`
- **Layout**: `src/core/layout/verticalLayerLayout.ts`
