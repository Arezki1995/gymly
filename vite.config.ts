/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { validateContent } from './src/content/validate.ts';

/** Fails the build (and dev server start) if any content file is invalid. */
function validateContentPlugin(): Plugin {
  const read = (name: string): unknown =>
    JSON.parse(readFileSync(new URL(`./src/content/${name}.json`, import.meta.url), 'utf8'));
  return {
    name: 'gymly:validate-content',
    buildStart() {
      const errors = validateContent({
        exercises: read('exercises'),
        programs: read('programs'),
        assessments: read('assessments'),
        illustrations: read('illustrations'),
      });
      if (errors.length) this.error(`Invalid content:\n  ${errors.join('\n  ')}`);
    },
  };
}

// Relative base so the build works on GitHub Pages project sites and any static host.
export default defineConfig({
  base: './',
  plugins: [
    validateContentPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gymly',
        short_name: 'Gymly',
        description: 'Gym mobility training: shoulders, hips and joint health.',
        theme_color: '#10b981',
        background_color: '#0b1220',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
