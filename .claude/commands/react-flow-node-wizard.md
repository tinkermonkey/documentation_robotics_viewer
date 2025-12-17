---
description: Automate React Flow node creation with dimension matching and type registration
argument-hint: "<NodeName> --layer <layer> --width <px> --height <px> [--icon <emoji>]"
---

# React Flow Node Wizard

Automates the complete 5-phase React Flow node creation pattern with dimension matching validation and type registration.

## Purpose

Creating a new React Flow node type requires coordinated changes across 5 files with strict dimension matching. This command automates the entire workflow to ensure consistency and prevent common errors like:
- Dimension mismatches between component and `precalculateDimensions()`
- Missing `memo()` wrapper causing performance issues
- Incorrect Handle configuration preventing edge connections
- Type registration errors

## Usage

```bash
/react-flow-node-wizard ContractNode --layer api --width 200 --height 120 --icon "📄"
/react-flow-node-wizard PaymentNode --layer business --width 180 --height 100
/react-flow-node-wizard TestCaseNode --layer testing --width 220 --height 140 --icon "✅"
```

## Arguments

- `<NodeName>` (required): PascalCase node name (e.g., ContractNode, PaymentNode)
- `--layer <layer>` (required): Layer name (e.g., api, business, motivation, security)
- `--width <px>` (required): Node width in pixels (recommended: 180-220)
- `--height <px>` (required): Node height in pixels (recommended: 100-140)
- `--icon <emoji>` (optional): Emoji icon for the node (default: "📦")

## Workflow (5 Phases)

### Phase 1: Validation (10%)

Before making any changes, validate:

1. **Check arguments**:
   - NodeName is PascalCase
   - Width and height are positive integers
   - Layer is a valid layer name

2. **Check for conflicts**:
   - Node type doesn't already exist in `src/core/nodes/index.ts`
   - Component file doesn't exist: `src/core/nodes/{layer}/{NodeName}Node.tsx`

3. **Prepare variables**:
   ```javascript
   const nodeName = "{NodeName}";
   const nodeType = "{nodeName}Node"; // camelCase
   const width = {width};
   const height = {height};
   const layer = "{layer}";
   const icon = "{icon}" || "📦";
   const constantWidth = "{NODE_NAME}_WIDTH"; // SCREAMING_SNAKE_CASE
   const constantHeight = "{NODE_NAME}_HEIGHT";
   ```

If validation fails, report errors and STOP.

### Phase 2: Component Creation (30%)

Create the node component file at `src/core/nodes/{layer}/{NodeName}Node.tsx`:

```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { BaseNodeData } from '../../types/reactflow';

interface {NodeName}Data extends BaseNodeData {
  // Add layer-specific properties here as needed
}

export const {constantWidth} = {width};
export const {constantHeight} = {height};

export const {NodeName} = memo(({ data }: NodeProps<Node<{NodeName}Data>>) => {
  // Extract styling from data
  const borderColor = data.stroke || '#3498db';
  const backgroundColor = data.fill || '#ffffff';
  const opacity = data.opacity !== undefined ? data.opacity : 1;

  return (
    <div
      style={{
        width: {constantWidth},
        height: {constantHeight},
        border: `2px solid ${borderColor}`,
        backgroundColor,
        opacity,
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {/* Handles - Required for edge connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: borderColor,
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: borderColor,
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: borderColor,
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: borderColor,
          width: 8,
          height: 8,
          border: '2px solid white',
        }}
      />

      {/* Node Content */}
      <div
        style={{
          fontSize: '24px',
          marginBottom: '4px',
        }}
      >
        {icon}
      </div>
      <div
        className="node-label"
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#2c3e50',
          textAlign: 'center',
          wordBreak: 'break-word',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.label}
      </div>
    </div>
  );
});

{NodeName}.displayName = '{NodeName}';
```

**Key Requirements**:
- ALWAYS use `memo()` wrapper
- ALWAYS export dimension constants
- ALWAYS include all 4 Handles (top, bottom, left, right)
- ALWAYS set `displayName`
- ALWAYS use inline styles for width/height matching constants

### Phase 3: Index Registration (20%)

Update `src/core/nodes/index.ts`:

1. **Add import** (at top with other imports):
```typescript
import { {NodeName}, {constantWidth}, {constantHeight} } from './{layer}/{NodeName}Node';
```

2. **Add to exports** (near line 50):
```typescript
export {
  {NodeName},
  {constantWidth},
  {constantHeight},
};
```

3. **Add to nodeTypes object** (around line 74):
```typescript
export const nodeTypes = {
  // ... existing entries ...
  {nodeType}: {NodeName},
};
```

### Phase 4: Transformer Updates (30%)

Update `src/core/services/nodeTransformer.ts` in 3 locations:

**4a. Import dimension constants** (lines 12-24):
```typescript
import {
  {constantWidth},
  {constantHeight},
} from '../nodes/{layer}/{NodeName}Node';
```

**4b. Update `getNodeTypeForElement()`** (lines 242-274):

Add to the `typeMap` object:
```typescript
const typeMap: Record<string, string> = {
  // ... existing mappings ...
  '{NodeName}': '{nodeType}',
  '{nodeName}': '{nodeType}',
};
```

**4c. Update `extractNodeData()`** (lines 279-357):

