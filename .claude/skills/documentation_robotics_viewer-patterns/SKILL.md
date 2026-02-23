---
name: documentation_robotics_viewer-patterns
description: Show coding patterns for React Flow nodes, Zustand, and Tailwind
user_invocable: true
args: [nodes|stores|styles|accessibility]
generated: true
generation_timestamp: 2026-02-23T16:11:03.139895Z
generation_version: "2.0"
source_project: documentation_robotics_viewer
source_codebase_hash: 00a2f9723e9a7f64
---

# Documentation Robotics Viewer - Patterns Reference

Quick-reference skill for **documentation_robotics_viewer** coding patterns and conventions.

## Usage

```bash
/documentation_robotics_viewer-patterns [nodes|stores|styles|accessibility]
```

**Args:**
- `nodes` - React Flow custom node pattern (CRITICAL - deviations cause rendering failures)
- `stores` - Zustand state management pattern
- `styles` - Tailwind CSS + Flowbite component pattern
- `accessibility` - WCAG 2.1 AA compliance pattern

**Default:** Shows all patterns if no arg provided

## Purpose

Displays established coding patterns from the **documentation_robotics_viewer** codebase to ensure consistency and prevent common issues. This skill helps developers:

1. **Create React Flow nodes correctly** - Follow the strict pattern that prevents rendering failures
2. **Implement Zustand stores** - Use the project's state management conventions
3. **Apply Tailwind styling** - Follow Flowbite + dark mode patterns
4. **Meet accessibility standards** - Implement WCAG 2.1 AA compliance

All patterns are extracted from production code in `src/core/` and `src/apps/embedded/`.

## Implementation

### For `nodes` Pattern

**Read these reference files:**
```bash
# Example custom nodes showing the pattern
src/core/nodes/motivation/GoalNode.tsx
src/core/nodes/business/BusinessFunctionNode.tsx
src/core/nodes/c4/ContainerNode.tsx

# Registration files (where nodes must be added)
src/core/types/reactflow.ts
src/core/nodes/index.ts
src/core/services/nodeTransformer.ts
```

**Display:**
1. ✅ **Critical Node Requirements** from CLAUDE.md:
   - Export dimension constants (`YOUR_NODE_WIDTH`, `YOUR_NODE_HEIGHT`)
   - Use `memo()` wrapper
   - Include 4 Handles (top, bottom, left, right) with specific IDs
   - Use inline styles (NOT Tailwind for nodes)
   - Add `role="article"` + `aria-label` for accessibility
   - Set `displayName` for React DevTools

2. 📝 **Registration Checklist**:
   - Add `YourNodeData` interface in `src/core/types/reactflow.ts`
   - Export node + dimensions in `src/core/nodes/<category>/index.ts`
   - Add to `nodeTypes` map in `src/core/nodes/index.ts`
   - Update `nodeTransformer.ts` in 3 places:
     - `getNodeTypeForElement()` - Map element type to node type string
     - `extractNodeData()` - Map element properties to node data
     - `precalculateDimensions()` - Import and use dimension constants

3. 🔍 **Example from GoalNode.tsx**:
   ```typescript
   export const GOAL_NODE_WIDTH = 180;
   export const GOAL_NODE_HEIGHT = 100;

   export const GoalNode = memo(({ data, id: _id }: { data: GoalNodeData; id?: string }) => {
     return (
       <div
         role="article"
         aria-label={`Goal: ${data.label}`}
         style={{
           width: GOAL_NODE_WIDTH,
           height: GOAL_NODE_HEIGHT,
           /* ... inline styles ... */
         }}
       >
         <Handle type="target" position={Position.Top} id="top" />
         <Handle type="source" position={Position.Bottom} id="bottom" />
         <Handle type="target" position={Position.Left} id="left" />
         <Handle type="source" position={Position.Right} id="right" />
         {/* content */}
       </div>
     );
   });
   GoalNode.displayName = 'GoalNode';
   ```

4. ⚠️ **Common Pitfalls**:
   - Node not rendering → Check `nodeTransformer.ts` mapping
   - Dimension mismatch → Style must use exported constants
   - Edges not connecting → Verify Handle IDs match edge definitions

---

### For `stores` Pattern

