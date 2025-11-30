# Claude Code Development Guide

This document provides guidance for Claude Code (and other AI assistants) working on the Documentation Robotics Viewer project.

## Project Overview

The Documentation Robotics Viewer is a React-based visualization tool built on tldraw v4.2.0. It displays multi-layer architecture documentation models with custom shapes representing different architectural elements (Business Processes, API Endpoints, Data Models, Roles, Permissions, etc.).

**Key Technologies:**
- React 18 + TypeScript
- tldraw v4.2.0 (canvas library)
- Vite (build tool)
- Playwright (E2E testing)

## Critical: Custom Shape Pattern for tldraw v4

All custom shapes MUST follow this exact pattern. Deviations will cause validation errors and rendering failures.

### Required Steps for Creating a New Custom Shape

#### 1. Create the Shape File

Location: `src/shapes/<category>/<ShapeName>Shape.tsx`

Example categories: `business/`, `api/`, `security/`, `datamodel/`, `schema/`

#### 2. Required Imports

```typescript
import { TLBaseShape, HTMLContainer, T, RecordProps } from 'tldraw';
import { MetaModelShapeUtil } from '../base/MetaModelShapeUtil';
import { AttachmentPoint, <YourPropsInterface> } from '../../types';
```

**Critical**: Always import `T` and `RecordProps` from tldraw - these are required for prop validators.

#### 3. Define Shape Interface

```typescript
export interface YourShape extends TLBaseShape<'your-shape-type', YourShapeProps> {}
```

#### 4. Create Shape Utility Class

```typescript
export class YourShapeUtil extends MetaModelShapeUtil<YourShape> {
  static override type = 'your-shape-type' as const;

  /**
   * Prop validators for tldraw v4
   * THIS IS CRITICAL - Without this, shapes will fail validation
   */
  static override props: RecordProps<YourShape> = {
    // Required base props
    w: T.number,
    h: T.number,
    label: T.string,
    fill: T.string,
    stroke: T.string,

    // Optional base props
    elementId: T.optional(T.string),
    elementType: T.optional(T.string),
    layerId: T.optional(T.string),

    // Your custom props
    yourCustomProp: T.string,
    yourOptionalProp: T.optional(T.number),

    // Array example
    yourArray: T.optional(T.arrayOf(T.string)),

    // Object example
    yourObject: T.optional(T.model('yourObjectName', T.object({
      field1: T.string,
      field2: T.boolean
    }))),

    // Always include these at the end
    modelElement: T.optional(T.any),
    attachmentPoints: T.optional(T.any)
  };

  /**
   * Get default attachment points
   */
  override getDefaultAttachmentPoints(): AttachmentPoint[] {
    return [
      { id: 'top', position: 'top', offset: 0, connections: [] },
      { id: 'bottom', position: 'bottom', offset: 0, connections: [] },
      { id: 'left', position: 'left', offset: 0, connections: [] },
      { id: 'right', position: 'right', offset: 0, connections: [] }
    ];
  }

  /**
   * Get default props
   */
  override getDefaultProps(): YourShapeProps {
    const baseProps = super.getDefaultProps();
    return {
      ...baseProps,
      w: 160,
      h: 80,
      fill: '#ffffff',
      stroke: '#000000',
      // Your custom defaults
      yourCustomProp: 'default value'
    };
  }

  /**
   * Render the shape using HTMLContainer
   * CRITICAL: Must use HTMLContainer, NOT SVG elements
   */
  override renderHTMLContent(shape: YourShape): JSX.Element {
    const { w, h, label, yourCustomProp } = shape.props;

    return (
      <HTMLContainer
        style={{
          width: w,
          height: h,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          border: `1.5px solid ${shape.props.stroke}`,
          backgroundColor: shape.props.fill,
          borderRadius: 4,
          overflow: 'hidden',
          pointerEvents: 'all',
          padding: 8
        }}
      >
        {/* Your HTML/CSS content here */}
        <div>{label}</div>
      </HTMLContainer>
    );
  }

  /**
   * Indicator component (for selection)
   */
  override indicator(shape: YourShape) {
    return (
      <rect
        x={0}
        y={0}
        width={shape.props.w}
        height={shape.props.h}
        fill="none"
        stroke="var(--color-selected)"
        strokeWidth={2}
        rx={4}
      />
    );
  }
}
```

### Common Prop Validator Types

```typescript
T.string                           // Required string
T.number                           // Required number
T.boolean                          // Required boolean
T.optional(T.string)               // Optional string
T.arrayOf(T.string)                // Array of strings
T.arrayOf(T.number)                // Array of numbers
T.model('name', T.object({         // Nested object
  field: T.string
}))
T.any                              // Any type (use sparingly)
```

