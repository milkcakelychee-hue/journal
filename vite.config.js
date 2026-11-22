import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };

let hash = '';
try { hash = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version + (hash ? ' · ' + hash : '')) },
  plugins: [
    VitePWA({
      registerType: 'prompt', // ห้ามใช้ autoUpdate คู่กับ src/update.js
      injectRegister: false,
      manifest: {
        name: 'Journal',
        short_name: 'Journal',
        lang: 'th',
        display: 'standalone',
        start_url: './',
        background_color: '#DADADF',
        theme_color: '#DADADF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          { urlPattern: ({ request }) => request.mode === 'navigate', handler: 'NetworkFirst' },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'fonts' } },
        ],
      },
    }),
  ],
});
