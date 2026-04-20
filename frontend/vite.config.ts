import { defineConfig } from 'vite';
import react from '@vitejs/react-refresh';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ registerType: 'autoUpdate' })
  ]
});