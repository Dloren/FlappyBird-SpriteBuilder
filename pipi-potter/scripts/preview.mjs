import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('file://' + resolve('../dist/pipi-potter.html'));
await page.waitForTimeout(300);
for (let i = 0; i < 5; i++) {
  const url = await page.evaluate((i) => window.__pipi.preview(i), i);
  writeFileSync(`${out}/level${i + 1}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
