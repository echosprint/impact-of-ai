#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getNextChapterNumber() {
  const chaptersDir = path.join(process.cwd(), 'src/content/chapters');
  
  if (!fs.existsSync(chaptersDir)) {
    console.error('Chapters directory not found:', chaptersDir);
    process.exit(1);
  }

  const files = fs.readdirSync(chaptersDir);
  const chapters = files
    .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
    .map(file => {
      const content = fs.readFileSync(path.join(chaptersDir, file), 'utf-8');
      const match = content.match(/^chapter:\s*(\d+)/m);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => !isNaN(num));

  return Math.max(...chapters, -1) + 1;
}

function createChapter(title) {
  if (!title) {
    console.error('Usage: npm run chapter "<chapter title>"');
    process.exit(1);
  }

  const chapterNum = getNextChapterNumber();
  const filename = `${title.replace(/\s+/g, '_').replace(/[^\w\u4e00-\u9fa5_-]/g, '')}.mdx`;
  const filepath = path.join(process.cwd(), 'src/content/chapters', filename);

  if (fs.existsSync(filepath)) {
    console.error('Chapter file already exists:', filename);
    process.exit(1);
  }

  const frontmatter = `---
title: ${title}
description: ${title}
chapter: ${chapterNum}
---

`;

  fs.writeFileSync(filepath, frontmatter);
  console.log(`Created new MDX chapter: ${filename} (chapter ${chapterNum})`);
  console.log(`File location: ${filepath}`);
}

// Get title from command line arguments
const title = process.argv.slice(2).join(' ');
createChapter(title);