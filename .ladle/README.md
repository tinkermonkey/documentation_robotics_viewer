# Component Catalog

The component catalog is a standalone Ladle application for developing and showcasing React components from the documentation_robotics_viewer project.

## Quick Start

### Development Server

```bash
npm run catalog:dev
```

Opens the Ladle development server at `http://localhost:6006/` with hot module replacement (HMR) support.

### Production Build

```bash
npm run catalog:build
```

Builds optimized static assets to `dist/catalog/`. The output is ready for deployment to development/staging environments.

## Architecture

### Configuration Files

- **`.ladle/config.mjs`** - Main Ladle configuration
  - Specifies story glob patterns: `src/**/*.stories.tsx` and `src/**/*.stories.mdx`
  - References `vite.config.catalog.ts` for Vite setup
  - Sets default story to `shared--loading-state`

- **`.ladle/components.tsx`** - Global provider
  - Imports Tailwind CSS from `src/index.css`
  - Provides dark mode wrapper for all stories
  - Implements the `GlobalProvider` pattern

- **`vite.config.catalog.ts`** - Vite configuration
  - Reuses all 9 path aliases from the embedded app
  - Adds `@catalog` alias for catalog-specific resources
  - Optimizes dependencies: React, React DOM, React Flow

### Directory Structure

```
src/catalog/
├── providers/      # Context providers for stories
│                   # Examples: ReactFlowDecorator, MockStoreProvider
├── fixtures/       # Mock data factories
│                   # Examples: nodeDataFixtures, modelFixtures
└── decorators/     # Reusable story decorators
                    # Examples: withMargin, withDarkMode
```

## Creating Stories

Stories are colocated with their components:

```
src/core/nodes/motivation/
├── GoalNode.tsx              # Component
└── GoalNode.stories.tsx      # Stories
```

### Story Format (CSF 2 with TypeScript)

```typescript
import type { StoryDefault, Story } from "@ladle/react";
import { GoalNode } from "./GoalNode";

export default {
  title: "Nodes / Motivation / GoalNode",
  // Optional decorators and args
} satisfies StoryDefault;

export const Default: Story = () => (
  <GoalNode data={/* ... */} />
);

export const HighPriority: Story = () => (
  <GoalNode data={/* ... */} />
);
```

## Path Aliases

All project path aliases are available in stories:

- `@` - `src/`
- `@core` - `src/core/`
- `@components` - `src/core/components/`
- `@services` - `src/core/services/`
- `@stores` - `src/core/stores/`
- `@types` - `src/core/types/`
- `@nodes` - `src/core/nodes/`
- `@edges` - `src/core/edges/`
- `@layout` - `src/core/layout/`
- `@catalog` - `src/catalog/` (catalog-specific)

## Build Isolation

The catalog is completely isolated from the embedded app:

| Aspect | Embedded App | Component Catalog |
|--------|--------------|-------------------|
| Config | `vite.config.embedded.ts` | `vite.config.catalog.ts` |
| Dev Port | 3001 | 6006 |
| Output | `dist/embedded/` | `dist/catalog/` |
| Included in Release | Yes | No |

## Dependencies

The catalog supports all project dependencies:

- React 19.2.0
- TypeScript 5.9.3
- Tailwind CSS v4.1.17
- React Flow 12.9.3
- Flowbite React 0.12.13
- Zustand 5.0.8

## Resources

- **Ladle Docs**: https://ladle.dev/
- **Storybook CSF**: https://storybook.js.org/docs/react/api/csf
- **React Flow**: https://reactflow.dev/
- **Tailwind CSS**: https://tailwindcss.com/
