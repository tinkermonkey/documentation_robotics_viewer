# YAML Instance Models Documentation

**Version:** 0.1.0
**Last Updated:** 2025-11-26

## Overview

YAML instance models provide a way to document actual software architecture instances (not just schemas). Unlike JSON Schema definitions (v0.1.1) which define data structures, YAML instance models contain real architectural elements with explicit identifiers and relationships.

## Quick Start

### Minimal YAML Model Structure

```
my-architecture/
├── manifest.yaml              # Required: model metadata and configuration
├── projection-rules.yaml      # Optional: cross-layer generation rules
└── model/
    ├── 01_motivation/
    │   └── goals.yaml        # Element instances
    ├── 02_business/
    │   ├── functions.yaml
    │   └── processes.yaml
    └── 06_api/
        └── operations.yaml
```

### Minimal manifest.yaml

```yaml
version: 0.1.0
schema: documentation-robotics-v1
project:
  name: my-project
  description: My software architecture
  version: 1.0.0
layers:
  business:
    order: 2
    name: Business
    path: model/02_business/
    schema: schemas/02-business-layer.schema.json
    enabled: true
    elements:
      function: 5
      process: 3
```

### Minimal Element File

`model/02_business/functions.yaml`:
```yaml
User Management:
  name: User Management
  description: Manages user registration, authentication, and profiles
  id: business.function.user-management
  relationships:
    supports_goals:
      - motivation.goal.improve-user-experience
```

## Manifest File Specification

### Required Fields

```yaml
version: 0.1.0                    # YAML format version
schema: documentation-robotics-v1 # Schema identifier
project:
  name: string                    # Project name
  description: string             # Project description
  version: string                 # Project version
layers:
  {layer-id}:                     # Layer configuration (see below)
```

### Layer Configuration

```yaml
layers:
  business:                       # Layer ID (lowercase, used in dot-notation)
    order: 2                      # Display order (1-11)
    name: Business                # Display name
    path: model/02_business/      # Path to layer YAML files
    schema: .dr/schemas/...       # Path to JSON Schema (for validation)
    enabled: true                 # Whether to load this layer
    elements:                     # Element counts by type
      function: 10
      process: 5
      service: 3
```

### Optional Fields

```yaml
documentation: README.md           # Path to documentation file

cross_references:                  # Cross-layer reference metadata
  total: 42
  by_type:
    business-service: 15
    api-operation: 12

statistics:                        # Model quality metrics
  total_elements: 182
  total_relationships: 97
  completeness: 0.85
  last_validation: '2025-11-26T12:00:00Z'
  validation_status: passed

conventions:                       # Naming and ID conventions
  id_format: '{layer}.{type}.{kebab-case-name}'
  file_naming:
    api: '{service-name}-api.yaml'
    schema: '{entity-name}.schema.json'
```

## Element File Specification

### Basic Element Structure

```yaml
Element Display Name:             # Top-level key (human-readable)
  name: Element Display Name      # Element name
  description: string             # Element description
  id: layer.type.kebab-case-name  # Dot-notation ID (required)

  # Optional type-specific properties
  property1: value1
  property2: value2

  # Optional relationships
  relationships:
    realizes: [...]              # See relationships section
    serves: [...]
```

### Dot-Notation ID Format

**Pattern:** `{layer-id}.{element-type}.{element-name}`

- **layer-id**: Lowercase layer identifier (e.g., `business`, `api`, `data_model`)
- **element-type**: Lowercase element type (e.g., `function`, `process`, `operation`)
- **element-name**: Kebab-case element name (e.g., `user-management`, `create-user`)

**Examples:**
```
business.function.user-management
business.process.user-registration
api.operation.create-user
data_model.schema.user
security.policy.authentication-policy
```

### Multiple Elements Per File

```yaml
# 02_business/functions.yaml
User Management:
  name: User Management
  id: business.function.user-management
  description: ...

Data Management:
  name: Data Management
  id: business.function.data-management
  description: ...

Reporting:
  name: Reporting
  id: business.function.reporting
  description: ...
```

## Relationship Types

### ArchiMate-Style Relationships

