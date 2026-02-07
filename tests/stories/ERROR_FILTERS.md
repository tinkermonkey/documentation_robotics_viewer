# Story Test Error Filters

## Purpose

Story tests validate that components render without unexpected errors. Some console messages are expected in test environments and should not cause test failures.

## Current Filters (as of all-stories.spec.ts)

### React Warnings
- `"React does not recognize"` - Prop validation warnings when unknown props are passed to DOM elements
- `"Warning: "` - General React development warnings (deprecation notices, performance warnings)

### Development Tools
- `"WebSocket connection"` - Expected in test environment without backend server
- `"Download the React DevTools"` - Development-only browser extension recommendation

### Library Initialization
- Flowbite component initialization messages
- React Flow internal warnings

## Adding New Filters

If you encounter a legitimate expected error:

1. **Verify it's truly expected**:
   - Confirm the error is not a bug in your component
   - Check if the error is environment-specific (test vs production)
   - Verify the error doesn't prevent the component from functioning

2. **Add specific pattern to filter**:
   - Edit `tests/stories/all-stories.spec.ts`
   - Find the `validateStory()` function
   - Add pattern to the existing error filter checks
   - Use specific patterns (avoid overly broad matches)

3. **Document reason in this file**:
   - Update the relevant section above with the new filter
   - Include explanation of why the error is expected
   - Include conditions when it appears

4. **Update tests to verify filter works**:
   - Create or update unit tests in `tests/unit/storyTestGenerator.spec.ts`
   - Verify the filter catches the intended error
   - Verify it doesn't accidentally filter unintended errors

5. **Example: Adding a new filter**

If you need to filter "Library XYZ initialization" error:

```typescript
// In tests/stories/all-stories.spec.ts, update the filter check:
const isExpectedError = (msg: string): boolean => {
  return (
    msg.includes('React does not recognize') ||
    msg.includes('Warning: ') ||
    msg.includes('WebSocket connection') ||
    msg.includes('Download the React DevTools') ||
    msg.includes('Library XYZ initialization') // NEW FILTER
  );
};
```

Then update this file:
```markdown
### Library Initialization
- Flowbite component initialization messages
- React Flow internal warnings
- Library XYZ initialization messages (expected during test setup)
```

## Filter Performance

The current filter implementation is O(n) where n is the number of console messages. Each message is checked against 4-5 patterns. For optimal performance:

- Keep filters specific and focused
- Use `includes()` rather than regex when possible
- Avoid filtering large message bodies
- Periodically review filters to remove obsolete ones

## Testing Filter Changes

After modifying filters, always run:

```bash
npm run test:stories:generate
npm run test:stories
```

This ensures:
1. No stories start failing unexpectedly
2. Previously-expected errors are still filtered
3. New filters don't accidentally hide real errors
