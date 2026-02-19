# Documentation Robotics Viewer

A React-based graph visualization tool for the documentation robotics meta-model. Uses [@xyflow/react](https://reactflow.dev) for interactive graph display and [dagre.js](https://github.com/dagrejs/dagre) for automatic node layout.

## Features

- **Multi-Layer Architecture Visualization**: View architectural models across 10 layers (Motivation, Business, Security, Application, Technology, API, DataModel, UX, Navigation, APM)
- **Interactive Graph**: Powered by React Flow, allowing pan, zoom
- **Automatic Layout**: Uses dagre.js to automatically arrange nodes in a hierarchical layout
- **YAML & JSON Support**: Load models from YAML instance files or JSON schemas
- **Embedded Mode**: Standalone viewer component for integration
- **DR CLI Integration**: Works with the Documentation Robotics CLI server

## Project Structure

```
├── src/
│   ├── apps/
│   │   └── embedded/              # Embedded viewer application
│   │       ├── EmbeddedApp.tsx    # Main embedded app component
│   │       └── services/          # WebSocket client, data loader
│   ├── core/
│   │   ├── components/            # Shared React components
│   │   ├── services/              # Core services (graph transformer, YAML parser)
│   │   ├── stores/                # Zustand state stores
│   │   └── types/                 # TypeScript type definitions
│   └── main.tsx                   # Application entry points
├── example-implementation/        # Sample (self-reflective) model
│   ├── manifest.yaml              # Model orchestration file
│   └── model/                     # YAML layer files
├── tests/                         # Playwright test suites
│   ├── e2e/                       # E2E test helpers
│   ├── integration/               # Integration tests
│   └── unit/                      # Unit tests
├── documentation/                 # Project documentation
├── vite.config.ts                 # Vite configurations
├── playwright.config.ts           # Default test config
├── playwright.e2e.config.ts       # E2E test config (with servers)
└── package.json                   # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- Documentation Robotics CLI (for running the server)

### Installation

```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers for testing
npx playwright install

# Verify setup
npm run verify
```

### Running the Embedded Viewer

The embedded viewer connects to the Documentation Robotics CLI server:

```bash
# Terminal 1 - Start the DR CLI server
dr visualize [path-to-your-model]

# Terminal 2 - Start the development server
npm run dev:embedded
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

**Note**: The embedded viewer requires the DR CLI server to be running. The server provides the WebSocket endpoint and data layer for the visualization.

### Running Tests

```bash
# All tests (unit + integration)
npm test

# E2E tests (requires DR CLI server running)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

For E2E tests, start the DR CLI server first:
```bash
dr visualize [path-to-your-model]
```

### Component Catalog

The project includes a Storybook-based component catalog for developing and testing components in isolation:

```bash
# Start the component catalog (port 61001)
npm run storybook:dev

# Run all 578 story tests
npm run test:storybook

# Generate accessibility report
npm run test:storybook:a11y
```

Open [http://localhost:61001](http://localhost:61001) to browse component stories.

**Key Features:**
- **Isolated Testing**: Each story runs independently without global state pollution
- **Fast Iteration**: 40% faster startup than embedded app (2-3s vs 3-5s)
- **Automated Discovery**: 578 stories (510 components + 68 autodocs) are discoverable and testable in isolation
- **Accessibility Testing**: Built-in a11y validation via Storybook addon

### Building for Production

```bash
npm run build  # Builds embedded mode
```

The production build will be output to the `dist/` directory.

## DR CLI Server

The Documentation Robotics CLI server provides:

- `GET /health` - Health check endpoint
- `GET /api/model` - Returns the architecture model
- `WebSocket /ws` - Real-time model updates
- Embedded visualization UI integration

See the [DR CLI documentation](https://github.com/tinkermonkey/documentation_robotics) for details.

## Model Format

The viewer supports two model formats:

### 1. YAML Instance Models (v0.1.0)
Hierarchical YAML files with `manifest.yaml` orchestration:
```yaml
# manifest.yaml
version: 0.1.0
schema: documentation-robotics-v1
layers:
  business:
    order: 2
    path: model/02_business/
    enabled: true
```

See [YAML_MODELS.md](documentation/YAML_MODELS.md) for complete specification.

### 2. JSON Schema Models (v0.1.1)
Single JSON file per layer with schema definitions and element instances.

See existing layer files in `example-implementation/model/` for examples.

## Technologies Used

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **@xyflow/react** - Interactive graph visualization
- **dagre.js** - Graph layout algorithm
- **Zustand** - State management
- **Flowbite React** - UI component library
- **Tailwind CSS** - Utility-first CSS framework

### Testing
- **Playwright** - E2E testing framework
- **Vitest** - Unit testing (planned)

## Documentation

- **[YAML Models Guide](documentation/YAML_MODELS.md)** - YAML model format specification
- **[Testing Guide](tests/README.md)** - Test setup and execution
- **[Known Issues](documentation/KNOWN_ISSUES.md)** - Current limitations and issues
- **[Testing Strategy](documentation/TESTING_STRATEGY.md)** - Testing approach and patterns

## Project Status

**Version**: 0.1.0
**Test Coverage**: 91% (20/22 tests passing)

## Quick Reference

### Essential Commands
```bash
# Verify setup is complete
npm run verify

# Start DR CLI server (Terminal 1)
dr visualize [path-to-your-model]

# Start embedded viewer (Terminal 2)
npm run dev:embedded

# Run all tests
npm test

# Run E2E tests with UI
npm run test:e2e:ui
```

### Troubleshooting
```bash
# Check DR CLI server health
curl http://localhost:3000/health

# Kill processes on ports
lsof -i :3000  # Find DR CLI server process
lsof -i :3001  # Find viewer process
kill -9 <PID>  # Kill by process ID

# View test artifacts
ls -la test-results/
```

### Key URLs
- **Embedded Viewer**: http://localhost:3001
- **DR CLI Server**: http://localhost:3000

## License

ISC
