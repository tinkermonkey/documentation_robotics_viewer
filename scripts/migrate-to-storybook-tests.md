# Storybook Test Migration Implementation Plan

## Executive Summary

This document outlines the complete migration strategy from Playwright story tests to native Storybook Test Runner play() functions. The migration has **3 phases**:

### Phase 1: Infrastructure (DONE)
- ✅ Fix Storybook configuration (main.cjs)
- ✅ Update package.json scripts
- ✅ Create testing patterns documentation
- ✅ Test Storybook dev server

### Phase 2: Critical Story Tests (IN PROGRESS)
- 🔄 ViewToggle - 3 play functions added
- 🔄 ExpandableSection - 2 play functions added
- ⏳ BreadcrumbNav - needs play functions
- ⏳ GraphToolbar - needs play functions
- ⏳ ExportButtonGroup - needs play functions

### Phase 3: Cleanup & CI (PENDING)
- ⏳ Remove Playwright story test files
- ⏳ Update CI/CD workflows
- ⏳ Remove old test infrastructure
- ⏳ Verify all tests pass

## Phase 2 Detailed Tasks

### 2.1 Basic Component Stories (5-10 components)

Priority: HIGH - These are heavily tested UI components

**Components to migrate:**
1. ViewToggle ✅ (3 tests added)
2. ExpandableSection 🔄 (2 tests added, needs refinement)
3. BreadcrumbNav (3 tests)
4. GraphToolbar (1 test)
5. ExportButtonGroup (1 test)
6. FilterPanel (2 tests)
7. AnnotationPanel (2 tests)

**Approach:**
- Each component gets 1-3 play() function variants
- Focus on: rendering, interactions, accessibility
- Use consistent patterns from STORYBOOK_TESTING_GUIDE.md

### 2.2 Architecture Component Stories (25+ stories)

Priority: MEDIUM - Nodes and edges are well-encapsulated

**Subdivisions:**
- **Nodes (13 tests)**: role="article", aria-label, handles
  - GoalNode, ContainerNode, BusinessFunctionNode, etc.
- **Edges (11 tests)**: SVG rendering, labels
  - ElbowEdge, CrossLayerEdge, InfluenceEdge, etc.

**Approach:**
- Validate SVG element presence/attributes
- Check aria-label and accessibility features
- Verify handle positioning (for nodes)

### 2.3 Complex View Stories (15+ stories)

Priority: MEDIUM - These are integration-heavy

**Components:**
- C4GraphView, MotivationGraphView, BusinessLayerView
- GraphViewer, ChangesetGraphView, SpecGraphView

**Approach:**
- Wait for React Flow nodes to render
- Verify node/edge counts
- Check zoom controls/toolbar presence
- Keep timeout generous (15s for complex graphs)

### 2.4 Chat Component Stories (14+ tests)

Priority: LOW - These work well in isolation

**Components:**
- ChatTextContent, ThinkingBlock, ToolInvocationCard
- ChatInput, ChatMessage, UsageStatsBadge

**Approach:**
- Validate content rendering
- Test expand/collapse interactions
- Verify form inputs and submissions

### 2.5 Panel Stories (10+ tests)

Priority: MEDIUM - Mix of simple and complex

**Components:**
- C4InspectorPanel, MotivationFilterPanel
- SchemaInfoPanel, NodeDetailsPanel
- ConnectionStatus, ChatPanelContainer

**Approach:**
- Test empty states
- Verify content rendering
- Check filter interactions
- Validate store-provided data

## Implementation Strategy

### Approach: Batch + Pattern-Based

Instead of migrating every story manually, use these patterns:

1. **Batch 1**: Simple rendering tests (4-5 play functions)
   - Just verify elements exist
   - Use basic `expect().toBeInTheDocument()`

2. **Batch 2**: Interaction tests (3-4 play functions)
   - Click buttons, expand sections
   - Use `userEvent.click()` + verification

3. **Batch 3**: Complex tests (2-3 play functions)
   - Async waiting, form submission
   - Use `waitFor()` for complex flows

4. **Batch 4**: Accessibility tests (1-2 play functions)
   - aria-label, role attributes
   - keyboard navigation

### Template Usage

**For simple rendering:**
```typescript
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  expect(canvas.getByText('Label')).toBeInTheDocument();
},
```

**For interaction:**
```typescript
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole('button');
  await userEvent.click(button);
  expect(canvas.getByText('Clicked')).toBeInTheDocument();
},
```

**For async:**
```typescript
play: async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await waitFor(() => {
    expect(canvas.getByText('Loaded')).toBeInTheDocument();
  }, { timeout: 15000 });
},
```

