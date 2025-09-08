import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';

export const prerender = true;

export const GET: APIRoute = async () => {
  // Only work in development
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const chaptersDir = path.join(process.cwd(), 'src/content/chapters');
    const files = await fs.readdir(chaptersDir);
    
    // Filter for .md and .mdx files and get their stats
    const mdFiles = files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
    
    // Get file stats and sort by modification time (newest first)
    const filesWithStats = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(chaptersDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          mtime: stats.mtime.getTime()
        };
      })
    );
    
    // Sort by modification time (newest first)
    filesWithStats.sort((a, b) => b.mtime - a.mtime);
    
    return new Response(JSON.stringify({ 
      files: filesWithStats.map(f => f.name),
      lastModified: filesWithStats.length > 0 ? filesWithStats[0].name : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to read chapters directory',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};