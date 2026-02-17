import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Defines process.env to prevent "process is not defined" error in browser
    // and injects the API_KEY from the system environment variables during build/serve
    'process.env': {
      API_KEY: process.env.API_KEY || ''
    }
  },
  server: {
    // Bind to all network interfaces
    host: '0.0.0.0', 
    port: 80,
    // Fixes "Blacklisted" or "Invalid Host Header" on Ngrok or VPS
    allowedHosts: true, 
    cors: true,
    hmr: {
      // Disable overlay to prevent connection errors from blocking the UI
      overlay: false,
    }
  },
});