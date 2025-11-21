import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // En producción, Vercel inyecta las variables directamente
    // En desarrollo, las leemos de .env.local
    const getEnvVar = (key: string, fallback?: string) => {
      return process.env[key] || env[key] || fallback || '';
    };

    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'logo.png', 'robots.txt'],
          manifest: {
            name: 'Expendio - Cervecería Popular',
            short_name: 'Expendio',
            description: 'CRM y gestión de mesas para Expendio Cervecería Popular',
            theme_color: '#2A9D8F',
            background_color: '#F4F1DE',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/logo-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/logo-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/logo-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 año
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 5 // 5 minutos
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(getEnvVar('GEMINI_API_KEY')),
        'process.env.GEMINI_API_KEY': JSON.stringify(getEnvVar('GEMINI_API_KEY')),
        'process.env.SUPABASE_URL': JSON.stringify(getEnvVar('SUPABASE_URL')),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(getEnvVar('SUPABASE_ANON_KEY')),
        'process.env.ADMIN_EMAIL': JSON.stringify(getEnvVar('ADMIN_EMAIL', 'creastilloaixperience@gmail.com')),
        'process.env.NODE_ENV': JSON.stringify(mode || 'development'),
        'process.env.USE_MOCK': JSON.stringify(mode === 'production' ? 'false' : (getEnvVar('USE_MOCK', 'true')))
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
