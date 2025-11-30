# Test Suite Documentation

## Test Categories

### 1. Embedded App Tests (`embedded-*.spec.ts`)

Tests for the embedded viewer application with reference server integration.

**Files:**
- `tests/embedded-app.spec.ts` - Basic embedded app functionality
- `tests/embedded-dual-view.spec.ts` - Dual view (Graph/JSON/List) functionality (SKIPPED BY DEFAULT)

**Configuration:** `playwright.embedded.config.ts`

**Prerequisites:**
1. **Python Dependencies** (for reference server):
   ```bash
   cd reference_server
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Playwright Browsers**:
   ```bash
   npx playwright install chromium
   ```

3. **System Dependencies** (REQUIRES SUDO - tests are skipped if unavailable):
   ```bash
   npx playwright install-deps chromium
   ```

**Running:**
```bash
npm run test:embedded
```

**IMPORTANT:** `embedded-dual-view.spec.ts` is skipped by default because it requires system libraries
(libglib-2.0.so.0, etc.) that need sudo to install. The tests are VALID and test real functionality.
To enable them:
1. Install system dependencies with sudo: `npx playwright install-deps chromium`
2. Remove `.skip` from the `test.describe.skip` line in `embedded-dual-view.spec.ts`

**What the tests verify:**
- WebSocket connection to reference server
- Model loading and display
- View mode switching (Model, Spec, Changesets, Motivation)
- Graph/JSON/List view toggling
- Layer panel visibility
- Annotation loading
- Version badge display
- Console error checking

**Known Issues:**
- Tests require system libraries (`libglib-2.0.so.0`, etc.) which may not be available in all environments
- If you see "error while loading shared libraries", run `npx playwright install-deps chromium` with sudo

### 2. E2E Tests (`playwright.e2e.config.ts`)

End-to-end tests for the main debug application.

**Configuration:** `playwright.e2e.config.ts`

### 3. Unit Tests (`playwright.unit.config.ts`)

Fast, isolated tests for specific components and services.

**Files:**
- `tests/unit/motivationGraphBuilder.spec.ts`

**Configuration:** `playwright.unit.config.ts`

## Test Execution Flow

### Embedded Tests Setup

The `playwright.embedded.config.ts` automatically:

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
   - Navigates to `http://localhost:8765/`
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
  run: npm run test:embedded
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
