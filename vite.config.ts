import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/titan-fit/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icons/icon-192.png'],
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
            src: '/titan-fit/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        cacheId: 'titan-fit',
        cleanupOutdatedCaches: true,
        navigateFallback: '/titan-fit/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: []
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
});
