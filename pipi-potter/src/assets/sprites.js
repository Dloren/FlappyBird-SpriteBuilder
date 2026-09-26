// ============================================================
//  Generador de sprites de personajes (16x16, vista cenital)
//  Todo el pixel art es original y se define como texto.
//  Letras de plantilla:
//   o contorno  h pelo  s piel  e ojo  b barba  m bigote
//   t camiseta  p pantalón  k zapato  c gorra  a acento (bolso/pajarita)
// ============================================================
import { makeCanvas } from '../engine/gfx.js';

// ---------- CABEZAS (filas 0..8) ----------
const HEADS = {
  short: {
    down: [
      '................',
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhsssssshho..',
      '..ohsessssesho..',
      '..obssmmmmssbo..',
      '...obbbbbbbbo...',
    ],
    up: [
      '................',
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..oshhhhhhhhso..',
      '...osshhhhsso...',
    ],
    right: [
      '................',
      '.....oooooo.....',
      '....ohhhhhhoo...',
      '...ohhhhhhhhho..',
      '...ohhhhhhhhhho.',
      '...ohhhhhhssso..',
      '...ohhhshsseso..',
      '...ohhbbssmmsso.',
      '....obbbbbbbbo..',
    ],
  },
  long: {
    down: [
      '................',
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhsssssshho..',
      '..ohsessssesho..',
      '..ohssmmmmssho..',
      '..ohhobbbbohho..',
    ],
    up: [
      '................',
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
    ],
    right: [
      '................',
      '.....oooooo.....',
      '....ohhhhhhoo...',
      '...ohhhhhhhhho..',
      '...ohhhhhhhhhho.',
      '...ohhhhhhssso..',
      '...ohhhhhhsesso.',
      '...ohhhhbssmmso.',
      '...ohhhhobbbbo..',
    ],
  },
  bun: {
    down: [
      '......oooo......',
      '.....ohhhho.....',
      '...oooohhoooo...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohsssssssssho.',
      '..ohsessssesho..',
      '..obssmmmmssbo..',
      '...obbbbbbbbo...',
    ],
    up: [
      '......oooo......',
      '.....ohhhho.....',
      '...oooohhoooo...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..oshhhhhhhhso..',
      '...osshhhhsso...',
    ],
    right: [
      '..oooo..........',
      '.ohhhhoooooo....',
      '..oohhhhhhhhoo..',
      '...ohhhhhhhhho..',
      '...ohhhhhhhhhho.',
      '...ohhhhhhssso..',
      '...ohhhshsseso..',
      '...ohhbbssmmsso.',
      '....obbbbbbbbo..',
    ],
  },
  cap: {
    down: [
      '................',
      '....oooooooo....',
      '...occcccccco...',
      '..occcccccccco..',
      '..occcccccccco..',
      '.oooooooooooooo.',
      '..ohsessssesho..',
      '..obssmmmmssbo..',
      '...obbbbbbbbo...',
    ],
    up: [
      '................',
      '....oooooooo....',
      '...occcccccco...',
      '..occcccccccco..',
      '..occcccccccco..',
      '..occcccccccco..',
      '..ohhhhhhhhhho..',
      '..oshhhhhhhhso..',
      '...osshhhhsso...',
    ],
    right: [
      '................',
      '.....oooooo.....',
      '....occcccco....',
      '...occcccccco...',
      '...occcccccccooo',
      '...ohhhhhhssso..',
      '...ohhhshsseso..',
      '...ohhbbssmmsso.',
      '....obbbbbbbbo..',
    ],
  },
};
// Calvo = pelo corto con la coronilla de piel
HEADS.bald = {
  down: HEADS.short.down.map((r, i) => (i >= 2 && i <= 4 ? r.replace(/h/g, 's') : r)),
  up: HEADS.short.up.map((r, i) => (i >= 2 && i <= 5 ? r.replace(/h/g, 's') : r)),
  right: HEADS.short.right.map((r, i) => (i >= 2 && i <= 4 ? r.replace(/h/g, 's') : r)),
};

