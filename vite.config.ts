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
      // Disable overlay to prevent connection errors from blocking the UI
      overlay: false,
    }
  },
});