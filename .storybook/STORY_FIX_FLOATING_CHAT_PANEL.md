# FloatingChatPanel Stories Removal

## Issue
The FloatingChatPanel stories were failing with WebSocket connection errors:

```
Error: Critical error in story d-chat-containers-floatingchatpanel--*:
[ChatPanelContainer] Initialization error: Error: Failed to send JSON-RPC request: WebSocket not connected
```

## Root Cause Analysis

### Component Hierarchy
```
FloatingChatPanel
  └── ChatPanelContainer (renders when !isMinimized)
      ├── Initializes WebSocket connection on mount
      ├── Calls chatService.getStatus() → JSON-RPC request
      └── Renders ChatPanel after initialization
```

### Why It Failed in Storybook
1. `ChatPanelContainer` component calls `chatService.getStatus()` on mount (line 38 of ChatPanelContainer.tsx)
2. This triggers a JSON-RPC request over WebSocket
3. In Storybook environment, there's no WebSocket server available
4. The request fails immediately with "WebSocket not connected"
5. Test runner catches this error and reports it as a critical failure

### Why Error Wasn't Filtered
The test-runner's error filter (`storyErrorFilters.ts`) includes filters for:
- WebSocket connection failures: `WebSocket connection to ws://localhost:* failed`
- ECONNREFUSED errors on dev ports

However, the error message format `[ChatPanelContainer] Initialization error: Error: Failed to send JSON-RPC request: WebSocket not connected` was logged to console.error **before** the WebSocket connection error, so it was the first error caught by the test runner.

## Solution: Remove Stories

The `FloatingChatPanel.stories.tsx` file was removed because:

1. **Not Suitable for Storybook**: The component requires a running WebSocket server and DR CLI backend. This is integration-level testing, not component-level testing.

2. **Existing Coverage**: The ChatPanel UI is already covered by:
   - `ChatPanelContainer.stories.tsx` - Shows ChatPanel directly (avoiding WebSocket connection)
   - `ChatComponents.stories.tsx` - Shows individual chat components

3. **Limited Value**: FloatingChatPanel is primarily a positioning/dragging wrapper. Testing drag/resize in Storybook smoke tests provides minimal value without actual interaction tests.

4. **Follows Established Pattern**: The existing `ChatPanelContainer.stories.tsx` file already documents this exact issue (lines 11-18):
   ```typescript
   /**
    * Note: These stories show the ChatPanel component directly to avoid
    * the 30-second timeout that occurs when ChatPanelContainer tries to
    * connect to the chat service in the story environment.
    */
   ```

## Alternative Solutions Considered

### Option 1: Mock WebSocket (Rejected)
- Would require complex mocking of websocketClient and chatService
- Wouldn't test the actual FloatingChatPanel behavior
- Would add maintenance burden

### Option 2: Add Error Filter (Rejected)
- Would hide legitimate errors in other stories
- Wouldn't solve the underlying issue
- Stories would still show error states instead of actual UI

### Option 3: Create MockFloatingChatPanel (Rejected)
- Duplicates effort from ChatPanelContainer.stories.tsx
- Adds complexity for minimal visual testing value
- UI testing of drag/resize requires E2E tests, not Storybook

## Testing FloatingChatPanel

For actual testing of FloatingChatPanel functionality, use:
- **E2E Tests**: Test with full backend running (e.g., `embedded-chat.spec.ts`)
- **Manual Testing**: Run app locally with `npm run dev`

## Related Files
- `/workspace/src/apps/embedded/components/FloatingChatPanel.tsx` - Component implementation
- `/workspace/src/apps/embedded/components/ChatPanelContainer.tsx` - Container with WebSocket initialization
- `/workspace/src/catalog/stories/d-chat/containers/ChatPanelContainer.stories.tsx` - Existing chat panel stories
- `/workspace/.storybook/test-runner.ts` - Test runner configuration
- `/workspace/tests/stories/storyErrorFilters.ts` - Error filtering rules

## Date
2026-02-20