#### 5. Register the Shape

**a) Update `src/shapes/index.ts`:**

```typescript
// Add import
import { YourShapeUtil } from './category/YourShape';

// Add to customShapes array
export const customShapes = [
  // ... existing shapes
  YourShapeUtil
];

// Add to shapeTypeMap
export const shapeTypeMap: Record<string, ...> = {
  // ... existing mappings
  'YourElementType': YourShapeUtil
};

// Add to exports
export * from './category/YourShape';
```

**b) Update `src/services/shapeTransformer.ts`:**

In `getShapeTypeForElement()` method:

```typescript
case 'YourElementType':
case 'your-element-type':
  return 'your-shape-type';
```

In shape creation (around line 129+):

```typescript
} else if (shapeType === 'your-shape-type') {
  props.fill = element.visual.style.backgroundColor || '#ffffff';
  props.stroke = element.visual.style.borderColor || '#000000';
  props.label = element.name;
  props.elementId = element.id;
  props.yourCustomProp = element.properties.yourCustomProp;
}
```

### Critical Rules

1. **ALWAYS use HTMLContainer** - Never use SVG `<text>` elements directly. This causes namespace issues.

2. **ALWAYS define prop validators** - Use `static override props: RecordProps<YourShape>`. Without this, tldraw will throw validation errors.

3. **ALWAYS implement renderHTMLContent()** - This is the abstract method from MetaModelShapeUtil.

4. **NEVER mix SVG and HTML** - Use HTMLContainer for everything or SVG for everything, never both.

5. **ALWAYS include base props** - Every shape needs: `w`, `h`, `label`, `fill`, `stroke`, `elementId`, `modelElement`, `attachmentPoints`.

6. **ALWAYS use T.optional()** for optional props - This prevents validation errors when props are undefined.

7. **ALWAYS test your shape** - Create a Playwright test to verify rendering.

### Testing New Shapes

Create a test file in `tests/your-shape.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('your shape renders correctly', async ({ page }) => {
  await page.goto('http://localhost:3001');

  // Load demo data or create test shapes
  await page.click('text=Load Demo Data');

  // Wait for shapes to render
  await page.waitForSelector('.tldraw__canvas');

  // Verify shape is visible with label
  const shapeLabel = await page.locator('text=Your Shape Label');
  await expect(shapeLabel).toBeVisible();

  // Take screenshot for visual verification
  await page.screenshot({ path: 'test-results/your-shape.png' });
});
```

## Architecture Overview

### Layer Structure

The viewer organizes elements into architectural layers:
- **Motivation**: Goals, drivers, stakeholders
- **Business**: Business processes, capabilities
- **Security**: Roles, permissions, policies
- **Application**: Components, services
- **Technology**: Infrastructure, platforms
- **API**: API endpoints, operations
- **DataModel**: Entities, schemas, data structures
- **UX**: User interfaces, screens
- **Navigation**: Navigation flows
- **APM**: Monitoring, observability

### Key Files

- `src/shapes/` - All custom shape definitions
- `src/shapes/base/MetaModelShapeUtil.tsx` - Base class for all shapes
- `src/services/shapeTransformer.ts` - Converts model elements to shapes
- `src/stores/elementStore.ts` - Global element storage
- `src/types/` - TypeScript type definitions

### Shape Rendering Flow

1. User loads a model (demo data, GitHub, or local)
2. `GraphViewer` receives the model
3. `ShapeTransformer` converts model elements to tldraw shapes
4. For each element:
   - `getShapeTypeForElement()` determines the shape type
   - Props are prepared based on element properties
   - `editor.createShape()` creates the shape
5. tldraw validates props using the shape's `props` definition
6. Shape's `renderHTMLContent()` method renders the visual

## Common Issues and Solutions

### Issue: "ValidationError: Expected json serializable value, got object"

**Cause**: Missing or incorrect prop validators.

**Solution**: Add `static override props: RecordProps<YourShape>` with proper validators for all props.

### Issue: "Text elements not rendering" or "Floating text"

**Cause**: Using SVG `<text>` elements instead of HTMLContainer.

**Solution**: Use `<HTMLContainer>` with HTML/CSS for all text and content.

### Issue: "Shape not appearing in canvas"

**Cause**: Shape type not registered or not mapped in shapeTransformer.

**Solution**:
1. Check `customShapes` array in `src/shapes/index.ts`
2. Check `shapeTypeMap` in `src/shapes/index.ts`
3. Check `getShapeTypeForElement()` in `src/services/shapeTransformer.ts`

### Issue: "Cannot read property 'x' of undefined"

**Cause**: Missing required prop or accessing undefined property.

**Solution**: Use `T.optional()` for optional props and check for undefined before accessing nested properties.

