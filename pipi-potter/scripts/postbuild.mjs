// Copia el HTML único generado por Vite a ../dist/pipi-potter.html
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../www/index.html');
const dist = resolve(here, '../../dist');
mkdirSync(dist, { recursive: true });
copyFileSync(src, resolve(dist, 'pipi-potter.html'));
console.log(`dist/pipi-potter.html (${(statSync(src).size / 1024).toFixed(1)} KB)`);
