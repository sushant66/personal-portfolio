// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// Static output. Netlify auto-detects Astro and serves dist/ with zero config.
export default defineConfig({
  site: 'https://sushantkadam.is-a.dev',

  build: {
    inlineStylesheets: 'auto',
  },

  // Dual-theme code highlighting. defaultColor:false emits CSS custom props
  // (--shiki-light / --shiki-dark) instead of hard colors, so the blog's
  // [data-theme] toggle can switch highlighting without a flash.
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      wrap: false,
    },
  },

  integrations: [sitemap()],
});