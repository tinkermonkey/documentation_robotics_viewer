# Authentication Testing for E2E Tests

## Overview

This document describes the authentication testing infrastructure for the Documentation Robotics Viewer E2E tests.

## Problem Statement

The Python reference server supports optional token-based authentication (`--auth` flag). E2E tests need to work in both modes:

1. **Development Mode** (no auth): Server runs without `--auth`, all endpoints public
2. **Production Mode** (with auth): Server runs with `--auth`, requires Bearer token

## Solution Architecture

### Components

1. **Global Setup** (`tests/global-setup.ts`)
   - Runs before all tests
   - Detects if authentication is required
   - Handles token retrieval and storage
   - Configures browser localStorage for tests

2. **Reference Server** (`reference_server/main.py`)
   - Middleware-based authentication
   - Token validation via query param or Authorization header
   - Public endpoints: `/health`, static assets
   - Protected endpoints: `/api/*`, `/ws` (when auth enabled)

3. **Auth Capture Script** (`scripts/capture-auth-token.sh`)
   - Starts reference server with `--auth`
   - Captures magic link token from server output
   - Saves to `.test-auth-token` file

### How It Works

#### Without Authentication (Default for E2E)

```bash
# Playwright config starts server without --auth
python main.py

# Global setup detects no auth required
✓ Authentication is DISABLED (test mode)

# Tests run normally
```

#### With Authentication

```bash
# Start server with auth manually
./scripts/capture-auth-token.sh

# Token is saved to .test-auth-token
# Outputs magic link

# Run tests
npm run test:e2e

# Global setup reads token file
✓ Auth token is valid
✓ Auth token configured in localStorage for tests

# Tests run with authentication
```

## Configuration Files

### `playwright.e2e.config.ts`

```typescript
export default defineConfig({
  // Global setup handles auth detection
  globalSetup: './tests/global-setup.ts',

  // Start servers without auth for development
  webServer: [
    {
      command: 'python main.py',  // No --auth flag
      url: 'http://localhost:8765/health',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3001',
    },
  ],
});
```

### `tests/global-setup.ts`

Key functions:

- `waitForServer()` - Wait for reference server to start
- `checkAuthRequired()` - Test `/api/model` for 401/403
- `verifyToken()` - Validate token works
- `setupAuthForTests()` - Configure localStorage in browser

## Usage Scenarios

### Scenario 1: Local Development (No Auth)

```bash
# Default - no setup needed
npm run test:e2e
```

**Flow:**
1. Playwright starts server without `--auth`
2. Global setup detects auth disabled
3. Tests run normally

### Scenario 2: Testing with Authentication

```bash
# Step 1: Start server with auth and capture token
./scripts/capture-auth-token.sh

# Step 2: Run tests (global setup reads .test-auth-token)
npm run test:e2e

# Step 3: When done, kill the auth server
kill <PID from script output>
```

**Flow:**
1. Script starts server with `--auth`, captures token
2. Token saved to `.test-auth-token`
3. Playwright connects to existing server (reuseExistingServer: true)
4. Global setup reads token file
5. Global setup verifies token
6. Global setup configures localStorage
7. Tests run with authentication

### Scenario 3: CI/CD Pipeline

