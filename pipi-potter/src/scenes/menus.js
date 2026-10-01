// Pantallas: título, menú, reglas, historial, intro de nivel, resumen,
// game over, nombre arcade, selección de nivel y victoria.
import { SCREEN_W, SCREEN_H, CONFIG } from '../config.js';
import { input, vibrate } from '../engine/input.js';
import { audio } from '../audio/audio.js';
import { UI, panel, cursor, button, makeCanvas } from '../engine/gfx.js';
import { drawText, drawTextCentered, wrapText, textWidth } from '../engine/font.js';
import { pick, fmtTime, clamp, rand } from '../engine/util.js';
import { drawCharacter, pipiSpec, drawIcon, makePuddle } from '../assets/sprites.js';
import portraitUrl from '../assets/portrait.png';
import { drawGameOverArt } from '../assets/illustrations.js';
import { LEVELS } from '../levels/index.js';
import { resolveLevel } from '../levels/names.js';
import { loadScores, qualifies, addScore, lastName, saveName, fmtDate } from '../engine/storage.js';
import { shareCanvas } from '../engine/share.js';
import { buildShareCard } from '../ui/sharecard.js';
import { PHRASES, TYPE_TITLE, BREATH_PREFIX } from '../ui/phrases.js';
import { MOTES, MEDALS, MERITS, awardMote, awardMedal, unlockedMotes, unlockedMedals, unlockedMerits } from '../ui/motes.js';
import { ITEM_NAMES, ITEM_DESC } from './game.js';

// ---------- utilidades comunes ----------
function outlinedText(ctx, str, x, y, fill, outline, scale) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) drawText(ctx, str, x + dx, y + dy, outline, scale);
  drawText(ctx, str, x, y + scale, '#301848', scale);
  drawText(ctx, str, x, y, fill, scale);
}
function centeredOutlined(ctx, str, cx, y, fill, outline, scale) {
  outlinedText(ctx, str, Math.round(cx - textWidth(str, scale) / 2), y, fill, outline, scale);
}
function bg(ctx, t, c1 = '#1b1426', c2 = '#261c36') {
  ctx.fillStyle = c1;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.fillStyle = c2;
  const o = Math.floor(t * 8) % 16;
  for (let y = -16; y < SCREEN_H; y += 16) for (let x = -16; x < SCREEN_W; x += 16) if (((x + y) / 16) % 2 === 0) ctx.fillRect(x + o, y + o, 8, 8);
}
const hit = (tap, r) => tap && r && tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h;

// Menú vertical genérico con soporte táctil
class ListMenu {
  constructor(items, x, y, w, sel = 0) { this.items = items; this.x = x; this.y = y; this.w = w; this.sel = sel; this.rects = []; }
  update() {
    const tap = input.consumeTap();
    if (tap) {
      const i = this.rects.findIndex((r) => hit(tap, r));
      if (i >= 0) { this.sel = i; audio.sfx('select'); return i; }
    }
    if (input.pressed.up) { this.sel = (this.sel + this.items.length - 1) % this.items.length; audio.sfx('move'); }
    if (input.pressed.down) { this.sel = (this.sel + 1) % this.items.length; audio.sfx('move'); }
    if (input.pressed.a || input.pressed.start) { audio.sfx('select'); return this.sel; }
    return null;
  }
  draw(ctx) {
    this.rects = this.items.map((label, i) => button(ctx, typeof label === 'function' ? label() : label, this.x, this.y + i * 14, this.w, i === this.sel));
  }
}

