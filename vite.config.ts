import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// Same as `colors.pageBg` in src/Theme.ts.
const pageBg = '#0f0f14'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Brian Gossett: To-do and Study',
        short_name: 'BG To-do',
        description: 'Tasks, streaks and rewards, plus flashcards.',
        start_url: '/todo',
        scope: '/',
        display: 'standalone',
        theme_color: pageBg,
        background_color: pageBg,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only the app's own files are stored for offline use. There is no
        // runtime caching, so API responses and tokens never enter the cache.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        // The score PDFs are about 874 MB: never precache them.
        globIgnores: ['scores/**'],
        // Page paths (including the sign-in return to /todo?code=...) load the app.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/scores\//],
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: [...configDefaults.exclude, 'infra/**', 'api/**'],
  },
})
