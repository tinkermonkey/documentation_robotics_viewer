# Spec Requirements: Optimize Graph Layouts

## Initial Description
Optimize the graph layouts for:
1. Spec viewer
2. Model viewers
3. Layer-set-specific graphs (motivation, business process, c4)

## Requirements Discussion

### First Round Questions

**Q1:** I assume you want to improve the visual quality and readability of the layouts (reducing edge crossings, better spacing, clearer hierarchies) rather than just raw performance optimization. Is that correct, or should we also focus on performance improvements for large graphs?
**Answer:** Focus on visual quality and readability

**Q2:** I'm thinking the primary pain points are: edge crossings making graphs hard to read, nodes too close together or too far apart, and inconsistent layouts across different views. Should we prioritize reducing edge crossings and improving spacing, or are there other layout quality issues you're experiencing?
**Answer:**
- Layouts have been inconsistent in displaying all of the entities, attributes, and links
- Too many edge crossings which make it hard to read

**Q3:** For the spec viewer specifically, I assume you're referring to the agent-os spec management system that would visualize spec relationships and dependencies. What specific graph relationships should this layout optimize for - should it show hierarchical relationships between specs, temporal relationships (roadmap ordering), or dependency relationships?
**Answer:** Hierarchy and relationships are the primary focus

**Q4:** I'm assuming you want to leverage the existing layout parameter refinement system in `src/core/services/refinement/layoutParameters.ts` that already defines tunable parameters for motivation, business, and C4 layouts. Should we extend this system to also cover spec viewer and general model viewer layouts, or create a different approach?
**Answer:** Extend the existing layout parameter system

**Q5:** Looking at the current implementation, dagre handles hierarchical layouts and there's a force-directed algorithm for motivation graphs. Should we add new layout algorithms (like orthogonal, radial, or circular layouts) as options, or focus on optimizing the existing dagre and force-directed implementations with better parameters?
**Answer:** Add new layout algorithms - orthogonal and force-directed are the most valuable

**Q6:** The codebase currently has Web Workers for layouts with more than 100 nodes but the motivation force-directed layout warns about performance for graphs with more than 50 nodes and suggests Web Worker migration. Should optimizing large graph performance (moving more layouts to Web Workers) be part of this spec?
**Answer:** Performance has not been an issue yet (so not a priority)

**Q7:** For layer-set-specific graphs, I'm assuming each needs different optimization strategies - motivation graphs benefit from radial layouts showing goal hierarchies, business process graphs need clear left-to-right flow, and C4 graphs need system boundary grouping. Should we create specialized layout engines for each, or one adaptive algorithm that adjusts based on graph type?
**Answer:** Yes, there should be specific layout engines for each layer-set and they should be optimized and debugged with example data sets from public defined datasets to make debugging and success easier to define

**Q8:** What should we explicitly NOT include in this optimization? For example: manual node positioning features, 3D layouts, animated layout transitions, or integration with external layout libraries beyond dagre and d3-force?
**Answer:**
- No 3D layouts yet
- Avoid animated transitions
- Definitely DO NOT exclude 3rd party layout engines - we should be relying on those as much as possible

### Existing Code to Reference

**Similar Features Identified:**

The codebase already has an extensive refinement system that should be matured into the optimization system:

- Refinement Loop Service: `/Users/austinsand/workspace/documentation_robotics_viewer/src/core/services/refinement/refinementLoop.ts`
  - Orchestrates iterative layout optimization
  - Applies layout parameters and calculates quality scores
  - Supports early stopping when targets are reached or improvement plateaus
  - Includes progress callbacks for UI updates

- Layout Parameters: `/Users/austinsand/workspace/documentation_robotics_viewer/src/core/services/refinement/layoutParameters.ts`
  - Defines tunable parameters for motivation, business, and C4 layouts
  - Includes parameter ranges, validation, and default values
  - Supports random generation and perturbation for optimization

