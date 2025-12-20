# DR CLI Integration Guide

## Authentication Flow

The Documentation Robotics Viewer now supports **token-based authentication** for secure integration with the DR CLI `dr visualize` command.

## How It Works

### 1. Server Side (DR CLI)

When you run `dr visualize`, the server:

1. **Generates a secure token** using cryptographic random generation:
   ```python
   self.token = secrets.token_urlsafe(32)
   ```

2. **Creates a "magic link"** with the token embedded:
   ```
   http://localhost:8080/?token=YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g
   ```

3. **Validates the token** on all API requests and WebSocket connections via middleware
4. **Allows static assets** (HTML, JS, CSS) without authentication (they're public)

### 2. Client Side (Viewer)

The viewer automatically:

1. **Extracts the token** from the URL query parameter on page load
2. **Stores it** in the authentication store (`authStore.ts`)
3. **Includes it in all API requests** via `Authorization: Bearer <token>` header
4. **Includes it in WebSocket connection** via `?token=<token>` query parameter

## Authentication Implementation

### Token Extraction

Token is extracted from the URL on app initialization:

```typescript
// src/apps/embedded/stores/authStore.ts
function extractTokenFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}
```

### API Request Authentication

All API requests include the Authorization header:

```typescript
// src/apps/embedded/services/embeddedDataLoader.ts
function getAuthHeaders(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) return {};

  return {
    'Authorization': `Bearer ${token}`
  };
}

// Used in all fetch calls:
const response = await fetch(`${API_BASE}/model`, {
  headers: getAuthHeaders()
});
```

### WebSocket Authentication

WebSocket connection includes token in URL:

```typescript
// src/apps/embedded/services/websocketClient.ts
private getAuthenticatedUrl(): string {
  if (!this.token) return this.url;

  const separator = this.url.includes('?') ? '&' : '?';
  return `${this.url}${separator}token=${this.token}`;
}

// Token is set on initialization:
websocketClient.setToken(token);
websocketClient.connect(); // Connects to ws://localhost:8080/ws?token=XXX
```

## Development vs Production

### Development Mode (No Token)

When running locally without the DR CLI (e.g., `npm run dev`):

- **No token** in URL → Authentication is bypassed
- API requests work **without** Authorization header
- WebSocket connects **without** token parameter
- This allows local development with the reference server

### Production Mode (With Token)

When launched via `dr visualize`:

- **Token present** in URL → Authentication is required
- All API requests **include** Authorization header
- WebSocket connection **includes** token parameter
- Invalid/missing tokens return 401 Unauthorized or 403 Forbidden

## Server-Side Token Validation

The DR CLI visualization server validates tokens in two ways:

### 1. Query Parameter

```
GET /api/model?token=YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g
```

### 2. Authorization Header (Preferred)

```
GET /api/model
Authorization: Bearer YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g
```

The viewer uses **Authorization headers** for API requests and **query parameters** for WebSocket connections (since WebSocket doesn't support custom headers in browser implementations).

## Protected vs Unprotected Endpoints

### Protected (Require Authentication)

- `/api/*` - All API endpoints
- `/ws` - WebSocket connection

### Unprotected (Public)

- `/` - Index page
- `/*.html` - HTML files
- `/*.js` - JavaScript bundles
- `/*.css` - Stylesheets
- `/*.png`, `/*.jpg`, etc. - Images
- `/health` - Health check endpoint

## Error Handling

### 401 Unauthorized

**Cause:** No token provided
**Message:** "Authentication required. Please provide a valid token."

### 403 Forbidden

**Cause:** Invalid token provided
**Message:** "Invalid authentication token"

### Client Behavior

The viewer gracefully handles missing authentication:

- **API requests fail** with descriptive error messages
- **WebSocket falls back** to REST mode if connection fails
- **Development mode works** without tokens (for local testing)

## Security Features

1. **Cryptographically Secure Tokens**
   - Generated using Python's `secrets` module
   - 32 bytes of URL-safe random data
   - Impossible to guess or brute-force

2. **Token Scoping**
   - Token valid only for single server process
   - New token generated on each `dr visualize` invocation
   - No persistent storage or session management needed

3. **Constant-Time Comparison**
   - Tokens compared using `secrets.compare_digest()`
   - Prevents timing attacks

4. **HTTPS Support**
   - Works with both HTTP (development) and HTTPS (production)
   - WebSocket automatically uses wss:// for HTTPS origins

## Testing Authentication

### Test with Valid Token

```bash
# Start DR CLI visualization
dr visualize

# Server outputs magic link:
# http://localhost:8080/?token=YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g

# Open in browser - should work perfectly
```

### Test without Token

```bash
# Try accessing without token:
curl http://localhost:8080/api/model
# Response: 401 Unauthorized

# Try with invalid token:
curl -H "Authorization: Bearer invalid" http://localhost:8080/api/model
# Response: 403 Forbidden

# Try with valid token:
curl -H "Authorization: Bearer YNBWsMZ2H46OVcR0nUcKnbXjnFb8wXGI1bOpGmfJA0g" http://localhost:8080/api/model
# Response: 200 OK (model data)
```

## Bundling for DR CLI

When bundling this viewer for the DR CLI, ensure:

1. **Build the production bundle:**
   ```bash
   npm run build
   ```

2. **Include all static assets:**
   - `dist/index.html`
   - `dist/assets/*.js`
   - `dist/assets/*.css`
   - Any other static files

3. **Server serves static files without authentication:**
   - The `auth_middleware` in `visualization_server.py` already handles this
   - Static assets are public, only API endpoints require auth

4. **Magic link workflow:**
   - Generate token on server start
   - Create magic link: `http://{host}:{port}/?token={token}`
   - Display magic link to user
   - Open browser automatically (if `--no-browser` not set)

## Troubleshooting

### Issue: "401 Unauthorized" on all API requests

**Cause:** Token not being passed from URL to API requests
**Fix:** Verify token is in URL query parameter: `?token=XXX`

### Issue: WebSocket fails to connect

**Cause:** Token not included in WebSocket URL
**Fix:** Check WebSocket URL includes token: `ws://localhost:8080/ws?token=XXX`

### Issue: "403 Forbidden" errors

**Cause:** Token is invalid or expired
**Fix:** Restart `dr visualize` to get a new token, use the new magic link

### Issue: Development mode not working

**Cause:** Reference server requires authentication
**Fix:** The reference server in this repo doesn't require auth - this is correct for development

## Files Modified

| File | Purpose |
|------|---------|
| `src/apps/embedded/stores/authStore.ts` | **NEW** - Authentication store for token management |
| `src/apps/embedded/services/websocketClient.ts` | Added token support to WebSocket connections |
| `src/apps/embedded/services/embeddedDataLoader.ts` | Added Authorization headers to all API requests |
| `src/apps/embedded/EmbeddedLayout.tsx` | Initialize WebSocket with authentication token |

## Migration Notes

### For Existing Deployments

This change is **backward compatible**:

- If no token in URL → No authentication headers sent
- Reference server continues to work without authentication
- DR CLI servers with auth work with token

### For Future Changes

If you need to modify authentication:

1. **Change token location:** Update `extractTokenFromURL()` in `authStore.ts`
2. **Change auth method:** Update `getAuthHeaders()` in `embeddedDataLoader.ts`
3. **Add session management:** Extend `authStore.ts` with persistence logic

## Support

For questions or issues:

1. Check browser console for authentication-related logs
2. Verify magic link includes token parameter
3. Check network tab for Authorization headers in requests
4. Ensure DR CLI version is compatible

## Version Compatibility

- **Viewer:** v0.1.0+
- **DR CLI:** v0.7.3+ (with token-based auth)
- **Reference Server:** Works with or without authentication
