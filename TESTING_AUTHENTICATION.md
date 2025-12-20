# Testing Authentication Flow

This guide explains how to test the token-based authentication flow that mirrors the DR CLI's behavior.

## Quick Start

### 1. Build the Viewer

```bash
npm run build
```

### 2. Start Server WITH Authentication

```bash
cd reference_server
python main.py --auth
```

You'll see output like this:

```
================================================================================
🔒 AUTHENTICATION ENABLED
================================================================================

Magic Link (copy and paste into browser):

  http://localhost:8765/?token=YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g

This link includes a secure authentication token.
All API requests will require authentication.
================================================================================

INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8765 (Press CTRL+C to quit)
```

### 3. Open the Magic Link

Copy the magic link and paste it into your browser. The viewer should load and work perfectly!

---

## Testing Scenarios

### Scenario 1: With Authentication (Production-like)

**Start server:**
```bash
cd reference_server
python main.py --auth
```

**Expected Behavior:**
- ✅ Magic link displayed on startup
- ✅ Opening magic link → Viewer loads successfully
- ✅ All API requests work (model, spec, annotations, etc.)
- ✅ WebSocket connects successfully
- ✅ Real-time updates work
- ❌ API requests without token → 401 Unauthorized
- ❌ API requests with invalid token → 403 Forbidden

**Test manually:**

```bash
# Without token (should fail)
curl http://localhost:8765/api/model
# Response: {"error":"Authentication required. Please provide a valid token."}
# HTTP 401

# With invalid token (should fail)
curl -H "Authorization: Bearer invalid" http://localhost:8765/api/model
# Response: {"error":"Invalid authentication token"}
# HTTP 403

# With valid token (should work)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8765/api/model
# Response: { model data... }
# HTTP 200
```

### Scenario 2: Without Authentication (Development Mode)

**Start server:**
```bash
cd reference_server
python main.py
```

**Expected Behavior:**
- ✅ No magic link displayed
- ✅ Opening http://localhost:8765/ → Viewer loads
- ✅ All API requests work without token
- ✅ WebSocket connects without token
- ✅ No authentication required anywhere

**Test manually:**

```bash
# Without token (should work in dev mode)
curl http://localhost:8765/api/model
# Response: { model data... }
# HTTP 200
```

---

## Automated Testing

### Run the Test Script

```bash
./test-auth.sh
```

This script will:
1. Check if server is running
2. Test health endpoint (no auth required)
3. Test API endpoint without token
4. If auth enabled: Test with invalid token
5. Display instructions for manual testing

### Example Output (Auth Enabled)

```
========================================================================
Testing Documentation Robotics Viewer Authentication Flow
========================================================================

✓ Server is running on http://localhost:8765

Test 1: Health Check (no auth required)
----------------------------------------
Response: {"status":"ok","version":"0.1.0"}
✓ Health check passed

Test 2: API Request Without Token
----------------------------------------
HTTP Status: 401
Response: {"error":"Authentication required. Please provide a valid token."}
✓ Correctly blocked (auth is enabled)

========================================================================
AUTHENTICATION IS ENABLED
========================================================================

Test 3: API Request With Invalid Token
----------------------------------------
HTTP Status: 403
Response: {"error":"Invalid authentication token"}
✓ Correctly rejected invalid token

========================================================================
Test Summary
========================================================================
✓ Health check: Works without auth
✓ API without token: Correctly blocked (401)
✓ API with invalid token: Correctly rejected (403)

To complete testing:
1. Copy the magic link from server startup
2. Open it in your browser
3. Verify the viewer loads and displays data
```

---

## Manual Browser Testing

### 1. Without Token (Should Fail with Auth Enabled)

Open: http://localhost:8765/

**Expected:**
- Page loads (static HTML/JS/CSS are public)
- Browser console shows API errors:
  - `401 Unauthorized` on `/api/model`
  - `401 Unauthorized` on `/api/spec`
  - WebSocket connection may fail or fall back to REST mode
- Viewer shows "Failed to load model" error

### 2. With Invalid Token (Should Fail)

Open: http://localhost:8765/?token=invalid-token-12345

**Expected:**
- Page loads
- Browser console shows:
  - `403 Forbidden` on API requests
- Viewer shows "Failed to load model" error

### 3. With Valid Token (Should Work)

Open the magic link from server startup:
http://localhost:8765/?token=YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g

**Expected:**
- ✅ Page loads
- ✅ No errors in console
- ✅ Model data loads successfully
- ✅ All views work (Spec, Model, Motivation, Architecture, Changesets)
- ✅ Graph renders
- ✅ Filters work
- ✅ WebSocket connects (check Network tab → WS)
- ✅ Connection status shows "Connected"

---

## Command-Line Options

### Reference Server

```bash
python reference_server/main.py [OPTIONS]
```

