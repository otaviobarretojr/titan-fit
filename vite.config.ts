import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/titan-fit/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: [
        'favicon.svg',
        'icons/app-icon.svg',
        'icons/app-icon-maskable.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png'
      ],
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
          { src: '/titan-fit/icons/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/titan-fit/icons/app-icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: '/titan-fit/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/titan-fit/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/titan-fit/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        cacheId: 'titan-fit-v0.37.0',
        cleanupOutdatedCaches: true,
        navigateFallback: '/titan-fit/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: []
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  }
});