```yaml
relationships:
  realizes:                       # Realizes business concepts
    - business.service.user-service

  serves:                         # Serves other components
    - application.component.frontend

  accesses:                       # Accesses data
    - data_model.schema.user

  uses:                           # Uses services/APIs
    - api.operation.get-user

  composes:                       # Composed of parts
    - application.component.auth-module

  flows_to:                       # Process/data flows
    - business.process.next-step

  assigned_to:                    # Assigned to role/person
    - security.role.admin

  aggregates:                     # Aggregates elements
    - business.function.sub-function

  specializes:                    # Specialization/inheritance
    - business.service.base-service
```

### Motivation Layer Relationships

```yaml
relationships:
  supports_goals:                 # Supports business goals
    - motivation.goal.improve-efficiency
    - motivation.goal.reduce-costs

  fulfills_requirements:          # Fulfills requirements
    - motivation.requirement.auth-requirement

  constrained_by:                 # Constrained by principles/constraints
    - motivation.constraint.data-privacy
```

### Security Relationships

```yaml
relationships:
  secured_by:                     # Secured by resources
    - security.resource.user-api

  requires_permissions:           # Requires permissions
    - security.permission.user-read
    - security.permission.user-write
```

## API Operations with OpenAPI

API operations can embed complete OpenAPI 3.0 specifications:

```yaml
create-user:
  name: create-user
  description: POST /api/users - Create a new user account
  method: POST
  path: /api/users
  id: api.operation.create-user

  openapi:
    openapi: 3.0.3
    info:
      title: Create User
      version: 1.0.0
    paths:
      /api/users:
        post:
          operationId: create_user
          summary: Create a new user
          description: |
            Creates a new user account with the provided details.
            Requires admin permissions.

          parameters:
            - name: X-API-Key
              in: header
              required: true
              schema:
                type: string

          requestBody:
            required: true
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/UserCreate'

          responses:
            '201':
              description: User created successfully
              content:
                application/json:
                  schema:
                    $ref: '#/components/schemas/UserOut'
            '422':
              description: Validation error
              content:
                application/json:
                  schema:
                    $ref: '#/components/schemas/ValidationError'

          tags:
            - users
            - authentication

    components:
      schemas:
        UserCreate:
          type: object
          required: [email, name]
          properties:
            email:
              type: string
              format: email
            name:
              type: string
              minLength: 2
              maxLength: 100

        UserOut:
          type: object
          properties:
            id:
              type: string
              format: uuid
            email:
              type: string
            name:
              type: string
            created_at:
              type: string
              format: date-time

  relationships:
    uses:
      - data_model.schema.user
    secured_by:
      - security.resource.user-api
```

**Extracted Properties:**
- `method`: HTTP method (POST, GET, PUT, DELETE, etc.)
- `path`: API endpoint path
- `openapi`: Full OpenAPI 3.0 specification
- `operationId`, `summary`, `description`: Extracted from spec
- `parameters`: Array of parameter definitions
- `requestBody`, `responses`: Request/response schemas

## Data Models with JSON Schema

Data model elements can embed JSON Schema definitions:

```yaml
user-schema:
  name: user-schema
  description: User data model schema definitions
  id: data_model.schema.user

  $schema: http://json-schema.org/draft-07/schema#

  schemas:
    UserOut:
      type: object
      title: UserOut
      description: User output/response model
      required:
        - id
        - email
        - name
        - created_at
      properties:
        id:
          type: string
          format: uuid
          title: User ID
        email:
          type: string
          format: email
          title: Email Address
        name:
          type: string
          minLength: 2
          maxLength: 100
          title: Full Name
        profile_image:
          type: string
          format: uri
          title: Profile Image URL
        created_at:
          type: string
          format: date-time
          title: Creation Timestamp
        is_active:
          type: boolean
          default: true
          title: Active Status

    UserCreate:
      type: object
      required:
        - email
        - name
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 2
          maxLength: 100
        profile_image:
          type: string
          format: uri

  relationships:
    accessed_by:
      - api.operation.create-user
      - api.operation.get-user
```

**Extracted Properties:**
- `$schema`: JSON Schema version
- `schemas`: Object containing multiple schema definitions
- Each schema has: `title`, `description`, `type`, `properties`, `required`

## Projection Rules

`projection-rules.yaml` defines cross-layer element generation templates:

```yaml
version: 0.1.0

projections:
  # Business Service → Application Service
  - name: business-to-application
    from: business.service                # Source pattern
    to: application.service               # Target pattern
    rules:
      - create_type: service
        name_template: "{{source.name}}"  # Template variables
        properties:
          realizes: "{{source.id}}"
          description: "Realizes {{source.name}}"
          documentation: "Application service for {{source.description}}"

  # Application Service → API Operation
  - name: application-to-api
    from: application.service
    to: api.operation
    rules:
      - create_type: operation
        name_template: "{{source.name_kebab}}-operations"
        properties:
          applicationServiceRef: "{{source.id}}"
          path: "/api/{{source.name_kebab}}"

  # Business Service → Security Resource
  - name: business-to-security
    from: business.service
    to: security.resource
    rules:
      - create_type: resource
        name_template: "{{source.name_kebab}}-api"
        properties:
          resource: "{{source.name_kebab}}-api"
          type: "api"
          archimateRef: "{{source.id}}"
```

**Template Variables:**
- `{{source.name}}`: Source element name
- `{{source.id}}`: Source element dot-notation ID
- `{{source.name_kebab}}`: Source name in kebab-case
- `{{source.description}}`: Source description
- `{{source.*}}`: Any source property

**Note:** Projection rules are **parsed but not automatically applied**. They serve as documentation and future automation templates.

## Best-Effort Parsing

The YAML parser implements best-effort parsing to handle real-world data gracefully:

### Fatal Errors (Throw Exception)

These errors prevent model loading:
- Missing `manifest.yaml`
- Malformed manifest YAML syntax
- No enabled layers
- All layer files missing

### Warnings (Log and Continue)

These issues are logged but don't stop parsing:
- Individual element malformed
- Relationship target not found (dot-notation ID doesn't resolve)
- Layer file missing (layer skipped)
- OpenAPI/JSON Schema malformed (spec not extracted)
- Projection rules malformed (rules ignored)

### Warning Output

Warnings are accumulated and available in model metadata:

```typescript
const model = await dataLoader.loadFromLocal(files);

console.log(model.metadata.warnings);
// [
//   "Skipped element 'Invalid Element': missing required field 'id'",
//   "Unresolved dot-notation reference: business.function.nonexistent",
//   "Failed to extract OpenAPI details: invalid JSON"
// ]
```

## Loading YAML Models

### From Local Files

**Option 1: ZIP Upload**
```typescript
// User uploads a ZIP file containing:
// - manifest.yaml
// - model/ directory with layer files
// - projection-rules.yaml (optional)

const zipFile = event.target.files[0];
const model = await dataLoader.loadFromLocal(zipFile);
```

**Option 2: Multiple Files**
```typescript
// User selects multiple YAML files
const files = event.target.files; // FileList
const model = await dataLoader.loadFromLocal(files);
```

### From GitHub

```typescript
// Downloads and extracts YAML model from GitHub release
const model = await dataLoader.loadFromGitHub('v1.0.0');
```

GitHub releases should contain a ZIP asset with the YAML model structure.

## Example: Complete Small Model

### manifest.yaml
```yaml
version: 0.1.0
schema: documentation-robotics-v1
created: '2025-11-26T10:00:00Z'
updated: '2025-11-26T10:00:00Z'

project:
  name: todo-app
  description: Simple todo list application architecture
  version: 1.0.0

layers:
  motivation:
    order: 1
    name: Motivation
    path: model/01_motivation/
    enabled: true
    elements:
      goal: 2

  business:
    order: 2
    name: Business
    path: model/02_business/
    enabled: true
    elements:
      function: 2

  api:
    order: 6
    name: API
    path: model/06_api/
    enabled: true
    elements:
      operation: 3

statistics:
  total_elements: 7
  total_relationships: 4
```

### model/01_motivation/goals.yaml
```yaml
Improve Productivity:
  name: Improve Productivity
  description: Help users manage tasks efficiently
  id: motivation.goal.improve-productivity

Enhance User Experience:
  name: Enhance User Experience
  description: Provide intuitive and responsive interface
  id: motivation.goal.enhance-ux
```

### model/02_business/functions.yaml
```yaml
Task Management:
  name: Task Management
  description: Create, read, update, and delete tasks
  id: business.function.task-management
  relationships:
    supports_goals:
      - motivation.goal.improve-productivity

User Management:
  name: User Management
  description: User registration and authentication
  id: business.function.user-management
  relationships:
    supports_goals:
      - motivation.goal.enhance-ux
```

### model/06_api/operations.yaml
```yaml
create-task:
  name: create-task
  description: POST /api/tasks - Create a new task
  method: POST
  path: /api/tasks
  id: api.operation.create-task
  relationships:
    realizes:
      - business.function.task-management

get-tasks:
  name: get-tasks
  description: GET /api/tasks - List all tasks
  method: GET
  path: /api/tasks
  id: api.operation.get-tasks
  relationships:
    realizes:
      - business.function.task-management

login:
  name: login
  description: POST /api/auth/login - Authenticate user
  method: POST
  path: /api/auth/login
  id: api.operation.login
  relationships:
    realizes:
      - business.function.user-management
```

## Parser Implementation Details

### Architecture

1. **Detection** (`dataLoader.ts`)
   - Checks for `manifest.yaml` presence
   - Routes to YAML parser if detected

2. **Manifest Parsing** (`yamlParser.ts`)
   - Validates manifest structure
   - Extracts layer configurations

3. **File Grouping** (`dataLoader.ts`)
   - Groups YAML files by layer using manifest paths
   - Handles nested directory structures

4. **Element Parsing** (`yamlParser.ts`)
   - Parses each YAML file into elements
   - Converts key-value pairs to `ModelElement` objects
   - Generates UUIDs for internal use
   - Preserves dot-notation IDs in properties

5. **Relationship Extraction** (`yamlParser.ts`)
   - Extracts nested `relationships` from each element
   - Creates `Relationship` objects with dot-notation target IDs

6. **Dot-Notation Resolution** (`dataLoader.ts`)
   - Builds lookup map: dot-notation ID → UUID
   - Replaces dot-notation target IDs with UUIDs
   - Logs warnings for unresolved references

7. **Cross-Layer References** (`dataLoader.ts`)
   - Combines resolved relationships into references
   - Builds cross-layer reference metadata

### Type Definitions

All YAML types defined in `src/types/yaml.ts`:
- `YAMLManifest` - Manifest structure
- `YAMLLayerConfig` - Layer configuration
- `YAMLElement` - Element with nested relationships
- `YAMLRelationships` - Relationship types
- `ProjectionRules` - Projection rule structure
- `OpenAPIOperation` - Extracted OpenAPI data
- `JSONSchemaDefinition` - Extracted JSON Schema data

## Migration Guide: JSON Schema → YAML Instance

### From JSON Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "BusinessFunction": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "description": {"type": "string"}
      }
    }
  }
}
```

### To YAML Instance Model

```yaml
# manifest.yaml
version: 0.1.0
project:
  name: my-project