## Development Workflow

1. **Before making changes**: Read existing shape files to understand the pattern
2. **Create new features**: Follow the patterns established in existing code
3. **Test thoroughly**: Run `npm test` before committing
4. **Check for errors**: Monitor browser console for validation errors
5. **Visual verification**: Always check screenshots in test results

## Code Style

- Use TypeScript for all files
- Use functional components for React
- Use arrow functions for methods when appropriate
- Keep methods focused and single-purpose
- Document complex logic with comments
- Use meaningful variable names

## YAML Instance Model Support (v0.1.0)

The viewer now supports loading YAML-based instance models in addition to JSON Schema definitions. This allows visualization of actual architectural data (not just schemas).

### Key Differences: JSON Schema vs YAML Instance

| Aspect | JSON Schema (v0.1.1) | YAML Instance (v0.1.0) |
|--------|---------------------|------------------------|
| Purpose | Define data structure | Actual architecture data |
| Format | Single JSON per layer | manifest.yaml + multiple YAML files |
| Elements | Schema definitions | Real element instances |
| IDs | Auto-generated UUIDs | Explicit dot-notation (e.g., `business.function.name`) |
| Relationships | Separate relationship arrays | Nested under `relationships` key |
| Organization | Flat layer files | Hierarchical directory structure |

### YAML Instance Model Structure

**manifest.yaml** - Model orchestration file:
```yaml
version: 0.1.0
schema: documentation-robotics-v1
project:
  name: my-project
  description: Project description
  version: 1.0.0
layers:
  business:
    order: 2
    name: Business
    path: model/02_business/
    enabled: true
    elements:
      function: 10
      process: 5
```

**Element Files** (e.g., `02_business/functions.yaml`):
```yaml
Knowledge Graph Management:
  name: Knowledge Graph Management
  description: Manage knowledge graph operations
  id: business.function.knowledge-graph-management
  relationships:
    supports_goals:
      - motivation.goal.improve-data-quality
```

### Dot-Notation ID Format

Format: `{layer}.{type}.{kebab-case-name}`

Examples:
- `business.function.knowledge-graph-management`
- `api.operation.create-structure-node`
- `data_model.schema.structure-node`

The parser automatically resolves these to UUIDs for internal processing.

### OpenAPI Integration

API operations can embed full OpenAPI 3.0 specifications:
```yaml
create-user:
  name: create-user
  method: POST
  path: /api/users
  id: api.operation.create-user
  openapi:
    openapi: 3.0.3
    paths:
      /api/users:
        post:
          summary: Create a new user
          parameters: [...]
```

### JSON Schema Integration

Data models can embed JSON Schema definitions:
```yaml
user-schema:
  name: user-schema
  id: data_model.schema.user
  $schema: http://json-schema.org/draft-07/schema#
  schemas:
    User:
      type: object
      properties:
        id: {type: string, format: uuid}
        name: {type: string}
      required: [id, name]
```

### Projection Rules

The `projection-rules.yaml` file defines cross-layer element generation rules (parsed but not auto-applied):
```yaml
version: 0.1.0
projections:
  - name: business-to-application
    from: business.service
    to: application.service
    rules:
      - create_type: service
        name_template: "{{source.name}}"
        properties:
          realizes: "{{source.id}}"
```

### Best-Effort Parsing

The YAML parser implements best-effort parsing:
- **Fatal Errors**: Missing manifest, no enabled layers → throw exception
- **Warnings**: Malformed elements, broken references → log and continue
- **Result**: Partial model + warnings array in metadata

### Loading YAML Models

**From Local ZIP:**
1. User uploads ZIP containing `manifest.yaml` and layer directories
2. System detects manifest presence
3. Extracts all YAML files with path preservation
4. Groups files by layer using manifest configuration
5. Parses elements and resolves dot-notation references

**From GitHub:**
Same as local, but ZIP downloaded via backend proxy

### Parser Architecture

1. **YAMLParser** (`src/services/yamlParser.ts`)
   - `parseManifest()` - Validates and parses manifest
   - `parseLayerFiles()` - Converts YAML elements to ModelElements
   - `extractRelationshipsFromElement()` - Processes nested relationships
   - `extractOpenAPIDetails()` / `extractJSONSchemaDetails()` - Extracts embedded specs

2. **DataLoader Integration** (`src/services/dataLoader.ts`)
   - `detectSchemaType()` - Detects YAML vs JSON Schema vs JSON instance
   - `parseYAMLInstances()` - Orchestrates full YAML model parsing
   - `resolveDotNotationReferences()` - Maps dot-notation IDs to UUIDs

