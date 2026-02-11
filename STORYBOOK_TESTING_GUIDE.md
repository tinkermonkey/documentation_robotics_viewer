# Storybook Test Runner Migration Guide

## Phase 6: Migrate Playwright Tests to Storybook Test Runner

This guide provides patterns and best practices for migrating from Playwright-based story tests to native Storybook Test Runner using play() functions.

### Overview

**Old Approach (Playwright):**
- Separate `.spec.ts` files in `tests/stories/`
- Navigate to story URLs with Ladle
- Use Playwright selectors and wait strategies
- Console error filtering in Playwright

**New Approach (Storybook Test Runner):**
- Play() functions directly in `.stories.tsx` files
- Direct access to DOM via React Testing Library queries
- Native Storybook test assertions
- Error handling via Storybook's error boundaries

### Key Imports

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor } from '@storybook/test';
```

**Important:** `@storybook/test` provides:
- `expect()` - Jest-compatible assertions
- `within()` - Scoped DOM queries to canvas
- `userEvent` - User interaction simulation (keyboard, mouse)
- `waitFor()` - Async waiting for elements/conditions

### Test Patterns

#### 1. Basic Rendering Test

**Old (Playwright):**
```typescript
test('ViewToggle: renders toggle buttons', async ({ page }) => {
  await page.goto('/?story=primitives--controls--viewtoggle--default&mode=preview');
  await page.locator('button').first().waitFor({ state: 'attached' });
  const buttons = await page.locator('button').count();
  expect(buttons).toBeGreaterThan(0);
});
```

**New (Play Function):**
```typescript
export const Default: Story = {
  render: () => <ViewToggle views={[...]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  },
};
```

#### 2. Interaction Test (Click & Verify)

**Old (Playwright):**
```typescript
test('ViewToggle: button click works', async ({ page }) => {
  await page.goto('/?story=...');
  const buttons = page.locator('button');
  if (await buttons.count() >= 2) {
    await buttons.nth(1).click();
    const buttonsAfter = await page.locator('button').count();
    expect(buttonsAfter).toBeGreaterThan(0);
  }
});
```

**New (Play Function):**
```typescript
export const InteractionTest: Story = {
  render: () => <Component {...props} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');

    if (buttons.length >= 2) {
      await userEvent.click(buttons[1]);
      // Verify result
      const result = canvas.getByText('expected text');
      expect(result).toBeInTheDocument();
    }
  },
};
```

#### 3. Form Input Test

**Old (Playwright):**
```typescript
test('Input: accepts user typing', async ({ page }) => {
  await page.goto('/?story=...');
  const input = page.locator('input').first();
  await input.fill('test value');
  await input.press('Enter');
  expect(await page.locator('.result').innerText()).toContain('test value');
});
```

**New (Play Function):**
```typescript
export const InputTest: Story = {
  render: () => <Input {...props} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');

    await userEvent.type(input, 'test value');
    await userEvent.keyboard('{Enter}');

    const result = canvas.getByText(/test value/);
    expect(result).toBeInTheDocument();
  },
};
```

#### 4. Async/Waiting Test

**Old (Playwright):**
```typescript
test('GraphView: waits for nodes to render', async ({ page }) => {
  await page.goto('/?story=...');
  await page.locator('.react-flow__node').first().waitFor({
    state: 'attached',
    timeout: 15000,
  });
  const nodes = await page.locator('.react-flow__node').count();
  expect(nodes).toBeGreaterThan(0);
});
```

**New (Play Function):**
```typescript
export const GraphViewTest: Story = {
  render: () => <GraphViewer model={model} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for elements to appear
    await waitFor(() => {
      const nodes = canvas.queryAllByRole('article');
      expect(nodes.length).toBeGreaterThan(0);
    }, { timeout: 15000 });
  },
};
```

#### 5. Accessibility Test (a11y)

**Old (Playwright):**
```typescript
test('Component: has proper aria labels', async ({ page }) => {
  await page.goto('/?story=...');
  const element = page.locator('[role="article"]').first();
  const ariaLabel = await element.getAttribute('aria-label');
  expect(ariaLabel).toBeTruthy();
  expect(ariaLabel).toContain('expected');
});
```

**New (Play Function):**
```typescript
export const AccessibilityTest: Story = {
  render: () => <Component {...props} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const element = canvas.getByRole('article');

    const ariaLabel = element.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('expected');
  },
};
```

#### 6. Multiple Assertions Test

**Old (Playwright):**
```typescript
test('BreadcrumbNav: renders all items', async ({ page }) => {
  await page.goto('/?story=...');
  const items = page.locator('[role="listitem"]');
  const count = await items.count();
  expect(count).toBe(3);

  const first = items.first();
  expect(await first.innerText()).toBe('Home');
});
```

**New (Play Function):**
```typescript
export const BreadcrumbTest: Story = {
  render: () => <BreadcrumbNav items={[...]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const items = canvas.getAllByRole('listitem');

    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Home');
    expect(items[1]).toHaveTextContent('Docs');
  },
};
```

### DOM Query Methods

Convert Playwright selectors to React Testing Library queries:

| Playwright | React Testing Library | Notes |
|-----------|----------------------|-------|
| `page.locator('button')` | `canvas.getAllByRole('button')` | Gets all buttons |
| `page.locator('button').first()` | `canvas.getByRole('button')` or `canvas.queryByRole('button')` | Single element |
| `page.locator('[aria-label="X"]')` | `canvas.getByLabelText('X')` | By aria-label |
| `page.locator('text=X')` | `canvas.getByText('X')` | By text content |
| `page.locator('[data-testid="x"]')` | `canvas.getByTestId('x')` | By test ID |
| `page.locator('input[type="email"]')` | `canvas.getByRole('textbox', { name: 'email' })` | By role & name |

### Query Variants

```typescript
// get* - Returns element or throws error (use for assertions)
const button = canvas.getByRole('button');
expect(button).toBeInTheDocument();

