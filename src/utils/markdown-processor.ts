import { marked } from 'marked';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

export async function processMarkdownContent(content: string): Promise<string> {
  try {
    // Process markdown with math support using the same plugins as Astro config
    const processor = unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex)
      .use(rehypeStringify, { allowDangerousHtml: true });

    const result = await processor.process(content);
    return String(result);
  } catch (error) {
    console.error('Error processing markdown with math:', error);
    
    // Fallback to marked without math processing
    try {
      marked.setOptions({
        gfm: true,
        breaks: false
      });
      const html = await marked(content);
      return html;
    } catch (fallbackError) {
      console.error('Error processing markdown with fallback:', fallbackError);
      return content;
    }
  }
}