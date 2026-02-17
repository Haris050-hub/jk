import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all network interfaces
    host: '0.0.0.0', 
    port: 80,
    // Fixes "Blacklisted" or "Invalid Host Header" on Ngrok
    allowedHosts: true, 
    cors: true,
    hmr: {
      // Force the HMR client to connect via the standard HTTPS port used by Ngrok
      // This often fixes the issue where the browser tries to connect to ws://localhost:80 
      // which fails when viewing the site via https://....ngrok.app
      clientPort: 443,
      overlay: false,
    }
  },
});