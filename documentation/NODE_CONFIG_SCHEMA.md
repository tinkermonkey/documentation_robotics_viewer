# Node Configuration Schema

The `nodeConfig.json` file defines all node styling and behavior via JSON configuration. This configuration-driven approach allows adding new node types without code changes.

## Schema Structure

The complete JSON structure consists of three main sections:

```json
{
  "version": "1.0",
  "typeMap": { /* Element type string → NodeType enum */ },
  "nodeStyles": { /* NodeType → Styling config */ },
  "changesetColors": { /* Changeset operation colors */ }
}
```

## File Location

- **Main config:** `src/core/nodes/nodeConfig.json`
- **Type definitions:** `src/core/nodes/nodeConfig.types.ts`
- **Loader utility:** `src/core/nodes/nodeConfigLoader.ts`

## typeMap

Maps element type strings (from YAML models) to NodeType enum values.

**Purpose:** Normalize various type string formats to canonical NodeType enum values. Supports multiple naming conventions (camelCase, PascalCase, kebab-case, lowercase, spaces).

**Structure:**
```json
{
  "typeMap": {
    "StringFormat1": "nodetype.enum.value",
    "StringFormat2": "nodetype.enum.value",
    "string-format-3": "nodetype.enum.value"
  }
}
```

**Example:**
```json
{
  "typeMap": {
    "BusinessFunction": "business.function",
    "business-function": "business.function",
    "Function": "business.function",
    "businessFunction": "business.function"
  }
}
```

**Key Points:**
- Multiple strings can map to the same NodeType
- Format is case-sensitive
- Supports various naming conventions (camelCase, PascalCase, kebab-case, lowercase, spaces)
- Type strings from YAML/JSON models are matched against this map
- If no match is found, a warning is logged and the node renders an error state (red border with "Invalid node type" message)

## nodeStyles

Maps NodeType enum values to complete styling configuration.

**TypeScript Interface:**
```typescript
interface NodeStyleConfig {
  layout: 'centered' | 'left' | 'table';
  icon: string;
  typeLabel: string;
  colors: {
    fill: string;       // Background color (hex format)
    stroke: string;     // Border color (hex format)
    header?: string;    // Header text color (defaults to stroke)
    handle?: string;    // Handle color for connections (defaults to stroke)
  };
  dimensions: {
    width: number;      // Node width in pixels
    height: number;     // Node height in pixels
    headerHeight?: number;  // For nodes with field lists (table layout)
    itemHeight?: number;    // For nodes with field lists (table layout)
  };
}
```

**Layout Modes:**

- **`centered`**: Label and icon centered vertically and horizontally
  - Used by: Most Motivation layer nodes (Goal, Requirement, Driver, Outcome, Constraint, Stakeholder); C4 External Actor; Layer Container
  - Exceptions: Some Motivation nodes use `left` layout (Assessment, Principle, Value Stream, Assumption)
  - Ideal for: Simple conceptual nodes without detailed content
  - Example: 180x110 pixel nodes

- **`left`**: Label and icon left-aligned, content below
  - Used by: Business layer (Function, Service, Capability, Process); C4 layers (Container, Component); some Motivation nodes (Assessment, Principle, Value Stream, Assumption)
  - Ideal for: Nodes with hierarchical structure or nested content
  - Example: 200x120 pixel nodes

- **`table`**: Field list with table-like appearance
  - Used by: Data layer (JSON Schema, Data Model)
  - Ideal for: Nodes displaying structured data with multiple fields
  - Requires `headerHeight` and `itemHeight` in dimensions
  - Example: 280x96 base with 36px header and 24px items

**Example Node Style (Centered):**
```json
{
  "motivation.goal": {
    "layout": "centered",
    "icon": "🎯",
    "typeLabel": "Goal",
    "colors": {
      "fill": "#d1fae5",
      "stroke": "#059669",
      "header": "#059669",
      "handle": "#059669"
    },
    "dimensions": {
      "width": 180,
      "height": 110
    }
  }
}
```

**Example Node Style (Left-Aligned):**
```json
{
  "business.function": {
    "layout": "left",
    "icon": "📊",
    "typeLabel": "Function",
    "colors": {
      "fill": "#e3f2fd",
      "stroke": "#1565c0",
      "header": "#1565c0",
      "handle": "#1565c0"
    },
    "dimensions": {
      "width": 180,
      "height": 100
    }
  }
}
```

**Example Node Style (Table):**
```json
{
  "data.jsonSchema": {
    "layout": "table",
    "icon": "📋",
    "typeLabel": "SCHEMA",
    "colors": {
      "fill": "#ffffff",
      "stroke": "#1e40af",
      "header": "#2563eb",
      "handle": "#1e40af"
    },
    "dimensions": {
      "width": 280,
      "height": 96,
      "headerHeight": 36,
      "itemHeight": 24
    }
  }
}
```

