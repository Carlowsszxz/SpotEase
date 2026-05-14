import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    process: JSON.stringify({ env: { NODE_ENV: 'production' } }),
  },
  build: {
    outDir: 'JS/react-accesshistory',
    emptyOutDir: true,
    lib: {
      entry: 'src/access-history-page-entry.jsx',
      formats: ['es'],
      fileName: () => 'access-history-page.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'access-history-page[extname]',
      },
    },
  },
});
