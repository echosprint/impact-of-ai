#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CHAPTERS_DIR = path.join(process.cwd(), 'src/content/chapters');

function findNoteById(noteId, files) {
  for (const file of files) {
    const filePath = path.join(CHAPTERS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const pattern = `<Note id="${noteId}"`;
    if (content.includes(pattern)) {
      return { noteId, file, content };
    }
  }
  return null;
}

function removeNote(content, noteId) {
  const pattern = `<Note id="${noteId}"`;
  const start = content.indexOf(pattern);
  const openTagEnd = content.indexOf('>', start);
  const end = content.indexOf('</Note>', openTagEnd) + 7;

  let before = content.substring(0, start);
  let after = content.substring(end);

  // Clean up extra newlines
  if (before.endsWith('\n\n') && after.startsWith('\n')) {
    after = after.substring(1);
  }

  return before + after;
}

function deleteNote(noteId) {
  if (!fs.existsSync(CHAPTERS_DIR)) {
    console.error('Chapters directory not found:', CHAPTERS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(CHAPTERS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  const note = findNoteById(noteId, files);
  if (!note) {
    console.error(`Note #${noteId} not found`);
    process.exit(1);
  }

  const newContent = removeNote(note.content, noteId);
  fs.writeFileSync(path.join(CHAPTERS_DIR, note.file), newContent, 'utf8');

  console.log(`Deleted #${noteId} from ${note.file}`);
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: pnpm del #noteid or pnpm del noteid');
  process.exit(1);
}

const noteId = args[0].replace(/^#/, '');
deleteNote(noteId);
