import os
import re

def fix_node_props(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Regex to find NodeProps<SomeData> where SomeData is not Node<...>
    # We want to match NodeProps<Data> but NOT NodeProps<Node<Data>>
    # So we look for NodeProps<(\w+)>
    
    pattern = r'NodeProps<(\w+)>'
    
    def replacement(match):
        data_type = match.group(1)
        if data_type.startswith('Node'):
            return match.group(0) # Already correct-ish
        return f'NodeProps<Node<{data_type}>>'

    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        # Check if Node is imported from @xyflow/react
        if "import { Node }" not in new_content and "import { Node," not in new_content and ", Node }" not in new_content and ", Node," not in new_content:
             # Add Node to imports
             # Look for import { ... } from '@xyflow/react';
             import_pattern = r"import \{([^}]+)\} from '@xyflow/react';"
             
             def import_replacement(match):
                 imports = match.group(1)
                 if "Node" not in imports.split(','):
                     return f"import {{{imports}, Node}} from '@xyflow/react';"
                 return match.group(0)
             
             new_content = re.sub(import_pattern, import_replacement, new_content)
        
        with open(file_path, 'w') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

def main():
    nodes_dir = 'src/core/nodes'
    for root, dirs, files in os.walk(nodes_dir):
        for file in files:
            if file.endswith('.tsx'):
                fix_node_props(os.path.join(root, file))

if __name__ == '__main__':
    main()
