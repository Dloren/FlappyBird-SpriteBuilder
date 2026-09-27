// Emula un móvil Android y comprueba que un toque (touchstart+touchend) arranca el audio de la intro
import { chromium, devices } from 'playwright';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=user-gesture-required'] });
const ctx = await browser.newContext({ ...devices['Pixel 7'] });
const page = await ctx.newPage();
await page.goto('file://' + resolve('../dist/pipi-potter.html'));
await page.waitForTimeout(500);
const state = () => page.evaluate(() => (window.__pipiAudio.ctx ? window.__pipiAudio.ctx.state : 'sin contexto'));
console.log('antes del toque:', await state());
const r = await page.evaluate(() => { const b = document.getElementById('screen').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await page.touchscreen.tap(r.x, r.y);
await page.waitForTimeout(400);
console.log('tras un toque:', await state(), '· canción:', await page.evaluate(() => window.__pipiAudio.song && window.__pipiAudio.song.name));
await browser.close();