- Optimization Strategies: `/Users/austinsand/workspace/documentation_robotics_viewer/src/core/services/refinement/optimizationStrategies.ts`
  - Implements gradient-free optimization methods
  - Supports grid search and random search strategies

- Metrics Dashboard Component: `/Users/austinsand/workspace/documentation_robotics_viewer/src/apps/embedded/components/refinement/MetricsDashboard.tsx`
  - Displays score progression charts
  - Shows metrics breakdown and iteration history
  - Allows reverting to previous iterations

- Quality Score Service: Referenced in refinementLoop.ts as `qualityScoreService.ts` (import path: `../comparison/qualityScoreService`)
  - Calculates readability scores
  - Provides quality metrics for layouts

- Layout Test Stories: Multiple Ladle stories for each layer type in `/Users/austinsand/workspace/documentation_robotics_viewer/src/apps/embedded/components/refinement/`
  - BusinessLayoutTest.stories.tsx
  - C4LayoutTest.stories.tsx
  - SideBySideComparison.stories.tsx
  - MetricsDashboard.stories.tsx
  - And more for all 12 layers

- Comprehensive Test Suite: `/Users/austinsand/workspace/documentation_robotics_viewer/tests/refinement/`
  - Automated refinement tests for all layers
  - Interactive refinement tests
  - E2E feedback flow tests

### Follow-up Questions

**Follow-up 1:** You mentioned layouts have been inconsistent in displaying all entities, attributes, and links. Is this a bug where some nodes/edges are missing from the rendered graph, or is it about the visual positioning making some elements hard to see/find? If it's missing elements, can you point to specific examples or scenarios where this occurs?
**Answer:** This is a bug where some nodes/edges are missing from the rendered graph

**Follow-up 2:** You want to rely on 3rd party layout engines as much as possible. Beyond dagre (currently used) and d3-force, are there specific layout libraries you'd like to integrate? For example: ELK (Eclipse Layout Kernel), Cytoscape.js layouts, Cola.js, or Graphviz WASM?
**Answer:** Start with ELK (Eclipse Layout Kernel) and Graphviz WASM so we can experiment and maybe remove some as needed

**Follow-up 3:** You mentioned using public defined datasets for each layer-set to make debugging and success easier. Do you have specific datasets in mind?
**Answer:** No specific datasets in mind - please research and pick good examples you can find

**Follow-up 4:** For orthogonal layouts (edges with right-angle bends), do you want this as a new layout algorithm option that users can select for any graph type, specifically for business process flows, or both?
**Answer:** Both - available globally but optimized for business processes

**Follow-up 5:** How will we measure if the layout optimization is successful? Should we implement automated layout quality metrics, visual comparison tools, user preference settings, or all of the above?
**Answer:** All of the above (automated metrics, visual comparison tools, user preference settings), AND there should be some existing tooling around the refinement system which should be matured into the optimization system we need it to be including iterative human-in-the-loop sessions (multi-turn)

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visual assets to analyze.

## Requirements Summary

### Functional Requirements

#### 1. Bug Fix: Missing Nodes and Edges
- Fix the bug where some nodes and edges are not being rendered in the graph
- Ensure all entities, attributes, and relationships from the data model are consistently displayed
- Add validation to detect and report missing graph elements

#### 2. Third-Party Layout Engine Integration
- Integrate ELK (Eclipse Layout Kernel) for advanced hierarchical and orthogonal layouts
- Integrate Graphviz WASM for industry-standard DOT layout algorithms
- Maintain existing dagre and d3-force implementations
- Create abstraction layer to allow switching between layout engines
- Support experimentation and potential removal of underperforming engines

#### 3. New Layout Algorithms
- Add orthogonal layout algorithm (edges with right-angle bends)
  - Available globally across all graph types
  - Optimized specifically for business process flows
- Enhance force-directed layout implementation
- Ensure all algorithms work across spec viewer, model viewers, and layer-specific graphs

