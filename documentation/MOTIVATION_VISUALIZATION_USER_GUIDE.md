# Motivation Layer Visualization - User Guide

**Version:** 1.0.0
**Last Updated:** 2025-11-30
**Status:** Production Ready

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Understanding the Interface](#understanding-the-interface)
4. [Layout Algorithms](#layout-algorithms)
5. [Filtering and Search](#filtering-and-search)
6. [Path Tracing and Exploration](#path-tracing-and-exploration)
7. [Export Features](#export-features)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

The Motivation Layer Visualization provides an interactive, graph-based view of your architecture's motivation model. It displays the relationships between stakeholders, goals, drivers, requirements, constraints, and other motivation elements using an ontology diagram approach.

### Key Features

- **Multiple Layout Algorithms**: Force-directed, hierarchical, radial, and manual layouts
- **Interactive Filtering**: Show/hide elements by type and relationship
- **Path Tracing**: Discover how requirements trace to goals
- **Export Capabilities**: PNG, SVG, JSON, and traceability reports
- **Layout Persistence**: Manual adjustments save automatically
- **Accessibility**: Full keyboard navigation and screen reader support

---

## Getting Started

### Loading a Model

1. **Load Demo Data**: Click "Load Demo Data" to explore with sample data
2. **Load from GitHub**: Paste a GitHub repository URL containing a DR model
3. **Load from Local File**: Upload a ZIP file containing your model

Once loaded, the motivation visualization will automatically render if your model contains a Motivation layer.

### First View

Upon loading, you'll see:
- **Graph Canvas**: Central area showing nodes (elements) and edges (relationships)
- **Filter Panel**: Left sidebar for controlling visible elements
- **Control Panel**: Right sidebar for layout and export controls
- **Inspector Panel**: Appears when selecting an element (right sidebar)

---

## Understanding the Interface

### Node Types

Each motivation element is represented by a distinct visual style:

| Element Type | Visual Style | Description |
|-------------|--------------|-------------|
| **Stakeholder** | Purple border | Individuals or groups with interests |
| **Goal** | Blue border, priority badge | Desired states or outcomes |
| **Driver** | Orange border, category badge | External/internal forces for change |
| **Requirement** | Green border, status badge | Needs that must be satisfied |
| **Constraint** | Red border, negotiability icon | Restrictions or limitations |
| **Outcome** | Teal border, achievement status | Results of actions |
| **Principle** | Gray border | Normative properties or statements |
| **Assumption** | Yellow border | Accepted statements without proof |

### Edge Types

Relationships are shown as directed edges with different styles:

| Relationship | Visual Style | Meaning |
|-------------|--------------|---------|
| **Influences** | Solid line, arrow | One element affects another |
| **Constrains** | Dashed line, red-orange | Element imposes restrictions |
| **Realizes** | Dotted line, blue | Element fulfills another |
| **Refines** | Thick line | Hierarchical specialization |
| **Conflicts** | Red dashed line, bidirectional | Elements oppose each other |

### Highlighting States

- **Selected**: Thick border, direct relationships highlighted
- **Highlighted Path**: Emphasized edges and nodes in trace
- **Dimmed**: Reduced opacity when focus mode is enabled

---

## Layout Algorithms

### Force-Directed Layout

**Best For:** Discovering clusters and relationship patterns

- Uses physics simulation to position nodes
- Highly connected nodes gravitate together
- Reveals network structure organically

**Use When:**
- Exploring relationships between many elements
- Identifying tightly coupled groups
- No clear hierarchical structure

### Hierarchical Layout

**Best For:** Goal trees and refinement chains

- Top-down tree structure
- Parent elements above children
- Clear visualization of refines relationships

**Use When:**
- Viewing goal hierarchies
- Tracing requirement decomposition
- Understanding refinement chains

### Stakeholder Radial Layout

**Best For:** Analyzing stakeholder influence networks

- Selected stakeholder at center
- Related elements in concentric rings
- Distance indicates relationship directness

**Use When:**
- Analyzing stakeholder concerns
- Understanding influence reach
- Identifying stakeholder-specific requirements

**How to Activate:**
1. Click a stakeholder node
2. In Inspector Panel, click "Show Network"
3. Radial layout activates automatically

### Manual Layout

**Best For:** Custom arrangements and presentations

- Drag nodes to desired positions
- Positions persist across sessions
- New elements use auto-layout

**Use When:**
- Creating custom diagrams for presentations
- Organizing elements by domain
- Maintaining a specific visual arrangement

**How to Use:**
1. Select "Manual" from layout dropdown
2. Drag nodes to arrange
3. Positions save automatically when layout is "Manual"
4. Reload page and select "Manual" to restore

---

## Filtering and Search

### Element Type Filters

Control which element types are visible:

1. Open **Filter Panel** (left sidebar)
2. Under "Element Types", check/uncheck types:
   - ✓ Stakeholder
   - ✓ Goal
   - ✓ Requirement
   - ✓ Constraint
   - ...and more

3. Graph updates in real-time

**Tip:** Use filters to reduce visual clutter when analyzing specific concerns.

### Relationship Type Filters

Control which relationships are displayed:

1. Open **Filter Panel**
2. Under "Relationships", toggle types:
   - ✓ Influences
   - ✓ Realizes
   - ✓ Refines
   - ✓ Constrains

**Use Case:** Hide "influences" edges to focus on formal realization chains.

### Clear All Filters

Click "Clear All Filters" to reset and show all elements.

---

## Path Tracing and Exploration

### View Direct Relationships

**Single-click any node** to:
- Highlight its direct connections
- Open Inspector Panel
- Show relationship details

### Trace Upstream Influences

**Goal:** Find what influences a requirement

1. Click a requirement node
2. In Inspector Panel, click "Trace Upstream"
3. View the complete chain of drivers, stakeholders, and goals

### Trace Downstream Impacts

**Goal:** See what a goal affects

1. Click a goal node
2. In Inspector Panel, click "Trace Downstream"
3. View requirements, outcomes, and constraints impacted

### Find Paths Between Elements

**Goal:** Discover how two elements are connected

1. Click the first element (e.g., a stakeholder)
2. **Shift+Click** the second element (e.g., a goal)
3. All paths between them are highlighted
4. Shortest path emphasized in bold

**Use Cases:**
- Verify requirement→goal traceability
- Find hidden influence chains
- Identify gaps in traceability

### Focus Mode

**Goal:** Concentrate on specific elements

1. Select an element
2. In Inspector Panel, click "Focus on Element"
3. Non-related elements dim (opacity reduced)
4. Click "Clear Highlighting" to restore

---

## Export Features

### Export as PNG

**Best For:** Documentation, presentations, reports

1. Arrange graph as desired (zoom, pan, filter)
2. Click **Export → PNG** button
3. High-resolution PNG (2x pixel ratio) downloads
4. Controls and panels excluded from export

**Tips:**
- Use "Fit to View" before exporting for complete diagram
- Apply filters to export only relevant elements

### Export as SVG

**Best For:** Vector graphics, scalable diagrams

1. Configure view
2. Click **Export → SVG** button
3. Vector SVG downloads
4. Can be edited in Illustrator, Inkscape, etc.

### Export Graph Data

**Best For:** Analysis in external tools, backups

1. Apply desired filters
2. Click **Export → Data** button
3. JSON file downloads with:
   - All visible nodes (positions, types, properties)
   - All visible edges (types, labels)
   - Metadata (counts, timestamps)

**Use Cases:**
- Import into graph analysis tools
- Archive specific filtered views
- Share data with collaborators

### Export Traceability Report

**Best For:** Compliance, gap analysis, requirements management

1. Click **Export → Report** button
2. JSON file downloads with:
   - **Requirements** with traced goals
   - **Trace paths** (direct and indirect)
   - **Orphaned requirements** (no goal coverage)
   - **Orphaned goals** (no requirement support)
   - **Coverage statistics** (percentages)

**Sample Report Structure:**
```json
{
  "modelVersion": "1.0.0",
  "exportTimestamp": "2025-11-30T12:00:00Z",
  "requirements": [
    {
      "id": "req-123",
      "name": "User Authentication",
      "priority": "high",
      "goals": ["goal-456", "goal-789"],
      "tracePaths": [
        ["req-123", "outcome-abc", "goal-456"]
      ],
      "hasCoverage": true
    }
  ],
  "orphanedRequirements": ["req-999"],
  "orphanedGoals": ["goal-111"],
  "coverageStatistics": {
    "totalGoals": 50,
    "goalsWithRequirements": 45,
    "goalCoveragePercentage": 90,
    "totalRequirements": 48,
    "requirementsWithGoals": 47,
    "requirementCoveragePercentage": 97.9
  }
}
```

**Use Cases:**
- Requirements traceability matrices (RTM)
- Compliance audits (ISO, FDA, etc.)
- Identify coverage gaps
- Track architectural alignment

---

## Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Move focus to next control |
| `Shift+Tab` | Move focus to previous control |
| `Arrow Keys` | Navigate between nodes (when focused on graph) |
| `Enter` | Activate focused button/control |
| `Escape` | Close Inspector Panel |

### Graph Interaction

| Shortcut | Action |
|----------|--------|
| `Click` | Select node, show direct relationships |
| `Shift+Click` | Trace paths between two nodes |
| `Mouse Drag` | Pan canvas |
| `Scroll Wheel` | Zoom in/out |
| `Ctrl+Scroll` | Fine-grained zoom |

### Layout Controls

| Shortcut | Action |
|----------|--------|
| `F` | Fit to View |
| `1` | Force-Directed Layout |
| `2` | Hierarchical Layout |
| `3` | Radial Layout |
| `4` | Manual Layout |

*(Keyboard shortcuts 1-4 may require focus on layout selector)*

---

## Best Practices

### Performance Optimization

**For Large Models (500+ elements):**

1. **Use Filters**: Hide element types not relevant to current analysis
2. **Incremental Exploration**: Start with high-level elements (goals, stakeholders)
3. **Layout Selection**: Force-directed performs best with < 200 nodes
4. **Relationship Filtering**: Hide low-priority relationship types

### Effective Analysis Workflows

**Goal Coverage Analysis:**
1. Filter to show only Goals and Requirements
2. Export traceability report
3. Identify orphaned goals (no requirements)
4. Use path tracing to verify indirect coverage

**Stakeholder Impact Analysis:**
1. Click stakeholder node
2. Use "Show Network" for radial view
3. Trace downstream to see affected requirements
4. Export PNG for stakeholder presentation

**Conflict Resolution:**
1. Filter to show Conflicts relationship type
2. Identify conflicting requirements/goals
3. Use Inspector Panel to view conflict details
4. Document resolution strategy

### Presentation Preparation

1. **Filter** to relevant elements only
2. **Choose layout**: Hierarchical for clarity, Force for relationships
3. **Manually adjust** key nodes if needed (switch to Manual layout)
4. **Apply colors** via element properties (if supported)
5. **Fit to View** for complete diagram
6. **Export as SVG** for high-quality graphics

---

## Troubleshooting

### Graph Not Loading

**Symptom:** "No motivation layer elements found"

**Solutions:**
- Verify model contains a "Motivation" layer (case-insensitive)
- Check that layer has elements defined
- Reload page and try again

### Performance Issues

**Symptom:** Slow rendering, laggy interactions

**Solutions:**
- Apply filters to reduce visible elements
- Switch to Force-Directed layout (optimized for large graphs)
- Close browser tabs to free memory
- Reload page to clear cached layouts

### Filters Not Working

**Symptom:** Elements don't hide when filter toggled

**Solutions:**
- Check if "Clear All Filters" restores visibility
- Ensure filter panel checkboxes are responding to clicks
- Reload page to reset filter state

### Export Buttons Not Appearing

**Symptom:** Export buttons missing from Control Panel

**Solutions:**
- Ensure graph has loaded completely
- Check browser console for JavaScript errors
- Verify browser supports modern JavaScript (ES2020+)
- Try different browser (Chrome, Firefox, Edge recommended)

### Manual Layout Not Persisting

**Symptom:** Node positions reset after reload

**Solutions:**
- Ensure layout is set to "Manual" when dragging nodes
- Check browser localStorage is enabled (not in private mode)
- Verify same model ID is loaded
- Clear browser cache if experiencing corruption

### Path Tracing Not Highlighting

**Symptom:** Shift+Click doesn't highlight paths

**Solutions:**
- Ensure two nodes are selected (first click, then Shift+Click)
- Check if nodes are actually connected (may be no path)
- Clear existing highlighting first ("Clear Highlighting" button)
- Verify relationship type filters aren't hiding connecting edges

### Accessibility Issues

**Symptom:** Screen reader not announcing elements

**Solutions:**
- Ensure ARIA labels are present (check with browser inspector)
- Use Tab key to navigate to graph area
- Try different screen reader (NVDA, JAWS, VoiceOver)
- Check browser's accessibility settings are enabled

---

## Support

For additional help:

- **Documentation**: See `CLAUDE.md` for developer guidance
- **Issue Tracker**: Report bugs at GitHub repository
- **Examples**: Review `example-implementation/` directory for sample models

---

**End of User Guide**
