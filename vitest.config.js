import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const wordpressHost = (file) => fileURLToPath(new URL(`./tests/js/wordpress-host/${file}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@wordpress/components': wordpressHost('components.jsx'),
      '@wordpress/compose': wordpressHost('compose.js'),
      '@wordpress/hooks': wordpressHost('hooks.js'),
      '@wordpress/url': wordpressHost('url.js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/js/setup.js'],
  },
});