#### 4. Layer-Specific Layout Engines
Create specialized layout engines optimized for each layer-set:
- **Motivation Layer**: Goal hierarchies with radial or hierarchical layouts
- **Business Process Layer**: Clear left-to-right or top-to-bottom flow with orthogonal edges
- **C4 Architecture Layer**: System boundary grouping with hierarchical container relationships
- **Spec Viewer**: Hierarchy and dependency relationship visualization
- **Model Viewers**: General-purpose multi-layer layouts

#### 5. Public Dataset Integration for Testing
Research and integrate public datasets for each layer type:
- Motivation layer: Enterprise goal hierarchy examples
- Business process: BPMN or standard business process models
- C4 architecture: Sample microservices architecture examples
- Use these datasets to make debugging and success criteria measurable
- Create synthetic test datasets for layers without public examples

#### 6. Automated Layout Quality Metrics
Implement comprehensive quality scoring:
- Edge crossing count detection and minimization
- Node overlap detection and prevention
- Edge length distribution analysis
- Graph density and spacing metrics
- Hierarchy clarity scoring
- Alignment and symmetry detection
- Extend existing `qualityScoreService.ts` with new metrics

#### 7. Visual Comparison Tools
- Side-by-side layout comparison interface (extend existing `SideBySideComparison.stories.tsx`)
- Before/after visualization of layout changes
- Multi-algorithm comparison view
- Screenshot capture and diff visualization
- Layout history and replay functionality

#### 8. User Preference Settings
- Save and load preferred layout configurations per graph type
- Per-user layout algorithm preferences
- Customizable layout parameter presets
- Export/import layout configuration profiles
- Default layout selection by layer type

#### 9. Human-in-the-Loop Refinement System
Mature the existing refinement system to support iterative multi-turn optimization:
- Interactive refinement sessions with real-time feedback
- User scoring and feedback collection during optimization
- Manual parameter adjustment interface
- "Accept/Reject/Refine" workflow for layout iterations
- Session state persistence and resume capability
- Extend existing `MetricsDashboard` component for interactive sessions
- Enhance `RefinementFeedbackPanel` for multi-turn interactions

#### 10. Spec Viewer Graph Support
- Create layout engines for spec relationship visualization
- Support hierarchical spec dependencies
- Visual grouping by spec status or phase
- Roadmap timeline integration (optional, based on user needs)

### Reusability Opportunities

The codebase has an extensive refinement infrastructure that should be leveraged:

**Components to Reuse:**
- `MetricsDashboard.tsx` - Score visualization and iteration history
- `SideBySideComparison` component for layout comparison
- `RefinementFeedbackPanel` for user feedback collection
- Layer-specific layout test stories (all 12 layers)

**Backend Patterns to Reference:**
- `refinementLoop.ts` - Orchestration pattern for iterative optimization
- `layoutParameters.ts` - Parameter definition and validation pattern
- `optimizationStrategies.ts` - Strategy pattern for different optimization approaches
- `qualityScoreService.ts` - Quality metric calculation pattern

**Services to Extend:**
- Extend `layoutParameters.ts` to include spec viewer and model viewer parameters
- Extend `qualityScoreService.ts` with edge crossing and overlap metrics
- Enhance `refinementLoop.ts` to support human-in-the-loop sessions
- Add new layout engine adapters following existing patterns

**Testing Infrastructure:**
- Playwright refinement test suite pattern (`tests/refinement/`)
- Ladle story-based testing approach for visual validation
- Interactive refinement test pattern (`interactive-refinement.spec.ts`)
- E2E feedback flow test pattern (`refinement-feedback-flow.spec.ts`)

### Scope Boundaries

