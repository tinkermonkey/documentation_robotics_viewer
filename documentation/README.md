# Documentation Robotics Viewer - Architecture Documentation

This directory contains the architectural documentation for the Documentation Robotics meta-model viewer.

## Documentation Structure

### Core Architecture
- [Architecture Overview](./architecture-overview.md) - High-level system architecture
- [Viewer Architecture](./viewer-architecture.md) - Core viewer implementation details
- [Data Model](./data-model.md) - Internal data structures and transformations
- [Node Library](./shape-library.md) - Custom React Flow nodes for meta-model entities
- [Layer Management](./layer-management.md) - Multi-layer visualization strategy
- [Layout Algorithms](./layout-algorithms.md) - Auto-layout integration
- [C4 Visualization](./C4_VISUALIZATION.md) - C4 model diagram features

### Visualization Optimization
- [Visualization Optimization](./VISUALIZATION_OPTIMIZATION.md) - System architecture for the feedback-driven optimization loop
- [Refinement Workflows](./REFINEMENT_WORKFLOWS.md) - CLI commands, automation, and example session walkthrough
- [Reference Diagrams](./REFERENCE_DIAGRAMS.md) - Catalog of canonical reference diagrams with sources and licenses
- [Troubleshooting Layout](./TROUBLESHOOTING_LAYOUT.md) - Common issues and solutions

### Development
- [Development Roadmap](./development-roadmap.md) - Progressive enhancement path
- [API Reference](./api-reference.md) - Component and utility APIs
- [Known Issues](./KNOWN_ISSUES.md) - Current limitations

## Quick Start

1. Review the [Architecture Overview](./architecture-overview.md)
2. Understand the [Data Model](./data-model.md)
3. Explore the [Node Library](./shape-library.md)
4. Check the [Development Roadmap](./development-roadmap.md)

### For Layout Quality Work

1. Read [Visualization Optimization](./VISUALIZATION_OPTIMIZATION.md) for system overview
2. Follow [Refinement Workflows](./REFINEMENT_WORKFLOWS.md) for commands and example session
3. Reference [Troubleshooting Layout](./TROUBLESHOOTING_LAYOUT.md) for common issues

## Technology Stack

- **React Flow (@xyflow/react)**: Core graph visualization engine
- **React**: UI framework
- **TypeScript**: Type safety
- **dagre**: Auto-layout algorithms
- **greadability.js**: Layout quality metrics
- **Zustand**: State management
- **React Query**: Data fetching and caching
- **Playwright**: E2E testing and visual comparison