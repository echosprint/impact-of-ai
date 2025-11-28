// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { rehypeSectionNumber } from './src/utils/rehype-section-number.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://echosprint.github.io',
  base: '/impact-of-ai',
  output: 'static',
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, rehypeSectionNumber],
    }),
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
    rehypePlugins: [rehypeKatex, rehypeSectionNumber],
  },
  devToolbar: {
    enabled: false
  },
});