#!/bin/bash

# Generate TypeScript types from OpenAPI spec
# This creates type-safe API client types from the OpenAPI specification

set -e

echo "Generating TypeScript types from OpenAPI spec..."

SPEC_FILE="docs/api-spec.yaml"
OUTPUT_FILE="src/core/types/api-client.ts"

# Check if spec file exists
if [ ! -f "$SPEC_FILE" ]; then
  echo "✗ OpenAPI spec not found at $SPEC_FILE"
  echo "  Please run 'npm run sync:api-spec' first"
  exit 1
fi

# Create output directory if needed
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Generate types using openapi-typescript
if npx openapi-typescript "$SPEC_FILE" -o "$OUTPUT_FILE"; then
  echo "✓ Generated TypeScript types at $OUTPUT_FILE"

  # Add a header comment to the generated file
  TEMP_FILE=$(mktemp)
  cat > "$TEMP_FILE" << 'EOF'
/**
 * Auto-generated from OpenAPI spec using openapi-typescript
 * DO NOT EDIT MANUALLY - regenerate with: npm run client:generate
 *
 * This file contains type-safe definitions for all API endpoints.
 * Use these types when calling the DR CLI server API.
 */

EOF
  cat "$OUTPUT_FILE" >> "$TEMP_FILE"
  mv "$TEMP_FILE" "$OUTPUT_FILE"

  echo "✓ API client types ready for use"
else
  echo "✗ Failed to generate TypeScript types"
  exit 1
fi
