#!/bin/bash
#
# Fix Story Component Property Script
# Adds `component` property to story meta objects that are missing it
# This ensures Storybook can properly recognize and document components
#
# Usage: ./scripts/fix-story-components.sh
# Or for a single file: ./scripts/fix-story-components.sh <file>

set -e

if [ $# -eq 1 ]; then
  # Process single file
  STORY_FILES=("$1")
else
  # Find all story files without component property
  mapfile -t STORY_FILES < <(find ./src -name "*.stories.tsx" -type f ! -exec grep -q "component:" {} \; -print)
fi

FIXED=0
SKIPPED=0

for file in "${STORY_FILES[@]}"; do
  # Skip if already has component property
  if grep -q "component:" "$file"; then
    ((SKIPPED++))
    continue
  fi

  # Extract the first imported component name
  COMP_NAME=$(grep -oE "^import\s*{\s*([A-Za-z_][A-Za-z0-9_]*)" "$file" | head -1 | sed 's/.*{\s*//')

  if [ -z "$COMP_NAME" ]; then
    echo "SKIP $file - could not determine component name"
    ((SKIPPED++))
    continue
  fi

  echo "Fixing $file - adding component: $COMP_NAME"

  # Add component property after title (works across different formatting)
  perl -i -pe 's/(title:\s*[\x27"][^\x27"]*[\x27"],?)/$1\n  component: '"$COMP_NAME"',/g if /const\s+meta\s*(?::\s*Meta\S*)?\s*=/' "$file"

  # Update Story type annotation
  perl -i -pe 's/type Story = StoryObj;/type Story = StoryObj<typeof meta>;/' "$file"

  # Update satisfies Meta to include typeof
  perl -i -pe 's/satisfies Meta([^<;\s])/satisfies Meta<typeof '"$COMP_NAME"'>\1/g' "$file"

  ((FIXED++))
done

echo ""
echo "Results: $FIXED fixed, $SKIPPED skipped"
