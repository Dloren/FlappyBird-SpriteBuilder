// Pruebas dirigidas de las mecánicas de detección, persecución, perro y lanzamiento
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
    const sc = app.scene;
    sc.message = null;
    if (keep) { sc.npcs = sc.npcs.filter(keep); sc.occluders = sc.npcs.filter((n) => n.kind === 'B'); }
    return sc;
  };
  const run = (sc, secs, fn) => { for (let i = 0; i < secs * 60; i++) { inp.poll(); sc.update(1 / 60); if (fn && fn(i)) return i / 60; if (app.scene !== sc) return i / 60; } return null; };
  const place = (n, tx, ty, ang) => { n.x = tx * T + 8; n.y = ty * T + 10; n.angle = ang; n.behavior = 'static'; n.baseDir = 'right'; n.lookT = 999; n.targetAngle = ang; n.path = null; n.route = []; };

  // 1) Umbral de náusea para sospechar (disco, pasillo superior abierto)
  let sc = setup(0, (n) => n.kind === 'A' && n === app.scene.npcs.find((m) => m.kind === 'A'));
  let n = sc.npcs[0];
  place(n, 8, 5, 0);
  sc.player.x = 11 * T + 8; sc.player.y = 5 * T + 10; sc.player.nausea = 0.3; sc.player.nauseaPause = 99;
  run(sc, 2);
  out.lowNausea = { state: n.state, suspicion: +n.suspicion.toFixed(2), unseenT: +sc.unseenT.toFixed(2) };
  sc.player.nausea = 0.6;
  const states = [];
  const tCaught = run(sc, 12, () => { if (states[states.length - 1] !== n.state) states.push(n.state); if (n.state === 'chase') out.boost = Math.max(out.boost || 0, sc.player.speedMul); return sc.mode === 'caught'; });
  out.highNausea = { states, caughtAfter: tCaught, reason: sc.caughtReason };

  // 2) Batida tras 30 s sin verle
  sc = setup(0);
  sc.player.x = 2 * T + 8; sc.player.y = 23 * T + 10; sc.player.nausea = 0; sc.player.nauseaPause = 99; // callejón
  sc.unseenT = 29.9;
  run(sc, 0.2);
  out.hunt = { hunters: sc.hunters.map((h) => h.name + ':' + h.state), msg: sc.message && sc.message.text };
  const found = run(sc, 25, () => sc.hunters.length === 0);
  out.huntEnded = { after: found, unseenT: +sc.unseenT.toFixed(1) };

  // 3) Perro chivato (barbacoa)
  sc = setup(4);
  const dog = sc.npcs.find((m) => m.role === 'dog');
  place(dog, 26, 14, Math.PI / 2);
  sc.player.x = 26 * T + 8; sc.player.y = 16 * T + 10; sc.player.nausea = 0.9;
  // quita NPC-A que vean la zona, para que sólo le vea el perro
  for (const m of sc.npcs) if (m.kind === 'A') { m.x = 3 * T + 8; m.y = 2 * T + 10; m.path = null; m.route = [[3, 2, 99]].map(([tx, ty, w]) => ({ tx, ty, wait: w })); m.waitT = 999; }
  sc.player.startPuke(sc, true);
  run(sc, 0.3);
  out.dog = { fetch: !!dog.fetch, target: dog.fetch && dog.fetch.npc.name };
  const tgt = dog.fetch && dog.fetch.npc;
  sc.player.x = 20 * T + 8; sc.player.y = 24 * T + 10; // Pipi se va lejos
  run(sc, 25, () => tgt && tgt.state === 'investigate' && Math.hypot(tgt.x - dog.fetch?.x, tgt.y - dog.fetch?.y) < 20);
  out.dogResult = tgt && { npcState: tgt.state, npcPos: [Math.round(tgt.x / T), Math.round(tgt.y / T)], pukeSpot: [26, 16], suspicions: sc.stats.suspicions };

  // 4) Lanzar hacia delante ~5 tiles
  sc = setup(0, () => false);
  sc.player.x = 12 * T + 8; sc.player.y = 5 * T + 10; sc.player.dir = 'right';
  sc.player.inventory = { botella: 1 }; sc.player.equipped = 'botella';
  inp.hit.add('b');
  run(sc, 2);
  const shard = sc.decals[0];
  out.throw = shard && { dx: Math.round(shard.x - sc.player.x), dy: Math.round(shard.y - sc.player.y), left: sc.player.inventory.botella };

  // 5) Umbral del staff (75 %) en su zona (camarero, barra)
  sc = setup(0, (m) => m.role === 'waiter' && m.name === 'CAMARERO');
  n = sc.npcs[0];
  place(n, 2, 7, Math.PI / 2);
  sc.player.x = 2 * T + 8; sc.player.y = 10 * T + 10; sc.player.nausea = 0.6; sc.player.nauseaPause = 99;
  run(sc, 2);
  out.staff60 = { state: n.state, susp: +n.suspicion.toFixed(2) };
  sc.player.nausea = 0.8;
  run(sc, 1.5);
  out.staff80 = { state: n.state, susp: +n.suspicion.toFixed(2) };
  return out;
});
console.log(JSON.stringify(res, null, 1));
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
