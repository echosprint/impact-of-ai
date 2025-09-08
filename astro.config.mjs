// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// Custom integration to exclude dev-only API routes in production
function excludeDevAPIRoutes() {
  return {
    name: 'exclude-dev-api',
    hooks: {
      // @ts-ignore
      'astro:build:setup': ({ pages }) => {
        if (process.env.NODE_ENV === 'production') {
          // Filter out API routes during production build
          // @ts-ignore
          const filteredPages = pages.filter(page => 
            !page.pathname?.includes('/api/append') && 
            !page.pathname?.includes('/api/files')
          );
          pages.splice(0, pages.length, ...filteredPages);
        }
      }
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://echosprint.github.io',
  base: '/impact-of-ai',
  output: 'static',
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    excludeDevAPIRoutes(),
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  }
});