import { TILE } from '../config.js';
import { TILES } from '../assets/tiles.js';

// Representación en tiempo de ejecución de un nivel definido como datos
export class Level {
  constructor(data) {
    this.data = data;
    this.rows = data.map;
    this.h = this.rows.length;
    this.w = Math.max(...this.rows.map((r) => r.length));
    this.rows = this.rows.map((r) => r.padEnd(this.w, '#'));
    this.pal = data.palette;
    this.floors = data.floors;
    this.floorUnder = data.floorUnder || {};
    this.pw = this.w * TILE;
    this.ph = this.h * TILE;
  }
  charAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return null;
    return this.rows[ty][tx];
  }
  isSolid(tx, ty) {
    const c = this.charAt(tx, ty);
    return c === null || !!(TILES[c] && TILES[c].solid);
  }
  isTall(tx, ty) {
    const c = this.charAt(tx, ty);
    return c === null || !!(TILES[c] && TILES[c].tall);
  }
  walkable(tx, ty) { return !this.isSolid(tx, ty); }
  isSolidAt(x, y) { return this.isSolid(Math.floor(x / TILE), Math.floor(y / TILE)); }
  isTallAt(x, y) { return this.isTall(Math.floor(x / TILE), Math.floor(y / TILE)); }
  boxFree(x, y, hw, hh) {
    return !(this.isSolidAt(x - hw, y - hh) || this.isSolidAt(x + hw, y - hh) ||
      this.isSolidAt(x - hw, y + hh) || this.isSolidAt(x + hw, y + hh));
  }
}

// ---------- Aspecto de NPCs ----------
export const SKIN = ['#f0c098', '#e8b088', '#d09060', '#a86c44', '#7c4c30', '#f8d8c0'];
export const HAIR = { black: '#201820', brown: '#5a3420', dark: '#3c2418', blond: '#e8c060', red: '#c05028', grey: '#b8b8c0', white: '#e8e8f0', pink: '#f090c0', blue: '#4878d8' };
export const GROUP_SHIRT = '#f060a8'; // marcador: resolveLevel lo sustituye por ropa normal
export const OUTLINE = '#1e1428';

export function look(o = {}) {
  return {
    style: 'short', body: 'normal', outline: OUTLINE,
    hair: HAIR.brown, skin: SKIN[0], shirt: GROUP_SHIRT, pants: '#303850',
    ...o,
  };
}
