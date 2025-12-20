/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: [
    "src/**/*.stories.tsx",
    "src/**/*.stories.mdx"
  ],
  viteConfig: "./vite.config.catalog.ts",
  defaultStory: "shared--loading-state"
};