// ---------- CUERPOS (filas 9..15) ----------
const BODIES = {
  belly: {
    down: [
      '....oottttoo....',
      '...otttttttto...',
      '..osttttttttso..',
      '..osttttttttso..',
      '..otttttttttto..',
      '...oppppppppo...',
    ],
    right: [
      '.....otttto.....',
      '....otttttto....',
      '....ottssttto...',
      '....ottsstttto..',
      '....otttttttto..',
      '.....oppppppo...',
    ],
  },
  normal: {
    down: [
      '....oottttoo....',
      '...otttttttto...',
      '..osttttttttso..',
      '..osttttttttso..',
      '...otttttttto...',
      '...oppppppppo...',
    ],
    right: [
      '.....otttto.....',
      '....otttttto....',
      '....ottsstto....',
      '....ottsstto....',
      '....otttttto....',
      '.....oppppo.....',
    ],
  },
  dress: {
    down: [
      '....oottttoo....',
      '...otttttttto...',
      '..osttttttttso..',
      '..osttttttttso..',
      '..otttttttttto..',
      '..otttttttttto..',
    ],
    right: [
      '.....otttto.....',
      '....otttttto....',
      '....ottsstto....',
      '....ottssttto...',
      '...otttttttto...',
      '...otttttttto...',
    ],
  },
};
// Última fila (pies) por dirección y fase de paso
const FEET = {
  down: ['...okko..okko...', '...okko...oo....', '....oo...okko...'],
  right: ['.....okkokko....', '....okko..oko...', '......okkoo.....'],
  dressDown: ['....oko..oko....', '....oko...o.....', '.....o...oko....'],
  dressRight: ['.....okkoko.....', '....oko...ko....', '......okko......'],
};

function fixRow(r) {
  // Normaliza (algún carácter no ASCII accidental) y fuerza 16 columnas
  r = r.replace(/[^\x20-\x7e]/g, 'o');
  if (r.length > 16) r = r.slice(0, 16);
  return r.padEnd(16, '.');
}

function composeRows(style, body, dir, step) {
  const d = dir === 'left' ? 'right' : dir;
  const head = (HEADS[style] || HEADS.short)[d === 'up' ? 'up' : d];
  const b = BODIES[body] || BODIES.normal;
  const bRows = d === 'right' ? b.right : b.down;
  let feet;
  if (body === 'dress') feet = (d === 'right' ? FEET.dressRight : FEET.dressDown)[step];
  else feet = (d === 'right' ? FEET.right : FEET.down)[step];
  const rows = [...head, ...bRows, feet].map(fixRow);
  // Pelo largo cae sobre los hombros
  if (style === 'long') {
    if (d === 'down') { rows[9] = setAt(rows[9], [3, 12], 'h'); rows[10] = setAt(rows[10], [2, 13], 'h'); }
    if (d === 'up') { rows[9] = '...ohhhhhhhho...'; rows[10] = '..oohhhhhhhhoo..'; }
    if (d === 'right') { rows[9] = setAt(rows[9], [4], 'h'); rows[10] = setAt(rows[10], [4], 'h'); }
  }
  return rows;
}
function setAt(row, cols, ch) {
  const a = row.split('');
  cols.forEach((c) => { a[c] = ch; });
  return a.join('');
}

// Paleta de un personaje (4 colores + opcionales)
function colorFor(ch, spec) {
  switch (ch) {
    case 'o': case 'e': return spec.outline;
    case 'k': return spec.shoes || spec.outline;
    case 'h': return spec.hair;
    case 's': return spec.skin;
    case 'b': return spec.beard ? spec.hair : spec.skin;
    case 'm': return spec.beard || spec.mustache ? spec.hair : spec.skin;
    case 't': return spec.shirt;
    case 'p': return spec.pants || spec.outline;
    case 'c': return spec.cap || spec.shirt;
    case 'a': return spec.accent || spec.shirt;
    default: return null;
  }
}

function paintRows(g, rows, spec, ox, oy, mirror) {
  for (let y = 0; y < rows.length; y++) {
    const r = rows[y];
    for (let x = 0; x < 16; x++) {
      const c = colorFor(r[x], spec);
      if (!c) continue;
      g.fillStyle = c;
      g.fillRect(ox + (mirror ? 15 - x : x), oy + y, 1, 1);
    }
  }
}

// Hoja de sprites: filas = dirección (down, up, left, right); columnas = stand, stepA, stepB
export const DIRS = ['down', 'up', 'left', 'right'];
const sheetCache = new Map();

