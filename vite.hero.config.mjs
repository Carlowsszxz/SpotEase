import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    process: JSON.stringify({ env: { NODE_ENV: 'production' } }),
  },
  build: {
    outDir: 'JS/react-hero',
    emptyOutDir: true,
    lib: {
      entry: 'src/home-hero-entry.jsx',
      formats: ['es'],
      fileName: () => 'home-hero-tilted.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'home-hero-tilted[extname]',
      },
    },
  },
});
