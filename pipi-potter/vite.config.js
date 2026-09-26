import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Genera un único HTML autocontenido (JS + CSS inline) en /www,
// que después se copia a ../dist/pipi-potter.html y lo usa Capacitor.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'www',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
});