**Read these reference files:**
```bash
# Core stores (framework-agnostic)
src/core/stores/modelStore.ts
src/core/stores/layerStore.ts
src/core/stores/elementStore.ts

# App stores (can use route context)
src/apps/embedded/stores/authStore.ts
src/apps/embedded/stores/viewPreferenceStore.ts
src/apps/embedded/stores/chatStore.ts
```

**Display:**
1. ✅ **Zustand Store Pattern** (NO React Context):
   ```typescript
   import { create } from 'zustand';

   interface YourStoreState {
     data: YourData[];
     isLoading: boolean;
     error: string | null;
     // Actions
     fetchData: () => Promise<void>;
     setData: (data: YourData[]) => void;
     reset: () => void;
   }

   export const useYourStore = create<YourStoreState>((set, get) => ({
     // Initial state
     data: [],
     isLoading: false,
     error: null,

     // Actions
     fetchData: async () => {
       set({ isLoading: true, error: null });
       try {
         const response = await fetch('/api/data');
         const data = await response.json();
         set({ data, isLoading: false });
       } catch (err) {
         set({ error: err.message, isLoading: false });
       }
     },

     setData: (data) => set({ data }),

     reset: () => set({ data: [], isLoading: false, error: null }),
   }));
   ```

2. 📂 **Store Organization**:
   - **Core stores** (`src/core/stores/`) - NO route/app dependencies
   - **App stores** (`src/apps/embedded/stores/`) - CAN use route context
   - Separate stores by concern (auth, model, UI preferences, chat, etc.)

3. 🎯 **Usage in Components**:
   ```typescript
   import { useYourStore } from '@/stores/yourStore';

   function YourComponent() {
     // Subscribe to specific state slices
     const data = useYourStore((state) => state.data);
     const fetchData = useYourStore((state) => state.fetchData);

     // Or get multiple values
     const { data, isLoading, error } = useYourStore();
   }
   ```

4. ⚙️ **Store Features**:
   - Direct async support (no middleware needed)
   - No Provider wrapping required
   - Minimal boilerplate (3kb bundle)
   - TypeScript type inference works automatically

---

### For `styles` Pattern

**Read these reference files:**
```bash
# Flowbite components in use
src/apps/embedded/components/common/ErrorBoundary.tsx
src/apps/embedded/components/shared/ViewToggle.tsx
src/core/components/base/BaseControlPanel.tsx

# Tailwind configuration
tailwind.config.ts
src/theme/
```

**Display:**
1. ✅ **Tailwind + Flowbite Pattern**:
   ```typescript
   import { Button, Card, Badge, Modal, ListItem } from 'flowbite-react';
   // ❌ NEVER: import { List } from 'flowbite-react'; ... <List.Item>
   // ✅ ALWAYS: import { ListItem } from 'flowbite-react'; ... <ListItem>

   function YourComponent() {
     return (
       <Card className="dark:bg-gray-800">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
           Title
         </h2>
         <Button color="blue" size="sm" className="dark:bg-blue-600">
           Action
         </Button>
         <Badge color="success">Active</Badge>
       </Card>
     );
   }
   ```

2. 🎨 **Styling Rules**:
   - ✅ **ALWAYS use Tailwind utilities** - NO new CSS modules (except node inline styles)
   - ✅ **ALWAYS use Flowbite components** - Card, Badge, Button, Modal, etc.
   - ❌ **NEVER use dot notation** - `List.Item` → `ListItem`
   - ✅ **ALWAYS add dark mode variants** - `dark:bg-gray-800`, `dark:text-white`
   - ✅ **ALWAYS add data-testid** - For E2E tests on app components

3. 🌙 **Dark Mode Pattern**:
   ```typescript
   <div className="bg-white dark:bg-gray-900">
     <h1 className="text-gray-900 dark:text-white">Heading</h1>
     <p className="text-gray-600 dark:text-gray-400">Text</p>
     <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
       Button
     </button>
   </div>
   ```

4. 🧪 **Test Selectors**:
   ```typescript
   <Card data-testid="business-function-card">
     <Button data-testid="edit-function-btn">Edit</Button>
   </Card>
   ```

---

### For `accessibility` Pattern