// query* - Returns element or null (use for conditional checks)
const optional = canvas.queryByText('Optional Text');
if (optional) {
  // Element exists
}

// find* - Returns promise, used with await (use for async waits)
const deferred = await canvas.findByText('Eventually appears');
expect(deferred).toBeInTheDocument();
```

### User Interaction Patterns

```typescript
// Click
await userEvent.click(element);

// Type text
await userEvent.type(input, 'hello');

// Clear input
await userEvent.clear(input);

// Select option
await userEvent.selectOptions(select, 'option-value');

// Keyboard events
await userEvent.keyboard('{Enter}');
await userEvent.keyboard('{Tab}');
await userEvent.keyboard('{Shift>}A{/Shift}'); // Shift+A

// Hover
await userEvent.hover(element);

// Pointer events
await userEvent.pointer({ keys: '[MouseLeft>]', target: element });
```

### Waiting Patterns

```typescript
// Wait for element to appear
await waitFor(() => {
  expect(canvas.getByText('Loaded')).toBeInTheDocument();
});

// Wait with custom timeout
await waitFor(() => {
  expect(something).toBe(true);
}, { timeout: 5000 });

// Wait for element to be removed
await waitFor(() => {
  expect(canvas.queryByText('Loading...')).not.toBeInTheDocument();
});

// Find element (waits automatically)
const element = await canvas.findByText('Async content');
```

### Error Filtering

In Storybook Test Runner, errors are handled differently:

1. **Expected Errors**: Use `page.on('console')` equivalent or Storybook's error boundary
2. **Test Errors**: Test failures propagate normally
3. **Component Errors**: Storybook's error boundary catches them

For components that intentionally show errors (like ErrorBoundary), the test still passes if the error boundary handles it.

### Common Assertion Patterns

```typescript
// Visibility
expect(element).toBeVisible();
expect(element).toBeInTheDocument();

