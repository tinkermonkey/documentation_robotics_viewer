# Ladle Story Validation Tests

This directory contains automated tests for validating all Ladle stories in the component catalog.

## Overview

We have two approaches for testing Ladle stories:

### 1. Individual Test Per Story (Recommended)

**File:** `tests/stories/all-stories.spec.ts`

This is an auto-generated file containing 481 individual Playwright tests - one per story. Each test:
- Loads the story in isolation
- Checks for console errors
- Verifies no uncaught exceptions
- Ensures no React error boundaries are triggered

**Benefits:**
- ✅ Each story is tested independently
- ✅ Failures are isolated and easy to identify
- ✅ Tests run in parallel for faster execution
- ✅ Playwright UI shows individual story status

**Generation:**
```bash
# Regenerate tests when stories are added/modified
npm run test:stories:generate
```

**Running:**
```bash
# Run all story tests (auto-starts Ladle server)
npm run test:stories

# Run with Playwright UI (auto-starts Ladle server)
npm run test:stories:ui

# Run a specific story test (start Ladle manually first)
npm run catalog:dev  # In terminal 1
npx playwright test -g "Panels / Annotationpanel / Empty" --config=playwright.refinement.config.ts  # In terminal 2
```

The `npm run test:stories` command automatically:
- ✅ Checks if Ladle server is running
- ✅ Starts Ladle if needed
- ✅ Waits for server to be ready
- ✅ Runs all tests
- ✅ Cleans up the server afterwards

**Manual server control (optional):**
```bash
# Run tests against manually-started server
npm run catalog:dev  # Terminal 1
npm run test:stories:manual  # Terminal 2
```

### 2. Batch Validation (Alternative)

**File:** `tests/ladle-story-validation.spec.ts`

A single test that loops through all stories and validates them sequentially.

**Benefits:**
- ✅ Generates a summary report
- ✅ Good for CI/CD quick validation
- ✅ Easier to see overall pass/fail stats

**Running:**
```bash
npm run test:ladle-validation
```

## Prerequisites

Before running the tests, make sure Ladle is running:

```bash
# Terminal 1: Start Ladle server
npm run catalog:dev

# Terminal 2: Run tests
npm run test:stories
```

## Test Configuration

Tests use the refinement configuration (`playwright.refinement.config.ts`):
- **Base URL:** http://localhost:6006 (Ladle)
- **Timeout:** 30 seconds per story
- **Mode:** Parallel execution
- **Browser:** Chromium (Desktop Chrome)

## Validation Checks

Each story is validated against:

1. **HTTP Response:** Story loads successfully (200 status)
2. **Console Errors:** No JavaScript errors in console
   - Filters out known warnings (React DevTools, prop warnings)
3. **Page Errors:** No uncaught exceptions
4. **Error Boundaries:** No React error boundaries triggered
5. **Rendering:** Story renders without crashes

## Continuous Integration

### Update Story Tests

When you add, remove, or modify stories:

```bash
# 1. Start Ladle
npm run catalog:dev

# 2. Generate new test file
npm run test:stories:generate

# 3. Commit the updated test file
git add tests/stories/all-stories.spec.ts
git commit -m "Update story validation tests"
```

### CI Pipeline

Add to your CI workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Start Ladle
  run: npm run catalog:dev &

- name: Wait for Ladle
  run: npx wait-on http://localhost:6006

- name: Run story validation
  run: npm run test:stories
```

## Debugging Failed Tests

### Using Playwright UI

```bash
npm run test:stories:ui
```

This opens Playwright's interactive UI where you can:
- See which stories failed
- Click on a test to see the error
- Step through the test execution
- See screenshots and traces

### Running a Single Story

```bash
# Use the full test name
npx playwright test -g "Components / GraphToolbar / Default" --config=playwright.refinement.config.ts

# Or use a partial match
npx playwright test -g "GraphToolbar" --config=playwright.refinement.config.ts
```

### Viewing Test Reports

After running tests:

```bash
npx playwright show-report playwright-report/refinement
```

## File Structure

```
tests/
├── ladle-story-validation.spec.ts    # Batch validation (single test)
└── stories/
    └── all-stories.spec.ts           # Individual tests (auto-generated)

scripts/
└── generate-story-tests.cjs          # Generator script
```

## Common Issues

### Ladle Not Running

**Error:** `Failed to fetch meta.json`

**Solution:**
```bash
npm run catalog:dev
```

### Story Fails Due to Mock Data

Some stories may require mock data or store initialization. Update the story file to include necessary providers:

```tsx
export const MyStory: Story = () => (
  <StoreProvider>
    <MyComponent />
  </StoreProvider>
);
```

### Console Warnings

The tests filter out common React warnings. If you need to adjust the filter, edit the `validateStory` function in:
- `tests/stories/all-stories.spec.ts` (after regenerating)
- `scripts/generate-story-tests.cjs` (before generating)

## Statistics

- **Total Stories:** 481
- **Test Files:** 2 (1 auto-generated, 1 manual)
- **Execution Mode:** Parallel
- **Average Runtime:** ~2-5 minutes (all stories)

## Best Practices

1. **Run story tests before committing** - Catch issues early
2. **Regenerate after adding stories** - Keep tests in sync
3. **Use Playwright UI for debugging** - Visual feedback is invaluable
4. **Keep stories simple** - Easier to test and maintain
5. **Add test IDs when needed** - Use `data-testid` for complex validations

## Related Scripts

```json
{
  "test:stories:generate": "Generate test file from current stories",
  "test:stories": "Run all story validation tests",
  "test:stories:ui": "Run tests in Playwright UI",
  "test:ladle-validation": "Run batch validation test",
  "catalog:dev": "Start Ladle server for testing"
}
```

## Examples

### Example: Running Specific Category

```bash
# Run all Node stories
npx playwright test -g "Nodes /" --config=playwright.refinement.config.ts

# Run all Panel stories
npx playwright test -g "Panels /" --config=playwright.refinement.config.ts
```

### Example: CI Script

```bash
#!/bin/bash
set -e

echo "Starting Ladle..."
npm run catalog:dev &
LADLE_PID=$!

echo "Waiting for Ladle to be ready..."
npx wait-on http://localhost:6006

echo "Running story validation..."
npm run test:stories

echo "Stopping Ladle..."
kill $LADLE_PID

echo "✅ All stories validated successfully!"
```

## Contributing

When adding new stories:
1. Create your story file following Ladle conventions
2. Test it locally: `npm run catalog:dev`
3. Regenerate tests: `npm run test:stories:generate`
4. Run validation: `npm run test:stories`
5. Commit both story and test files

---

For more information:
- [Ladle Documentation](https://ladle.dev)
- [Playwright Documentation](https://playwright.dev)
- [Project Testing Guide](../README.md)
