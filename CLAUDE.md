# Claude Code Development Guide

## Project Overview

React-based visualization tool for multi-layer architecture documentation models using React Flow (@xyflow/react).

**Tech Stack:** React 19 + TypeScript, @xyflow/react 12.9, Vite, Playwright 1.57, Flowbite React, Tailwind CSS v4, TanStack Router, Zustand 5

**Architecture Layers:** Motivation, Business, Security, Application, Technology, API, DataModel, UX, Navigation, APM

## Development Principles

1. **Read first, always** - NEVER modify code you haven't read
2. **Edit, don't create** - ALWAYS prefer editing existing files over creating new ones
3. **Follow established patterns** - Look at similar implementations before starting
4. **Use TypeScript strictly** - All files must be strongly typed
5. **Test thoroughly** - Run `npm test` before completing tasks
6. **Avoid over-engineering** - Only make requested changes, don't add unrequested features/comments/refactoring

## Component Organization

```
src/
├── core/                    # Reusable, framework-agnostic
│   ├── nodes/              # Custom React Flow nodes (business/, motivation/, c4/)
│   ├── edges/              # Custom React Flow edge types
│   ├── components/         # GraphViewer, base UI (base/BaseInspectorPanel, BaseControlPanel, GraphViewSidebar)
│   ├── layout/             # Layout engines (engines/, business/, verticalLayerLayout, edgeBundling)
│   ├── services/           # Data transformation (nodeTransformer, dataLoader, yamlParser, etc.)
│   ├── stores/             # Global state (modelStore, layerStore, elementStore, crossLayerStore, layoutPreferencesStore)
│   ├── hooks/              # Shared hooks
│   └── types/              # Core types (model.ts, reactflow.ts, shapes.ts, layers.ts)
├── apps/embedded/          # Standalone embedded app
│   ├── routes/             # TanStack Router route components
│   ├── components/         # shared/, common/, businessLayer/, chat/
│   ├── services/           # App-specific graph builders
│   ├── stores/             # annotationStore, authStore, businessLayerStore, changesetStore, chatStore, connectionStore, floatingChatStore, viewPreferenceStore
│   ├── hooks/, types/, utils/
├── catalog/                # Storybook catalog (components/, fixtures/, providers/)
└── theme/                  # Tailwind CSS theming
```

**Architecture Rules:**
- **Core**: NO route/store dependencies. Import only types and services
- **App components**: Can use route context, embedded stores, app-specific hooks
- **Services**: Stateless; accept data as parameters
- **Stores**: Zustand only (NO React context). Separate stores by concern
- **Types**: Colocate with features; export from `index.ts`

## Styling Rules

1. **ALWAYS use Tailwind utilities** - NO new CSS modules (except node inline styles)
2. **ALWAYS use Flowbite components** - Card, Badge, Button, Modal, etc.
3. **NEVER use dot notation** - `List.Item` -> `ListItem`
4. **ALWAYS add dark mode variants** - `dark:bg-gray-800`, `dark:text-white`
5. **ALWAYS add data-testid** - For E2E tests on app components

## Embedded App Layout

All routes use `SharedLayout` with 3-column pattern:
- **Left Sidebar** (collapsible): Layers, filters, navigation
- **Main Content**: Graph/JSON/List views with ViewToggle
- **Right Sidebar** (collapsible): `GraphViewSidebar` with filterPanel, controlPanel, inspectorContent, annotationPanel props

Section order: Inspector (if visible), Filters, Controls, Annotations (if provided).

## Generic Arrow Components

Use `<T extends unknown>` for generic arrow function components in JSX to avoid type inference issues.

## Testing

### Commands
```bash
npm test                          # Unit/integration tests (1170 tests, ~10s)
npm test -- tests/unit/foo.spec.ts  # Single file
npm run test:e2e                  # E2E with DR CLI server
npm run test:e2e:headed           # E2E with visible browser
npm run storybook:dev             # Start Storybook on port 61001
npm run storybook:build           # Build Storybook for production
npm run test:storybook            # Validate all stories (578 stories across 97 files)
npm run test:storybook:a11y       # Generate accessibility report for all stories
```

