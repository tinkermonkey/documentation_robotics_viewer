# Specification: Graph Layout Optimization

## Goal
Improve graph layout visual quality and readability by fixing missing node/edge rendering bugs, integrating third-party layout engines (ELK, Graphviz WASM), adding orthogonal layouts, and maturing the existing refinement system into a comprehensive human-in-the-loop optimization platform.

## User Stories
- As a documentation viewer user, I want all nodes and edges to render consistently so that I can see the complete architecture model without missing elements
- As a user reviewing architecture diagrams, I want fewer edge crossings and better spacing so that I can easily understand relationships and hierarchies
- As a user optimizing layouts, I want to iteratively refine parameters with visual feedback so that I can achieve the best possible layout quality for my specific use case

## Specific Requirements

**Fix Missing Nodes and Edges Bug**
- Identify root cause of inconsistent node/edge rendering across all 12 layers
- Add validation service to detect missing graph elements by comparing source data to rendered React Flow nodes/edges
- Implement automated checks in graph transformer services to ensure all entities, attributes, and relationships are included
- Add developer warnings when elements are filtered or excluded from rendering
- Create diagnostic report showing which elements are missing and why

**Integrate ELK Layout Engine**
- Add Eclipse Layout Kernel (ELK) via npm package `elkjs`
- Create layout engine adapter following existing pattern in `src/core/layout/`
- Support ELK's layered (hierarchical), force, stress, and box layout algorithms
- Build React Flow adapter to convert ELK layout results to node positions
- Add ELK-specific parameters to `layoutParameters.ts` for tuning

**Integrate Graphviz WASM Layout Engine**
- Add Graphviz WASM via npm package `@hpcc-js/wasm`
- Create layout engine adapter for DOT-based algorithms (dot, neato, fdp, circo, twopi)
- Support conversion from React Flow graph to DOT format and back
- Handle node dimensions and edge routing from Graphviz output
- Add Graphviz-specific parameters to `layoutParameters.ts`

**Add Orthogonal Layout Algorithm**
- Implement orthogonal edge routing (right-angle bends) as global layout option
- Optimize specifically for business process layer with left-to-right flow
- Use ELK's orthogonal router or implement custom orthogonal routing algorithm
- Add parameter controls for bend minimization, spacing, and alignment
- Allow users to toggle orthogonal mode per graph or set as default for layer types

**Create Layout Engine Abstraction Layer**
- Define common interface for all layout engines (dagre, d3-force, ELK, Graphviz)
- Support runtime switching between layout engines via user preference
- Maintain backward compatibility with existing dagre and d3-force implementations
- Provide consistent parameter interface across engines where possible
- Allow experimentation and A/B testing of different engines on same data

**Layer-Specific Layout Engine Optimization**
- Motivation Layer: Radial or hierarchical layouts using ELK/Graphviz for goal hierarchies
- Business Process Layer: Left-to-right orthogonal flow optimized for swimlanes and process sequences
- C4 Architecture Layer: Hierarchical layouts with system boundary grouping and container nesting
- Data Model Layer: Entity-relationship layout optimized for minimizing edge crossings
- API Layer: Hierarchical or force-directed layouts showing endpoint relationships
- Technology/Application/Security Layers: Hierarchical layouts with dependency flow

**Public Dataset Integration for Testing**
- Research and document public datasets for motivation layer (enterprise goal examples)
- Find or create BPMN/business process datasets for business layer testing
- Identify C4 microservices architecture examples for C4 layer validation
- Create synthetic test datasets for layers without public examples (security, UX, navigation, APM)
- Store datasets in `tests/fixtures/public-datasets/` with source attribution
- Use datasets as baseline for automated quality metric comparisons

**Extend Automated Layout Quality Metrics**
- Add edge crossing count detection to `graphReadabilityService.ts`
- Implement node overlap detection enhancement with overlap area calculation
- Add edge length distribution variance metric for uniformity scoring
- Calculate graph density and symmetry metrics
- Implement alignment detection (horizontal/vertical alignment scoring)
- Add hierarchy clarity metric for hierarchical layouts
- Create layer-specific quality thresholds based on public dataset baselines

**Build Visual Comparison Tools**
- Extend `SideBySideComparison.tsx` to support multi-algorithm comparison (3+ layouts)
- Add screenshot diff visualization using image similarity service
- Implement layout history with thumbnail previews and quick revert
- Create before/after slider component for visual layout comparison
- Add quality metrics overlay showing scores on comparison views
- Support exporting comparison reports as PDF or image grid