**Color Best Practices:**
- Use hex format (#RRGGBB) for all colors
- Ensure sufficient contrast between fill and text
- Coordinate fill and stroke colors for visual consistency
- Use header color for section titles in table layouts
- Use handle color for connection points (defaults to stroke if not specified)

**Dimension Guidelines:**
- Motivation nodes: 170-200px wide, 100-120px tall
- Business/C4 nodes: 160-280px wide, 70-180px tall
- Data nodes (table): 240-320px wide, base ~96px + items
  - Header height: typically 36px
  - Item height: typically 24px for field rows
  - Row count affects total node height

## changesetColors

Defines color overrides applied when nodes are part of changesets (add/update/delete operations).

**Structure:**
```json
{
  "changesetColors": {
    "add": {
      "border": string,    // Color for add border
      "bg": string,        // Color for add background
      "opacity": number    // Optional opacity (0-1, defaults to 1)
    },
    "update": {
      "border": string,
      "bg": string,
      "opacity": number
    },
    "delete": {
      "border": string,
      "bg": string,
      "opacity": number
    }
  }
}
```

**Example:**
```json
{
  "changesetColors": {
    "add": {
      "border": "#10b981",
      "bg": "#d1fae5",
      "opacity": 1
    },
    "update": {
      "border": "#f59e0b",
      "bg": "#fef3c7",
      "opacity": 1
    },
    "delete": {
      "border": "#ef4444",
      "bg": "#fee2e2",
      "opacity": 0.6
    }
  }
}
```

**Color Semantics:**
- **Add (green)**: New nodes being introduced in the changeset
- **Update (amber)**: Existing nodes being modified
- **Delete (red)**: Nodes being removed; typically use lower opacity (0.6) for visual distinction

## Node Types Reference

The following NodeType enum values are defined and must have corresponding entries in `nodeStyles`:

### Motivation Layer (10 types)
```
motivation.stakeholder   # Stakeholder (👤)
motivation.goal          # Goal (🎯)
motivation.requirement   # Requirement (✓)
motivation.assessment    # Assessment (✓)
motivation.driver        # Driver (⚡)
motivation.outcome       # Outcome (🏆)
motivation.principle     # Principle (📋)
motivation.constraint    # Constraint (🚫)
motivation.valueStream   # Value Stream (→)
motivation.assumption    # Assumption (💭)
```

### Business Layer (4 types)
```
business.function        # Function (📊)
business.service         # Service (🔌)
business.capability      # Capability (⭐)
business.process         # Process (⚙️)
```

### C4 Layer (3 types)
```
c4.container             # Container (📦)
c4.component             # Component (🧩)
c4.externalActor         # External Actor (👥)
```

### Data Layer (2 types)
```
data.jsonSchema          # JSON Schema (📋)
data.model               # Data Model (📊)
```

### Structural (1 type)
```
layer.container          # Layer Container (📦)
```

## Adding New Node Types

To add a new node type without code changes:

1. **Add NodeType enum value** in `src/core/nodes/NodeType.ts`:
   ```typescript
   export enum NodeType {
     // ... existing types
     MY_LAYER_MY_TYPE = 'myLayer.myType',
   }
   ```

2. **Add type mapping** in `nodeConfig.json` `typeMap` section:
   ```json
   {
     "MyType": "myLayer.myType",
     "my-type": "myLayer.myType",
     "myType": "myLayer.myType"
   }
   ```

3. **Add styling configuration** in `nodeConfig.json` `nodeStyles` section:
   ```json
   {
     "myLayer.myType": {
       "layout": "left",
       "icon": "🎨",
       "typeLabel": "My Type",
       "colors": {
         "fill": "#...",
         "stroke": "#...",
         "header": "#...",
         "handle": "#..."
       },
       "dimensions": {
         "width": 180,
         "height": 100
       }
     }
   }
   ```

4. **No component changes needed** - the UnifiedNode component automatically handles the new type

## Theme Support

Currently, the node configuration uses a single `nodeConfig.json` file for all themes. The colors defined in the configuration are theme-agnostic and remain consistent across light and dark modes. The application's dark mode styling is handled at the component level through Tailwind CSS classes (e.g., `dark:bg-gray-800`, `dark:text-white`).

Future support for multiple theme variants could be implemented by:
- Creating additional config files (e.g., `nodeConfig.dark.json`)
- Modifying the `nodeConfigLoader` to accept a theme parameter
- Loading different `nodeStyles` and `changesetColors` based on the selected theme
- Keeping the `typeMap` consistent across all theme variants

## Field Visibility Configuration

Field visibility is managed separately via Zustand store (`fieldVisibilityStore.ts`), not in `nodeConfig.json`.

**Store State:**
- `graphLevelHideFields: boolean` - Global toggle affecting all nodes
- `nodeLevelOverrides: Map<string, boolean>` - Per-node visibility overrides

**Precedence:** Graph-level > Node-level > Default (show fields)

**Usage in Components:**
```typescript
import { useShouldHideFields, useSetGraphLevelVisibility } from '@core/stores/fieldVisibilityStore';

// In a node component
const shouldHide = useShouldHideFields(nodeId);

// In a control panel
const setGraphHide = useSetGraphLevelVisibility();
setGraphHide(true); // Hide all fields globally
```

## Validation and Loading

**Loading Process:**
1. JSON file is parsed and validated against TypeScript interfaces
2. All NodeTypes in `nodeStyles` must have corresponding entries
3. All typeMap values must point to existing NodeType enum values
4. Missing configs will cause runtime warnings

**Validation Checklist:**
- [ ] All NodeType enum values have nodeStyles entries
- [ ] All typeMap values reference valid NodeType values
- [ ] Colors are valid hex format (#RRGGBB)
- [ ] Dimensions are positive integers
- [ ] Layout values are one of: 'centered', 'left', 'table'
- [ ] Icons are single emoji characters
- [ ] typeLabel strings are human-readable

## Related Documentation

- **CLAUDE.md**: Node architecture overview and adding new types
- **nodeConfig.types.ts**: TypeScript interface definitions
- **UnifiedNode.tsx**: Component implementation
- **fieldVisibilityStore.ts**: Field visibility store implementation
