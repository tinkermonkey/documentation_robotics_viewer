#!/bin/bash
set -e

echo "=== Fixing remaining relative imports ==="

if [[ "$OSTYPE" == "darwin"* ]]; then
  # Fix type imports
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../types/c4Graph'|from '@/apps/embedded/types/c4Graph'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../types/reactflow'|from '@/core/types/reactflow'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../../../core/types/model'|from '@/core/types/model'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../../../core/types'|from '@/core/types'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from './types'|from '@/core/components/base/types'|g" {} \;
  
  # Fix store imports
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../stores/connectionStore'|from '@/apps/embedded/stores/connectionStore'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../stores/annotationStore'|from '@/apps/embedded/stores/annotationStore'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../stores/changesetStore'|from '@/apps/embedded/stores/changesetStore'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../../../core/stores/modelStore'|from '@/core/stores/modelStore'|g" {} \;
  
  # Fix service imports
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../services/coverageAnalyzer'|from '@/apps/embedded/services/coverageAnalyzer'|g" {} \;
  find src/catalog/stories -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../services/embeddedDataLoader'|from '@/apps/embedded/services/embeddedDataLoader'|g" {} \;
  
  # Fix GraphViewer imports - should be default export
  find src/catalog/stories/03-graphs/layouts -name "*.stories.tsx" -type f -exec sed -i '' "s|import { GraphViewer }|import GraphViewer|g" {} \;
fi

echo "=== Remaining import fixes complete! ==="
