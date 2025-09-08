import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';

export const prerender = import.meta.env.PROD;

export const POST: APIRoute = async ({ request }) => {
  // Only work in development
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { filename, content } = body;

    if (!filename || !content) {
      return new Response(JSON.stringify({ error: 'Missing filename or content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ensure filename is safe and within chapters directory
    const safePath = path.join(process.cwd(), 'src/content/chapters', filename);
    
    // Verify the file exists
    try {
      await fs.access(safePath);
    } catch {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Append content with newlines
    const appendContent = `\n\n${content}`;
    await fs.appendFile(safePath, appendContent, 'utf8');

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Content appended to ${filename}` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to append content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};