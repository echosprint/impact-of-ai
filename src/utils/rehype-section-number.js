import { visit, SKIP } from 'unist-util-visit';

/**
 * Rehype plugin to add section numbers to h2 headings
 * This adds semantic section numbers like "5.3" at build time
 * where 5 is the chapter number and 3 is the section number
 */
export function rehypeSectionNumber(options = {}) {
  return (tree, file) => {
    // Get chapter number from frontmatter if available
    const chapterNumber = file.data?.astro?.frontmatter?.chapter ?? 0;
    let sectionNumber = 0;

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'h2') {
        // Remove ## preamble heading entirely
        const text = node.children.map(c => c.value || '').join('').trim().toLowerCase();
        if (text === 'preamble') {
          parent.children.splice(index, 1);
          return [SKIP, index];
        }

        sectionNumber++;

        // Create a span element for the section number
        const numberSpan = {
          type: 'element',
          tagName: 'span',
          properties: {
            className: ['section-number']
          },
          children: [
            {
              type: 'text',
              value: `${chapterNumber}.${sectionNumber} `
            }
          ]
        };

        // Add the section number as the first child
        node.children.unshift(numberSpan);
      }
    });
  };
}
