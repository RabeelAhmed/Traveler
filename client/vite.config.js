import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),svgr()],
  build: { rollupOptions: { output: { manualChunks: {
    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
    'motion-vendor': ['framer-motion'],
    'state-vendor': ['@reduxjs/toolkit', 'react-redux'],
  } } } },
})
