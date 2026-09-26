export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const angleDiff = (a, b) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
// Dirección cardinal (0 abajo, 1 arriba, 2 izquierda, 3 derecha) a partir de un ángulo
export const DIR_DOWN = 0, DIR_UP = 1, DIR_LEFT = 2, DIR_RIGHT = 3;
export function angleToDir(a) {
  const c = Math.cos(a), s = Math.sin(a);
  if (Math.abs(c) > Math.abs(s)) return c > 0 ? DIR_RIGHT : DIR_LEFT;
  return s > 0 ? DIR_DOWN : DIR_UP;
}
export const DIR_ANGLE = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];
export function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
// Ruido suave 1D (para los tumbos de Pipi)
export function smoothNoise(seed) {
  let a = Math.random(), b = Math.random(), t = 0;
  return (dt, speed = 1) => {
    t += dt * speed;
    while (t >= 1) { t -= 1; a = b; b = Math.random(); }
    const k = t * t * (3 - 2 * t);
    return (a + (b - a) * k) * 2 - 1;
  };
}
