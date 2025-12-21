import type { Page } from '@playwright/test';

export interface StoryMetadata {
  title: string;
  meta?: {
    skip?: boolean;
    diagramType?: string;
    qualityThreshold?: number;
  };
}

export interface MetaJson {
  stories: Record<string, StoryMetadata>;
}

/**
 * Discovers all refinement layout test stories from Ladle's meta.json
 * Filters out stories marked as skipped
 *
 * @param page - Playwright page instance
 * @returns Array of story keys for refinement layout tests
 * @throws Error if meta.json cannot be fetched
 */
export async function discoverRefinementStories(page: Page): Promise<string[]> {
  const response = await page.goto('/meta.json');

  if (!response?.ok()) {
    throw new Error(`Failed to fetch meta.json: ${response?.status()}`);
  }

  const meta: MetaJson = await response.json();

  return Object.entries(meta.stories)
    .filter(([key]) => key.toLowerCase().includes('refinement'))
    .filter(([_, story]) => !story.meta?.skip)
    .map(([key]) => key);
}

/**
 * Generates a Ladle story URL with specified parameters
 *
 * @param storyKey - The story key from Ladle (e.g., 'refinement-layout-tests--motivation-small-graph')
 * @param mode - Whether to use preview mode (no UI chrome) or full mode
 * @returns URL string for navigating to the story
 */
export function getStoryUrl(
  storyKey: string,
  mode: 'preview' | 'full' = 'preview'
): string {
  const searchParams = new URLSearchParams();
  searchParams.set('story', storyKey);
  searchParams.set('mode', mode);
  return `/?${searchParams.toString()}`;
}

/**
 * Gets all refinement stories grouped by diagram type
 *
 * @param page - Playwright page instance
 * @returns Map of diagram type to story keys
 */
export async function discoverStoriesByDiagramType(
  page: Page
): Promise<Map<string, string[]>> {
  const response = await page.goto('/meta.json');

  if (!response?.ok()) {
    throw new Error(`Failed to fetch meta.json: ${response?.status()}`);
  }

  const meta: MetaJson = await response.json();
  const storiesByType = new Map<string, string[]>();

  Object.entries(meta.stories)
    .filter(([key]) => key.toLowerCase().includes('refinement'))
    .filter(([_, story]) => !story.meta?.skip)
    .forEach(([key, story]) => {
      const diagramType = story.meta?.diagramType || 'unknown';
      if (!storiesByType.has(diagramType)) {
        storiesByType.set(diagramType, []);
      }
      storiesByType.get(diagramType)!.push(key);
    });

  return storiesByType;
}

/**
 * Gets the quality threshold for a specific story
 *
 * @param page - Playwright page instance
 * @param storyKey - The story key
 * @returns Quality threshold value (0-1) or default 0.7
 */
export async function getStoryQualityThreshold(
  page: Page,
  storyKey: string
): Promise<number> {
  const response = await page.goto('/meta.json');

  if (!response?.ok()) {
    return 0.7; // Default threshold
  }

  const meta: MetaJson = await response.json();
  const story = meta.stories[storyKey];

  return story?.meta?.qualityThreshold ?? 0.7;
}
