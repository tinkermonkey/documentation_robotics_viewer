# Documentation Robotics CLI Integration Guide

**Version**: 0.1.0
**Last Updated**: February 2026
**Status**: Production

This guide provides comprehensive documentation on how the Documentation Robotics Viewer integrates with the DR CLI server, including architecture, API endpoints, WebSocket protocol, authentication, and troubleshooting.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [API Reference](#api-reference)
5. [WebSocket Protocol](#websocket-protocol)
6. [Authentication](#authentication)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)
9. [See Also](#see-also)

---

## Overview

### What is DR CLI Integration?

The Documentation Robotics Viewer is a React-based frontend that connects to the **Documentation Robotics CLI server** to visualize multi-layer architecture models. The CLI server provides:

- **Model Storage & Retrieval**: YAML/JSON architecture models
- **Real-time Updates**: WebSocket-based live model synchronization
- **API Endpoints**: RESTful access to model data
- **Authentication**: Token-based security (optional)
- **Changeset Support**: Track and apply isolated model changes

### Key Components

```
┌─────────────────────────┐
│   DR Viewer (React)     │
│  @xyflow/react + Zustand │
└───────────┬─────────────┘
            │
            │ HTTP + WebSocket
            │
┌───────────▼─────────────┐
│   DR CLI Server         │
│  Express.js (port 8080) │
└───────────┬─────────────┘
            │
            │ File I/O
            │
┌───────────▼─────────────┐
│  YAML/JSON Models       │
│  Specification Manifest │
└─────────────────────────┘
```

### Communication Protocol

- **HTTP REST**: Initial model loading, health checks
- **WebSocket JSON-RPC 2.0**: Real-time updates, bidirectional communication
- **Port**: 8080 (DR CLI default)
- **Base URL**: `http://localhost:8080`

---

## Architecture

### Viewer Architecture

The viewer consists of three main layers:

#### 1. **Connection Layer** (`apps/embedded/services/websocketClient.ts`)

Manages WebSocket connection to DR CLI server:

```typescript
export class WebSocketClient {
  constructor(url: string)
  connect(): Promise<void>
  disconnect(): void
  send(message: WebSocketMessage): void
  on(event: string, handler: Function): void
  isConnected(): boolean
}
```

**Features**:
- Auto-reconnection with exponential backoff
- Message queuing during disconnection
- Event-based message routing
- Error handling and recovery

#### 2. **Data Loading Layer** (`core/services/dataLoader.ts`)

Fetches and parses models from DR CLI:

```typescript
export async function loadModel(
  serverUrl: string,
  specificationPath?: string
): Promise<ArchitectureModel>
```

**Steps**:
1. Fetch `/api/model` endpoint
2. Parse YAML or JSON schema
3. Extract cross-layer references
4. Transform to React Flow format

#### 3. **Visualization Layer** (`core/components/GraphViewer.tsx`)

Renders interactive graph using React Flow:

- Node types: 50+ custom components
- Edge types: Business, technical, semantic
- Layout engines: Dagre, ELK, D3Force
- Real-time updates via Zustand stores

---

## Getting Started

### Prerequisites

```bash
# Node.js (v18+) with npm
node --version  # v18.0.0 or higher
npm --version

# Documentation Robotics CLI
dr --version    # 0.7.0 or higher
```

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd documentation-robotics-viewer

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (for testing)
npx playwright install

# 4. Verify setup
npm run verify
```

### Quick Start

```bash
# Terminal 1: Start DR CLI server
dr visualize [path-to-your-model]

# Terminal 2: Start development server
npm run dev:embedded

# Terminal 3 (optional): Run tests
npm run test:e2e
```

**Expected Output:**
```
✓ DR CLI server running on http://localhost:8080
✓ Embedded viewer running on http://localhost:3001
✓ WebSocket connection established
✓ Model loaded successfully
```

---

## API Reference

### REST Endpoints

All endpoints respond with JSON and include CORS headers.

#### 1. Health Check

```http
GET /health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2026-02-19T10:00:00Z"
}
```

#### 2. Get Model

```http
GET /api/model
```

**Query Parameters:**
- `specPath` (optional): Path to specification manifest (default: auto-detect)
- `token` (optional): Authentication token if required

**Response** (200 OK):
```json
{
  "version": "0.1.0",
  "schema": "documentation-robotics-v1",
  "layers": {
    "motivation": {
      "elements": [
        {
          "id": "goal-001",
          "type": "Goal",
          "label": "Improve System Performance",
          "properties": {}
        }
      ]
    },
    "business": {
      "elements": [...]
    }
  },
  "relationships": [
    {
      "source": "goal-001",
      "target": "function-001",
      "type": "realizes"
    }
  ]
}
```

#### 3. Get Specification

```http
GET /api/specification
```

**Response** (200 OK):
```json
{
  "version": "0.7.0",
  "layers": {
    "motivation": { "order": 1 },
    "business": { "order": 2 },
    ...
  },
  "elementTypes": {...},
  "relationshipTypes": {...}
}
```

#### 4. Upload Model (if supported)

```http
POST /api/model
Content-Type: application/json

{
  "model": {...},
  "token": "optional-auth-token"
}
```

---

## WebSocket Protocol

### Connection

The viewer establishes a WebSocket connection for real-time model updates:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected to DR CLI');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message based on type
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

### Message Format (JSON-RPC 2.0)

#### Request (Client → Server)

```json
{
  "jsonrpc": "2.0",
  "method": "model.subscribe",
  "params": {
    "layers": ["business", "technology"]
  },
  "id": 1
}
```

#### Response (Server → Client)

```json
{
  "jsonrpc": "2.0",
  "result": {
    "subscriptionId": "sub-001",
    "status": "subscribed"
  },
  "id": 1
}
```

#### Notification (Server → Client, no response)

```json
{
  "jsonrpc": "2.0",
  "method": "model.changed",
  "params": {
    "layers": ["business"],
    "changes": [
      {
        "type": "elementAdded",
        "layer": "business",
        "element": {...}
      }
    ]
  }
}
```

### Supported Methods

#### `model.subscribe`

Subscribe to model changes:

```json
{
  "method": "model.subscribe",
  "params": {
    "layers": ["business", "technology"],
    "includeAnnotations": true,
    "excludeRelationships": false
  }
}
```

**Response:**
```json
{
  "subscriptionId": "sub-001",
  "status": "subscribed",
  "initialSnapshot": {...}
}
```

#### `model.unsubscribe`

Unsubscribe from model changes:

```json
{
  "method": "model.unsubscribe",
  "params": {
    "subscriptionId": "sub-001"
  }
}
```

#### `model.changed` (Notification)

Server notifies about model changes:

```json
{
  "method": "model.changed",
  "params": {
    "subscriptionId": "sub-001",
    "changes": [
      {
        "type": "elementModified",
        "layer": "business",
        "elementId": "func-001",
        "changes": {
          "label": "New Label"
        }
      },
      {
        "type": "relationshipAdded",
        "source": "func-001",
        "target": "func-002",
        "type": "calls"
      }
    ]
  }
}
```

#### `changeset.apply`

Apply a changeset to the model:

```json
{
  "method": "changeset.apply",
  "params": {
    "changesetId": "cs-001",
    "changes": [...]
  }
}
```

---

## Authentication

### Token-Based Authentication

If the DR CLI server requires authentication:

#### 1. Obtain Token

```bash
# Using CLI helper script
./scripts/capture-auth-token.sh

# Or manually
curl -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "type": "Bearer"
}
```

#### 2. Include Token in Requests

**HTTP Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**WebSocket (after connection):**
```json
{
  "jsonrpc": "2.0",
  "method": "auth.token",
  "params": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "id": 1
}
```

#### 3. Viewer Configuration

Set token in environment or via authStore:

```typescript
// In authStore
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: null,
  setToken: (token: string) => set({ token }),
  getToken: () => useAuthStore.getState().token,
}));
```

### Local Development (No Auth)

For local development without authentication:

```bash
# Start server without auth requirement
dr visualize --no-auth [path-to-model]

