# AI大冲击：经济需求的坍缩

> 📚 **A Digital Book** exploring the transformative impact of artificial intelligence on economics and society.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue?style=flat&logo=github)](https://echosprint.github.io/impact-of-ai)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-FF5D01?style=flat&logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)

## 🎯 About This Book

深入探讨人工智能对经济结构的冲击以及需求坍缩现象的分析。本书从多个维度分析AI技术对传统经济模式的影响，包括GDP增长、中产阶级变迁、工业革命对比等核心议题。

**Author**: 乔迁  
**Language**: 中文 (Simplified Chinese)  
**Format**: Interactive Digital Book

## ✨ Features

- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile reading
- 🔍 **Interactive References** - Self-contained citations with embedded reference content
- 📑 **Smart Navigation** - Sticky table of contents with progress tracking
- 🎨 **Beautiful Typography** - Optimized Chinese text rendering with proper spacing
- ⚡ **Fast Loading** - Static site generation with optimal performance
- 🌐 **Multi-language Support** - Built-in Chinese and English text handling
- ✍️ **Writer Interface** - Integrated note-taking and editing system with natural beige theme
- 🌙 **Dark Theme** - VS Code-inspired dark mode with automatic persistence

## 🏗️ Architecture

This project uses a **modern, modular architecture** with clean separation of concerns:

```text
src/
├── components/           # Reusable UI components
│   ├── notes/           # Note content components
│   ├── references/      # Reference system components
│   └── TableOfContents.astro
├── config/              # Configuration constants
│   ├── layout.ts        # Layout and responsive settings
│   └── site.ts          # Site metadata
├── content/             # Book content (MDX/Markdown)
│   ├── chapters/        # Individual book chapters
│   ├── config.ts        # Content collection config
│   └── reference.md     # Citation database
├── layouts/             # Page layout components
├── scripts/             # Client-side functionality
│   └── reference-manager.ts  # Reference positioning system
├── styles/              # Modular CSS
│   ├── components/      # Component-specific styles
│   └── global.css       # Base typography
├── types/               # TypeScript definitions
├── utils/               # Shared utility functions
│   ├── markdown.ts      # Markdown processing
│   └── reference-positioning.ts
└── writer/              # Writing interface
    └── editor.html      # Note editing UI with dual theme support
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (18+ recommended)
- **pnpm** (preferred) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/echosprint/impact-of-ai.git
cd impact-of-ai

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:4321` to start reading!

### Writer Interface

Access the integrated writing interface at `http://localhost:4321/writer/editor.html` during development. This provides:

- **Dual Theme Support**: Toggle between natural beige and VS Code dark themes with `Ctrl+B`
- **Smart Note Management**: Create, edit, and organize notes with automatic source detection
- **Keyboard Shortcuts**: Efficient navigation and editing with extensive hotkey support
- **Real-time Persistence**: Automatic saving with theme preference storage

## 📝 Commands

| Command | Action |
|---------|--------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start both Astro and API servers for full development experience |
| `pnpm dev:astro` | Start only the Astro dev server |
| `pnpm dev:api` | Start only the API server |
| `pnpm build` | Build production site to `./dist/` |
| `pnpm preview` | Preview build locally |
| `pnpm chapter` | Create a new chapter (interactive) |

### Development Setup

The `pnpm dev` command starts two servers concurrently:
- **Astro Server**: Main site at `http://localhost:4321` (or next available port)
- **API Server**: Development API at `http://localhost:3001`

The API server provides file management capabilities for the `/editor` page during development.

## 📖 Content Management

### Adding Chapters

Use the built-in chapter creation tool:

```bash
pnpm chapter
```

Or manually create files in `src/content/chapters/` following the existing structure.

### Managing References

References are now embedded directly within Note components using triple-slash separators:

```markdown
<Note>
Your citation text that appears inline
///
Detailed reference explanation with **markdown formatting**
///
Source: Author Name, "Book Title", Publisher, 2024, pp. 123-145
</Note>
```

**Benefits:**
- Self-contained citations (no external reference file needed)
- GitHub-friendly formatting (separators are plain text)
- Flexible per-note reference content

### Content Structure

Chapters use frontmatter for metadata:

```yaml
---
title: "Chapter Title"
description: "Brief description"
chapter: 1
publishDate: 2024-01-01
---
```

## 🛠️ Technical Highlights

### Performance Optimizations
- **Static Site Generation** - Pre-built pages for maximum speed
- **Component Code Splitting** - Modular CSS and JavaScript loading
- **Image Optimization** - Automatic image processing and lazy loading
- **Minimal JavaScript** - Only essential interactivity included

### Developer Experience  
- **TypeScript Throughout** - Full type safety with comprehensive interfaces
- **Modular CSS** - Component-scoped stylesheets for maintainability
- **Hot Reloading** - Instant preview during development
- **Build Verification** - Automated testing ensures no broken imports

### Reading Experience
- **Smart Reference System** - Contextual citation display with smooth animations
- **Optimal Typography** - Chinese text optimized with proper fonts and spacing
- **Responsive Layout** - Adaptive design for all screen sizes
- **Accessibility** - Semantic HTML with ARIA support

### Writing Experience
- **Natural Themes** - Warm beige light theme and VS Code-inspired dark theme
- **Smart Editing** - Auto-resizing text areas with character counting
- **Source Detection** - Automatic bibliography format recognition
- **Keyboard Navigation** - Comprehensive hotkey support for efficient workflow:
  - `/` or `i` - Focus note input area
  - `]` or `I` - Focus quotes/reference area
  - `e` - Focus note ID area
  - `?` - Show keyboard shortcuts help
  - `Escape` - Blur current field
  - `Ctrl/Cmd + Enter` or `Ctrl/Cmd + S` - Submit/save content
  - `Ctrl/Cmd + L` - Clear all and reset
  - `Ctrl/Cmd + R` - Load most recent note
  - `Ctrl/Cmd + B` - Toggle theme

## 🌐 Deployment

This site is automatically deployed to **GitHub Pages** on every push to main:

- **Production URL**: https://echosprint.github.io/impact-of-ai
- **Build Process**: GitHub Actions → Static Site Generation → GitHub Pages
- **CDN**: Globally distributed via GitHub's CDN network

### Manual Deployment

```bash
# Build the site
pnpm build

# Deploy to GitHub Pages (if configured)
pnpm astro -- --deploy
```

## 🤝 Contributing

Contributions are welcome! Whether it's:

- 📖 Content improvements or translations
- 🐛 Bug fixes and optimizations  
- ✨ New features or enhancements
- 📝 Documentation updates

Please feel free to open issues or submit pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- 📚 **Live Book**: https://echosprint.github.io/impact-of-ai
- 🚀 **Astro Documentation**: https://docs.astro.build
- 🎨 **TailwindCSS**: https://tailwindcss.com
- 📖 **MDX**: https://mdxjs.com

---

*Built with ❤️ using modern web technologies for an optimal reading experience.*