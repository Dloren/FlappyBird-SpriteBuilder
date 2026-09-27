// Motes que te ponen cuando te pillan. Cada mote nuevo es un logro desbloqueado.
import { pick } from '../engine/util.js';

export const MOTES = [
  ['EL ASPERSOR', 'RIEGA TODO LO QUE PISA.'],
  ['CAPITÁN ARCADAS', 'AL MANDO DEL BARCO... Y DEL MAREO.'],
  ['EL VOLCÁN', 'ERUPCIONES SIN PREVIO AVISO.'],
  ['PIPI FUENTES', 'COMO LA DE LA PLAZA, PERO PEOR.'],
  ['EL GÉISER', 'SIEMPRE A LA MISMA HORA.'],
  ['LA MANGUERA', 'ALCANCE: 3 METROS.'],
  ['MÍSTER GARRAFÓN', 'EL GARRAFÓN LE CONOCE POR SU NOMBRE.'],
  ['EL BOTIJO', 'LO QUE ENTRA, SALE.'],
  ['LA HORMIGONERA', 'NO PARA DE DAR VUELTAS.'],
  ['EL SURTIDOR', 'LLENO, POR FAVOR.'],
  ['VOMITRÓN 3000', 'MODELO DE ÚLTIMA GENERACIÓN.'],
  ['EL CATARATAS', 'CAUDAL DEL NIÁGARA.'],
  ['SEÑOR POTASIO', 'RICO EN MINERALES.'],
  ['EL DESATASCADOR', 'SE LO SACA TODO.'],
  ['ROCIADOR OFICIAL', 'CERTIFICADO POR EL AYUNTAMIENTO.'],
  ['EL PAELLERO', 'DEJA PAELLAS POR DONDE PASA.'],
  ['LA BATIDORA', 'TRITURA Y DEVUELVE.'],
  ['DON RECICLAJE', 'LA COMIDA, A LA SEGUNDA VIDA.'],
  ['EL PULVERIZADOR', 'COBERTURA TOTAL.'],
  ['EL BUFÓN DE LA FIESTA', 'EL CHISTE DEL GRUPO PARA SIEMPRE.'],
];

const KEY = 'pipipotter_motes_v1';
export function unlockedMotes() {
  try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return new Set(Array.isArray(a) ? a : []); } catch (_) { return new Set(); }
}

// Elige un mote al azar (con preferencia por los aún no desbloqueados) y lo guarda
export function awardMote() {
  const got = unlockedMotes();
  const locked = MOTES.filter(([n]) => !got.has(n));
  const m = locked.length && Math.random() < 0.7 ? pick(locked) : pick(MOTES);
  const isNew = !got.has(m[0]);
  got.add(m[0]);
  try { localStorage.setItem(KEY, JSON.stringify([...got])); } catch (_) { /* noop */ }
  checkLord();
  return { name: m[0], desc: m[1], isNew };
}

// ---------- MEDALLAS: se ganan al superar las 5 fiestas seguidas ----------
export const MEDALS = [
  ['LEYENDA DEL POTEO DISCRETO', 'NADIE SE ENTERÓ DE NADA.'],
  ['NINJA DEL VÓMITO', 'SILENCIOSO. LETAL. ÁCIDO.'],
  ['EL FANTASMA DE LA BARRA', 'ESTABA AHÍ... Y YA NO.'],
  ['AGENTE 00-POTA', 'LICENCIA PARA POTAR.'],
  ['MAESTRO ZEN DE LA ARCADA', 'LA ARCADA FLUYE, EL MAESTRO NO SE INMUTA.'],
  ['SIGILO NIVEL SUEGRA', 'NI TU SUEGRA LO VIO VENIR.'],
  ['CAMALEÓN DE LA VERBENA', 'SE FUNDE CON EL PAISAJE (Y CON LA POTA).'],
  ['EL INVISIBLE DEL GARRAFÓN', 'BEBE, POTA Y DESAPARECE.'],
  ['PADRINO DE LA POTA SECRETA', 'LE HARÁS UNA OFERTA QUE NO PODRÁS VOMITAR.'],
  ['SANTO PATRÓN DE LOS BAÑOS', 'TIENE SU ESTAMPITA EN CADA VÁTER.'],
];

// ---------- MÉRITOS: hazañas concretas ----------
export const MERITS = [
  ['METAL GEAR POTA', ''],
  ['TACTIC POTA', ''],
  ['POTA FUGAZ', ''],
  ['MAJESTIC POTA', ''],
  ['LORD OF THE POTAS', ''],
];

function loadSet(key) {
  try { const a = JSON.parse(localStorage.getItem(key) || '[]'); return new Set(Array.isArray(a) ? a : []); } catch (_) { return new Set(); }
}
function saveSet(key, set) { try { localStorage.setItem(key, JSON.stringify([...set])); } catch (_) { /* noop */ } }
const MEDAL_KEY = 'pipipotter_medals_v1';
const MERIT_KEY = 'pipipotter_merits_v1';
export const unlockedMedals = () => loadSet(MEDAL_KEY);
export const unlockedMerits = () => loadSet(MERIT_KEY);

export function awardMedal() {
  const got = unlockedMedals();
  const locked = MEDALS.filter(([n]) => !got.has(n));
  const m = locked.length ? (got.size === 0 ? MEDALS[0] : pick(locked)) : pick(MEDALS);
  const isNew = !got.has(m[0]);
  got.add(m[0]);
  saveSet(MEDAL_KEY, got);
  checkLord();
  return { name: m[0], desc: m[1], isNew };
}

// Devuelve true si el mérito es nuevo
export function awardMerit(name) {
  const got = unlockedMerits();
  if (got.has(name)) return false;
  got.add(name);
  saveSet(MERIT_KEY, got);
  if (name !== 'LORD OF THE POTAS') checkLord();
  return true;
}

// LORD OF THE POTAS: todo lo demás desbloqueado
export function checkLord() {
  const motes = unlockedMotes(), medals = unlockedMedals(), merits = unlockedMerits();
  const all = MOTES.every(([n]) => motes.has(n)) && MEDALS.every(([n]) => medals.has(n))
    && MERITS.filter(([n]) => n !== 'LORD OF THE POTAS').every(([n]) => merits.has(n));
  if (all && !merits.has('LORD OF THE POTAS')) { merits.add('LORD OF THE POTAS'); saveSet(MERIT_KEY, merits); return true; }
  return false;
}
