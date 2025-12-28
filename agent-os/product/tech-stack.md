# Tech Stack

## Framework & Runtime

- **Frontend Framework:** React 19 - Modern UI framework with concurrent rendering and automatic batching
- **Language:** TypeScript 5.9+ - Strict type safety across entire codebase
- **Build Tool:** Vite 7.2+ - Fast development server with HMR and optimized production builds
- **Package Manager:** npm - Standard Node.js package management

## Frontend

- **UI Framework:** React 19.2.0 - Component-based architecture with hooks and concurrent features
- **Graph Visualization:** @xyflow/react (React Flow) 12.9.3 - Interactive node-based graph rendering with pan/zoom/selection
- **CSS Framework:** Tailwind CSS v4.1.17 - Utility-first CSS with JIT compilation and dark mode support
- **UI Component Library:** Flowbite React 0.12.13 - Pre-built React components based on Tailwind (Card, Badge, Button, Modal, etc.)
- **Icon Library:** Lucide React 0.562.0 - Consistent, customizable SVG icon set
- **Routing:** TanStack Router 1.139.12 - Type-safe routing with nested layouts and data loading
- **State Management:** Zustand 5.0.8 - Lightweight, unopinionated state management (modelStore, annotationStore, filterStore)

## Graph & Layout

- **Layout Algorithm:** dagre 0.8.5 - Hierarchical directed graph layout engine for automatic node positioning
- **Force Simulation:** d3-force 3.0.0 - Physics-based layout algorithms (force-directed, radial)
- **Graph Utilities:** @xyflow/react built-in edge routing, connection validation, and viewport management

## Backend (Reference Server)

- **Web Framework:** FastAPI (Python 3.9+) - Modern async Python web framework with automatic OpenAPI docs
- **Server:** Uvicorn - ASGI server for running FastAPI applications
- **YAML Parsing:** PyYAML - Parse YAML instance models and manifest files
- **WebSocket Protocol:** FastAPI WebSocket support - Real-time bidirectional communication for annotations and presence
- **CORS Handling:** FastAPI CORS middleware - Enable cross-origin requests from frontend

## Data & File Processing

- **YAML Processing:** js-yaml 4.1.1 - Parse YAML model files in browser and Node.js
- **UUID Generation:** uuid 13.0.0 - Generate unique identifiers for model elements
- **Image Export:** html-to-image 1.11.13 - Convert React components to PNG/SVG for graph export
- **Archive Generation:** jszip 3.10.1 - Create ZIP archives for bulk exports
- **Image Processing:** sharp 0.34.5 - Server-side image optimization and format conversion

## Testing & Quality

- **E2E Testing:** Playwright 1.57.0 - Cross-browser end-to-end testing with parallel execution
- **Accessibility Testing:** @axe-core/playwright 4.11.0 - Automated WCAG 2.1 AA compliance checks
- **Test Configurations:**
  - `playwright.config.ts` - Default test configuration
  - `playwright.e2e.config.ts` - E2E tests with server orchestration
  - `playwright.refinement.config.ts` - Visual refinement and metrics tests
  - `playwright.auth.config.ts` - Authentication flow tests
- **Component Testing:** Ladle 5.1.1 - Isolated component development and testing (40% faster than full app)
- **Visual Regression:** Custom Playwright scripts with ssim.js 3.5.0 for image similarity comparison
- **Code Quality:**
  - TypeScript strict mode enabled
  - React strict mode enabled for double-render detection

## Development Tools

- **Component Catalog:** Ladle 5.1.1 - Fast, lightweight component story viewer (alternative to Storybook)
- **PostCSS:** @tailwindcss/postcss 4.1.17 - CSS processing for Tailwind
- **Module Bundler:** Vite 7.2.4 with @vitejs/plugin-react 5.1.1
- **Code Transformation:** recast 0.23.11 - AST-based code generation for test scaffolding

## Deployment & Infrastructure

- **Hosting:** Not yet defined (static site hosting like Vercel, Netlify, or AWS S3 + CloudFront recommended)
- **CI/CD:** GitHub Actions (inferred from repository, not yet configured)
- **Development Server Orchestration:** Bash scripts (`scripts/start-servers.sh`, `scripts/verify-setup.sh`)
- **Environment Management:** Python venv for reference server, npm for frontend

## Third-Party Services

- **Authentication:** Not yet implemented (future: Auth0, Clerk, or custom JWT)
- **Monitoring:** Not yet implemented (future: Sentry for error tracking, Datadog for APM)
- **Analytics:** Not yet implemented (future: PostHog or Plausible for privacy-focused analytics)

## Performance Optimizations

- **Web Workers:** Custom layout worker (`public/workers/layoutWorker.js`) for offloading graph layout calculations >100 nodes
- **Viewport Culling:** React Flow built-in virtualization renders only visible nodes
- **Async Rendering:** Layout calculations run asynchronously to maintain 60fps
- **Code Splitting:** Vite automatic code splitting for route-based chunks
- **Image Optimization:** sharp for server-side optimization, html-to-image for client-side rendering

## Architecture Patterns

- **Component Organization:**
  - `src/core/` - Framework-agnostic, reusable components with no route/store dependencies
  - `src/apps/embedded/` - Route-specific components with store integration
  - `src/services/` - Shared business logic and API clients
- **State Management Pattern:**
  - Zustand stores as single source of truth
  - WebSocket events handled in route components
  - Optimistic UI updates in annotationStore
- **Styling Strategy:**
  - Tailwind utility classes only (no CSS modules)
  - Flowbite React for complex components
  - Dark mode via `dark:` variants
- **Testing Strategy:**
  - E2E tests for user flows
  - Component stories for isolated development
  - Visual regression for layout refinement
  - Accessibility audits on every test run

## Version Information

- **Project Version:** 0.2.3
- **Node.js:** v18+ required
- **Python:** 3.9+ required for reference server
- **Target Browsers:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge) - last 2 versions
