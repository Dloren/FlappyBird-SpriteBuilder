// ============================================================
//  PIPI POTTER — valores de balance centralizados
//  Todos los tiempos en segundos, distancias en píxeles del
//  mundo (resolución interna 160x144), ángulos en grados.
// ============================================================

export const SCREEN_W = 160;
export const SCREEN_H = 144;
export const HUD_H = 12;             // franja superior del HUD
export const VIEW_H = SCREEN_H - HUD_H;
export const TILE = 16;
export const FPS = 60;
export const STEP = 1 / FPS;

export const CONFIG = {
  player: {
    speed: 52,                 // px/s andando
    hitHalfW: 4, hitHalfH: 3,  // caja de colisión (pies)
    startItems: { chicle: 1 },
    chaseBoost: 1.25,          // Pipi corre un poco más si alguien le persigue
  },

  nausea: {
    fillTime: 30,              // 0 % → 100 %
    wobbleFrom: 0.75,          // a partir de aquí da tumbos
    wobbleTurn: 1.3,           // desviación máx. de dirección (rad)
    wobbleSpeedMin: 0.55, wobbleSpeedMax: 1.25,
    wobblePushChance: 0.9,     // empujones laterales por segundo
    wobblePush: 26,            // velocidad del empujón
  },

  puke: {
    holdTime: 2.0,             // mantener A
    autoTime: 1.4,             // pota automática al 100 %
    minNausea: 0.5,            // no se puede potar por debajo de esta náusea
    pukesToWin: 3,
    escapeCountdown: 10,       // tras la 3ª pota, aguanta 10 s sin que te pillen
    puddleRadius: 6,
  },

  trail: {
    duration: 15,              // segundos dejando huellas tras pisar un charco
    stepDist: 7,               // cada cuántos px se deja una huella
    fade: 8,                   // lo que tarda en borrarse cada huella (s)
  },

  vision: {
    rays: 22,
    halfAngle: 34,             // mitad de la apertura del cono
    npcBHalfAngle: 45,
    npcBRange: 38,             // NPC-B normales (no dibujan cono)
    workerRange: 56,           // camareros, porteros, seguridad
    occluderRadius: 5,         // radio de un NPC-B como obstáculo
    rayStep: 2,
  },

  detection: {
    suspicionFill: 1.1,        // s para llenar "?" a distancia media
    alertFill: 1.0,            // s para llenar "!" en búsqueda
    decay: 0.45,               // lo que baja por segundo fuera del cono
    searchTime: 5,             // búsqueda tras ver charco / rastro
    lookAroundTime: 3,         // búsqueda tras perder a Pipi
    ignoreAfterCatch: 5,       // tras una pillada zafada el NPC le ignora
    breathDistance: 13,        // "pegado a él" para oler el aliento
    npcBReactCooldown: 3,
    nauseaSuspicion: 0.5,      // NPC-A sólo sospechan si la náusea supera esto
    staffNauseaSuspicion: 0.75,// el staff, a partir de esto
    huntAfter: 15,             // s sin que ningún amigo te vea → salen a buscarte
    greetCooldown: 14,         // cada cuánto puede saludarte el mismo amigo (s)
    huntRepath: 3,
    hunters: 99,               // salen a buscarte todos los NPC-A disponibles
    chaseSpeedMul: 1.0,        // al correr ("!") van a la velocidad normal de Pipi
    chaseMax: 15,              // se cansan de perseguir
    chaseGiveUp: 3,            // s sin verte antes de rendirse
    catchDistance: 10,         // si llegan a esta distancia, te pillan
    lostSearchTime: 4,         // tras perderte en una persecución, buscan donde te vieron
    markedSpeedMul: 1.45,      // con "?" permanente (vieron una pota) van más rápido
    inspectEvery: [12, 24],    // cada cuánto se desvían a revisar una esquina lejana (s)
    inspectLook: 2.2,          // lo que se quedan mirando la esquina
    maxInspecting: 3,          // cuántos NPC-A a la vez revisando esquinas
  },

  items: {
    chicle: { duration: 30 },
    pitillo: { smokeTime: 2.5, pauseNausea: 10, cloudTime: 8, cloudRadius: 22 },
    sobras: { eatTime: 1.4, points: 400, nausea: 0.20 },
    mechero: { range: 80, speed: 150, noiseRadius: 70 },  // 5 tiles hacia delante
    botella: { range: 80, speed: 140, noiseRadius: 96 },
    distractTime: 2.5,         // lo que se quedan mirando el punto del ruido
  },

  score: {
    levelBase: 1000,           // x número de nivel
    timeBonusMax: 2500,
    timeBonusHalfLife: 45,     // cada 45 s el bonus se reduce a la mitad
    suspicionPenalty: 0.03,
    escapePenalty: 0.07,
    minFactor: 0.2,
    victoryBonus: 5000,
    pitilloBonus: 300,         // por cada piti conservado al acabar el nivel
    pitillosPerLevel: 5,
  },

  npcSpeed: { a: 30, b: 24, search: 40, dog: 50 },
};

// Dificultad por nivel (multiplicadores)
export const DIFFICULTY = [
  { coneRange: 60, suspicion: 1.0, nauseaMul: 1.0 },
  { coneRange: 66, suspicion: 1.1, nauseaMul: 1.0 },
  { coneRange: 70, suspicion: 1.2, nauseaMul: 1.05 },
  { coneRange: 74, suspicion: 1.3, nauseaMul: 1.1 },
  { coneRange: 80, suspicion: 1.45, nauseaMul: 1.15 },
];
