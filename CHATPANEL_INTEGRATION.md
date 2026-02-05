# ChatPanel Integration Guide

## Overview

Phase 5 of the ChatPanel implementation focuses on containerization and application integration. The `ChatPanelContainer` wraps the existing `ChatPanel` component and handles initialization, lifecycle management, and WebSocket integration.

## Architecture

### Component Hierarchy

```
SharedLayout (with optional bottom panel support)
└── ChatPanelContainer (initialization & lifecycle)
    └── ChatPanel (UI & message rendering)
        ├── ChatMessage (individual messages)
        ├── ChatInput (message input form)
        ├── ChatTextContent (markdown rendering)
        ├── ThinkingBlock (extended thinking display)
        ├── ToolInvocationCard (tool execution display)
        └── UsageStatsBadge (token usage stats)
```

### Layout Changes

**SharedLayout.tsx** now supports a bottom panel:

```typescript
interface SharedLayoutProps {
  showLeftSidebar?: boolean;      // Left sidebar (layers, etc.)
  showRightSidebar?: boolean;     // Right sidebar (filters, controls)
  showBottomPanel?: boolean;      // NEW: Bottom panel (chat, console)
  bottomPanelHeight?: string;     // NEW: Bottom panel height (default: 300px)
  // ... other props
}
```

## ChatPanelContainer Component

### Location
`src/apps/embedded/components/ChatPanelContainer.tsx`

### Props
```typescript
interface ChatPanelContainerProps {
  title?: string;         // Panel title (default: "DrBot Chat")
  showCostInfo?: boolean; // Show cost info footer (default: true)
  testId?: string;        // Test ID for E2E testing (default: "chat-panel-container")
}
```

### Features

1. **Initialization**
   - Checks SDK status on mount
   - Sets up Zustand store with status
   - Shows loading spinner during init
   - Displays warning for non-fatal errors

2. **WebSocket Integration**
   - Listens for connection/disconnect events
   - Re-checks status on reconnection
   - Updates store with error messages
   - Automatic cleanup on unmount

3. **Error Handling**
   - Graceful degradation if SDK unavailable
   - Warning UI for initialization errors
   - Automatic retry on reconnection
   - Chat still renders even if SDK unavailable

### Lifecycle

```
Mount
├── setIsInitializing(true)
├── Check SDK status via chatService.getStatus()
├── setSdkStatus(status)
├── Listen for websocketClient connect/disconnect
└── setIsInitializing(false)

WebSocket Connected
├── Re-check SDK status
└── Clear error message

WebSocket Disconnected
├── Set error: "Connection lost. Reconnecting..."

Unmount
└── Clean up WebSocket listeners
```

## Integration into Routes

### ArchitectureRoute Example

The `ArchitectureRoute` has been updated to demonstrate ChatPanel integration:

```typescript
import { ChatPanelContainer } from '../components/ChatPanelContainer';
import { useChatStore } from '../stores/chatStore';

function ArchitectureRouteContent() {
  const { reset: resetChat } = useChatStore();
  const [showChatPanel, setShowChatPanel] = useState(true);

  // Reset chat when route unmounts
  useEffect(() => {
    return () => {
      resetChat();
    };
  }, [resetChat]);

  return (
    <SharedLayout
      showLeftSidebar={false}
      showRightSidebar={true}
      showBottomPanel={showChatPanel}
      bottomPanelHeight="320px"
      rightSidebarContent={<C4RightSidebar {...props} />}
      bottomPanelContent={
        showChatPanel ? <ChatPanelContainer testId="architecture-chat-panel" /> : null
      }
    >
      {/* Main graph content */}
    </SharedLayout>
  );
}
```

### Integration Pattern

To add ChatPanel to other routes:

1. **Import components and hooks**
   ```typescript
   import { ChatPanelContainer } from '../components/ChatPanelContainer';
   import { useChatStore } from '../stores/chatStore';
   ```

2. **Add state for ChatPanel visibility**
   ```typescript
   const { reset: resetChat } = useChatStore();
   const [showChatPanel, setShowChatPanel] = useState(true);
   ```

3. **Reset chat on route unmount**
   ```typescript
   useEffect(() => {
     return () => {
       resetChat();
     };
   }, [resetChat]);
   ```

4. **Update SharedLayout**
   ```typescript
   <SharedLayout
     showBottomPanel={showChatPanel}
     bottomPanelHeight="320px"
     bottomPanelContent={
       showChatPanel ? <ChatPanelContainer /> : null
     }
   >
     {/* Main content */}
   </SharedLayout>
   ```

5. **Optional: Add toggle button**
   ```typescript
   <button onClick={() => setShowChatPanel(!showChatPanel)}>
     {showChatPanel ? 'Hide' : 'Show'} Chat
   </button>
   ```

