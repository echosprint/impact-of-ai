#!/usr/bin/env node
import { createServer } from 'http';
import { promises as fs } from 'fs';
import { join } from 'path';
import { parse } from 'url';

const PORT = 3001;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

async function handleRequest(req, res) {
  const { pathname } = parse(req.url, true);
  const method = req.method;
  
  // Log requests (except OPTIONS and GET requests for cleaner logs)
  if (method !== 'OPTIONS' && method !== 'GET') {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    console.log(`${timestamp} ${method} ${pathname}`);
  }

  // Handle preflight CORS requests
  if (method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  // GET /api/files - List chapter files
  if (pathname === '/api/files' && method === 'GET') {
    try {
      const chaptersDir = join(process.cwd(), 'src', 'content', 'chapters');
      const files = await fs.readdir(chaptersDir);
      
      const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
      
      // Get file stats and sort by modification time
      const filesWithStats = await Promise.all(
        mdFiles.map(async (file) => {
          const filePath = join(chaptersDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            mtime: stats.mtime.getTime()
          };
        })
      );
      
      filesWithStats.sort((a, b) => b.mtime - a.mtime);
      
      res.writeHead(200, CORS_HEADERS);
      res.end(JSON.stringify({ 
        files: filesWithStats.map(f => f.name),
        lastModified: filesWithStats.length > 0 ? filesWithStats[0].name : null
      }));
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      console.error(`${timestamp} [error] reading chapters directory:`, error);
      res.writeHead(500, CORS_HEADERS);
      res.end(JSON.stringify({ 
        error: 'Failed to read chapters directory',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
    return;
  }

  // POST /api/append - Append content to chapter file
  if (pathname === '/api/append' && method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { filename, content } = JSON.parse(body);
        
        if (!filename || !content) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Missing filename or content' }));
          return;
        }

        const safePath = join(process.cwd(), 'src', 'content', 'chapters', filename);
        
        // Verify the file exists
        try {
          await fs.access(safePath);
        } catch {
          res.writeHead(404, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }

        // Append content with newlines
        const appendContent = `\n\n${content}`;
        await fs.appendFile(safePath, appendContent, 'utf8');

        // Log the successful append operation
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        console.log(`${timestamp} [append] src/content/chapters/${filename}`);

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ 
          success: true, 
          message: `Content appended to ${filename}` 
        }));
      } catch (error) {
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        console.error(`${timestamp} [error] appending to ${filename}:`, error);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ 
          error: 'Failed to append content',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
    return;
  }

  // GET /api/notes/:filename - Get all noteIds from a specific chapter
  if (pathname.startsWith('/api/notes/') && method === 'GET') {
    const filename = decodeURIComponent(pathname.split('/api/notes/')[1]);
    
    try {
      const safePath = join(process.cwd(), 'src', 'content', 'chapters', filename);
      
      try {
        await fs.access(safePath);
      } catch {
        res.writeHead(404, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }

      const content = await fs.readFile(safePath, 'utf8');
      
      // Find all Note components with IDs
      const noteRegex = /<Note id="([^"]+)"[^>]*>([\s\S]*?)<\/Note>/g;
      const notes = [];
      let match;
      
      while ((match = noteRegex.exec(content)) !== null) {
        const noteId = match[1];
        const noteContent = match[2].trim();
        
        // Extract first line for preview (up to 10 chars)
        const lines = noteContent.split('\n').filter(line => line.trim().length > 0);
        const firstLine = lines.length > 0 ? lines[0].trim() : '';
        const preview = firstLine.length > 10 ? firstLine.substring(0, 10) + '...' : firstLine;
        
        notes.push({
          id: noteId,
          preview: preview
        });
      }
      
      res.writeHead(200, CORS_HEADERS);
      res.end(JSON.stringify({ 
        success: true,
        filename,
        notes
      }));
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      console.error(`${timestamp} [error] loading notes from ${filename}:`, error);
      res.writeHead(500, CORS_HEADERS);
      res.end(JSON.stringify({ 
        error: 'Failed to load notes',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
    return;
  }

  // GET /api/note/:id - Load note by ID
  if (pathname.startsWith('/api/note/') && method === 'GET') {
    const noteId = decodeURIComponent(pathname.split('/api/note/')[1]);
    
    try {
      const chaptersDir = join(process.cwd(), 'src', 'content', 'chapters');
      const files = await fs.readdir(chaptersDir);
      const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
      
      let foundNote = null;
      let foundFilename = null;
      
      // Search for note ID in all files
      for (const file of mdFiles) {
        const filePath = join(chaptersDir, file);
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
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({
          success: true,
          noteId,
          filename: foundFilename,
          content: foundNote.content,
          reference: foundNote.reference
        }));
      } else {
        res.writeHead(404, CORS_HEADERS);
        res.end(JSON.stringify({ error: `Note #${noteId} not found` }));
      }
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
      console.error(`${timestamp} [error] loading note ${noteId}:`, error);
      res.writeHead(500, CORS_HEADERS);
      res.end(JSON.stringify({ 
        error: 'Failed to load note',
        details: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
    return;
  }

  // PUT /api/note/:id - Update note by ID
  if (pathname.startsWith('/api/note/') && method === 'PUT') {
    const noteId = decodeURIComponent(pathname.split('/api/note/')[1]);
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { filename, content } = JSON.parse(body);
        
        if (!filename || !content || !noteId) {
          res.writeHead(400, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Missing filename, content, or noteId' }));
          return;
        }

        const safePath = join(process.cwd(), 'src', 'content', 'chapters', filename);
        
        // Read the file
        let fileContent;
        try {
          fileContent = await fs.readFile(safePath, 'utf8');
        } catch {
          res.writeHead(404, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'File not found' }));
          return;
        }

        // Find and replace the specific note using manual position detection
        const noteStartPattern = `<Note id="${noteId}"`;
        const noteStart = fileContent.indexOf(noteStartPattern);
        
        if (noteStart === -1) {
          res.writeHead(404, CORS_HEADERS);
          res.end(JSON.stringify({ error: `Note #${noteId} not found in ${filename}` }));
          return;
        }
        
        // Find the opening tag end
        const openTagEnd = fileContent.indexOf('>', noteStart);
        if (openTagEnd === -1) {
          res.writeHead(500, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Malformed Note tag' }));
          return;
        }
        
        // Find the closing tag
        const noteEnd = fileContent.indexOf('</Note>', openTagEnd);
        if (noteEnd === -1) {
          res.writeHead(500, CORS_HEADERS);
          res.end(JSON.stringify({ error: 'Note closing tag not found' }));
          return;
        }
        
        // Replace the note content
        const beforeNote = fileContent.substring(0, noteStart);
        const afterNote = fileContent.substring(noteEnd + 7); // +7 for '</Note>'
        const updatedContent = beforeNote + content + afterNote;

        // Write the updated content back
        await fs.writeFile(safePath, updatedContent, 'utf8');

        // Log the successful update operation
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        console.log(`${timestamp} [update] Note #${noteId} in src/content/chapters/${filename}`);

        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ 
          success: true, 
          message: `Note #${noteId} updated in ${filename}` 
        }));
      } catch (error) {
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        console.error(`${timestamp} [error] updating note ${noteId}:`, error);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ 
          error: 'Failed to update note',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, CORS_HEADERS);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log(`Serving chapters from: ${join(process.cwd(), 'src', 'content', 'chapters')}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down API server...');
  server.close(() => {
    process.exit(0);
  });
});