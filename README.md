# Documentation Robotics Viewer

A React-based graph visualization tool for the documentation robotics meta-model. Uses [@xyflow/react](https://reactflow.dev) for interactive graph display and [dagre.js](https://github.com/dagrejs/dagre) for automatic node layout.

## Features

- **Multi-Layer Architecture Visualization**: View architectural models across 10 layers (Motivation, Business, Security, Application, Technology, API, DataModel, UX, Navigation, APM)
- **Interactive Graph**: Powered by React Flow, allowing pan, zoom
- **Automatic Layout**: Uses dagre.js to automatically arrange nodes in a hierarchical layout
- **YAML & JSON Support**: Load models from YAML instance files or JSON schemas
- **Reference Server**: Python FastAPI server for serving example models
- **Embedded Mode**: Standalone viewer component for integration

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
├── reference_server/              # Python FastAPI reference server
│   ├── main.py                    # Server implementation
│   ├── requirements.txt           # Python dependencies
│   └── .venv/                     # Python virtual environment
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
- Python 3.9+ (for reference server)

### Installation

```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers for testing
npx playwright install

# Setup Python reference server
cd reference_server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Verify setup
npm run verify
```

### Running the Reference Implementation

**Terminal 1 - Python Reference Server (port 8765):**
```bash
cd reference_server
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python main.py
```

**Terminal 2 - Embedded Viewer (port 3001):**
```bash
npm run dev:embedded
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

**See [TESTING_REFERENCE_IMPLEMENTATION.md](documentation/TESTING_REFERENCE_IMPLEMENTATION.md) for complete setup and testing instructions.**

### Running Tests

```bash
# All tests (unit + integration + E2E + embedded)
npm test

# Embedded tests only (requires reference server running)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

Expected results: **20/22 tests passing (91% pass rate)**

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

## Reference Server API

The Python FastAPI reference server provides:

- `GET /health` - Health check endpoint
- `GET /model` - Returns the full example model
- `GET /changesets` - Returns model changesets
- `WebSocket /ws` - Real-time updates (with graceful REST fallback)

See `reference_server/main.py` for implementation details.

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

### Backend (Reference Server)
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **PyYAML** - YAML parsing
- **WebSockets** - Real-time communication

### Testing
- **Playwright** - E2E testing framework
- **Vitest** - Unit testing (planned)

## Documentation

- **[Testing Reference Implementation](documentation/TESTING_REFERENCE_IMPLEMENTATION.md)** - Complete testing guide
- **[YAML Models Guide](documentation/YAML_MODELS.md)** - YAML model format specification
- **[Known Issues](documentation/KNOWN_ISSUES.md)** - Current limitations and issues
- **[Testing Strategy](documentation/TESTING_STRATEGY.md)** - Testing approach and patterns
- **[Testing Results](documentation/TESTING_RESULTS.md)** - Latest test execution results

## Project Status

**Version**: 0.1.0
**Test Coverage**: 91% (20/22 tests passing)

## Quick Reference

### Essential Commands
```bash
# Verify setup is complete
npm run verify

# Start reference server (Terminal 1)
cd reference_server && source .venv/bin/activate && python main.py

# Start embedded viewer (Terminal 2)
npm run dev:embedded

# Run all tests
npm test

# Run tests interactively
npm run test:e2e:ui
```

### Troubleshooting
```bash
# Check server health
curl http://localhost:8765/health

# Kill processes on ports
lsof -i :8765  # Find server process
lsof -i :3001  # Find viewer process
kill -9 <PID>  # Kill by process ID

# View test artifacts
ls -la test-results/
```

### Key URLs
- **Embedded Viewer**: http://localhost:3001
- **Reference Server Health**: http://localhost:8765/health
- **Reference Server Model**: http://localhost:8765/model

## License

ISC
