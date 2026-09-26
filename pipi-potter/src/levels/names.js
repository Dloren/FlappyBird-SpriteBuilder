// Nombres de los amigos: cambian en cada partida
import { pick } from '../engine/util.js';

export const FRIEND_NAMES = [
  ['PUCHI', 'm'], ['RUBY', 'f'], ['DEIVID', 'm'], ['BALA', 'm'], ['CHAVO', 'm'], ['PASCUI', 'm'],
  ['LARGO', 'm'], ['ROSA', 'f'], ['ELOY', 'm'], ['ELVIRA', 'f'], ['MANZA', 'm'], ['PILLE', 'm'],
  ['MARIO', 'm'], ['DIEGO', 'm'], ['BOIX', 'm'], ['ILLO', 'm'], ['GUZME', 'm'],
];

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

// Devuelve una copia del nivel con los amigos renombrados para esta partida.
// El sorteo se guarda en la partida (run) para que la intro y el nivel coincidan.
export function resolveLevel(data, run, idx) {
  run.friendNames = run.friendNames || {};
  const friends = data.npcs.filter((n) => n.role === 'friend');
  if (!run.friendNames[idx]) run.friendNames[idx] = shuffle(FRIEND_NAMES).slice(0, friends.length);
  const names = run.friendNames[idx];
  let k = 0;
  const npcs = data.npcs.map((n) => {
    if (n.role !== 'friend') return n;
    const [name, g] = names[k++ % names.length];
    const lk = { ...n.look };
    // el aspecto se adapta al nombre
    if (g === 'f') {
      if (lk.style !== 'long' && lk.style !== 'bun') lk.style = pick(['long', 'bun']);
      lk.body = 'dress'; lk.beard = false; lk.mustache = false;
    } else if (lk.body === 'dress' || lk.style === 'long' || lk.style === 'bun') {
      lk.style = pick(['short', 'cap']); lk.body = 'normal'; lk.cap = lk.cap || '#3858c8';
    }
    return { ...n, name, label: g === 'f' ? 'AMIGA' : 'AMIGO', look: lk };
  });
  return { ...data, npcs };
}
