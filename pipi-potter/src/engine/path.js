// A* en rejilla de tiles (8 direcciones sin cortar esquinas)
import { TILE } from '../config.js';

export function findPath(level, sx, sy, gx, gy) {
  const W = level.w, H = level.h;
  const start = sy * W + sx;
  let goal = gy * W + gx;
  if (!level.walkable(gx, gy)) {
    // busca el tile libre más cercano al objetivo
    let best = null, bd = 1e9;
    for (let r = 1; r < 4 && !best; r++)
      for (let y = gy - r; y <= gy + r; y++)
        for (let x = gx - r; x <= gx + r; x++)
          if (level.walkable(x, y)) { const d = (x - gx) ** 2 + (y - gy) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
    if (!best) return null;
    [gx, gy] = best;
    goal = gy * W + gx;
  }
  if (start === goal) return [[gx, gy]];
  const g = new Float32Array(W * H).fill(Infinity);
  const came = new Int32Array(W * H).fill(-1);
  const closed = new Uint8Array(W * H);
  const open = [start];
  g[start] = 0;
  const h = (i) => { const x = i % W, y = (i / W) | 0; const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return dx + dy - 0.6 * Math.min(dx, dy); };
  const f = new Float32Array(W * H).fill(Infinity);
  f[start] = h(start);
  const N = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4], [1, -1, 1.4], [-1, 1, 1.4], [-1, -1, 1.4]];
  let iter = 0;
  while (open.length && iter++ < 6000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open[bi];
    open[bi] = open[open.length - 1]; open.pop();
    if (cur === goal) break;
    closed[cur] = 1;
    const cx = cur % W, cy = (cur / W) | 0;
    for (const [dx, dy, c] of N) {
      const nx = cx + dx, ny = cy + dy;
      if (!level.walkable(nx, ny)) continue;
      if (dx && dy && (!level.walkable(cx + dx, cy) || !level.walkable(cx, cy + dy))) continue;
      const ni = ny * W + nx;
      if (closed[ni]) continue;
      const ng = g[cur] + c;
      if (ng < g[ni]) {
        if (g[ni] === Infinity) open.push(ni);
        g[ni] = ng; f[ni] = ng + h(ni); came[ni] = cur;
      }
    }
  }
  if (came[goal] === -1) return null;
  const out = [];
  for (let c = goal; c !== start && c !== -1; c = came[c]) out.push([c % W, (c / W) | 0]);
  out.reverse();
  return out;
}

export const tileCenter = (t) => t * TILE + TILE / 2;
