# Accessibility Testing & Standards

This document describes the accessibility testing approach for the Documentation Robotics Viewer project using Storybook and Playwright.

## Overview

Accessibility (a11y) testing is integrated into the Storybook test suite, providing automated detection of WCAG 2.1 violations and accessibility best practices across all 578 story variants.

## Testing Strategy

### Automated A11y Testing

All stories run against [axe-core](https://github.com/dequelabs/axe-core) accessibility testing engine through Storybook's `@storybook/addon-a11y` addon.

**Test Command:**
```bash
npm run test:storybook:a11y
```

This validates:
- **WCAG 2.1 Level AA compliance** - Color contrast, heading hierarchy, form labels, etc.
- **Best practices** - Semantic HTML, ARIA usage, focus management
- **Cross-browser rendering** - DOM accessibility tree consistency

### Test Coverage

- **578 stories** across all component tiers (stateless to composite graph views)
- **16 custom React Flow nodes** - Ensure accessibility handles, semantic roles, keyboard navigation
- **Integration components** - GraphViewer, AnnotationPanel, FilterPanel, ControlPanel
- **Store-connected components** - Full context accessibility validation

## Running Accessibility Tests

### Local Development

**View accessibility issues in Storybook UI:**
```bash
npm run storybook:dev
# Navigate to any story → Accessibility panel (bottom) shows violations
```

**Generate accessibility report:**
```bash
npm run test:storybook:a11y
# Outputs accessibility audit results to console
```

### CI/CD Pipeline

The `.github/workflows/ci.yml` job `story-validation` runs accessibility tests on schedule (Mondays 4am UTC) and on manual trigger:

```yaml
- name: Run accessibility tests
  run: npm run test:storybook:a11y
```

## Accessibility Standards

### Component Requirements

All components must meet these accessibility criteria:

#### 1. **Semantic HTML**
- Use correct HTML elements (buttons, links, headings, nav, etc.)
- Use `role="article"` + `aria-label` on custom nodes
- Never use `<div role="button">` - use `<button>` instead

#### 2. **Color Contrast**
- Text: minimum 4.5:1 contrast ratio (normal text)
- UI components: minimum 3:1 contrast ratio
- Focus indicators: clearly visible on dark and light backgrounds

#### 3. **Keyboard Navigation**
- All interactive elements must be keyboard accessible
- Tab order must be logical (top-to-bottom, left-to-right)
- Focus must be visible on all focusable elements
- Escape key closes modals/dropdowns

#### 4. **ARIA Attributes**
- Use only when semantic HTML is insufficient
- `aria-label` for icon-only buttons
- `aria-labelledby` to associate labels with controls
- `aria-live` for dynamic content updates
- `role` only for custom components, never override semantics

#### 5. **Form Accessibility**
- All inputs have associated `<label>` elements
- Error messages linked to inputs via `aria-describedby`
- Required fields marked with `aria-required="true"` AND visual indicator
- Form submit buttons clearly labeled

#### 6. **Focus Management**
- Focus never hidden or moved without user action
- Focus trap in modals (Tab loops within modal)
- Focus restored when modal closes
- Skip links for long content

#### 7. **Images & Icons**
- All images have `alt` text (or `alt=""` if decorative)
- SVG icons have `aria-label` or associated text
- Background images must have text equivalent

#### 8. **Headings**
- Use `<h1>` through `<h6>` in hierarchical order
- No skipped heading levels
- Heading text clearly describes section

## Edge Component Accessibility

All edge components provide descriptive `aria-label` attributes and are keyboard accessible:

```typescript
// ✓ CORRECT - Edge with full accessibility
<path
  d={edgePath}
  stroke={color}
  strokeWidth={2}
  role="img"
  aria-label={`Connection from ${sourceNode} to ${targetNode}, relationship type: ${relationshipType}`}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  tabIndex={0}
/>

// ✓ CORRECT - Bundled edge with expand/collapse
<path
  d={edgePath}
  stroke={color}
  role="button"
  aria-label={`${count} bundled relationships. Click to expand.`}
  onClick={handleExpand}
  tabIndex={0}
/>
```

### Edge Accessibility Checklist

- ✅ **Cross-layer edges** - Include full source/target/relationship context in `aria-label`
- ✅ **Elbow edges** - Include source and target node IDs in `aria-label`
- ✅ **Bundled edges** - Describe bundled count and click-to-expand interaction
- ✅ **Keyboard navigation** - All edges support Enter/Space to activate
- ✅ **Focus indication** - Visual focus rings provide clear indication
- ✅ **Click targets** - Minimum 8px stroke width for click accessibility

## Testing Node Accessibility

React Flow nodes require specific accessibility setup:

```typescript
// ✓ CORRECT - Semantic structure with accessibility
<div
  role="article"
  aria-label={`Goal: ${data.label}`}
  style={{ /* inline styles */ }}
>
  <Handle type="target" position={Position.Top} id="top" />
  <Handle type="source" position={Position.Bottom} id="bottom" />
  <Handle type="target" position={Position.Left} id="left" />
  <Handle type="source" position={Position.Right} id="right" />
  <div>{data.label}</div>
</div>

// ✗ WRONG - Missing aria-label and role
<div style={{ /* inline styles */ }}>
  <div>{data.label}</div>
</div>
```

### Handle Accessibility

- All nodes must include 4 Handles (top, bottom, left, right)
- Handles use default styling (visible connection points)
- Handle connections are keyboard accessible in interactive views
- Handle visibility is maintained - users with visual disabilities benefit from the positioned connection points

### Node Type Coverage

All 16 custom node types are accessibility-tested:
- **Motivation Layer**: Goal, Stakeholder, Constraint, Driver, Outcome, Principle, Assumption, Assessment, ValueStream, Requirement (10 nodes)
- **Business Layer**: BusinessFunction, BusinessService, BusinessCapability, BusinessProcess (4 nodes)
- **C4 Model**: Container, Component, ExternalActor (3 nodes)
- **Utilities**: JSONSchema, LayerContainer (2 nodes)

## Story Accessibility Requirements

All stories must include:

```typescript
import type { Meta, StoryObj } from '@storybook/react';

type Story = StoryObj<typeof MyComponent>;

export default {
  title: 'ComponentName',
  component: MyComponent,
  decorators: [/* accessibility-aware decorators */]
} satisfies Meta<typeof MyComponent>;

export const Default: Story = {
  render: () => <MyComponent />
};
```

**Decorators must be accessibility-aware** - don't suppress focus rings or add invalid ARIA attributes.

## Fixing Accessibility Violations

When axe-core detects violations:

1. **Read the violation description** - Storybook addon shows the specific issue
2. **Check the DOM element** - Use DevTools to inspect the problematic element
3. **Apply the fix** - Use WCAG 2.1 guidelines to resolve
4. **Re-test locally** - `npm run storybook:dev` and check Accessibility panel
5. **Verify in CI** - Push and check that `npm run test:storybook:a11y` passes

### Common Violations & Fixes

| Violation | Cause | Fix |
|-----------|-------|-----|
| Color contrast | Text too light on light background | Darken text or lighten background |
| Missing label | Form input without associated label | Add `<label htmlFor="...">` |
| Invalid ARIA | `role` used on semantic element | Remove `role`, use semantic HTML |
| Missing alt text | Image without alt attribute | Add `alt="descriptive text"` |
| No focus indicator | Button with custom outline removed | Restore `:focus-visible` styles |

## Documentation Standards

- All public components should include accessibility notes in Storybook args docs
- Complex interactions should document keyboard shortcuts in descriptions
- Document any custom ARIA implementations with rationale

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for testing
- [WebAIM](https://webaim.org/) - Web accessibility articles and resources
- [Storybook A11y Addon](https://storybook.js.org/docs/writing-stories/import-stories-in-tests#a11y-panel)

## Automated Testing Tools

### Storybook Addon A11y

Runs axe-core on every story during development and testing, with real-time accessibility panel.

**Configuration:** `.storybook/preview.tsx`

```typescript
const preview: Preview = {
  parameters: {
    a11y: {
      // Run accessibility checks automatically
      manual: false,

      // axe-core rules configuration
      config: {
        rules: [
          {
            // Architecture visualizations may have decorative elements
            id: 'color-contrast',
            reviewOnFail: true, // Mark for manual review instead of auto-fail
          },
          {
            // React Flow uses ARIA labels
            id: 'aria-allowed-attr',
            enabled: true,
          },
          {
            // Node components use role="article"
            id: 'aria-required-children',
            enabled: true,
          },
          // ... additional rules for forms, images, keyboard navigation, headings
        ],
      },

      // Test standards to validate against
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        },
      },
    },
  },
};
```

**Features:**
- Real-time a11y panel in Storybook UI showing violations
- Color-coded severity levels (critical, serious, moderate, minor)
- Element highlighting for each violation
- Detailed remediation guidance for each issue

### Test Runner Integration

The Storybook test runner (`test-runner.ts`) includes automated accessibility validation:

**Configuration:**
```typescript
// .storybook/test-runner.ts
async preVisit(page) {
  // Inject axe-core for accessibility testing
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.0/axe.min.js',
  });
}

async postVisit(page, context) {
  // Run accessibility checks on every story
  const results = await page.evaluate(() => {
    return new Promise((resolve) => {
      window.axe?.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }, (error, results) => {
        resolve(results);
      });
    });
  });

  // Report violations with severity levels
  if (results?.violations?.length > 0) {
    // Log all violations as warnings
    console.warn(`Accessibility violations in story "${context.id}":\n${violationSummary}`);

    // Fail test for high-impact violations only
    const highImpact = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    if (highImpact.length > 0) {
      throw new Error(`Critical accessibility violations: ${highImpact.map(v => v.id).join(', ')}`);
    }
  }
}
```

**Severity Handling:**
- **Critical/Serious**: Test failures (must fix before commit)
- **Moderate**: Warnings (logged, tracked, fix recommended)
- **Minor**: Informational (documented, fix not required)

## Continuous Monitoring

- **Weekly runs**: Full a11y suite runs Monday 4am UTC
- **PR validation**: Component stories validated for new violations
- **Manual audits**: Quarterly comprehensive accessibility audits recommended
- **User feedback**: Monitor accessibility reports and user issues

## Making Updates

When updating components:

1. Run `npm run storybook:dev` and check Accessibility panel
2. Run `npm run test:storybook:a11y` to catch all violations
3. Fix violations before committing
4. Verify no regressions in dependent components

## Questions or Issues?

Refer to:
- `CLAUDE.md` - Component accessibility patterns
- `.storybook/main.cjs` - Accessibility addon configuration
- `tests/stories/storyErrorFilters.ts` - Expected error patterns
- GitHub Issues - Label: `accessibility`
