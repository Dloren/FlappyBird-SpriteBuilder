// Uso: node scripts/shot.mjs out.png "acciones"   (acciones: k:Enter w:500 d:ArrowUp:800 e:js)
import { chromium } from 'playwright';
import { resolve } from 'node:path';
const [, , out = 'shot.png', actions = '', vp = '390x844'] = process.argv;
const [w, h] = vp.split('x').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: false });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ' ' + m.text()); });
await page.goto('file://' + resolve('../dist/pipi-potter.html'));
await page.waitForTimeout(400);
for (const a of actions.split('|').map((x) => x.trim()).filter(Boolean)) {
  const [cmd, ...rest] = a.split(':');
  const arg = rest.join(':');
  if (cmd === 'k') { await page.keyboard.press(arg); await page.waitForTimeout(120); }
  else if (cmd === 'w') await page.waitForTimeout(+arg);
  else if (cmd === 'd') { const [key, ms] = arg.split(':'); await page.keyboard.down(key); await page.waitForTimeout(+ms); await page.keyboard.up(key); }
  else if (cmd === 'e') { const r = await page.evaluate(arg); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
  else if (cmd === 's') await page.screenshot({ path: arg });
  else if (cmd === 'c') await page.locator('#screen').screenshot({ path: arg });
}
await page.screenshot({ path: out });
await page.locator('#screen').screenshot({ path: out.replace('.png', '-screen.png') });
console.log(errors.length ? errors.join('\n') : 'no errors');
await browser.close();
