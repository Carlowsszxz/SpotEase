import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    process: JSON.stringify({ env: { NODE_ENV: 'production' } }),
  },
  build: {
    outDir: 'JS/react-map',
    emptyOutDir: true,
    lib: {
      entry: 'src/map-page-entry.jsx',
      formats: ['es'],
      fileName: () => 'map-page.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'map-page[extname]',
      },
    },
  },
});
