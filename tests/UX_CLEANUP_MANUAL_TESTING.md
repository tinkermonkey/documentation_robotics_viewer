# Manual Testing Checklist - Phase 6: Integration Testing

This checklist supports comprehensive manual validation of all UX cleanup changes from Phases 1-5 (Issue #64).

## Prerequisites

- [ ] Reference server is running (`cd reference_server && source .venv/bin/activate && python main.py`)
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser is open to http://localhost:3001
- [ ] design.png reference is available for visual comparison

## 1. Layer Color Consistency Testing

### 1.1 Cross-View Color Validation

- [ ] Open Model graph view
- [ ] Note the color of Motivation layer nodes
- [ ] Switch to Spec graph view
- [ ] Verify Motivation layer nodes use the same color
- [ ] Repeat for Business, Security, Application, and Technology layers

### 1.2 Layer Badge vs Node Color Matching

**Model View:**
- [ ] Navigate to Model > Graph
- [ ] Compare Business layer badge color in left sidebar to Business nodes in graph
- [ ] Verify colors match exactly
- [ ] Repeat for 2-3 other visible layers

**Spec View:**
- [ ] Navigate to Spec graph
- [ ] Compare layer colors in any visible badges to graph nodes
- [ ] Verify consistency

### 1.3 All 12 Layer Types Have Colors

For each layer type, verify it has a defined color:

- [ ] Motivation (#9333ea - Purple)
- [ ] Business (#3b82f6 - Blue)
- [ ] Security (#ec4899 - Pink)
- [ ] Application (#10b981 - Green)
- [ ] Technology (#ef4444 - Red)
- [ ] API (#f59e0b - Orange/Amber)
- [ ] DataModel (verify has color)
- [ ] Testing (#06b6d4 - Cyan)
- [ ] UX (#14b8a6 - Teal)
- [ ] Navigation (verify has color)
- [ ] APM (verify has color)

### 1.4 MiniMap Color Consistency

- [ ] Navigate to Model > Graph
- [ ] Compare node colors in MiniMap to main graph
- [ ] Verify MiniMap uses matching layer colors
- [ ] Repeat in Spec, Motivation, and Architecture views

### 1.5 Dark Mode Color Consistency

- [ ] Toggle to dark mode (if available)
- [ ] Verify layer colors remain distinct from each other
- [ ] Verify dark mode adjustments are consistent across views
- [ ] Toggle back to light mode and verify colors restore

---

## 2. Zoom-to-Layer Interaction Testing

### 2.1 Model View Layer Zoom

- [ ] Navigate to Model > Graph
- [ ] Wait for graph to fully load
- [ ] Click "Business" layer in left sidebar
- [ ] Verify smooth zoom animation (~400ms)
- [ ] Verify Business layer nodes are centered in viewport
- [ ] Verify appropriate padding around nodes (not too tight)
- [ ] Click "Application" layer
- [ ] Verify zoom transitions smoothly to Application nodes
- [ ] Click "Security" layer
- [ ] Verify zoom works consistently

### 2.2 Manual Pan/Zoom + Layer Click

- [ ] Stay in Model > Graph
- [ ] Manually pan the graph by dragging
- [ ] Manually zoom in using mouse wheel or controls
- [ ] Click a layer in sidebar
- [ ] Verify zoom-to-layer still works correctly
- [ ] Manually zoom out significantly
- [ ] Click another layer
- [ ] Verify zoom-to-layer overrides manual zoom state

### 2.3 Rapid Layer Switching

- [ ] Click Business layer
- [ ] Immediately click Application layer (don't wait for animation)
- [ ] Immediately click Security layer
- [ ] Verify no animation jank or stuttering
- [ ] Verify graph ends up focused on Security layer
- [ ] Check browser console for errors (should be none)

### 2.4 Spec View Schema Zoom

- [ ] Navigate to Spec graph
- [ ] Wait for graph to load
- [ ] Click a schema item in left sidebar
- [ ] Verify smooth zoom to schema nodes
- [ ] Click different schema
- [ ] Verify zoom transitions correctly

### 2.5 Zoom Visual State in Sidebar

- [ ] Navigate to Model > Graph
- [ ] Click Business layer
- [ ] Verify Business layer item has visual indication of selection (highlight, active state, etc.)
- [ ] Click Application layer
- [ ] Verify Application becomes active and Business becomes inactive

---

## 3. Motivation View Sidebar Consolidation

### 3.1 2-Column Layout Verification

- [ ] Navigate to Motivation view
- [ ] Count visible layout columns (should be exactly 2)
  - [ ] Main graph area (center/left)
  - [ ] Right sidebar
- [ ] Verify NO left sidebar is visible
- [ ] Verify graph extends to left edge

### 3.2 Right Sidebar Sections

Verify all expected sections are present:

- [ ] Filters section visible
- [ ] Controls section visible
- [ ] Annotations section visible
- [ ] Inspector section (may be hidden until node selection)

### 3.3 Collapsible Section Functionality

- [ ] Click on Filters section header
- [ ] Verify section expands/collapses
- [ ] Repeat for Controls section
- [ ] Repeat for Annotations section
- [ ] Verify sections maintain state independently

### 3.4 Inspector Panel on Node Selection

- [ ] Click a node in the Motivation graph
- [ ] Verify Inspector section appears or becomes visible
- [ ] Verify Inspector shows node details
- [ ] Click background to deselect
- [ ] Verify Inspector updates or hides appropriately

### 3.5 No Duplicate Sidebars

- [ ] Inspect page layout (browser DevTools can help)
- [ ] Verify only ONE right sidebar exists
- [ ] Verify NO embedded sidebars inside graph area
- [ ] Verify AnnotationPanel is accessible (not hidden behind anything)

---

## 4. Architecture (C4) View Sidebar Consolidation

### 4.1 2-Column Layout Verification

- [ ] Navigate to Architecture view
- [ ] Count visible layout columns (should be exactly 2)
  - [ ] Main graph area
  - [ ] Right sidebar
- [ ] Verify NO left sidebar is visible

### 4.2 Right Sidebar Has 4 Sections

- [ ] Filters section visible
- [ ] Controls section visible
- [ ] Inspector section (visible after node selection)
- [ ] Annotations section visible

### 4.3 Inspector Section on Node Selection

- [ ] Click a node in C4 graph
- [ ] Verify Inspector section appears
- [ ] Verify Inspector shows C4 component/relationship details
- [ ] Click different node
- [ ] Verify Inspector updates

### 4.4 Section State Persistence

- [ ] Collapse Filters section
- [ ] Perform graph interaction (pan/zoom)
- [ ] Verify Filters section remains collapsed
- [ ] Expand Filters section
- [ ] Select a node
- [ ] Verify Filters section remains expanded

---

## 5. Overview Panel (MiniMap) Styling

### 5.1 Visual Design Matching

- [ ] Navigate to Model > Graph
- [ ] Locate MiniMap in bottom-right corner
- [ ] Verify "Overview" header text is visible
- [ ] Compare to design.png reference
- [ ] Verify header styling matches:
  - [ ] Text is small (text-xs)
  - [ ] Text is medium weight (font-medium)
  - [ ] Text is gray-500 color
  - [ ] Header has bottom border

### 5.2 Container Styling

- [ ] Verify container has rounded corners (rounded-lg)
- [ ] Verify container has border (visible, not too thick)
- [ ] Verify container has subtle shadow (shadow-sm)
- [ ] Verify background is white (light mode) or gray-800 (dark mode)

### 5.3 Dark Mode Adaptation

- [ ] Toggle to dark mode
- [ ] Verify Overview panel background changes to dark (gray-800)
- [ ] Verify border color changes to dark variant
- [ ] Verify "Overview" text color changes to gray-400
- [ ] Verify styling remains consistent with design

### 5.4 Positioning and Visibility

- [ ] Verify MiniMap is in bottom-right corner
- [ ] Verify MiniMap is fully visible (not cut off)
- [ ] Verify MiniMap is above other elements (proper z-index)
- [ ] Test in Model, Spec, Motivation, and Architecture views
- [ ] All should have Overview panel with same styling

### 5.5 Functionality After Styling

- [ ] Click within MiniMap
- [ ] Verify navigation works (graph pans to clicked area)
- [ ] Drag viewport indicator in MiniMap
- [ ] Verify graph follows
- [ ] Verify styling remains intact during interactions

---

## 6. Responsive Behavior Testing

### 6.1 Narrow Viewport (Tablet)

- [ ] Resize browser to ~800px width
- [ ] Navigate to Motivation view
- [ ] Verify layout adapts gracefully
- [ ] Verify right sidebar doesn't overflow
- [ ] Verify graph remains usable

### 6.2 Very Narrow Viewport (Mobile)

- [ ] Resize browser to ~400px width
- [ ] Verify app is still functional
- [ ] Sidebar may collapse or overlay - verify it's accessible
- [ ] Verify graph can still be interacted with

### 6.3 Wide Viewport

- [ ] Resize browser to ~1920px width
- [ ] Verify right sidebar stays at fixed width (w-80 = 320px)
- [ ] Verify right sidebar is attached to screen edge
- [ ] Verify graph utilizes available space

---

## 7. Regression Testing

### 7.1 Existing Functionality

- [ ] Test navigation between all main tabs (Spec, Model, Motivation, Architecture, Changesets)
- [ ] Test switching between Graph and JSON views
- [ ] Test WebSocket connection indicator shows connected
- [ ] Test annotation creation/viewing (if implemented)
- [ ] Test filter controls in each view
- [ ] Test control panels in each view

### 7.2 Performance Checks

- [ ] Initial page load is reasonable (<5 seconds)
- [ ] Graph rendering is smooth (no lag on zoom/pan)
- [ ] View switching is responsive (<2 seconds)
- [ ] Layer zoom animations are smooth (60fps feel)

### 7.3 Console Error Check

- [ ] Open browser DevTools console
- [ ] Navigate through all views
- [ ] Perform various interactions
- [ ] Verify NO critical errors appear
- [ ] ResizeObserver warnings are acceptable (known browser quirk)

---

## 8. Accessibility Quick Check

### 8.1 Keyboard Navigation

- [ ] Tab through interface
- [ ] Verify focus indicators are visible
- [ ] Verify all interactive elements are reachable
- [ ] Verify collapsible sections can be toggled with keyboard

### 8.2 Screen Reader Labels

- [ ] Verify buttons have accessible labels
- [ ] Verify sidebar sections have headings
- [ ] Verify graph has accessible description (if applicable)

---

## 9. Cross-Browser Testing (Optional but Recommended)

If time permits, repeat key tests in:

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on macOS)
- [ ] Edge

Focus on:
- Layer colors appear consistent
- Zoom animations work smoothly
- Sidebar layouts are correct
- Overview panel styling matches

---

## Acceptance Criteria Summary

All items above should be checked off, with the following specific criteria met:

✅ **Layer Colors:**
- Consistent across Model and Spec graphs for all 12 layer types
- Badges match graph node colors
- MiniMap uses matching colors
- Dark mode preserves color relationships

✅ **Zoom Interactions:**
- Layer clicks zoom smoothly (400ms animation)
- Works after manual pan/zoom
- Rapid switching has no jank
- Spec schema selection zooms correctly

✅ **Sidebar Consolidation:**
- Motivation and Architecture views have 2-column layout (no left sidebar)
- Right sidebar has collapsible sections
- Inspector appears on node selection
- No duplicate sidebars or z-index conflicts

✅ **Overview Panel:**
- "Overview" header visible in all graph views
- Styling matches design.png (border, shadow, rounded)
- Dark mode variants work correctly
- Positioned in bottom-right corner
- MiniMap functionality intact

✅ **No Regressions:**
- All existing functionality works
- Build succeeds with no type errors (verified via automated tests)
- 486 E2E tests pass (verified)
- No new console errors

---

## Notes Section

Use this space to document any issues found during manual testing:

**Issues Found:**

1.

2.

3.

**Visual Differences from design.png:**

1.

2.

**Performance Observations:**

1.

2.

---

**Testing Completed By:** _________________

**Date:** _________________

**Browser/Version:** _________________

**Resolution Tested:** _________________

**All Acceptance Criteria Met:** [ ] YES [ ] NO

**Notes:**

