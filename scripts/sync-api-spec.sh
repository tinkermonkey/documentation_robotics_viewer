#!/bin/bash
set -e

SPEC_URL="https://raw.githubusercontent.com/tinkermonkey/documentation_robotics/main/docs/api-spec.yaml"
OUTPUT_PATH="docs/api-spec.yaml"

echo "Fetching latest API spec from upstream..."
curl -f -s -S -L "$SPEC_URL" -o "$OUTPUT_PATH"

if [ $? -eq 0 ]; then
    echo "✓ API spec synced successfully to $OUTPUT_PATH"
else
    echo "✗ Failed to fetch API spec from $SPEC_URL"
    exit 1
fi
