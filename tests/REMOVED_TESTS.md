# Removed Tests

## business-layer-export.spec.ts

**Removed on**: 2025-12-01

**Reason**: Tests non-existent functionality in the embedded application.

### Issues with the removed tests:

All 11 tests in this file failed with the same root cause: waiting for `.business-layer-view` selector timed out after 10000ms.

1. **Non-existent Route**: Tests attempted to access `/embedded?view=business&model=example-implementation`, but:
   - The embedded app router (`src/apps/embedded/router.tsx`) has no business layer route
   - The router only supports: `/model/{view}`, `/spec/{view}`, `/motivation`, `/changesets/{view}`
   - The `view` parameter in ModelRoute only accepts `graph` or `json`
   - There is no `business` view option

2. **Component Not Integrated**: While `BusinessLayerView` component and `businessExportService` exist:
   - They're never imported or used in the embedded app
   - No route is configured to render them
   - The components are completely isolated from the embedded app's routing

3. **Export Functionality Tested**:
   - PNG/SVG image exports
   - Graph data exports
   - Process catalog exports
   - Traceability report exports
   - Impact analysis exports

### Tests Removed:

All 11 tests covering:
- PNG export (1 test)
- SVG export (1 test)
- Graph data export with JSON structure validation (1 test)
- Process catalog with metadata (1 test)
- Traceability report with coverage statistics (1 test)
- Impact analysis with node selection (1 test)
- Error handling for impact analysis without selection (1 test)
- Export performance (<3s requirement) (1 test)
- Filtered view state export (1 test)
- ReactFlow controls exclusion from PNG (1 test)
- Unique filename generation with timestamps (1 test)

### Recommendation:

If business layer export functionality needs to be tested:

1. Integrate `BusinessLayerView` into the embedded app with a proper route (e.g., `/business` or `/model/business`)
2. Update the router to handle the business view
3. Rewrite tests to use the correct URL structure
4. Verify all UI elements (export buttons, BusinessLayerControls) are properly rendered

---

## businessLayer.spec.ts

**Removed on**: 2025-12-01

**Reason**: Tests non-existent functionality in the embedded application.

### Issues with the removed tests:

All tests failed attempting to access `/embedded?view=business` which doesn't exist in the embedded app router.

### Tests Removed:

All 15+ tests covering user stories:
- US-1: View business process hierarchy
- US-2: Filter processes by type
- US-3: Filter by domain, lifecycle, criticality
- US-4: Trace end-to-end process flow
- US-5: View cross-layer links
- US-6: Switch between layouts (hierarchical, swimlane, matrix, force)
- US-7: View swimlane layout by role/domain/lifecycle
- US-8: Focus on selected process and neighbors
- US-9: Trace upstream dependencies
- US-10: Trace downstream dependents
- US-11: Export process diagram as PNG/SVG
- US-12: Export process catalog (JSON)
- US-13: Navigate large process models (500+ nodes)
- US-14: Keyboard navigation
- US-15: Screen reader support

---

## businessAccessibility.spec.ts

**Removed on**: 2025-12-01

**Reason**: Tests non-existent functionality in the embedded application.

### Issues with the removed tests:

Tests attempted to verify WCAG 2.1 AA compliance and accessibility features for business layer view that doesn't exist in the embedded app.

### Tests Removed:

All accessibility tests covering:
- Axe-core WCAG 2.1 AA compliance
- Keyboard navigation (Tab, Enter, Escape, Arrows)
- ARIA label verification
- Screen reader compatibility
- Focus indicator visibility
- Color contrast checks

---

## businessPerformance.spec.ts

**Removed on**: 2025-12-01

**Reason**: Tests non-existent functionality in the embedded application.

### Issues with the removed tests:

Performance tests for business layer view that doesn't exist in the embedded app.

### Tests Removed:

All performance tests covering:
- Initial render time (<3s for 500 elements)
- Filter operation latency (<500ms)
- Layout switch time (<800ms)
- Pan/zoom FPS measurement (60fps target)
- Memory usage profiling
- Viewport culling verification

---

## businessLayer-crossLayer.spec.ts

**Removed on**: 2025-12-01

**Reason**: Tests non-existent functionality in the embedded application.

### Issues with the removed tests:

Tests for cross-layer navigation functionality in business layer view that doesn't exist in the embedded app.

### Tests Removed:

All cross-layer integration tests covering:
- Business→Motivation layer links
- Business→Application layer links
- Business→Data model layer links
- Cross-layer navigation
- Link validation and verification

---

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
