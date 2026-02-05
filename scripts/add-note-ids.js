#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Same hash logic as in editor.astro
function generateNoteId(content, reference) {
  const timestamp = Date.now().toString();
  const combined = content.trim() + '|' + reference.trim() + '|' + timestamp;
  
  // Better hash function (FNV-1a variant)
  let hash = 2166136261;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // Keep as 32-bit unsigned
  }
  
  // Convert to hex and take first 4 chars
  return hash.toString(16).substring(0, 4);
}

// Extract content from Note component
function extractNoteContent(noteMatch) {
  const noteContent = noteMatch.replace(/<\/?Note[^>]*>/g, '').trim();
  
  // Split by /// to separate parts
  const parts = noteContent.split('///').map(part => part.trim());
  
  if (parts.length === 1) {
    // Simple note without reference
    return { content: parts[0], reference: '' };
  } else if (parts.length === 3) {
    // Full note with content, reference, source
    return { content: parts[0], reference: parts[1] + parts[2] };
  }
  
  // Fallback: use entire content
  return { content: noteContent, reference: '' };
}

// Process a single file
function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Find all Note components without id attribute
  const noteRegex = /<Note(?![^>]*\sid=)([^>]*)>([\s\S]*?)<\/Note>/g;
  
  content = content.replace(noteRegex, (match, attributes, noteContent) => {
    const { content: noteText, reference } = extractNoteContent(noteContent);
    const noteId = generateNoteId(noteText, reference);
    
    console.log(`  Generated ID: ${noteId}`);
    modified = true;
    
    return `<Note id="${noteId}"${attributes}>${noteContent}</Note>`;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Updated ${filePath}`);
  } else {
    console.log(`  - No changes needed for ${filePath}`);
  }
}

// Main function
function main() {
  const chaptersDir = path.join(__dirname, '../src/content/chapters');
  
  if (!fs.existsSync(chaptersDir)) {
    console.error('Chapters directory not found:', chaptersDir);
    process.exit(1);
  }
  
  const files = fs.readdirSync(chaptersDir).filter(file => 
    file.endsWith('.md') || file.endsWith('.mdx')
  );
  
  console.log(`Found ${files.length} chapter files to process:\n`);
  
  files.forEach(file => {
    const filePath = path.join(chaptersDir, file);
    processFile(filePath);
  });
  
  console.log('\n✅ Done!');
}

main();