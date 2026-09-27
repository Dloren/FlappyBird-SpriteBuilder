// NIVEL 4 — CENA DE EMPRESA (restaurante con terraza y karaoke)
import { look, HAIR, SKIN } from './level.js';

// Traje de oficina para los compañeros de Pipi
const SUITS = ['#2e3440', '#232c48', '#44484f', '#3a3040', '#2f3d36'];
const TIES = ['#a83838', '#3858a8', '#c8a038', '#6a3a8a', '#2a7a5a'];
const suit = (i, o = {}) => look({ shirt: SUITS[i % SUITS.length], pants: SUITS[i % SUITS.length], tie: TIES[i % TIES.length], ...o });

export default {
  id: 'cena',
  name: 'CENA DE EMPRESA',
  intro: 'CENA DE NAVIDAD DE LA EMPRESA. BARRA LIBRE PAGADA POR RECURSOS HUMANOS. TU JEFE VA A DAR UN DISCURSO Y TÚ YA VAS TOCADO.',
  music: 'cena',
  palette: {
    ink: '#1c140c', wallTop: '#5a3a2a', wallFace: '#d8c0a0', wallLine: '#b89c7c',
    wood: '#a06838', woodDark: '#6a4020', woodLight: '#d09860', metal: '#a0a0b0', metalDark: '#383840',
    accent: '#2a7a4a', accent2: '#f0e0b8', leaf: '#489838', leafDark: '#2a6828', leafLight: '#80c860',
    stone: '#c8b898', stoneLight: '#e8dcc0', water: '#4890e0', waterLight: '#b8e0f8', screen: '#302030',
    car: '#3878c8', shadow: '#806850', void: '#140c10',
  },
  floors: {
    '.': ['checker', '#c8b494', '#b8a080'],
    ';': ['road', '#6a6470', '#585260', '#8a8490'],
    ':': ['tiles', '#b88868', '#a07050'],
    '_': ['stage', '#8a4a30', '#6a3420'],
    ',': ['carpet', '#7a2830', '#9a3a40', '#c8a038'],
  },
  floorUnder: { 'U': ':', '=': '.', 'K': ';', 'X': ';', 'x': ';' },
  map: [
    '####################################',
    '#;;;#######WWWWWWWWWWWWWW#######;;;#',
    '#;;;#####..S______________S.####;;;#',
    '#;;;#####..S______________S.####;;;#',
    '#K;;#####B..................B###;;;#',
    '#K;;#####....................###;;;#',
    '#K;;#####..UUU..........UUU..###;;;#',
    '#;;;#####..:::..........:::..###;;;#',
    '#;;;#####..===...n.n....===..###;;;#',
    '#;;;;;;;;....................###;;;#',
    '#;;;#####.........cYc........;;;;;;#',
    '#;;;#####....................###;;;#',
    '#;;;#####..UUU..........UUU..###;;;#',
    '#;;;#####..:::..........:::..###;;;#',
    '#;;;#####..===..........===..###;;;#',
    '#;;;;;;;;....................###;;;#',
    '#;;;#####B.....TTTTTTTT.....B###;;;#',
    '#;;;#####......TTTTTTTT......###;;;#',
    '#;;;#####......TTTTTTTT......;;;;;;#',
    '#;;;#####....................###;;K#',
    '#;;;#####..n....n....n....n..###;;K#',
    '#;;;#####O..O..O..O..O..O..O.###;;K#',
    '#;;;#####::::::::::::::::::::###;;;#',
    '#;;;###############;;###########;;;#',
    '#;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;#',
    '#;X;;;;;x;;;;;;;;;;;;;;;;;;x;;;;;X;#',
    '#;;X#####;;X#######;;######X;;######',
    '####################################',
  ],
  player: [18, 24],
  npcs: [
    {
      kind: 'A', role: 'coworker', name: 'F6',
      look: suit(0, { style: 'short', hair: HAIR.black, skin: SKIN[1] }),
      route: [[2, 5, 3, 'down'], [2, 20, 2], [10, 24, 3], [19, 23, 0], [19, 19, 2, 'up'], [12, 9, 3, 'up']],
    },
    {
      kind: 'A', role: 'coworker', name: 'F7',
      look: suit(1, { style: 'long', hair: HAIR.blond, skin: SKIN[0], body: 'dress' }),
      route: [[33, 3, 3, 'down'], [33, 22, 2], [27, 24, 2], [24, 20, 3, 'up'], [26, 11, 2], [33, 10, 0]],
    },
    ...[[18, 5], [22, 5], [14, 5], [18, 6]].map(([x, y], i) => ({
      kind: 'B', role: 'guest', behavior: 'dance', at: [x, y], dir: 'up',
      look: look({ style: ['bun', 'short', 'long', 'bald'][i], body: i % 2 ? 'normal' : 'dress', shirt: ['#e87838', '#58a8d8', '#f8f8f8', '#686868'][i], hair: [HAIR.grey, HAIR.black, HAIR.red, SKIN[2]][i], skin: SKIN[(i + 2) % 5] }),
    })),
    { kind: 'B', role: 'guest', behavior: 'static', at: [25, 15], dir: 'left', look: look({ style: 'bun', body: 'dress', shirt: '#282828', hair: HAIR.white }) },
    { kind: 'B', role: 'guest', behavior: 'static', at: [13, 11], dir: 'right', look: look({ shirt: '#486848', hair: HAIR.grey, body: 'belly', mustache: true }) },
    { kind: 'B', role: 'dog', name: 'CANELA', route: [[2, 12, 1], [10, 15, 1], [20, 15, 2], [28, 19, 0], [33, 24, 2], [8, 24, 1]], look: { dog: true, outline: '#2a1c14', fur: '#a86838', spot: '#f0d8b0' } },
    {
      kind: 'A', role: 'coworker', name: 'TONI',
      look: suit(2, { style: 'short', hair: HAIR.black, skin: SKIN[2], beard: true, body: 'belly' }),
      route: [[18, 5, 4, 'up'], [12, 9, 3, 'up'], [2, 10, 3, 'down'], [6, 15, 0], [17, 15, 3, 'up']],
    },
    {
      kind: 'A', role: 'coworker', name: 'MARI', label: 'AMIGA',
      look: suit(3, { style: 'long', hair: HAIR.red, skin: SKIN[0], body: 'dress' }),
      route: [[26, 9, 3, 'up'], [33, 10, 3, 'down'], [33, 18, 2], [26, 18, 0], [22, 11, 3, 'left']],
    },
    {
      kind: 'A', role: 'coworker', name: 'PACO',
      look: suit(4, { style: 'short', hair: HAIR.brown, skin: SKIN[1], glasses: true }),
      route: [[14, 22, 4, 'up'], [3, 24, 3, 'left'], [2, 15, 0], [10, 15, 2, 'right'], [22, 22, 3, 'up']],
    },
    {
      kind: 'A', role: 'partner', name: 'ANDREINA',
      look: look({ style: 'long', hair: HAIR.dark, skin: SKIN[1], body: 'dress' }),
      route: [[15, 11, 4, 'right'], [11, 9, 3, 'up'], [22, 20, 3, 'up'], [27, 15, 3, 'up'], [15, 11, 0]],
    },
    {
      kind: 'A', role: 'boss', name: 'JEFE', label: 'JEFE',
      look: look({ style: 'bald', hair: SKIN[1], skin: SKIN[1], body: 'belly', shirt: '#1e2230', pants: '#1e2230', tie: '#c8a038', glasses: true, mustache: true }),
      route: [[12, 20, 5, 'up'], [24, 24, 3], [32, 24, 3, 'up'], [24, 9, 2, 'up'], [12, 20, 0]],
    },
    // ---- Staff: camareros de los buffets y el encargado ----
    ...[[12, 7, 11], [25, 7, 24], [12, 13, 11], [25, 13, 24]].map(([x, y, zx], i) => ({
      kind: 'B', role: 'waiter', name: 'CAMARERO', worker: true, zone: [[zx, y, 3, 3]], behavior: 'guard', at: [x, y], dir: 'down',
      look: look({ style: ['short', 'bun', 'bald', 'long'][i], body: i % 2 ? 'dress' : 'belly', shirt: '#f8f8f8', pants: '#181818', bowtie: '#181818', hair: [HAIR.black, HAIR.grey, SKIN[2], HAIR.brown][i], skin: SKIN[i + 1] }),
    })),
    {
      kind: 'B', role: 'waiter', name: 'ENCARGADO', worker: true, zone: [[9, 9, 20, 3]],
      look: look({ style: 'short', shirt: '#181818', pants: '#181818', bowtie: '#a83838', hair: HAIR.black, badge: '#f8c838', body: 'belly', mustache: true }),
      route: [[10, 10, 3, 'right'], [28, 10, 3, 'left'], [30, 18, 0], [28, 19, 2, 'left'], [10, 19, 2, 'right']],
    },
    // ---- Karaoke ----
    { kind: 'B', role: 'band', behavior: 'dance', at: [14, 2], dir: 'down', look: look({ shirt: '#d83838', hair: HAIR.black, bowtie: '#181818' }) },
    { kind: 'B', role: 'band', behavior: 'dance', at: [19, 3], dir: 'down', look: look({ style: 'long', body: 'dress', shirt: '#f8c838', hair: HAIR.blond }) },
    { kind: 'B', role: 'band', behavior: 'dance', at: [24, 2], dir: 'down', look: look({ shirt: '#d83838', hair: HAIR.grey, bowtie: '#181818', body: 'belly' }) },
    // ---- Otros comensales ----
    ...[[13, 4], [16, 5], [20, 4], [23, 5], [11, 5], [26, 4], [15, 6], [21, 6]].map(([x, y], i) => ({
      kind: 'B', role: 'guest', behavior: 'dance', at: [x, y], dir: 'up',
      look: look({ style: ['short', 'bun', 'cap', 'long', 'bald'][i % 5], body: i % 2 ? 'dress' : 'normal', cap: '#58a048', shirt: ['#58a8d8', '#f8c838', '#58a048', '#a858a8', '#e87838', '#f8f8f8', '#3848a8', '#c83838'][i], hair: [HAIR.black, HAIR.grey, HAIR.brown, HAIR.blond, SKIN[2]][i % 5], skin: SKIN[i % 5] }),
    })),
    ...[[17, 9, 'down'], [19, 9, 'down'], [11, 21, 'up'], [22, 21, 'up']].map(([x, y, d], i) => ({
      kind: 'B', role: 'guest', behavior: 'static', at: [x, y], dir: d,
      look: look({ style: ['bald', 'bun', 'short', 'long'][i], body: i % 2 ? 'dress' : 'belly', shirt: ['#686868', '#282828', '#486848', '#b89838'][i], hair: [SKIN[1], HAIR.white, HAIR.grey, HAIR.black][i], skin: SKIN[i] }),
    })),
    { kind: 'B', role: 'guest', route: [[10, 15, 2], [28, 15, 2], [28, 19, 1], [10, 19, 1]], look: look({ shirt: '#8a7a5a', hair: HAIR.black, body: 'belly' }) },
    { kind: 'B', role: 'guest', route: [[28, 20, 1], [10, 20, 1], [10, 18, 0], [28, 18, 1]], look: look({ style: 'long', body: 'dress', shirt: '#6a2a34', hair: HAIR.blond }) },
  ],
  items: [
    ['pitillo', 1, 1], ['pitillo', 34, 1], ['pitillo', 10, 26], ['pitillo', 34, 25], ['pitillo', 9, 22],
    ['sobras', 10, 22], ['mechero', 32, 25],
  ],
};
