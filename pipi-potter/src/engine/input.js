// Entrada unificada: controles táctiles multitouch (pointer events),
// teclado para PC y toques sobre la pantalla de juego.
import { SCREEN_W, SCREEN_H } from '../config.js';

const BTNS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyZ: 'a', KeyJ: 'a', Space: 'a', KeyX: 'b', KeyK: 'b',
  Enter: 'start', KeyP: 'start', ShiftRight: 'select', ShiftLeft: 'select', Backspace: 'select',
};

class InputManager {
  constructor() {
    this.key = {};      // estado del teclado
    this.touch = {};    // estado calculado de los punteros táctiles
    this.hit = new Set(); // pulsaciones latcheadas (para toques muy rápidos)
    this.prev = {};
    this.down = {};
    this.pressed = {};
    this.released = {};
    this.taps = [];
    this.pointers = new Map();
    this.onFirstInteraction = null;
    this.anyPointerCanvas = null;
    BTNS.forEach((b) => { this.down[b] = false; this.prev[b] = false; });
  }

  attach(canvas, controlsRoot) {
    this.canvas = canvas;
    this.root = controlsRoot;
    this.dpad = controlsRoot.querySelector('#dpad');
    this.btnEls = [...controlsRoot.querySelectorAll('[data-btn]')];

    window.addEventListener('keydown', (e) => {
      const b = KEYMAP[e.code];
      if (b) { e.preventDefault(); if (!this.key[b]) this.hit.add(b); this.key[b] = true; }
      this._first();
    });
    window.addEventListener('keyup', (e) => {
      const b = KEYMAP[e.code];
      if (b) { e.preventDefault(); this.key[b] = false; }
    });
    window.addEventListener('blur', () => { this.key = {}; this.pointers.clear(); this._recalc(); });

    const opts = { passive: false };
    const onDown = (e) => {
      this._first();
      if (e.target === canvas) {
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        this.taps.push({
          x: ((e.clientX - r.left) / r.width) * SCREEN_W,
          y: ((e.clientY - r.top) / r.height) * SCREEN_H,
        });
        return;
      }
      if (!controlsRoot.contains(e.target)) return;
      e.preventDefault();
      try { e.target.setPointerCapture?.(e.pointerId); } catch (_) { /* noop */ }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this._recalc(true);
    };
    const onMove = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      e.preventDefault();
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this._recalc(true);
    };
    const onUp = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      this._recalc(false);
    };
    document.addEventListener('pointerdown', onDown, opts);
    document.addEventListener('pointermove', onMove, opts);
    document.addEventListener('pointerup', onUp, opts);
    document.addEventListener('pointercancel', onUp, opts);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    // Evita zoom por doble toque / gestos en iOS
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 || controlsRoot.contains(e.target)) e.preventDefault(); }, opts);
  }

  _first() {
    if (this.onFirstInteraction) { const f = this.onFirstInteraction; this.onFirstInteraction = null; f(); }
  }

  // Recalcula qué botones están pulsados según todos los dedos activos
  _recalc(canLatch) {
    const t = {};
    const dr = this.dpad.getBoundingClientRect();
    const dcx = dr.left + dr.width / 2, dcy = dr.top + dr.height / 2, rad = dr.width / 2;
    const rects = this.btnEls.map((el) => [el.dataset.btn, el.getBoundingClientRect(), el]);
    for (const p of this.pointers.values()) {
      const dx = p.x - dcx, dy = p.y - dcy, d = Math.hypot(dx, dy);
      if (d < rad * 1.35 && d > rad * 0.14) {
        const a = Math.atan2(dy, dx);
        const sector = Math.round(a / (Math.PI / 4)); // -4..4
        const s = ((sector % 8) + 8) % 8; // 0=der,1=der-abajo,2=abajo...
        if (s === 7 || s === 0 || s === 1) t.right = true;
        if (s === 1 || s === 2 || s === 3) t.down = true;
        if (s === 3 || s === 4 || s === 5) t.left = true;
        if (s === 5 || s === 6 || s === 7) t.up = true;
        continue;
      }
      for (const [b, r] of rects) {
        const m = 10; // margen extra para dedos gordos
        if (p.x >= r.left - m && p.x <= r.right + m && p.y >= r.top - m && p.y <= r.bottom + m) t[b] = true;
      }
    }
    for (const b of BTNS) if (t[b] && !this.touch[b] && canLatch) this.hit.add(b);
    this.touch = t;
    // Feedback visual
    for (const [b, , el] of rects) el.classList.toggle('on', !!t[b]);
    this.dpad.dataset.dir = ['up', 'down', 'left', 'right'].filter((d) => t[d]).join(' ');
  }

  // Llamar una vez por paso fijo de simulación
  poll() {
    for (const b of BTNS) {
      const raw = !!(this.key[b] || this.touch[b]);
      const latched = this.hit.has(b);
      this.down[b] = raw || latched;
      this.pressed[b] = (this.down[b] && !this.prev[b]) || (latched && this.prev[b] && !raw);
      this.released[b] = !this.down[b] && this.prev[b];
      this.prev[b] = raw;
    }
    this.hit.clear();
    this.tapsThisStep = this.taps;
    this.taps = [];
  }

  consumeTap() { return this.tapsThisStep && this.tapsThisStep.length ? this.tapsThisStep.shift() : null; }

  axis() {
    let x = 0, y = 0;
    if (this.down.left) x -= 1;
    if (this.down.right) x += 1;
    if (this.down.up) y -= 1;
    if (this.down.down) y += 1;
    return { x, y };
  }

  clearAll() {
    this.hit.clear();
    BTNS.forEach((b) => { this.pressed[b] = false; });
    this.taps = [];
    this.tapsThisStep = [];
  }
}

export const input = new InputManager();

export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) { /* noop */ }
}
