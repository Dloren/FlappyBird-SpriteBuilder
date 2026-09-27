// NIVEL 1 — DISCOTECA
// Leyenda de tiles: ver assets/tiles.js. Coordenadas en tiles (x, y).
// Rutas: [x, y, espera_en_segundos, dirección_al_esperar?]
import { look, HAIR, SKIN } from './level.js';

export default {
  id: 'disco',
  name: 'DISCOTECA',
  intro: 'SÁBADO, 3:00 AM. LA NOCHE SE HA COMPLICADO Y LOS CUBATAS DE GARRAFÓN EMPIEZAN A PASAR FACTURA.',
  music: 'disco',
  palette: {
    ink: '#140c1c', wallTop: '#3a2850', wallFace: '#5a3c78', wallLine: '#402a58',
    wood: '#8a5030', woodDark: '#5a3020', woodLight: '#b87848', metal: '#8890a8', metalDark: '#303040',
    accent: '#e83878', accent2: '#38c8e8', leaf: '#38a050', leafDark: '#206838', leafLight: '#78d068',
    pot: '#a05030', cloth: '#f0f0f0', clothShade: '#c8c8d8', water: '#3070c8', waterLight: '#a0d0f8',
    sofa: '#a02848', sofaDark: '#681830', car: '#d8a020', glass: '#c8f0f8', void: '#0c0814',
  },
  floors: {
    '.': ['tiles', '#2a2038', '#231a30'],
    ',': ['disco', '#3a1c4c', '#2c2050', '#a02858', '#3a1c4c', '#206878', '#2c2050', '#8a6a20', '#3a1c4c', '#48287a'],
    ':': ['checker', '#c8c8dc', '#a8a8c0'],
    ';': ['road', '#4a4858', '#3c3a48', '#6a6878'],
    "'": ['dirt', '#4a3c34', '#3a2c24'],
    '_': ['stage', '#6a4a38', '#4a3020'],
    'd': ['mat', '#2a2038', '#801838'],
  },
  floorUnder: { '=': ':', 't': ':', 'K': ';', 'n': ';' },
  map: [
    '##############################',
    '#t:t:t#XX..X.......X#:t:t:t:t#',
    '#:::::#............I#::::::::#',
    '#:::::#X...X...XX...#::::::::#',
    '####d####d###########d########',
    '#............................#',
    '#::::=...P.....PP.....P.S___S#',
    '#::::=....,,,,,,,,,,......D__#',
    '#::::=....,,,,,,,,,,......D__#',
    '#::::=.O..,,,,,,,,,,..O...D__#',
    '#::::=....,,,,,,,,,,......D__#',
    '#::::=....,,,,,,,,,,......D__#',
    '#::::=...P.....PP.....P.S___S#',
    '#::::=.......................#',
    '#::::====..T...T...T....CCC..#',
    '#:::.....................C...#',
    '###############dd#############',
    '#;;;;;;;;;;;;;;;;;;;;;;;;;;;;#',
    '#;;;;;;;;;;;;;;;;;;;;;;;;KKK;#',
    '#;;n;;;;;;;;;;;;;;;;;;n;;KKK;#',
    '#;;;;;;;;;;;;;;;;;;;;;;;;;;;;#',
    "#''''#########################",
    "#'X''#########################",
    "#''''#########################",
    "#X''X#########################",
    '##############################',
  ],
  player: [16, 14],
  npcs: [
    // ---- NPC-A añadidos ----
    {
      kind: 'A', role: 'friend', name: 'F4',
      look: look({ style: 'bun', hair: HAIR.black, skin: SKIN[3], body: 'dress' }),
      route: [[24, 2, 4, 'up'], [21, 5, 0], [23, 15, 4, 'right'], [19, 10, 3, 'left'], [21, 5, 0]],
    },
    {
      kind: 'A', role: 'friend', name: 'F5',
      look: look({ style: 'short', hair: HAIR.red, skin: SKIN[0], beard: true, body: 'belly' }),
      route: [[16, 15, 2], [15, 17, 0], [4, 19, 4, 'left'], [3, 21, 3, 'down'], [10, 18, 2], [16, 13, 3, 'up']],
    },
    // ---- NPC-B añadidos ----
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [12, 9], look: look({ style: 'long', body: 'dress', shirt: '#48e878', hair: HAIR.red }) },
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [17, 8], look: look({ shirt: '#f8f8f8', hair: HAIR.black, skin: SKIN[4] }) },
    { kind: 'B', role: 'crowd', behavior: 'static', at: [7, 8], dir: 'left', look: look({ style: 'cap', cap: '#48287a', shirt: '#303030' }) },
    { kind: 'B', role: 'crowd', behavior: 'static', at: [7, 12], dir: 'left', look: look({ style: 'long', body: 'dress', shirt: '#e8e030', hair: HAIR.blond }) },
    { kind: 'B', role: 'crowd', behavior: 'static', at: [21, 18], dir: 'left', look: look({ shirt: '#4878d8', hair: HAIR.grey }) },
    { kind: 'B', role: 'crowd', route: [[2, 17, 2], [27, 17, 2]], look: look({ style: 'bun', body: 'dress', shirt: '#a0a0a0', hair: HAIR.brown }) },
    // ---- NPC-A: el grupo de amigos ----
    {
      kind: 'A', role: 'friend', name: 'LAURA',
      look: look({ style: 'long', hair: HAIR.blond, skin: SKIN[5], body: 'dress' }),
      route: [[12, 8, 3], [17, 10, 3, 'left'], [6, 9, 4, 'left'], [6, 13, 1], [12, 12, 2, 'up']],
    },
    {
      kind: 'A', role: 'friend', name: 'DANI',
      look: look({ hair: HAIR.black, skin: SKIN[2], glasses: true, beard: true }),
      route: [[6, 7, 4, 'left'], [4, 5, 0], [3, 2, 4, 'up'], [4, 5, 0], [13, 13, 3, 'down'], [7, 11, 2, 'left']],
    },
    {
      kind: 'A', role: 'friend', name: 'MIGUEL',
      look: look({ style: 'cap', cap: '#3858c8', hair: HAIR.brown, skin: SKIN[1] }),
      route: [[24, 9, 3, 'right'], [22, 14, 0], [15, 15, 0], [20, 18, 5, 'left'], [9, 19, 3, 'right'], [16, 17, 0], [15, 13, 0], [8, 5, 2, 'down']],
    },
    // ---- NPC-B ----
    { kind: 'B', role: 'dj', name: 'DJ', behavior: 'dance', at: [27, 9], dir: 'left',
      look: look({ style: 'cap', cap: '#101010', shirt: '#282828', skin: SKIN[3] }) },
    {
      kind: 'B', role: 'waiter', name: 'CAMARERO', worker: true, zone: [[1, 5, 4, 11]],
      look: look({ shirt: '#f4f4f4', pants: '#181818', bowtie: '#181818', hair: HAIR.black, skin: SKIN[1] }),
      route: [[2, 7, 3, 'right'], [2, 12, 3, 'right'], [3, 15, 1], [2, 10, 2, 'right']],
    },
    {
      kind: 'B', role: 'waiter', name: 'CAMARERA', worker: true, zone: [[1, 5, 4, 11], [7, 1, 13, 3]],
      look: look({ style: 'bun', shirt: '#f4f4f4', pants: '#181818', hair: HAIR.red, skin: SKIN[0] }),
      route: [[3, 8, 3, 'right'], [9, 5, 0], [13, 2, 4, 'up'], [9, 5, 0], [3, 13, 3, 'right']],
    },
    { kind: 'B', role: 'bouncer', name: 'PORTERO', worker: true, zone: [[12, 17, 8, 3]], behavior: 'guard', at: [17, 18], dir: 'left',
      look: look({ style: 'bald', hair: SKIN[4], skin: SKIN[4], shirt: '#181818', pants: '#181818', badge: '#f8c838', body: 'belly' }) },
    // Público bailando (tapan la visión)
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [11, 7], look: look({ shirt: '#38c8e8', hair: HAIR.black }) },
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [14, 8], look: look({ style: 'long', shirt: '#f8c838', hair: HAIR.brown, body: 'dress' }) },
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [18, 7], look: look({ shirt: '#58c048', hair: HAIR.blond, skin: SKIN[2] }) },
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [11, 11], look: look({ style: 'bun', shirt: '#8848e8', hair: HAIR.black, skin: SKIN[4], body: 'dress' }) },
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [16, 11], look: look({ shirt: '#e86830', hair: HAIR.red }) },
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [19, 9], look: look({ style: 'cap', cap: '#e83838', shirt: '#303030' }) },
    { kind: 'B', role: 'crowd', behavior: 'dance', at: [14, 10], look: look({ style: 'long', shirt: '#38e8a8', hair: HAIR.pink, body: 'dress' }) },
    { kind: 'B', role: 'crowd', behavior: 'static', at: [16, 13], dir: 'down', look: look({ shirt: '#4878d8', hair: HAIR.grey, body: 'belly' }) },
    { kind: 'B', role: 'crowd', behavior: 'static', at: [6, 18], dir: 'right', look: look({ shirt: '#a0a0a0', hair: HAIR.dark }) },
    { kind: 'B', role: 'crowd', behavior: 'static', at: [7, 18], dir: 'left', look: look({ style: 'long', shirt: '#f8f8f8', hair: HAIR.black, skin: SKIN[3], body: 'dress' }) },
  ],
  items: [
    // 5 pitis escondidos
    ['pitillo', 9, 1], ['pitillo', 5, 3], ['pitillo', 28, 11], ['pitillo', 3, 24], ['pitillo', 28, 3],
    ['sobras', 13, 2], ['mechero', 28, 15], ['botella', 2, 23],
  ],
};
