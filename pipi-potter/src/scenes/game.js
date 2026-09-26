// ============================================================
//  Escena de juego: un nivel completo
// ============================================================
import { SCREEN_W, SCREEN_H, HUD_H, VIEW_H, TILE, CONFIG, DIFFICULTY } from '../config.js';
import { input, vibrate } from '../engine/input.js';
import { audio } from '../audio/audio.js';
import { UI, panel, ditherPattern, cursor } from '../engine/gfx.js';
import { drawText, drawTextCentered, textWidth, wrapText } from '../engine/font.js';
import { clamp, lerp, pick, rand, dist } from '../engine/util.js';
import { Level } from '../levels/level.js';
import { LEVELS } from '../levels/index.js';
import { resolveLevel } from '../levels/names.js';
import { renderMap, drawAnimatedTile, isAnimated } from '../assets/tiles.js';
import { drawIcon } from '../assets/sprites.js';
import { Player } from '../entities/player.js';
import { NPC, S } from '../entities/npc.js';
import { Puddle, Footprint, SmokeCloud, Pickup, Projectile, Particle, NoiseRing } from '../entities/effects.js';
import { drawHUD } from '../ui/hud.js';
import { ROLE_TYPE } from '../ui/phrases.js';

const ITEM_NAMES = { chicle: 'CHICLE', pitillo: 'PITILLO', sobras: 'SOBRAS', mechero: 'MECHERO', botella: 'BOTELLA' };
const ITEM_DESC = {
  chicle: '30 S SIN SOSPECHAS Y QUITA LOS "?"',
  pitillo: 'PAUSA LA NÁUSEA Y CREA HUMO',
  sobras: '+PUNTOS, PERO +20% NÁUSEA',
  mechero: 'SE LANZA HACIA DELANTE: RUIDO',
  botella: 'SE LANZA HACIA DELANTE: MUCHO RUIDO',
};
export { ITEM_NAMES, ITEM_DESC };

export class PlayScene {
  constructor(app, levelIndex) {
    this.app = app;
    this.levelIndex = levelIndex;
    this.data = resolveLevel(LEVELS[levelIndex], app.run, levelIndex);
    this.diff = DIFFICULTY[levelIndex] || DIFFICULTY[DIFFICULTY.length - 1];
  }

  enter() {
    const d = this.data;
    this.level = new Level(d);
    this.mapCanvas = renderMap(this.level);
    this.animTiles = [];
    for (let y = 0; y < this.level.h; y++)
      for (let x = 0; x < this.level.w; x++) {
        const ch = this.level.charAt(x, y);
        if (isAnimated(this.level, ch)) this.animTiles.push([x, y, ch]);
      }
    this.player = new Player(d.player[0], d.player[1], { ...(this.app.run.levelItems || CONFIG.player.startItems) });
    this.npcs = d.npcs.map((n) => new NPC(n, this.level, this.diff));
    this.occluders = this.npcs.filter((n) => n.kind === 'B');
    this.pickups = d.items.map(([t, x, y]) => new Pickup(t, x * TILE + 8, y * TILE + 10));
    this.puddles = [];
    this.footprints = [];
    this.clouds = [];
    this.projectiles = [];
    this.particles = [];
    this.rings = [];
    this.decals = [];
    this.floaters = [];
    this.reactedThisPuke = new Set();
    this.unseenT = 0;
    this.hunters = [];
    this.time = 0;
    this.stats = { time: 0, pukes: 0, suspicions: 0, escapes: 0, sobras: 0, items: 0 };
    this.mode = 'play'; // play | paused | rules | caught | cleared
    this.modeT = 0;
    this.cam = { x: 0, y: 0 };
    this.snapCamera();
    this.retchT = 0;
    this.pauseSel = 0;
    this.message = { text: this.data.name, t: 2 };
    audio.playMusic(this.data.music);
  }

  // ----------------- API usada por las entidades -----------------
  sfx(n) { audio.sfx(n); }

  // ¿Ve este NPC alguna pota a la vez que a Pipi? (charco ya formado y cerca de Pipi)
  puddleSeenBy(npc) {
    const p = this.player;
    for (const pd of this.puddles) {
      if (pd.age < 0.4 || dist(pd.x, pd.y, p.x, p.y) > 40) continue;
      if (npc.sees(this, pd.x, pd.y)) return true;
    }
    return false;
  }

