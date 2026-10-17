import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, API calls to /api are forwarded to the local backend.
    proxy: { '/api': 'http://localhost:5000' },
  },
});
