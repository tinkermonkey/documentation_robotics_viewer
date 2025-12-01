# Removed Tests

## business-focus-navigation.spec.ts

**Removed on**: 2025-12-01

**Reason**: Tests non-existent functionality in the embedded application.

### Issues with the removed tests:

All 23 tests in this file failed with the same root cause: waiting for `.business-layer-view` selector timed out after 10000ms.

1. **Non-existent Route**: Tests attempted to access `/embedded?view=business`, but:
   - The embedded app router (`src/apps/embedded/router.tsx`) has no business layer route
   - The router only supports: `/model/{view}`, `/spec/{view}`, `/motivation`, `/changesets/{view}`
   - The `view` parameter in ModelRoute only accepts `graph` or `json`
   - There is no `business` view option

2. **Component Not Integrated**: While `BusinessLayerView` component exists in `src/core/components/businessLayer/`:
   - It's never imported or used in the embedded app
   - No route is configured to render it
   - The component is completely isolated from the embedded app's routing

3. **Same Architecture Issue**: Like the previously removed `business-layer-filtering.spec.ts`, this test assumes:
   - Specialized layer-specific views exist in the embedded app
   - Direct URL access to business layer functionality
   - UI elements specific to business layer focus and navigation (ProcessInspectorPanel, focus mode controls)

### Tests Removed:

All 23 tests covering:
- Node selection (4 tests)
- Focus mode: Selected (2 tests)
- Process inspector panel (3 tests)
- Quick actions (4 tests)
- Keyboard navigation (3 tests)
- Focus mode transitions (2 tests)
- Visual styling (3 tests)
- Performance (2 tests)

### Recommendation:

If business layer focus & navigation functionality needs to be tested:

1. Integrate `BusinessLayerView` into the embedded app with a proper route (e.g., `/business` or `/model/business`)
2. Update the router to handle the business view
3. Rewrite tests to use the correct URL structure
4. Verify all UI elements (ProcessInspectorPanel, quick action buttons) are properly rendered

---

## business-layer-filtering.spec.ts

**Removed on**: 2025-12-01

**Reason**: Tests non-existent functionality in the embedded application.

### Issues with the removed tests:

1. **Wrong Port**: Tests attempted to connect to `http://localhost:5173/embedded`, but the embedded app runs on port 3001 (per `playwright.config.ts`). Port 5173 is used by the debug app.

2. **Missing UI Elements**: Tests looked for a "Load Demo" button that doesn't exist in the embedded app. The embedded app is designed to:
   - Connect via WebSocket to a backend server
   - Load data via REST API calls
   - Not have any demo loading buttons

3. **Non-existent Route**: Tests attempted to access business layer filtering functionality, but:
   - The `BusinessLayerView` component exists in `src/core/components/businessLayer/`
   - However, it's never integrated into any route in the embedded app
   - The embedded app router (`src/apps/embedded/router.tsx`) has no business layer route
   - The component is not imported or used anywhere in the embedded app

4. **Architecture Mismatch**: The embedded app is architected differently:
   - Uses `GraphViewer` component for visualization
   - Has routes for: `/model`, `/spec`, `/motivation`, `/changesets`
   - Does not have specialized layer-specific views
   - Business layer filtering is not part of the embedded app feature set

### What remains:

The following business layer tests are still valid and remain in the codebase:

- **tests/business-layer-integration.spec.ts**: Unit/integration tests that test the business layer parser, graph builder, and related services directly (not through UI)
- **tests/business-layer-performance.spec.ts**: Performance tests for business layer components
- **tests/unit/businessGraphBuilder.spec.ts**: Unit tests for the graph builder
- **tests/unit/businessLayerParser.spec.ts**: Unit tests for the parser
- **tests/unit/hooks/useBusinessFilters.spec.ts**: Unit tests for the filters hook
- **tests/unit/layout/hierarchicalBusinessLayout.spec.ts**: Unit tests for the layout algorithm
- **tests/unit/nodes/businessNodes.spec.ts**: Unit tests for business node components

These tests work because they test the components/services in isolation, not through the embedded app UI.

### Recommendation:

If business layer filtering functionality needs to be tested in the future:

1. Either integrate `BusinessLayerView` into the embedded app with a proper route
2. Or create tests that run against the debug app (which has more flexibility)
3. Ensure tests use the correct port and URL for the target application
4. Verify UI elements exist before writing tests for them
