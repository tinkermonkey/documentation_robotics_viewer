#!/bin/bash
set -e

echo "=== Fixing more imports ==="

if [[ "$OSTYPE" == "darwin"* ]]; then
  # Fix chat component imports with ../../.. paths
  find src/catalog/stories/04-chat -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../../../apps/embedded/components/chat/|from '@/apps/embedded/components/chat/|g" {} \;
  find src/catalog/stories/04-chat -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../../../apps/embedded/types/chat'|from '@/apps/embedded/types/chat'|g" {} \;
  find src/catalog/stories/04-chat -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../stores/floatingChatStore'|from '@/apps/embedded/stores/floatingChatStore'|g" {} \;
  find src/catalog/stories/04-chat -name "*.stories.tsx" -type f -exec sed -i '' "s|from '\./ChatPanel'|from '@/apps/embedded/components/ChatPanelContainer'|g" {} \;
  
  # Fix motivation graph type imports
  find src/catalog/stories/03-graphs/views -name "*.stories.tsx" -type f -exec sed -i '' "s|from '../types/motivationGraph'|from '@/apps/embedded/types/motivationGraph'|g" {} \;
fi

echo "=== More import fixes complete! ==="
