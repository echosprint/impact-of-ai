#!/usr/bin/env node
import { createServer } from 'http';
import { promises as fs, watchFile } from 'fs';
import { join, dirname } from 'path';
import { parse } from 'url';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const CHAPTERS_DIR = join(__dirname, '..', 'src', 'content', 'chapters');
const EDITOR_PATH = join(__dirname, 'editor.html');
const CSS_OUTPUT_PATH = join(__dirname, 'public', 'styles.css');

// File cache for search optimization
const fileCache = new Map(); // filename -> { mtime, notes }

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

async function generateCSS() {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout: css } = await execAsync('pnpm exec tailwindcss -i styles.css --content "editor.html" --stdout', {
      cwd: __dirname
    });

    await fs.writeFile(CSS_OUTPUT_PATH, css, 'utf8');
    const size = Buffer.byteLength(css, 'utf8');
    log('css', `Generated ${(size / 1024).toFixed(1)}KB (saved to public/styles.css)`);
  } catch (error) {
    log('error', 'Failed to generate CSS:', error);
    throw error;
  }
}

function log(level, message, ...args) {
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
  let levelStr = '';
  if (level === 'error') {
    levelStr = '[error]';
  } else if (level === 'update') {
    levelStr = '[update]';
  } else if (level === 'append') {
    levelStr = '[append]';
  } else if (level === 'css') {
    levelStr = '[css]';
  } else if (level === 'refresh') {
    levelStr = '[refresh]';
  }
  console.log(`${timestamp} ${levelStr} ${message}`, ...args);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendHtml(res, content) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(content);
}

function sendJs(res, content) {
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  res.end(content);
}

function sendError(res, statusCode, message, details = null) {
  const error = { error: message };
  if (details) error.details = details;
  sendJson(res, statusCode, error);
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function validateFile(filename) {
  const safePath = join(CHAPTERS_DIR, filename);
  try {
    await fs.access(safePath);
    return safePath;
  } catch {
    throw new Error('File not found');
  }
}

function extractSections(content) {
  const sections = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match H2 headers (## Section Title)
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      sections.push({
        title: match[1].trim(),
        lineNumber: i
      });
    }
  }

  return sections;
}

function extractNotes(content) {
  const noteRegex = /<Note id="([^"]+)"(?:\s+time="([^"]*)")?[^>]*>([\s\S]*?)<\/Note>/g;
  const notes = [];
  const sections = extractSections(content);
  const lines = content.split('\n');
  let match;

  while ((match = noteRegex.exec(content)) !== null) {
    const noteId = match[1];
    const noteTime = match[2] || null; // Extract time attribute (may be null for old notes)
    const noteContent = match[3].trim();

    // Find which line the note starts on
    const notePosition = match.index;
    const contentBeforeNote = content.substring(0, notePosition);
    const lineNumber = contentBeforeNote.split('\n').length - 1;

    // Find which section this note belongs to
    let section = null;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (lineNumber >= sections[i].lineNumber) {
        section = sections[i].title;
        break;
      }
    }

    // Extract first line for preview (up to 10 chars)
    const contentLines = noteContent.split('\n').filter(line => line.trim().length > 0);
    const firstLine = contentLines.length > 0 ? contentLines[0].trim() : '';
    const preview = firstLine.length > 22 ? firstLine.substring(0, 22) + '..' : firstLine;

    notes.push({ id: noteId, preview, section, time: noteTime });
  }

  return notes;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

async function handleEditor(req, res) {
  try {
    const editorContent = await fs.readFile(EDITOR_PATH, 'utf8');
    sendHtml(res, editorContent);
    log('refresh', `editor`);
  } catch (error) {
    log('error', 'Error loading editor:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error loading editor');
  }
}

async function handleCss(req, res) {
  try {
    const cssContent = await fs.readFile(CSS_OUTPUT_PATH, 'utf8');
    const stats = await fs.stat(CSS_OUTPUT_PATH);
    const etag = `"${stats.mtime.getTime()}"`;

    res.writeHead(200, {
      'Content-Type': 'text/css',
      'Cache-Control': 'public, max-age=3600', // 1 hour cache
      'ETag': etag
    });
    res.end(cssContent);
  } catch (error) {
    log('error', 'Error serving CSS:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error loading CSS');
  }
}