// ============================================================
export class TitleScene {
  constructor(app) { this.app = app; }
  enter() {
    this.t = 0;
    this.resetLoop();
    this.puddleImg = makePuddle(0.77);
    this.stars = Array.from({ length: 30 }, () => [rand(0, 160), rand(0, 60), rand(0, 6)]);
    audio.playMusic('title');
  }
  resetLoop() {
    this.px = -20; this.state = 'walk'; this.st = 0; this.puddles = []; this.faceY = 150;
  }
  update(dt) {
    this.t += dt;
    this.st += dt;
    if (this.state === 'walk') {
      // Pipi entra por la izquierda, pota en el centro y sale por la derecha
      this.px += dt * 38;
      if (this.px > 72 && this.puddles.length === 0) { this.state = 'puke'; this.st = 0; this.retched = 0; audio.sfx('retch'); }
      if (this.px > 170) { this.state = 'rise'; this.st = 0; }
    } else if (this.state === 'puke') {
      // mismo sonido que al potar en partida
      if (this.st > 0.5 && this.retched === 0) { this.retched = 1; audio.sfx('retch'); }
      if (this.st > 0.8 && this.retched === 1) { this.retched = 2; audio.sfx('puke'); }
      if (this.st > 1.6) { this.puddles.push(this.px + 20); this.state = 'walk'; }
    }
    else if (this.state === 'rise') {
      // su cara sube desde abajo y se queda bajo el título haciendo la peineta
      this.faceY = Math.max(FACE_Y, this.faceY - dt * 70);
      if (this.faceY === FACE_Y && this.st > 7) { this.state = 'sink'; this.st = 0; }
    } else if (this.state === 'sink') {
      this.faceY += dt * 90;
      if (this.faceY > 150) this.resetLoop();
    }
    const pressed = input.pressed.start || input.pressed.a || input.consumeTap();
    if (pressed) {
      // la primera pulsación sólo activa el sonido (los navegadores lo exigen)
      if (!audio.running && !this.audioAsked) { this.audioAsked = true; audio.init(); return; }
      audio.sfx('select');
      this.app.setScene(new MenuScene(this.app));
    }
  }
  render(ctx) {
    ctx.fillStyle = '#140c24'; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    for (const [x, y, p] of this.stars) { if (Math.floor(this.t * 2 + p) % 3) { ctx.fillStyle = '#b8a8e8'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } }
    // luna
    ctx.fillStyle = '#f8f0c0'; ctx.beginPath(); ctx.arc(140, 16, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#140c24'; ctx.beginPath(); ctx.arc(137, 14, 6, 0, 7); ctx.fill();
    // skyline
    ctx.fillStyle = '#2a1c40';
    const bs = [[0, 80, 20], [20, 70, 14], [34, 86, 18], [52, 64, 16], [68, 78, 22], [90, 72, 12], [102, 84, 20], [122, 68, 16], [138, 80, 22]];
    for (const [x, y, w] of bs) ctx.fillRect(x, y, w, 110 - y);
    ctx.fillStyle = '#f8c838';
    for (const [x, y, w] of bs) for (let wy = y + 4; wy < 104; wy += 6) for (let wx = x + 3; wx < x + w - 2; wx += 5) if ((wx * 7 + wy * 13) % 5 === 0) ctx.fillRect(wx, wy, 2, 2);
    ctx.fillStyle = '#3a2c50'; ctx.fillRect(0, 110, SCREEN_W, 34);
    ctx.fillStyle = '#4a3a60'; for (let x = 0; x < 160; x += 12) ctx.fillRect(x, 118, 6, 1);
    // Pipi paseando
    if (this.state === 'walk' || this.state === 'puke') for (const x of this.puddles) ctx.drawImage(this.puddleImg, Math.round(x - 9), 124);
    if (this.state === 'walk' || this.state === 'puke') {
      const walking = this.state === 'walk';
      const step = walking ? 1 + (Math.floor(this.t * 8) % 2) : 0;
      const shake = this.state === 'puke' ? Math.round(Math.sin(this.st * 40)) : 0;
      drawCharacter(ctx, pipiSpec(this.state === 'puke' ? 1 : 0.7, this.puddles.length > 0), 'right', step, Math.round(this.px) + shake, 110);
      if (this.state === 'puke' && this.st > 0.8) {
        ctx.fillStyle = '#8cb030';
        for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(this.px) + 14 + i, 118 + Math.round(i * i * 0.3) + (Math.floor(this.st * 20 + i) % 2), 1, 2);
      }
    }
    // cara gigante + peineta
    if (this.faceY < 145) drawPipiFace(ctx, 48, Math.round(this.faceY));
    // logo
    const bob = Math.round(Math.sin(this.t * 3) * 1.5);
    centeredOutlined(ctx, 'PIPI', 80, 6 + bob, UI.yellow, '#e03878', 4);
    centeredOutlined(ctx, 'POTTER', 80, 30 + bob, '#b8e070', '#2a6a28', 3);
    drawTextCentered(ctx, 'SIGILO, FIESTA Y ARCADAS', 80, 50, UI.light, 1, UI.ink);
    const hint = !audio.running && !this.audioAsked ? 'PULSA PARA EMPEZAR' : 'PULSA START';
    if (Math.floor(this.t * 2) % 2) drawTextCentered(ctx, hint, 80, 129, UI.light, 1, UI.ink);
    drawTextCentered(ctx, '(C) 2026 · CON CARIÑO Y ALMAX', 80, 137, '#8a80a0');
  }
}

// Retrato de Pipi: la imagen de referencia tal cual (assets/portrait.png)
const FACE_Y = 55; // retrato 4x (64x72) bajo el título
const portraitImg = new Image();
portraitImg.src = portraitUrl;
// Zona útil del PNG (el personaje, 16x18) dibujada a 4x por vecino más cercano
const PORTRAIT_SRC = { x: 21, y: 14, w: 16, h: 18 };
const PORTRAIT_SCALE = 4;
export function drawPipiFace(ctx, x, y) {
  if (!portraitImg.complete || !portraitImg.naturalWidth) return;
  const { x: sx, y: sy, w, h } = PORTRAIT_SRC;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(portraitImg, sx, sy, w, h, x, y, w * PORTRAIT_SCALE, h * PORTRAIT_SCALE);
}

// ============================================================
export class MenuScene {
  constructor(app) { this.app = app; }
  enter() {
    this.t = 0;
    const unlocked = this.app.unlocked();
    this.opts = [['INICIAR PARTIDA', 'start']];
    if (unlocked > 0) this.opts.push(['ELEGIR NIVEL', 'select']);
    this.opts.push(['REGLAS DEL JUEGO', 'rules'], ['HISTORIAL', 'scores'], ['LOGROS', 'logros'], [() => (audio.muted ? 'SONIDO: NO' : 'SONIDO: SÍ'), 'sound']);
    this.menu = new ListMenu(this.opts.map((o) => o[0]), 30, this.opts.length >= 7 ? 27 : 38, 100);
    audio.playMusic('title');
  }
  update(dt) {
    this.t += dt;
    if (input.pressed.b) { audio.sfx('back'); this.app.setScene(new TitleScene(this.app)); return; }
    const i = this.menu.update();
    if (i === null) return;
    const id = this.opts[i][1];
    if (id === 'start') this.app.newRun(0);
    if (id === 'select') this.app.setScene(new LevelSelectScene(this.app));
    if (id === 'rules') this.app.setScene(new RulesScene(this.app, () => new MenuScene(this.app)));
    if (id === 'scores') this.app.setScene(new ScoresScene(this.app));
    if (id === 'logros') this.app.setScene(new LogrosScene(this.app));
    if (id === 'sound') audio.setMuted(!audio.muted);
  }
  render(ctx) {
    bg(ctx, this.t);
    centeredOutlined(ctx, 'PIPI POTTER', 80, 12, UI.yellow, '#e03878', 2);
    if (this.opts.length < 7) drawTextCentered(ctx, 'MENÚ PRINCIPAL', 80, 29, UI.light, 1, UI.ink);
    this.menu.draw(ctx);
    drawCharacter(ctx, pipiSpec(0.4), 'down', Math.floor(this.t * 3) % 3 === 0 ? 0 : 0, 8, 120);
    drawTextCentered(ctx, 'A: ELEGIR · B: VOLVER', 88, 128, UI.grey);
  }
}

