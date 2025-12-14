"""
Reference Python Server for Documentation Robotics Viewer
This is a reference implementation for development and testing only.
Not intended for production use.
"""

import asyncio
import json
import yaml
from pathlib import Path
from typing import Dict, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Documentation Robotics Viewer - Reference Server")

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                disconnected.add(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# Data paths
MOCK_DATA_DIR = Path(__file__).parent / "mock_data"  # Fallback for changesets/annotations
DR_SCHEMAS_DIR = Path(__file__).parent.parent / ".dr" / "schemas"
DR_MODEL_DIR = Path(__file__).parent.parent / "documentation-robotics" / "model"
DR_MODEL_MANIFEST = DR_MODEL_DIR / "manifest.yaml"

# ============================================================================
# REST API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "0.1.0"}

@app.get("/api/spec")
async def get_spec():
    """Get current specification (JSON Schema files) from .dr/schemas/"""

    if not DR_SCHEMAS_DIR.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "Schema directory not found. Is dr CLI initialized?"}
        )

    try:
        # Collect all schema files
        schemas = {}
        schema_files = sorted(DR_SCHEMAS_DIR.glob("*.schema.json"))

        for schema_file in schema_files:
            # Use the full filename as the key
            schema_name = schema_file.name

            with open(schema_file, 'r') as f:
                schema = json.load(f)

            schemas[schema_name] = schema

        spec_data = {
            "version": "0.2.0",
            "type": "schema-collection",
            "description": "JSON Schema definitions from dr CLI",
            "source": "dr-cli",
            "schemas": schemas,
            "schema_count": len(schemas)
        }

        logger.info(f"Serving {len(schemas)} schema files from dr CLI")
        return spec_data

    except Exception as e:
        logger.error(f"Error loading spec: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to load spec: {str(e)}"}
        )

def normalize_layer_id(layer_id: str) -> str:
    """
    Convert server layer IDs to client-expected format.
    Server uses lowercase with underscores: motivation, data_model
    Client expects PascalCase: Motivation, DataModel
    """
    layer_map = {
        'motivation': 'Motivation',
        'business': 'Business',
        'security': 'Security',
        'application': 'Application',
        'technology': 'Technology',
        'api': 'Api',
        'data_model': 'DataModel',
        'datastore': 'Datastore',
        'ux': 'Ux',
        'navigation': 'Navigation',
        'apm': 'ApmObservability'
    }
    return layer_map.get(layer_id, layer_id.title())

def infer_element_type(element_data: dict, filename: str, layer_id: str) -> str:
    """Infer element type from properties, filename, or explicit type field"""

    # Check for explicit type field first
    if 'type' in element_data and element_data['type']:
        return element_data['type']

    # Infer from properties
    if 'constraintType' in element_data or 'constraint.negotiable' in element_data:
        return 'constraint'
    if 'category' in element_data and layer_id == 'motivation':
        return 'driver'
    if 'priority' in element_data and layer_id == 'motivation':
        return 'goal'
    if 'assessmentType' in element_data:
        return 'assessment'
    if 'stakeholder' in element_data.get('name', '').lower():
        return 'stakeholder'

    # Security layer types
    if 'trust_level' in element_data:
        return 'zone'
    if 'policy' in element_data.get('name', '').lower():
        return 'policy'
    if 'objective' in element_data.get('name', '').lower() or \
       ('criticality' in element_data and layer_id == 'security' and \
        not 'policy' in element_data.get('name', '').lower() and \
        not 'zone' in element_data.get('name', '').lower()):
        return 'objective'

    # Technology layer types
    if 'language' in element_data or 'systemsoftware' in element_data.get('id', ''):
        return 'systemsoftware'
    if 'location' in element_data and layer_id == 'technology':
        return 'artifact'

    # Infer from filename (e.g., constraints.yaml, goals.yaml, etc.)
    filename_lower = filename.lower()
    if 'constraint' in filename_lower:
        return 'constraint'
    if 'goal' in filename_lower:
        return 'goal'
    if 'driver' in filename_lower:
        return 'driver'
    if 'stakeholder' in filename_lower:
        return 'stakeholder'
    if 'assessment' in filename_lower:
        return 'assessment'
    if 'function' in filename_lower:
        return 'function'
    if 'process' in filename_lower:
        return 'process'
    if 'service' in filename_lower:
        return 'service'
    if 'component' in filename_lower:
        return 'component'
    if 'role' in filename_lower:
        return 'role'
    if 'permission' in filename_lower:
        return 'permission'
    if 'operation' in filename_lower:
        return 'operation'
    if 'endpoint' in filename_lower:
        return 'endpoint'
    if 'schema' in filename_lower or 'entity' in filename_lower:
        return 'schema'
    if 'database' in filename_lower:
        return 'database'
    if 'view' in filename_lower or 'screen' in filename_lower:
        return 'view'
    if 'route' in filename_lower:
        return 'route'
    if 'flow' in filename_lower:
        return 'flow'

    # Check for common property patterns
    if 'method' in element_data and 'path' in element_data:
        return 'operation'  # API operation
    if '$schema' in element_data or 'properties' in element_data:
        return 'schema'  # JSON Schema
    if 'roleType' in element_data:
        return 'role'
    if 'permissionLevel' in element_data:
        return 'permission'

    # Default to unknown
    return 'unknown'

