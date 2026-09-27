// Nombres de los amigos: cambian en cada partida
import { pick } from '../engine/util.js';

export const FRIEND_NAMES = [
  ['PUCHI', 'm'], ['RUBY', 'f'], ['DEIVID', 'm'], ['BALA', 'm'], ['CHAVO', 'm'], ['PASCUI', 'm'],
  ['LARGO', 'm'], ['ROSA', 'f'], ['ELOY', 'm'], ['ELVIRA', 'f'], ['MANZA', 'm'], ['PILLE', 'm'],
  ['MARIO', 'm'], ['DIEGO', 'm'], ['BOIX', 'm'], ['ILLO', 'm'], ['GUZME', 'm'],
];

const PINKS = ['#f060a8', '#f070b0'];
const CLOTHES = ['#34466a', '#5a6a3a', '#7a7a82', '#8a7a5a', '#6a2a34', '#4a6a90', '#6a4a32', '#3a3a44', '#c8c4b8', '#2e4a3a', '#7a5a6a', '#5a5a3a'];

// Compañeros de trabajo (cena de empresa): nombres aleatorios de oficina
export const COWORKER_NAMES = [
  ['JAVIER', 'm'], ['SONIA', 'f'], ['ALBERTO', 'm'], ['PATRICIA', 'f'], ['RAÚL', 'm'], ['CRISTINA', 'f'], ['SERGIO', 'm'],
  ['BEATRIZ', 'f'], ['ÓSCAR', 'm'], ['NURIA', 'f'], ['FERNANDO', 'm'], ['LORENA', 'f'], ['ADRIÁN', 'm'], ['SILVIA', 'f'],
  ['RUBÉN', 'm'], ['MÓNICA', 'f'], ['IVÁN', 'm'], ['ESTHER', 'f'], ['ALFONSO', 'm'], ['NATALIA', 'f'],
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
  const friends = data.npcs.filter((n) => n.role === 'friend' || n.role === 'coworker');
  const coworkers = friends.some((n) => n.role === 'coworker');
  if (!run.friendNames[idx]) run.friendNames[idx] = shuffle(coworkers ? COWORKER_NAMES : FRIEND_NAMES).slice(0, friends.length);
  const names = run.friendNames[idx];
  let k = 0;
  // ropa normal y discreta para los NPC-A (nada de rosa del grupo)
  let ci = idx * 3;
  const dress = (n) => {
    if (n.kind !== 'A' || n.look.tie) return n;
    const sh = n.look.shirt;
    if (sh && !PINKS.includes(sh)) return n;
    return { ...n, look: { ...n.look, shirt: CLOTHES[ci++ % CLOTHES.length] } };
  };
  const npcs = data.npcs.map(dress).map((n) => {
    if (n.role !== 'friend' && n.role !== 'coworker') return n;
    const [name, g] = names[k++ % names.length];
    const lk = { ...n.look };
    // el aspecto se adapta al nombre
    if (g === 'f') {
      if (lk.style !== 'long' && lk.style !== 'bun') lk.style = pick(['long', 'bun']);
      lk.body = 'dress'; lk.beard = false; lk.mustache = false;
    } else if (lk.body === 'dress' || lk.style === 'long' || lk.style === 'bun') {
      lk.style = pick(['short', 'cap']); lk.body = 'normal'; lk.cap = lk.cap || '#3858c8';
    }
    const label = n.role === 'coworker' ? (g === 'f' ? 'COMPAÑERA' : 'COMPAÑERO') : g === 'f' ? 'AMIGA' : 'AMIGO';
    return { ...n, name, label, look: lk };
  });
  return { ...data, npcs };
}
