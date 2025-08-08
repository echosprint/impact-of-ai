export interface NoteBlock {
  id: string;
  content: string;
  referenceText?: string;
}

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

/**
 * Parse chapter content to extract note blocks
 */
export function parseNoteBlocks(content: string, references: Map<string, ReferenceText>): string {
  const noteBlockRegex = /---notes\[([^\]]+)\]([\s\S]*?)---!notes\[\1\]/g;
  
  return content.replace(noteBlockRegex, (match, id, noteContent) => {
    const reference = references.get(id);
    const noteData = {
      id,
      content: noteContent.trim(),
      referenceText: reference
    };
    
    // Return HTML that will be processed by Astro
    return `<NoteBlock noteId="${id}" noteContent="${encodeURIComponent(noteContent.trim())}" ${reference ? `referenceText="${encodeURIComponent(JSON.stringify(reference))}"` : ''} />`;
  });
}

/**
 * Extract all note IDs from chapter content
 */
export function extractNoteIds(content: string): string[] {
  const noteBlockRegex = /---notes\[([^\]]+)\]/g;
  const ids: string[] = [];
  
  let match;
  while ((match = noteBlockRegex.exec(content)) !== null) {
    ids.push(match[1]);
  }
  
  return ids;
}

/**
 * Validate that all note IDs have corresponding reference texts
 */
export function validateNoteReferences(chapterContent: string, references: Map<string, ReferenceText>): {
  valid: boolean;
  missingReferences: string[];
  unusedReferences: string[];
} {
  const noteIds = extractNoteIds(chapterContent);
  const referenceIds = Array.from(references.keys());
  
  const missingReferences = noteIds.filter(id => !references.has(id));
  const unusedReferences = referenceIds.filter(id => !noteIds.includes(id));
  
  return {
    valid: missingReferences.length === 0,
    missingReferences,
    unusedReferences
  };
}