async function handleJs(req, res, pathname) {
  try {
    // Extract filename from path (e.g., /js/noteManager.js -> noteManager.js)
    const filename = pathname.split('/js/')[1];
    const jsPath = join(__dirname, 'js', filename);

    // Security check: ensure file is in js directory
    if (!filename || filename.includes('..') || !filename.endsWith('.js')) {
      return sendError(res, 400, 'Invalid file request');
    }

    const jsContent = await fs.readFile(jsPath, 'utf8');
    sendJs(res, jsContent);
  } catch (error) {
    log('error', `Error serving JS file ${pathname}:`, error);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('JS file not found');
  }
}

async function handleGetFiles(req, res) {
  try {
    const files = await fs.readdir(CHAPTERS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

    // Get file stats and extract chapter number and shortcut from frontmatter
    const filesWithChapters = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = join(CHAPTERS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const stats = await fs.stat(filePath);

        // Extract chapter number and shortcut from frontmatter
        let chapterNumber = 999; // Default for files without chapter number
        let shortcut = null;
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const chapterMatch = frontmatterMatch[1].match(/^chapter:\s*(\d+)/m);
          if (chapterMatch) {
            chapterNumber = parseInt(chapterMatch[1], 10);
          }
          const shortcutMatch = frontmatterMatch[1].match(/^shortcut:\s*([a-z])/m);
          if (shortcutMatch) {
            shortcut = shortcutMatch[1];
          }
        }

        return {
          name: file,
          chapterNumber,
          shortcut,
          mtime: stats.mtime.getTime()
        };
      })
    );

    // Sort by chapter number (ascending)
    filesWithChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    // Find most recently modified file for default selection
    const mostRecent = [...filesWithChapters].sort((a, b) => b.mtime - a.mtime)[0];

    sendJson(res, 200, {
      files: filesWithChapters.map(f => ({
        name: f.name,
        shortcut: f.shortcut,
        chapterNumber: f.chapterNumber !== 999 ? f.chapterNumber : null
      })),
      lastModified: mostRecent ? mostRecent.name : null
    });
  } catch (error) {
    log('error', 'Error reading chapters directory:', error);
    sendError(res, 500, 'Failed to read chapters directory', error.message);
  }
}

