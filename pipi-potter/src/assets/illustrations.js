// Ilustraciones pixel art de GAME OVER (una por tipo de "pillador")
import { drawCharacter, pipiSpec, makePuddle, drawIcon } from './sprites.js';
import { drawText, drawTextCentered } from '../engine/font.js';
import { UI } from '../engine/gfx.js';

let puddleImg = null;

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

function bubble(ctx, text, x, y, color = '#fff') {
  const w = text.length * 4 + 5;
  R(ctx, x, y, w, 9, UI.ink);
  R(ctx, x + 1, y + 1, w - 2, 7, color);
  R(ctx, x + 3, y + 9, 2, 2, UI.ink);
  drawText(ctx, text, x + 3, y + 2, UI.ink);
}

function phone(ctx, x, y, t) {
  R(ctx, x, y, 5, 8, UI.ink);
  R(ctx, x + 1, y + 1, 3, 5, Math.floor(t * 4) % 2 ? '#a0e8ff' : '#e0f8ff');
}

// Paleta de fondo por tipo
const BG = {
  friends: ['#3a2850', '#231a30'], coworkers: ['#3a3440', '#1c1a22'], staff: ['#402020', '#201010'], security: ['#303848', '#181c28'],
  partner: ['#503048', '#281828'], family: ['#3c4830', '#1c2418'], police: ['#283858', '#141c30'],
  couple: ['#584850', '#302830'], boss: ['#3a3440', '#1c1a22'],
};

