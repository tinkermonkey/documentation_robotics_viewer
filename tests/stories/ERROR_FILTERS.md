# Story Test Error Filters

## Purpose

Story tests validate that components render without unexpected errors. Some console messages are expected in test environments and should not cause test failures.

This document describes the **specific regex patterns** used to filter expected errors. Only errors matching these patterns will be allowed. All other errors will cause test failures.

**CRITICAL RULE**: All filters use **specific regex patterns**, never broad substring matching. This prevents accidentally hiding real bugs.

## Active Filters

### 1. React DevTools Installation Prompt
**Pattern**: `/Download the React DevTools/`
**Reason**: Browser console message when React DevTools extension is not installed. Informational only, not a real error.
**Status**: Expected in development environment

### 2. DataLoader Backend Connection Failure
**Pattern**: `/ECONNREFUSED.*localhost:3002/`
**Reason**: Connection refused when DataLoader backend service is not running on port 3002. Stories render with mock or local data.
**Status**: Expected when running tests without full backend stack

### 3. Model Loading Failure
**Pattern**: `/\[DataLoader\] Failed to fetch model/`
**Reason**: Expected error when model data cannot be loaded from API. Components handle gracefully with default state.
**Status**: Expected in test environment without configured data source

### 4. React Prop Validation
**Pattern**: `/React does not recognize.*prop/`
**Reason**: Warning about unknown props passed to DOM elements. Components still function correctly.
**Status**: Expected with third-party or legacy components

### 5. SVG Path Attribute Errors
**Pattern**: `/Invalid value for <.*> attribute/` and `/<path> attribute d: Expected number/`
**Reason**: SVG rendering errors during dynamic path generation or attribute validation. Does not prevent rendering.
**Status**: Expected during graph visualization with variable/calculated dimensions

### 6. SVG ViewBox Errors
**Pattern**: `/<svg> attribute viewBox: Expected number/`
**Reason**: SVG container attribute errors during layout calculation. Non-blocking rendering issue.
**Status**: Expected during graph initialization

### 7. Unrecognized HTML Tags
**Pattern**: `/The tag <.*> is unrecognized in this browser/`
**Reason**: Browser warning about custom or dynamic HTML elements. Does not prevent functionality.
**Status**: Expected with web components or dynamic element generation

### 8. React Flow Node Connection Errors
**Pattern**: `/source\/target node/` and `/source\/target handle/`
**Reason**: React Flow internal warnings about missing connection points during graph building. Non-critical during edge creation.
**Status**: Expected during dynamic graph construction

### 9. WebSocket Connection Failures
**Pattern**: `/WebSocket connection to .* failed/` and `/\[WebSocket\]/`
**Reason**: WebSocket connection failures when backend services unavailable. App has fallback mechanisms.
**Status**: Expected in isolated test environment without running services

### 10. EmbeddedLayout Component Errors
**Pattern**: `/\[EmbeddedLayout\]/`
**Reason**: Component-level warnings during EmbeddedLayout initialization or property resolution.
**Status**: Expected component warnings in test environment

### 11. Model Loading Route Errors
**Pattern**: `/\[ModelRoute\] Error loading model/`
**Reason**: Route-level error when model cannot be loaded. Component has error handling.
**Status**: Expected when model endpoint not available

### 12. Failed Resource Loads
**Pattern**: `/Failed to load resource/`
**Reason**: Browser resource load failures when external resources unavailable in test environment.
**Status**: Expected when running tests in isolation

### 13. React Warning Messages
**Pattern**: `/^Warning: /` (prefix match only)
**Reason**: React development warnings about deprecations, performance, or property issues.
**Status**: Expected React warnings during component development

## Adding New Filters

When you encounter a legitimate expected error:

1. **Verify it's truly expected**:
   - Confirm the error is not a bug in your component
   - Check if the error is environment-specific (test vs production)
   - Verify the error doesn't prevent the component from functioning