  // Algún amigo ha visto a Pipi: se reinicia el contador de "¿dónde está Pipi?"
  friendSawPlayer() { this.unseenT = 0; }

  endHunt(npc) {
    this.hunters = this.hunters.filter((h) => h !== npc);
    if (!this.hunters.length) this.unseenT = 0;
  }

  nearestFriend(x, y) {
    let best = null, bd = Infinity;
    for (const n of this.npcs) {
      if (n.kind !== 'A' || n.state === S.CHASE) continue;
      const d = dist(n.x, n.y, x, y);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  updateHunt(dt) {
    const D = CONFIG.detection;
    this.unseenT += dt;
    if (this.unseenT < D.huntAfter || this.hunters.length) return;
    const p = this.player;
    const free = this.npcs.filter((n) => n.kind === 'A' && (n.state === S.ROUTINE || n.state === S.RETURN))
      .sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y)).slice(0, D.hunters);
    if (!free.length) return;
    free.forEach((n) => n.startHunt());
    this.hunters = free;
    this.message = { text: 'TUS AMIGOS TE BUSCAN', t: 2 };
    audio.sfx('suspect');
  }
  nearView(x, y, m) {
    return x > this.cam.x - m && x < this.cam.x + SCREEN_W + m && y > this.cam.y - m && y < this.cam.y + VIEW_H + m + 16;
  }
  playerHidden() { return this.clouds.some((c) => c.contains(this.player.x, this.player.y - 4)); }
  displayScore() { return this.app.run.score + this.stats.sobras; }

  float(text, x, y, color = UI.light) { this.floaters.push({ text, x, y, color, t: 1.4 }); }

  findClue(npc) {
    const check = (c) => {
      if (npc.seen.has(c)) return false;
      if (c.kind === 'trail' && c.alpha < 0.3) return false;
      return npc.sees(this, c.x, c.y);
    };
    let found = null;
    for (const p of this.puddles) if (check(p)) { found = p; break; }
    if (!found) for (const f of this.footprints) if (check(f)) { found = f; break; }
    if (found) {
      // marca como vistas las pistas cercanas para no encadenar
      for (const p of this.puddles) if (dist(p.x, p.y, found.x, found.y) < 40) npc.seen.add(p);
      for (const f of this.footprints) if (dist(f.x, f.y, found.x, found.y) < 60) npc.seen.add(f);
      npc.seen.add(found);
    }
    return found;
  }

  onSuspicion(npc) {
    this.stats.suspicions++;
    this.float(`-${Math.round(CONFIG.score.suspicionPenalty * 100)}%`, npc.x, npc.y - 22, UI.yellow);
  }

  onEscape(npc, isB) {
    this.stats.escapes++;
    this.float(`-${Math.round(CONFIG.score.escapePenalty * 100)}%`, npc.x, npc.y - 22, UI.orange);
    if (!isB) { audio.sfx('alert'); vibrate(80); }
  }

  caught(npc, reason) {
    if (this.mode !== 'play') return;
    this.mode = 'caught';
    this.modeT = 0;
    this.catcher = npc;
    this.caughtReason = reason;
    npc.speech = null;
    // encuadra al pillador y a Pipi
    const mx = (npc.x + this.player.x) / 2, my = (npc.y + this.player.y) / 2;
    this.cam.x = clamp(mx - SCREEN_W / 2, 0, Math.max(0, this.level.pw - SCREEN_W));
    this.cam.y = clamp(my - 8 - VIEW_H / 2, 0, Math.max(0, this.level.ph - VIEW_H));
    audio.stopMusic();
    audio.sfx('caught');
    vibrate([120, 60, 320]);
  }

  onPukeTooEarly() {
    audio.sfx('nope');
    this.float('¡AÚN NO!', this.player.x, this.player.y - 20, UI.grey);
  }

  onPukeStart(auto) {
    this.reactedThisPuke = new Set();
    this.retchT = 0;
    audio.sfx('retch');
    vibrate(auto ? [60, 40, 60] : 40);
    if (auto) this.float('¡NO PUEDE MÁS!', this.player.x, this.player.y - 22, UI.red);
  }