// ============================================================
export class LevelSelectScene {
  constructor(app) { this.app = app; }
  enter() {
    this.t = 0;
    const n = Math.min(this.app.unlocked() + 1, LEVELS.length);
    this.menu = new ListMenu(LEVELS.slice(0, n).map((l, i) => `${i + 1}. ${l.name}`), 25, 30, 110);
  }
  update(dt) {
    this.t += dt;
    if (input.pressed.b) { audio.sfx('back'); this.app.setScene(new MenuScene(this.app)); return; }
    const i = this.menu.update();
    if (i !== null) this.app.newRun(i);
  }
  render(ctx) {
    bg(ctx, this.t);
    centeredOutlined(ctx, 'ELEGIR NIVEL', 80, 10, UI.yellow, '#e03878', 2);
    this.menu.draw(ctx);
    drawTextCentered(ctx, 'EMPIEZAS CON 0 PUNTOS Y 1 CHICLE', 80, 128, UI.grey);
  }
}

// ============================================================
// Reglas: páginas cortas ilustradas
const RULE_PAGES = [
  {
    title: 'EL OBJETIVO',
    text: 'PIPI SIEMPRE ACABA POTANDO CUANDO SALE DE FIESTA. EN CADA NIVEL DEBES POTAR 3 VECES SIN QUE TE VEAN TUS AMIGOS NI TU FAMILIA Y AGUANTAR 10 SEGUNDOS MÁS. BUSCA LOS 5 PITIS ESCONDIDOS: DAN PUNTOS SI LOS CONSERVAS.',
    draw(ctx, t) {
      drawCharacter(ctx, pipiSpec(0.9), 'down', 0, 56, 20, 2);
      for (let i = 0; i < 3; i++) drawIcon(ctx, 'puke', 104 + i * 10, 34);
      drawText(ctx, 'X3', 110, 46, UI.yellow);
    },
  },
  {
    title: 'CONTROLES',
    text: 'CRUCETA: MOVER. A (MANTENER 2 S): POTAR. B: USAR OBJETO (LOS LANZABLES SALEN HACIA DONDE MIRAS). START: PAUSA E INVENTARIO. SELECT: REGLAS RÁPIDAS.',
    draw(ctx, t) {
      ctx.fillStyle = UI.dark; ctx.fillRect(40, 30, 24, 8); ctx.fillRect(48, 22, 8, 24);
      ctx.fillStyle = UI.red; ctx.beginPath(); ctx.arc(106, 30, 6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(92, 38, 6, 0, 7); ctx.fill();
      drawText(ctx, 'A', 105, 28, UI.light); drawText(ctx, 'B', 91, 36, UI.light);
      drawText(ctx, 'POTAR', 112, 20, UI.green); drawText(ctx, 'USAR', 70, 46, UI.cyan);
    },
  },
  {
    title: 'LA NÁUSEA',
    text: 'SUBE SOLA: 30 S DE 0 A 100%. DESDE EL 50% PUEDES POTAR. DESDE EL 75% DAS TUMBOS. AL 100% POTAS DONDE ESTÉS... ¡OJO!',
    draw(ctx, t) {
      const k = (t * 0.3) % 1;
      ctx.fillStyle = UI.light; ctx.fillRect(29, 29, 102, 10);
      ctx.fillStyle = UI.dark; ctx.fillRect(30, 30, 100, 8);
      ctx.fillStyle = k < 0.5 ? UI.green : k < 0.75 ? UI.yellow : UI.red; ctx.fillRect(30, 30, Math.round(100 * k), 8);
      ctx.fillStyle = UI.ink; ctx.fillRect(80, 30, 1, 8); ctx.fillRect(105, 30, 1, 8);
      drawText(ctx, '50%', 74, 42, UI.light); drawText(ctx, '75%', 99, 42, UI.light);
      drawCharacter(ctx, pipiSpec(k), 'down', 0, 8 + Math.round(Math.sin(t * 5) * (k > 0.75 ? 2 : 0)), 24);
    },
  },
  {
    title: 'CONOS DE VISIÓN',
    text: 'TU GENTE LLEVA SU NOMBRE ENCIMA (EL STAFF, "STAFF") Y VE LO QUE HAY EN SU CONO. MUROS, MUEBLES ALTOS Y OTRAS PERSONAS TAPAN LA VISIÓN. SI NADIE TE VE EN 15 S, SALEN A BUSCARTE. REVISAN LAS ESQUINAS. ¡OJO CON LOS PERROS!',
    draw(ctx, t) {
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#f8f0c0';
      ctx.beginPath(); ctx.moveTo(40, 34); ctx.lineTo(110, 14); ctx.lineTo(110, 54); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      drawCharacter(ctx, { style: 'long', body: 'dress', outline: '#1e1428', hair: '#e8c060', skin: '#f8d8c0', shirt: '#4a6a90', pants: '#303850' }, 'right', 0, 28, 24);
      drawTextCentered(ctx, 'LAURA', 36, 17, UI.light, 1, UI.ink);
      drawCharacter(ctx, { style: 'short', body: 'normal', outline: '#1e1428', hair: '#201820', skin: '#d09060', shirt: '#38c8e8', pants: '#303850' }, 'left', 0, 70, 24);
      drawCharacter(ctx, pipiSpec(0.6), 'left', 0, 90, 24);
    },
  },
  {
    title: 'SOSPECHAS',
    text: 'SÓLO SOSPECHAN SI TU NÁUSEA PASA DEL 50% (EL STAFF, DEL 75%). "?" (-3%) Y LUEGO "!": CORREN A POR TI. SI TE ALCANZAN, GAME OVER; SI ESCAPAS, -7%. CHARCOS Y HUELLAS LES DEJAN CON "?": NO TE ACERQUES O TE HUELEN.',
    draw(ctx, t) {
      const draw = (x, g, fill, meter, mc) => {
        ctx.fillStyle = UI.ink; ctx.fillRect(x - 5, 22, 11, 12); ctx.fillStyle = fill; ctx.fillRect(x - 4, 23, 9, 10);
        if (meter) { ctx.fillStyle = mc; const h = Math.round(10 * meter); ctx.fillRect(x - 4, 33 - h, 9, h); }
        drawText(ctx, g, x - 1, 26, UI.ink);
      };
      const k = (t * 0.5) % 1;
      draw(40, '?', UI.light, k, UI.yellow); draw(80, '!', UI.yellow, k, UI.red); draw(120, '!', UI.red);
      drawText(ctx, '>', 58, 26, UI.light); drawText(ctx, '>', 98, 26, UI.light);
    },
  },
  {
    title: 'EL STAFF',
    text: 'CAMAREROS, PORTEROS, SEGURIDAD Y MUNICIPALES (CRUZ NARANJA): SI TE VEN POTAR DENTRO DE SU ZONA (LÍNEA NARANJA) TE ECHAN. EL RESTO DE LA GENTE SÓLO SE QUEJA (-7%).',
    draw(ctx, t) {
      ctx.strokeStyle = 'rgba(240,136,48,0.9)'; ctx.setLineDash([2, 2]); ctx.strokeRect(40.5, 16.5, 80, 38); ctx.setLineDash([]);
      ctx.fillStyle = UI.orange; ctx.fillRect(41, 17, 21, 7); drawText(ctx, 'STAFF', 42, 18, UI.ink);
      drawCharacter(ctx, { style: 'short', body: 'normal', outline: '#1e1428', hair: '#201820', skin: '#e8b088', shirt: '#f4f4f4', pants: '#181818', bowtie: '#181818' }, 'down', 0, 72, 30);
      ctx.fillStyle = UI.orange; ctx.fillRect(79, 25, 3, 1); ctx.fillRect(80, 24, 1, 3);
    },
  },
  {
    title: 'OBJETOS',
    text: '',
    draw(ctx, t) {
      const items = ['chicle', 'pitillo', 'sobras', 'mechero', 'botella'];
      items.forEach((k, i) => {
        drawIcon(ctx, k, 8, 16 + i * 17);
        drawText(ctx, ITEM_NAMES[k], 20, 16 + i * 17, UI.yellow);
        wrapText(ITEM_DESC[k], 128).forEach((l, j) => drawText(ctx, l, 20, 23 + i * 17 + j * 7, UI.light));
      });
    },
  },
  {
    title: 'PUNTUACIÓN',
    text: 'BASE POR NIVEL + BONUS POR TIEMPO (CUANTO ANTES, MEJOR) + SOBRAS. CADA SOSPECHA RESTA UN 3% Y CADA PILLADA ZAFADA UN 7% DEL NIVEL. EMPIEZAS CON 1 CHICLE.',
    draw(ctx, t) {
      centeredOutlined(ctx, String(Math.floor((t * 1234) % 99999)).padStart(5, '0'), 80, 26, UI.yellow, '#e03878', 2);
    },
  },
];

export class RulesScene {
  constructor(app, back) { this.app = app; this.back = back; }
  enter() { this.t = 0; this.page = 0; }
  update(dt) {
    this.t += dt;
    const tap = input.consumeTap();
    if (input.pressed.b || input.pressed.start || hit(tap, this.closeRect)) { audio.sfx('back'); this.app.setScene(this.back()); return; }
    if (input.pressed.right || input.pressed.a || (tap && tap.x > 80)) { if (this.page < RULE_PAGES.length - 1) { this.page++; audio.sfx('move'); } else if (input.pressed.a || tap) { audio.sfx('back'); this.app.setScene(this.back()); } }
    else if (input.pressed.left || (tap && tap.x <= 80)) { if (this.page > 0) { this.page--; audio.sfx('move'); } }
  }
  render(ctx) {
    bg(ctx, this.t, '#1b1426', '#221a30');
    const p = RULE_PAGES[this.page];
    panel(ctx, 2, 2, 156, 140);
    drawTextCentered(ctx, `${p.title}`, 80, 7, UI.yellow);
    ctx.save(); ctx.translate(0, 8); p.draw(ctx, this.t); ctx.restore();
    let y = p.text ? 72 : 0;
    for (const l of wrapText(p.text, 144)) { drawText(ctx, l, 8, y, UI.light); y += 7; }
    drawText(ctx, `${this.page + 1}/${RULE_PAGES.length}`, 8, 132, UI.grey);
    drawText(ctx, this.page > 0 ? '< ANT' : '', 40, 132, UI.cyan);
    drawText(ctx, this.page < RULE_PAGES.length - 1 ? 'SIG >' : 'FIN >', 100, 132, UI.cyan);
    this.closeRect = { x: 140, y: 2, w: 18, h: 12 };
    drawText(ctx, 'X', 148, 7, UI.red);
  }
}

// ============================================================
export class ScoresScene {
  constructor(app) { this.app = app; }
  enter() { this.t = 0; this.sel = 0; this.scores = loadScores(); this.msg = null; }
  update(dt) {
    this.t += dt;
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    const tap = input.consumeTap();
    if (input.pressed.b || hit(tap, this.backRect)) { audio.sfx('back'); this.app.setScene(new MenuScene(this.app)); return; }
    if (!this.scores.length) return;
    if (tap && this.rowRects) {
      const i = this.rowRects.findIndex((r) => hit(tap, r));
      if (i >= 0) { if (this.sel === i) this.share(); else { this.sel = i; audio.sfx('move'); } return; }
    }
    if (input.pressed.up) { this.sel = (this.sel + this.scores.length - 1) % this.scores.length; audio.sfx('move'); }
    if (input.pressed.down) { this.sel = (this.sel + 1) % this.scores.length; audio.sfx('move'); }
    if (input.pressed.a || hit(tap, this.shareRect)) this.share();
  }
  async share() {
    const e = this.scores[this.sel];
    if (!e) return;
    audio.sfx('select');
    const card = buildShareCard({
      title: `${this.sel + 1}º PUESTO: ${e.name}`, phrase: e.victory ? '¡HA SUPERADO LAS 5 FIESTAS SIN QUE NADIE SE ENTERE!' : 'HA POTADO CON ESTILO... HASTA QUE LE PILLARON.',
      levelText: `NIVEL ${e.level} · ${fmtDate(e.date)}`, score: e.score,
    });
    const r = await shareCanvas(card, `🤮 ${e.name} ha hecho ${e.score} puntos en PIPI POTTER (nivel ${e.level}). ¿Puedes potar más discreto que él?`, 'pipi-potter-record.png');
    this.msg = { text: r === 'fallback' ? 'IMAGEN DESCARGADA' : 'COMPARTIDO', t: 2 };
  }
  render(ctx) {
    bg(ctx, this.t);
    centeredOutlined(ctx, 'HISTORIAL', 80, 4, UI.yellow, '#e03878', 2);
    panel(ctx, 2, 20, 156, 108);
    drawText(ctx, '#  NOM  PUNTOS NIV  FECHA', 7, 25, UI.grey);
    this.rowRects = [];
    if (!this.scores.length) drawTextCentered(ctx, 'AÚN NO HAY PUNTUACIONES', 80, 70, UI.light);
    this.scores.forEach((e, i) => {
      const y = 34 + i * 9;
      const sel = i === this.sel;
      if (sel) { ctx.fillStyle = UI.dark; ctx.fillRect(4, y - 2, 152, 9); }
      const col = sel ? UI.yellow : i === 0 ? UI.orange : UI.light;
      drawText(ctx, String(i + 1).padStart(2, ' '), 5, y, col);
      drawText(ctx, e.name, 17, y, col);
      drawText(ctx, String(e.score).padStart(6, ' '), 34, y, col);
      if (!e.victory) drawText(ctx, String(e.level), 66, y, col);
      if (e.victory) drawIcon(ctx, 'star', 64, y - 2);
      drawText(ctx, fmtDate(e.date), 82, y, col);
      this.rowRects.push({ x: 4, y: y - 2, w: 152, h: 9 });
    });
    this.shareRect = this.scores.length ? button(ctx, 'COMPARTIR', 8, 131, 70, true) : null;
    this.backRect = button(ctx, 'VOLVER', 84, 131, 68, false);
    if (this.msg) { panel(ctx, 30, 64, 100, 15); drawTextCentered(ctx, this.msg.text, 80, 69, UI.yellow); }
  }
}

// ============================================================
export class LevelIntroScene {
  constructor(app, idx) { this.app = app; this.idx = idx; }
  enter() {
    this.t = 0;
    this.data = resolveLevel(LEVELS[this.idx], this.app.run, this.idx);
    this.npcA = this.data.npcs.filter((n) => n.kind === 'A');
    audio.stopMusic();
    audio.sfx('select');
  }
  update(dt) {
    this.t += dt;
    if (this.t > 0.4 && (input.pressed.a || input.pressed.start || input.consumeTap())) { audio.sfx('select'); this.app.play(this.idx); }
    if (input.pressed.b) { audio.sfx('back'); this.app.toMenu(); }
  }
  render(ctx) {
    bg(ctx, this.t, '#1b1426', '#241a34');
    drawTextCentered(ctx, `NIVEL ${this.idx + 1} DE ${LEVELS.length}`, 80, 5, UI.grey);
    centeredOutlined(ctx, this.data.name, 80, 14, UI.yellow, '#e03878', 2);
    panel(ctx, 4, 32, 152, 42);
    let y = 37;
    for (const l of wrapText(this.data.intro, 140)) { drawText(ctx, l, 10, y, UI.light); y += 7; }
    drawText(ctx, 'QUE NO TE PILLEN:', 6, 77, UI.pink);
    this.npcA.forEach((n, i) => {
      const per = this.npcA.length > 8 ? 5 : 4;
      const col = i % per, row = Math.floor(i / per);
      const cx = per === 5 ? 17 + col * 31 : 22 + col * 39, yy = 84 + row * 25;
      drawCharacter(ctx, n.look, 'down', 0, cx - 8, yy);
      drawTextCentered(ctx, n.name, cx, yy + 17, n.role === 'friend' || n.role === 'coworker' ? UI.light : UI.yellow);
    });
    if (Math.floor(this.t * 2) % 2) drawTextCentered(ctx, 'PULSA A: ¡A POTAR!', 80, 137, UI.yellow);
  }
}
const ROLE_LABEL = { friend: 'AMIGO', partner: 'NOVIA', family: 'FAMILIA', inlaw: 'SUEGRO', groom: 'NOVIO', bride: 'NOVIA' };
const ROLE_LABEL_F = { ...ROLE_LABEL, friend: 'AMIGA', inlaw: 'SUEGRA' };

// ============================================================
export function computeLevelScore(idx, stats) {
  const S = CONFIG.score;
  const base = S.levelBase * (idx + 1);
  const timeBonus = Math.round(S.timeBonusMax * Math.pow(0.5, stats.time / S.timeBonusHalfLife));
  const pitiBonus = (stats.pitis || 0) * S.pitilloBonus;
  const subtotal = base + timeBonus + stats.sobras + pitiBonus;
  const factor = Math.max(S.minFactor, 1 - S.suspicionPenalty * stats.suspicions - S.escapePenalty * stats.escapes);
  return { base, timeBonus, sobras: stats.sobras, pitiBonus, subtotal, factor, total: Math.round(subtotal * factor) };
}

export class SummaryScene {
  constructor(app, idx, stats) { this.app = app; this.idx = idx; this.stats = stats; }
  enter() {
    this.t = 0;
    this.sc = computeLevelScore(this.idx, this.stats);
    this.prev = this.app.run.score;
    this.app.run.score += this.sc.total;
    audio.playMusic('victory');
  }
  update(dt) {
    this.t += dt;
    if (this.t > 1 && (input.pressed.a || input.pressed.start || input.consumeTap())) { audio.sfx('select'); this.app.nextLevel(); }
  }
  render(ctx) {
    bg(ctx, this.t, '#142018', '#1a2a20');
    centeredOutlined(ctx, '¡NIVEL SUPERADO!', 80, 5, UI.yellow, '#2a6a28', 1);
    drawTextCentered(ctx, LEVELS[this.idx].name, 80, 15, UI.light);
    panel(ctx, 4, 24, 152, 104);
    const s = this.stats, sc = this.sc;
    const rows = [
      ['BASE DEL NIVEL', `${sc.base}`, UI.light],
      [`TIEMPO ${fmtTime(s.time)}`, `+${sc.timeBonus}`, UI.light],
      ['SOBRAS', `+${sc.sobras}`, UI.light],
      [`PITIS CONSERVADOS ${s.pitis || 0}/${CONFIG.score.pitillosPerLevel}`, `+${sc.pitiBonus}`, UI.light],
      ['SUBTOTAL', `${sc.subtotal}`, UI.cyan],
      [`SOSPECHAS X${s.suspicions}`, `-${Math.round(s.suspicions * CONFIG.score.suspicionPenalty * 100)}%`, UI.yellow],
      [`PILLADAS ZAFADAS X${s.escapes}`, `-${Math.round(s.escapes * CONFIG.score.escapePenalty * 100)}%`, UI.orange],
      ['TOTAL NIVEL', `${sc.total}`, UI.green],
    ];
    const shown = Math.min(rows.length, Math.floor(this.t * 6));
    rows.slice(0, shown).forEach(([l, v, c], i) => {
      const y = 30 + i * 10;
      drawText(ctx, l, 10, y, c);
      drawText(ctx, v, 150 - textWidth(v), y, c);
      if (i === 4 || i === 6) { ctx.fillStyle = UI.dark; ctx.fillRect(10, y + 7, 140, 1); }
    });
    if (shown >= rows.length) {
      drawText(ctx, 'PUNTUACIÓN', 10, 112, UI.yellow);
      const v = String(this.app.run.score);
      drawText(ctx, v, 150 - textWidth(v, 1), 112, UI.yellow);
      if (Math.floor(this.t * 2) % 2) drawTextCentered(ctx, this.idx + 1 < LEVELS.length ? 'PULSA A: SIGUIENTE FIESTA' : 'PULSA A: ¡FINAL!', 80, 133, UI.light);
    }
  }
}

// ============================================================
export class NameEntryScene {
  constructor(app, score, level, victory, done) { this.app = app; this.score = score; this.level = level; this.victory = victory; this.done = done; }
  enter() {
    this.t = 0;
    this.letters = lastName().split('');
    this.pos = 0;
    this.chars = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789'.split('');
  }
  change(i, d) {
    const k = this.chars.indexOf(this.letters[i]);
    this.letters[i] = this.chars[(k + d + this.chars.length) % this.chars.length];
    audio.sfx('move');
  }
  confirm() {
    const name = this.letters.join('');
    saveName(name);
    this.rank = addScore({ name, score: this.score, level: this.level, victory: this.victory });
    audio.sfx('win');
    this.done(this.rank);
  }
  update(dt) {
    this.t += dt;
    const tap = input.consumeTap();
    if (tap) {
      for (let i = 0; i < 3; i++) {
        const x = 50 + i * 22;
        if (tap.x >= x - 4 && tap.x <= x + 16) {
          if (tap.y >= 44 && tap.y < 60) { this.pos = i; this.change(i, 1); return; }
          if (tap.y >= 60 && tap.y <= 80) { this.pos = i; this.change(i, -1); return; }
        }
      }
      if (hit(tap, this.okRect)) { this.confirm(); return; }
    }
    if (input.pressed.up) this.change(this.pos, 1);
    if (input.pressed.down) this.change(this.pos, -1);
    if (input.pressed.left) { this.pos = Math.max(0, this.pos - 1); audio.sfx('move'); }
    if (input.pressed.right) { this.pos = Math.min(2, this.pos + 1); audio.sfx('move'); }
    if (input.pressed.a) { if (this.pos < 2) { this.pos++; audio.sfx('select'); } else this.confirm(); }
    if (input.pressed.b && this.pos > 0) { this.pos--; audio.sfx('back'); }
    if (input.pressed.start) this.confirm();
  }
  render(ctx) {
    bg(ctx, this.t);
    centeredOutlined(ctx, '¡NUEVO RÉCORD!', 80, 8, UI.yellow, '#e03878', 2);
    drawTextCentered(ctx, `${this.score} PUNTOS`, 80, 28, UI.light);
    drawTextCentered(ctx, 'TUS INICIALES:', 80, 38, UI.grey);
    for (let i = 0; i < 3; i++) {
      const x = 50 + i * 22;
      const sel = i === this.pos;
      panel(ctx, x - 4, 52, 20, 22, sel ? UI.dark : UI.ink, sel ? UI.yellow : UI.grey);
      drawText(ctx, this.letters[i], x + 1, 57, sel ? UI.yellow : UI.light, 2);
      if (sel && Math.floor(this.t * 3) % 2) { drawText(ctx, '+', x + 4, 45, UI.cyan); drawText(ctx, '-', x + 4, 77, UI.cyan); }
    }
    this.okRect = button(ctx, 'OK', 60, 96, 40, true);
    drawTextCentered(ctx, 'ARRIBA/ABAJO: LETRA · A: SIGUIENTE', 80, 118, UI.grey);
    drawTextCentered(ctx, 'TOCA ENCIMA/DEBAJO DE LA LETRA', 80, 127, UI.grey);
  }
}

// ============================================================
export class GameOverScene {
  constructor(app, info) { this.app = app; this.info = info; }
  enter() {
    this.t = 0;
    const base = pick(PHRASES[this.info.type] || PHRASES.friends);
    this.phrase = (this.info.reason === 'breath' ? pick(BREATH_PREFIX) : '') + base;
    this.title = this.info.reason === 'breath' ? `${this.info.catcherName} TE HA OLIDO` : this.info.reason === 'stains' ? `${this.info.catcherName} HA VISTO TUS MANCHAS` : TYPE_TITLE[this.info.type];
    this.score = this.app.run.score;
    this.sel = 0;
    this.msg = null;
    this.mote = this.info.mote || (this.info.mote = awardMote());
    audio.sfx('gameover');
    vibrate([300]);
    if (!this.info.saved && qualifies(this.score)) {
      this.info.saved = true;
      const self = this;
      this.app.setScene(new NameEntryScene(this.app, this.score, this.info.levelIndex + 1, false, () => self.app.setScene(self, true)));
    }
  }
  update(dt) {
    this.t += dt;
    if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
    const tap = input.consumeTap();
    if (tap && this.rects) {
      const i = this.rects.findIndex((r) => hit(tap, r));
      if (i >= 0) { this.sel = i; this.activate(i); return; }
    }
    if (input.pressed.left || input.pressed.up) { this.sel = (this.sel + 2) % 3; audio.sfx('move'); }
    if (input.pressed.right || input.pressed.down) { this.sel = (this.sel + 1) % 3; audio.sfx('move'); }
    if (this.t > 0.6 && (input.pressed.a || input.pressed.start)) this.activate(this.sel);
  }
  async activate(i) {
    audio.sfx('select');
    if (i === 0) {
      const card = buildShareCard({ art: this.info, title: this.title, phrase: this.phrase, levelText: `NIVEL ${this.info.levelIndex + 1}: ${this.info.levelName}`, score: this.score, extra: `MOTE: ${this.mote.name}` });
      const txt = `🤮 PIPI POTTER: me han pillado potando en ${this.info.levelName.toLowerCase()} (nivel ${this.info.levelIndex + 1}). "${this.phrase}" Nuevo mote: ${this.mote.name}. Puntos: ${this.score}. ¿Lo haces mejor?`;
      const r = await shareCanvas(card, txt, 'pipi-potter-gameover.png');
      this.msg = { text: r === 'fallback' ? 'IMAGEN DESCARGADA' : r === 'cancel' ? 'CANCELADO' : 'COMPARTIDO', t: 2 };
    }
    if (i === 1) this.app.retryLevel();
    if (i === 2) this.app.toMenu();
  }
  render(ctx) {
    ctx.fillStyle = UI.ink; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    drawGameOverArt(ctx, this.info, 8, 3, this.t);
    drawTextCentered(ctx, this.title, 80, 79, UI.red);
    let y = 88;
    for (const l of wrapText(this.phrase, 150)) { drawTextCentered(ctx, l, 80, y, UI.light); y += 7; }
    y = Math.max(y + 2, 104);
    drawTextCentered(ctx, `MOTE: ${this.mote.name}`, 80, y, UI.pink);
    if (this.mote.isNew && Math.floor(this.t * 3) % 2) drawTextCentered(ctx, '¡NUEVO LOGRO!', 80, y - 8 < 97 ? 124 : y - 8, UI.green);
    drawTextCentered(ctx, `NIVEL ${this.info.levelIndex + 1} · PUNTOS ${this.score}`, 80, Math.min(y + 9, 121), UI.yellow);
    const labels = ['COMPARTIR', 'REINTENTAR', 'MENÚ'];
    const ws = [52, 52, 44];
    let x = 2;
    this.rects = labels.map((l, i) => { const r = button(ctx, l, x, 130, ws[i], i === this.sel); x += ws[i] + 3; return r; });
    if (this.msg) { panel(ctx, 30, 60, 100, 15); drawTextCentered(ctx, this.msg.text, 80, 65, UI.yellow); }
  }
}

// ============================================================
export class VictoryScene {
  constructor(app) { this.app = app; }
  enter() {
    this.t = 0;
    this.app.run.score += CONFIG.score.victoryBonus;
    this.score = this.app.run.score;
    this.sel = 0;
    this.count = this.app.run.cleared || LEVELS.length;
    // Medalla sólo si has superado las 5 fiestas seguidas en esta partida
    this.medal = this.count >= LEVELS.length ? awardMedal() : null;
    this.sparks = [];
    audio.playMusic('victory');
    if (!this.saved && qualifies(this.score)) {
      this.saved = true;
      const self = this;
      this.app.setScene(new NameEntryScene(this.app, this.score, LEVELS.length, true, () => self.app.setScene(self, true)));
    }
  }
  update(dt) {
    this.t += dt;
    if (Math.random() < dt * 3) {
      const x = rand(20, 140), y = rand(10, 50), c = pick([UI.yellow, UI.pink, UI.cyan, UI.green]);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; this.sparks.push({ x, y, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, c, l: 1 }); }
    }
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 20 * dt; s.l -= dt; }
    this.sparks = this.sparks.filter((s) => s.l > 0);
    const tap = input.consumeTap();
    if (tap && this.rects) { const i = this.rects.findIndex((r) => hit(tap, r)); if (i >= 0) { this.activate(i); return; } }
    if (input.pressed.left || input.pressed.right) { this.sel = 1 - this.sel; audio.sfx('move'); }
    if (this.t > 1 && (input.pressed.a || input.pressed.start)) this.activate(this.sel);
  }
  async activate(i) {
    audio.sfx('select');
    if (i === 0) {
      const card = buildShareCard({ title: `¡${this.count} ${this.count === 1 ? 'FIESTA SUPERADA' : 'FIESTAS SUPERADAS'}!`, phrase: 'NADIE SE HA ENTERADO DE NADA.', levelText: 'JUEGO COMPLETADO', score: this.score, extra: this.medal ? `MEDALLA: ${this.medal.name}` : '' });
      await shareCanvas(card, `🏆 He completado PIPI POTTER con ${this.score} puntos sin que nadie me pillase potando. ¿Te atreves?`, 'pipi-potter-victoria.png');
    } else this.app.toMenu();
  }
  render(ctx) {
    bg(ctx, this.t, '#1b1426', '#2a1c40');
    for (const s of this.sparks) { ctx.fillStyle = s.c; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    centeredOutlined(ctx, '¡VICTORIA!', 80, 8, UI.yellow, '#e03878', 3);
    drawCharacter(ctx, pipiSpec(0.2), 'down', Math.floor(this.t * 4) % 3, 64, 40, 2);
    drawTextCentered(ctx, `HAS SOBREVIVIDO A ${this.count} ${this.count === 1 ? 'FIESTA' : 'FIESTAS'}`, 80, 76, UI.light);
    drawTextCentered(ctx, 'SIN QUE NADIE TE PILLE POTANDO.', 80, 84, UI.light);
    if (this.medal) {
      drawTextCentered(ctx, this.medal.name, 80, 93, UI.pink);
      if (this.medal.isNew && Math.floor(this.t * 3) % 2) drawTextCentered(ctx, '¡NUEVA MEDALLA!', 80, 100, UI.green);
    } else drawTextCentered(ctx, 'SUPERA LAS 5 SEGUIDAS: MEDALLA', 80, 93, UI.grey);
    drawTextCentered(ctx, `PUNTOS: ${this.score}`, 80, 106, UI.yellow, 1);
    this.rects = [button(ctx, 'COMPARTIR', 16, 126, 60, this.sel === 0), button(ctx, 'MENÚ', 84, 126, 60, this.sel === 1)];
  }
}

