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
**Pattern**: `/^Warning: React does not recognize the `[\w-]+` prop/`
**Reason**: Warning about unknown props passed to DOM elements. Components still function correctly.
**Status**: Expected with third-party or legacy components

### 5. SVG Path Attribute Errors
**Pattern**: `/Invalid value for <[\w-]+> attribute/` and `/<path> attribute d: Expected number/`
**Reason**: SVG rendering errors during dynamic path generation or attribute validation. Does not prevent rendering.
**Status**: Expected during graph visualization with variable/calculated dimensions

### 6. SVG ViewBox Errors
**Pattern**: `/<svg> attribute viewBox: Expected number/`
**Reason**: SVG container attribute errors during layout calculation. Non-blocking rendering issue.
**Status**: Expected during graph initialization

### 7. Unrecognized HTML Tags
**Pattern**: `/^The tag <[\w-]+> is unrecognized/`
**Reason**: Browser warning about custom or dynamic HTML elements. Does not prevent functionality.
**Status**: Expected with web components or dynamic element generation

### 8. React Flow Node Connection Errors
**Pattern**: `/source\/target (?:node|handle).*(?:not found|with id)/`
**Reason**: React Flow internal warnings about missing connection points during graph building. Non-critical during edge creation.
**Status**: Expected during dynamic graph construction

### 9. WebSocket Connection Failures
**Pattern**: `/WebSocket connection to ws:\/\/(localhost|127\.0\.0\.1):[0-9]+ failed/`
**Reason**: WebSocket connection failures when backend services unavailable (localhost only, not production). App has fallback mechanisms.
**Status**: Expected in isolated test environment without running services

### 10. EmbeddedLayout Component Errors
**Pattern**: `/\[EmbeddedLayout\] (?:No container|Missing required|Layout calculation)/`
**Reason**: Component-level warnings during EmbeddedLayout initialization or property resolution.
**Status**: Expected component warnings in test environment

### 11. Model Loading Route Errors
**Pattern**: `/\[ModelRoute\] Error loading model/`
**Reason**: Route-level error when model cannot be loaded. Component has error handling.
**Status**: Expected when model endpoint not available

### 12. Failed Resource Loads
**Pattern**: `/Failed to load resource.*localhost:(3002|8765)/`
**Reason**: Browser resource load failures when external resources unavailable in test environment (localhost only, not production).
**Status**: Expected when running tests in isolation

### 13. React Warning Messages (Whitelisted Patterns)
**Pattern**: `/^Warning: Received `false`.*instead of `true`/`, `/^Warning: componentWillReceiveProps has been renamed/`, `/^Warning: Unknown event handler property/`, `/^Warning: useLayoutEffect does nothing on the server/`, `/^Warning: An update to .* inside a test was not wrapped in act/`
**Reason**: Specific React development warnings about deprecations, performance, or property issues that are safe to ignore in test environments.
**Status**: Expected React warnings during component development (whitelist approach to avoid hiding real issues)

### 14. StoryLoadedWrapper Timeout Diagnostics
**Pattern**: `/^StoryLoadedWrapper: /`, `/^Wrapper element:/`, `/^Children count:/`, `/^Inner HTML \(first/`
**Reason**: Diagnostic messages from StoryLoadedWrapper when components fail to load React Flow nodes within timeout.
**Status**: Expected when testing error/empty states

### 15. ErrorBoundary Test Errors
**Pattern**: `/\[ErrorBoundary\] Caught error/`, `/Test error for ErrorBoundary/`
**Reason**: Expected errors when testing ErrorBoundary error handling behavior.
**Status**: Expected in error state test stories

### 16. RenderPropErrorBoundary Test Errors
**Pattern**: `/\[RenderPropError\]/`
**Reason**: Expected errors when testing error handling in render prop-based error boundaries.
**Status**: Expected when testing error handling in render props

## Filter Performance Notes

The error filtering system uses a sequential pattern-matching approach in `isExpectedConsoleError()`. With 13 active filters, the complexity is O(n*m) where n is the number of console messages (typically <100 in tests) and m is the number of filter patterns (13). This results in negligible overhead (~1-2ms per test) and is not a performance bottleneck for typical usage.

As new filters are added, maintain this complexity by:
- Keeping patterns specific (avoid broad substring matching that requires more processing)
- Using anchors (`^`, `$`) to short-circuit regex matching
- Grouping related patterns to fail fast
- Monitoring filter count and consolidating related patterns if approaching 30+ filters

## Quarterly Filter Maintenance

To keep error filters aligned with evolving codebase:

1. **Quarterly Review** (each quarter):
   - Review filters that haven't matched errors in 90+ days (update timestamp in code comments)
   - Verify filters still match only expected errors (test with `npm test -- tests/unit/storyErrorFilters.spec.ts`)
   - Check for redundant or overlapping patterns

2. **Removal Process**:
   - Remove filters that haven't triggered in 6+ months
   - Remove filters for dependencies that have been upgraded/removed
   - Remove filters for bugs that have been fixed
   - Update this documentation when removing filters

3. **Documentation**:
   - Keep timestamp comments in code: `// Added 2024-01-15, last seen 2024-02-08`
   - Document reason for removal in git commit
   - Update this file to reflect current filter set

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
   npm run test:storybook                            # Run all story validations
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

# Run all story validation tests against Storybook
npm run test:storybook
```

This ensures:
1. Filter unit tests pass for new/modified patterns
2. Story tests are synchronized with filter updates
3. New filters don't accidentally hide real errors

## CI/CD Integration

Error filters are validated as part of the CI pipeline:
1. Story validation tests are run against Storybook (`npm run test:storybook`)
2. Unit tests for filter logic are executed (`npm test -- tests/unit/storyErrorFilters.spec.ts`)
3. All story tests are run with 30-second timeout
4. Any new unexpected errors fail the build

See `.github/workflows/ci.yml` for implementation details.
