# Arrow Routing & Smooth Paths

## Overview

The viewer now uses **smooth curved arrows** for field-level connections, making relationships clearer and more visually appealing. tldraw v4 provides three arrow routing types with built-in smooth path calculation.

## Arrow Types

### 1. **Arc Arrows** (Smooth Curves)
Uses cubic Bezier curves for smooth, elegant connections.
- **Best for:** Field-level connections, data model relationships
- **Appearance:** Gentle curves that avoid sharp angles
- **Configurable:** Bend amount can be adjusted from 0 (straight) to 1 (maximum curve)

### 2. **Elbow Arrows** (Orthogonal Routing)
Creates right-angle connections with smart routing.
- **Best for:** Technical diagrams, circuit-like layouts
- **Appearance:** Horizontal and vertical segments only
- **Configurable:** Midpoint position can be adjusted

### 3. **Straight Arrows** (Direct)
Simple point-to-point connections.
- **Best for:** Simple relationships, when clarity is paramount
- **Appearance:** Direct line from source to target

## Automatic Routing

The AttachmentPointManager automatically selects the best arrow type:

```typescript
// Field-level connections → Arc arrows with gentle curve
if (sourcePointId.startsWith('field-') && targetPointId.startsWith('field-')) {
  kind: 'arc'
  bend: 0.3
}

// Shape-level connections → Straight arrows
else {
  kind: 'straight'
  bend: 0
}
```

## Visual Result

### **Before (Straight Arrows):**
```
┌─────────────┐
│ Schema A    │
│  id         ├────────────┐
│  teamId     │            │  (overlapping, unclear)
└─────────────┘            │
                           │
┌─────────────┐            │
│ Schema B    │            │
│  id         │◄───────────┘
│  name       │
└─────────────┘
```

### **After (Curved Arrows):**
```
┌─────────────┐
│ Schema A    │
│  id         │
│  teamId     ├─╮
└─────────────┘  ╲
                  ╲  (smooth curve)
                   ╲
┌─────────────┐    ╲
│ Schema B    │     ╲
│  id         │◄────╯
│  name       │
└─────────────┘
```

## Configuration Options

### **Per-Arrow Customization**

You can customize individual arrows by passing options to `createArrow()`:

```typescript
attachmentPointManager.createArrow(
  editor,
  sourceShape,
  targetShape,
  'field-userId-right',
  'field-id-left',
  {
    kind: 'arc',           // 'straight' | 'arc' | 'elbow'
    bend: 0.5,             // 0 = straight, 1 = maximum curve
    color: 'blue',         // Arrow color
    dash: 'dashed',        // 'solid' | 'dashed' | 'dotted' | 'draw'
    size: 'l'              // 's' | 'm' | 'l' | 'xl'
  }
);
```

### **Global Defaults**

Edit `src/layout/attachmentPoints.ts:212-213` to change defaults:

```typescript
// More dramatic curves
const arrowBend = isFieldConnection ? 0.5 : 0;  // was 0.3

// Use elbow arrows instead
const arrowKind = options?.kind || (isFieldConnection ? 'elbow' : 'straight');
```

## Technical Details

### **How Curved Arrows Work**

tldraw uses cubic Bezier curves for arc arrows:
1. Start and end points are calculated from attachment points
2. The `bend` value determines control point offset
3. tldraw automatically calculates the smooth path
4. Arrows avoid overlapping when possible

### **Properties Used**

```typescript
interface TLArrowShapeProps {
  kind: 'straight' | 'arc' | 'elbow';  // Routing algorithm
  bend: number;                         // Curve amount (-1 to 1)
  elbowMidPoint: number;               // For elbow arrows
  start: { x: number; y: number };     // Start coordinates
  end: { x: number; y: number };       // End coordinates

  // Styling
  color: string;
  dash: 'solid' | 'dashed' | 'dotted' | 'draw';
  size: 's' | 'm' | 'l' | 'xl';
  arrowheadStart: string;
  arrowheadEnd: string;
}
```

## Benefits

✅ **Visual Clarity:** Curved arrows reduce visual clutter
✅ **Field Precision:** Clear connection from specific field to specific field
✅ **Professional Look:** Smooth curves are more aesthetically pleasing
✅ **Scalability:** Works well even with many connections
✅ **Flexibility:** Three routing types for different use cases

## Future Enhancements

- [ ] Automatic collision avoidance for dense diagrams
- [ ] Dynamic bend calculation based on distance
- [ ] Arrow labels showing relationship type
- [ ] Smart routing around obstacles
- [ ] Animated path tracing for presentations

## References

- tldraw Arrow Documentation: https://tldraw.dev/
- Implementation: `/src/layout/attachmentPoints.ts:187-245`
- Field-level connections: `/documentation/field-level-connections.md`