// ============================================================
// Logros: submenú con Motes, Medallas y Méritos
export class LogrosScene {
  constructor(app) { this.app = app; }
  enter() {
    this.t = 0;
    const m = unlockedMotes().size, me = unlockedMedals().size, mr = unlockedMerits().size;
    this.menu = new ListMenu([`MOTES ${m}/${MOTES.length}`, `MEDALLAS ${me}/${MEDALS.length}`, `MÉRITOS ${mr}/${MERITS.length}`, 'VOLVER'], 30, 44, 100);
  }
  update(dt) {
    this.t += dt;
    if (input.pressed.b) { audio.sfx('back'); this.app.setScene(new MenuScene(this.app)); return; }
    const i = this.menu.update();
    if (i === null) return;
    if (i === 0) this.app.setScene(new AchievementList(this.app, 'MOTES', MOTES, unlockedMotes(), 'QUE TE PILLEN PARA DESBLOQUEARLO'));
    if (i === 1) this.app.setScene(new AchievementList(this.app, 'MEDALLAS', MEDALS, unlockedMedals(), 'SUPERA LAS 5 FIESTAS SEGUIDAS'));
    if (i === 2) this.app.setScene(new AchievementList(this.app, 'MÉRITOS', MERITS, unlockedMerits(), null, true));
    if (i === 3) this.app.setScene(new MenuScene(this.app));
  }
  render(ctx) {
    bg(ctx, this.t);
    centeredOutlined(ctx, 'LOGROS', 80, 10, UI.yellow, '#e03878', 2);
    this.menu.draw(ctx);
    drawTextCentered(ctx, 'A: ELEGIR · B: VOLVER', 80, 128, UI.grey);
  }
}

