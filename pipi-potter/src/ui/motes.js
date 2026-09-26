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
  return { name: m[0], desc: m[1], isNew };
}
