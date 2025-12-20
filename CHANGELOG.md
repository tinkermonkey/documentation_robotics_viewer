# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-12-20

### Added
- **Token-Based Authentication**: Full implementation of secure authentication system for DR CLI integration
  - `authStore.ts`: Central authentication state management with Zustand
  - Automatic token extraction from URL query parameters
  - Authorization header injection in all API requests
  - WebSocket authentication via query parameters
  - Backward compatible with non-authenticated local development
- **Reference Server Authentication**: Optional `--auth` flag for testing authentication flow locally
  - Secure token generation using Python's `secrets.token_urlsafe(32)`
  - Magic link display on server startup
  - Authentication middleware with proper static asset handling
  - Support for both `Authorization: Bearer` header and `?token=` query parameter validation
  - Constant-time token comparison to prevent timing attacks
- **Authentication Documentation**:
  - `DR_CLI_INTEGRATION.md`: Comprehensive guide for DR CLI team on authentication implementation
  - `TESTING_AUTHENTICATION.md`: Complete testing guide with scenarios and troubleshooting
  - `test-auth.sh`: Automated authentication testing script
- **Enhanced DR Model**: Expanded architecture model from 140 to 178 elements
  - Added UX layer components, interactions, and screens
  - Added Navigation layer breadcrumbs, menus, and routes
  - Improved model completeness and traceability
- **Claude Code Skills Reorganization**: Restructured DR skills for better organization
  - New layer-specific skills for all 12 DR layers (motivation through testing)
  - Added `dr-advisor` agent for architectural guidance
  - Enhanced `dr-architect` agent capabilities
  - Renamed skills to use consistent `dr_##_layer_name` pattern

### Changed
- Updated `embeddedDataLoader.ts` to inject authentication headers in all fetch requests
- Updated `websocketClient.ts` to support token-based WebSocket authentication
- Enhanced `EmbeddedLayout.tsx` to initialize WebSocket with authentication token
- Refactored reference server static asset detection to properly exclude API endpoints
- Improved Claude Code skill structure for better discoverability

### Fixed
- **Critical**: Fixed reference server static asset detection incorrectly treating `/api/*` paths as static assets
  - API endpoints were bypassing authentication due to missing file extension check
  - Added explicit exclusion of `/api/*` and `/ws` paths from static asset logic
- **Critical**: Fixed Python scoping issue with AuthConfig class using proper `__init__` method
- Fixed breadcrumbs YAML parsing error in navigation layer
- Resolved path resolution issues in embedded app

### Security
- Implemented cryptographically secure token generation for authentication
- Added constant-time token comparison to prevent timing attacks
- Protected API and WebSocket endpoints while keeping static assets public
- Validated authentication implementation matches DR CLI security patterns

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
