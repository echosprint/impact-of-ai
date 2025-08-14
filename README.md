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
- 🔍 **Interactive References** - Hover and click citations for detailed source information  
- 📑 **Smart Navigation** - Sticky table of contents with progress tracking
- 🎨 **Beautiful Typography** - Optimized Chinese text rendering with proper spacing
- ⚡ **Fast Loading** - Static site generation with optimal performance
- 🌐 **Multi-language Support** - Built-in Chinese and English text handling

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
└── utils/               # Shared utility functions
    ├── markdown.ts      # Markdown processing
    └── reference-positioning.ts
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

## 📝 Commands

| Command | Action |
|---------|--------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start local dev server at `localhost:4321` |
| `pnpm build` | Build production site to `./dist/` |
| `pnpm preview` | Preview build locally |
| `pnpm chapter` | Create a new chapter (interactive) |
| `pnpm reference` | Add a new reference (interactive) |

## 📖 Content Management

### Adding Chapters

Use the built-in chapter creation tool:

```bash
pnpm chapter
```

Or manually create files in `src/content/chapters/` following the existing structure.

### Managing References

Add citations using the reference tool:

```bash
pnpm reference
```

References are stored in `src/content/reference.md` and can be linked from any chapter using:

```markdown
<Note ref="reference-id">
Your note content here.
</Note>
```

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