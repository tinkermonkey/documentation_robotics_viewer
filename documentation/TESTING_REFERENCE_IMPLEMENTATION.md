# Testing the Reference Implementation

This guide explains how to test the embedded viewer with the Python reference server.

## Overview

The reference implementation consists of two components:
1. **Python Reference Server** (FastAPI) - Serves the example model on port 8765
2. **Embedded Viewer** (React + Vite) - Displays the model on port 3001

## Prerequisites

### 1. Node.js Dependencies
```bash
npm install
```

### 2. Python Virtual Environment
```bash
cd reference_server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Playwright Browsers (for testing)
```bash
npx playwright install
```

## Running the Reference Implementation

### Option 1: Manual Startup (Recommended)

**Terminal 1 - Start Python Reference Server:**
```bash
cd reference_server
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8765 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Terminal 2 - Start Embedded Viewer:**
```bash
npm run dev:embedded
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
```

**Test in Browser:**
Open http://localhost:3001 in your browser. You should see:
- Header: "Documentation Robotics Viewer"
- Connection status: "Connected" (green)
- Left sidebar with layer controls (Motivation, Business, Security, etc.)
- Graph canvas with 182 nodes and 31 edges

### Option 2: npm start (Legacy)

**Note**: The `npm start` command references `server/index.cjs` which is a Node.js server. This is deprecated in favor of the Python reference server.

To use the Python reference server with a single command, you can modify `package.json`:

```json
"start": "cd reference_server && source .venv/bin/activate && python main.py & npm run dev:embedded"
```

However, this may not work on all platforms. Manual startup (Option 1) is more reliable.

## Running Tests

### Full Test Suite
```bash
npm test
```

This runs all tests (unit + integration + E2E + embedded). Expected results:
- **20/22 tests passing** (91% pass rate)
- 2 known failing tests related to specific graph features

### Test Suites by Type

**Unit Tests Only:**
```bash
npm run test:unit
```

**E2E Tests Only:**
```bash
npm run test:e2e
```

**Embedded Tests Only (requires reference server running):**
```bash
npm run test:embedded
```

**Interactive Test UI:**
```bash
npm run test:e2e:ui
```

**Headed Mode (see browser):**
```bash
npm run test:e2e:headed
```

### Important: Reference Server Must Be Running

The embedded tests require the Python reference server to be running on port 8765. If you see connection errors, make sure:

```bash
# Check if server is running
curl http://localhost:8765/health

# Expected response:
{"status":"healthy"}
```

## Verification Checklist

After starting both servers, verify:

- [ ] Python server responds to http://localhost:8765/health
- [ ] Embedded viewer loads at http://localhost:3001
- [ ] Connection status shows "Connected" (green checkmark)
- [ ] Layer panel shows 10 layers (Motivation, Business, Security, etc.)
- [ ] All layers have checkmarks enabled
- [ ] Graph displays 182 nodes
- [ ] Console shows: `[NodeTransformer] Created 192 nodes and 31 edges`
- [ ] No WebSocket errors in console (REST fallback is normal)

## Common Issues

### Issue: "Connection failed" in viewer

**Cause**: Python reference server not running

**Solution**:
```bash
cd reference_server
source .venv/bin/activate
python main.py
```

### Issue: "Port 8765 already in use"

**Cause**: Previous server instance still running

**Solution**:
```bash
# Find process
lsof -i :8765

# Kill process
kill -9 <PID>

# Or on Windows:
netstat -ano | findstr :8765
taskkill /PID <PID> /F
```

### Issue: "Port 3001 already in use"

**Cause**: Previous Vite instance still running

**Solution**:
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: Test failures mentioning "ECONNREFUSED"

**Cause**: Reference server not running during test execution

**Solution**: Start the reference server before running embedded tests

### Issue: Only 170 nodes visible instead of 182

**Cause**: Motivation layer hidden by default (this was fixed)

**Solution**: Verify `src/core/stores/layerStore.ts:32` has:
```typescript
[LayerType.Motivation]: { visible: true, opacity: 1, locked: false },
```

### Issue: Zero edges visible

**Cause**: ID mismatch in relationship extraction (this was fixed)

**Solution**: Verify `reference_server/main.py` extracts simple IDs from dot-notation (lines 322-336)

## Expected Test Results

### Passing Tests (20/22)
- ✅ Health endpoint accessible
- ✅ Server serves model data
- ✅ Client connects successfully
- ✅ Model data has correct structure
- ✅ All 182 elements present
- ✅ Graph renders 192 nodes (182 elements + 10 containers)
- ✅ 31 edges render correctly
- ✅ Layer controls visible
- ✅ All layers initially visible
- ✅ Nodes positioned correctly
- ✅ Multiple node types detected (businessProcess, layerContainer)
- ✅ Nodes distributed across layers (12 unique Y positions)
- ✅ Connection status indicator works
- ✅ WebSocket fallback to REST works
- ✅ No console errors (except filtered WebSocket detection)
- ✅ YAML model loads successfully
- ✅ Manifest parsed correctly
- ✅ OpenAPI specs extracted
- ✅ JSON schemas extracted
- ✅ Projection rules parsed

### Known Failing Tests (2/22)
- ❌ Specific graph feature test 1
- ❌ Specific graph feature test 2

## Development Workflow

1. **Make changes to code**
2. **Restart affected server:**
   - Frontend changes: Vite will auto-reload
   - Backend changes: Restart Python server (Ctrl+C, then `python main.py`)
3. **Run relevant tests:**
   ```bash
   npm run test:embedded  # For embedded viewer changes
   npm run test:e2e       # For core viewer changes
   npm test               # Full suite
   ```
4. **Check test results** in `test-results/` directory

## Test Artifacts

After running tests, check `test-results/` for:
- **Screenshots**: Visual snapshots of rendered graphs
- **Trace files**: Playwright execution traces
- **Diagnostic logs**: Console output and network requests

View traces with:
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Resources

- **Main Documentation**: `documentation/`
- **Known Issues**: `documentation/KNOWN_ISSUES.md`
- **Testing Strategy**: `documentation/TESTING_STRATEGY.md`
- **Testing Results**: `documentation/TESTING_RESULTS.md`
- **YAML Models Guide**: `documentation/YAML_MODELS.md`

## Quick Reference Commands

```bash
# Setup
npm install
cd reference_server && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..
npx playwright install

# Run
# Terminal 1:
cd reference_server && source .venv/bin/activate && python main.py

# Terminal 2:
npm run dev:embedded

# Test
npm test                    # All tests
npm run test:embedded       # Embedded tests only
npm run test:e2e:ui        # Interactive test UI

# Verify
curl http://localhost:8765/health                    # Server health
open http://localhost:3001                           # Viewer in browser
```

---

**Last Updated**: 2025-11-28
**Reference Implementation Version**: 1.0.0
**Test Pass Rate**: 91% (20/22 tests passing)
