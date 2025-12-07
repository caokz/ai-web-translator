import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    {
      name: 'copy-styles',
      apply: 'build',
      generateBundle() {
        const sourceFile = path.resolve(__dirname, 'src/content/styles.css');
        const destFile = path.resolve(__dirname, 'dist/src/content/styles.css');

        if (fs.existsSync(sourceFile)) {
          const content = fs.readFileSync(sourceFile, 'utf-8');
          fs.mkdirSync(path.dirname(destFile), { recursive: true });
          fs.writeFileSync(destFile, content);
        }
      }
    }
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false
  }
});