**Implement User Preference Settings**
- Create layout preferences store using Zustand pattern
- Add per-layer default layout engine selection (saved to localStorage)
- Support custom parameter presets with user-defined names
- Implement export/import of layout configuration profiles (JSON format)
- Add UI panel for preference management in settings or right sidebar
- Persist user feedback history for machine learning future enhancement

**Mature Human-in-the-Loop Refinement System**
- Extend `RefinementLoop.ts` to support multi-turn interactive sessions
- Add session state persistence to localStorage or backend API
- Implement real-time parameter adjustment UI with live preview
- Create "Accept/Reject/Refine" workflow in `RefinementFeedbackPanel.tsx`
- Add manual parameter override controls alongside automated optimization
- Support pausing, resuming, and branching refinement sessions
- Integrate user qualitative feedback (ratings, comments) into quality scoring
- Build session history browser showing all iterations with thumbnails

## Visual Design

No visual assets provided.

## Existing Code to Leverage

**RefinementLoop Service (`src/core/services/refinement/refinementLoop.ts`)**
- Orchestrates iterative layout optimization with configurable strategies
- Supports early stopping, plateau detection, and progress callbacks
- Provides iteration history and best parameter tracking
- Use as foundation for human-in-the-loop sessions by extending with pause/resume and manual overrides

**LayoutParameters System (`src/core/services/refinement/layoutParameters.ts`)**
- Defines tunable parameters for motivation, business, and C4 layouts with ranges and validation
- Supports random generation and perturbation for optimization algorithms
- Extend to include parameters for ELK, Graphviz, orthogonal layouts, and additional layer types
- Use parameter range definitions as UI controls for manual adjustment

**QualityScoreService (`src/core/services/comparison/qualityScoreService.ts`)**
- Combines readability metrics with visual similarity for comprehensive quality assessment
- Provides quality classes (excellent, good, acceptable, poor, unacceptable) and threshold checking
- Extend with new metrics for edge crossings, overlaps, and alignment
- Use for automated regression detection and optimization feedback

**GraphReadabilityService (`src/core/services/metrics/graphReadabilityService.ts`)**
- Integrates greadability.js for edge crossing, angular resolution metrics
- Calculates extended metrics including edge length stats, node occlusion, aspect ratio
- Supports all 12 diagram types with layer-specific metric weights
- Extend with additional metrics and use as primary quality measurement engine

**MetricsDashboard Component (`src/apps/embedded/components/refinement/MetricsDashboard.tsx`)**
- Displays score progression charts and metrics breakdown
- Shows iteration history with revert capability
- Extend to support real-time updates during interactive sessions
- Add comparison views and quality threshold indicators

**SideBySideComparison Component (`src/apps/embedded/components/refinement/SideBySideComparison.tsx`)**
- Provides visual layout comparison interface
- Extend to support more than two layouts simultaneously
- Add diff visualization and quality score overlays
- Integrate with layout engine selection for A/B testing

**Existing Layout Engines**
- `src/core/layout/motivationLayouts.ts` - Force-directed and hierarchical layouts for motivation layer
- `src/core/layout/business/*.ts` - Swimlane, hierarchical, force-directed, and matrix layouts for business layer
- `src/apps/embedded/services/c4ViewTransformer.ts` - Dagre-based hierarchical layout for C4 diagrams
- Maintain these implementations and add new engines as additional options rather than replacements

**Test Infrastructure**
- `tests/refinement/` - Playwright test suite for automated and interactive refinement
- Ladle stories in `src/apps/embedded/components/refinement/*.stories.tsx` for visual regression testing
- Use these patterns to create tests for new layout engines and optimization features

## Out of Scope
- 3D graph layouts and visualizations (explicitly excluded for now)
- Animated layout transitions between configurations (avoid for performance and complexity)
- Real-time collaborative layout editing with multi-user synchronization
- AI/ML-based layout prediction or parameter recommendation (future enhancement)
- Manual drag-and-drop node positioning and constraint-based layouts
- Integration with layout engines beyond ELK and Graphviz WASM initially
- Performance optimization via Web Workers migration (not a current priority)
- Temporal or timeline-based layouts unless required for spec viewer
- Cross-platform mobile layout optimization and touch gesture support
- Layout animation and smooth transitions between parameter changes
