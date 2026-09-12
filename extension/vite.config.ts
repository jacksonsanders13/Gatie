import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

// Builds an unpacked MV3 extension into dist/. public/manifest.json is copied as-is.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: mode === 'development',
    rollupOptions: {
      input: {
        gate: page('gate'),
        popup: page('popup'),
        dashboard: page('dashboard'),
        welcome: page('welcome'),
        background: fileURLToPath(new URL('./src/background.ts', import.meta.url)),
      },
      output: {
        // The manifest points at background.js, so it can't be hashed.
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
}));
