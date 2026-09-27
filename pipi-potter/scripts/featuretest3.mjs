// Pruebas v5: seguimiento en los 10 s finales, rastro de huellas, nombres de la cena
import { chromium } from 'playwright';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + '\n' + e.stack));
await page.goto('file://' + resolve('../dist/pipi-potter.html'));
await page.waitForTimeout(300);
const res = await page.evaluate(() => {
  const app = window.__pipi, inp = window.__pipiInput;
  const out = {};
  const T = 16;
  const setup = (lv, keep) => {
    app.newRun(lv); app.play(lv);
    const sc = app.scene; sc.message = null;
    if (keep) { sc.npcs = sc.npcs.filter(keep); sc.occluders = sc.npcs.filter((n) => n.kind === 'B'); }
    return sc;
  };
  const run = (sc, secs, fn) => { for (let i = 0; i < secs * 60; i++) { inp.poll(); sc.update(1 / 60); if (fn && fn(i)) return i / 60; if (app.scene !== sc) return i / 60; } return null; };
  const place = (n, tx, ty, ang) => { n.x = tx * T + 8; n.y = ty * T + 10; n.angle = ang; n.behavior = 'static'; n.baseDir = 'right'; n.lookT = 999; n.targetAngle = ang; n.path = null; n.route = []; };
  const firstA = (m) => m.kind === 'A' && m === app.scene.npcs.find((q) => q.kind === 'A');

  // 1) 10 s finales: le ven (náusea baja) → "?" siguiéndole, sin "!"; si le toca → GAME OVER (manchas)
  let sc = setup(0, firstA);
  let n = sc.npcs[0];
  place(n, 8, 5, 0);
  sc.player.x = 11 * T + 8; sc.player.y = 5 * T + 10; sc.player.nausea = 0.1; sc.player.nauseaPause = 99;
  sc.escapeT = 10;
  const st = [];
  const t = run(sc, 8, () => { if (st[st.length - 1] !== n.state) st.push(n.state); return sc.mode === 'caught'; });
  out.final = { states: st, caughtAfter: t, reason: sc.caughtReason, sawChase: st.includes('chase') };
  if (sc.mode === 'caught') { run(sc, 2.5); out.finalGameOver = app.scene.info && { type: app.scene.info.type, reason: app.scene.info.reason, title: app.scene.title }; }

  // 2) Rastro: Pipi pisa su pota y se aleja dejando huellas; el NPC las ve y las sigue
  sc = setup(0, firstA);
  n = sc.npcs[0];
  place(n, 6, 5, 0);
  sc.player.x = 8 * T + 8; sc.player.y = 5 * T + 10; sc.player.nausea = 0.1; sc.player.nauseaPause = 99;
  sc.player.trailT = 6;
  // simula el caminar de Pipi hacia la derecha dejando huellas
  for (let k = 0; k < 14; k++) { sc.addFootprint(sc.player.x + k * 7, sc.player.y, 'right'); }
  sc.player.x += 14 * 7 + 30;
  const st2 = [];
  run(sc, 6, () => { if (st2[st2.length - 1] !== n.state) st2.push(n.state); return false; });
  out.track = { states: st2, npcX: Math.round(n.x / T), marked: n.marked };

  // 3) Nombres de la cena de empresa
  sc = setup(3);
  out.cena = sc.npcs.filter((m) => m.kind === 'A').map((m) => `${m.name}(${m.role})`);
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
