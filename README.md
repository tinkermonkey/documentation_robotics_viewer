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
- `WebSocket /ws` - Real-time model updates (JSON-RPC 2.0 protocol)
- Embedded visualization UI integration
- Optional token-based authentication

The viewer connects to the CLI server on port 8080 (the DR CLI default, configurable via `--port`) to fetch model definitions and receive live updates via WebSocket.

### API Endpoints

**Health Check** (no auth required):
```bash
curl http://localhost:8080/health
```

**Get Model** (returns current architecture):
```bash
curl http://localhost:8080/api/model
```

**WebSocket Connection** (for real-time updates):
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');
```

### Real-Time Updates

The viewer maintains a WebSocket connection to receive model changes instantly:

```
Model File Changed (e.g., functions.yaml)
         ↓
    DR CLI detects change
         ↓
    WebSocket notification sent
         ↓
    Viewer updates graph automatically
         ↓
   Zero page refresh required
```

For comprehensive API documentation and WebSocket protocol details, see [DR CLI Integration Guide](documentation/DR_CLI_INTEGRATION_GUIDE.md).

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

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Dr Viewer (React 19)                      │
│  • Multi-layer graph visualization                           │
│  • 10 layer types (Motivation, Business, Tech, etc.)        │
│  • Interactive pan/zoom with React Flow                      │
│  • Real-time model updates via WebSocket                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
         HTTP (REST) + WebSocket (JSON-RPC 2.0)
                     │
┌────────────────────▼─────────────────────────────────────────┐
│            DR CLI Server (Node.js Express)                   │
│  • Model loading and parsing (YAML/JSON)                     │
│  • REST API endpoints (/api/model, /health)                  │
│  • WebSocket real-time updates                              │
│  • Optional authentication (token-based)                     │
│  • File watching and change detection                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
              File I/O (Direct)
                     │
┌────────────────────▼─────────────────────────────────────────┐
│         Architecture Models (YAML/JSON Files)                │
│  • manifest.yaml - Model orchestration                       │
│  • Layer files - Element definitions                         │
│  • Relationship definitions                                  │
│  • Schema specifications                                     │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Stateless Frontend** - No local state persistence between sessions
- **Live Updates** - Changes to model files appear instantly on screen
- **Layered Architecture** - 10 distinct architecture layers
- **Extensible** - Custom node types and layout algorithms
- **Accessible** - WCAG 2.1 AA compliance throughout

See [Architecture Overview](documentation/architecture-overview.md) for detailed system design.

## Technologies Used

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety and strict checking
- **Vite** - Fast build tool and dev server
- **@xyflow/react** - Interactive graph visualization (v12.9+)
- **dagre.js** - Graph layout algorithm
- **Zustand 5** - State management (stores)
- **Flowbite React** - UI component library
- **Tailwind CSS v4** - Utility-first CSS framework
- **TanStack Router** - Type-safe routing

### Backend (DR CLI Server)
- **Node.js Express** - Web server
- **JSON-RPC 2.0** - WebSocket protocol
- **YAML/JSON Parsing** - Model format support

### Testing
- **Playwright 1.57** - E2E testing framework
- **Vitest** - Unit testing
- **Storybook** - Component catalog and isolation

## Documentation

### Getting Started
- **[Getting Started](#getting-started)** - Quick setup instructions
- **[CI/CD Setup](#cicd-setup)** - Configure automated E2E tests with DR CLI in CI environments
- **[DR CLI Integration Guide](documentation/DR_CLI_INTEGRATION_GUIDE.md)** - Comprehensive API, WebSocket, and architecture documentation
- **[DR CLI Troubleshooting](documentation/DR_CLI_TROUBLESHOOTING.md)** - Quick reference for common issues and solutions

### Technical Guides
- **[API Client Generation](documentation/API_CLIENT_GENERATION.md)** - Full API client generation with React Query hooks and versioning strategy
- **[YAML Models Guide](documentation/YAML_MODELS.md)** - YAML model format specification
- **[Testing Guide](tests/README.md)** - Test setup and execution
- **[Testing Strategy](documentation/claude_thoughts/TESTING_STRATEGY.md)** - Testing approach and patterns
- **[Testing Reference Implementation](documentation/claude_thoughts/TESTING_REFERENCE_IMPLEMENTATION.md)** - DR CLI server migration guide
- **[Architecture Overview](documentation/architecture-overview.md)** - System design and components
- **[WebSocket Implementation](documentation/WEBSOCKET_JSONRPC_IMPLEMENTATION.md)** - WebSocket JSON-RPC protocol details
- **[Accessibility](documentation/ACCESSIBILITY.md)** - WCAG 2.1 AA compliance guidelines

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

# Sync API specification from upstream DR CLI repository
npm run sync:api-spec
```

### Syncing API Specification

The `npm run sync:api-spec` command pulls the latest API specification from the upstream Documentation Robotics CLI repository. This keeps the local `docs/api-spec.yaml` synchronized with the official API definition.

**When to use:**
- Before implementing changes to API client code
- When updating to a new version of the DR CLI
- When the API specification has changed in the upstream repository

**What it does:**
1. Fetches the latest `api-spec.yaml` from the official DR CLI repository
2. Saves it to `docs/api-spec.yaml` in your local project
3. The API specification is then used by the REST API client (`EmbeddedDataLoader`) to determine available endpoints

**Usage:**
```bash
npm run sync:api-spec
```

The command is a wrapper around the `scripts/sync-api-spec.sh` script, which handles the actual download and validation.

## CI/CD Setup

### Running E2E Tests in CI Environments

