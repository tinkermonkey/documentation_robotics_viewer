#!/bin/bash
set -e

echo "=== Fixing story imports ==="

# Function to fix imports in a file
fix_imports() {
  local file="$1"
  local component_path="$2"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Replace relative imports with absolute imports
    sed -i '' "s|from '\./[^']*'|from '$component_path'|g" "$file"
    sed -i '' "s|from \"\./[^\"]*\"|from \"$component_path\"|g" "$file"
    sed -i '' "s|from '\\.\\.\/[^']*'|from '$component_path'|g" "$file"
    sed -i '' "s|from \"\\.\\.\/[^\"]*\"|from \"$component_path\"|g" "$file"
  else
    sed -i "s|from '\./[^']*'|from '$component_path'|g" "$file"
    sed -i "s|from \"\./[^\"]*\"|from \"$component_path\"|g" "$file"
    sed -i "s|from '\\.\\.\/[^']*'|from '$component_path'|g" "$file"
    sed -i "s|from \"\\.\\.\/[^\"]*\"|from \"$component_path\"|g" "$file"
  fi
}

# This is too complex - let's use a different approach
# We'll just update each story to use @/ imports

echo "Converting imports to use @/ prefix..."

# Find all moved .stories.tsx files and update their imports
find src/catalog/stories -name "*.stories.tsx" -type f | while read file; do
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Fix relative imports to use @/ prefix
    sed -i '' -E "s|from '\./([^']*)';|from '@/apps/embedded/components/\1';|g" "$file"
    sed -i '' -E "s|from '\\.\\.\/([^']*)';|from '@/apps/embedded/components/\1';|g" "$file"
    sed -i '' -E "s|from '\\.\\.\/\\.\\.\/([^']*)';|from '@/apps/embedded/components/\1';|g" "$file"
    sed -i '' -E "s|from '\\.\\.\/\\.\\.\/\\.\\.\/core/components/([^']*)';|from '@/core/components/\1';|g" "$file"
    sed -i '' -E "s|from '\\.\\.\/\\.\\.\/\\.\\.\/core/nodes/([^']*)';|from '@/core/nodes/\1';|g" "$file"
    sed -i '' -E "s|from '\\.\\.\/\\.\\.\/\\.\\.\/core/edges/([^']*)';|from '@/core/edges/\1';|g" "$file"
  fi
  echo "Processed: $file"
done

echo "=== Import fixes complete! ==="
