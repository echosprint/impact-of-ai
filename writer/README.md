# Writer - Development Tool

This is a standalone Node.js writing tool that provides development-only endpoints and editor interface for the impact-of-ai project.

## Features

### API Endpoints
- **GET /api/files** - List available chapter files sorted by modification time
- **POST /api/append** - Append content to chapter files
- **GET /api/notes/:filename** - Get all note IDs from a specific chapter
- **GET /api/note/:id** - Load note by ID for editing
- **PUT /api/note/:id** - Update existing note content

### Editor Interface
- **GET /editor** - Standalone HTML editor for writing and editing notes
- Smart source detection for bibliography formats
- Real-time preview and auto-resize textareas
- Character counter with Chinese/Unicode support
- Edit existing notes or create new ones
- Comprehensive keyboard shortcuts for efficient writing

#### Keyboard Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| `/` | Focus Note Content | Jump to main writing area |
| `]` | Focus Quotes Area | Jump to quotes/references area |
| `e` | Focus Note ID | Access note search/selection |
| `Escape` | Blur Current Field | Exit any active input |
| `Ctrl/Cmd + Enter` or `Ctrl/Cmd + S` | Submit | Save/commit current content |
| `Ctrl/Cmd + L` | Clear All | Reset editor to initial state |

#### Advanced Features
- **Dropdown Navigation**: Arrow keys, Enter, Escape in note selection
- **Unsaved Changes Protection**: Prevents accidental data loss
- **Smart Field Behavior**: Note ID field reverts to current note on blur
- **Chinese Input Support**: Proper pinyin composition handling
- **Character Counting**: Excludes whitespace, counts visible characters only

## Setup

```bash
cd writer
# No dependencies needed - uses only Node.js built-ins!
```

## Usage

Start the writer:
```bash
node server.js
# or for development with auto-reload:
npm run dev
```

The server runs on `http://localhost:3001` and:
- Serves the editor at `http://localhost:3001/editor`
- Provides API endpoints at `http://localhost:3001/api/*`
- Reads/writes files from `../src/content/chapters/`

## Architecture

The editor is now **self-contained** within the writer:

1. **Zero Dependencies** - Uses only Node.js built-ins (http, fs, path, url)
2. **Same-Origin** - Editor and API served from same port, no CORS needed
3. **No Auto-Refresh Issues** - Editor won't reload when content files change
4. **Modular Design** - Clean separation of utilities, route handlers, and routing

## Benefits

- **Development Efficiency** - Dedicated writing interface with smart features
- **Clean Separation** - Writer independent of main Astro project
- **No Build Dependencies** - Runs anywhere Node.js runs
- **Consistent UX** - Messages display properly without interruption