3. **File Extraction** (`src/services/githubService.ts`, `src/services/localFileLoader.ts`)
   - Extract both `.json` and `.yaml`/`.yml` files from ZIP
   - Preserve full paths for layer grouping
   - Detect manifest presence to determine model type

### Testing

**Integration Tests** (`tests/example-implementation.spec.ts`):
- Verifies manifest structure
- Validates layer directory organization
- Confirms element counts
- Tests OpenAPI/JSON Schema extraction
- Validates projection rules parsing

**Example Model**:
The `example-implementation/` directory contains a real 182-element model across 11 layers for testing.

### For More Details

See `documentation/YAML_MODELS.md` for complete specification and examples.

## Resources

- tldraw v4 documentation: https://tldraw.dev/
- Project architecture docs: `documentation/`
- Implementation logs: `documentation/IMPLEMENTATION_LOG.md`

## When in Doubt

1. Look at existing shape implementations (BusinessProcessShape, APIEndpointShape, etc.)
2. Check `MetaModelShapeUtil.tsx` for base class requirements
3. Run tests to verify changes
4. Ask the user for clarification on requirements

## Motivation Layer Visualization (Phase 6 - Export & Testing)

### Export Features

The motivation layer supports comprehensive export capabilities:

**1. PNG/SVG Image Exports**
```typescript
import { exportAsPNG, exportAsSVG } from '../services/motivationExportService';

// Export current viewport as PNG
await exportAsPNG(reactFlowContainer, 'motivation-graph.png');

// Export as SVG vector image
await exportAsSVG(reactFlowContainer, 'motivation-graph.svg');
```

**2. Graph Data Export**
```typescript
import { exportGraphDataAsJSON } from '../services/motivationExportService';

// Export filtered graph structure
exportGraphDataAsJSON(nodes, edges, motivationGraph, 'graph-data.json');
```

**3. Traceability Report Export**
```typescript
import { exportTraceabilityReport } from '../services/motivationExportService';

// Generate requirement→goal traceability report
exportTraceabilityReport(motivationGraph, 'traceability-report.json');
```

The traceability report includes:
- Requirement-to-goal mappings
- Trace paths (direct and indirect)
- Orphaned requirements (no goal coverage)
- Orphaned goals (no requirement coverage)
- Coverage statistics (percentages)

### Layout Persistence

Manual node positions are automatically persisted to localStorage:

**Implementation Pattern:**
```typescript
// Save positions on drag end (in MotivationGraphView)
const onNodeDragStop = useCallback(
  (_event: any, _node: any) => {
    if (selectedLayout === 'manual') {
      const positions = new Map<string, { x: number; y: number }>();
      nodes.forEach((n) => {
        positions.set(n.id, { x: n.position.x, y: n.position.y });
      });
      setManualPositions(positions); // Saves to localStorage via viewPreferenceStore
    }
  },
  [selectedLayout, nodes, setManualPositions]
);
```

**Storage Key:** `dr-viewer-preferences` (managed by Zustand persist middleware)

**Restoration:** Positions are restored when:
- User reloads the page
- User selects "Manual" layout
- Existing nodes use saved positions, new nodes use auto-layout

### Testing Strategy

**E2E Tests** (`tests/motivation-layer.spec.ts`):
- 15 comprehensive tests covering all user stories
- Export functionality tests
- Layout persistence verification
- Cross-browser compatibility

**Accessibility Tests** (`tests/motivation-accessibility.spec.ts`):
- Axe-core integration for WCAG 2.1 AA compliance
- Keyboard navigation tests
- ARIA label verification
- Screen reader compatibility
- Focus indicator visibility
- Color contrast checks

**Performance Tests** (`tests/motivation-performance.spec.ts`):
- Initial render time (< 3s target)
- Filter operation latency (< 500ms target)
- Layout switch time (< 800ms target)
- Pan/zoom responsiveness (60fps target)
- Memory usage profiling
- Edge rendering performance

**Run Tests:**
```bash
# Start dev server
npm run dev:embedded

# Run all Playwright tests
npx playwright test

# Run specific test suite
npx playwright test motivation-layer
npx playwright test motivation-accessibility
npx playwright test motivation-performance

# Run with UI
npx playwright test --ui
```

### Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial render (500 elements) | < 3s | ReactFlow viewport culling |
| Filter operations | < 500ms | Pre-indexed data structures |
| Layout switch | < 800ms | Smooth transitions, requestAnimationFrame |
| Pan/zoom | 60fps | ReactFlow optimization |
| Memory (1000 elements) | < 50MB | Efficient data structures |

---

**Last Updated**: 2025-11-30
**tldraw Version**: 4.2.0
**Project Version**: 1.0.0
**YAML Support**: v0.1.0
**Motivation Layer**: Phase 6 Complete