export function drawGameOverArt(ctx, info, x, y, t) {
  const W = 144, H = 72;
  const [c1, c2] = BG[info.type] || BG.friends;
  R(ctx, x, y, W, H, c1);
  // suelo
  R(ctx, x, y + 46, W, 26, c2);
  for (let i = 0; i < W; i += 8) R(ctx, x + i, y + 46, 4, 1, c1);
  // marco
  ctx.strokeStyle = UI.light; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);

  if (!puddleImg) puddleImg = makePuddle(0.4242);
  const px = x + 22, py = y + 26;
  // Pipi (x2), con cara verde y charco delante
  ctx.drawImage(puddleImg, px + 26, py + 22, 30, 14);
  const shake = Math.round(Math.sin(t * 20) * 0.6);
  drawCharacter(ctx, pipiSpec(1, true), 'right', 0, px + shake, py, 2);
  // gotas de sudor
  if (Math.floor(t * 2) % 2) { R(ctx, px + 4, py + 6, 2, 3, '#a0e8ff'); R(ctx, px + 2, py + 10, 1, 2, '#a0e8ff'); }

  const cs = info.catcherSpec;
  const cx = x + 96, cy = y + 24;
  switch (info.type) {
    case 'coworkers':
    case 'friends': {
      // Todos los que había en pantalla se ríen (amigos x2 delante, el resto detrás)
      const crowd = info.onScreen || [];
      const backs = crowd.filter((c) => !c.friend).slice(0, 7);
      const fronts = crowd.filter((c) => c.friend).slice(0, 3);
      backs.forEach((c, i) => {
        const bx = x + 58 + i * 12, by = y + 18 + (i % 2) * 3 + (Math.floor(t * 6 + i) % 2 ? -1 : 0);
        drawCharacter(ctx, c.spec, 'left', 0, bx, by);
        if (Math.floor(t * 3 + i) % 3 === 0) drawText(ctx, 'JA', bx + 2, by - 7, UI.yellow, 1, UI.ink);
      });
      const all = [...fronts, { spec: cs, friend: true }];
      const n = all.length;
      all.forEach((c, i) => {
        const bob = Math.floor(t * 8 + i * 1.7) % 2 ? -2 : 0;
        const fx = x + 144 - 34 - (n - 1 - i) * 20, fy = y + 26 + bob + (i % 2) * 2;
        drawCharacter(ctx, c.spec, 'left', i % 2 ? 1 : 0, fx, fy, 2);
        phone(ctx, fx + 2, fy + 18, t + i * 0.3);
        // boca abierta de la risa
        R(ctx, fx + 8, fy + 16, 4, 2, UI.ink);
      });
      if (Math.floor(t * 2) % 2) R(ctx, x + W - 26, y + 5, 4, 4, UI.red);
      drawText(ctx, 'REC', x + W - 20, y + 5, UI.light);
      bubble(ctx, Math.floor(t * 3) % 2 ? '¡JAJAJAJA!' : '¡JOJOJOJO!', x + 52, y + 4);
      break;
    }
    case 'staff':
    case 'security': {
      // puerta de salida
      R(ctx, x + W - 18, y + 14, 16, 34, UI.ink);
      R(ctx, x + W - 16, y + 16, 12, 30, '#6a4a38');
      R(ctx, x + W - 18, y + 6, 16, 7, '#2a8a3a');
      drawText(ctx, 'EXIT', x + W - 17, y + 7, UI.light);
      drawCharacter(ctx, cs, 'left', 0, cx - 6, cy, 2);
      // brazo señalando
      R(ctx, cx - 14, cy + 16, 10, 3, cs.skin);
      R(ctx, cx - 14, cy + 16, 10, 1, UI.ink);
      bubble(ctx, info.type === 'security' ? '¡PULSERA FUERA!' : '¡FUERA DE AQUÍ!', x + 48, y + 5);
      // líneas de "vetado"
      R(ctx, x + 4, y + 4, 34, 11, UI.red);
      drawText(ctx, 'VETADO', x + 7, y + 7, UI.light);
      break;
    }
    case 'boss': {
      drawCharacter(ctx, cs, 'left', 0, cx, cy, 2);
      // carta de despido
      R(ctx, cx - 8, cy + 12, 14, 16, '#f4f4f4');
      for (let i = 0; i < 5; i++) R(ctx, cx - 6, cy + 15 + i * 2, 10, 1, '#8890a8');
      R(ctx, cx - 6, cy + 14, 10, 1, UI.red);
      bubble(ctx, '¡A MI DESPACHO!', x + 54, y + 5);
      break;
    }
    case 'police': {
      drawCharacter(ctx, cs, 'left', 0, cx, cy, 2);
      R(ctx, cx - 4, cy + 14, 10, 12, '#f4f4f4');
      for (let i = 0; i < 4; i++) R(ctx, cx - 3, cy + 16 + i * 2, 8, 1, '#8890a8');
      bubble(ctx, 'MULTA: 300 €', x + 64, y + 5);
      break;
    }
    case 'partner': {
      drawCharacter(ctx, cs, 'left', 0, cx, cy, 2);
      // corazón roto
      drawIcon(ctx, 'heart', cx + 8, cy - 14, 2);
      R(ctx, cx + 15, cy - 12, 2, 12, c1);
      // nube de lluvia sobre Pipi
      R(ctx, px + 2, y + 4, 28, 8, '#8890a8');
      R(ctx, px + 6, y + 2, 16, 4, '#a8b0c8');
      for (let i = 0; i < 5; i++) R(ctx, px + 4 + i * 6, y + 14 + ((Math.floor(t * 8) + i * 3) % 10), 1, 3, '#78b8f8');
      bubble(ctx, '...', cx - 4, cy - 26);
      break;
    }
    case 'family': {
      const other = (info.extraSpecs || [])[0];
      if (other) drawCharacter(ctx, other, 'left', 0, cx + 18, cy - 4, 2);
      drawCharacter(ctx, cs, 'left', 0, cx, cy, 2);
      // marcas de enfado
      const ax = cx + 20, ay = cy - 6;
      R(ctx, ax, ay, 5, 1, UI.red); R(ctx, ax + 2, ay - 2, 1, 5, UI.red);
      bubble(ctx, '¡HAY QUE VER!', x + 56, y + 4);
      break;
    }
    case 'couple': {
      const other = (info.extraSpecs || [])[0];
      if (other) drawCharacter(ctx, other, 'left', 0, cx + 18, cy - 2, 2);
      drawCharacter(ctx, cs, 'left', 0, cx, cy, 2);
      // tarta
      R(ctx, x + 60, y + 50, 18, 10, '#f8f0e0'); R(ctx, x + 63, y + 44, 12, 6, '#f8f0e0'); R(ctx, x + 67, y + 40, 4, 4, '#f070b0');
      R(ctx, x + 64, y + 46, 6, 3, '#8cb030');
      bubble(ctx, '¡EN MI BODA NO!', x + 50, y + 5);
      break;
    }
    default:
      drawCharacter(ctx, cs, 'left', 0, cx, cy, 2);
  }
  if (info.reason === 'breath') {
    // olor a pota
    for (let i = 0; i < 3; i++) {
      const sx = px + 34 + i * 6, sy = py + 8;
      for (let k = 0; k < 8; k++) R(ctx, sx + Math.round(Math.sin(t * 6 + k * 0.9 + i) * 1.5), sy - k, 1, 1, '#98c838');
    }
  }
  // Titular
  drawText(ctx, 'GAME OVER', x + 4, y + H - 8, UI.yellow, 1, UI.ink);
}