// Perro (NPC-B de la barbacoa)
const DOG = {
  down: [
    '................', '................', '................', '................',
    '.....o....o.....', '....ofo..ofo....', '....offffffo....', '....ofefffefo...',
    '....offfnnffo...', '.....offffoo....', '....offssffo....', '....offssffo....',
    '....offffffo....', '....off..ffo....', '....oo....oo....', '................',
  ],
  up: [
    '................', '................', '................', '................',
    '.....o....o.....', '....ofo..ofo....', '....offffffo....', '....offffffo....',
    '....offffffo....', '.....offffo.....', '....offffffo....', '....offssffo....',
    '....offffffo....', '....off..ffo....', '....oo.oo.oo....', '.......oo.......',
  ],
  right: [
    '................', '................', '................', '................',
    '..........oo....', '.........ofo....', '..o......offfo..', '.ofo....offeffoo',
    '..offooofffffnno', '...offffffffoo..', '...offssssffo...', '...offssssffo...',
    '...offo..offo...', '...oo.....oo....', '................', '................',
  ],
};
const DOG_STEP = {
  right: ['...offo..offo...', '..offo....offo..', '....offooffo....'],
  down: ['....off..ffo....', '....off...fo....', '....of...ffo....'],
};
function dogSheet(spec) {
  const [c, g] = makeCanvas(48, 64);
  const col = { o: spec.outline, f: spec.fur, s: spec.spot || spec.fur, e: spec.outline, n: '#302020' };
  DIRS.forEach((dir, di) => {
    for (let st = 0; st < 3; st++) {
      const d = dir === 'left' ? 'right' : dir;
      const rows = DOG[d].slice();
      if (d === 'right') rows[12] = DOG_STEP.right[st];
      else rows[13] = DOG_STEP.down[st];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const k = col[rows[y][x]];
        if (!k) continue;
        g.fillStyle = k;
        g.fillRect(st * 16 + (dir === 'left' ? 15 - x : x), di * 16 + y, 1, 1);
      }
    }
  });
  return c;
}

export function characterSheet(spec) {
  const key = JSON.stringify(spec);
  if (sheetCache.has(key)) return sheetCache.get(key);
  if (spec.dog) { const d = dogSheet(spec); sheetCache.set(key, d); return d; }
  const [c, g] = makeCanvas(16 * 3, 16 * 4);
  DIRS.forEach((dir, di) => {
    for (let s = 0; s < 3; s++) {
      let rows = composeRows(spec.hair === spec.skin ? 'bald' : spec.style || 'short', spec.body || 'normal', dir, s);
      if (spec.kid) rows = ['................', '................', '................', ...rows.filter((_, i) => i !== 10 && i !== 12 && i !== 13)];
      // pequeño rebote al andar
      const bob = s === 0 ? 0 : 0;
      paintRows(g, rows, spec, s * 16, di * 16 + bob, dir === 'left');
      // detalles extra
      if (spec.badge && dir !== 'up') {
        g.fillStyle = spec.badge;
        const bx = dir === 'down' ? 9 : dir === 'right' ? 9 : 6;
        g.fillRect(s * 16 + bx, di * 16 + (spec.kid ? 12 : 11), 2, 2);
      }
      if (spec.bowtie && dir === 'down') {
        g.fillStyle = spec.bowtie;
        g.fillRect(s * 16 + 6, di * 16 + 9, 4, 1);
        g.fillRect(s * 16 + 7, di * 16 + 10, 2, 1);
      }
      if (spec.veil && dir !== 'down') {
        g.fillStyle = '#ffffff';
        const vx = dir === 'up' ? 4 : dir === 'right' ? 3 : 7;
        g.fillRect(s * 16 + vx, di * 16 + 3, 6, 9);
      }
      if (spec.glasses && dir !== 'up') {
        g.fillStyle = spec.outline;
        if (dir === 'down') g.fillRect(s * 16 + 4, di * 16 + 6, 8, 1);
        else g.fillRect(s * 16 + (dir === 'right' ? 9 : 3), di * 16 + 6, 4, 1);
      }
    }
  });
  sheetCache.set(key, c);
  return c;
}

export function drawCharacter(ctx, spec, dir, step, x, y, scale = 1) {
  const sheet = characterSheet(spec);
  const di = DIRS.indexOf(dir);
  ctx.drawImage(sheet, step * 16, di * 16, 16, 16, Math.round(x), Math.round(y), 16 * scale, 16 * scale);
}

// ---------- PIPI ----------
// Pelo castaño oscuro, barba, piel clara, camiseta blanca, vaqueros oscuros,
// bajito y con algo de tripa.
export const PIPI_BASE = {
  style: 'short', body: 'belly', beard: true,
  outline: '#1e1428', hair: '#4a2c1c', skin: '#f0c098', shirt: '#eeeef2', pants: '#2c3450', shoes: '#1e1428',
};
export function pipiSpec(nausea = 0) {
  // La piel se pone verdosa según la náusea
  let skin = PIPI_BASE.skin;
  if (nausea > 0.85) skin = '#b8d890';
  else if (nausea > 0.6) skin = '#dcd49c';
  return { ...PIPI_BASE, skin };
}

