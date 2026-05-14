import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    process: JSON.stringify({ env: { NODE_ENV: 'production' } }),
  },
  build: {
    outDir: 'JS/react-nav',
    emptyOutDir: true,
    lib: {
      entry: 'src/home-nav-entry.jsx',
      formats: ['es'],
      fileName: () => 'home-pill-nav.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'home-pill-nav[extname]',
      },
    },
  },
});
