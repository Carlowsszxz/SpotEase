import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    process: JSON.stringify({ env: { NODE_ENV: 'production' } }),
  },
  build: {
    outDir: 'JS/react-resourcelist',
    emptyOutDir: true,
    lib: {
      entry: 'src/resource-list-page-entry.jsx',
      formats: ['es'],
      fileName: () => 'resource-list-page.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'resource-list-page[extname]',
      },
    },
  },
});