### Test Organization
```
tests/
├── unit/           # Services, utilities, nodes, hooks, layout engines, stores
├── integration/    # Cross-component data flow
├── stories/        # Story validation & error filters
├── helpers/        # Test utilities and factories
├── fixtures/       # Test data
└── *.spec.ts       # E2E tests (embedded-*, c4-*, etc.)

.storybook/
├── main.cjs        # Storybook configuration
├── preview.tsx     # Global decorators and providers
├── manager.ts      # UI customization
└── test-runner.ts  # Test runner configuration
```

### Key Test Patterns

- **Framework**: All tests use Playwright test runner (`import { test, expect } from '@playwright/test'`)
- **Unit tests**: Arrange-Act-Assert, one assertion per test, mock external deps
- **E2E tests**: Wait for specific selectors (not timeouts), check console errors, validate actual rendering (node counts)
- **Stories**: Create `.stories.tsx` alongside components using CSF3 format (`Meta<typeof Component>`, `StoryObj`)
  - Import decorators from `@catalog/decorators/`
  - Use `@storybook/react`
  - Run `npm run storybook:dev` to preview stories
- **Storybook Tests**: Use `test-runner.ts` for custom error filtering via `storyErrorFilters.ts`

## Key Files

**Core Pipeline:** `nodeTransformer.ts` -> layout engines -> `GraphViewer.tsx`
**Data Loading:** `dataLoader.ts` -> `yamlParser.ts` / `jsonSchemaParser.ts` -> `crossLayerReferenceExtractor.ts`
**Layout Engines:** `src/core/layout/engines/` (Dagre, ELK, D3Force, Graphviz) + `src/core/layout/business/` (Hierarchical, Swimlane, Matrix, ForceDirected)
**Base UI:** `src/core/components/base/` (BaseInspectorPanel, BaseControlPanel, GraphViewSidebar, RenderPropErrorBoundary)
**Embedded Layout:** `EmbeddedLayout.tsx` -> `SharedLayout.tsx` -> route components

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Node not rendering | Type not mapped in `getNodeTypeForElement()` | Check `nodeTransformer.ts` case statement |
| Node not rendering | Node not in `nodeTypes` export | Check `src/core/nodes/index.ts` |
| Node not rendering | Dimension mismatch | Ensure style uses exported constants |
| Layout overlaps | Bounds calculation wrong | Check layout engine `calculate()` |
| Edges not connecting | Missing/wrong Handle IDs | Verify Handle `id` matches edge definitions |
| Tests failing | Model data changed | Update test fixtures/mocks |

## Accessibility Standards (WCAG 2.1 AA)

All components must meet **WCAG 2.1 Level AA** compliance. Automated testing via Storybook a11y addon in all stories.

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must be logical (top-to-bottom, left-to-right)
- Escape key closes modals/overlays
- Focus must be visible on all focusable elements

### Testing

Run accessibility tests locally:

```bash
npm run storybook:dev
# Open Storybook → any story → Accessibility tab (bottom)

npm run test:storybook:a11y
# Runs automated axe-core tests against all stories
```

For details: `documentation/ACCESSIBILITY.md`


## DR Slash Commands

- `/dr-model <request>` - Add/update/query architecture model elements
- `/dr-validate` - Validate DR model schema and references
- `/dr-changeset <request>` - Manage isolated architecture changes
- `/dr-init [name]` - Initialize new DR architecture model
- `/dr-ingest <path>` - Generate DR model from existing codebase

## Documentation: DR CLI Integration

**Status:** Complete (February 2026)

### Documentation Files

1. **Main README.md**
   - DR CLI Server section with API endpoint details
   - System architecture diagram
   - Technology stack documentation
   - Troubleshooting section

