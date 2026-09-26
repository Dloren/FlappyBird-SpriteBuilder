import { drawText, drawTextCentered, wrapText, textWidth, LINE_H } from './font.js';

export const UI = {
  ink: '#140c1c', dark: '#30243e', mid: '#6a5a86', light: '#f4ecd6', paper: '#e8dcb8',
  yellow: '#f8c838', orange: '#f08830', red: '#e03838', green: '#58c048', blue: '#4878d8',
  pink: '#f070b0', cyan: '#58d0e0', grey: '#9890a8',
};

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return [c, g];
}

// Recuadro de diálogo estilo portátil: fondo oscuro, doble borde claro, esquinas romas
export function panel(ctx, x, y, w, h, bg = UI.ink, border = UI.light) {
  ctx.fillStyle = border;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = bg;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = border;
  ctx.fillRect(x + 2, y + 2, w - 4, 1);
  ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
  ctx.fillRect(x + 2, y + 2, 1, h - 4);
  ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
  ctx.fillStyle = bg;
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
}

export function textBlock(ctx, text, x, y, maxW, color = UI.light, lineH = LINE_H) {
  const lines = wrapText(text, maxW);
  lines.forEach((l, i) => drawText(ctx, l, x, y + i * lineH, color));
  return lines.length * lineH;
}

// Patrón de tramado (checker) para transparencias estilo 8 bits
const patCache = new Map();
export function ditherPattern(ctx, color, density = 2) {
  const key = color + density;
  if (patCache.has(key)) return patCache.get(key);
  const [c, g] = makeCanvas(2, 2);
  g.fillStyle = color;
  g.fillRect(0, 0, 1, 1);
  if (density >= 2) g.fillRect(1, 1, 1, 1);
  if (density >= 3) g.fillRect(1, 0, 1, 1);
  const p = ctx.createPattern(c, 'repeat');
  patCache.set(key, p);
  return p;
}

// Flecha/cursor de menú (triángulo 3x5)
export function cursor(ctx, x, y, color = UI.yellow) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 5);
  ctx.fillRect(x + 1, y + 1, 1, 3);
  ctx.fillRect(x + 2, y + 2, 1, 1);
}

// Botón de pantalla táctil dibujado dentro del juego
export function button(ctx, label, x, y, w, selected) {
  const h = 11;
  const bc = selected ? UI.yellow : UI.grey;
  ctx.fillStyle = bc;
  ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = selected ? UI.dark : UI.ink;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  drawTextCentered(ctx, label, x + w / 2, y + 3, selected ? UI.yellow : UI.light);
  return { x, y, w, h };
}

export { drawText, drawTextCentered, wrapText, textWidth, LINE_H };
