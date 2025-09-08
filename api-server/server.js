#!/usr/bin/env node
import { createServer } from 'http';
import { promises as fs } from 'fs';
import { join } from 'path';
import { parse } from 'url';

const PORT = 3001;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

async function handleRequest(req, res) {
  const { pathname } = parse(req.url, true);
  const method = req.method;
  
  // Log requests (except OPTIONS and GET /api/files for cleaner logs)
  if (method !== 'OPTIONS' && !(method === 'GET' && pathname === '/api/files')) {
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