@app.get("/api/model")
async def get_model():
    """Get current model being built (YAML instance format) from documentation-robotics/model/"""

    if not DR_MODEL_MANIFEST.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "Model manifest not found. Is dr CLI initialized?"}
        )

    try:
        # Load the manifest
        with open(DR_MODEL_MANIFEST, 'r') as f:
            manifest = yaml.safe_load(f)

        # Build the model structure
        layers = {}

        for layer_id, layer_config in manifest.get('layers', {}).items():
            if not layer_config.get('enabled', True):
                continue

            # Resolve path relative to manifest directory
            # Handle both absolute paths and paths relative to manifest
            raw_path = layer_config['path']
            if 'documentation-robotics/model/' in raw_path:
                # Strip incorrect prefix from manifest
                layer_dir = raw_path.split('documentation-robotics/model/')[-1]
                layer_path = DR_MODEL_DIR / layer_dir
            else:
                layer_path = DR_MODEL_DIR.parent / raw_path

            elements = []

            # Load all YAML files from the layer directory
            if layer_path.exists():
                for yaml_file in layer_path.glob('*.yaml'):
                    try:
                        with open(yaml_file, 'r') as f:
                            layer_data = yaml.safe_load(f)

                        # Convert YAML instance format to viewer format
                        if isinstance(layer_data, dict):
                            for element_name, element_data in layer_data.items():
                                if isinstance(element_data, dict):
                                    # Infer element type from properties, filename, or explicit type
                                    element_type = infer_element_type(
                                        element_data,
                                        yaml_file.name,
                                        layer_id
                                    )

                                    # Normalize layer ID for consistency with client
                                    normalized_layer_id = normalize_layer_id(layer_id)

                                    element = {
                                        "id": element_data.get('id', f"{layer_id}.{element_name}"),
                                        "type": element_type,
                                        "name": element_data.get('name', element_name),
                                        "layerId": normalized_layer_id,  # CRITICAL: Must match layer key!
                                        "properties": element_data,
                                        "visual": {
                                            "position": {
                                                "x": 0,
                                                "y": 0
                                            },
                                            "size": {
                                                "width": 200,
                                                "height": 100
                                            },
                                            "style": {
                                                "backgroundColor": "#e3f2fd",
                                                "borderColor": "#1976d2"
                                            }
                                        }
                                    }
                                    elements.append(element)
                    except Exception as e:
                        logger.warning(f"Failed to load {yaml_file}: {e}")

            # Extract relationships from element properties
            layer_relationships = []
            
            # Define implicit relationship keys to look for in properties
            implicit_rel_keys = [
                'deployedTo', 'realizes', 'uses', 'implements', 'accesses', 
                'serves', 'triggers', 'flowsTo', 'composedOf', 'aggregates', 
                'specializes', 'associatedWith'
            ]

            for element in elements:
                # 1. Check explicit 'relationships' object
                element_relationships = element.get('properties', {}).get('relationships', {})
                
                # 2. Check implicit relationship keys in properties
                props = element.get('properties', {})
                for key in implicit_rel_keys:
                    if key in props:
                        # Add to element_relationships for processing
                        if key not in element_relationships:
                            element_relationships[key] = props[key]

                for rel_type, target_ids in element_relationships.items():
                    # Handle both list and single string targets
                    if isinstance(target_ids, str):
                        target_ids = [target_ids]
                    elif not isinstance(target_ids, list):
                        continue # Skip if not string or list

                    for target_id in target_ids:
                        if not isinstance(target_id, str):
                            continue # Skip if target is not a string (e.g. object in stakeholders)

                        # Extract the actual element ID from dot-notation
                        # Format: layer.type.element-id -> element-id
                        # Or might already be simple: element-id -> element-id
                        parts = target_id.split('.')
                        actual_target_id = parts[-1] if len(parts) > 1 else target_id

                        relationship = {
                            "id": f"{element['id']}-{rel_type}-{actual_target_id}",
                            "sourceId": element['id'],
                            "targetId": actual_target_id,
                            "type": rel_type,
                            "properties": {}
                        }
                        layer_relationships.append(relationship)

            # Normalize layer ID for client (PascalCase)
            normalized_layer_id = normalize_layer_id(layer_id)

            layers[normalized_layer_id] = {
                "id": normalized_layer_id,
                "type": layer_config.get('name', normalized_layer_id),
                "name": layer_config.get('name', normalized_layer_id),
                "elements": elements,
                "relationships": layer_relationships
            }

        # Extract cross-layer references after all layers are loaded
        references = []

        for layer_id, layer in layers.items():
            for element in layer['elements']:
                element_rels = element.get('properties', {}).get('relationships', {})

                for rel_type, target_ids in element_rels.items():
                    # Handle both list and single string targets
                    if isinstance(target_ids, str):
                        target_ids = [target_ids]

                    for target_id in target_ids:
                        # Extract layer and element ID from target ID (format: layer.type.id)
                        target_parts = target_id.split('.')
                        if len(target_parts) >= 1:
                            # Convert first part to normalized layer name
                            target_layer_raw = target_parts[0]
                            target_layer = normalize_layer_id(target_layer_raw)

                            # Extract actual element ID (last part)
                            actual_target_id = target_parts[-1] if len(target_parts) > 1 else target_id

                            # Check if this is a cross-layer reference
                            if target_layer != layer_id:
                                reference = {
                                    "source": {
                                        "layerId": layer_id,
                                        "elementId": element['id']
                                    },
                                    "target": {
                                        "layerId": target_layer,
                                        "elementId": actual_target_id
                                    },
                                    "type": rel_type
                                }
                                references.append(reference)

        model_data = {
            "version": manifest.get('version', '0.1.0'),
            "metadata": {
                "type": "yaml-instance",
                "description": manifest.get('project', {}).get('description', 'Model from dr CLI'),
                "source": "dr-cli",
                "project": manifest.get('project', {}),
                "statistics": manifest.get('statistics', {})
            },
            "layers": layers,
            "references": references
        }

        total_elements = sum(len(layer['elements']) for layer in layers.values())
        total_layer_relationships = sum(len(layer['relationships']) for layer in layers.values())
        logger.info(f"Serving model with {len(layers)} layers, {total_elements} elements, {total_layer_relationships} relationships, {len(references)} cross-layer references from dr CLI")
        return model_data

    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to load model: {str(e)}"}
        )

