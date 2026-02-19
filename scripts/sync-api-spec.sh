#!/bin/bash
set -e

SPEC_URL="https://raw.githubusercontent.com/tinkermonkey/documentation_robotics/main/docs/api-spec.yaml"
OUTPUT_PATH="docs/api-spec.yaml"

echo "Fetching latest API spec from upstream..."
mkdir -p "$(dirname "$OUTPUT_PATH")"

if ! curl -f -s -S -L "$SPEC_URL" -o "$OUTPUT_PATH"; then
  echo "✗ Failed to fetch API spec from $SPEC_URL"
  echo "  Please check network connectivity and verify the URL is valid"
  exit 1
fi

echo "✓ API spec synced successfully to $OUTPUT_PATH"