## State Management

### Chat Store Integration

The `ChatPanelContainer` uses the `chatStore` for state:

```typescript
const {
  messages,              // All messages in conversation
  activeConversationId,  // Current conversation ID
  isStreaming,          // Is response streaming
  sdkStatus,            // SDK availability/version
  error,                // Error message
  setSdkStatus,         // Update SDK status
  setError,             // Set error message
  reset                 // Clear all chat state
} = useChatStore();
```

### Chat Service Integration

The `chatService` handles communication:

```typescript
await chatService.getStatus();      // Check SDK status
await chatService.sendMessage(msg); // Send message
await chatService.cancelMessage();  // Cancel streaming
```

## Testing

### Unit Tests
- **Location**: `tests/unit/chatPanelContainer.spec.ts`
- **Coverage**: Component props, lifecycle, error handling
- **Run**: `npm test`

### Integration Tests (E2E)
- **Location**: `tests/chat-panel-container.spec.ts`
- **Coverage**: Route integration, SDK status, message rendering
- **Run**: `npm run test:e2e`
- **Requires**: Both servers running (frontend + Python backend)

### Story Validation
- **Location**: `src/apps/embedded/components/ChatPanelContainer.stories.tsx`
- **Coverage**: All prop combinations
- **Run**: `npm run catalog:dev` + `npm run test:stories`

## Performance Considerations

1. **Initialization**: ~200-500ms for SDK status check
2. **Memory**: Chat messages stored in Zustand (no limit, but UI scrolls efficiently)
3. **Network**: WebSocket connection reused for all chat events
4. **Rendering**: ChatPanel memoized to prevent unnecessary re-renders

## Styling

- **Dark Mode**: Full support via Tailwind dark: variants
- **Responsive**: Adapts to bottom panel height
- **Accessibility**: data-testid on all interactive elements
- **Theme**: Uses Flowbite components for consistency

## Common Issues

### ChatPanel Not Rendering
**Symptoms**: No chat panel visible in route
**Cause 1**: `showBottomPanel={false}` or `bottomPanelContent={null}`
- **Fix**: Set `showBottomPanel={true}` and pass ChatPanelContainer

**Cause 2**: Bottom panel height too small
- **Fix**: Increase `bottomPanelHeight` (default: 300px)

### SDK Status Shows "Unavailable"
**Symptoms**: Chat shows "Unavailable" indicator
**Cause**: Reference server not running on port 8765
- **Fix**: Start reference server: `cd reference_server && python main.py`

### WebSocket Errors
**Symptoms**: Connection errors in console
**Cause**: WebSocket server not configured correctly
- **Fix**: Check `websocketClient.ts` configuration and reference server setup

## Future Enhancements

1. **Collapsible Chat Panel**
   - Add minimize/maximize buttons
   - Save panel visibility state to localStorage

2. **Multi-Tab Chat**
   - Switch between multiple conversations
   - Save conversation history

3. **Chat Settings Panel**
   - Model selection
   - Token limit configuration
   - Temperature adjustment

4. **Export Chat**
   - Export conversation as markdown/PDF
   - Share conversation links

5. **Context Integration**
   - Pass selected graph nodes as context
   - Include current view state in prompts

## Files Modified/Created

### New Files
- `src/apps/embedded/components/ChatPanelContainer.tsx` - Container component
- `src/apps/embedded/components/ChatPanelContainer.stories.tsx` - Storybook stories
- `tests/chat-panel-container.spec.ts` - E2E tests
- `tests/unit/chatPanelContainer.spec.ts` - Unit tests

### Modified Files
- `src/apps/embedded/components/SharedLayout.tsx` - Added bottom panel support
- `src/apps/embedded/routes/ArchitectureRoute.tsx` - Integrated ChatPanel
- `playwright.e2e.config.ts` - Added chat tests to E2E suite

### Existing Components (Unchanged)
- `src/apps/embedded/components/ChatPanel.tsx` - UI component
- `src/apps/embedded/stores/chatStore.ts` - State management
- `src/apps/embedded/services/chatService.ts` - Service layer
- `src/apps/embedded/components/chat/*` - Message rendering components

## Deployment

When deploying:

1. **Verify Build**: `npm run build` completes without errors
2. **Run Tests**: `npm test` and `npm run test:e2e` pass
3. **Check Routes**: All routes with ChatPanel load correctly
4. **Test Chat**: Send a message via chat panel

## Version Information

- **Implementation**: Phase 5 - ChatPanel Container & Integration
- **React**: 18.x
- **TypeScript**: 5.0+
- **React Flow**: 12.0.0
- **Zustand**: Latest
- **Status**: Complete ✅

---

**Last Updated**: 2026-02-05
**Tested With**: Playwright, Vitest, Ladle
**Ready for Production**: Yes ✅