**In Scope:**
- Fixing missing node/edge rendering bugs
- Integrating ELK and Graphviz WASM layout engines
- Adding orthogonal and enhanced force-directed layouts
- Creating layer-specific layout engines with optimized parameters
- Researching and integrating public test datasets
- Implementing automated quality metrics (edge crossings, overlaps, spacing)
- Building visual comparison tools for layout evaluation
- Adding user preference settings for layout configurations
- Maturing the refinement system for human-in-the-loop multi-turn optimization
- Creating spec viewer graph layouts for hierarchy and dependencies
- Extending existing refinement infrastructure

**Out of Scope:**
- 3D graph layouts (explicitly excluded for now)
- Animated layout transitions (explicitly excluded)
- Performance optimization for large graphs (not currently a priority)
- Real-time collaborative layout editing
- AI/ML-based layout prediction
- Manual drag-and-drop node positioning
- Integration with layout engines beyond ELK and Graphviz WASM initially
- Temporal/timeline-based layouts (unless needed for spec viewer)
- Cross-platform mobile layout optimization

**Future Enhancements (Not This Spec):**
- Web Worker migration for large graphs (mentioned as planned for Phase 3+)
- Real-time layout synchronization across multiple users
- Advanced constraint-based layout with user-defined rules
- Layout animation and smooth transitions between configurations
- 3D visualization support when requirements emerge

### Technical Considerations

#### Integration Points
- React Flow (@xyflow/react v12.0.0) - Core graph rendering
- dagre.js - Existing hierarchical layout (maintain)
- d3-force - Existing force-directed layout (maintain and enhance)
- ELK (Eclipse Layout Kernel) - New integration for advanced layouts
- Graphviz WASM - New integration for DOT-based layouts
- Existing refinement system infrastructure

#### Technology Stack Alignment
- TypeScript with strict typing for all new layout engines
- Vite build system compatibility
- React 19 component patterns
- Zustand for layout preference state management
- Tailwind CSS v4 for UI components
- Flowbite React for settings panels and comparison UI

#### Architecture Patterns to Follow
- Layout engine abstraction following existing patterns in `src/core/layout/`
- Service layer pattern for layout transformers (see `motivationGraphTransformer.ts`, `c4ViewTransformer.ts`)
- Parameter-driven configuration (extend `layoutParameters.ts` pattern)
- Strategy pattern for optimization algorithms (extend `optimizationStrategies.ts`)
- Component isolation using Ladle stories for testing
- Shared layout utilities in `src/core/` (no route/store dependencies)
- Route-specific layout UI in `src/apps/embedded/`

#### Existing System Constraints
- Performance targets: <3s initial render (500 elements), <800ms layout transitions
- Must work with both JSON Schema and YAML instance models
- Support for 12 architecture layers
- React Flow node dimension matching requirements (see `nodeTransformer.ts` precalculateDimensions)
- Web Worker threshold at >100 nodes (not changing for this spec)

#### Quality and Testing Requirements
- Extend Playwright test suite in `tests/refinement/` for new layout engines
- Add Ladle stories for visual regression testing of layouts
- Automated quality metric validation in test suite
- E2E tests for human-in-the-loop refinement sessions
- Visual comparison screenshot tests
- Accessibility compliance (WCAG 2.1 AA) for all new UI components

#### Data Requirements
- Research and document public datasets for each layer type
- Create synthetic test datasets where public data is unavailable
- Define success criteria and quality thresholds per layer type
- Establish baseline metrics for current layouts before optimization

#### Layout Engine Evaluation Criteria
- Edge crossing reduction effectiveness
- Node spacing and overlap prevention
- Hierarchy clarity and readability
- Computational performance (must meet <800ms target)
- Ease of parameter tuning
- Support for different graph topologies
- Integration complexity with React Flow

#### Human-in-the-Loop Requirements
- Session state persistence (save/restore optimization sessions)
- Real-time quality score updates during parameter adjustment
- Clear visual feedback on parameter changes
- Multi-turn conversation support for iterative refinement
- User feedback integration into scoring algorithms
- Progress tracking and history navigation
