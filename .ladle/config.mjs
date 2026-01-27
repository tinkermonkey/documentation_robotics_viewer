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
   * Orders stories by their top-level tier category, then alphabetically.
   * Tier order (extracted from first segment of story title):
   * 1. Foundations (reserved for design tokens, theme variables - future use)
   * 2. Primitives
   * 3. Building Blocks
   * 4. Architecture Nodes
   * 5. Architecture Edges
   * 6. Panels & Inspectors
   * 7. Views & Layouts
   *
   * Within each tier, stories are sorted alphabetically by full title.
   * Stories in unrecognized tiers appear last in alphabetical order.
   */
  storySort: (a, b) => {
    // Define the seven-tier hierarchy order
    // NOTE: If you modify this order, update the JSDoc comment above
    const order = [
      'Foundations',        // Reserved for future use (design tokens, theme system)
      'Primitives',
      'Building Blocks',
      'Architecture Nodes',
      'Architecture Edges',
      'Panels & Inspectors',
      'Views & Layouts'
    ];

    // Extract top-level category from story title (e.g., "Primitives / States / ...")
    const getCategory = (title) => {
      const parts = title.split(' / ');
      return parts[0];
    };

    const aTitle = a[1].meta?.title || '';
    const bTitle = b[1].meta?.title || '';

    const aCategory = getCategory(aTitle);
    const bCategory = getCategory(bTitle);

    const aIndex = order.indexOf(aCategory);
    const bIndex = order.indexOf(bCategory);

    // If categories differ, sort by tier order
    // Stories in unrecognized categories appear at the end
    const aSort = aIndex === -1 ? order.length : aIndex;
    const bSort = bIndex === -1 ? order.length : bIndex;

    if (aSort !== bSort) {
      return aSort - bSort;
    }

    // Within same category, sort alphabetically by full title
    return aTitle.localeCompare(bTitle);
  }
};
