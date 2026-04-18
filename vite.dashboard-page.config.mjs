import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    process: JSON.stringify({ env: { NODE_ENV: 'production' } }),
  },
  build: {
    outDir: 'JS/react-dashboard',
    emptyOutDir: false,
    lib: {
      entry: 'src/dashboard-page-entry.jsx',
      formats: ['es'],
      fileName: () => 'dashboard-page.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'dashboard-page[extname]',
      },
    },
  },
});
