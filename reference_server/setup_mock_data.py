"""
Setup script to create mock data for the reference server
Copies data from the example-implementation directory
"""

import json
import shutil
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
MOCK_DATA_DIR = SCRIPT_DIR / "mock_data"
PROJECT_ROOT = SCRIPT_DIR.parent

def setup_mock_data():
    """Create mock data directory structure with sample data"""

    print("Setting up mock data...")

    # Create directories
    MOCK_DATA_DIR.mkdir(exist_ok=True)
    (MOCK_DATA_DIR / "changesets").mkdir(exist_ok=True)

    print(f"✓ Created mock data directories at {MOCK_DATA_DIR}")

    # Create a sample spec.json (minimal spec for testing)
    spec_data = {
        "version": "0.1.1",
        "metadata": {
            "type": "schema-definitions",
            "description": "Mock specification for testing"
        },
        "layers": {
            "business": {
                "id": "business",
                "type": "Business",
                "name": "Business Layer",
                "elements": [
                    {
                        "id": "business-1",
                        "type": "service",
                        "name": "User Management Service",
                        "properties": {
                            "description": "Manages user accounts and profiles"
                        },
                        "visual": {
                            "style": {
                                "backgroundColor": "#e3f2fd",
                                "borderColor": "#1976d2"
                            }
                        }
                    }
                ],
                "relationships": []
            }
        },
        "references": []
    }

    with open(MOCK_DATA_DIR / "spec.json", "w") as f:
        json.dump(spec_data, f, indent=2)

    print("✓ Created spec.json")

    # Create a sample model.json
    # Try to use existing example-implementation data if available
    example_impl_dir = PROJECT_ROOT / "documentation-robotics"

    if example_impl_dir.exists():
        print(f"  Found example-implementation directory, will reference it for model data")
        # For now, create a simple model pointing to it
        model_data = {
            "version": "0.1.0",
            "metadata": {
                "type": "yaml-instance",
                "description": "Mock model for testing - see documentation-robotics/"
            },
            "layers": {
                "business": {
                    "id": "business",
                    "type": "Business",
                    "name": "Business Layer",
                    "elements": [
                        {
                            "id": "business.function.knowledge-graph-management",
                            "type": "function",
                            "name": "Knowledge Graph Management",
                            "properties": {
                                "description": "Manage knowledge graph operations"
                            },
                            "visual": {
                                "style": {
                                    "backgroundColor": "#e3f2fd",
                                    "borderColor": "#1976d2"
                                }
                            }
                        }
                    ],
                    "relationships": []
                }
            },
            "references": []
        }
    else:
        model_data = spec_data.copy()
        model_data["metadata"]["type"] = "yaml-instance"

    with open(MOCK_DATA_DIR / "model.json", "w") as f:
        json.dump(model_data, f, indent=2)

    print("✓ Created model.json")

    # Create sample changeset registry
    registry_data = {
        "version": "1.0",
        "changesets": {
            "feature-auth-system-2025-01-15-001": {
                "name": "Authentication System",
                "status": "active",
                "type": "feature",
                "created_at": "2025-01-15T10:30:00Z",
                "elements_count": 12
            },
            "bugfix-login-error-2025-01-14-001": {
                "name": "Fix Login Validation",
                "status": "applied",
                "type": "bugfix",
                "created_at": "2025-01-14T14:20:00Z",
                "elements_count": 3
            }
        }
    }

    with open(MOCK_DATA_DIR / "changesets" / "registry.json", "w") as f:
        json.dump(registry_data, f, indent=2)

    print("✓ Created changesets/registry.json")

    # Create sample changeset
    changeset_id = "feature-auth-system-2025-01-15-001"
    changeset_dir = MOCK_DATA_DIR / "changesets" / changeset_id
    changeset_dir.mkdir(exist_ok=True)

    # Metadata
    metadata = {
        "id": changeset_id,
        "name": "Authentication System",
        "description": "Implements comprehensive authentication and authorization system",
        "type": "feature",
        "status": "active",
        "created_at": "2025-01-15T10:30:00+00:00",
        "updated_at": "2025-01-15T16:45:30+00:00",
        "workflow": "agent-conversation",
        "summary": {
            "elements_added": 8,
            "elements_updated": 3,
            "elements_deleted": 1
        }
    }

    with open(changeset_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    # Changes
    changes = {
        "version": "1.0",
        "changes": [
            {
                "timestamp": "2025-01-15T10:35:00+00:00",
                "operation": "add",
                "element_id": "security.role.admin",
                "layer": "security",
                "element_type": "role",
                "data": {
                    "name": "Admin",
                    "description": "Administrator role with full system access",
                    "permissions": [
                        "user.create",
                        "user.delete",
                        "system.configure"
                    ],
                    "inherits": []
                }
            },
            {
                "timestamp": "2025-01-15T10:36:00+00:00",
                "operation": "add",
                "element_id": "security.role.user",
                "layer": "security",
                "element_type": "role",
                "data": {
                    "name": "User",
                    "description": "Standard user role with basic access",
                    "permissions": [
                        "profile.read",
                        "profile.update"
                    ],
                    "inherits": []
                }
            },
            {
                "timestamp": "2025-01-15T14:20:00+00:00",
                "operation": "update",
                "element_id": "application.service.auth",
                "layer": "application",
                "element_type": "service",
                "before": {
                    "name": "Authentication Service",
                    "status": "planned",
                    "dependencies": []
                },
                "after": {
                    "name": "Authentication Service",
                    "status": "in-development",
                    "dependencies": [
                        "security.role.admin",
                        "security.role.user"
                    ],
                    "securedBy": "security.policy.auth-required"
                }
            },
            {
                "timestamp": "2025-01-15T16:40:00+00:00",
                "operation": "delete",
                "element_id": "business.service.legacy-auth",
                "layer": "business",
                "element_type": "service",
                "before": {
                    "name": "Legacy Authentication",
                    "status": "deprecated",
                    "description": "Old authentication system, replaced by new security layer"
                }
            }
        ]
    }

    with open(changeset_dir / "changes.json", "w") as f:
        json.dump(changes, f, indent=2)

    print(f"✓ Created changeset {changeset_id}")

    # Create sample annotations
    annotations_data = {
        "annotations": [
            {
                "id": "ann-001",
                "elementId": "business.function.knowledge-graph-management",
                "author": "Alice Developer",
                "content": "This function needs better error handling for edge cases when the graph is empty.",
                "createdAt": "2025-01-10T09:15:00Z",
                "resolved": False,
                "replies": [
                    {
                        "id": "reply-001",
                        "author": "Bob Reviewer",
                        "content": "Good point. I'll add validation before any graph operations.",
                        "createdAt": "2025-01-10T10:30:00Z"
                    }
                ]
            },
            {
                "id": "ann-002",
                "elementId": "business.function.knowledge-graph-management",
                "author": "Charlie Architect",
                "content": "Consider splitting this into separate read/write operations for better separation of concerns.",
                "createdAt": "2025-01-11T14:20:00Z",
                "resolved": False,
                "replies": []
            },
            {
                "id": "ann-003",
                "elementId": "security.role.admin",
                "author": "Diana Security",
                "content": "Admin permissions look comprehensive. Should we add audit logging for all admin actions?",
                "createdAt": "2025-01-15T11:00:00Z",
                "resolved": False,
                "replies": [
                    {
                        "id": "reply-002",
                        "author": "Alice Developer",
                        "content": "Yes, audit logging is planned for the next iteration.",
                        "createdAt": "2025-01-15T11:15:00Z"
                    },
                    {
                        "id": "reply-003",
                        "author": "Diana Security",
                        "content": "Perfect! I'll review the audit spec when it's ready.",
                        "createdAt": "2025-01-15T11:20:00Z"
                    }
                ]
            },
            {
                "id": "ann-004",
                "elementId": "application.service.auth",
                "author": "Bob Reviewer",
                "content": "The authentication service looks solid. Nice work on the role integration!",
                "createdAt": "2025-01-15T16:00:00Z",
                "updatedAt": "2025-01-15T16:05:00Z",
                "resolved": True,
                "replies": []
            }
        ]
    }

    with open(MOCK_DATA_DIR / "annotations.json", "w") as f:
        json.dump(annotations_data, f, indent=2)

    print("✓ Created annotations.json")

    print("\n" + "=" * 60)
    print("Mock data setup complete!")
    print("=" * 60)
    print(f"\nMock data location: {MOCK_DATA_DIR}")
    print("\nFiles created:")
    print("  - spec.json (sample specification)")
    print("  - model.json (sample model)")
    print("  - changesets/registry.json (changeset index)")
    print("  - changesets/feature-auth-system-2025-01-15-001/ (sample changeset)")
    print("  - annotations.json (sample annotations)")
    print("\nYou can now run the server:")
    print("  python main.py")

if __name__ == "__main__":
    setup_mock_data()