// Content
expect(element).toHaveTextContent('text');
expect(element).toHaveValue('value');

// Attributes
expect(element).toHaveAttribute('aria-label', 'label');
expect(element).toHaveClass('active');
expect(element).toHaveStyle('color: red');

// State
expect(element).toBeDisabled();
expect(element).toBeChecked();
expect(element).toBeFocused();

// Counts
expect(elements).toHaveLength(3);
expect(elements.length).toBeGreaterThan(0);

// Existence
expect(canvas.queryByText('X')).not.toBeInTheDocument();
```

## Migration Checklist

### For Each Story Needing Tests:

- [ ] Add imports: `import { expect, within, userEvent, waitFor } from '@storybook/test';`
- [ ] Create story variant if needed (e.g., `Interaction`, `Disabled`, `WithError`)
- [ ] Add `play` function with test logic
- [ ] Convert Playwright selectors to React Testing Library queries
- [ ] Convert `page.waitFor()` to `waitFor()` or `findBy*`
- [ ] Convert `await page.click()` to `await userEvent.click()`
- [ ] Update assertions to Storybook test syntax
- [ ] Test in Storybook dev server (`npm run storybook:dev`)
- [ ] Verify in test runner (`npm run test:storybook`)

### Test Organization:

```typescript
// Pattern for organized story with multiple tests
export const Default: Story = {
  render: () => <Component />,
  play: async ({ canvasElement }) => {
    // Basic rendering test
    const canvas = within(canvasElement);
    expect(canvas.getByText('Label')).toBeInTheDocument();
  },
};

export const Interactive: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    expect(canvas.getByText('Clicked')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  ...Default,
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    expect(button).toBeDisabled();
  },
};
```

## Running Tests

### Development
```bash
# Start Storybook server
npm run storybook:dev

# In another terminal, run test runner
npm run test:storybook
```

### Watch Mode
```bash
npm run test:storybook:watch
```

### Debug Mode
```bash
npm run test:storybook:debug
```

### Accessibility Tests
```bash
npm run test:storybook:a11y
```

## Migration Status

### Completed
- ✅ Storybook configuration fixed (main.cjs)
- ✅ Package.json test scripts updated
- ✅ ViewToggle.stories.tsx - 3 play functions added

### In Progress
- 🔄 Adding play() functions to remaining stories
- 🔄 ExpandableSection
- 🔄 BreadcrumbNav
- 🔄 GraphToolbar
- 🔄 ExportButtonGroup

### Remaining
- ⏳ Architecture Nodes (13 stories)
- ⏳ Architecture Edges (11 stories)
- ⏳ Graph Views (15 stories)
- ⏳ Chat Components (14 stories)
- ⏳ Panels & Inspectors (10 stories)
- ⏳ Backend Dependent (8 stories)
- ⏳ Accessibility Tests (3 tests)

### To Remove
- 🗑️ `tests/stories/*.spec.ts` - Playwright test files
- 🗑️ `scripts/generate-story-tests.cjs` - Auto-generation script
- 🗑️ `playwright.refinement.config.ts` - Ladle test config
- 🗑️ `.storybook/main.ts` - Old TS config

## Files Modified

- ✅ `/workspace/package.json` - Updated test scripts
- ✅ `/workspace/.storybook/main.cjs` - Converted to CommonJS
- ✅ `/workspace/src/catalog/stories/a-primitives/navigation/ViewToggle.stories.tsx` - Added play functions
- 📝 `/workspace/STORYBOOK_TESTING_GUIDE.md` - This guide

## References

- [Storybook Testing Documentation](https://storybook.js.org/docs/writing-tests)
- [Storybook Test API](https://storybook.js.org/docs/writing-tests/test-runner)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [UserEvent API](https://testing-library.com/docs/user-event/intro/)
