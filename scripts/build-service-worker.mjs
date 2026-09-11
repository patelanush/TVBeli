import { generateSW } from 'workbox-build';

await generateSW({
  globDirectory: 'dist',
  globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2}'],
  swDest: 'dist/sw.js',
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api\//, /^\/__\/auth\//],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/image\.tmdb\.org\//,
      handler: 'CacheFirst',
      options: { cacheName: 'tmdb-images', expiration: { maxEntries: 250, maxAgeSeconds: 2592000 } },
    },
  ],
});