@app.get("/api/link-registry")
async def get_link_registry():
    """Get cross-layer link registry from .dr/schemas/link-registry.json"""

    link_registry_file = DR_SCHEMAS_DIR / "link-registry.json"

    if not link_registry_file.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "Link registry not found. Is dr CLI initialized?"}
        )

    try:
        with open(link_registry_file, 'r') as f:
            link_registry = json.load(f)

        logger.info(f"Serving link registry with {link_registry.get('metadata', {}).get('totalLinkTypes', 0)} link types")
        return link_registry

    except Exception as e:
        logger.error(f"Error loading link registry: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to load link registry: {str(e)}"}
        )

@app.get("/api/changesets")
async def get_changesets():
    """List all changesets"""
    registry_file = MOCK_DATA_DIR / "changesets" / "registry.json"

    if not registry_file.exists():
        # Return empty changeset list if no registry exists
        return {
            "version": "1.0",
            "changesets": []
        }

    with open(registry_file, 'r') as f:
        registry_data = json.load(f)

    logger.info(f"Serving changeset registry with {len(registry_data.get('changesets', []))} changesets")
    return registry_data

@app.get("/api/changesets/{changeset_id}")
async def get_changeset(changeset_id: str):
    """Get specific changeset details"""
    changeset_dir = MOCK_DATA_DIR / "changesets" / changeset_id

    if not changeset_dir.exists():
        return JSONResponse(
            status_code=404,
            content={"error": f"Changeset {changeset_id} not found"}
        )

    # Load metadata
    metadata_file = changeset_dir / "metadata.json"
    changes_file = changeset_dir / "changes.json"

    if not metadata_file.exists() or not changes_file.exists():
        return JSONResponse(
            status_code=404,
            content={"error": "Changeset files incomplete"}
        )

    with open(metadata_file, 'r') as f:
        metadata = json.load(f)

    with open(changes_file, 'r') as f:
        changes = json.load(f)

    logger.info(f"Serving changeset {changeset_id}")
    return {
        "metadata": metadata,
        "changes": changes
    }

@app.get("/api/annotations")
async def get_annotations(elementId: str = None):
    """Get annotations, optionally filtered by element ID"""
    annotations_file = MOCK_DATA_DIR / "annotations.json"

    if not annotations_file.exists():
        # Return empty annotations list if no file exists
        return {
            "annotations": []
        }

    with open(annotations_file, 'r') as f:
        annotations_data = json.load(f)

    annotations = annotations_data.get('annotations', [])

    # Filter by element ID if provided
    if elementId:
        annotations = [ann for ann in annotations if ann.get('elementId') == elementId]
        logger.info(f"Serving {len(annotations)} annotations for element {elementId}")
    else:
        logger.info(f"Serving all {len(annotations)} annotations")

    return {
        "annotations": annotations
    }

# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket connection for live updates"""
    await manager.connect(websocket)

    # Send initial connection message
    await websocket.send_json({
        "type": "connected",
        "version": "0.1.0",
        "timestamp": "2025-11-27T00:00:00Z"
    })

    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "subscribe":
                topics = data.get("topics", [])
                logger.info(f"Client subscribed to topics: {topics}")
                await websocket.send_json({
                    "type": "subscribed",
                    "topics": topics
                })

            elif message_type == "ping":
                await websocket.send_json({
                    "type": "pong"
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected normally")

    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# ============================================================================
# Static File Serving
# ============================================================================

# Serve the embedded app
DIST_DIR = Path(__file__).parent.parent / "dist" / "embedded"

if DIST_DIR.exists():
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/")
    async def serve_app():
        """Serve the embedded app"""
        index_file = DIST_DIR / "public" / "index-embedded.html"
        if index_file.exists():
            return FileResponse(index_file)
        return JSONResponse(
            status_code=404,
            content={"error": "Embedded app not built. Run: npm run build:embedded"}
        )

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the embedded app for any other path (SPA routing)"""
        # Exclude API paths just in case
        if full_path.startswith("api/") or full_path.startswith("assets/"):
             return JSONResponse(status_code=404, content={"error": "Not found"})
        
        index_file = DIST_DIR / "public" / "index-embedded.html"
        if index_file.exists():
            return FileResponse(index_file)
        return JSONResponse(
            status_code=404,
            content={"error": "Embedded app not built. Run: npm run build:embedded"}
        )
else:
    logger.warning("Embedded app dist directory not found. Run 'npm run build:embedded' first.")

# ============================================================================
# Utility Functions
# ============================================================================

async def simulate_model_update():
    """Simulate a model update event (for testing)"""
    await manager.broadcast({
        "type": "model.updated",
        "timestamp": "2025-11-27T00:00:00Z"
    })
    logger.info("Broadcasted model.updated event")

async def simulate_changeset_created(changeset_id: str):
    """Simulate a new changeset event (for testing)"""
    await manager.broadcast({
        "type": "changeset.created",
        "changesetId": changeset_id,
        "timestamp": "2025-11-27T00:00:00Z"
    })
    logger.info(f"Broadcasted changeset.created event for {changeset_id}")

async def simulate_annotation_added(annotation_id: str, element_id: str):
    """Simulate a new annotation event (for testing)"""
    await manager.broadcast({
        "type": "annotation.added",
        "annotationId": annotation_id,
        "elementId": element_id,
        "timestamp": "2025-11-27T00:00:00Z"
    })
    logger.info(f"Broadcasted annotation.added event for annotation {annotation_id}")

# ============================================================================
# Startup
# ============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Documentation Robotics Viewer - Reference Server")
    logger.info("=" * 60)
    logger.info("Server starting on http://localhost:8765")
    logger.info("WebSocket endpoint: ws://localhost:8765/ws")
    logger.info("")
    logger.info("Data Sources:")

    # Check dr CLI schema directory
    if DR_SCHEMAS_DIR.exists():
        schema_count = len(list(DR_SCHEMAS_DIR.glob("*-layer.schema.json")))
        logger.info(f"✓ dr CLI schemas found: {schema_count} layers")
        logger.info(f"  Location: {DR_SCHEMAS_DIR}")
    else:
        logger.warning("✗ dr CLI schemas not found")
        logger.warning(f"  Expected at: {DR_SCHEMAS_DIR}")

    # Check dr CLI model directory
    if DR_MODEL_MANIFEST.exists():
        with open(DR_MODEL_MANIFEST, 'r') as f:
            manifest = yaml.safe_load(f)
        total_elements = manifest.get('statistics', {}).get('total_elements', 0)
        logger.info(f"✓ dr CLI model found: {total_elements} elements")
        logger.info(f"  Location: {DR_MODEL_DIR}")
    else:
        logger.warning("✗ dr CLI model manifest not found")
        logger.warning(f"  Expected at: {DR_MODEL_MANIFEST}")

    # Check if embedded app is built
    logger.info("")
    if DIST_DIR.exists():
        logger.info("✓ Embedded app found and will be served at /")
    else:
        logger.warning("✗ Embedded app not found. Run 'npm run build:embedded'")

    # Check if mock data exists (for changesets/annotations)
    if MOCK_DATA_DIR.exists():
        logger.info("✓ Mock data (changesets/annotations) available")
    else:
        logger.warning("✗ Mock data directory not found")

    logger.info("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="info")
