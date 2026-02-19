#!/bin/bash
set -e

SPEC_URL="https://raw.githubusercontent.com/tinkermonkey/documentation_robotics/main/docs/api-spec.yaml"
OUTPUT_PATH="docs/api-spec.yaml"

echo "Fetching latest API spec from upstream..."
mkdir -p "$(dirname "$OUTPUT_PATH")"
curl -f -s -S -L "$SPEC_URL" -o "$OUTPUT_PATH"
echo "✓ API spec synced successfully to $OUTPUT_PATH"
