# Reference Python Server

This is a reference implementation of the Python server for the Documentation Robotics Viewer embedded app. It's intended for **development and testing only**, not for production use.

## Purpose

This server implements the API specification defined in the main plan, allowing the embedded viewer to be developed and tested without needing the full dr CLI implementation.

## Features

- ✅ REST API endpoints (spec, model, changesets)
- ✅ WebSocket support for live updates
- ✅ Static file serving for the embedded app
- ✅ CORS support for local development
- ✅ Mock data for testing

## Installation

1. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
cd reference_server
pip install -r requirements.txt
```

## Setup Mock Data

The server expects mock data in `reference_server/mock_data/`:

```
mock_data/
├── spec.json              # Specification (JSON Schema format)
├── model.json             # Current model (YAML instance format)
└── changesets/
    ├── registry.json      # Changeset registry
    └── {changeset-id}/
        ├── metadata.json  # Changeset metadata
        └── changes.json   # Changeset changes
```

A setup script is provided to create sample mock data:
```bash
python setup_mock_data.py
```

## Running the Server

1. Build the embedded app first:
```bash
cd ..
npm run build:embedded
```

2. Start the reference server:
```bash
cd reference_server
python main.py
```

The server will start on `http://localhost:8765`

## API Endpoints

### REST Endpoints

- `GET /health` - Health check
- `GET /api/spec` - Get specification
- `GET /api/model` - Get current model
- `GET /api/changesets` - List all changesets
- `GET /api/changesets/{id}` - Get specific changeset

### WebSocket

- `ws://localhost:8765/ws` - WebSocket connection

**Client → Server messages:**
```json
{"type": "subscribe", "topics": ["model", "changesets"]}
{"type": "ping"}
```

**Server → Client messages:**
```json
{"type": "connected", "version": "1.0.0"}
{"type": "subscribed", "topics": [...]}
{"type": "pong"}
{"type": "model.updated", "timestamp": "..."}
{"type": "changeset.created", "changesetId": "..."}
```

## Testing

### Test REST API:
```bash
# Health check
curl http://localhost:8765/health

# Get spec
curl http://localhost:8765/api/spec

# Get model
curl http://localhost:8765/api/model

# Get changesets
curl http://localhost:8765/api/changesets
```

### Test WebSocket:
Use a WebSocket client or the embedded app to connect to `ws://localhost:8765/ws`

## Development

The server will:
1. Serve the embedded app at `/`
2. Provide REST API endpoints at `/api/*`
3. Accept WebSocket connections at `/ws`
4. Serve static assets from `/assets/*`

## Simulating Events

To simulate filesystem changes and broadcast events, you can:

1. Modify `mock_data/model.json`
2. The embedded app will need to poll or you can manually trigger events via the WebSocket

For automated testing, the server provides utility functions:
- `simulate_model_update()` - Broadcasts model.updated event
- `simulate_changeset_created(id)` - Broadcasts changeset.created event

## Notes

- This is NOT production-ready code
- No authentication/authorization
- No filesystem watching (use mock data)
- No persistence layer
- Simplified error handling
- For development and testing only

## Architecture

```
┌─────────────────────┐
│  Embedded App       │
│  (Browser)          │
└──────────┬──────────┘
           │
           │ HTTP/WS
           │
┌──────────▼──────────┐
│  Reference Server   │
│  (FastAPI)          │
│  - REST API         │
│  - WebSocket        │
│  - Static Files     │
└──────────┬──────────┘
           │
           │ File I/O
           │
┌──────────▼──────────┐
│  Mock Data          │
│  (JSON Files)       │
└─────────────────────┘
```

## Future: Production Server

The actual dr CLI Python server will:
- Watch the filesystem for changes
- Trigger WebSocket events on file changes
- Use the same API contract
- Include authentication
- Handle multiple users/sessions
- Persist changeset state

This reference server provides a starting point for that implementation.
