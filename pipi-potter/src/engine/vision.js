// Raycasting por tiles "altos" (muros, muebles altos) y NPC-B como
// oclusores circulares. Sirve para dibujar los conos recortados y
// para comprobar la línea de visión.
import { TILE, CONFIG } from '../config.js';
import { angleDiff } from './util.js';

function blockedAt(level, x, y, occluders, ignore) {
  if (level.isTallAt(x, y)) return true;
  if (occluders) {
    const r2 = CONFIG.vision.occluderRadius ** 2;
    for (let i = 0; i < occluders.length; i++) {
      const o = occluders[i];
      if (o === ignore) continue;
      const dx = x - o.x, dy = y - o.cy;
      if (dx * dx + dy * dy < r2) return true;
    }
  }
  return false;
}

export function rayLength(level, ox, oy, ang, range, occluders, ignore) {
  const step = CONFIG.vision.rayStep;
  const dx = Math.cos(ang) * step, dy = Math.sin(ang) * step;
  let x = ox, y = oy, d = 0;
  while (d < range) {
    x += dx; y += dy; d += step;
    if (blockedAt(level, x, y, occluders, ignore)) return d - step * 0.5;
  }
  return range;
}

// Devuelve el polígono del cono [x0,y0,x1,y1,...] empezando en el origen
export function conePolygon(level, ox, oy, ang, halfDeg, range, occluders, ignore, rays = CONFIG.vision.rays) {
  const half = (halfDeg * Math.PI) / 180;
  const pts = [ox, oy];
  for (let i = 0; i <= rays; i++) {
    const a = ang - half + (2 * half * i) / rays;
    const l = rayLength(level, ox, oy, a, range, occluders, ignore);
    pts.push(ox + Math.cos(a) * l, oy + Math.sin(a) * l);
  }
  return pts;
}

export function lineOfSight(level, ox, oy, tx, ty, occluders, ignore, ignore2) {
  const d = Math.hypot(tx - ox, ty - oy);
  const n = Math.ceil(d / CONFIG.vision.rayStep);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = ox + (tx - ox) * t, y = oy + (ty - oy) * t;
    if (level.isTallAt(x, y)) return false;
    if (occluders) {
      const r2 = CONFIG.vision.occluderRadius ** 2;
      for (const o of occluders) {
        if (o === ignore || o === ignore2) continue;
        const dx = x - o.x, dy = y - o.cy;
        if (dx * dx + dy * dy < r2) return false;
      }
    }
  }
  return true;
}

export function inCone(ox, oy, ang, halfDeg, range, tx, ty) {
  const dx = tx - ox, dy = ty - oy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d < 4) return true;
  return Math.abs(angleDiff(ang, Math.atan2(dy, dx))) <= (halfDeg * Math.PI) / 180;
}

export function canSee(level, ox, oy, ang, halfDeg, range, tx, ty, occluders, ignore, ignore2) {
  return inCone(ox, oy, ang, halfDeg, range, tx, ty) && lineOfSight(level, ox, oy, tx, ty, occluders, ignore, ignore2);
}

export const tileOf = (v) => Math.floor(v / TILE);
