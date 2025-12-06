# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-06

### Added
- **Motivation Layer**: Visualization of goals, requirements, and stakeholders with force-directed layout.
- **Business Layer**: Visualization of business capabilities and processes with swimlane and hierarchical layouts.
- **C4 Architecture**: Support for Context, Container, and Component diagrams with drill-down capabilities.
- **Embedded Mode**: Dedicated build and configuration for embedding the viewer in other applications.
- **Reference Server**: Python-based reference implementation of the backend API and WebSocket server.
- **Refinement Workflows**: Interactive tools for optimizing graph layouts and visual clarity.
- **Metrics & Testing**: Comprehensive test suite including visual regression, layout quality metrics, and performance benchmarks.
- **Data Model**: Full support for the `documentation-robotics` v1.0.0 meta-model.

### Changed
- Updated project structure to align with the new data model.
- Refactored graph builders to support the new schema definitions.
- Improved layout algorithms for better readability of complex graphs.

### Fixed
- Resolved path resolution issues in the embedded app.
- Fixed connection status indicator visibility in dual-view mode.
- Corrected schema validation for business layer relationships.
