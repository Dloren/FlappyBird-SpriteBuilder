// Pruebas v6: unirse a persecución, pérdida compartida, saludos, batida persistente, huellas 30 s, mancha
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
  const twoA = (m) => m.kind === 'A' && app.scene.npcs.filter((q) => q.kind === 'A').indexOf(m) < 2;

  // 1) Un segundo NPC-A ve al primero correr tras Pipi → se une; al perderle ambos, pasan a "?"
  let sc = setup(0, twoA);
  const [a, b] = sc.npcs;
  place(a, 8, 5, 0); place(b, 14, 5, Math.PI); // b mira hacia a
  sc.player.x = 11 * T + 8; sc.player.y = 5 * T + 10; sc.player.nausea = 0.2; sc.player.nauseaPause = 99;
  a.startChase(sc, 'puke');
  run(sc, 0.3);
  out.join = { a: a.state, b: b.state };
  sc.player.x = 2 * T + 8; sc.player.y = 23 * T + 10; // se esconde en el callejón
  const sa = [], sb = [];
  run(sc, 8, () => { if (sa[sa.length - 1] !== a.state) sa.push(a.state); if (sb[sb.length - 1] !== b.state) sb.push(b.state); return false; });
  out.lost = { a: sa, b: sb };

  // 2) Saludo de un amigo con náusea baja
  sc = setup(0, (m) => m.kind === 'A' && m === app.scene.npcs.find((q) => q.role === 'friend'));
  let n = sc.npcs[0];
  place(n, 8, 5, 0);
  sc.player.x = 11 * T + 8; sc.player.y = 5 * T + 10; sc.player.nausea = 0.2; sc.player.nauseaPause = 99;
  run(sc, 0.3);
  out.greet = n.speech && n.speech.text;
  // y no saluda si va dejando huellas
  sc = setup(0, (m) => m.kind === 'A' && m === app.scene.npcs.find((q) => q.role === 'friend'));
  n = sc.npcs[0]; place(n, 8, 5, 0);
  sc.player.x = 11 * T + 8; sc.player.y = 5 * T + 10; sc.player.nausea = 0.2; sc.player.nauseaPause = 99; sc.player.trailT = 5;
  run(sc, 0.3);
  out.noGreetTrail = n.speech ? n.speech.text : null;

  // 3) Batida: todos salen; sigue hasta verle o ver a uno que le ha visto
  sc = setup(0);
  sc.player.x = 2 * T + 8; sc.player.y = 23 * T + 10; sc.player.nausea = 0; sc.player.nauseaPause = 999;
  sc.unseenT = 14.95;
  run(sc, 0.2);
  out.hunt = { hunters: sc.hunters.length, totalA: sc.npcs.filter((m) => m.kind === 'A').length };
  const tEnd = run(sc, 60, () => sc.hunters.length === 0);
  out.huntEnd = { after: tEnd, remaining: sc.hunters.map((h) => h.name) };

  // 4) Huellas duran 30 s y mancha a la 2ª pota
  sc = setup(0, () => false);
  sc.addFootprint(100, 100, 'right');
  run(sc, 25);
  out.footprintAt25s = sc.footprints.length;
  run(sc, 6);
  out.footprintAt31s = sc.footprints.length;
  sc.player.facingVec = () => ({ x: 0, y: 1 });
  sc.onPukeDone(sc.player); out.stain1 = !!sc.player.stained;
  sc.onPukeDone(sc.player); out.stain2 = !!sc.player.stained;
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
