import { SCREEN_W, HUD_H, CONFIG } from '../config.js';
import { UI } from '../engine/gfx.js';
import { drawText, textWidth } from '../engine/font.js';
import { drawIcon } from '../assets/sprites.js';
import { fmtTime } from '../engine/util.js';

export function nauseaColor(n) {
  if (n < 0.5) return UI.green;
  if (n < 0.75) return UI.yellow;
  return UI.red;
}

export function drawHUD(ctx, g) {
  const p = g.player;
  ctx.fillStyle = UI.ink;
  ctx.fillRect(0, 0, SCREEN_W, HUD_H);
  ctx.fillStyle = UI.dark;
  ctx.fillRect(0, HUD_H - 1, SCREEN_W, 1);

  // Barra de náusea
  const bx = 2, by = 3, bw = 34, bh = 6;
  ctx.fillStyle = UI.light;
  ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
  ctx.fillStyle = UI.dark;
  ctx.fillRect(bx, by, bw, bh);
  const blink = p.nausea >= CONFIG.nausea.wobbleFrom && Math.floor(g.time * 6) % 2 === 0;
  ctx.fillStyle = blink ? UI.light : nauseaColor(p.nausea);
  ctx.fillRect(bx, by, Math.round(bw * p.nausea), bh);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(bx, by, Math.round(bw * p.nausea), 1);
  // marca del mínimo para potar
  ctx.fillStyle = UI.ink;
  ctx.fillRect(bx + Math.round(bw * CONFIG.puke.minNausea), by, 1, bh);
  if (p.nauseaPause > 0) { ctx.fillStyle = UI.cyan; ctx.fillRect(bx, by + bh - 1, bw, 1); }

  // Potas
  for (let i = 0; i < CONFIG.puke.pukesToWin; i++) drawIcon(ctx, i < g.stats.pukes ? 'puke' : 'pukeEmpty', 39 + i * 8, 2);

  // Tiempo
  drawText(ctx, fmtTime(g.stats.time), 65, 4, UI.light);

  // Puntuación
  const sc = String(g.displayScore());
  drawText(ctx, sc, 134 - textWidth(sc), 4, UI.yellow);

  // Objeto equipado (botón B)
  ctx.fillStyle = UI.dark;
  ctx.fillRect(137, 1, 22, 10);
  drawText(ctx, 'B', 138, 4, UI.grey);
  const eq = p.equipped;
  if (eq && p.inventory[eq] > 0) {
    drawIcon(ctx, eq, 142, 2);
    drawText(ctx, String(p.inventory[eq]), 151, 4, UI.light);
  } else drawText(ctx, '-', 146, 4, UI.grey);

  // Chicle activo
  if (p.chicleT > 0) {
    ctx.fillStyle = UI.pink;
    ctx.fillRect(2, 10, Math.round(34 * (p.chicleT / CONFIG.items.chicle.duration)), 1);
  }
}
