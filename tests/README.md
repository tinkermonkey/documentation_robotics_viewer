# Test Suite Documentation

## Test Configurations

### 1. Default Tests (`playwright.config.ts`)

Basic tests for integration, unit, and component testing without the reference server.

**Runs:**
- Integration tests in `tests/integration/`
- Unit tests in `tests/unit/`
- Component tests
- Business layer tests
- Graph readability tests

**Usage:**
```bash
npm test              # Run all default tests
npm run test:debug    # Run with debugger
```

### 2. E2E Tests (`playwright.e2e.config.ts`)

Complete end-to-end tests with both servers automatically started.

**Runs:**
- `embedded-*.spec.ts` - Embedded app with WebSocket
- `c4-*.spec.ts` - C4 architecture views and accessibility
- All integration tests requiring the reference server

**Auto-starts:**
- Python reference server (port 8765)
- Frontend dev server (port 3001)

**Prerequisites:**
1. **Python Dependencies**:
   ```bash
   cd reference_server
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Playwright Browsers**:
   ```bash
   npx playwright install chromium
   ```

3. **System Dependencies** (REQUIRES SUDO):
   ```bash
   npx playwright install-deps chromium
   ```

**Usage:**
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with UI mode
npm run test:e2e:headed    # Run in headed mode
```

### 3. Refinement Tests (`playwright.refinement.config.ts`)

Layout quality refinement and metrics tests.

**Runs:**
- `tests/refinement/*.spec.ts` - Layout refinement algorithms
- `tests/metrics/*.spec.ts` - Quality metrics and regression checks

**Usage:**
```bash
npm run refine:motivation      # Refine motivation view
npm run refine:business        # Refine business view
npm run refine:c4              # Refine C4 view
npm run refine:interactive     # Interactive refinement (headed)
npm run refine:all             # Run all refinement tests
npm run metrics:report         # Generate metrics report
npm run metrics:regression-check    # Check for regressions
npm run metrics:all            # Run all metrics tests
```

## Test Categories

### Embedded App Tests (`embedded-*.spec.ts`)

Tests for the embedded viewer application with reference server integration.

**Files:**
- `tests/embedded-app.spec.ts` - Basic embedded app functionality
- `tests/embedded-dual-view.spec.ts` - Dual view (Graph/JSON/List) functionality
- `tests/embedded-motivation-view.spec.ts` - Motivation view specific tests

**Configuration:** `playwright.e2e.config.ts` (automatically starts both servers)

**What the tests verify:**
- WebSocket connection to reference server
- Model loading and display
- View mode switching (Model, Spec, Changesets, Motivation)
- Graph/JSON/List view toggling
- Layer panel visibility
- Annotation loading
- Version badge display
- Console error checking

Tests for C4 architecture views, accessibility, and performance.

**Files:**
- `tests/c4-architecture-view.spec.ts` - C4 architecture view rendering
- `tests/c4-accessibility.spec.ts` - WCAG accessibility compliance
- `tests/c4-performance.spec.ts` - Performance benchmarks

**Configuration:** `playwright.e2e.config.ts` (automatically starts both servers)

## Test Execution Flow

### E2E Tests Setup

The `playwright.e2e.config.ts` automatically:

1. **Starts Python Reference Server** (port 8765)
   - Serves the embedded app static files
   - Provides WebSocket endpoint at `/ws`
   - Serves REST API endpoints:
     - `GET /health` - Health check
     - `GET /api/spec` - JSON Schema specifications
     - `GET /api/model` - YAML instance model
     - `GET /api/changesets` - Changesets list
     - `GET /api/annotations` - Annotations

2. **Starts Vite Dev Server** (port 3001)
   - Serves the embedded React app
   - Proxies API calls to reference server

3. **Runs Tests**
   - Opens Chromium browser
   - Navigates to `http://localhost:3001/`
   - Executes test scenarios

## Troubleshooting

### "error while loading shared libraries: libglib-2.0.so.0"

**Cause:** Missing system dependencies for Chromium.

**Fix:**
```bash
npx playwright install-deps chromium
```

This requires sudo access. On systems without sudo (like Docker containers), you may need to install dependencies manually:

```bash
# Ubuntu/Debian
apt-get update && apt-get install -y \
  libglib2.0-0 \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2
```

### "Process from config.webServer was not able to start"

**Cause 1:** Python dependencies not installed.

**Fix:**
```bash
cd reference_server
source .venv/bin/activate
pip install -r requirements.txt
```

**Cause 2:** Port already in use.

**Fix:**
```bash
# Kill processes on ports 3001 and 8765
fuser -k 3001/tcp
fuser -k 8765/tcp
```

### "browserType.launch: Target page, context or browser has been closed"

**Cause:** Chromium browser not installed or missing system dependencies.

**Fix:**
```bash
npx playwright install chromium
npx playwright install-deps chromium
```

## CI/CD Integration

For CI environments, add this to your workflow:

```yaml
- name: Install dependencies
  run: |
    npm ci
    npx playwright install --with-deps chromium

- name: Install Python dependencies
  run: |
    cd reference_server
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt

- name: Run embedded tests
  run: npm run test:e2e
```

## Test Development Guidelines

### Adding New Embedded Tests

1. Add test file to `tests/` with prefix `embedded-`
2. Use existing test structure as template
3. Always check for console errors in critical operations
4. Use proper wait strategies (avoid `waitForTimeout` when possible)
5. Verify both visual elements and data correctness

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8765/');
    await page.waitForSelector('.embedded-app', { timeout: 10000 });
    await page.waitForSelector('.connection-status.connected', { timeout: 10000 });
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.click('.some-button');

    // Act
    await page.waitForSelector('.expected-element');

    // Assert
    await expect(page.locator('.expected-element')).toBeVisible();
  });
});
```

## Test Coverage

Current coverage:
- ✅ Embedded app loading
- ✅ WebSocket connection
- ✅ View mode switching
- ✅ Dual view functionality (Graph/JSON/List)
- ✅ Console error detection
- ✅ View preference persistence

Needed coverage (see `TESTING_STRATEGY.md`):
- ❌ Unit tests for NodeTransformer
- ❌ Unit tests for data loaders
- ❌ Integration tests for YAML parsing
- ❌ Visual regression tests