**Options:**
- `--port PORT` - Server port (default: 8765)
- `--host HOST` - Server host (default: 0.0.0.0)
- `--auth` - Enable token-based authentication

**Examples:**

```bash
# Default (no auth, port 8765)
python main.py

# With authentication
python main.py --auth

# Custom port
python main.py --port 3000

# Custom port with auth
python main.py --port 3000 --auth

# Custom host and port
python main.py --host localhost --port 9000
```

---

## Understanding the Auth Flow

### 1. Server Startup (with --auth)

```python
# Server generates secure token
AUTH_TOKEN = secrets.token_urlsafe(32)
# Example: "YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g"

# Creates magic link
magic_link = f"http://localhost:{port}/?token={AUTH_TOKEN}"
```

### 2. Browser Opens Magic Link

```
http://localhost:8765/?token=YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g
```

### 3. Viewer Extracts Token

```typescript
// authStore.ts
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
// Token stored in Zustand store
```

### 4. API Requests Include Token

```typescript
// embeddedDataLoader.ts
fetch('/api/model', {
  headers: {
    'Authorization': 'Bearer YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g'
  }
})
```

### 5. WebSocket Includes Token

```typescript
// websocketClient.ts
new WebSocket('ws://localhost:8765/ws?token=YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g')
```

### 6. Server Validates

```python
# AuthMiddleware validates on every request
def _validate_token(request):
    # Check Authorization header
    if auth_header.startswith("Bearer "):
        bearer_token = auth_header[7:]
        if secrets.compare_digest(bearer_token, AUTH_TOKEN):
            return True

    # Check query parameter
    query_token = request.query_params.get("token")
    if secrets.compare_digest(query_token, AUTH_TOKEN):
        return True

    return False
```

---

## What's Protected vs Public

### Protected (Require Authentication when --auth is used)

- `/api/model` - Model data
- `/api/spec` - Schema specifications
- `/api/link-registry` - Link registry
- `/api/changesets` - Changeset data
- `/api/annotations` - Annotations
- `/ws` - WebSocket connection

### Public (Always Accessible)

- `/health` - Health check
- `/` - Index page (HTML)
- `/assets/*` - JavaScript bundles, CSS, images
- All static files (`.html`, `.js`, `.css`, `.png`, etc.)

---

## Troubleshooting

### Issue: "Server is not running"

**Solution:** Start the server first:
```bash
cd reference_server
python main.py --auth
```

### Issue: "401 Unauthorized" errors

**Cause:** Token not in URL or not being sent in requests

**Check:**
1. URL has `?token=XXX` parameter
2. Browser console → Network tab → Check request headers
3. Should see `Authorization: Bearer XXX` header

**Solution:** Use the magic link from server startup

### Issue: "403 Forbidden" errors

**Cause:** Invalid or expired token

**Solution:**
1. Restart server to get new token
2. Use new magic link

### Issue: Viewer loads but shows "Failed to load model"

**Cause:** Authentication is enabled but viewer isn't sending token

**Check:**
1. Open browser console
2. Look for auth-related errors
3. Check Network tab for failed requests

**Solution:** Ensure you opened the magic link with token parameter

### Issue: WebSocket fails to connect

**Cause:** Token not included in WebSocket URL

**Check:**
1. Browser console → Network tab → WS tab
2. Check WebSocket URL
3. Should be: `ws://localhost:8765/ws?token=XXX`

**Solution:** Ensure authStore is providing token to websocketClient

---

## CI/CD Testing

### Test Script in CI

```bash
# Start server in background with auth
cd reference_server
python main.py --auth &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Run tests
./test-auth.sh

# Clean up
kill $SERVER_PID
```

### Playwright E2E Tests

You can add authentication testing to Playwright tests:

```typescript
test('should work with authentication token', async ({ page }) => {
  // Extract token from server (in real tests, this would be configured)
  const token = 'test-token-12345';

  // Navigate with token
  await page.goto(`http://localhost:8765/?token=${token}`);

  // Verify model loads
  await expect(page.locator('[data-testid="model-graph"]')).toBeVisible();
});
```

---

## Comparing to DR CLI

The reference server with `--auth` flag **exactly mirrors** the DR CLI behavior:

| Feature | Reference Server --auth | DR CLI `dr visualize` |
|---------|------------------------|----------------------|
| Token generation | ✅ `secrets.token_urlsafe(32)` | ✅ `secrets.token_urlsafe(32)` |
| Magic link | ✅ Displayed on startup | ✅ Displayed on startup |
| API protection | ✅ 401/403 errors | ✅ 401/403 errors |
| Static assets | ✅ Public | ✅ Public |
| WebSocket auth | ✅ Token in URL | ✅ Token in URL |
| Auth methods | ✅ Bearer + query param | ✅ Bearer + query param |
| Token validation | ✅ `secrets.compare_digest` | ✅ `secrets.compare_digest` |

This allows you to test the complete authentication flow locally without needing the DR CLI!
