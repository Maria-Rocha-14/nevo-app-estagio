import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'], // Certifica-te que tens este ficheiro na pasta 'public'
      manifest: {
        name: 'Nevo App',
        short_name: 'Nevo',
        description: 'App de gestão de lesões cutâneas',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/favicon.png', // Usa o teu ícone existente
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules/react')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-db';
          }
          if (id.includes('node_modules/jspdf')) {
            return 'vendor-pdf';
          }
          // Route chunks - one per major module
          if (id.includes('USERM/Login') || id.includes('USERM/Register')) {
            return 'page-auth';
          }
          if (id.includes('USERM/Profile') || id.includes('USERM/Avatar')) {
            return 'page-profile';
          }
          if (id.includes('GAMF/HomePage') || id.includes('GAMF/Learn')) {
            return 'page-gamification';
          }
          if (id.includes('ANLS')) {
            return 'page-analysis';
          }
          if (id.includes('HIST')) {
            return 'page-history';
          }
          if (id.includes('PrivacyPolicy') || id.includes('Terms')) {
            return 'page-static';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})