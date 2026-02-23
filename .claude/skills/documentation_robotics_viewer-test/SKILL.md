---
name: documentation_robotics_viewer-test
description: Run Playwright tests and Storybook validation
user_invocable: true
args: [unit|integration|e2e|storybook|accessibility]
generated: true
generation_timestamp: 2026-02-23T16:06:55.291009Z
generation_version: "2.0"
source_project: documentation_robotics_viewer
source_codebase_hash: 00a2f9723e9a7f64
---

# Documentation Robotics Viewer Test Runner

Quick-reference skill for running **Playwright tests** and **Storybook validation** in the documentation_robotics_viewer project.

## Usage

```bash
/documentation_robotics_viewer-test [unit|integration|e2e|storybook|accessibility]
```

## Purpose

Executes the comprehensive test suite for the React Flow-based architecture visualization tool. The project uses **Playwright 1.57.0** as the test framework across all test types:

- **1170 unit/integration tests** across 70 spec files (~10s runtime)
- **578 Storybook stories** across 97 story files
- **E2E tests** for embedded app, C4 diagrams, and DR CLI integration
- **Automated WCAG 2.1 AA accessibility testing** via Storybook a11y addon

## Implementation

### Unit Tests (Default)
```bash
npm test
```
- Runs all tests in `tests/unit/` and `tests/integration/`
- Tests services, utilities, nodes, hooks, layout engines, stores
- ~1170 tests complete in ~10 seconds
- Uses Playwright test runner (`@playwright/test`)

**Run specific file:**
```bash
npm test -- tests/unit/services/nodeTransformer.spec.ts
```

### Integration Tests
```bash
npm test -- tests/integration/
```
- Cross-component data flow validation
- Tests full pipeline: YAML → Parsers → ModelStore → NodeTransformer → GraphViewer
- Validates React Flow node rendering and layout engines

### E2E Tests
```bash
npm run test:e2e              # Headless mode (CI/CD)
npm run test:e2e:headed       # Visible browser (debugging)
```
- Requires DR CLI server running (`npm run server:dev`)
- Tests: `embedded-*.spec.ts`, `c4-*.spec.ts`
- Validates WebSocket JSON-RPC 2.0 protocol
- Checks actual node counts and console errors

### Storybook Validation
```bash
npm run test:storybook
```
- Validates all 578 stories render without errors
- Custom error filtering via `tests/stories/storyErrorFilters.ts`
- Three-tier filtering: expected/silent, known bugs/warn, unexpected/fail
- Story tests organized by category:
  - `tests/stories/architecture-nodes.spec.ts` - Node components
  - `tests/stories/architecture-edges.spec.ts` - Edge components
  - `tests/stories/graph-views.spec.ts` - Graph visualizations

**Start Storybook dev server:**
```bash
npm run storybook:dev
```
- Runs on port 61001
- Includes accessibility panel for manual WCAG review

### Accessibility Testing
```bash
npm run test:storybook:a11y
```
- Automated axe-core testing against all 578 stories
- Validates WCAG 2.1 Level AA compliance
- Checks color contrast (4.5:1 text, 3:1 UI)
- Verifies keyboard navigation and ARIA labels
- Generates accessibility report

**Manual review in Storybook:**
1. `npm run storybook:dev`
2. Open any story
3. Click "Accessibility" tab (bottom panel)
4. Review violations and warnings

## Examples

### Run all tests before committing
```bash
/documentation_robotics_viewer-test unit
```
Executes: `npm test` (1170 tests, ~10s)

### Debug failing E2E test
```bash
/documentation_robotics_viewer-test e2e
```
Executes: `npm run test:e2e:headed` (visible browser for debugging)

### Validate Storybook stories
```bash
/documentation_robotics_viewer-test storybook
```
Executes: `npm run test:storybook` (578 stories across 97 files)

### Check accessibility compliance
```bash
/documentation_robotics_viewer-test accessibility
```
Executes: `npm run test:storybook:a11y` (WCAG 2.1 AA validation)

### Run specific test file
After skill completes, you can drill down:
```bash
npm test -- tests/unit/nodes/BusinessFunctionNode.spec.ts
```

## Test Organization

```
tests/
├── unit/              # Services, utilities, nodes, hooks, layout engines, stores
├── integration/       # Cross-component data flow (parsers → stores → transformers)
├── stories/           # Story validation (architecture-nodes, architecture-edges, etc.)
├── helpers/           # Test utilities and factories
├── fixtures/          # Test data (YAML models, JSON schemas)
└── *.spec.ts          # E2E tests (embedded-graph.spec.ts, c4-diagram.spec.ts)

.storybook/
├── main.cjs           # Storybook configuration
├── preview.tsx        # Global decorators and providers
├── manager.ts         # UI customization
└── test-runner.ts     # Test runner with custom error filtering
```

## Common Patterns

**All tests use Playwright:**
```typescript
import { test, expect } from '@playwright/test';
```

**Graph stories use StoryLoadedWrapper:**
```typescript
<StoryLoadedWrapper>
  <GraphViewer {...props} />
</StoryLoadedWrapper>
```
Signals completion via `data-storyloaded="true"`

**Node/Edge stories use decorator:**
```typescript
export default {
  decorators: [withReactFlowDecorator],
} satisfies Meta<typeof YourNode>;
```

## Troubleshooting

**Pre-commit checks flaky:**
- `tests/unit/preCommitChecks.spec.ts` has /tmp file race conditions
- Known issue in parallel execution

**E2E tests fail "Connection refused":**
- Ensure DR CLI server is running: `npm run server:dev`
- Check WebSocket connection on port configured in `.env`

**Storybook stories fail to load:**
- Clear Storybook cache: `rm -rf node_modules/.cache/storybook`
- Rebuild: `npm run storybook:build`

**Accessibility violations:**
- Review `documentation/ACCESSIBILITY.md` for WCAG 2.1 AA requirements
- Use `reviewOnFail: true` for architecture visualizations (color contrast)

---

*This skill was automatically generated from the documentation_robotics_viewer codebase.*