2. **New Documentation Files**
   - `documentation/DR_CLI_INTEGRATION_GUIDE.md` - Comprehensive integration guide (400+ lines)
     - Architecture overview with system diagram
     - Complete REST API reference with examples
     - WebSocket JSON-RPC 2.0 protocol documentation
     - Authentication implementation guide
     - Development workflow documentation
     - Detailed troubleshooting section
   - `documentation/DR_CLI_TROUBLESHOOTING.md` - Standalone troubleshooting guide

3. **Documentation Structure**
   - Cross-referenced guides from README.md
   - Linked troubleshooting docs from multiple entry points
   - Maintained consistency across all documentation

### Content Areas

- **API Documentation**: Complete REST endpoint reference with request/response examples
- **WebSocket Protocol**: Detailed JSON-RPC 2.0 message format documentation
- **Authentication**: Token-based auth implementation and troubleshooting
- **Development Workflow**: Step-by-step guide for local model development
- **Troubleshooting**: Common issues with solutions

### Documentation Navigation

- **Getting Started**: See [README.md](README.md#getting-started)
- **Setup Issues**: See [README.md](README.md#troubleshooting) (Quick Reference)
- **Detailed API**: See [DR CLI Integration Guide](../documentation/DR_CLI_INTEGRATION_GUIDE.md)
- **Complex Troubleshooting**: See [DR CLI Integration Guide - Troubleshooting](../documentation/DR_CLI_INTEGRATION_GUIDE.md#troubleshooting)

### Related Documentation

- **YAML_MODELS.md**: Model format specification
- **WEBSOCKET_JSONRPC_IMPLEMENTATION.md**: WebSocket protocol details
- **architecture-overview.md**: System design and components
- **ACCESSIBILITY.md**: WCAG 2.1 AA compliance guidelines

---

<!-- generated-agents-section -->

## Specialized Sub-Agents

Specialized sub-agents are available via the `Task` tool. Use them instead of working from general knowledge — they have deep project-specific context.

| Agent | When to use |
|---|---|
| `documentation_robotics_viewer-architect` | Complex architectural reasoning needed for Core/App separation, 15+ node types, 4 layout engines, and MetaModel transformation pipeline |
| `documentation_robotics_viewer-guardian` | Critical for preventing boundary violations (Core importing App), React Flow node pattern violations, missing accessibility, and Tailwind antipatterns |
| `documentation_robotics_viewer-tester` | Project has comprehensive test suite requiring dedicated testing expertise for Playwright, Storybook, and axe-core accessibility validation |
| `documentation_robotics_viewer-deployer` | Dockerfile |
| `documentation_robotics_viewer-api-expert` | OpenAPI integration with automated TypeScript generation and DR CLI server WebSocket communication requires API-specific knowledge |
| `documentation_robotics_viewer-flow-expert` | Critical for 15+ custom node types with complex requirements: dimension constants, 4 handles, inline styles, nodeTransformer registration, and 4 layout engine integration |
| `documentation_robotics_viewer-state-expert` | All state managed via Zustand (NO Redux/Context), with 8+ stores (modelStore, layerStore, elementStore, etc |

```
Task(subagent_type="documentation_robotics_viewer-architect", prompt="<your question about Expert in layered architecture, React Flow patterns, and data pipeline design>")
Task(subagent_type="documentation_robotics_viewer-guardian", prompt="<your question about Enforces architectural boundaries and catches antipatterns in code reviews>")
```

## Skills

| Skill | What it does |
|---|---|
| `/documentation_robotics_viewer-architecture` | Display architectural overview and critical file locations |
| `/documentation_robotics_viewer-test` | Run Playwright tests and Storybook validation |
| `/documentation_robotics_viewer-build` | Run Vite build and check bundle size |
| `/documentation_robotics_viewer-storybook` | Start Storybook server and list available stories |
| `/documentation_robotics_viewer-api-sync` | Sync OpenAPI specs and generate TypeScript types |
| `/documentation_robotics_viewer-patterns` | Show coding patterns for React Flow nodes, Zustand, and Tailwind |
| `/documentation_robotics_viewer-deploy` | Build Docker image and run deployment checks |

<!-- /generated-agents-section -->