layers:
  business:
    order: 2
    name: Business
    path: model/02_business/
    enabled: true

# model/02_business/functions.yaml
User Management:
  name: User Management
  description: Manages user operations
  id: business.function.user-management
```

The key difference: JSON Schemas **define structure**, YAML instances **provide data**.

## Troubleshooting

### "No manifest.yaml found"
**Cause:** Missing manifest file
**Solution:** Ensure `manifest.yaml` exists at root of ZIP or in selected files

### "Failed to parse manifest: ..."
**Cause:** YAML syntax error in manifest
**Solution:** Validate YAML syntax using a YAML validator

### "Unresolved dot-notation reference: ..."
**Cause:** Relationship references non-existent element
**Solution:** Check that target element exists and ID matches exactly

### "No files found for layer: ..."
**Cause:** Manifest path doesn't match actual file locations
**Solution:** Verify `path` in manifest matches directory structure

### Elements not displaying
**Cause:** Layer not enabled or no elements in layer files
**Solution:** Check `enabled: true` in manifest and verify YAML files contain elements

## Reference

- **Spec Version:** 0.1.0
- **Schema:** documentation-robotics-v1
- **Compatible Viewer:** Documentation Robotics Viewer v1.0.0+
- **Parser Implementation:** `src/services/yamlParser.ts`
- **Type Definitions:** `src/types/yaml.ts`
- **Integration Tests:** `tests/example-implementation.spec.ts`
- **Example Model:** `example-implementation/`

## See Also

- [Cross-Layer References](./cross-layer-references.md) - Cross-layer reference extraction system
- [CLAUDE.md](../CLAUDE.md) - Development guide with YAML support section
- [Field-Level Connections](./field-level-connections.md) - Field-level relationship handling
