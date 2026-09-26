// ============================================================
//  Tiles 16x16 dibujados por código. Cada nivel define su paleta
//  y qué patrón usa cada carácter de suelo.
//  solid = bloquea el paso · tall = bloquea además la visión
// ============================================================
import { TILE } from '../config.js';
import { makeCanvas } from '../engine/gfx.js';

export const TILES = {
  '#': { solid: true, tall: true },   // muro
  '=': { solid: true },               // barra / mostrador
  'T': { solid: true },               // mesa
  'R': { solid: true },               // mesa redonda con mantel
  'D': { solid: true },               // cabina DJ / mesa de mezclas
  'S': { solid: true, tall: true },   // altavoz
  'P': { solid: true, tall: true },   // planta en maceta
  'B': { solid: true, tall: true },   // árbol
  'H': { solid: true, tall: true },   // seto
  't': { solid: true },               // váter
  'n': { solid: true },               // banco
  'C': { solid: true },               // sofá
  'G': { solid: true },               // barbacoa
  'Y': { solid: true },               // fuente
  '~': { solid: true, anim: true },   // agua (piscina)
  'F': { solid: true },               // valla (se ve a través)
  'M': { solid: true },               // hinchable
  'k': { solid: true },               // encimera de cocina
  'Q': { solid: true, tall: true },   // baño químico
  'L': { solid: true, tall: true },   // food truck
  'A': { solid: true, tall: true },   // atracción
  'O': { solid: true, tall: true },   // columna
  'U': { solid: true, tall: true },   // caseta con toldo
  'X': { solid: true, tall: true },   // cajas apiladas
  'K': { solid: true, tall: true },   // coche
  'I': { solid: true, tall: true },   // armario / nevera / estantería
  'Z': { solid: true, tall: true },   // cortina / telón
  'W': { solid: true, tall: true },   // pantalla de escenario / truss
  'c': { solid: true },               // parterre de flores
  'x': { solid: true },               // cajas bajas / nevera portátil
  'b': { solid: true },               // cama / tumbona
};
// Cualquier otro carácter es suelo transitable (su aspecto lo define el nivel)

