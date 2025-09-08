# API Server for Development

This is a standalone Node.js API server that provides development-only endpoints for the impact-of-ai project.

## Features

- **GET /api/files** - List available chapter files sorted by modification time
- **POST /api/append** - Append content to chapter files

## Setup

```bash
cd api-server
pnpm install
```

## Usage

Start the API server:
```bash
pnpm start
# or for development with auto-reload:
pnpm dev
```

The server runs on `http://localhost:3001` and serves files from `../src/content/chapters/`.

## Integration

The main Astro project's editor (`/editor`) page connects to this API server when running in development mode. This separation allows:

1. **Clean production builds** - No API routes to complicate static site generation
2. **Development functionality** - Full file system access for content management
3. **Simple deployment** - Main project remains purely static

## CORS

The server includes CORS headers to allow requests from the Astro dev server running on a different port.