## File Changes Required

### Stories to Modify (96 total)

Priority order:
1. `/src/catalog/stories/a-primitives/navigation/ViewToggle.stories.tsx` ✅
2. `/src/catalog/stories/a-primitives/state-panels/ExpandableSection.stories.tsx` 🔄
3. `/src/catalog/stories/a-primitives/navigation/BreadcrumbNav.stories.tsx`
4. `/src/catalog/stories/a-primitives/toolbars/GraphToolbar.stories.tsx`
5. `/src/catalog/stories/a-primitives/toolbars/ExportButtonGroup.stories.tsx`
... (remaining 91 stories)

### Tests to Remove

1. `tests/stories/all-stories.spec.ts` - Auto-generated, no longer needed
2. `tests/stories/building-blocks.spec.ts` - Covered by play() functions
3. `tests/stories/architecture-nodes.spec.ts` - Covered by play() functions
4. `tests/stories/architecture-edges.spec.ts` - Covered by play() functions
5. `tests/stories/graph-views.spec.ts` - Covered by play() functions
6. `tests/stories/chat-components.spec.ts` - Covered by play() functions
7. `tests/stories/panels-inspectors.spec.ts` - Covered by play() functions
8. `tests/stories/backend-dependent.spec.ts` - Covered by play() functions
9. `tests/stories/accessibility.spec.ts` - Keep as manual tests OR migrate to play()
10. `tests/stories/storyErrorFilters.ts` - No longer needed

### Scripts to Remove

1. `scripts/generate-story-tests.cjs` - No longer needed
2. `scripts/test-stories.sh` - Replaced by `npm run test:storybook`
3. `scripts/check-port.cjs` - Storybook test runner handles this

### Config Files to Update

1. ✅ `.storybook/main.ts` → `.storybook/main.cjs` (DONE)
2. `.github/workflows/*.yml` - Update test commands
3. CI/CD pipeline - Use `npm run test:storybook` instead of Playwright

## Testing Strategy

### Pre-Removal Testing
Before removing Playwright tests, run parallel validation:

```bash
# Run Storybook dev server
npm run storybook:dev &

# In another terminal, run both:
npm run test:storybook              # New tests
npm run test:stories                # Old tests (if still available)
```

Both should pass before removal.

### Smoke Tests
After removing Playwright tests, verify:

```bash
npm run storybook:build             # Build succeeds
npm run storybook:serve &           # Server runs
npm run test:storybook              # Tests pass
```

## Rollout Plan

### Week 1
- [ ] Complete Phase 2.1 (Basic components: 5 components, 11 stories)
- [ ] Test ViewToggle, ExpandableSection, BreadcrumbNav
- [ ] Document findings

### Week 2
- [ ] Complete Phase 2.2 (Nodes & Edges: 24 stories)
- [ ] Add play() to all node and edge stories
- [ ] Verify accessibility attributes

### Week 3
- [ ] Complete Phase 2.3 (Views: 15 stories)
- [ ] Handle async/timeout edge cases
- [ ] Test complex graph rendering

### Week 4
- [ ] Complete Phase 2.4 & 2.5 (Chat & Panels: 24 stories)
- [ ] Finish remaining stories
- [ ] Complete Phase 3 cleanup

## Success Metrics

- ✅ All 96 stories have proper play() functions OR are intentionally excluded
- ✅ `npm run test:storybook` passes 100%
- ✅ No console errors from tests
- ✅ Execution time <= original Playwright tests
- ✅ All Playwright story files removed
- ✅ CI/CD pipelines updated and passing
- ✅ Test coverage maintained or improved

## Dependencies & Blockers

**None identified** - All tools are already installed:
- @storybook/react@8.6.15 ✅
- @storybook/test@8.6.15 ✅
- @storybook/test-runner@0.21.3 ✅
- @storybook/addon-interactions@8.6.15 ✅

## Rollback Plan

If major issues are discovered:

1. Keep `.storybook/main.ts.bak` for comparison
2. Maintain git history for reverting story changes
3. Keep old test files in a branch until 100% confident

## Next Steps

1. **Immediate** (this session):
   - Continue Phase 2.1 (ViewToggle, ExpandableSection, BreadcrumbNav, etc.)
   - Test play() functions locally

2. **Short-term** (next session):
   - Complete Phase 2.2 & 2.3
   - Address any timing/async issues found

3. **Medium-term** (following sessions):
   - Complete Phase 2.4 & 2.5
   - Begin Phase 3 cleanup

4. **Final**:
   - Remove all Playwright story test files
   - Update CI/CD workflows
   - Create migration completion PR

