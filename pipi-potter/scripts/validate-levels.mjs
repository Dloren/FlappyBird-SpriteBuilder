// Comprueba los niveles: filas del mismo ancho, spawns/waypoints transitables y rutas alcanzables
globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
const { LEVELS } = await import('../src/levels/index.js');
const { Level } = await import('../src/levels/level.js');
const { findPath } = await import('../src/engine/path.js');
let bad = 0;
const err = (m) => { bad++; console.log('  ✗ ' + m); };
for (const d of LEVELS) {
  console.log(`${d.id}:`);
  const widths = new Set(d.map.map((r) => r.length));
  if (widths.size > 1) d.map.forEach((r, i) => { if (r.length !== d.map[0].length) err(`fila ${i} ancho ${r.length} (esperado ${d.map[0].length})`); });
  const L = new Level(d);
  const walk = (x, y, what) => { if (!L.walkable(x, y)) err(`${what} en (${x},${y}) no transitable: '${L.charAt(x, y)}'`); };
  walk(...d.player, 'player');
  for (const [t, x, y] of d.items) walk(x, y, `item ${t}`);
  for (const n of d.npcs) {
    if (n.at) walk(n.at[0], n.at[1], `npc ${n.name || n.role}`);
    if (n.route) {
      n.route.forEach(([x, y], i) => walk(x, y, `ruta ${n.name || n.role}[${i}]`));
      for (let i = 0; i < n.route.length; i++) {
        const a = n.route[i], b = n.route[(i + 1) % n.route.length];
        if (L.walkable(a[0], a[1]) && L.walkable(b[0], b[1]) && !findPath(L, a[0], a[1], b[0], b[1])) err(`sin camino ${n.name || n.role} ${a} -> ${b}`);
      }
      const p = findPath(L, d.player[0], d.player[1], n.route[0][0], n.route[0][1]);
    }
  }
  // todos los objetos alcanzables desde el inicio
  for (const [t, x, y] of d.items) if (L.walkable(x, y) && !findPath(L, d.player[0], d.player[1], x, y)) err(`item ${t} inalcanzable`);
  const nA = d.npcs.filter((n) => n.kind === 'A').length;
  console.log(`  ${L.w}x${L.h}, NPC-A ${nA}, NPC-B ${d.npcs.length - nA}, objetos ${d.items.length}`);
}
console.log(bad ? `${bad} errores` : 'OK');
process.exit(bad ? 1 : 0);
