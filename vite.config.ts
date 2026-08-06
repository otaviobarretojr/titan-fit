import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/titan-fit/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'TITAN FIT',
        short_name: 'TITAN FIT',
        description: 'Treine. Registre. Evolua.',
        start_url: '/titan-fit/',
        scope: '/titan-fit/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0f17',
        theme_color: '#0b0f17',
        icons: [
          {
            src: '/titan-fit/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cacheId: 'titan-fit',
        cleanupOutdatedCaches: true,
        navigateFallback: '/titan-fit/index.html',
        globPatterns: ['**/*.{js,css,html,svg}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
});
