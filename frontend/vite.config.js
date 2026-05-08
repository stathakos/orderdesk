import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      // includeAssets: ['favicon.ico'],
      manifest: {
        name: 'OrderDesk',
        short_name: 'OrderDesk',
        description: 'Restaurant Order Management System',
        theme_color: '#212529',
        background_color: '#212529',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-1-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-1-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/.*:8000\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