# Viewer connects without token
npm run dev:embedded
```

---

## Development Workflow

### 1. Local Model Development

Create a model directory:

```
my-model/
├── manifest.yaml
├── model/
│   ├── 01_motivation/
│   │   └── goals.yaml
│   ├── 02_business/
│   │   ├── functions.yaml
│   │   └── services.yaml
│   └── 03_technology/
│       └── infrastructure.yaml
```

### 2. Run Viewer Against Local Model

```bash
# Terminal 1: Start DR CLI with your model
dr visualize ./my-model

# Terminal 2: Start viewer
npm run dev:embedded

# Open http://localhost:3001
```

### 3. Make Changes and Test

**Live Reloading:**
- Edit `.yaml` files → DR CLI auto-detects → WebSocket notifies
- Viewer auto-updates without page refresh (via `model.changed` notifications)

**Example Workflow:**
```bash
# 1. Edit my-model/model/02_business/functions.yaml
# 2. Save file
# 3. Check DR CLI terminal (should show "File changed")
# 4. Viewer updates automatically (WebSocket notification)
# 5. New elements appear on graph
```

### 4. Testing Changes

```bash
# Run E2E tests with your model
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/embedded-business.spec.ts

# Run with UI for debugging
npm run test:e2e:headed
```

---

## Troubleshooting

### Connection Issues

#### Problem: "Cannot connect to DR CLI server"

**Causes:**
- DR CLI server not running
- Wrong port or hostname
- Firewall blocking connection

**Solutions:**
```bash
# 1. Verify server is running
curl http://localhost:8080/health

