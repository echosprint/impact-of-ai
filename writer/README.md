# Writer - Development Tool

This is a standalone Node.js writing tool that provides development-only endpoints and editor interface for the impact-of-ai project.

## Features

### API Endpoints
- **GET /api/files** - List available chapter files sorted by modification time
- **GET /api/sections/:filename** - Get all H2 sections from a chapter, sorted by most recent note activity
- **POST /api/append** - Append content to chapter files or specific sections (supports optional `section` parameter)
- **GET /api/notes/:filename** - Get all note IDs from a specific chapter with section information
- **GET /api/note/:id** - Load note by ID for editing
- **PUT /api/note/:id** - Update existing note content
- **GET /api/search** - Full-text search across all notes with highlighted previews
- **POST /api/warm-cache** - Pre-load file cache for faster searches

### Editor Interface
- **GET /editor** - Standalone HTML editor with Tailwind CSS styling
- **GET /styles.css** - Optimized Tailwind CSS generated from editor content
- **Section-aware note management** - Insert notes at the end of specific sections
- **Smart section sorting** - Sections ordered by most recent note activity
- **Auto-initialization** - Automatically selects newest chapter and most active section on load
- **Section-filtered notes** - Note dropdown shows only notes from selected section
- **Note timestamps** - All notes automatically include ISO timestamp in `time` attribute
- Smart source detection for bibliography formats
- Real-time preview and auto-resize textareas
- Character counter with Chinese/Unicode support
- Edit existing notes or create new ones
- Full-text search across all notes
- Comprehensive keyboard shortcuts for efficient writing

#### Keyboard Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| `/` | Search Notes | Open full-text search modal |
| `i` | Focus Note Content | Jump to main writing area |
| `]` or `I` | Focus Quotes Area | Jump to quotes/references area |
| `e` | Focus Note ID | Access note search/selection |
| `c` | Focus Chapter Selection | Access chapter dropdown |
| `s` | Focus Section Selection | Access section dropdown |
| `?` | Show Help | Display keyboard shortcuts help |
| `Escape` | Blur Current Field | Exit any active input or close modals |
| `Ctrl/Cmd + Enter` | Save & Clear | Commit changes and reset editor |
| `Ctrl/Cmd + S` | Save & Stay | Commit changes and stay in edit mode |
| `Ctrl/Cmd + Shift + L` | Clear All | Reset editor to initial state |
| `Ctrl/Cmd + R` | Load Recent | Load most recent note from current section |
| `Ctrl/Cmd + Shift + F` | Hard Refresh | Clear cache and reload page |
| `Ctrl/Cmd + B` | Toggle Dark Theme | Switch between light and dark modes |
| `Ctrl/Cmd + H` | Toggle Quotes Area | Show/hide the quotes section |

#### Advanced Features
- **Section-Specific Insertion**: Notes are inserted at the end of the selected section, maintaining document structure
- **Intelligent Section Sorting**: Sections automatically sorted by most recent note activity
- **Timestamp Tracking**: All notes include automatic ISO timestamp for activity tracking
- **Context-Aware Filtering**: Note dropdown automatically filters by selected section
- **Auto-Initialization**: Page loads with newest chapter and most active section pre-selected
- **Dropdown Navigation**: Arrow keys, Enter, Escape in note selection
- **Unsaved Changes Protection**: Prevents accidental data loss
- **Smart Field Behavior**: Note ID field reverts to current note on blur
- **Chinese Input Support**: Proper pinyin composition handling
- **Character Counting**: Excludes whitespace, counts visible characters only
- **Full-Text Search**: Search across all notes with highlighted match previews
- **File Caching**: Optimized search performance with intelligent file caching

## Setup

```bash
cd writer
# Install Tailwind CSS dependencies
pnpm install
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

## Workflow

### Writing a New Note

1. **Page loads automatically** with:
   - Most recently modified chapter selected
   - Most active section (by recent notes) pre-selected
   - Ready to start writing immediately

2. **Select target location** (optional):
   - Press `c` to change chapter
   - Press `s` to change section
   - Leave section blank to append to end of file

3. **Write your note**:
   - Press `i` to focus on main content area
   - Press `]` to add quotes/references
   - Content automatically gets a unique ID and timestamp

4. **Save**:
   - Press `Ctrl/Cmd + Enter` to save and clear (start new note)
   - Press `Ctrl/Cmd + S` to save and stay (continue editing)

### Editing an Existing Note

1. **Find the note**:
   - Press `/` for full-text search across all notes
   - OR press `e` to browse notes in current section
   - Type to filter notes by ID or content

2. **Load and edit**:
   - Select note from dropdown
   - Edit content (quotes area disabled in edit mode)
   - Press `Ctrl/Cmd + S` to save changes

### Working with Sections

- **Section sorting**: Sections appear in order of most recent note activity
- **Section filtering**: Note list shows only notes from selected section
- **Section insertion**: New notes inserted at end of selected section
- **Smart defaults**: Most active section auto-selected on page load

## Architecture

The editor is **self-contained** within the writer:

1. **Local Tailwind CSS** - Uses Tailwind v4 with optimized CSS generation
2. **Same-Origin** - Editor and API served from same port, no CORS needed
3. **No Auto-Refresh Issues** - Editor won't reload when content files change
4. **Modular Design** - Clean separation of utilities, route handlers, and routing:
   - `noteManager.js` - Note CRUD operations and chapter management
   - `sectionManager.js` - Section loading, filtering, and state management
   - `searchNotes.js` - Full-text search with caching
   - `textareaManager.js` - Auto-resize and character counting
   - `keyboardShortcuts.js` - Comprehensive keyboard navigation
   - `themeManager.js` - Dark/light theme switching
   - `eventHandlers.js` - Centralized event handling
5. **CSS Optimization** - Generates minimal CSS based on actual HTML content
6. **File Watching** - Auto-regenerates CSS when editor.html or styles.css changes
7. **Smart Caching** - File-based cache for optimized search performance

## Benefits

- **Zero-Click Workflow** - Auto-selects newest chapter and most active section on load
- **Context-Aware** - Notes automatically filtered and organized by section
- **Smart Defaults** - Sections sorted by activity, most relevant content surfaces first
- **Precise Placement** - Notes inserted exactly where they belong in document structure
- **Activity Tracking** - Automatic timestamps enable intelligent sorting and filtering
- **Development Efficiency** - Dedicated writing interface with comprehensive shortcuts
- **Clean Separation** - Writer independent of main Astro project
- **Optimized Performance** - Pre-built CSS with file watching and smart caching
- **No CDN Dependencies** - Local Tailwind CSS for faster loading
- **Consistent UX** - Messages display properly without interruption