async function handleSearch(req, res) {
  try {
    const { query } = parse(req.url, true);
    const searchQuery = query.q;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return sendJson(res, 200, { results: [] });
    }

    const results = [];
    const searchTerm = searchQuery.toLowerCase().trim();

    // If cache is empty, return empty results (cache warming should handle this)
    if (fileCache.size === 0) {
      return sendJson(res, 200, {
        results: [],
        message: "Cache not ready. Please try again in a moment."
      });
    }

    // Search through cached files only (no file I/O)
    for (const [filename, cachedData] of fileCache) {
      try {
        const notes = cachedData.notes;

        // Search through cached notes
        for (const note of notes) {
          const fullContent = note.content;

          if (fullContent.toLowerCase().includes(searchTerm)) {
            // Create preview that includes the search term
            const searchIndex = fullContent.toLowerCase().indexOf(searchTerm);
            let preview;

            if (searchIndex !== -1) {
              // Extract context around the search term (50 chars before and after)
              const start = Math.max(0, searchIndex - 50);
              const end = Math.min(fullContent.length, searchIndex + searchTerm.length + 50);
              let snippet = fullContent.substring(start, end);

              // Add ellipsis if we truncated
              if (start > 0) snippet = '...' + snippet;
              if (end < fullContent.length) snippet = snippet + '...';

              preview = snippet.trim();
            } else {
              // Fallback to first line if somehow search term not found
              const lines = fullContent.split('\n').filter(line => line.trim().length > 0);
              const firstLine = lines.length > 0 ? lines[0].trim() : '';
              preview = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
            }

            // Create highlighted preview
            const highlightedPreview = highlightSearchTerm(preview, searchQuery);

            results.push({
              filename,
              noteId: note.noteId,
              preview,
              highlightedPreview
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to search in file ${filename}:`, error);
      }
    }

    // Sort results by relevance (position of match in text)
    results.sort((a, b) => {
      const aIndex = a.preview.toLowerCase().indexOf(searchTerm);
      const bIndex = b.preview.toLowerCase().indexOf(searchTerm);
      return aIndex - bIndex;
    });

    // Limit results to 20
    const limitedResults = results.slice(0, 20);

    sendJson(res, 200, { results: limitedResults });
  } catch (error) {
    log('error', 'Search error:', error);
    sendError(res, 500, 'Search failed', error.message);
  }
}

// Extract notes from file content
function parseNotesFromContent(content) {
  const notes = [];
  const noteRegex = /<Note id="([^"]+)"[^>]*>([\s\S]*?)<\/Note>/g;
  let match;

  while ((match = noteRegex.exec(content)) !== null) {
    const noteId = match[1];
    const noteRawContent = match[2].trim();
    // Extract only the note content (before first ///)
    const noteContent = noteRawContent.split('///')[0].trim();

    notes.push({ noteId, content: noteContent });
  }

  return notes;
}

// Get cached notes for a file, checking modification time
async function getCachedNotes(filename) {
  const safePath = await validateFile(filename);
  const stats = await fs.stat(safePath);
  const currentMtime = stats.mtime.getTime();

  const cached = fileCache.get(filename);

  // Cache hit: return cached notes if mtime matches
  if (cached && cached.mtime === currentMtime) {
    return cached.notes;
  }

  // Cache miss: read file, parse notes, update cache
  const content = await fs.readFile(safePath, 'utf8');
  const notes = parseNotesFromContent(content);

  fileCache.set(filename, { mtime: currentMtime, notes });
  return notes;
}

// Warm up cache by pre-loading all files
async function handleWarmCache(req, res) {
  try {
    const startTime = process.hrtime.bigint();

    const files = await fs.readdir(CHAPTERS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

    let warmedFiles = 0;
    let skippedFiles = 0;

    for (const filename of mdFiles) {
      try {
        const safePath = await validateFile(filename);
        const stats = await fs.stat(safePath);
        const currentMtime = stats.mtime.getTime();
        const cached = fileCache.get(filename);

        // Only warm files not in cache or with different mtime
        if (!cached || cached.mtime !== currentMtime) {
          await getCachedNotes(filename);
          warmedFiles++;
        } else {
          skippedFiles++;
        }
      } catch (error) {
        console.warn(`Failed to warm cache for file ${filename}:`, error);
      }
    }

    const endTime = process.hrtime.bigint();
    const warmTime = Number(endTime - startTime) / 1_000_000;

    log('performance', `Cache warmed: ${warmedFiles} files loaded, ${skippedFiles} already cached (${Math.round(warmTime)}ms)`);

    sendJson(res, 200, {
      success: true,
      warmedFiles,
      skippedFiles,
      totalFiles: mdFiles.length,
      warmTime: Math.round(warmTime * 100) / 100,
      cacheSize: fileCache.size
    });
  } catch (error) {
    log('error', 'Cache warming error:', error);
    sendError(res, 500, 'Cache warming failed', error.message);
  }
}

// Helper function to highlight search terms
function highlightSearchTerm(text, term) {
  if (!text || !term) return text;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background-color: #fef3c7; color: #92400e;">$1</mark>');
}

async function handleAppendContent(req, res) {
  try {
    const { filename, content, section } = await parseBody(req);

    if (!filename || !content) {
      return sendError(res, 400, 'Missing filename or content');
    }

    const safePath = await validateFile(filename);

    if (section) {
      // Insert at end of specific section
      try {
        await insertAtSectionEnd(safePath, section, content);
        log('append', `src/content/chapters/${filename} (section: ${section})`);
        sendJson(res, 200, { success: true, message: `Content appended to section "${section}" in ${filename}` });
      } catch (error) {
        if (error.message.includes('not found')) {
          return sendError(res, 404, error.message);
        }
        throw error;
      }
    } else {
      // Append to end of file (backward compatibility)
      const appendContent = `\n\n${content}`;
      await fs.appendFile(safePath, appendContent, 'utf8');
      log('append', `src/content/chapters/${filename}`);
      sendJson(res, 200, { success: true, message: `Content appended to ${filename}` });
    }
  } catch (error) {
    if (error.message === 'File not found') {
      return sendError(res, 404, 'File not found');
    }
    log('error', 'Error appending content:', error);
    sendError(res, 500, 'Failed to append content', error.message);
  }
}

async function handleGetNotes(req, res, filename) {
  try {
    const safePath = await validateFile(filename);
    const content = await fs.readFile(safePath, 'utf8');
    const notes = extractNotes(content);

    sendJson(res, 200, { success: true, filename, notes });
  } catch (error) {
    if (error.message === 'File not found') {
      return sendError(res, 404, 'File not found');
    }
    log('error', `Error loading notes from ${filename}:`, error);
    sendError(res, 500, 'Failed to load notes', error.message);
  }
}

async function handleGetAllNotes(req, res) {
  try {
    const files = await fs.readdir(CHAPTERS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

    const allNotes = [];

    // Collect all notes from all chapters
    for (const file of mdFiles) {
      try {
        const filePath = join(CHAPTERS_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const notes = extractNotes(content);

        // Add filename to each note
        notes.forEach(note => {
          allNotes.push({
            ...note,
            filename: file
          });
        });
      } catch (error) {
        console.warn(`Failed to extract notes from ${file}:`, error);
      }
    }

    sendJson(res, 200, { success: true, notes: allNotes });
  } catch (error) {
    log('error', 'Error loading all notes:', error);
    sendError(res, 500, 'Failed to load all notes', error.message);
  }
}

async function handleGetSections(req, res, filename) {
  try {
    const safePath = await validateFile(filename);
    const content = await fs.readFile(safePath, 'utf8');
    const sections = extractSections(content);

    // Sections are already in file order by lineNumber from extractSections
    // No need to sort - maintain the order they appear in the markdown file
    sendJson(res, 200, {
      success: true,
      filename,
      sections: sections.map(s => s.title)
    });
  } catch (error) {
    if (error.message === 'File not found') {
      return sendError(res, 404, 'File not found');
    }
    log('error', `Error loading sections from ${filename}:`, error);
    sendError(res, 500, 'Failed to load sections', error.message);
  }
}

async function insertAtSectionEnd(safePath, sectionTitle, content) {
  const fileContent = await fs.readFile(safePath, 'utf8');
  const lines = fileContent.split('\n');
  const sections = extractSections(fileContent);

  // Find the target section
  const sectionIndex = sections.findIndex(s => s.title === sectionTitle);
  if (sectionIndex === -1) {
    throw new Error(`Section "${sectionTitle}" not found`);
  }

  const currentSection = sections[sectionIndex];
  const nextSection = sections[sectionIndex + 1];

  // Determine insert position
  let insertLineNumber;
  if (nextSection) {
    // Insert before the next section
    insertLineNumber = nextSection.lineNumber;
  } else {
    // This is the last section, insert at end of file
    insertLineNumber = lines.length;
  }

  // Find the last non-empty line before insert position
  let actualInsertLine = insertLineNumber;
  for (let i = insertLineNumber - 1; i > currentSection.lineNumber; i--) {
    if (lines[i].trim() !== '') {
      actualInsertLine = i + 1;
      break;
    }
  }

  // Insert the content with proper spacing
  const beforeContent = lines.slice(0, actualInsertLine).join('\n');
  const afterContent = lines.slice(actualInsertLine).join('\n');

  // Ensure proper spacing: add newlines before and after the note
  const spacing = beforeContent.endsWith('\n\n') ? '' : '\n';
  const updatedContent = beforeContent + spacing + '\n' + content + '\n' + afterContent;

  await fs.writeFile(safePath, updatedContent, 'utf8');
}

async function handleGetNote(req, res, noteId) {
  try {
    const files = await fs.readdir(CHAPTERS_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
    
    let foundNote = null;
    let foundFilename = null;
    
    // Search for note ID in all files
    for (const file of mdFiles) {
      const filePath = join(CHAPTERS_DIR, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Find note with matching ID
      const noteRegex = new RegExp(`<Note id="${noteId}"[^>]*>([\\s\\S]*?)<\\/Note>`, 'g');
      const match = noteRegex.exec(content);
      
      if (match) {
        const noteContent = match[1].trim();
        
        // Parse note content (content /// reference /// source)
        const parts = noteContent.split('///').map(part => part.trim());
        
        let reference = '';
        if (parts.length >= 2) {
          // Combine reference and source without /// separators for editing
          reference = parts.slice(1).join('\n\n').trim();
        }
        
        foundNote = {
          content: parts[0] || '',
          reference: reference
        };
        foundFilename = file;
        break;
      }
    }
    
    if (foundNote) {
      sendJson(res, 200, {
        success: true,
        noteId,
        filename: foundFilename,
        content: foundNote.content,
        reference: foundNote.reference
      });
    } else {
      sendError(res, 404, `Note #${noteId} not found`);
    }
  } catch (error) {
    log('error', `Error loading note ${noteId}:`, error);
    sendError(res, 500, 'Failed to load note', error.message);
  }
}

async function handleUpdateNote(req, res, noteId) {
  try {
    const { filename, content } = await parseBody(req);
    
    if (!filename || !content || !noteId) {
      return sendError(res, 400, 'Missing filename, content, or noteId');
    }

    const safePath = await validateFile(filename);
    
    // Read the file
    const fileContent = await fs.readFile(safePath, 'utf8');

    // Find and replace the specific note using manual position detection
    const noteStartPattern = `<Note id="${noteId}"`;
    const noteStart = fileContent.indexOf(noteStartPattern);
    
    if (noteStart === -1) {
      return sendError(res, 404, `Note #${noteId} not found in ${filename}`);
    }
    
    // Find the opening tag end
    const openTagEnd = fileContent.indexOf('>', noteStart);
    if (openTagEnd === -1) {
      return sendError(res, 500, 'Malformed Note tag');
    }
    
    // Find the closing tag
    const noteEnd = fileContent.indexOf('</Note>', openTagEnd);
    if (noteEnd === -1) {
      return sendError(res, 500, 'Note closing tag not found');
    }
    
    // Replace the note content
    const beforeNote = fileContent.substring(0, noteStart);
    const afterNote = fileContent.substring(noteEnd + 7); // +7 for '</Note>'
    const updatedContent = beforeNote + content + afterNote;

    // Write the updated content back
    await fs.writeFile(safePath, updatedContent, 'utf8');

    log('update', `Note #${noteId} in src/content/chapters/${filename}`);
    sendJson(res, 200, { success: true, message: `Note #${noteId} updated in ${filename}` });
  } catch (error) {
    if (error.message === 'File not found') {
      return sendError(res, 404, 'File not found');
    }
    log('error', `Error updating note ${noteId}:`, error);
    sendError(res, 500, 'Failed to update note', error.message);
  }
}

// =============================================================================
// ROUTING
// =============================================================================

const routes = [
  { method: 'GET', pattern: '/editor', handler: handleEditor },
  { method: 'GET', pattern: '/styles.css', handler: handleCss },
  { method: 'GET', pattern: '/js/', handler: handleJs },
  { method: 'GET', pattern: '/api/files', handler: handleGetFiles },
  { method: 'GET', pattern: '/api/all-notes', handler: handleGetAllNotes },
  { method: 'GET', pattern: '/api/search', handler: handleSearch },
  { method: 'POST', pattern: '/api/append', handler: handleAppendContent },
  { method: 'POST', pattern: '/api/warm-cache', handler: handleWarmCache },
  {
    method: 'GET',
    pattern: '/api/notes/',
    handler: (req, res, pathname) => {
      const filename = decodeURIComponent(pathname.split('/api/notes/')[1]);
      return handleGetNotes(req, res, filename);
    }
  },
  {
    method: 'GET',
    pattern: '/api/sections/',
    handler: (req, res, pathname) => {
      const filename = decodeURIComponent(pathname.split('/api/sections/')[1]);
      return handleGetSections(req, res, filename);
    }
  },
  {
    method: 'GET',
    pattern: '/api/note/',
    handler: (req, res, pathname) => {
      const noteId = decodeURIComponent(pathname.split('/api/note/')[1]);
      return handleGetNote(req, res, noteId);
    }
  },
  {
    method: 'PUT',
    pattern: '/api/note/',
    handler: (req, res, pathname) => {
      const noteId = decodeURIComponent(pathname.split('/api/note/')[1]);
      return handleUpdateNote(req, res, noteId);
    }
  }
];

async function handleRequest(req, res) {
  const { pathname } = parse(req.url, true);
  const method = req.method;
  
  // Log non-GET requests
  if (method !== 'GET') {
    log('info', `${method} ${pathname}`);
  }
  
  // Find matching route
  for (const route of routes) {
    if (route.method === method) {
      if (route.pattern === pathname || pathname.startsWith(route.pattern)) {
        try {
          // Pass pathname for routes that need it (like JS file serving)
          if (route.handler.length > 2) {
            await route.handler(req, res, pathname);
          } else {
            await route.handler(req, res);
          }
          return;
        } catch (error) {
          log('error', 'Route handler error:', error);
          sendError(res, 500, 'Internal server error');
          return;
        }
      }
    }
  }
  
  // 404 for unmatched routes
  sendError(res, 404, 'Not found');
}

// =============================================================================
// SERVER SETUP
// =============================================================================

const server = createServer(handleRequest);

server.listen(PORT, async () => {
  console.log(`Writer running on http://localhost:${PORT}`);
  console.log(`Serving chapters from: ${CHAPTERS_DIR}`);

  // Generate CSS on startup
  try {
    await generateCSS();
  } catch (error) {
    console.error('Failed to generate CSS on startup:', error);
    process.exit(1);
  }

  // Watch for changes to editor.html and styles.css
  const filesToWatch = [EDITOR_PATH, join(__dirname, 'styles.css')];

  filesToWatch.forEach(file => {
    watchFile(file, { interval: 1000 }, async (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        // log('info', `File changed: ${file}, regenerating CSS...`);
        try {
          await generateCSS();
        } catch (error) {
          log('error', 'Failed to regenerate CSS:', error);
        }
      }
    });
  });

  log('info', 'Watching for changes to editor.html and styles.css');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down writer...');
  server.close(() => {
    process.exit(0);
  });
});