# 2. Check port availability
lsof -i :3000

# 3. Start server in correct terminal
dr visualize ./my-model

# 4. Check if using custom port
dr visualize --port 3001 ./my-model
```

#### Problem: "WebSocket connection failed"

**Causes:**
- CORS misconfiguration
- WebSocket endpoint incorrect
- Server firewall blocking WS protocol

**Solutions:**
```bash
# 1. Check server logs for CORS errors
# (Look for server output)

# 2. Verify WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:8080/ws

# 3. Clear browser cache
# - Open DevTools
# - Clear Cookies & Cached Data
# - Reload page
```

### Authentication Issues

#### Problem: "401 Unauthorized"

**Causes:**
- Token expired
- Token not included in request
- Invalid token format

**Solutions:**
```bash
# 1. Regenerate token
./scripts/capture-auth-token.sh

# 2. Verify token is included
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/model

# 3. Check token expiration
echo "YOUR_TOKEN" | jq '.' # Decode JWT claims
```

#### Problem: "Token validation failed"

**Solutions:**
```bash
# 1. Ensure token includes "Bearer " prefix
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Update token in authStore
// In React component
const { setToken } = useAuthStore();
setToken('new-token');

# 3. Check localStorage/sessionStorage
localStorage.getItem('auth_token')
sessionStorage.getItem('auth_token')
```

### Model Loading Issues

#### Problem: "Model failed to load"

**Causes:**
- Model file syntax error
- Missing specification file
- Incompatible model version

**Solutions:**
```bash
# 1. Validate model YAML/JSON
dr validate ./my-model

# 2. Check manifest file exists
cat my-model/manifest.yaml

# 3. Check model version compatibility
cat my-model/manifest.yaml | grep version

# 4. View server logs for detailed error
# (Server output in Terminal 1)
```

#### Problem: "Some layers not rendering"

**Causes:**
- Layer not enabled in manifest
- Elements missing required fields
- Filter hiding layer

**Solutions:**
```yaml
# 1. Check manifest enables layer
manifest.yaml:
layers:
  business:
    enabled: true  # Must be true
```

```typescript
// 2. Check layer filter in viewer
const { visibleLayers } = useLayerStore();
console.log(visibleLayers); // Should include your layer
```

### Performance Issues

#### Problem: "Graph rendering is slow"

**Causes:**
- Too many nodes/edges
- Layout algorithm struggling
- WebSocket flooded with updates

**Solutions:**
```typescript
// 1. Filter to specific layers
const { setVisibleLayers } = useLayerStore();
setVisibleLayers(['business', 'technology']);

// 2. Change layout algorithm
const { setLayoutEngine } = useLayoutStore();
setLayoutEngine('elk'); // Try different engine

// 3. Reduce animation speed
// (In theme/tailwind config)
animation: {
  duration: 200, // Reduce from 300ms
}
```

### Browser Console Errors

#### Common Error: "TypeError: Cannot read property 'current' of undefined"

**Cause:** React Flow context not available
**Solution:** Ensure component is inside `<ReactFlowProvider>`

#### Common Error: "WebSocket is not defined"

**Cause:** Node.js/test environment without WebSocket support
**Solution:** Use `ws` package or test with proper browser environment

```typescript
// In Node.js tests
import WebSocket from 'ws';
global.WebSocket = WebSocket;
```

### Debug Mode

Enable verbose logging:

```typescript
// Set in DevTools console
localStorage.setItem('debug', 'dr:*');
location.reload();

// View logs
console.log('DR Events:', sessionStorage.getItem('dr_events'));
```

---

## See Also

### Documentation
- [YAML Models Guide](../CLAUDE.md#yaml-instance-models) - Model format specification
- [Testing Guide](../tests/README.md) - E2E and unit testing
- [WebSocket Implementation](./WEBSOCKET_JSONRPC_IMPLEMENTATION.md) - Detailed protocol docs
- [Architecture Overview](./architecture-overview.md) - System architecture

### External Resources
- [DR CLI Repository](https://github.com/tinkermonkey/documentation_robotics) - Official CLI docs
- [React Flow Documentation](https://reactflow.dev) - Graph visualization library
- [JSON-RPC 2.0 Spec](https://www.jsonrpc.org/specification) - RPC protocol

### Helpful Scripts
- `scripts/capture-auth-token.sh` - Generate authentication tokens
- `scripts/check-served-bundle.sh` - Verify build output

---

**Questions?** Check the [Testing Reference Implementation](./claude_thoughts/TESTING_REFERENCE_IMPLEMENTATION.md) or open an issue on GitHub.
