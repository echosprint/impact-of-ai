export interface ReferenceText {
  id: string;
  content: string;
  source?: string;
  page?: string;
  note?: string;
}

/**
 * Parse reference.md content to extract text blocks
 */
export function parseReferenceFile(content: string): Map<string, ReferenceText> {
  const references = new Map<string, ReferenceText>();
  const textBlockRegex = /<!-- ref:([^\s]+) -->([\s\S]*?)<!-- \/ref:\1 -->/g;
  
  let match;
  while ((match = textBlockRegex.exec(content)) !== null) {
    const id = match[1];
    const rawContent = match[2].trim();
    
    // Extract metadata (source, page, note) from the content
    const lines = rawContent.split('\n');
    let textContent = '';
    let source = '';
    let page = '';
    let note = '';
    
    let inMetadata = false;
    for (const line of lines) {
      // Skip ## header lines that match the ref id
      if (line.startsWith('## ') && line.substring(3).trim() === id) {
        continue;
      }
      
      if (line.startsWith('**Source**:')) {
        source = line.replace('**Source**:', '').trim();
        inMetadata = true;
      } else if (line.startsWith('**Page**:')) {
        page = line.replace('**Page**:', '').trim();
        inMetadata = true;
      } else if (line.startsWith('**Notes**:')) {
        note = line.replace('**Notes**:', '').trim();
        inMetadata = true;
      } else if (!inMetadata) {
        textContent += line + '\n';
      }
    }
    
    references.set(id, {
      id,
      content: textContent.trim(),
      source,
      page,
      note
    });
  }
  
  return references;
}