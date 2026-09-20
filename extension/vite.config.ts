import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const page = (name: string) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

/** ExtensionPay's prebuilt script runs as a plain content script on extensionpay.com, so it's copied rather than bundled. */
const extPayContentScript = (): Plugin => ({
  name: 'extpay-content-script',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'ExtPay.js',
      source: readFileSync(fileURLToPath(new URL('./node_modules/extpay/dist/ExtPay.js', import.meta.url)), 'utf8'),
    });
  },
});

// Builds an unpacked MV3 extension into dist/. public/manifest.json is copied as-is.
export default defineConfig(({ mode }) => ({
  plugins: [react(), extPayContentScript()],
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
        paywall: page('paywall'),
        background: fileURLToPath(new URL('./src/background.ts', import.meta.url)),
      },
      output: {
        // The manifest points at background.js, so it can't be hashed.
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
}));
