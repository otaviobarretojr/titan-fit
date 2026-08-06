import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/titan-fit/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icon.svg'],
    manifest: {
      name: 'TITAN FIT', short_name: 'TITAN FIT', description: 'Treine. Registre. Evolua.',
      start_url: '/titan-fit/', scope: '/titan-fit/', display: 'standalone', orientation: 'portrait',
      background_color: '#090b0f', theme_color: '#090b0f',
      icons: [{ src: '/titan-fit/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: { navigateFallback: '/titan-fit/index.html', cleanupOutdatedCaches: true, cacheId: 'titan-fit' }
  })],
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] }
});
