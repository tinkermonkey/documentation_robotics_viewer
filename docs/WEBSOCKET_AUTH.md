# WebSocket Authentication Implementation

## Overview

The web client now sends authentication tokens via the `Sec-WebSocket-Protocol` header instead of query parameters for improved security.

## Technical Details

### Browser Limitation
The native browser WebSocket API doesn't support setting custom headers (including `Authorization`). This is a well-known limitation of the WebSocket specification in browsers.

### Solution: Sec-WebSocket-Protocol Header
We use the `Sec-WebSocket-Protocol` header to pass the authentication token. This is a standard approach used by many WebSocket libraries (including socket.io, SignalR, etc.).

### Token Format
```javascript
// Client side:
const ws = new WebSocket('ws://localhost:8080/ws', ['token', 'YOUR_TOKEN']);

// Browser sends header:
Sec-WebSocket-Protocol: token, YOUR_TOKEN

// Server responds with:
Sec-WebSocket-Protocol: token
```

## Server Implementation Requirements

The DR CLI visualization server needs to:

1. Read the `Sec-WebSocket-Protocol` header from the WebSocket upgrade request
2. Extract the token from the protocol string format: `Authorization.Bearer.{token}`
3. Validate the token as a Bearer token
4. Accept or reject the WebSocket connection based on the token validity

### Example Python Implementation (websockets library)

```python
async def handle_websocket(websocket, path):
    # Get protocols from the handshake (comma-separated list)
    protocol_header = websocket.request_headers.get('Sec-WebSocket-Protocol', '')
    protocols = [p.strip() for p in protocol_header.split(',')]

    # Check for authentication token
    # Expects: ['token', 'ACTUAL_TOKEN_VALUE']
    if len(protocols) == 2 and protocols[0] == 'token':
        token = protocols[1]

        # Validate token
        if not validate_token(token):
            await websocket.close(1008, "Invalid authentication token")
            return

        # Accept the 'token' subprotocol
        websocket.subprotocol = 'token'
    else:
        # No auth provided
        if auth_required:
            await websocket.close(1008, "Authentication required")
            return

    # Continue with authenticated WebSocket connection
    # ...
```

## Benefits Over Query Parameters

1. **Security**: Tokens in query parameters are often logged in server logs, proxy logs, and browser history
2. **Standards-compliant**: Uses a standard WebSocket header mechanism
3. **Cleaner URLs**: No sensitive data in the connection URL
4. **Better caching**: Query parameters can affect caching behavior

## Backward Compatibility

The server can support both methods during a transition period:
1. Check `Sec-WebSocket-Protocol` header first
2. Fall back to query parameter if header is not present

This allows for gradual migration.

## Client Implementation

The client implementation is in `src/apps/embedded/services/websocketClient.ts`:

```typescript
private getAuthProtocols(): string[] | undefined {
  if (!this.token) {
    return undefined;
  }

  // Pass token as two-part protocol: ['token', 'ACTUAL_TOKEN']
  // Browser sends: Sec-WebSocket-Protocol: token, ACTUAL_TOKEN
  // Server responds with: Sec-WebSocket-Protocol: token
  return ['token', this.token];
}

// Usage:
const protocols = this.getAuthProtocols();
this.ws = new WebSocket(this.url, protocols);
```

## Testing

All existing tests pass with this change. The WebSocket client automatically uses the new authentication method when a token is present.

## References

- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [RFC 6455 - The WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455#section-11.3.4)
- [Sec-WebSocket-Protocol Header](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#protocols)
