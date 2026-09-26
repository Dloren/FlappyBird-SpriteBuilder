// Prueba de estrés: simula cada nivel con entradas aleatorias y mide tiempos
import { chromium } from 'playwright';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + '\n' + e.stack));
await page.goto('file://' + resolve('../dist/pipi-potter.html'));
await page.waitForTimeout(300);
const res = await page.evaluate(async () => {
  const app = window.__pipi;
  const out = [];
  for (let lv = 0; lv < 5; lv++) {
    app.newRun(lv); app.play(lv);
    const sc = app.scene;
    const ctx = document.getElementById('screen').getContext('2d');
    const keys = ['up', 'down', 'left', 'right'];
    let upd = 0, ren = 0, frames = 0, maxU = 0;
    const endings = {};
    for (let f = 0; f < 60 * 90; f++) {
      const s = app.scene;
      if (s !== sc) { endings[s.constructor.name] = 1; break; }
      if (f % 40 === 0) { for (const k of keys) window.__pipiInput.key[k] = false; window.__pipiInput.key[keys[(Math.random() * 4) | 0]] = true; }
      window.__pipiInput.key.a = sc.player.nausea > 0.6 && Math.random() < 0.5 ? true : (f % 200 < 150 ? window.__pipiInput.key.a : false);
      if (f % 300 === 0) window.__pipiInput.hit.add('b');
      const t0 = performance.now();
      window.__pipiInput.poll();
      sc.update(1 / 60);
      const t1 = performance.now();
      sc.render(ctx);
      const t2 = performance.now();
      upd += t1 - t0; ren += t2 - t1; frames++; maxU = Math.max(maxU, t1 - t0);
      if (sc.mode === 'caught' || sc.mode === 'cleared') { endings[sc.mode] = (sc.catcher && sc.catcher.name) || sc.stats.pukes; }
    }
    out.push({ lv, frames, upd: (upd / frames).toFixed(3), ren: (ren / frames).toFixed(3), maxU: maxU.toFixed(2), stats: sc.stats, endings, mode: sc.mode });
  }
  return out;
});
for (const r of res) console.log(JSON.stringify(r));
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
