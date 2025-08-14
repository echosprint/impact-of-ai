/**
 * Utility functions for processing markdown content
 */

/**
 * Convert markdown links and standalone URLs to HTML
 */
export function processMarkdownLinks(text: string): string {
  // First, convert markdown links
  let processed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="reference-link">$1</a>');
  
  // Then, convert standalone URLs (not already inside links)
  processed = processed.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="reference-link">$2</a>');
  
  return processed;
}

/**
 * Format reference content with mixed font sizes and proper structure
 */
export function formatReferenceContent(content: string): string {
  return content
    .trim()
    .split(/\n/) // Split on single newlines for Chinese text
    .filter(line => line.trim().length > 0) // Remove empty lines
    .map(line => {
      const trimmedLine = line.trim();
      // Check if line is a horizontal rule (3 or more hyphens, asterisks, or underscores)
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
        return '<hr class="reference-separator">';
      }
      // Convert markdown links to HTML links
      const processedLine = processMarkdownLinks(trimmedLine);
      // Otherwise treat as regular paragraph
      return `<p class="mixed-text">${processedLine}</p>`;
    })
    .join('');
}

/**
 * Calculate word count from markdown content (supports Chinese and English)
 */
export function calculateWordCount(content: string): number {
  if (!content || typeof content !== 'string') {
    return 0;
  }
  
  // Remove markdown syntax (headers, links, code blocks, etc.)
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code blocks and inline code
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove bold/italic
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1') // Remove bold/italic
    .replace(/^[\s\-\*\+]\s+/gm, '') // Remove list markers
    .replace(/^\s*>/gm, '') // Remove blockquotes
    .replace(/^\s*---+\s*$/gm, '') // Remove horizontal rules
    .replace(/---/g, '') // Remove frontmatter separators
    .trim();
  
  // Count Chinese characters and English words separately
  let wordCount = 0;
  
  // Regular expressions for different character types
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;
  const englishWordRegex = /[a-zA-Z0-9]+/g;
  
  // Count Chinese characters (each character is typically one word)
  const chineseMatches = plainText.match(chineseRegex);
  if (chineseMatches) {
    wordCount += chineseMatches.length;
  }
  
  // Remove Chinese characters to avoid double counting
  const textWithoutChinese = plainText.replace(chineseRegex, ' ');
  
  // Count English words
  const englishMatches = textWithoutChinese.match(englishWordRegex);
  if (englishMatches) {
    wordCount += englishMatches.length;
  }
  
  return wordCount;
}

/**
 * Calculate reading time (assuming 200 words per minute average reading speed)
 */
export function calculateReadingTime(wordCount: number): number {
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}