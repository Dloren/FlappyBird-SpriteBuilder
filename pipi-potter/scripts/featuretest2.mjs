// Pruebas de la v4: pérdida de vista, cuenta atrás, staff y potas, esquinas, méritos, inventario
import { chromium } from 'playwright';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + '\n' + e.stack));
await page.goto('file://' + resolve('../dist/pipi-potter.html'));
await page.waitForTimeout(300);
const res = await page.evaluate(() => {
  localStorage.clear();
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

  // Inventario por nivel
  out.inv = [0, 4].map((lv) => { const sc = setup(lv); return { lv, inv: { ...sc.player.inventory } }; });

  // 1) Persecución perdida → busca donde le vio ("?") y mérito POTA FUGAZ
  let sc = setup(0, firstA);
  let n = sc.npcs[0];
  place(n, 8, 5, 0);
  sc.player.x = 11 * T + 8; sc.player.y = 5 * T + 10; sc.player.nausea = 0.2; sc.player.nauseaPause = 99;
  n.startChase(sc, 'puke');
  sc.player.x = 3 * T + 8; sc.player.y = 2 * T + 10; // se esconde en el baño (fuera de su vista)
  const st = [];
  run(sc, 8, () => { if (st[st.length - 1] !== n.state) st.push(n.state); return false; });
  out.lostChase = { states: st, merits: JSON.parse(localStorage.getItem('pipipotter_merits_v1') || '[]') };

  // 2) Cuenta atrás tras la 3ª pota
  sc = setup(0, () => false);
  sc.player.x = 2 * T + 8; sc.player.y = 23 * T + 10;
  sc.stats.pukes = 2; sc.player.inventory.pitillo = 3;
  sc.player.facingVec = () => ({ x: 0, y: 1 });
  sc.onPukeDone(sc.player);
  const escape0 = sc.escapeT;
  const tDone = run(sc, 12, () => sc.mode === 'cleared');
  out.countdown = { escape0, clearedAfter: tDone, pitis: sc.stats.pitis };

  // 3) El staff investiga potas
  sc = setup(0, (m) => m.name === 'CAMARERO');
  n = sc.npcs[0];
  place(n, 2, 7, Math.PI / 2);
  sc.player.x = 20 * T; sc.player.y = 20 * T;
  sc.player.facingVec = () => ({ x: 0, y: 0 });
  const px = sc.player.x, py = sc.player.y;
  sc.player.x = 2 * T + 8; sc.player.y = 9 * T + 10; sc.onPukeDone(sc.player); sc.puddles[0].age = 1;
  sc.player.x = px; sc.player.y = py; sc.escapeT = null;
  run(sc, 0.5);
  out.staffPuddle = { state: n.state };

  // 4) Velocidad con "?" permanente
  sc = setup(0);
  n = sc.npcs.find((m) => m.kind === 'A');
  const v0 = n.walkSpeed; n.marked = true;
  out.markedSpeed = { normal: v0, marked: n.walkSpeed };

  // 5) Inspección de esquinas (60 s con Pipi escondido en el callejón)
  sc = setup(1);
  sc.player.x = 34 * T + 8; sc.player.y = 22 * T + 10; sc.player.nausea = 0; sc.player.nauseaPause = 999;
  const visits = new Set();
  let inspecting = 0;
  run(sc, 60, () => { for (const m of sc.npcs) if (m.inspect) { visits.add(m.name + '@' + Math.round(m.x / T) + ',' + Math.round(m.y / T)); inspecting++; } sc.unseenT = 0; return false; });
  out.inspect = { corners: sc.corners.length, npcInspectFrames: inspecting, sampleVisits: [...visits].slice(0, 6) };

  // 6) Méritos METAL GEAR y TACTIC
  sc = setup(0, (m) => m.name === 'CAMARERO' || firstA(m));
  const f = sc.npcs.find((m) => m.kind === 'A');
  place(f, 12, 5, Math.PI); // mira hacia otro lado
  sc.player.x = 14 * T + 8; sc.player.y = 5 * T + 10;
  sc.player.facingVec = () => ({ x: 1, y: 0 });
  sc.onPukeDone(sc.player);
  const w = sc.npcs.find((m) => m.worker); w.x = 2 * T; w.y = 12 * T; w.angle = Math.PI / 2;
  sc.player.x = 3 * T + 8; sc.player.y = 6 * T + 10; sc.onPukeDone(sc.player);
  out.merits = JSON.parse(localStorage.getItem('pipipotter_merits_v1') || '[]');
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
