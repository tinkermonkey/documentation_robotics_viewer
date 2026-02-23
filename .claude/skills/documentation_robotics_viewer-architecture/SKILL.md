---
name: documentation_robotics_viewer-architecture
description: Display architectural overview and critical file locations
user_invocable: true
args:
generated: true
generation_timestamp: 2026-02-23T16:05:21.369662Z
generation_version: "2.0"
source_project: documentation_robotics_viewer
source_codebase_hash: 00a2f9723e9a7f64
---

# Documentation Robotics Viewer - Architecture Reference

Quick-reference skill for **documentation_robotics_viewer** architecture overview and critical file locations.

## Usage

```bash
/documentation_robotics_viewer-architecture
```

## Purpose

Displays a comprehensive architectural overview of the **documentation_robotics_viewer** project, including:
- **Architectural style** (Layered Architecture with Hexagonal/Ports & Adapters)
- **Layer boundaries** (core vs. app separation rules)
- **Critical data pipeline** (YAML → React Flow transformation)
- **Most critical files** to understand/modify
- **Tech stack summary** (React 19, TypeScript 5.9, Vite 6.4, Playwright 1.57)
- **Key patterns** (React Flow nodes, Zustand stores, accessibility)

## Architecture Overview

### Architectural Style
**Layered Architecture with Hexagonal/Ports & Adapters Pattern**

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│              (src/apps/embedded/)                           │
│   Routes, Components, Stores, App-specific Logic           │
│   CAN import from core layer                               │
├─────────────────────────────────────────────────────────────┤
│                      Core Layer                             │
│                   (src/core/)                               │
│   Reusable, Framework-agnostic                             │
│   NEVER imports from app layer                             │
│                                                             │
│   ├─ nodes/        Custom React Flow nodes (15+ types)     │
│   ├─ edges/        Custom edge types                       │
│   ├─ layout/       Layout engines (Dagre, ELK, D3, Graphviz)│
│   ├─ services/     Data transformers, parsers              │
│   ├─ stores/       Global Zustand stores                   │
│   └─ components/   Base UI (GraphViewer, panels)           │
├─────────────────────────────────────────────────────────────┤
│               External Infrastructure                       │
│              DR CLI Server (REST + WebSocket)              │
└─────────────────────────────────────────────────────────────┘
```

### Critical Data Pipeline

```
YAML/JSON Files
    ↓
yamlParser.ts / jsonSchemaParser.ts
    ↓
ModelStore (Zustand)
    ↓
nodeTransformer.ts (MetaModel → React Flow)
    ↓
Layout Engines (calculate positions)
    ↓
GraphViewer.tsx (viewport culling)
    ↓