// ---------- ICONOS DE OBJETOS (8x8) ----------
const ICONS = {
  chicle: {
    rows: ['........', '.oooooo.', 'oppwwppo', 'oppppppo', 'opppwwpo', 'oppppppo', '.oooooo.', '........'],
    pal: { o: '#7a1850', p: '#f878b8', w: '#ffffff' },
  },
  pitillo: {
    rows: ['......g.', '.....g.g', '......g.', '.......g', 'ffwwwwwr', 'ffwwwwwy', '........', '........'],
    pal: { f: '#d88838', w: '#f4f4f4', r: '#e83820', y: '#f8c838', g: '#a8a8b8' },
  },
  sobras: {
    rows: ['........', '..ybby..', '.ybbyyb.', 'wyybbyyw', 'wwwwwwww', '.wggggw.', '..wwww..', '........'],
    pal: { y: '#f8d048', b: '#a05828', w: '#f4f4f4', g: '#c8c8d0' },
  },
  mechero: {
    rows: ['...y....', '..yry...', '...mm...', '..mmmm..', '..rrrr..', '..rwrr..', '..rrrr..', '..rrrr..'],
    pal: { y: '#f8d048', r: '#e03838', m: '#b8b8c8', w: '#ff9090' },
  },
  botella: {
    rows: ['...oo...', '...gg...', '...gg...', '..gggg..', '..gwgg..', '..glgg..', '..glgg..', '..gggg..'],
    pal: { o: '#704010', g: '#38a048', w: '#c8f8c8', l: '#f0e8d0' },
  },
  heart: {
    rows: ['........', '.rr.rr..', 'rwrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....', '........'],
    pal: { r: '#e03838', w: '#ffb0b0' },
  },
  puke: {
    rows: ['........', '..gg....', '.gyygg..', 'gyyggyg.', 'gygyyyg.', '.ggggg..', '........', '........'],
    pal: { g: '#5c8c20', y: '#c8d840' },
  },
  pukeEmpty: {
    rows: ['........', '..oo....', '.o..oo..', 'o.....o.', 'o.....o.', '.ooooo..', '........', '........'],
    pal: { o: '#5a4a6a' },
  },
  star: {
    rows: ['...y....', '...y....', 'yyyyyyy.', '.yyyyy..', '..yyy...', '.yy.yy..', '.y...y..', '........'],
    pal: { y: '#f8c838' },
  },
  clock: {
    rows: ['..ooo...', '.owwwo..', 'owwowwo.', 'owwoowo.', 'owwwwwo.', '.owwwo..', '..ooo...', '........'],
    pal: { o: '#f4ecd6', w: '#30243e' },
  },
};
const iconCache = new Map();
export function icon(name) {
  if (iconCache.has(name)) return iconCache.get(name);
  const def = ICONS[name];
  const [c, g] = makeCanvas(8, 8);
  if (def) {
    def.rows.forEach((r, y) => {
      for (let x = 0; x < 8; x++) {
        const col = def.pal[r[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
  }
  iconCache.set(name, c);
  return c;
}
export function drawIcon(ctx, name, x, y, scale = 1) {
  ctx.drawImage(icon(name), Math.round(x), Math.round(y), 8 * scale, 8 * scale);
}

// ---------- CHARCOS DE POTA ----------
const PUKE_COLS = ['#5c8c20', '#8cb030', '#c8d840', '#e8c860'];
export function makePuddle(seed = Math.random()) {
  const [c, g] = makeCanvas(18, 14);
  let s = Math.floor(seed * 100000) || 1;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const blobs = [];
  for (let i = 0; i < 6; i++) blobs.push([9 + (rnd() - 0.5) * 8, 7 + (rnd() - 0.5) * 5, 2.5 + rnd() * 2.5]);
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 18; x++) {
      let v = 0;
      for (const [bx, by, r] of blobs) v += (r * r) / ((x - bx) ** 2 + ((y - by) * 1.3) ** 2 + 0.01);
      if (v > 1.0) {
        g.fillStyle = v > 2.6 ? PUKE_COLS[2] : v > 1.5 ? PUKE_COLS[1] : PUKE_COLS[0];
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  // tropezones
  for (let i = 0; i < 5; i++) {
    g.fillStyle = PUKE_COLS[3];
    g.fillRect(5 + Math.floor(rnd() * 8), 4 + Math.floor(rnd() * 6), 1, 1);
  }
  return c;
}
export const PUKE_COLORS = PUKE_COLS;