  onPuking(dt, p) {
    this.retchT += dt;
    if (this.retchT > 0.55) { this.retchT = 0; audio.sfx('retch'); vibrate(30); }
    // chorro al final
    if (p.actionT > p.actionDur * 0.65) {
      const f = p.facingVec();
      for (let i = 0; i < 3; i++) {
        this.particles.push(new Particle(p.x + f.x * 4, p.y + f.y * 3 - 1, f.x * rand(20, 45) + rand(-8, 8), f.y * rand(20, 45) + rand(-6, 6),
          pick(['#5c8c20', '#8cb030', '#c8d840']), rand(0.4, 0.8), 60, 7, rand(-5, 10)));
      }
    }
  }

  onPukeCancel() { this.float('...', this.player.x, this.player.y - 20, UI.grey); }

  onPukeDone(p) {
    const f = p.facingVec();
    const pd = new Puddle(p.x + f.x * 9, p.y + f.y * 7 + 2);
    p.stained = true;
    this.puddles.push(pd);
    this.stats.pukes++;
    audio.sfx('puke');
    vibrate([200]);
    this.float(`POTA ${this.stats.pukes}/${CONFIG.puke.pukesToWin}`, p.x, p.y - 22, UI.green);
    if (this.stats.pukes >= CONFIG.puke.pukesToWin && this.mode === 'play') {
      this.mode = 'cleared';
      this.modeT = 0;
      audio.stopMusic();
      setTimeout(() => audio.sfx('win'), 400);
    }
  }

  addFootprint(x, y, dir) {
    this.fpSide = -(this.fpSide || 1);
    this.footprints.push(new Footprint(x, y + 1, dir, this.fpSide));
  }

  useItem() {
    const p = this.player;
    const it = p.equipped;
    if (!it || !(p.inventory[it] > 0)) {
      // equipa automáticamente el primero disponible
      const next = Object.keys(p.inventory).find((k) => p.inventory[k] > 0);
      if (next) { p.equipped = next; audio.sfx('move'); this.float(ITEM_NAMES[next], p.x, p.y - 20); }
      else { audio.sfx('nope'); this.float('SIN OBJETOS', p.x, p.y - 20, UI.grey); }
      return;
    }
    switch (it) {
      case 'chicle':
        p.inventory.chicle--;
        p.chicleT = CONFIG.items.chicle.duration;
        audio.sfx('gum');
        this.float('¡ALIENTO FRESCO!', p.x, p.y - 20, UI.pink);
        break;
      case 'pitillo':
        p.inventory.pitillo--;
        p.startAction('smoking', CONFIG.items.pitillo.smokeTime);
        p.nauseaPause = CONFIG.items.pitillo.pauseNausea;
        this.clouds.push(new SmokeCloud(p.x, p.y));
        audio.sfx('smoke');
        break;
      case 'sobras':
        p.inventory.sobras--;
        p.startAction('eating', CONFIG.items.sobras.eatTime);
        audio.sfx('eat');
        break;
      case 'mechero':
      case 'botella':
        this.throwItem(it);
        break;
      default: break;
    }
    this.autoEquip();
  }

  autoEquip() {
    const p = this.player;
    if (p.equipped && p.inventory[p.equipped] > 0) return;
    const next = Object.keys(p.inventory).find((k) => p.inventory[k] > 0);
    p.equipped = next || p.equipped;
  }

  onActionDone(kind, p) {
    if (kind === 'eating') {
      p.nausea = clamp(p.nausea + CONFIG.items.sobras.nausea, 0, 1);
      this.stats.sobras += CONFIG.items.sobras.points;
      this.float(`+${CONFIG.items.sobras.points}`, p.x, p.y - 20, UI.yellow);
      this.float('+20% NÁUSEA', p.x, p.y - 12, UI.red);
    }
  }

  // Lanza el objeto hacia donde mira Pipi; cae a unos 5 tiles o al chocar
  throwItem(type) {
    const p = this.player;
    const cfg = CONFIG.items[type];
    p.inventory[type]--;
    const f = p.facingVec();
    const target = { x: p.x + f.x * cfg.range, y: p.y - 4 + f.y * cfg.range };
    this.projectiles.push(new Projectile(type, p.x, p.y - 4, target.x, target.y, cfg.range, cfg.speed));
    audio.sfx('throw');
  }