React Flow Canvas
```

## Directory Structure

```
src/
├── core/                          # Framework-agnostic reusable code
│   ├── nodes/                     # 15+ custom node types
│   │   ├── business/              # BusinessFunction, BusinessService, BusinessCapability
│   │   ├── motivation/            # Goal, Stakeholder, Constraint, Driver, etc.
│   │   ├── c4/                    # Container, Component, ExternalActor
│   │   └── index.ts               # ★ Node registry (nodeTypes map)
│   ├── edges/                     # Custom edge types
│   ├── layout/
│   │   ├── engines/               # Dagre, ELK, D3Force, Graphviz
│   │   └── business/              # Business-specific layouts
│   ├── services/
│   │   ├── nodeTransformer.ts     # ★★★ Core transformation pipeline
│   │   ├── dataLoader.ts          # Data loading orchestration
│   │   ├── yamlParser.ts          # YAML instance parsing
│   │   └── jsonSchemaParser.ts    # JSON Schema parsing
│   ├── stores/                    # Global Zustand stores
│   │   ├── modelStore.ts          # Main model data
│   │   ├── layerStore.ts          # Layer visibility
│   │   └── elementStore.ts        # Element selection
│   └── components/
│       ├── GraphViewer.tsx        # ★★ Main canvas (viewport culling)
│       └── base/                  # BaseInspectorPanel, BaseControlPanel
├── apps/embedded/                 # TanStack Router app
│   ├── routes/                    # Route components
│   ├── components/                # App-specific components
│   ├── stores/                    # App-specific stores (authStore, chatStore)
│   └── services/                  # App-specific graph builders
└── catalog/                       # Storybook (578 stories, 97 files)
```

## Most Critical Files

### 🔥 Top Priority (Understand These First)

1. **`src/core/services/nodeTransformer.ts`** (873 lines)
   - **THE CORE PIPELINE** - Transforms MetaModel → React Flow nodes/edges
   - Three critical functions:
     - `getNodeTypeForElement()` - Maps element type to node type
     - `extractNodeData()` - Extracts node data from elements
     - `precalculateDimensions()` - Calculates node sizes
   - **MUST MODIFY** when adding new node types

2. **`src/core/components/GraphViewer.tsx`**
   - Main React Flow canvas
   - Viewport culling (40-60% edge reduction)
   - Two-pass layout orchestration

3. **`src/core/nodes/index.ts`**
   - Node type registry (`nodeTypes` map)
   - **Plugin architecture** - Register all custom nodes here

### 📋 Secondary (Frequently Modified)

4. **`src/core/layout/engines/`** - Layout algorithm implementations
   - `DagreLayoutEngine.ts` - Hierarchical layouts
   - `ElkLayoutEngine.ts` - Advanced Eclipse Layout Kernel
   - `D3ForceLayoutEngine.ts` - Physics simulations
   - `GraphvizLayoutEngine.ts` - DOT language via WASM

5. **`src/core/stores/modelStore.ts`** - Main data store
   - MetaModel loading
   - Element/layer/relationship state

6. **`src/apps/embedded/routes/`** - Route components
   - Uses `SharedLayout` (3-column pattern)
   - Left sidebar (layers), Main (graph), Right sidebar (inspector)

### 🧰 Utilities & Services

7. **`src/core/services/yamlParser.ts`** - YAML instance parsing
   - Resolves dot-notation IDs (`business.function.name`) to UUIDs

8. **`src/core/services/crossLayerReferenceExtractor.ts`**
   - Extracts cross-layer relationships
   - Builds dependency graph

## Tech Stack

- **Language:** TypeScript 5.9.3 (100% strict mode)
- **Framework:** React 19.2.0
- **Build:** Vite 6.4.0
- **Graph Library:** @xyflow/react 12.9.3 (React Flow)
- **State:** Zustand 5.0.8 (NO React Context)
- **Routing:** @tanstack/react-router
- **UI:** Flowbite React + Tailwind CSS v4
- **Testing:** Playwright 1.57.0 (1170 tests + 578 Storybook stories)
- **Layout Engines:** dagre, elkjs, d3-force, @hpcc-js/wasm (GraphViz)

## Key Architectural Rules

### ✅ DO

- **Core layer** - Reusable, framework-agnostic, NO app imports
- **App layer** - CAN import from core
- **Read first** - NEVER modify code you haven't read
- **Edit, don't create** - ALWAYS prefer editing existing files
- **Follow patterns** - Look at similar implementations before starting
- **Use TypeScript strictly** - All files strongly typed
- **Test thoroughly** - Run `npm test` before completing tasks

### ❌ DON'T

- Core importing from app layer (violates architecture boundary)
- Creating new files unnecessarily (causes file bloat)
- Using React Context (use Zustand stores instead)
- Using CSS modules (use Tailwind utilities)
- Using dot notation for Flowbite (`List.Item` → `ListItem`)
- Modifying nodes without updating nodeTransformer.ts

## Critical Patterns

### React Flow Node Pattern (MUST FOLLOW)

```typescript
// 1. Define dimension constants
export const YOUR_NODE_WIDTH = 180;
export const YOUR_NODE_HEIGHT = 100;

