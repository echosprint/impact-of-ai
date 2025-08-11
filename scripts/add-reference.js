#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function addReference(refId, content, source, page = '', notes = '') {
  if (!refId || !content || !source) {
    console.error('Usage: npm run reference "<ref_id>" "<content>" "<source>" [page] [notes]');
    console.error('Example: npm run reference "smith2023_ai" "Content here..." "John Smith, AI Study (2023)" "p. 15" "Important research"');
    process.exit(1);
  }

  const referenceFile = path.join(process.cwd(), 'src/content/reference.md');
  
  if (!fs.existsSync(referenceFile)) {
    console.error('Reference file not found:', referenceFile);
    process.exit(1);
  }

  const existingContent = fs.readFileSync(referenceFile, 'utf-8');
  
  // Check if reference ID already exists
  if (existingContent.includes(`<!-- ref:${refId} -->`)) {
    console.error(`Reference ID "${refId}" already exists`);
    process.exit(1);
  }

  const newReference = `
<!-- ref:${refId} -->
## ${refId}
${content}

**Source**: ${source}
**Page**: ${page}
**Notes**: ${notes}
<!-- /ref:${refId} -->
`;

  // Append to the end of the file
  const updatedContent = existingContent + newReference;
  
  fs.writeFileSync(referenceFile, updatedContent);
  console.log(`Added new reference: ${refId}`);
  console.log(`Source: ${source}`);
}

// Get arguments from command line
const args = process.argv.slice(2);
const [refId, content, source, page, notes] = args;

addReference(refId, content, source, page || '', notes || '');