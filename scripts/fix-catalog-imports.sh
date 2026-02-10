#!/bin/bash
set -e

echo "=== Fixing catalog imports ==="

if [[ "$OSTYPE" == "darwin"* ]]; then
  # Fix compositions imports
  find src/catalog/stories/05-compositions -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../providers/StoryProviderWrapper'|from '@/catalog/providers/StoryProviderWrapper'|g" {} \;
  find src/catalog/stories/05-compositions -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../fixtures'|from '@/catalog/fixtures'|g" {} \;
fi

echo "=== Catalog import fixes complete! ==="
