import { marked } from 'marked';

export async function processMarkdownContent(content: string): Promise<string> {
  // Configure marked with similar settings to Astro
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false
  });

  try {
    const html = await marked(content);
    return html;
  } catch (error) {
    console.error('Error processing markdown:', error);
    return content;
  }
}