  onProjectileLand(pr) {
    const cfg = CONFIG.items[pr.type];
    this.rings.push(new NoiseRing(pr.x, pr.y, cfg.noiseRadius));
    audio.sfx(pr.type === 'botella' ? 'glass' : 'clack');
    if (pr.type === 'botella') {
      for (let i = 0; i < 10; i++) this.particles.push(new Particle(pr.x, pr.y, rand(-40, 40), rand(-30, 30), pick(['#38a048', '#c8f8c8', '#f4f4f4']), rand(0.3, 0.7), 80, 2, rand(10, 30)));
      this.decals.push({ type: 'shards', x: pr.x, y: pr.y });
    } else this.decals.push({ type: 'mechero', x: pr.x, y: pr.y });
    for (const n of this.npcs) if (n.kind === 'A' && dist(n.x, n.y, pr.x, pr.y) < cfg.noiseRadius) n.hearNoise(pr.x, pr.y);
  }

  // ----------------- Bucle -----------------
  snapCamera() {
    const p = this.player;
    this.cam.x = clamp(p.x - SCREEN_W / 2, 0, Math.max(0, this.level.pw - SCREEN_W));
    this.cam.y = clamp(p.y - 8 - VIEW_H / 2, 0, Math.max(0, this.level.ph - VIEW_H));
  }

  update(dt) {
    this.modeT += dt;
    if (this.message) { this.message.t -= dt; if (this.message.t <= 0) this.message = null; }
    if (this.mode === 'paused') return this.updatePause();
    if (this.mode === 'rules') { if (input.pressed.a || input.pressed.b || input.pressed.select || input.pressed.start || input.consumeTap()) { this.mode = 'play'; audio.sfx('back'); } return; }
    if (this.mode === 'caught') {
      this.time += dt * 0.2;
      if (this.modeT > 1.8) this.app.gameOver(this.buildGameOverInfo());
      return;
    }
    if (this.mode === 'cleared') {
      this.time += dt;
      this.updateWorld(dt * 0.3, false);
      if (this.modeT > 2.4) this.app.levelCleared(this.stats, this.player.inventory);
      return;
    }
    if (input.pressed.start) { this.mode = 'paused'; this.pauseSel = 0; audio.sfx('select'); return; }
    if (input.pressed.select) { this.mode = 'rules'; audio.sfx('select'); return; }

    this.updateWorld(dt, true);
  }

  updateWorld(dt, controls) {
    this.time += dt;
    this.frame = (this.frame || 0) + 1;
    const p = this.player;
    if (controls) this.stats.time += dt;
    this.chased = this.npcs.some((n) => n.state === S.CHASE);
    p.speedMul = this.chased ? CONFIG.player.chaseBoost : 1;
    if (controls) p.update(dt, this);
    if (controls) this.updateHunt(dt);
    if (this.mode === 'caught') return;

    // pisar charco → rastro
    for (const pd of this.puddles) {
      pd.age += dt;
      if (pd.age > 1 && dist(pd.x, pd.y, p.x, p.y) < 8) p.trailT = CONFIG.trail.duration;
    }
    // recoger objetos
    for (const it of this.pickups) {
      if (!it.taken && dist(it.x, it.y, p.x, p.y) < 9) {
        it.taken = true;
        p.inventory[it.type] = (p.inventory[it.type] || 0) + 1;
        if (!p.equipped || !(p.inventory[p.equipped] > 0)) p.equipped = it.type;
        audio.sfx('pickup');
        vibrate(20);
        this.float(ITEM_NAMES[it.type], it.x, it.y - 12, UI.cyan);
        this.stats.items++;
      }
    }
    for (const n of this.npcs) { n.update(dt, this); if (this.mode === 'caught') return; }
    for (const pr of this.projectiles) pr.update(dt, this);
    this.projectiles = this.projectiles.filter((x) => !x.done);
    for (const c of this.clouds) { c.age += dt; c.life -= dt; }
    this.clouds = this.clouds.filter((c) => c.life > 0);
    for (const f of this.footprints) f.life -= dt;
    this.footprints = this.footprints.filter((f) => f.life > 0);
    for (const pa of this.particles) pa.update(dt);
    this.particles = this.particles.filter((x) => x.life > 0);
    for (const r of this.rings) r.update(dt);
    this.rings = this.rings.filter((r) => !r.done);
    for (const f of this.floaters) { f.t -= dt; f.y -= dt * 10; }
    this.floaters = this.floaters.filter((f) => f.t > 0);

    // cámara
    const tx = clamp(p.x - SCREEN_W / 2, 0, Math.max(0, this.level.pw - SCREEN_W));
    const ty = clamp(p.y - 8 - VIEW_H / 2, 0, Math.max(0, this.level.ph - VIEW_H));
    const k = 1 - Math.pow(0.0005, dt);
    this.cam.x = lerp(this.cam.x, tx, k);
    this.cam.y = lerp(this.cam.y, ty, k);
  }

