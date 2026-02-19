#!/bin/bash
set -e

SPEC_URL="https://raw.githubusercontent.com/tinkermonkey/documentation_robotics/main/docs/api-spec.yaml"
OUTPUT_PATH="docs/api-spec.yaml"

echo "Fetching latest API spec from upstream..."
mkdir -p "$(dirname "$OUTPUT_PATH")"

# Create temporary TypeScript file to validate the spec
TEMP_TS=$(mktemp)

# Clean up temp files on exit, interrupt, or error
cleanup() {
  rm -f "$TEMP_TS" "${TEMP_TS%.ts}.js"
}
trap cleanup EXIT INT TERM

if ! curl -f -s -S -L "$SPEC_URL" -o "$OUTPUT_PATH"; then
  echo "✗ Failed to fetch API spec from $SPEC_URL"
  echo "  Please check network connectivity and verify the URL is valid"
  exit 1
fi

echo "✓ API spec synced successfully to $OUTPUT_PATH"

# Optionally validate against TypeScript types
if command -v tsc &> /dev/null; then
  echo "Validating API spec against TypeScript types..."

  cat > "$TEMP_TS" << 'EOF'
import * as YAML from 'js-yaml';
import * as fs from 'fs';

const specContent = fs.readFileSync('./docs/api-spec.yaml', 'utf8');
const spec = YAML.load(specContent) as Record<string, unknown>;

// Basic validation: ensure spec has required OpenAPI structure
if (!spec.openapi && !spec.swagger) {
  throw new Error('API spec missing required openapi/swagger field');
}
if (!spec.info) {
  throw new Error('API spec missing required info field');
}
if (!spec.paths) {
  throw new Error('API spec missing required paths field');
}

console.log('✓ API spec validation passed');
EOF

  if tsc --esModuleInterop --skipLibCheck "$TEMP_TS" && node "$TEMP_TS"; then
    echo "✓ TypeScript validation successful"
  else
    echo "⚠ TypeScript validation failed (non-blocking)"
  fi
else
  echo "⚠ TypeScript compiler not found in PATH (skipping validation)"
fi
