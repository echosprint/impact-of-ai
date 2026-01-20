#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const CHAPTERS_DIR = path.join(process.cwd(), 'src/content/chapters');

function findNoteById(partialId, files) {
  const matches = [];

  for (const file of files) {
    const filePath = path.join(CHAPTERS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Find all note IDs in file
    const noteRegex = /<Note id="([^"]+)"/g;
    let match;
    while ((match = noteRegex.exec(content)) !== null) {
      const noteId = match[1];
      if (noteId === partialId || noteId.startsWith(partialId)) {
        matches.push({ noteId, file, content });
      }
    }
  }

  // Exact match takes priority
  const exact = matches.find(m => m.noteId === partialId);
  if (exact) return exact;

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.error(`Multiple notes match "${partialId}":`);
    matches.forEach(m => console.error(`  #${m.noteId} in ${m.file}`));
    process.exit(1);
  }

  return null;
}

function extractNoteContent(content, noteId) {
  const pattern = `<Note id="${noteId}"`;
  const start = content.indexOf(pattern);
  if (start === -1) return null;

  const openTagEnd = content.indexOf('>', start);
  const end = content.indexOf('</Note>', openTagEnd) + 7;
  return content.substring(start, end);
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

function insertNoteBefore(content, targetId, noteContent) {
  const pattern = `<Note id="${targetId}"`;
  const insertPoint = content.indexOf(pattern);

  const before = content.substring(0, insertPoint);
  const after = content.substring(insertPoint);

  return before + noteContent + '\n\n' + after;
}

function moveNote(sourceId, targetId) {
  if (!fs.existsSync(CHAPTERS_DIR)) {
    console.error('Chapters directory not found:', CHAPTERS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(CHAPTERS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  // Find source note
  const source = findNoteById(sourceId, files);
  if (!source) {
    console.error(`Source note #${sourceId} not found`);
    process.exit(1);
  }

  // Find target note
  const target = findNoteById(targetId, files);
  if (!target) {
    console.error(`Target note #${targetId} not found`);
    process.exit(1);
  }

  if (source.noteId === target.noteId) {
    console.error('Cannot move a note relative to itself');
    process.exit(1);
  }

  const sourceNoteContent = extractNoteContent(source.content, source.noteId);

  if (source.file === target.file) {
    // Same file
    let content = source.content;
    content = removeNote(content, source.noteId);
    content = insertNoteBefore(content, target.noteId, sourceNoteContent);
    fs.writeFileSync(path.join(CHAPTERS_DIR, source.file), content, 'utf8');
  } else {
    // Different files
    const sourceContent = removeNote(source.content, source.noteId);
    fs.writeFileSync(path.join(CHAPTERS_DIR, source.file), sourceContent, 'utf8');

    // Re-read target file (in case it was same as source, though we checked)
    const targetContent = fs.readFileSync(path.join(CHAPTERS_DIR, target.file), 'utf8');
    const newTargetContent = insertNoteBefore(targetContent, target.noteId, sourceNoteContent);
    fs.writeFileSync(path.join(CHAPTERS_DIR, target.file), newTargetContent, 'utf8');
  }

  console.log(`Moved #${source.noteId} before #${target.noteId} in ${target.file}`);
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: pnpm mv <source_id> <target_id>');
  console.error('Example: pnpm mv abc12 def34');
  console.error('         pnpm mv "#abc12" "#def34"');
  process.exit(1);
}

const sourceId = args[0].replace(/^#/, '');
const targetId = args[1].replace(/^#/, '');

moveNote(sourceId, targetId);