// 2. Create memoized component
export const YourNode = memo(({ data, id: _id }: { data: YourNodeData; id?: string }) => {
  return (
    <div
      role="article"
      aria-label={`Your Type: ${data.label}`}
      style={{
        width: YOUR_NODE_WIDTH,    // ★ Use exported constant
        height: YOUR_NODE_HEIGHT,  // ★ Use exported constant
        // ... inline styles (NOT Tailwind)
      }}
    >
      {/* ★ ALWAYS include 4 Handles */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      {/* content */}
    </div>
  );
});

// 3. Set displayName
YourNode.displayName = 'YourNode';

// 4. Register in src/core/nodes/index.ts
export const nodeTypes = {
  yourType: YourNode,
  // ...
};

// 5. Update nodeTransformer.ts (3 places):
//    - getNodeTypeForElement()
//    - extractNodeData()
//    - precalculateDimensions()
```

### Zustand Store Pattern

```typescript
import { create } from 'zustand';

export const useYourStore = create<YourState>((set, get) => ({
  // State
  items: [],

  // Actions
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  // Computed values
  getItemById: (id) => get().items.find(i => i.id === id),
}));

// Usage: Direct hook call (NO Provider needed)
const { items, addItem } = useYourStore();
```

## Common Commands

```bash
# Development
npm run dev                       # Start Vite dev server

# Testing
npm test                          # Unit tests (1170 tests, ~10s)
npm run test:e2e                  # E2E with DR CLI server
npm run test:storybook            # Validate 578 stories

# Storybook
npm run storybook:dev             # Start on port 61001
npm run storybook:build           # Build for production
npm run test:storybook:a11y       # WCAG 2.1 AA accessibility report

# Build
npm run build                     # Production build
```

## Examples

### Example 1: Understanding the Data Flow

```bash
# Follow the critical pipeline:
# 1. Data loading
cat src/core/services/yamlParser.ts
cat src/core/services/dataLoader.ts

# 2. Transformation
cat src/core/services/nodeTransformer.ts  # ★ MOST CRITICAL

# 3. Layout
ls src/core/layout/engines/

# 4. Rendering
cat src/core/components/GraphViewer.tsx
```

### Example 2: Adding a New Node Type

```bash
# 1. Read existing node for pattern
cat src/core/nodes/motivation/GoalNode.tsx

# 2. Create your node (follow the pattern!)
# 3. Register in node registry
cat src/core/nodes/index.ts

# 4. Update transformer (3 places)
cat src/core/services/nodeTransformer.ts

# 5. Test
npm test -- tests/unit/nodes/
npm run storybook:dev
```

### Example 3: Debugging Layout Issues

```bash
# Check layout engine implementation
cat src/core/layout/engines/DagreLayoutEngine.ts

# Check dimension calculations
grep -n "precalculateDimensions" src/core/services/nodeTransformer.ts

# Verify node dimensions exported correctly
cat src/core/nodes/motivation/GoalNode.tsx | grep "export const.*WIDTH\|HEIGHT"
```

### Example 4: Understanding State Management

```bash
# List all Zustand stores
ls src/core/stores/
ls src/apps/embedded/stores/

# Check main model store
cat src/core/stores/modelStore.ts

# See how stores are used in components
grep -r "useModelStore" src/apps/embedded/components/
```

## Quick Troubleshooting

| Symptom | Check These Files |
|---------|-------------------|
| Node not rendering | `nodeTransformer.ts` (all 3 functions), `nodes/index.ts` |
| Layout overlaps | Layout engine `calculate()`, `precalculateDimensions()` |
| Edges not connecting | Handle IDs in node component, edge source/target |
| State not updating | Zustand store actions, React component hooks |
| Tests failing | Test fixtures, mock data in `tests/fixtures/` |

## Documentation

- **Main:** `README.md`
- **Architecture:** `documentation/architecture-overview.md`
- **DR CLI Integration:** `documentation/DR_CLI_INTEGRATION_GUIDE.md`
- **YAML Models:** `documentation/YAML_MODELS.md`
- **Accessibility:** `documentation/ACCESSIBILITY.md`
- **Project Instructions:** `CLAUDE.md` (this file powers this skill)

---

*This skill was automatically generated from project architecture analysis.*
