import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Bind to all interfaces so mobile devices on LAN can connect
  },
  preview: {
    port: 5173,
    host: true,
  }
});