  // ----------------- Pausa / inventario -----------------
  pauseEntries() {
    const p = this.player;
    const items = Object.keys(ITEM_NAMES).filter((k) => p.inventory[k] > 0).map((k) => ({ kind: 'item', id: k }));
    return [...items, { kind: 'opt', id: 'resume', label: 'CONTINUAR' }, { kind: 'opt', id: 'rules', label: 'REGLAS' },
      { kind: 'opt', id: 'sound', label: audio.muted ? 'SONIDO: NO' : 'SONIDO: SÍ' }, { kind: 'opt', id: 'quit', label: 'SALIR AL MENÚ' }];
  }

  updatePause() {
    const entries = this.pauseEntries();
    const tap = input.consumeTap();
    if (tap && this.pauseRects) {
      const i = this.pauseRects.findIndex((r) => tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h);
      if (i >= 0) { this.pauseSel = i; this.activatePause(entries[i]); return; }
    }
    if (input.pressed.up) { this.pauseSel = (this.pauseSel + entries.length - 1) % entries.length; audio.sfx('move'); }
    if (input.pressed.down) { this.pauseSel = (this.pauseSel + 1) % entries.length; audio.sfx('move'); }
    if (input.pressed.start || input.pressed.b) { this.mode = 'play'; audio.sfx('back'); return; }
    if (input.pressed.a) this.activatePause(entries[this.pauseSel]);
  }

  activatePause(e) {
    if (!e) return;
    audio.sfx('select');
    if (e.kind === 'item') { this.player.equipped = e.id; this.mode = 'play'; this.player.needRelease = true; return; }
    if (e.id === 'resume') { this.mode = 'play'; this.player.needRelease = true; }
    if (e.id === 'rules') this.mode = 'rules';
    if (e.id === 'sound') audio.setMuted(!audio.muted);
    if (e.id === 'quit') { audio.stopMusic(); this.app.toMenu(); }
  }

  // ----------------- Game over -----------------
  buildGameOverInfo() {
    const n = this.catcher;
    let type = ROLE_TYPE[n.role] || 'friends';
    const sameKind = this.npcs.filter((o) => o !== n && o.kind === n.kind && ROLE_TYPE[o.role] === type);
    return {
      type, reason: this.caughtReason, catcherSpec: n.spec, catcherName: n.name, role: n.role,
      extraSpecs: sameKind.slice(0, 1).map((o) => o.spec),
      onScreen: this.npcs.filter((o) => o !== n && o.role !== 'dog' && this.nearView(o.x, o.y, 0))
        .map((o) => ({ spec: o.spec, friend: o.kind === 'A' })),
      levelIndex: this.levelIndex, levelName: this.data.name,
      stats: this.stats,
    };
  }