**Read these reference files:**
```bash
# Node accessibility examples
src/core/nodes/motivation/GoalNode.tsx
src/core/nodes/business/BusinessFunctionNode.tsx

# Edge accessibility examples
src/core/edges/ElbowEdge.tsx

# Accessibility documentation
documentation/ACCESSIBILITY.md
```

**Display:**
1. ✅ **WCAG 2.1 AA Compliance Requirements**:

   **Nodes:**
   ```typescript
   <div
     role="article"                          // ✓ Semantic role
     aria-label={`Goal: ${data.label}`}     // ✓ Descriptive label with type
     style={{
       border: `2px solid ${data.stroke}`,   // ✓ 3:1 contrast minimum
       backgroundColor: data.fill,
     }}
   >
     {/* 4 Handles for keyboard navigation */}
     <Handle type="target" position={Position.Top} id="top" />
     <Handle type="source" position={Position.Bottom} id="bottom" />
     <Handle type="target" position={Position.Left} id="left" />
     <Handle type="source" position={Position.Right} id="right" />
   </div>
   ```

   **Edges:**
   ```typescript
   <path
     d={edgePath}
     role="img"  // or "button" for interactive edges
     aria-label={`Association: from ${sourceNode.label} to ${targetNode.label}`}
     onClick={handleClick}
     onKeyDown={handleKeyDown}
     tabIndex={0}  // if interactive
     className="stroke-gray-600 dark:stroke-gray-400"
   />
   ```

2. 🎨 **Color Contrast Standards**:
   - **Text**: Minimum 4.5:1 contrast ratio
   - **UI Components**: Minimum 3:1 contrast ratio
   - Architecture visualizations may use `reviewOnFail: true` for violations (marked for manual review)

3. ⌨️ **Keyboard Navigation**:
   - All interactive elements must be keyboard accessible
   - Tab order must be logical (top-to-bottom, left-to-right)
   - Escape key closes modals/overlays
   - Focus must be visible on all focusable elements

4. 🧪 **Testing Accessibility**:
   ```bash
   # Start Storybook
   npm run storybook:dev
   # Open http://localhost:61001
   # Navigate to any story → Accessibility tab (bottom panel)

   # Run automated a11y tests on all 578 stories
   npm run test:storybook:a11y

   # Full test suite (includes accessibility checks)
   npm test
   ```

5. 📋 **Accessibility Checklist**:
   - [ ] All nodes have `role="article"` and descriptive `aria-label`
   - [ ] All interactive edges have `role="button"` or `role="img"`
   - [ ] Color contrast meets 4.5:1 (text) or 3:1 (UI components)
   - [ ] Keyboard navigation works (Tab, Escape, Enter)
   - [ ] Focus indicators are visible
   - [ ] Storybook a11y tests pass (`npm run test:storybook:a11y`)

---

## Examples

### Example 1: Creating a New Custom Node

```bash
# 1. See the node pattern
/documentation_robotics_viewer-patterns nodes

# 2. Read reference implementation
cat src/core/nodes/motivation/GoalNode.tsx

# 3. Follow the checklist to create your node
# 4. Test in Storybook
npm run storybook:dev
# 5. Validate accessibility
npm run test:storybook:a11y
```

### Example 2: Setting Up a New Zustand Store

```bash
# 1. See the store pattern
/documentation_robotics_viewer-patterns stores

# 2. Read reference implementation
cat src/core/stores/modelStore.ts

# 3. Create your store following the pattern
# 4. Test with unit tests
npm test -- tests/unit/stores/yourStore.spec.ts
```

### Example 3: Checking Styling Conventions

```bash
# 1. See the style pattern
/documentation_robotics_viewer-patterns styles

# 2. Verify dark mode support
npm run storybook:dev
# Toggle dark mode in Storybook toolbar

# 3. Run full test suite
npm test
```

### Example 4: Ensuring Accessibility Compliance

```bash
# 1. See accessibility requirements
/documentation_robotics_viewer-patterns accessibility

# 2. Run a11y tests
npm run test:storybook:a11y

# 3. Review detailed documentation
cat documentation/ACCESSIBILITY.md
```

---

## Related Files

- **Documentation**: `CLAUDE.md` (main development guide)
- **Accessibility**: `documentation/ACCESSIBILITY.md`

---

*This skill was automatically generated on 2026-02-23.*
