---
name: documentation_robotics_viewer-storybook
description: Start Storybook server and list available stories
user_invocable: true
args: [start|build|list]
generated: true
generation_timestamp: 2026-02-23T16:09:03.829988Z
generation_version: "2.0"
source_project: documentation_robotics_viewer
source_codebase_hash: 00a2f9723e9a7f64
---

# Storybook Management

Quick-reference skill for **documentation_robotics_viewer** Storybook operations.

## Usage

```bash
/documentation_robotics_viewer-storybook [start|build|list]
```

## Purpose

Manage the Storybook component documentation system for the documentation_robotics_viewer project. This skill provides quick access to:

- **Start**: Launch the Storybook dev server on port 61001 for interactive component development
- **Build**: Build static Storybook files for production deployment
- **List**: Display all 593 stories across 97 story files organized by category

**Storybook Configuration:**
- **Version:** Storybook 8.6.15
- **Format:** CSF3 (Component Story Format 3) using `Meta<typeof Component>` and `StoryObj`
- **Stories:** 593 stories across 97 story files
- **Decorators:** Custom decorators in `src/catalog/decorators/` (e.g., `withReactFlowDecorator`)
- **Test Runner:** `@storybook/test-runner` with custom error filtering via `tests/stories/storyErrorFilters.ts`
- **Accessibility:** Automated WCAG 2.1 AA testing with axe-core addon

## Implementation

### Start Storybook Server

```bash
npm run storybook:dev
```

- Launches Storybook on **http://localhost:61001**
- Hot-reload enabled for live component development
- Accessibility tab available for WCAG 2.1 AA testing
- Use `Ctrl+C` to stop the server

### Build Storybook for Production

```bash
npm run storybook:build
```

- Builds static Storybook files to `storybook-static/`
- Production-ready bundle for deployment
- Includes all 593 stories and documentation

### List All Stories

Find all story files in the project:

```bash
# List all story files by category
find src/catalog -name "*.stories.tsx" | sort

# Count stories by directory
find src/catalog -name "*.stories.tsx" | xargs dirname | sort | uniq -c

# Show story test files
ls -la tests/stories/
```

**Story Categories:**
- `src/catalog/components/` - UI component stories
- Tests organized in `tests/stories/`:
  - `architecture-nodes.spec.ts` - Custom node stories (15+ node types)
  - `architecture-edges.spec.ts` - Custom edge stories
  - `graph-views.spec.ts` - Graph visualization stories
  - `ui-components.spec.ts` - Flowbite UI component stories
  - `layout-engines.spec.ts` - Layout algorithm stories

### Run Storybook Tests

```bash
# Validate all 593 stories (smoke tests)
npm run test:storybook

# Run accessibility tests (WCAG 2.1 AA)
npm run test:storybook:a11y
```

## Examples

### Example 1: Start Storybook for Component Development

```bash
/documentation_robotics_viewer-storybook start
```

Opens Storybook at http://localhost:61001 where you can:
- Browse all 593 stories interactively
- Test components in isolation
- View accessibility reports
- Test dark mode variants
- Preview different component states

### Example 2: Build for Production Deployment

```bash
/documentation_robotics_viewer-storybook build
```

Creates production-ready static files in `storybook-static/` directory.

### Example 3: List Stories by Category

```bash
/documentation_robotics_viewer-storybook list
```

Sample output structure:
```
src/catalog/stories/
├── core-nodes/
│   ├── UnifiedNode.stories.tsx  (consolidated node variants: default, changeset, detail levels)
│   ├── FieldList.stories.tsx
│   └── LayerContainerNode.stories.tsx
├── edges/
│   ├── ElbowEdge.stories.tsx
│   └── SmartEdge.stories.tsx
├── graph/
│   ├── GraphViewer.stories.tsx
│   └── LayerGraphView.stories.tsx
└── ui/
    ├── Button.stories.tsx
    ├── Card.stories.tsx
    └── ... (Flowbite components)
```

## Story Patterns

All stories follow **CSF3 format** with strict patterns:

### Node/Edge Stories Pattern

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { withReactFlowDecorator } from '@catalog/decorators/';
import { GoalNode } from '@core/nodes/motivation/GoalNode';

const meta: Meta<typeof GoalNode> = {
  title: 'Architecture/Nodes/Motivation/Goal',
  component: GoalNode,
  decorators: [withReactFlowDecorator],
};

export default meta;
type Story = StoryObj<typeof GoalNode>;

export const Default: Story = {
  args: {
    data: {
      label: 'Increase Revenue',
      fill: '#E8F5E9',
      stroke: '#4CAF50',
    },
  },
};
```

### Graph View Stories Pattern

```typescript
import { StoryLoadedWrapper } from '@catalog/providers/StoryLoadedWrapper';

export const BusinessLayer: Story = {
  render: () => (
    <ReactFlowProvider>
      <StoryLoadedWrapper>
        <GraphViewer nodes={nodes} edges={edges} />
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  ),
};
```

## Testing Integration

Storybook stories are tested via:

1. **Smoke Tests** (`npm run test:storybook`)
   - Validates all stories load without errors
   - Custom error filtering (expected/silent, known bugs/warn, unexpected/fail)
   - Uses `@storybook/test-runner` with Playwright

2. **Accessibility Tests** (`npm run test:storybook:a11y`)
   - Automated axe-core WCAG 2.1 AA testing
   - Color contrast validation
   - Keyboard navigation checks
   - ARIA attribute verification

3. **Visual Regression** (via Chromatic or Percy - if configured)

## Key Files

- **Config:** `.storybook/main.cjs` - Storybook configuration
- **Preview:** `.storybook/preview.tsx` - Global decorators and providers
- **Manager:** `.storybook/manager.ts` - UI customization
- **Test Runner:** `.storybook/test-runner.ts` - Test runner configuration
- **Error Filters:** `tests/stories/storyErrorFilters.ts` - Custom error filtering
- **Decorators:** `src/catalog/decorators/` - Reusable decorators
- **Stories:** `src/catalog/components/` - All component stories

## Troubleshooting

### Storybook won't start
- **Check port 61001**: `lsof -i :61001` and kill conflicting processes
- **Clear cache**: `rm -rf node_modules/.cache/storybook`
- **Reinstall deps**: `npm ci`

### Stories not appearing
- Verify file naming: `*.stories.tsx` (not `.story.tsx`)
- Check story title path in `meta.title`
- Restart Storybook server

### Test failures
- Review error tier in `storyErrorFilters.ts`
- Check console for GraphViewer load state
- Verify decorators are imported correctly

---

*This skill was automatically generated from the documentation_robotics_viewer project on 2026-02-23.*
