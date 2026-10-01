// Pruebas v6.2: huellas 15 s y condiciones de pillada al seguir el rastro
import { chromium } from 'playwright';
import { resolve } from 'node:path';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + '\n' + e.stack));
await page.goto('file://' + resolve('../dist/pipi-potter.html'));
await page.waitForTimeout(300);
const res = await page.evaluate(() => {
  const app = window.__pipi, inp = window.__pipiInput, T = 16;
  const out = {};
  const run = (sc, secs, fn) => { for (let i = 0; i < secs * 60; i++) { inp.poll(); sc.update(1 / 60); if (fn && fn(i)) return i / 60; if (app.scene !== sc) return i / 60; } return null; };
  // Pipi deja huellas 15 s tras pisar un charco
  app.newRun(0); app.play(0);
  let sc = app.scene; sc.message = null; sc.npcs = []; sc.occluders = [];
  sc.player.trailT = 15;
  // va y vuelve por el pasillo para no chocar con las paredes
  run(sc, 14, (i) => { const r = Math.floor(i / 60) % 2 === 0; inp.key.right = r; inp.key.left = !r; return false; });
  const leaving14 = sc.player.trailT > 0, fp14 = sc.footprints.length;
  run(sc, 2, (i) => { const r = Math.floor(i / 60) % 2 === 0; inp.key.right = r; inp.key.left = !r; return false; });
  inp.key.right = false; inp.key.left = false;
  out.trail = { leavingAt14s: leaving14, footprintsAt14s: fp14, leavingAt16s: sc.player.trailT > 0 };
  // Un NPC rastreando alcanza a Pipi en distintas condiciones
  const caseRun = (cond) => {
    app.newRun(0); app.play(0);
    const s = app.scene; s.message = null;
    const n = s.npcs.find((m) => m.kind === 'A');
    s.npcs = [n]; s.occluders = [];
    n.x = 10 * T + 8; n.y = 5 * T + 10; n.route = []; n.behavior = 'static';
    s.player.x = n.x + 6; s.player.y = n.y; s.player.nausea = 0.1; s.player.nauseaPause = 99;
    Object.assign(s.player, cond.player || {});
    if (cond.marked) n.marked = true;
    s.addFootprint(n.x + 3, n.y, 'right');
    n.startTrack(s, s.footprints[0]);
    run(s, 0.5);
    return s.mode === 'caught' ? `GAME OVER (${s.caughtReason})` : `libre (${n.state})`;
  };
  out.clean = caseRun({});
  out.leaving = caseRun({ player: { trailT: 5 } });
  out.stained = caseRun({ player: { stained: true } });
  out.markedNoGum = caseRun({ marked: true });
  out.markedGum = caseRun({ marked: true, player: { chicleT: 20 } });
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