function rnd(tx, ty, k = 0) {
  let h = (tx * 374761393 + ty * 668265263 + k * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function circle(g, cx, cy, r, c) {
  g.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
    g.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// ---------- SUELOS ----------
function drawFloor(g, x, y, tx, ty, spec) {
  const [kind, a, b, c2] = spec;
  switch (kind) {
    case 'checker': {
      R(g, x, y, 16, 16, a);
      R(g, x, y, 8, 8, b); R(g, x + 8, y + 8, 8, 8, b);
      break;
    }
    case 'tiles': {
      R(g, x, y, 16, 16, a);
      R(g, x, y, 16, 1, b); R(g, x, y, 1, 16, b);
      R(g, x + 8, y + 8, 8, 1, b); R(g, x + 8, y + 8, 1, 8, b);
      break;
    }
    case 'wood': {
      R(g, x, y, 16, 16, a);
      for (let i = 0; i < 4; i++) {
        R(g, x, y + i * 4 + 3, 16, 1, b);
        const off = Math.floor(rnd(tx, ty, i) * 12) + 2;
        R(g, x + off, y + i * 4, 1, 3, b);
      }
      break;
    }
    case 'grass': {
      R(g, x, y, 16, 16, a);
      for (let i = 0; i < 5; i++) {
        const px = Math.floor(rnd(tx, ty, i) * 14), py = Math.floor(rnd(tx, ty, i + 9) * 14);
        R(g, x + px, y + py, 1, 2, b); R(g, x + px + 1, y + py + 1, 1, 1, b);
      }
      if (c2 && rnd(tx, ty, 77) > 0.86) { const px = 3 + Math.floor(rnd(tx, ty, 5) * 10); R(g, x + px, y + 6, 2, 2, c2); }
      break;
    }
    case 'dots': {
      R(g, x, y, 16, 16, a);
      R(g, x + 3, y + 3, 1, 1, b); R(g, x + 11, y + 7, 1, 1, b); R(g, x + 6, y + 12, 1, 1, b);
      break;
    }
    case 'stone': {
      R(g, x, y, 16, 16, a);
      const o = (ty % 2) * 4;
      R(g, x, y + 7, 16, 1, b); R(g, x, y + 15, 16, 1, b);
      R(g, x + ((3 + o) % 16), y, 1, 7, b); R(g, x + ((11 + o) % 16), y, 1, 7, b);
      R(g, x + ((7 + o) % 16), y + 8, 1, 7, b); R(g, x + ((15 + o) % 16), y + 8, 1, 7, b);
      break;
    }
    case 'dirt': {
      R(g, x, y, 16, 16, a);
      for (let i = 0; i < 6; i++) R(g, x + Math.floor(rnd(tx, ty, i) * 15), y + Math.floor(rnd(tx, ty, i + 3) * 15), 1, 1, b);
      break;
    }
    case 'carpet': {
      R(g, x, y, 16, 16, a);
      R(g, x + 1, y + 1, 14, 14, b);
      R(g, x + 3, y + 3, 10, 10, a);
      R(g, x + 7, y + 7, 2, 2, c2 || b);
      break;
    }
    case 'stage': {
      R(g, x, y, 16, 16, a);
      R(g, x, y + 7, 16, 1, b); R(g, x, y + 15, 16, 1, b);
      R(g, x + ((tx % 2) ? 5 : 11), y, 1, 7, b); R(g, x + ((tx % 2) ? 11 : 3), y + 8, 1, 7, b);
      break;
    }
    case 'veg': {
      R(g, x, y, 16, 16, a);
      for (let r = 0; r < 2; r++) {
        R(g, x, y + 3 + r * 8, 16, 3, b);
        for (let i = 0; i < 4; i++) { R(g, x + 1 + i * 4, y + 1 + r * 8, 2, 2, c2); R(g, x + 2 + i * 4, y + r * 8, 1, 1, c2); }
      }
      break;
    }
    case 'mat': {
      R(g, x, y, 16, 16, a);
      R(g, x + 2, y + 2, 12, 12, b);
      break;
    }
    case 'road': {
      R(g, x, y, 16, 16, a);
      if (rnd(tx, ty, 3) > 0.6) R(g, x + 4, y + 9, 2, 1, b);
      if (tx % 3 === 0) R(g, x + 6, y + 7, 4, 1, c2 || b);
      break;
    }
    case 'disco':
    case 'water':
    default:
      R(g, x, y, 16, 16, a || '#000');
  }
}

// ---------- PROPS ----------
function drawProp(g, ch, x, y, tx, ty, P, map) {
  const same = (dx, dy) => map.charAt(tx + dx, ty + dy) === ch;
  const N = same(0, -1), S = same(0, 1), W = same(-1, 0), E = same(1, 0);
  const ink = P.ink;
  switch (ch) {
    case '#': {
      const below = map.charAt(tx, ty + 1);
      if (below !== '#' && below !== null) {
        // cara frontal del muro
        R(g, x, y, 16, 16, P.wallFace);
        R(g, x, y, 16, 3, P.wallTop);
        R(g, x, y + 3, 16, 1, ink);
        for (let r = 0; r < 3; r++) {
          R(g, x, y + 7 + r * 4, 16, 1, P.wallLine);
          R(g, x + ((r % 2) ? 4 : 11), y + 4 + r * 4, 1, 3, P.wallLine);
        }
        R(g, x, y + 15, 16, 1, ink);
      } else {
        R(g, x, y, 16, 16, P.wallTop);
        if (!W) R(g, x, y, 1, 16, ink);
        if (!E) R(g, x + 15, y, 1, 16, ink);
        if (map.charAt(tx, ty - 1) !== '#') R(g, x, y, 16, 1, ink);
        if (rnd(tx, ty) > 0.7) R(g, x + 5, y + 6, 2, 1, P.wallLine);
      }
      break;
    }
    case '=': {
      // barra: tablero claro + frontal oscuro, con botellas/vasos
      const top = N ? 0 : 1;
      R(g, x, y + top, 16, 16 - top, P.woodDark);
      R(g, x + (W ? 0 : 1), y + top, 16 - (W ? 0 : 1) - (E ? 0 : 1), 10, P.wood);
      R(g, x + (W ? 0 : 1), y + top + 1, 16 - (W ? 0 : 1) - (E ? 0 : 1), 1, P.woodLight);
      if (!S) { R(g, x, y + 11, 16, 5, P.woodDark); R(g, x + 4, y + 12, 1, 3, ink); R(g, x + 11, y + 12, 1, 3, ink); }
      if (!N) R(g, x, y, 16, 1, ink);
      if (!W) R(g, x, y, 1, 16, ink);
      if (!E) R(g, x + 15, y, 1, 16, ink);
      if (!S) R(g, x, y + 15, 16, 1, ink);
      const k = rnd(tx, ty);
      if (k > 0.45) { R(g, x + 3, y + 4, 2, 4, P.accent); R(g, x + 3, y + 3, 2, 1, ink); }
      if (k > 0.7) { R(g, x + 9, y + 5, 3, 3, P.glass || '#c8f0f8'); }
      break;
    }
    case 'T': {
      R(g, x + 1, y + 2, 14, 11, ink);
      R(g, x + 2, y + 3, 12, 9, P.wood);
      R(g, x + 2, y + 3, 12, 1, P.woodLight);
      R(g, x + 3, y + 13, 2, 2, ink); R(g, x + 11, y + 13, 2, 2, ink);
      if (rnd(tx, ty) > 0.4) { R(g, x + 5, y + 5, 3, 3, P.glass || '#c8f0f8'); R(g, x + 9, y + 7, 2, 3, P.accent); }
      break;
    }
    case 'R': {
      circle(g, x + 8, y + 8, 7, ink);
      circle(g, x + 8, y + 8, 6, P.cloth);
      R(g, x + 3, y + 11, 10, 2, P.clothShade);
      circle(g, x + 8, y + 7, 2, P.clothShade);
      R(g, x + 7, y + 6, 2, 2, '#ffffff');
      R(g, x + 4, y + 5, 2, 2, P.glass || '#c8f0f8'); R(g, x + 11, y + 8, 2, 2, P.accent);
      break;
    }
    case 'D': {
      R(g, x, y + 1, 16, 14, ink);
      R(g, x + (W ? 0 : 1), y + 2, 16 - (W ? 0 : 1) - (E ? 0 : 1), 9, P.metal);
      R(g, x, y + 11, 16, 3, P.metalDark);
      circle(g, x + 5, y + 6, 3, ink); R(g, x + 5, y + 6, 1, 1, P.metal);
      R(g, x + 10, y + 4, 4, 1, P.accent); R(g, x + 10, y + 6, 4, 1, P.accent2); R(g, x + 10, y + 8, 4, 1, P.accent);
      break;
    }
    case 'S': {
      R(g, x + 1, y, 14, 16, ink);
      R(g, x + 2, y + 1, 12, 14, P.metalDark);
      circle(g, x + 8, y + 5, 3, ink); R(g, x + 7, y + 4, 2, 2, P.metal);
      circle(g, x + 8, y + 11, 3, ink); R(g, x + 7, y + 10, 2, 2, P.metal);
      break;
    }
    case 'P': {
      R(g, x + 4, y + 10, 8, 6, ink); R(g, x + 5, y + 10, 6, 5, P.pot || '#b86030');
      circle(g, x + 8, y + 6, 6, ink);
      circle(g, x + 8, y + 6, 5, P.leaf);
      R(g, x + 5, y + 3, 2, 2, P.leafLight || P.leaf); R(g, x + 9, y + 7, 3, 2, P.leafDark); R(g, x + 4, y + 8, 2, 2, P.leafDark);
      break;
    }
    case 'B': {
      circle(g, x + 8, y + 8, 8, ink);
      circle(g, x + 8, y + 8, 7, P.leafDark);
      circle(g, x + 7, y + 7, 5, P.leaf);
      R(g, x + 4, y + 4, 3, 2, P.leafLight || P.leaf); R(g, x + 9, y + 5, 2, 2, P.leafLight || P.leaf);
      break;
    }
    case 'H': {
      R(g, x, y, 16, 16, P.leafDark);
      for (let i = 0; i < 6; i++) circle(g, x + 3 + Math.floor(rnd(tx, ty, i) * 10), y + 3 + Math.floor(rnd(tx, ty, i + 4) * 9), 2, P.leaf);
      if (!N) R(g, x, y, 16, 1, ink);
      if (!S) R(g, x, y + 15, 16, 1, ink);
      if (!W) R(g, x, y, 1, 16, ink);
      if (!E) R(g, x + 15, y, 1, 16, ink);
      break;
    }
    case 't': {
      R(g, x + 3, y + 1, 10, 5, ink); R(g, x + 4, y + 2, 8, 3, '#e8e8f0');
      circle(g, x + 8, y + 10, 5, ink); circle(g, x + 8, y + 10, 4, '#f4f4f8'); circle(g, x + 8, y + 10, 2, '#a8d8e8');
      break;
    }
    case 'n': {
      R(g, x, y + 4, 16, 9, ink);
      for (let i = 0; i < 3; i++) R(g, x + (W ? 0 : 1), y + 5 + i * 3, 16 - (W ? 0 : 1) - (E ? 0 : 1), 2, P.wood);
      break;
    }
    case 'C': {
      R(g, x, y + 2, 16, 13, ink);
      R(g, x + (W ? 0 : 1), y + 3, 16 - (W ? 0 : 1) - (E ? 0 : 1), 11, P.sofa || P.accent2);
      R(g, x + (W ? 0 : 1), y + 3, 16 - (W ? 0 : 1) - (E ? 0 : 1), 4, P.sofaDark || P.woodDark);
      R(g, x + 7, y + 8, 1, 6, P.sofaDark || P.woodDark);
      break;
    }
    case 'G': {
      R(g, x + 1, y + 2, 14, 12, ink);
      R(g, x + 2, y + 3, 12, 10, P.metalDark);
      for (let i = 0; i < 5; i++) R(g, x + 3, y + 4 + i * 2, 10, 1, P.metal);
      R(g, x + 4, y + 7, 2, 1, '#f08830'); R(g, x + 9, y + 9, 2, 1, '#f8c838'); R(g, x + 7, y + 5, 2, 1, '#e03838');
      break;
    }
    case 'Y': {
      circle(g, x + 8, y + 8, 7, ink); circle(g, x + 8, y + 8, 6, P.stone || '#b8b0a0');
      circle(g, x + 8, y + 8, 4, P.water); R(g, x + 7, y + 5, 2, 6, P.stone || '#b8b0a0'); R(g, x + 7, y + 4, 2, 1, P.waterLight);
      break;
    }
    case 'F': {
      R(g, x, y + 5, 16, 1, ink); R(g, x, y + 6, 16, 1, P.fence || P.metal);
      R(g, x, y + 11, 16, 1, ink); R(g, x, y + 12, 16, 1, P.fence || P.metal);
      R(g, x + 2, y + 2, 2, 13, ink); R(g, x + 12, y + 2, 2, 13, ink);
      R(g, x + 2, y + 2, 1, 12, P.fence || P.metal); R(g, x + 12, y + 2, 1, 12, P.fence || P.metal);
      break;
    }
    case 'M': {
      R(g, x, y, 16, 16, P.water);
      if (!N) R(g, x, y, 16, 3, '#f06080');
      if (!S) R(g, x, y + 13, 16, 3, '#f8c838');
      if (!W) R(g, x, y, 3, 16, '#58c0f0');
      if (!E) R(g, x + 13, y, 3, 16, '#f06080');
      R(g, x + 5, y + 6, 3, 1, P.waterLight);
      break;
    }
    case 'k': {
      R(g, x, y, 16, 16, ink);
      R(g, x + (W ? 0 : 1), y + 1, 16 - (W ? 0 : 1) - (E ? 0 : 1), 11, P.counter || '#d8d0c0');
      R(g, x, y + 12, 16, 4, P.woodDark);
      const k = rnd(tx, ty);
      if (k > 0.66) { circle(g, x + 5, y + 6, 3, ink); circle(g, x + 11, y + 6, 3, ink); }
      else if (k > 0.33) { R(g, x + 3, y + 3, 10, 7, '#9098a8'); R(g, x + 4, y + 4, 8, 5, '#a8d8e8'); }
      break;
    }
    case 'Q': {
      R(g, x + 1, y, 14, 16, ink);
      R(g, x + 2, y + 1, 12, 14, P.toilet || '#3870c8');
      R(g, x + 2, y + 1, 12, 3, P.toiletTop || '#78a8e8');
      R(g, x + 4, y + 6, 8, 9, P.toiletDark || '#284c90');
      R(g, x + 10, y + 10, 1, 2, '#f8c838');
      break;
    }
    case 'L': {
      R(g, x, y, 16, 16, ink);
      R(g, x + (W ? 0 : 1), y + (N ? 0 : 1), 16 - (W ? 0 : 1) - (E ? 0 : 1), 16 - (N ? 0 : 1), P.truck || '#e8e0c8');
      if (!S) { R(g, x, y + 9, 16, 3, P.accent); for (let i = 0; i < 16; i += 4) R(g, x + i, y + 12, 2, 2, P.accent); R(g, x + 2, y + 4, 12, 4, '#303848'); }
      if (!N) R(g, x + 2, y + 2, 12, 1, P.accent2);
      break;
    }
    case 'A': {
      R(g, x, y, 16, 16, ink);
      const stripe = (tx + ty) % 2 ? P.accent : P.accent2;
      R(g, x + (W ? 0 : 1), y + (N ? 0 : 1), 16 - (W ? 0 : 1) - (E ? 0 : 1), 16 - (N ? 0 : 1) - (S ? 0 : 1), stripe);
      for (let i = 0; i < 16; i += 4) R(g, x + i, y + ((tx + ty) % 2 ? 0 : 8), 2, 8, '#f8f0e0');
      if (!S) { for (let i = 1; i < 16; i += 5) R(g, x + i, y + 13, 3, 3, '#f8c838'); }
      break;
    }
    case 'O': {
      R(g, x + 3, y + 12, 11, 3, P.shadow || ink);
      circle(g, x + 8, y + 7, 6, ink);
      circle(g, x + 8, y + 7, 5, P.stone || '#c8b898');
      R(g, x + 5, y + 4, 3, 2, P.stoneLight || '#e8dcc0');
      break;
    }
    case 'U': {
      R(g, x, y, 16, 16, ink);
      for (let i = 0; i < 16; i += 4) R(g, x + i, y + (N ? 0 : 1), 2, 15, P.accent), R(g, x + i + 2, y + (N ? 0 : 1), 2, 15, '#f8f0e0');
      if (!S) { for (let i = 0; i < 16; i += 4) { R(g, x + i, y + 12, 2, 3, P.accent); R(g, x + i + 2, y + 12, 2, 2, '#f8f0e0'); } R(g, x, y + 11, 16, 1, ink); }
      break;
    }
    case 'X': {
      R(g, x, y, 16, 16, ink);
      R(g, x + 1, y + 1, 6, 6, P.wood); R(g, x + 9, y + 1, 6, 6, P.woodLight); R(g, x + 1, y + 9, 6, 6, P.woodLight); R(g, x + 9, y + 9, 6, 6, P.wood);
      R(g, x + 3, y + 3, 2, 2, P.woodDark); R(g, x + 11, y + 11, 2, 2, P.woodDark);
      break;
    }
    case 'K': {
      R(g, x, y, 16, 16, P.car || '#d83838');
      if (!N) { R(g, x, y, 16, 2, ink); R(g, x + 2, y + 2, 12, 2, '#f8f0c0'); }
      if (!S) { R(g, x, y + 14, 16, 2, ink); R(g, x + 2, y + 12, 3, 2, '#e03030'); R(g, x + 11, y + 12, 3, 2, '#e03030'); }
      if (!W) R(g, x, y, 2, 16, ink);
      if (!E) R(g, x + 14, y, 2, 16, ink);
      if (N && S) R(g, x + (W ? 0 : 3), y + 3, 16 - (W ? 0 : 3) - (E ? 0 : 3), 10, '#303848');
      break;
    }
    case 'I': {
      R(g, x, y, 16, 16, ink);
      R(g, x + 1, y + 1, 14, 14, P.shelf || '#c8c0b0');
      R(g, x + 1, y + 5, 14, 1, ink); R(g, x + 1, y + 10, 14, 1, ink);
      R(g, x + 3, y + 2, 2, 3, P.accent); R(g, x + 8, y + 7, 3, 3, P.accent2); R(g, x + 11, y + 2, 2, 3, P.leaf || '#58c048');
      break;
    }
    case 'Z': {
      R(g, x, y, 16, 16, P.curtain || '#801838');
      for (let i = 1; i < 16; i += 4) R(g, x + i, y, 1, 16, P.curtainDark || '#501028');
      if (!S) R(g, x, y + 14, 16, 2, '#f8c838');
      break;
    }
    case 'W': {
      R(g, x, y, 16, 16, ink);
      R(g, x + 1, y + 1, 14, 14, P.screen || '#282040');
      R(g, x + 3, y + 3, 2, 2, P.accent); R(g, x + 11, y + 3, 2, 2, P.accent2);
      break;
    }
    case 'c': {
      R(g, x, y + 2, 16, 12, ink);
      R(g, x + (W ? 0 : 1), y + 3, 16 - (W ? 0 : 1) - (E ? 0 : 1), 10, P.leafDark);
      for (let i = 0; i < 4; i++) R(g, x + 2 + Math.floor(rnd(tx, ty, i) * 11), y + 4 + Math.floor(rnd(tx, ty, i + 5) * 7), 2, 2, i % 2 ? '#f070b0' : '#f8c838');
      break;
    }
    case 'x': {
      R(g, x + 2, y + 3, 12, 11, ink);
      R(g, x + 3, y + 4, 10, 9, P.cooler || '#3890d8');
      R(g, x + 3, y + 4, 10, 3, '#f4f4f4');
      break;
    }
    case 'b': {
      R(g, x + 1, y, 14, 16, ink);
      R(g, x + 2, y + 1, 12, 14, P.cloth || '#f4f4f4');
      if (!N) R(g, x + 3, y + 2, 10, 4, '#ffffff');
      for (let i = 4; i < 16; i += 3) R(g, x + 2, y + i, 12, 1, P.clothShade || '#d8d8e0');
      break;
    }
    default:
      break;
  }
}

// Renderiza el mapa estático en un canvas grande
export function renderMap(level) {
  const { w, h, pal } = level;
  const [c, g] = makeCanvas(w * TILE, h * TILE);
  const baseFloor = level.floors['.'];
  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = level.charAt(tx, ty);
      const x = tx * TILE, y = ty * TILE;
      if (TILES[ch]) {
        const under = level.floorUnder?.[ch] || '.';
        drawFloor(g, x, y, tx, ty, level.floors[under] || baseFloor);
        drawProp(g, ch, x, y, tx, ty, pal, level);
      } else {
        drawFloor(g, x, y, tx, ty, level.floors[ch] || baseFloor);
      }
    }
  }
  return c;
}

// Tiles animados (pista de baile, agua) se dibujan cada frame
export function drawAnimatedTile(ctx, level, ch, tx, ty, sx, sy, time) {
  const spec = TILES[ch] ? null : level.floors[ch];
  if (spec && spec[0] === 'disco') {
    const cols = spec.slice(1);
    const k = Math.floor(time * 2.5 + (tx * 3 + ty * 5) * 0.37 + Math.sin(tx * 0.9 + time) * 1.5);
    const col = cols[((k % cols.length) + cols.length) % cols.length];
    ctx.fillStyle = '#100818';
    ctx.fillRect(sx, sy, 16, 16);
    ctx.fillStyle = col;
    ctx.fillRect(sx + 1, sy + 1, 14, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(sx + 2, sy + 2, 4, 1);
    return;
  }
  if (ch === '~') {
    const P = level.pal;
    ctx.fillStyle = P.water;
    ctx.fillRect(sx, sy, 16, 16);
    ctx.fillStyle = P.waterLight;
    const o = Math.floor(time * 4 + tx * 3 + ty * 2) % 16;
    ctx.fillRect(sx + o, sy + 4, 4, 1);
    ctx.fillRect(sx + ((o + 8) % 16), sy + 11, 4, 1);
    const up = level.charAt(tx, ty - 1);
    if (up !== '~') { ctx.fillStyle = P.stone || '#d8d0c0'; ctx.fillRect(sx, sy, 16, 3); }
  }
}

export function isAnimated(level, ch) {
  if (ch === '~') return true;
  const spec = level.floors[ch];
  return !!(spec && spec[0] === 'disco');
}