2. **Add specific regex pattern** (NOT substring matching):
   - Edit `tests/stories/storyErrorFilters.ts`
   - Add new regex pattern to `isExpectedConsoleError()`
   - Use `/pattern/` format with anchors where needed
   - **AVOID**: `text.includes('error')` (too broad)
   - **PREFER**: `/specific error code \d+/` (precise match)

3. **Document the filter in this file**:
   - Add new section with pattern, reason, and status
   - Include specific error examples it matches
   - Explain why it's expected in tests

4. **Add unit tests**:
   - Add tests to `tests/unit/storyErrorFilters.spec.ts`
   - Test that it matches intended error (positive case)
   - Test that it doesn't match similar but different errors (negative case)
   - Test edge cases and variations

5. **Run tests to verify**:
   ```bash
   npm test -- tests/unit/storyErrorFilters.spec.ts  # Verify filter logic
   npm run test:stories:generate                     # Regenerate story tests
   npm run test:stories                              # Run all story validations
   ```

### Example: Adding a New Filter

If you need to filter "Library XYZ initialization" error:

```typescript
// In tests/stories/storyErrorFilters.ts, add new pattern:
export function isExpectedConsoleError(text: string): boolean {
  // ... existing patterns ...

  // NEW FILTER - Library XYZ initialization warnings
  if (/\[LibraryXYZ\] Initialization complete/.test(text)) return true;

  return false;
}
```

Then update this file with the new section:
```markdown
### 14. LibraryXYZ Initialization
**Pattern**: `/\[LibraryXYZ\] Initialization complete/`
**Reason**: Expected startup message from LibraryXYZ during component mounting.
**Status**: Expected during library initialization
```

Then add unit tests:
```typescript
test.describe('LibraryXYZ Initialization Filter', () => {
  test('should match initialization message', () => {
    expect(isExpectedConsoleError('[LibraryXYZ] Initialization complete')).toBe(true);
  });

  test('should NOT match other library messages', () => {
    expect(isExpectedConsoleError('[LibraryXYZ] Error during initialization')).toBe(false);
  });
});
```

## Filter Implementation

All filters are implemented in `tests/stories/storyErrorFilters.ts`:
- Used by `tests/stories/all-stories.spec.ts` to validate story rendering
- Tested by `tests/unit/storyErrorFilters.spec.ts` for accuracy
- Documented in this file with patterns, rationale, and examples

## Filter Specificity Rules

**✅ DO:**
- Use precise regex patterns: `/\[specific\] error pattern/`
- Match specific error codes: `/error code \d{3}/`
- Use anchors for critical patterns: `/^Critical error:/`
- Combine with context: `/WebSocket connection to .* failed/`

**❌ DON'T:**
- Broad substring matching: `text.includes('error')` ❌
- Generic prefixes: `text.includes('Warning:')` ❌ (must be prefix only: `/^Warning: /`)
- Status codes without context: `text.includes('500')` ❌
- Library names alone: `text.includes('WebSocket')` ❌ (must be specific: `/WebSocket connection.*failed/`)

## Testing Filter Changes

After modifying filters, always verify:

```bash
# Run unit tests for the filter logic
npm test -- tests/unit/storyErrorFilters.spec.ts

# Regenerate story tests based on updated filters
npm run test:stories:generate

# Run all story validation tests
npm run test:stories
```

This ensures:
1. Filter unit tests pass for new/modified patterns
2. No unexpected test failures from filter changes
3. Story tests are synchronized with filter updates
4. New filters don't accidentally hide real errors

## CI/CD Integration

Error filters are validated as part of the CI pipeline:
1. Story tests are regenerated before running (`npm run test:stories:generate`)
2. Git diff is checked to ensure tests are up to date
3. All story validation tests are run with 30-second timeout
4. Any new unexpected errors fail the build

See `.github/workflows/ci.yml` for implementation details.
