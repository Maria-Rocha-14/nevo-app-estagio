import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    allowedHosts: true,
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