The E2E tests require the Documentation Robotics CLI server to be running. This section explains how to configure your CI/CD pipeline for automated test runs.

#### Installing DR CLI in CI

The CLI must be installed globally before running E2E tests. Add these steps to your CI workflow:

```bash
# Install DR CLI globally (v1.0.0 or higher)
npm install -g @tinkermonkey/dr-cli

# Verify installation
dr --version
```

#### GitHub Actions Example

Add this job to your `.github/workflows/ci.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Install DR CLI
        run: npm install -g @tinkermonkey/dr-cli@latest

      - name: Verify DR CLI
        run: dr --version

      - name: Start DR CLI server
        run: dr visualize ./example-implementation/ &

      - name: Wait for server to be ready
        run: |
          max_attempts=30
          attempt=0
          while [ $attempt -lt $max_attempts ]; do
            if curl -f http://localhost:8080/health > /dev/null 2>&1; then
              echo "Server is ready"
              exit 0
            fi
            attempt=$((attempt + 1))
            sleep 1
          done
          echo "Server failed to start"
          exit 1

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: test-results/
```

#### Other CI Systems

**GitLab CI** (`.gitlab-ci.yml`):
```yaml
e2e_tests:
  image: node:18
  before_script:
    - npm install
    - npx playwright install --with-deps
    - npm install -g @tinkermonkey/dr-cli@latest
    - dr visualize ./example-implementation/ &
    - sleep 5  # Wait for server to start
  script:
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
```

**CircleCI** (`.circleci/config.yml`):
```yaml
jobs:
  e2e-tests:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Install Playwright browsers
          command: npx playwright install --with-deps
      - run:
          name: Install DR CLI
          command: npm install -g @tinkermonkey/dr-cli@latest
      - run:
          name: Start DR CLI server
          command: dr visualize ./example-implementation/ &
      - run:
          name: Wait for server
          command: |
            for i in {1..30}; do
              curl http://localhost:8080/health && break
              sleep 1
            done
      - run:
          name: Run E2E tests
          command: npm run test:e2e
      - store_artifacts:
          path: test-results/
```

### Environment Variables

The following environment variables can be set in your CI environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `DR_CLI_PORT` | `8080` | Port for the DR CLI server |
| `DR_CLI_HOST` | `localhost` | Host for the DR CLI server |
| `TEST_TIMEOUT` | `30000` | Playwright test timeout (ms) |
| `DR_CLI_INSTALL_VERSION` | `latest` | Specific DR CLI version to install |

Example:
```yaml
env:
  DR_CLI_PORT: 8080
  DR_CLI_HOST: localhost
```

### Prerequisites for CI

Before running E2E tests in CI, ensure:

1. **Node.js 18+** is installed
2. **npm** is available
3. **Network access** to install npm packages
4. **Port 8080** is available (or configure `DR_CLI_PORT`)
5. **Disk space** for Playwright browsers (typically ~400MB)

### Troubleshooting CI Tests

If E2E tests fail in CI but pass locally:

1. **Verify DR CLI installation**:
   ```bash
   npm install -g @tinkermonkey/dr-cli@latest
   dr --version
   ```

2. **Check server startup logs**:
   ```bash
   dr visualize ./example-implementation/ --verbose
   ```

3. **Confirm network connectivity**:
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:8080/api/model
   ```

4. **Increase timeout for slower runners**:
   ```bash
   npm run test:e2e -- --timeout=60000
   ```

5. **Review test-results directory** after failure:
   ```bash
   ls -la test-results/
   cat test-results/*/results.json
   ```

For more advanced CI setup and troubleshooting, see [DR CLI Integration Guide - Troubleshooting](documentation/DR_CLI_INTEGRATION_GUIDE.md#troubleshooting).

### Troubleshooting

#### Server Connection Issues

```bash
# Check if DR CLI server is running
curl http://localhost:8080/health

# If "Connection refused", start the server
dr visualize ./my-model

# Check if port 8080 is in use (DR CLI default)
lsof -i :8080

# Kill process on port 8080 (if stuck)
kill -9 <PID>
```

#### WebSocket Connection Failed

```bash
# 1. Verify server is responding
curl -i http://localhost:8080/api/model

# 2. Check browser console for detailed error
# - Open DevTools (F12)
# - Look for error messages in Console tab
# - Check Network tab for failed ws:// connections

# 3. Clear browser cache and try again
# - Open DevTools → Storage
# - Click "Clear Site Data"
# - Reload page
```

#### Model Not Loading

```bash
# 1. Verify manifest file exists and is valid
cat my-model/manifest.yaml

# 2. Validate model structure
dr validate ./my-model

# 3. Check server logs (Terminal 1 where server runs)
# Look for error messages about YAML parsing

# 4. Ensure model path is correct
dr visualize $(pwd)/my-model  # Use absolute path
```

#### Port Already in Use

```bash
# Kill existing process on port 8080
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port (check DR CLI docs)
dr visualize --port 3001 ./my-model
```

#### Tests Failing

```bash
# 1. Ensure DR CLI server is running in separate terminal
dr visualize ./example-implementation/

# 2. Verify server is healthy
curl http://localhost:8080/health

# 3. Run tests with verbose output
npm run test:e2e -- --verbose

# 4. Check test results
ls -la test-results/
```

For detailed troubleshooting, see [DR CLI Integration Guide - Troubleshooting](documentation/DR_CLI_INTEGRATION_GUIDE.md#troubleshooting).

### Key URLs
- **Embedded Viewer**: http://localhost:3001
- **DR CLI Server**: http://localhost:8080

## License

ISC