```bash
# Option A: No auth (recommended for CI)
npm run test:e2e

# Option B: With auth (if needed)
echo "$AUTH_TOKEN" > .test-auth-token
npm run test:e2e
```

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Playwright E2E Test Run                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────────────┐
    │ Global Setup (tests/global-setup.ts)                │
    └─────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │ Check: GET /api/model                   │
        └─────────────────────────────────────────┘
                          │
          ┌───────────────┴────────────────┐
          │                                │
          ▼ 200/404/500                    ▼ 401/403
  ┌──────────────────┐           ┌─────────────────────┐
  │ Auth DISABLED    │           │ Auth REQUIRED       │
  │ (test mode)      │           │ (production mode)   │
  └──────────────────┘           └─────────────────────┘
          │                                │
          │                                ▼
          │                      ┌─────────────────────────┐
          │                      │ Read .test-auth-token   │
          │                      └─────────────────────────┘
          │                                │
          │                      ┌─────────┴──────────┐
          │                      │                    │
          │                      ▼ Found              ▼ Not Found
          │             ┌─────────────────┐    ┌──────────────┐
          │             │ Verify Token    │    │ FAIL         │
          │             └─────────────────┘    │ (see error)  │
          │                      │              └──────────────┘
          │             ┌────────┴────────┐
          │             ▼ Valid           ▼ Invalid
          │    ┌─────────────────┐  ┌──────────────┐
          │    │ Set localStorage│  │ FAIL         │
          │    └─────────────────┘  │ (bad token)  │
          │             │            └──────────────┘
          └─────────────┴────────────────┐
                                         ▼
                              ┌───────────────────────┐
                              │ Tests Run             │
                              └───────────────────────┘
```

## Error Messages

### "Authentication required but no token found"

**Cause**: Server has auth enabled, but no `.test-auth-token` file exists

**Solution**:
```bash
./scripts/capture-auth-token.sh
# OR
echo "YOUR_TOKEN" > .test-auth-token
```

### "Authentication token is invalid or expired"

**Cause**: Token in `.test-auth-token` doesn't work

**Solution**:
```bash
# Restart server with auth to get new token
pkill -f "python.*main.py"
./scripts/capture-auth-token.sh
```

### "Server did not become ready within 30000ms"

**Cause**: Reference server failed to start

**Solution**:
```bash
# Check server manually
cd reference_server
source .venv/bin/activate
python main.py

# Check for errors in output
```

## File Locations

- **Global Setup**: `tests/global-setup.ts`
- **Token File**: `.test-auth-token` (gitignored)
- **Capture Script**: `scripts/capture-auth-token.sh`
- **Server Code**: `reference_server/main.py`
- **E2E Config**: `playwright.e2e.config.ts`

## Best Practices

1. **Default to No Auth**: Keep E2E tests simple by running without auth
2. **Explicit Auth Testing**: Only test auth when specifically needed
3. **Clean Token Files**: Don't commit `.test-auth-token` to git
4. **Kill Old Servers**: Always check for stale servers before testing
   ```bash
   ps aux | grep "[p]ython.*main.py"
   pkill -f "python.*main.py"
   ```
5. **Use Global Setup**: Let global-setup.ts handle auth detection automatically

## Troubleshooting

### Issue: 401/403 Errors in Tests

**Debug Steps**:
1. Check if server has auth enabled
   ```bash
   curl http://localhost:8765/api/model
   # 401/403 = auth enabled
   # 200/404/500 = auth disabled
   ```

2. Check for stale servers
   ```bash
   ps aux | grep "[p]ython.*main.py"
   # Look for --auth flag in command
   ```

3. Kill stale servers and restart tests
   ```bash
   pkill -f "python.*main.py"
   npm run test:e2e
   ```

### Issue: Tests Pass Locally but Fail in CI

**Cause**: CI might have different auth config

**Solution**:
- Ensure CI runs tests WITHOUT `--auth` flag
- OR provide `$AUTH_TOKEN` environment variable in CI
- Update CI config to match local E2E setup

## Summary

✅ **Implemented:**
- Automatic auth detection in global setup
- Support for both auth and no-auth modes
- Token capture script for manual auth testing
- Browser localStorage configuration
- Clear error messages and troubleshooting guide

✅ **Verified:**
- Tests pass with auth disabled (development mode)
- Global setup correctly detects auth status
- Reference server authentication middleware works correctly

🔄 **Future Enhancements:**
- Auto-capture token from server logs when auth enabled
- Environment variable support for CI/CD
- Per-test auth configuration
- Mock auth mode for isolated testing

---

**Last Updated**: 2025-12-27
**Status**: Production Ready ✅
