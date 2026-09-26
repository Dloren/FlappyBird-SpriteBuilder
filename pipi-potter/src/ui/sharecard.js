// Genera la imagen PNG para compartir (con el marco de la consola)
import { makeCanvas, UI } from '../engine/gfx.js';
import { drawText, drawTextCentered, wrapText } from '../engine/font.js';
import { drawGameOverArt } from '../assets/illustrations.js';
import { drawCharacter, pipiSpec, drawIcon } from '../assets/sprites.js';

const W = 176, H = 232, SCALE = 4;

function frame(g) {
  // carcasa
  g.fillStyle = '#6a4a8c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#7c5aa0'; g.fillRect(2, 2, W - 4, H - 4);
  g.fillStyle = '#583a78'; g.fillRect(2, H - 6, W - 4, 4);
  // bisel
  g.fillStyle = '#2a2236'; g.fillRect(6, 18, W - 12, 170);
  g.fillStyle = '#e03838'; g.fillRect(10, 24, 3, 3); // LED
  drawText(g, 'POWER', 8, 30, '#8a80a0');
  drawTextCentered(g, 'PIPI POTTER', W / 2, 7, UI.yellow, 1, '#301848');
  // rejilla de altavoz
  g.fillStyle = '#4a3068';
  for (let i = 0; i < 5; i++) g.fillRect(W - 40 + i * 6, H - 36, 2, 22);
  // pantalla
  g.fillStyle = UI.ink; g.fillRect(14, 22, W - 28, 160);
}

export function buildShareCard({ art, title, phrase, levelText, score, extra }) {
  const [c, g] = makeCanvas(W, H);
  frame(g);
  const sx = 16, sy = 26;
  if (art) drawGameOverArt(g, art, sx, sy, 0.25);
  else {
    // tarjeta de récord: Pipi con trofeo
    g.fillStyle = '#30243e'; g.fillRect(sx, sy, 144, 72);
    drawCharacter(g, pipiSpec(0.3), 'down', 0, sx + 56, sy + 16, 2);
    drawIcon(g, 'star', sx + 30, sy + 24, 2);
    drawIcon(g, 'star', sx + 100, sy + 24, 2);
    drawTextCentered(g, 'RÉCORD', sx + 72, sy + 6, UI.yellow);
  }
  let y = sy + 78;
  if (title) { drawTextCentered(g, title, W / 2, y, UI.yellow); y += 9; }
  for (const l of wrapText(phrase || '', 136)) { drawTextCentered(g, l, W / 2, y, UI.light); y += 7; }
  y += 4;
  drawTextCentered(g, levelText || '', W / 2, y, UI.cyan); y += 9;
  drawTextCentered(g, `PUNTOS: ${score}`, W / 2, y, UI.yellow, 2, '#301848'); y += 14;
  if (extra) drawTextCentered(g, extra, W / 2, y, UI.grey);
  drawTextCentered(g, '¿PUEDES POTAR MÁS DISCRETO?', W / 2, 176, UI.pink);
  // botones decorativos
  g.fillStyle = '#2a2236'; g.fillRect(20, 200, 22, 6); g.fillRect(28, 192, 6, 22);
  g.fillStyle = '#c02858'; g.beginPath(); g.arc(120, 206, 7, 0, 7); g.fill(); g.beginPath(); g.arc(138, 198, 7, 0, 7); g.fill();
  const [out, og] = makeCanvas(W * SCALE, H * SCALE);
  og.imageSmoothingEnabled = false;
  og.drawImage(c, 0, 0, W * SCALE, H * SCALE);
  return out;
}
