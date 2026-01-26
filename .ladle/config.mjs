/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: [
    "src/**/*.stories.tsx",
    "src/**/*.stories.mdx"
  ],
  viteConfig: "./vite.config.catalog.ts",
  outDir: "dist/catalog",

  /**
   * Story ordering configuration for organized navigation sidebar.
   *
   * Organizes 83 stories into 8 semantic categories:
   * 1. Views & Layouts
   * 2. Architecture Nodes
   * 3. Architecture Edges
   * 4. Panels & Inspectors
   * 5. Panels & Controls
   * 6. Building Blocks
   * 7. Primitives
   * 8. Utilities
   *
   * Within each category, stories are sorted alphabetically.
   */
  storyOrder: (storyIds) => {
    const categoryOrder = [
      'Views & Layouts',           // Primary visualization views
      'Architecture Nodes',        // Graph node types
      'Architecture Edges',        // Graph edge/relationship types
      'Panels & Inspectors',       // Element inspection panels
      'Panels & Controls',         // Layout control components
      'Building Blocks',           // Reusable UI components
      'Primitives',                // Basic UI elements
      'Utilities'                  // Miscellaneous utilities
    ];

    return storyIds.sort((a, b) => {
      const categoryA = categoryOrder.find(cat => a.includes(cat)) || '';
      const categoryB = categoryOrder.find(cat => b.includes(cat)) || '';
      const indexA = categoryOrder.indexOf(categoryA);
      const indexB = categoryOrder.indexOf(categoryB);

      if (indexA !== indexB) {
        return indexA - indexB;
      }

      return a.localeCompare(b);
    });
  }
};
