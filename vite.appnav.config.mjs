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
    emptyOutDir: false,
    lib: {
      entry: 'src/app-pillnav-entry.jsx',
      formats: ['es'],
      fileName: () => 'app-pill-nav.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'app-pill-nav[extname]',
      },
    },
  },
});