Add conditional block:
```typescript
} else if (nodeType === '{nodeType}') {
  return {
    ...baseData,
    // Add layer-specific property extraction here if needed
  };
```

**4d. Update `precalculateDimensions()`** (lines 364-468):

Add case statement:
```typescript
case '{nodeType}':
  element.visual.size = {
    width: {constantWidth},
    height: {constantHeight},
  };
  break;
```

**CRITICAL**: The dimensions here MUST EXACTLY match the component's width/height. This is enforced by using the exported constants.

### Phase 5: Verification (10%)

After all files are modified:

1. **Run TypeScript check**:
```bash
npm run typecheck
```

2. **Check for errors**:
   - Import errors
   - Type mismatches
   - Duplicate identifiers

3. **Output success message**:
```
✅ React Flow node created successfully!

Files modified:
  - src/core/nodes/{layer}/{NodeName}Node.tsx (created)
  - src/core/nodes/index.ts (updated)
  - src/core/services/nodeTransformer.ts (updated)

Node type: {nodeType}
Dimensions: {width}x{height}

Next steps:
1. Review the generated component and customize styling if needed
2. Add layer-specific properties to the {NodeName}Data interface
3. Update extractNodeData() to extract custom properties from element.properties
4. Test the node by loading a model that includes this element type
5. Run: npm run dev
6. Check console for React Flow warnings
```

## Error Handling

### Validation Errors

**Invalid node name**:
```
❌ Error: Node name must be PascalCase (e.g., ContractNode, not contractNode or contract-node)
```

**Missing required arguments**:
```
❌ Error: Missing required arguments. Usage:
/react-flow-node-wizard <NodeName> --layer <layer> --width <px> --height <px>
```

**Invalid dimensions**:
```
❌ Error: Width and height must be positive integers
Provided: width={width}, height={height}
```

**Node already exists**:
```
❌ Error: Node type '{nodeType}' already exists in src/core/nodes/index.ts
Choose a different name or remove the existing node first.
```

### TypeScript Compilation Errors

If `npm run typecheck` fails after generation:
```
⚠️  Warning: TypeScript compilation failed after node generation.
This may indicate:
1. Missing imports
2. Type mismatches
3. Syntax errors in generated code

Please review the errors above and fix manually, or run:
git checkout src/core/nodes/{layer}/{NodeName}Node.tsx
git checkout src/core/nodes/index.ts
git checkout src/core/services/nodeTransformer.ts
```

## Best Practices

1. **Naming Convention**:
   - Use PascalCase for node names: `ContractNode`, `PaymentNode`
   - Avoid generic names: Use `APIEndpointNode` not `NodeNode`

2. **Dimension Selection**:
   - Standard nodes: 180x100
   - Wide nodes (more text): 200-220 width
   - Tall nodes (more content): 120-140 height
   - Keep consistent within a layer for visual harmony

3. **Icon Selection**:
   - Use clear, recognizable emojis
   - Match the semantic meaning (📄 for documents, 🔒 for security, ⚙️ for tech)
   - Test visibility at small zoom levels

4. **After Generation**:
   - Review and customize the component styling
   - Add layer-specific properties to the Data interface
   - Update `extractNodeData()` to extract custom properties
   - Test with actual data before committing

## Example Interactions

### Example 1: Basic API Node
```bash
User: /react-flow-node-wizard EndpointNode --layer api --width 200 --height 120 --icon "🌐"

Claude: Creating React Flow node: EndpointNode
Phase 1: Validation ✓
Phase 2: Component Creation ✓
Phase 3: Index Registration ✓
Phase 4: Transformer Updates ✓
Phase 5: Verification ✓

✅ React Flow node created successfully!

Files modified:
  - src/core/nodes/api/EndpointNode.tsx (created)
  - src/core/nodes/index.ts (updated)
  - src/core/services/nodeTransformer.ts (updated)

Node type: endpointNode
Dimensions: 200x120

Next steps:
1. Review the generated component and customize styling if needed
2. Add API-specific properties (method, path, etc.) to EndpointNodeData interface
3. Update extractNodeData() to extract these properties
4. Test with a model containing API endpoints
```

### Example 2: Business Layer Node
```bash
User: /react-flow-node-wizard ProcessNode --layer business --width 180 --height 110

Claude: Creating React Flow node: ProcessNode (using default icon 📦)
[... execution ...]
✅ React Flow node created successfully!
```

### Example 3: Security Node
```bash
User: /react-flow-node-wizard ThreatNode --layer security --width 190 --height 100 --icon "⚠️"

Claude: Creating React Flow node: ThreatNode
[... execution ...]
✅ React Flow node created successfully!
```

### Example 4: Error - Node Already Exists
```bash
User: /react-flow-node-wizard GoalNode --layer motivation --width 180 --height 100

Claude: ❌ Error: Node type 'goalNode' already exists in src/core/nodes/index.ts
Choose a different name or remove the existing node first.
```

## Notes

- This command follows the exact pattern documented in CLAUDE.md (lines 11-73)
- All generated code uses TypeScript strict mode
- Dimension constants ensure layout consistency
- The memo() wrapper is critical for React Flow performance
- Handle configuration enables proper edge routing
- Template uses inline styles for maximum compatibility

## Related Commands

- Use `/dr-model` to add elements that use this node type
- Use `/dr-validate` to verify model integrity after creating nodes
- Consider creating a full layer with `/layer-type-expander` agent for multiple related nodes