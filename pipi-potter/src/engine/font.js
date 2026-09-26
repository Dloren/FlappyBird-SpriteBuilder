// Fuente bitmap propia de 3x5 píxeles (avance de 4 px).
const G = {
  'A': '.#.#.#####.##.#',
  'B': '##.#.###.#.###.',
  'C': '.###..#..#...##',
  'D': '##.#.##.##.###.',
  'E': '####..##.#..###',
  'F': '####..##.#..#..',
  'G': '.###..#.##.#.##',
  'H': '#.##.#####.##.#',
  'I': '###.#..#..#.###',
  'J': '..#..#..##.#.#.',
  'K': '#.##.###.#.##.#',
  'L': '#..#..#..#..###',
  'M': '#.########.##.#',
  'N': '##.#.##.##.##.#',
  'O': '.#.#.##.##.#.#.',
  'P': '##.#.###.#..#..',
  'Q': '.#.#.##.###..##',
  'R': '##.#.###.#.##.#',
  'S': '.###...#...###.',
  'T': '###.#..#..#..#.',
  'U': '#.##.##.##.####',
  'V': '#.##.##.##.#.#.',
  'W': '#.##.########.#',
  'X': '#.##.#.#.#.##.#',
  'Y': '#.##.#.#..#..#.',
  'Z': '###..#.#.#..###',
  '0': '####.##.##.####',
  '1': '.#.##..#..#.###',
  '2': '##...#.#.#..###',
  '3': '##...#.#...###.',
  '4': '#.##.####..#..#',
  '5': '####..##...###.',
  '6': '.###..####.####',
  '7': '###..#.#..#..#.',
  '8': '####.#####.####',
  '9': '####.####..###.',
  'Ñ': '###...##.#.##.#',
  '.': '.............#.',
  ',': '..........#.#..',
  '!': '.#..#..#.....#.',
  '¡': '.#.....#..#..#.',
  '?': '##...#.#.....#.',
  '¿': '.#.....#.#...##',
  ':': '....#.....#....',
  '-': '......###......',
  '+': '....#.###.#....',
  '/': '..#..#.#.#..#..',
  '%': '#.#..#.#.#..#.#',
  '(': '.#.#..#..#...#.',
  ')': '.#...#..#..#.#.',
  '\'': '.#..#..........',
  '"': '#.##.#.........',
  '=': '...###...###...',
  '>': '#...#...#.#.#..',
  '<': '..#.#.#...#...#',
  '€': '.###..##.#...##',
  '*': '...#.#.#.#.#...',
  '#': '#.#####.#####.#',
  '_': '............###',
  '·': '.......#.......',
  '♥': '#.#######.#....',
  '&': '.#.#.#.#.#.#.##',
};

const ACCENTS = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U' };

const cache = new Map();
function glyphCanvas(ch, color) {
  const key = ch + color;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = 3; c.height = 6;
  const g = c.getContext('2d');
  g.fillStyle = color;
  let base = ch, accent = false;
  if (ACCENTS[ch]) { base = ACCENTS[ch]; accent = true; }
  const bits = G[base] || G['?'];
  for (let i = 0; i < 15; i++) if (bits[i] === '#') g.fillRect(i % 3, 1 + Math.floor(i / 3), 1, 1);
  if (accent) g.fillRect(2, 0, 1, 1);
  cache.set(key, c);
  return c;
}

export const CHAR_W = 4;
export const LINE_H = 7;

export function textWidth(str, scale = 1) {
  let w = 0;
  for (const ch of String(str)) w += ch === ' ' ? 3 : CHAR_W;
  return Math.max(0, w - 1) * scale;
}

// Dibuja texto. y es la parte superior de las mayúsculas.
export function drawText(ctx, str, x, y, color = '#fff', scale = 1, shadow = null) {
  str = String(str).toUpperCase();
  if (shadow) drawText(ctx, str, x + scale, y + scale, shadow, scale, null);
  let cx = Math.round(x);
  const cy = Math.round(y) - scale; // la fila 0 del glifo es para tildes
  for (const ch of str) {
    if (ch === ' ') { cx += 3 * scale; continue; }
    if (ch === '\n') continue;
    const gc = glyphCanvas(ch, color);
    ctx.drawImage(gc, cx, cy, 3 * scale, 6 * scale);
    cx += CHAR_W * scale;
  }
}

export function drawTextCentered(ctx, str, cx, y, color, scale = 1, shadow = null) {
  drawText(ctx, str, Math.round(cx - textWidth(str, scale) / 2), y, color, scale, shadow);
}

export function wrapText(str, maxW, scale = 1) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (textWidth(test, scale) > maxW && line) { out.push(line); line = word; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}
