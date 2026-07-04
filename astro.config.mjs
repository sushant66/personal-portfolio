// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// Static output. Netlify auto-detects Astro and serves dist/ with zero config.
export default defineConfig({
  site: 'https://sushantkadam.is-a.dev',

  build: {
    inlineStylesheets: 'auto',
  },

  integrations: [sitemap()],
});