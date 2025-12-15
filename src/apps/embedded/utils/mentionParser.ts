/**
 * Mention Parser Utility
 * Parses @element.id patterns in annotation content and returns structured data
 */

export interface MentionToken {
  type: 'text' | 'mention';
  content: string;
  elementId?: string;
}

/**
 * Parse annotation content and extract @mentions
 * @param content - The annotation content to parse
 * @returns Array of tokens (text and mentions)
 */
export function parseMentions(content: string): MentionToken[] {
  if (!content) return [];

  const tokens: MentionToken[] = [];
  // Regex to match @element.id or @element-id patterns
  const mentionRegex = /@([\w.-]+)/g;

  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }

    // Add mention token
    tokens.push({
      type: 'mention',
      content: match[0], // Full match including @
      elementId: match[1] // Element ID without @
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last mention
  if (lastIndex < content.length) {
    tokens.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  // If no mentions found, return the whole content as text
  if (tokens.length === 0) {
    tokens.push({
      type: 'text',
      content
    });
  }

  return tokens;
}

/**
 * Extract all element IDs mentioned in content
 * @param content - The annotation content
 * @returns Array of unique element IDs
 */
export function extractMentionedElements(content: string): string[] {
  const tokens = parseMentions(content);
  const elementIds = tokens
    .filter(token => token.type === 'mention' && token.elementId)
    .map(token => token.elementId!);

  // Return unique IDs
  return Array.from(new Set(elementIds));
}

/**
 * Resolve element ID to element name from model
 * @param elementId - The element ID to resolve
 * @param model - The model containing elements (optional)
 * @returns Element name or ID if not found
 */
export function resolveElementName(elementId: string, model?: any): string {
  if (!model || !model.layers) {
    return elementId;
  }

  // Search through all layers for the element
  for (const layer of Object.values(model.layers) as any[]) {
    if (layer.elements) {
      const element = layer.elements.find((el: any) => el.id === elementId);
      if (element) {
        return element.name || element.properties?.name || elementId;
      }
    }
  }

  return elementId;
}