class AchievementList {
  constructor(app, title, list, got, lockedHint, showHint) { Object.assign(this, { app, title, list, got, lockedHint, showHint }); }
  enter() { this.t = 0; this.sel = 0; this.scroll = 0; }
  update(dt) {
    this.t += dt;
    const tap = input.consumeTap();
    if (input.pressed.b || hit(tap, this.backRect)) { audio.sfx('back'); this.app.setScene(new LogrosScene(this.app)); return; }
    if (tap && this.rowRects) { const i = this.rowRects.findIndex((r) => hit(tap, r)); if (i >= 0) { this.sel = this.scroll + i; audio.sfx('move'); } }
    const n = this.list.length;
    if (input.pressed.up) { this.sel = (this.sel + n - 1) % n; audio.sfx('move'); }
    if (input.pressed.down) { this.sel = (this.sel + 1) % n; audio.sfx('move'); }
    const vis = 10;
    if (this.sel < this.scroll) this.scroll = this.sel;
    if (this.sel >= this.scroll + vis) this.scroll = this.sel - vis + 1;
  }
  render(ctx) {
    bg(ctx, this.t);
    centeredOutlined(ctx, this.title, 80, 3, UI.yellow, '#e03878', 2);
    drawTextCentered(ctx, `${this.got.size}/${this.list.length}`, 80, 19, UI.light);
    panel(ctx, 2, 26, 156, 92);
    this.rowRects = [];
    for (let i = 0; i < 10; i++) {
      const k = this.scroll + i;
      const m = this.list[k];
      if (!m) break;
      const y = 31 + i * 8;
      const have = this.got.has(m[0]);
      const sel = k === this.sel;
      if (sel) { ctx.fillStyle = UI.dark; ctx.fillRect(4, y - 1, 148, 8); }
      drawIcon(ctx, have ? 'star' : 'pukeEmpty', 6, y - 2);
      // los méritos muestran siempre el nombre; motes y medallas se ocultan
      const shown = have || this.showHint ? m[0] : '? ? ? ? ? ?';
      drawText(ctx, shown, 16, y, have ? (sel ? UI.yellow : UI.light) : UI.grey);
      this.rowRects.push({ x: 4, y: y - 1, w: 148, h: 8 });
    }
    if (this.list.length > 10) {
      ctx.fillStyle = UI.dark; ctx.fillRect(153, 30, 2, 86);
      ctx.fillStyle = UI.grey; ctx.fillRect(153, 30 + Math.round((this.scroll / (this.list.length - 10)) * 70), 2, 16);
    }
    const cur = this.list[this.sel];
    const have = this.got.has(cur[0]);
    panel(ctx, 2, 118, 156, 12, UI.dark);
    const txt = have ? (cur[1] || '¡CONSEGUIDO!') : this.showHint ? 'AÚN NO CONSEGUIDO' : this.lockedHint;
    const w = wrapText(txt, 150);
    drawTextCentered(ctx, w[0], 80, 121, have ? UI.pink : UI.grey);
    this.backRect = button(ctx, 'VOLVER', 50, 132, 60, false);
  }
}