  // ----------------- Render -----------------
  render(ctx) {
    ctx.fillStyle = this.level.pal.void || '#000';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const cam = { x: Math.round(this.cam.x), y: Math.round(this.cam.y) };
    ctx.save();
    ctx.beginPath(); ctx.rect(0, HUD_H, SCREEN_W, VIEW_H); ctx.clip();
    ctx.translate(0, HUD_H);
    // mapa
    const vw = Math.min(SCREEN_W, this.level.pw), vh = Math.min(VIEW_H, this.level.ph);
    ctx.drawImage(this.mapCanvas, cam.x, cam.y, vw, vh, 0, 0, vw, vh);
    for (const [tx, ty, ch] of this.animTiles) {
      const sx = tx * TILE - cam.x, sy = ty * TILE - cam.y;
      if (sx < -16 || sy < -16 || sx > SCREEN_W || sy > VIEW_H) continue;
      drawAnimatedTile(ctx, this.level, ch, tx, ty, sx, sy, this.time);
    }
    // zonas de trabajo
    this.drawZones(ctx, cam);
    for (const d of this.decals) this.drawDecal(ctx, d, cam);
    for (const pd of this.puddles) pd.draw(ctx, cam);
    for (const f of this.footprints) f.draw(ctx, cam);
    // conos
    for (const n of this.npcs) if (n.cone) this.drawCone(ctx, n, cam);
    for (const it of this.pickups) if (!it.taken) it.draw(ctx, cam, this.time);
    // entidades ordenadas por Y
    const ents = [...this.npcs, this.player].sort((a, b) => a.y - b.y);
    for (const e of ents) e.draw(ctx, cam, this.time);
    for (const c of this.clouds) c.draw(ctx, cam, this.time);
    for (const pr of this.projectiles) pr.draw(ctx, cam);
    for (const pa of this.particles) pa.draw(ctx, cam);
    for (const r of this.rings) r.draw(ctx, cam);
    // indicadores sobre cabezas
    for (const n of this.npcs) this.drawNpcOverlay(ctx, n, cam);
    this.drawPlayerOverlay(ctx, cam);
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.t * 2);
      drawTextCentered(ctx, f.text, Math.round(f.x - cam.x), Math.round(f.y - cam.y), f.color, 1, UI.ink);
      ctx.globalAlpha = 1;
    }
    for (const n of this.npcs) if (n.speech) this.drawSpeech(ctx, n, cam);
    ctx.restore();

    drawHUD(ctx, this);

    if (this.message) {
      ctx.globalAlpha = Math.min(1, this.message.t * 2);
      panel(ctx, 30, 60, 100, 17);
      drawTextCentered(ctx, this.message.text, 80, 66, UI.yellow);
      ctx.globalAlpha = 1;
    }
    if (this.mode === 'caught') this.drawCaught(ctx, cam);
    if (this.mode === 'cleared') {
      const k = Math.min(1, this.modeT * 2);
      panel(ctx, 20, 56, 120, 26);
      drawTextCentered(ctx, '¡NIVEL SUPERADO!', 80, 62, UI.yellow);
      drawTextCentered(ctx, 'NADIE SE HA ENTERADO...', 80, 71, UI.light);
      ctx.globalAlpha = 1 - k; ctx.globalAlpha = 1;
    }
    if (this.mode === 'paused') this.drawPause(ctx);
    if (this.mode === 'rules') this.drawQuickRules(ctx);
  }

  drawZones(ctx, cam) {
    ctx.strokeStyle = 'rgba(240,136,48,0.55)';
    ctx.setLineDash([2, 2]);
    ctx.lineDashOffset = -Math.floor(this.time * 6);
    for (const n of this.npcs) {
      if (!n.worker) continue;
      for (const [x, y, w, h] of n.zones) {
        ctx.strokeRect(x * TILE - cam.x + 0.5, y * TILE - cam.y + 0.5, w * TILE - 1, h * TILE - 1);
      }
    }
    ctx.setLineDash([]);
    for (const n of this.npcs) {
      if (!n.worker) continue;
      const [x, y] = n.zones[0];
      ctx.fillStyle = 'rgba(240,136,48,0.8)';
      ctx.fillRect(x * TILE - cam.x + 1, y * TILE - cam.y + 1, 21, 7);
      drawText(ctx, 'STAFF', x * TILE - cam.x + 2, y * TILE - cam.y + 2, UI.ink);
    }
  }

  drawDecal(ctx, d, cam) {
    const x = Math.round(d.x - cam.x), y = Math.round(d.y - cam.y);
    if (d.type === 'shards') {
      ctx.fillStyle = '#38a048'; ctx.fillRect(x - 3, y, 2, 1); ctx.fillRect(x + 2, y - 1, 1, 2); ctx.fillRect(x, y + 2, 2, 1);
      ctx.fillStyle = '#c8f8c8'; ctx.fillRect(x - 1, y - 2, 1, 1); ctx.fillRect(x + 3, y + 2, 1, 1);
    } else drawIcon(ctx, 'mechero', x - 4, y - 5);
  }

  drawCone(ctx, n, cam) {
    const pts = n.cone;
    ctx.beginPath();
    ctx.moveTo(pts[0] - cam.x, pts[1] - cam.y);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] - cam.x, pts[i + 1] - cam.y);
    ctx.closePath();
    const col = n.coneColor();
    ctx.globalAlpha = n.kind === 'A' ? 0.22 : 0.16;
    ctx.fillStyle = col;
    ctx.fill();
    ctx.globalAlpha = n.kind === 'A' ? 0.45 : 0.3;
    ctx.fillStyle = ditherPattern(ctx, col);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawNpcOverlay(ctx, n, cam) {
    const x = Math.round(n.x - cam.x), y = Math.round(n.y - cam.y) - 24;
    if (n.worker) {
      // distintivo de trabajador (pillarte en su zona = expulsión)
      ctx.fillStyle = UI.orange;
      ctx.fillRect(x - 1, y + 6, 3, 1); ctx.fillRect(x, y + 5, 1, 3);
    }
    if (n.kind !== 'A' && !n.worker) return;
    const bubble = (fill, glyph, glyphCol, meter, meterCol) => {
      ctx.fillStyle = UI.ink; ctx.fillRect(x - 4, y - 2, 9, 10);
      ctx.fillStyle = fill; ctx.fillRect(x - 3, y - 1, 7, 8);
      if (meter !== undefined) {
        ctx.fillStyle = meterCol;
        const h = Math.round(8 * clamp(meter, 0, 1));
        ctx.fillRect(x - 3, y - 1 + 8 - h, 7, h);
      }
      drawText(ctx, glyph, x - 1, y + 1, glyphCol);
      ctx.fillStyle = UI.ink; ctx.fillRect(x, y + 8, 1, 2);
    };
    switch (n.state) {
      case S.SUSPICIOUS: bubble(UI.light, '?', UI.ink, n.suspicion, UI.yellow); break;
      case S.SEARCH: case S.INVESTIGATE:
        if (n.alert > 0) bubble(UI.yellow, '!', UI.ink, n.alert, UI.red);
        else if (Math.floor(this.time * 4) % 2 || n.state === S.SEARCH) bubble(UI.yellow, '?', UI.ink);
        break;
      case S.CHASE: bubble(UI.red, '!', UI.light); break;
      case S.ALERT: bubble(UI.yellow, '!', UI.ink); break;
      case S.HUNT: if (Math.floor(this.time * 2) % 2) bubble(UI.pink, '?', UI.ink); break;
      case S.DISTRACTED: bubble(UI.light, '?', UI.grey); break;
      default:
        if (n.marked) bubble(UI.yellow, '?', UI.red);
    }
  }

  drawPlayerOverlay(ctx, cam) {
    const p = this.player;
    const x = Math.round(p.x - cam.x), y = Math.round(p.y - cam.y);
    if (p.isPuking || p.state === 'smoking' || p.state === 'eating') {
      const k = clamp(p.actionT / p.actionDur, 0, 1);
      ctx.fillStyle = UI.ink; ctx.fillRect(x - 9, y - 21, 18, 4);
      ctx.fillStyle = p.isPuking ? UI.green : p.state === 'smoking' ? UI.grey : UI.yellow;
      ctx.fillRect(x - 8, y - 20, Math.round(16 * k), 2);
    }
    if (this.chased && Math.floor(this.time * 4) % 2) drawText(ctx, '¡CORRE!', x - 13, y - 30, UI.red, 1, UI.ink);
    if (this.playerHidden()) {
      ctx.fillStyle = UI.cyan;
      if (Math.floor(this.time * 3) % 2) drawText(ctx, 'OCULTO', x - 11, y - 28, UI.cyan);
    }
    // aviso "puedes potar" al pasar del mínimo
    if (!p.busy && p.nausea >= CONFIG.puke.minNausea && Math.floor(this.time * 2) % 2 && this.mode === 'play') {
      ctx.fillStyle = UI.green;
      ctx.fillRect(x + 7, y - 17, 3, 3);
      drawText(ctx, 'A', x + 7, y - 17, UI.ink);
    }
  }

  drawSpeech(ctx, n, cam) {
    const lines = wrapText(n.speech.text, 70);
    const w = Math.max(...lines.map((l) => textWidth(l))) + 6;
    const h = lines.length * 7 + 4;
    let x = Math.round(n.x - cam.x - w / 2), y = Math.round(n.y - cam.y) - 28 - h;
    x = clamp(x, 1, SCREEN_W - w - 1);
    y = Math.max(1, y);
    ctx.fillStyle = UI.ink; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = UI.light; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    lines.forEach((l, i) => drawText(ctx, l, x + 3, y + 3 + i * 7, UI.ink));
  }

  drawCaught(ctx, cam) {
    const n = this.catcher;
    const flash = this.modeT < 0.3 && Math.floor(this.modeT * 20) % 2;
    if (flash) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H); }
    ctx.fillStyle = `rgba(200,20,40,${Math.min(0.35, this.modeT * 0.3)})`;
    ctx.fillRect(0, HUD_H, SCREEN_W, VIEW_H);
    const x = Math.round(n.x - cam.x), y = Math.round(n.y - cam.y) + HUD_H - 34;
    const s = 2;
    ctx.fillStyle = UI.ink; ctx.fillRect(x - 7, y - 4, 14, 18);
    ctx.fillStyle = UI.red; ctx.fillRect(x - 6, y - 3, 12, 16);
    drawText(ctx, '!', x - 2, y, UI.light, s);
    panel(ctx, 24, 116, 112, 15);
    const txt = this.caughtReason === 'breath' ? '¡TE HA OLIDO EL ALIENTO!' : this.caughtReason === 'chase' || this.caughtReason === 'staff' ? '¡TE HAN ALCANZADO!' : this.caughtReason === 'staff' ? '¡TE HAN PILLADO!' : '¡TE HAN VISTO POTAR!';
    drawTextCentered(ctx, txt, 80, 121, UI.yellow);
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(20,12,28,0.7)';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    panel(ctx, 12, 14, 136, 118);
    drawTextCentered(ctx, 'PAUSA · INVENTARIO', 80, 20, UI.yellow);
    const entries = this.pauseEntries();
    this.pauseSel = Math.min(this.pauseSel, entries.length - 1);
    this.pauseRects = [];
    let y = 31;
    const items = entries.filter((e) => e.kind === 'item');
    if (!items.length) { drawText(ctx, 'NO LLEVAS OBJETOS', 22, y, UI.grey); y += 9; }
    entries.forEach((e, i) => {
      if (e.kind === 'opt' && entries[i - 1] && entries[i - 1].kind === 'item') y += 4;
      const sel = i === this.pauseSel;
      if (sel) cursor(ctx, 17, y, UI.yellow);
      if (e.kind === 'item') {
        drawIcon(ctx, e.id, 23, y - 2);
        const eq = this.player.equipped === e.id;
        drawText(ctx, `${ITEM_NAMES[e.id]} X${this.player.inventory[e.id]}`, 33, y, sel ? UI.yellow : UI.light);
        if (eq) drawText(ctx, '(B)', 118, y, UI.cyan);
        this.pauseRects.push({ x: 14, y: y - 3, w: 132, h: 10 });
        y += 10;
      } else {
        drawText(ctx, e.label, 23, y, sel ? UI.yellow : UI.light);
        this.pauseRects.push({ x: 14, y: y - 2, w: 132, h: 9 });
        y += 9;
      }
    });
    const cur = entries[this.pauseSel];
    if (cur && cur.kind === 'item') {
      panel(ctx, 12, 133 - 16, 136, 14, UI.dark);
      drawTextCentered(ctx, ITEM_DESC[cur.id], 80, 121, UI.light);
    }
  }

  drawQuickRules(ctx) {
    ctx.fillStyle = 'rgba(20,12,28,0.8)';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    panel(ctx, 6, 8, 148, 128);
    drawTextCentered(ctx, 'REGLAS RÁPIDAS', 80, 14, UI.yellow);
    const lines = [
      ['·', 'POTA 3 VECES SIN QUE TE VEAN.'],
      ['·', 'MANTÉN A PARA POTAR (NÁUSEA +50%).'],
      ['·', 'SOSPECHAN SI TU NÁUSEA PASA DEL 50% (STAFF: 75%).'],
      ['·', 'CON "!" CORREN A POR TI: SI TE ALCANZAN, GAME OVER.'],
      ['·', 'AL 100% POTAS SÍ O SÍ.'],
      ['·', 'CONOS = VISIÓN DE TU GENTE (ROSA).'],
      ['·', 'SI TE VEN POTAR: GAME OVER.'],
      ['·', 'STAFF: NO POTES EN SU ZONA.'],
      ['·', 'SI NO TE VEN EN 30 S, SALEN A BUSCARTE.'],
      ['·', 'CON "?" TE HUELEN: ¡NO TE ACERQUES!'],
      ['·', 'B: USAR OBJETO. START: INVENTARIO.'],
    ];
    let y = 26;
    for (const [b, l] of lines) {
      const ws = wrapText(l, 132);
      drawText(ctx, b, 10, y, UI.yellow);
      ws.forEach((w) => { drawText(ctx, w, 15, y, UI.light); y += 7; });
      y += 4;
    }
    drawTextCentered(ctx, 'PULSA CUALQUIER BOTÓN', 80, 126, UI.grey);
  }
}
