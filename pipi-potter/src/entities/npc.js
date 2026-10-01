import { CONFIG, TILE } from '../config.js';
import { findPath, tileCenter } from '../engine/path.js';
import { canSee, conePolygon } from '../engine/vision.js';
import { angleDiff, angleToDir, DIR_ANGLE, dist, pick, rand } from '../engine/util.js';
import { vibrate } from '../engine/input.js';
import { characterSheet } from '../assets/sprites.js';

const DIRS = ['down', 'up', 'left', 'right'];
const dirAngle = (d) => DIR_ANGLE[DIRS.indexOf(d)];

// Estados de NPC-A
const PEDO_LINES = ['¡VAYA PEDO LLEVAS!', 'VAS COMO LAS GRECAS', '¿ESTÁS BIEN? TIENES MALA CARA', '¿CUÁNTOS LLEVAS YA?',
  'VAS FINO FILIPINO, ¿EH?', 'ESTÁS MÁS BLANCO QUE LA PARED', 'VAS MÁS CIEGO QUE UN TOPO', 'TÍO, BEBE AGUA'];

export const S = {
  ROUTINE: 'routine', SUSPICIOUS: 'suspicious', SEARCH: 'search', ALERT: 'alert',
  INVESTIGATE: 'investigate', DISTRACTED: 'distracted', RETURN: 'return', HUNT: 'hunt', CHASE: 'chase', FOLLOW: 'follow', TRACK: 'track',
};

export class NPC {
  constructor(def, level, diff) {
    this.def = def;
    this.kind = def.kind;
    this.role = def.role;
    this.name = def.name || '';
    this.spec = def.look;
    this.worker = !!def.worker;
    this.zones = def.zone || [];
    this.behavior = def.behavior || (def.route ? 'route' : 'static');
    this.route = (def.route || []).map(([x, y, wait = 0, dir]) => ({ tx: x, ty: y, wait, dir }));
    const start = def.at || (this.route[0] ? [this.route[0].tx, this.route[0].ty] : [1, 1]);
    this.x = tileCenter(start[0]);
    this.y = tileCenter(start[1]) + 2;
    this.dir = def.dir || 'down';
    this.angle = dirAngle(this.dir);
    this.baseDir = this.dir;
    this.level = level;
    this.speed = this.kind === 'A' ? CONFIG.npcSpeed.a : CONFIG.npcSpeed.b;
    this.routeIdx = 0;
    this.path = null;
    this.pathIdx = 0;
    this.waitT = 0;
    this.animT = rand(0, 1);
    this.moving = false;
    this.state = S.ROUTINE;
    this.suspicion = 0;
    this.alert = 0;
    this.marked = false;
    this.ignoreT = 0;
    this.stateT = 0;
    this.target = null;
    this.lastSeen = null;
    this.speech = null;
    this.seen = new Set();
    this.reactT = 0;
    this.lookT = 0;
    this.danceT = rand(0, 1);
    this.coneRange = this.kind === 'A' ? diff.coneRange : this.worker ? CONFIG.vision.workerRange : CONFIG.vision.npcBRange;
    this.coneHalf = this.kind === 'A' ? CONFIG.vision.halfAngle : CONFIG.vision.npcBHalfAngle;
    this.cone = null;
    if (this.route.length > 1) this.planTo(this.route[1 % this.route.length]), (this.routeIdx = 1 % this.route.length);
    else if (this.route.length === 1) this.waitT = 999;
  }

  get cy() { return this.y - 6; }
  get walkSpeed() { return this.marked ? this.speed * CONFIG.detection.markedSpeedMul : this.speed; }
  get eyeY() { return this.y - 8; }

  say(text, t = 2.4) { this.speech = { text, t }; }

  inZone(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return this.zones.some(([x, y, w, h]) => tx >= x && ty >= y && tx < x + w && ty < y + h);
  }

  planTo(p) {
    if (!p) { this.path = []; this.pathIdx = 0; return; }
    const sx = Math.floor(this.x / TILE), sy = Math.floor(this.y / TILE);
    const tx = p.tx ?? Math.floor(p.x / TILE), ty = p.ty ?? Math.floor(p.y / TILE);
    this.path = findPath(this.level, sx, sy, tx, ty) || [];
    this.pathIdx = 0;
    // si el objetivo es un punto exacto (ruido/charco), añade el punto final
    if (p.x !== undefined && this.path.length) this.pathExact = { x: p.x, y: p.y + 2 };
    else this.pathExact = null;
  }

  // Avanza por el camino; devuelve true al llegar
  followPath(dt, speed) {
    if (!this.path || this.pathIdx >= this.path.length) { this.moving = false; return true; }
    const [tx, ty] = this.path[this.pathIdx];
    let gx = tileCenter(tx), gy = tileCenter(ty) + 2;
    if (this.pathIdx === this.path.length - 1 && this.pathExact && !this.level.isSolidAt(this.pathExact.x, this.pathExact.y)) {
      gx = this.pathExact.x; gy = this.pathExact.y;
    }
    const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
    const step = speed * dt;
    this.moving = true;
    if (d > 0.01) {
      const a = Math.atan2(dy, dx);
      this.turnTo(a, dt, 10);
    }
    if (d <= step) { this.x = gx; this.y = gy; this.pathIdx++; }
    else { this.x += (dx / d) * step; this.y += (dy / d) * step; }
    this.animT += dt;
    return this.pathIdx >= this.path.length;
  }

  turnTo(a, dt, rate = 6) {
    const d = angleDiff(this.angle, a);
    const m = rate * dt;
    this.angle += Math.abs(d) < m ? d : Math.sign(d) * m;
    this.dir = DIRS[angleToDir(this.angle)];
  }

  // Rutina por waypoints
  updateRoutine(dt) {
    if (this.behavior === 'dance') {
      this.danceT += dt;
      this.moving = false;
      if (this.danceT > 0.9) { this.danceT = 0; this.angle = dirAngle(pick(DIRS)); this.dir = DIRS[angleToDir(this.angle)]; }
      return;
    }
    if (this.behavior === 'static' || this.behavior === 'guard') {
      this.moving = false;
      this.lookT -= dt;
      if (this.lookT <= 0) {
        this.lookT = this.behavior === 'guard' ? rand(1.5, 3) : rand(3, 6);
        const opts = this.behavior === 'guard' ? ['left', 'right', 'down', this.baseDir] : [this.baseDir, this.baseDir, pick(DIRS)];
        this.targetAngle = dirAngle(pick(opts));
      }
      if (this.targetAngle !== undefined) this.turnTo(this.targetAngle, dt, 5);
      return;
    }
    if (!this.route.length) return;
    if (this.inspect) {
      // revisando una esquina / zona lejana
      const ins = this.inspect;
      if (ins.phase === 'go') {
        if (this.followPath(dt, this.walkSpeed)) { ins.phase = 'look'; ins.t = 0; }
        return;
      }
      ins.t += dt;
      this.moving = false;
      this.lookAround(dt);
      if (ins.t > CONFIG.detection.inspectLook) { this.inspect = null; this.planTo(this.route[this.routeIdx]); }
      return;
    }
    if (this.waitT > 0) {
      this.waitT -= dt;
      this.moving = false;
      const wp = this.route[(this.routeIdx + this.route.length - 1) % this.route.length];
      if (wp.dir) this.turnTo(dirAngle(wp.dir), dt, 5);
      else if (wp.wait > 1) this.lookAround(dt);
      if (this.waitT <= 0) {
        const spot = this.kind === 'A' && this.inspectT <= 0 && this.game ? this.game.pickInspectSpot(this) : null;
        if (spot) {
          this.inspectT = rand(...CONFIG.detection.inspectEvery);
          this.inspect = { phase: 'go', t: 0 };
          this.planTo({ tx: spot[0], ty: spot[1] });
          if (Math.random() < 0.4) this.say(pick(['VOY A ECHAR UN OJO...', '¿Y POR AQUÍ?', 'A VER QUÉ HAY AHÍ']), 1.5);
        } else this.planTo(this.route[this.routeIdx]);
      }
      return;
    }
    if (this.followPath(dt, this.walkSpeed)) {
      const wp = this.route[this.routeIdx];
      this.waitT = Math.max(0.01, wp.wait);
      this.routeIdx = (this.routeIdx + 1) % this.route.length;
    }
  }

  resumeRoutine() {
    this.state = S.RETURN;
    this.stateT = 0;
    this.inspect = null;
    this.afterChase = false;
    if (this.behavior === 'route' && this.route.length) {
      const wp = this.route[(this.routeIdx + this.route.length - 1) % this.route.length];
      this.planTo(wp);
    } else {
      const h = this.home || { x: this.x, y: this.y };
      this.planTo({ x: h.x, y: h.y - 2 });
    }
  }

  // Comprueba si ve un punto (usa oclusores de la partida)
  sees(game, tx, ty) {
    return canSee(this.level, this.x, this.eyeY, this.angle, this.coneHalf, this.coneRange, tx, ty, this.nearOccluders(game), this);
  }

  // Oclusores (NPC-B) al alcance de su vista; se cachea por frame
  nearOccluders(game) {
    if (this._occFrame === game.frame) return this._occ;
    const r = this.coneRange + 8;
    this._occ = game.occluders.filter((o) => o !== this && Math.abs(o.x - this.x) < r && Math.abs(o.cy - this.eyeY) < r);
    this._occFrame = game.frame;
    return this._occ;
  }

  // ----------------- NPC-A (y staff) -----------------
  // El staff (camareros, porteros, seguridad, municipales) usa la misma
  // máquina de estados pero sólo vigila su zona y sospecha a partir del 75 %.
  get isStaff() { return this.kind !== 'A' && this.worker; }

  staffCares(P) {
    // zona de trabajo ampliada 1 tile
    const tx = Math.floor(P.x / TILE), ty = Math.floor(P.y / TILE);
    return this.zones.some(([x, y, w, h]) => tx >= x - 1 && ty >= y - 1 && tx < x + w + 1 && ty < y + h + 1);
  }

  updateA(dt, game) {
    const P = game.player;
    const D = CONFIG.detection;
    const staff = this.isStaff;
    if (this.ignoreT > 0) this.ignoreT -= dt;
    this.stateT += dt;
    const visible = !game.playerHidden() && this.sees(game, P.x, P.cy);
    const d = dist(this.x, this.y, P.x, P.y);
    const immune = P.chicleT > 0;
    if (visible && !staff) game.friendSawPlayer(this);
    if (visible) this.lastSawPipi = game.time;
    if (this.greetCD > 0) this.greetCD -= dt;

    // 0) Últimos 10 s tras la 3ª pota: si le ven, le siguen con "?" (sin "!");
    //    sólo es GAME OVER si le tocan (le pillan por las manchas de la camiseta)
    if (!staff && game.escapeT !== null && this.state !== S.CHASE && (visible || this.state === S.FOLLOW)) {
      this.updateFollow(dt, game, visible, d);
      return;
    }

    // 0b) Hay un NPC-A persiguiendo a Pipi ("!"): si ve a Pipi corriendo o ve correr
    //     al perseguidor, se une a la persecución
    if (!staff && this.state !== S.CHASE && game.chasers.length) {
      const lead = game.chasers.find((c) => c !== this && !c.isStaff);
      if (lead && (visible || (game.chaseSeenPrev && this.sees(game, lead.x, lead.cy)))) {
        if (this.state === S.HUNT) game.endHunt(this);
        this.chaseWhy = lead.chaseWhy;
        this.startChase(game, 'again');
        return;
      }
    }

    // 1) Le ven potando, o le ven a él y a una pota a la vez → "!" y a por él
    if (visible && this.state !== S.CHASE) {
      const witness = P.isPuking || game.puddleSeenBy(this);
      if (witness) {
        if (!staff || this.inZone(P.x, P.y) || this.staffCares(P)) {
          this.startChase(game, P.isPuking ? 'puke' : 'puddle');
          return;
        }
        if (P.isPuking) this.reactToPuke(game, P);
      }
    }

    // 2) Aliento: NPC marcado y Pipi pegado a él
    if (!staff && this.marked && d < D.breathDistance) {
      if (immune) { this.marked = false; this.say(pick(['¡QUÉ ALIENTO A FRESA!', 'HUELES A CHICLE...', 'MMM, MENTA.'])); game.sfx('pickup'); }
      else { game.caught(this, 'breath'); return; }
    }
    if (!staff && this.marked && immune && d < 22) { this.marked = false; this.say('AH, NADA...'); }

    // Sólo sospechan si Pipi tiene mala cara (náusea alta)
    const threshold = staff ? D.staffNauseaSuspicion : D.nauseaSuspicion;
    const looksBad = P.nausea >= threshold || P.isPuking;
    const canNotice = visible && looksBad && !immune && this.ignoreT <= 0 && (!staff || this.staffCares(P));
    const prox = 1.6 - Math.min(1, d / this.coneRange);
    const rateS = (prox / D.suspicionFill) * game.diff.suspicion;
    const rateA = (prox / D.alertFill) * game.diff.suspicion;

    switch (this.state) {
      case S.ROUTINE:
      case S.RETURN:
      case S.DISTRACTED:
      case S.HUNT: {
        if (canNotice) {
          if (this.state === S.HUNT) game.endHunt(this);
          this.state = S.SUSPICIOUS; this.stateT = 0; this.suspicion = Math.max(this.suspicion, 0.05);
          game.sfx('suspect');
          break;
        }
        if (this.state === S.HUNT && visible) {
          // le han encontrado y tiene buena cara: todo en orden
          this.say(pick(['¡AHÍ ESTÁS, PIPI!', '¿DÓNDE TE METÍAS?', '¡PIPI! TE ESTÁBAMOS BUSCANDO']), 2);
          game.endHunt(this);
          this.resumeRoutine();
          break;
        }
        this.suspicion = Math.max(0, this.suspicion - D.decay * dt);
        // Saludo: sólo amigos y compañeros, y sólo si Pipi va "normal"
        if (visible && (this.role === 'friend' || this.role === 'coworker') && (this.state === S.ROUTINE || this.state === S.RETURN)
          && !(this.greetCD > 0) && !this.marked && P.nausea < D.nauseaSuspicion && !P.isPuking && !(P.trailT > 0)
          && game.escapeT === null && !game.pipiSuspected) {
          this.say(pick(['¡PIPS!', '¿QUÉ PASA, PIPI?', 'PIPI', '¡ESE PINA!', '¿QUÉ PASA, BRO?']), 1.6);
          this.greetCD = D.greetCooldown;
        }
        // ¿ve un charco o un rastro?
        const clue = game.findClue(this);
        if (clue && clue.kind === 'trail' && !staff) {
          if (this.state === S.HUNT) game.endHunt(this);
          this.startTrack(game, clue);
          break;
        }
        if (clue) {
          if (this.state === S.HUNT) game.endHunt(this);
          this.investigateAt(clue.x, clue.y, clue.kind === 'puddle' ? pick(['¿QUÉ ES ESO?', '¿ESO ES... POTA?', 'PUAJ, ¿Y ESTO?']) : '¿HUELLAS?');
          game.onSuspicion(this, 'clue');
          game.sfx('suspect');
          break;
        }
        if (this.state === S.ROUTINE) this.updateRoutine(dt);
        else if (this.state === S.RETURN) {
          if (this.followPath(dt, this.walkSpeed)) {
            this.state = S.ROUTINE;
            if (this.behavior === 'route') this.planTo(this.route[this.routeIdx]);
            else { this.angle = dirAngle(this.baseDir); this.dir = this.baseDir; }
          }
        } else if (this.state === S.DISTRACTED) {
          if (this.path && this.pathIdx < this.path.length) this.followPath(dt, CONFIG.npcSpeed.search);
          else {
            this.moving = false;
            if (this.distractEnd === Infinity) this.distractEnd = this.stateT + CONFIG.items.distractTime;
            this.lookAround(dt);
            if (this.stateT > this.distractEnd) this.resumeRoutine();
          }
        } else if (this.state === S.HUNT) {
          // salen a buscar a Pipi por donde anda (aproximadamente)
          this.huntRepath -= dt;
          if (this.huntRepath <= 0) {
            this.huntRepath = D.huntRepath;
            this.planTo({ x: P.x + rand(-24, 24), y: P.y + rand(-24, 24) });
          }
          if (this.path && this.pathIdx < this.path.length) this.followPath(dt, CONFIG.npcSpeed.search);
          else { this.moving = false; this.lookAround(dt); }
          const informed = game.npcs.find((o) => o !== this && o.kind === 'A' && o.lastSawPipi > this.huntStart && this.sees(game, o.x, o.cy));
          if (informed) {
            this.say(pick(['AH, ¿YA HA APARECIDO?', '¿LO HABÉIS VISTO? VALE.', 'VALE, YA ESTÁ LOCALIZADO']), 1.8);
            game.endHunt(this);
            this.resumeRoutine();
          }
        }
        break;
      }
      case S.SUSPICIOUS: {
        this.moving = false;
        if (canNotice) {
          this.turnTo(Math.atan2(P.cy - this.eyeY, P.x - this.x), dt, 8);
          this.suspicion += rateS * dt;
          this.lastSeen = { x: P.x, y: P.y };
          if (this.suspicion >= 1) {
            this.suspicion = 1;
            this.state = S.SEARCH; this.stateT = 0; this.alert = 0; this.lookT = 0; this.searchPlanned = false; this.path = null;
            game.onSuspicion(this, 'seen');
            this.say(staff ? pick(['OYE, TÚ...', '¿ESTÁS BIEN, CHAVAL?']) : pick(['¿PIPI?', '¿PIPI, ERES TÚ?', 'EH... ¿PIPI?']), 1.6);
          }
        } else {
          this.suspicion -= D.decay * dt;
          if (this.suspicion <= 0) { this.suspicion = 0; this.resumeRoutine(); }
        }
        break;
      }
      case S.TRACK: {
        this.updateTrack(dt, game, d);
        break;
      }
      case S.SEARCH:
      case S.INVESTIGATE: {
        if (this.state === S.INVESTIGATE && !staff && !visible) {
          const tr = game.findClue(this);
          if (tr && tr.kind === 'trail') { this.startTrack(game, tr); break; }
        }
        if (this.afterChase && visible && (!staff || this.staffCares(P))) { this.startChase(game, this.chaseWhy || 'again'); break; }
        if (canNotice) {
          this.lastSeen = { x: P.x, y: P.y };
          this.searchPlanned = false;
          this.lookT = 0;
          this.alert += rateA * dt;
          this.turnTo(Math.atan2(P.cy - this.eyeY, P.x - this.x), dt, 8);
          if (d > 18) {
            if (!this.chaseRepath || this.chaseRepath <= 0) { this.planTo({ x: P.x, y: P.y }); this.chaseRepath = 0.5; }
            this.chaseRepath -= dt;
            this.followPath(dt, CONFIG.npcSpeed.search * 0.6);
          } else this.moving = false;
          if (this.alert >= 1) {
            // sólo le ven con mala cara: comentario, penalización y sigue su camino
            this.state = S.ALERT; this.stateT = 0; this.moving = false;
            game.onEscape(this);
            this.say(staff ? pick(['CHAVAL, TÚ YA NO BEBES MÁS', 'OJITO, QUE TE VIGILO', 'EL SIGUIENTE, AGUA']) : pick(PEDO_LINES), 2.5);
          }
          break;
        }
        this.alert = Math.max(0, this.alert - D.decay * 0.5 * dt);
        if (this.state === S.SEARCH && this.lastSeen && !this.searchPlanned) { this.planTo(this.lastSeen); this.searchPlanned = true; }
        if (this.path && this.pathIdx < this.path.length) {
          this.followPath(dt, CONFIG.npcSpeed.search);
          this.lookT = 0;
        } else {
          this.moving = false;
          this.lookAround(dt);
          this.lookT += dt;
          const limit = this.state === S.INVESTIGATE ? D.searchTime : this.afterChase ? D.lostSearchTime : D.lookAroundTime;
          if (this.lookT > limit) {
            if (this.state === S.INVESTIGATE && !staff) { this.marked = true; this.say('AQUÍ HAY ALGUIEN QUE HA POTADO...', 2); }
            this.suspicion = 0; this.alert = 0;
            this.resumeRoutine();
          }
        }
        break;
      }
      case S.ALERT: {
        this.moving = false;
        this.turnTo(Math.atan2(P.cy - this.eyeY, P.x - this.x), dt, 8);
        if (this.stateT > 2.2) {
          this.suspicion = 0; this.alert = 0; this.ignoreT = D.ignoreAfterCatch;
          this.resumeRoutine();
        }
        break;
      }
      case S.CHASE: {
        // "!": corre hacia Pipi; sólo es GAME OVER si le alcanza.
        // Los perseguidores comparten la vista: mientras uno le vea, todos saben dónde está
        if (visible && !staff) game.chaseSeenNow = true;
        const groupSees = visible || (!staff && game.chaseSeenPrev);
        if (groupSees && (!staff || this.staffCares(P))) {
          this.lastSeen = { x: P.x, y: P.y };
          this.lostT = 0;
          this.lostPlanned = false;
          this.chaseRepath -= dt;
          if (this.chaseRepath <= 0 || !this.path || this.pathIdx >= this.path.length) { this.planTo({ x: P.x, y: P.y }); this.chaseRepath = 0.3; }
        } else {
          this.lostT += dt;
          if (!this.lostPlanned && this.lastSeen) { this.planTo(this.lastSeen); this.lostPlanned = true; }
        }
        const running = this.path && this.pathIdx < this.path.length;
        if (running) this.followPath(dt, CONFIG.player.speed * D.chaseSpeedMul);
        else this.moving = false;
        if (d < D.catchDistance) { game.caught(this, staff ? 'staff' : 'chase'); return; }
        if (this.stateT > D.chaseMax) {
          this.chaseWhy = null;
          this.say(pick(['UF... QUÉ RÁPIDO...', 'NO PUEDO MÁS...']), 2);
          game.onEscape(this);
          this.suspicion = 0; this.alert = 0; this.ignoreT = D.ignoreAfterCatch;
          this.resumeRoutine();
          break;
        }
        const tooFar = staff && !this.staffCares(P) && this.stateT > 1;
        if ((this.lostT > 0 && !running) || this.lostT > D.chaseGiveUp * 2 || tooFar) {
          // le ha perdido de vista: se queda buscando donde le vio por última vez ("?")
          this.say(pick(['¿DÓNDE SE HA METIDO?', 'SE ME HA ESCAPADO...', 'ESTABA AQUÍ MISMO...']), 2);
          game.onEscape(this);
          game.onChaseLost(this);
          this.state = S.SEARCH; this.stateT = 0; this.lookT = 0; this.alert = 0; this.suspicion = 1;
          this.searchPlanned = true; this.path = null; this.afterChase = true;
        }
        break;
      }
      default: break;
    }
  }

  // ----- Seguir a Pipi en los 10 s finales ("?", sin persecución) -----
  updateFollow(dt, game, visible, d) {
    const P = game.player;
    if (this.state !== S.FOLLOW) {
      if (this.state === S.HUNT) game.endHunt(this);
      this.inspect = null;
      this.state = S.FOLLOW; this.stateT = 0; this.lostT = 0; this.followRepath = 0; this.lostPlanned = false;
      this.say(pick(['¿PIPI? ¿QUÉ LLEVAS EN LA CAMISETA?', 'PIPI, VEN UN MOMENTO...', '¿ESO ES... POTA?', 'PIPI, ¿ESTÁS BIEN?']), 2);
      game.sfx('suspect');
    }
    if (visible) {
      this.lastSeen = { x: P.x, y: P.y };
      this.lostT = 0; this.lostPlanned = false;
      this.followRepath -= dt;
      if (this.followRepath <= 0 || !this.path || this.pathIdx >= this.path.length) { this.planTo({ x: P.x, y: P.y }); this.followRepath = 0.4; }
    } else {
      this.lostT += dt;
      if (!this.lostPlanned && this.lastSeen) { this.planTo(this.lastSeen); this.lostPlanned = true; }
    }
    if (this.path && this.pathIdx < this.path.length) this.followPath(dt, CONFIG.npcSpeed.search);
    else { this.moving = false; this.lookAround(dt); }
    if (d < CONFIG.detection.catchDistance) { game.caught(this, 'stains'); return; }
    if (this.lostT > CONFIG.detection.lostSearchTime) this.resumeRoutine();
  }

  // ----- Rastro de huellas de pota: lo siguen hacia Pipi -----
  startTrack(game, fp) {
    this.state = S.TRACK; this.stateT = 0; this.inspect = null;
    this.trackFp = fp;
    this.planTo({ x: fp.x, y: fp.y });
    this.say(pick(['¿HUELLAS DE... POTA?', 'ESTAS PISADAS HUELEN RARO...', 'A VER A DÓNDE LLEVA ESTO']), 1.8);
    game.onSuspicion(this, 'trail');
    game.sfx('suspect');
  }

  updateTrack(dt, game, d) {
    const fps = game.footprints;
    const cur = this.trackFp;
    const reached = !cur || cur.life <= 0 || !this.path || this.pathIdx >= this.path.length;
    if (reached) {
      // siguiente huella del rastro: la siguiente más nueva y cercana
      const from = cur || this;
      const i = cur ? fps.indexOf(cur) : -1;
      let next = null;
      for (let j = i + 1; j < fps.length; j++) {
        const f = fps[j];
        if (f.life > 0.3 && dist(f.x, f.y, from.x, from.y) < 40) { next = f; break; }
      }
      if (!next && i < 0) next = fps.find((f) => f.life > 0.3 && dist(f.x, f.y, this.x, this.y) < 40) || null;
      if (!next) {
        // el rastro desaparece: mismo estado que al ver una pota
        this.investigateAt(this.x, this.y, pick(['EL RASTRO SE ACABA AQUÍ...', '¿POR DÓNDE HA IDO?', 'AQUÍ SE PIERDE...']));
        return;
      }
      this.trackFp = next;
      this.planTo({ x: next.x, y: next.y });
    }
    this.followPath(dt, CONFIG.npcSpeed.search);
    if (d < CONFIG.detection.catchDistance) game.caught(this, 'trail');
  }

  startChase(game, why) {
    if (why !== 'again') this.chaseWhy = why;
    this.state = S.CHASE; this.stateT = 0; this.lostT = 0; this.chaseRepath = 0; this.lostPlanned = false;
    this.lastSeen = { x: game.player.x, y: game.player.y };
    this.say(this.isStaff ? pick(['¡EH, TÚ! ¡VEN AQUÍ!', '¡QUIETO AHÍ!']) : why === 'puddle' ? pick(['¡HAS SIDO TÚ, PIPI!', '¡ESA POTA ES TUYA!', '¡PIPI, GUARRO!']) : pick(['¡PIPI! ¡TE HE VISTO!', '¡A POR ÉL!', '¡PIPI ESTÁ POTANDO!']), 1.8);
    game.sfx('alert');
    vibrate(80);
  }

  investigateAt(x, y, text) {
    this.state = S.INVESTIGATE; this.stateT = 0; this.lookT = 0;
    this.target = { x, y };
    this.planTo({ x, y: y - 2 });
    if (text) this.say(text);
  }

  startHunt() {
    this.state = S.HUNT; this.stateT = 0; this.huntRepath = 0;
    this.say(pick(['¿DÓNDE SE HA METIDO PIPI?', 'VOY A BUSCAR A PIPI', '¿ALGUIEN HA VISTO A PIPI?']), 2.2);
  }

  lookAround(dt) {
    this.lookPhase = (this.lookPhase || 0) + dt;
    if (this.lookPhase > 0.8) { this.lookPhase = 0; this.lookTarget = this.angle + (Math.random() < 0.5 ? 1 : -1) * rand(1.2, 2.4); }
    if (this.lookTarget !== undefined) this.turnTo(this.lookTarget, dt, 5);
  }

  // Ruido de un objeto lanzado
  hearNoise(x, y) {
    if (this.kind !== 'A') return;
    if (this.state === S.CHASE || this.state === S.SEARCH) return;
    this.state = S.DISTRACTED;
    this.stateT = 0;
    this.distractEnd = Infinity; // se fija al llegar al punto del ruido
    this.planTo({ x, y: y - 2 });
    this.say(pick(['¿QUÉ HA SIDO ESO?', '¿EH?', '¿HOLA?']), 1.4);
  }

  reactToPuke(game, P) {
    if (game.reactedThisPuke.has(this)) return;
    game.reactedThisPuke.add(this);
    this.say(pick(this.role === 'kid' ? ['¡MAMÁ, ESE SEÑOR HA POTADO!', '¡HALA, QUÉ ASCO!'] : ['¡QUÉ ASCO!', 'TÍO...', '¡MIS ZAPATILLAS!', '¡PUAJ!', 'MADRE MÍA...', '¡AL MENOS APUNTA!']), 2.2);
    this.reactT = 2.2;
    this.fleeAngle = Math.atan2(this.y - P.y, this.x - P.x);
    game.onEscape(this, true);
  }

  // ----------------- NPC-B -----------------
  updateB(dt, game) {
    const P = game.player;
    if (this.role === 'dog') { this.updateDog(dt, game); return; }
    if (this.reactT > 0) {
      this.reactT -= dt;
      this.moving = false;
      if (this.fleeAngle !== undefined) this.turnTo(this.fleeAngle, dt, 10);
      return;
    }
    if (P.isPuking && !game.playerHidden() && this.sees(game, P.x, P.cy)) this.reactToPuke(game, P);
    // rutina
    if (this.state === S.RETURN) {
      if (this.followPath(dt, this.speed)) {
        this.state = S.ROUTINE;
        if (this.behavior === 'route' && this.route.length) this.planTo(this.route[this.routeIdx]);
      }
    } else this.updateRoutine(dt);
  }

  // Perro chivato: si ve potar a Pipi, ladra, va a buscar al NPC-A más
  // cercano y lo trae hasta donde le vio potar.
  updateDog(dt, game) {
    const P = game.player;
    this.stateT += dt;
    if (this.fetch) {
      const f = this.fetch;
      this.barkT -= dt;
      if (this.barkT <= 0) { this.barkT = 1.1; this.say(pick(['¡GUAU! ¡GUAU!', '¡GUAU!', '¡GRRR, GUAU!']), 1); game.sfx('bark'); }
      if (f.phase === 'toNpc') {
        f.repath -= dt;
        if (f.repath <= 0) { this.planTo({ x: f.npc.x, y: f.npc.y - 2 }); f.repath = 0.5; }
        this.followPath(dt, CONFIG.npcSpeed.dog);
        if (dist(this.x, this.y, f.npc.x, f.npc.y) < 16 || this.stateT > 20) {
          if (f.npc.state !== S.CHASE) {
            f.npc.investigateAt(f.x, f.y, pick([`¿QUÉ PASA, ${this.name}?`, '¿QUÉ HAS VISTO, BONITO?', '¿ME QUIERES ENSEÑAR ALGO?']));
            game.onSuspicion(f.npc, 'dog');
          }
          f.phase = 'lead';
          this.planTo({ x: f.x, y: f.y - 2 });
        }
      } else if (f.phase === 'lead') {
        // va delante del NPC, esperándole si se adelanta mucho
        const far = dist(this.x, this.y, f.npc.x, f.npc.y) > 40;
        if (!far && this.followPath(dt, CONFIG.npcSpeed.search)) { f.phase = 'wait'; this.stateT = 0; }
        else if (far) this.moving = false;
      } else if (this.stateT > 3) {
        this.fetch = null; this.speech = null;
        this.resumeRoutine();
      } else { this.moving = false; this.lookAround(dt); }
      return;
    }
    if (P.isPuking && !game.playerHidden() && !game.reactedThisPuke.has(this) && this.sees(game, P.x, P.cy)) {
      game.reactedThisPuke.add(this);
      const npc = game.nearestFriend(this.x, this.y);
      if (npc) {
        this.fetch = { npc, x: P.x, y: P.y, phase: 'toNpc', repath: 0 };
        this.stateT = 0; this.barkT = 0;
        game.float('¡EL PERRO TE HA VISTO!', P.x, P.y - 24, '#f08830');
        return;
      }
    }
    if (this.state === S.RETURN) {
      if (this.followPath(dt, this.speed)) {
        this.state = S.ROUTINE;
        if (this.behavior === 'route' && this.route.length) this.planTo(this.route[this.routeIdx]);
      }
    } else this.updateRoutine(dt);
  }

  update(dt, game) {
    if (!this.home) this.home = { x: this.x, y: this.y };
    this.game = game;
    if (this.inspectT === undefined) this.inspectT = rand(4, CONFIG.detection.inspectEvery[1]);
    this.inspectT -= dt;
    if (this.reactT > 0 && this.isStaff) { this.reactT -= dt; this.moving = false; }
    else if (this.kind === 'A' || this.worker) this.updateA(dt, game); else this.updateB(dt, game);
    if (this.speech) { this.speech.t -= dt; if (this.speech.t <= 0) this.speech = null; }
    // cono (sólo NPC-A y trabajadores)
    if ((this.kind === 'A' || this.worker) && game.nearView(this.x, this.y, this.coneRange + 8)) {
      this.cone = conePolygon(this.level, this.x, this.eyeY, this.angle, this.coneHalf, this.coneRange, this.nearOccluders(game), this);
    } else this.cone = null;
  }

  coneColor() {
    if (this.state === S.CHASE) return '#f83030';
    if (this.kind !== 'A' && (this.state === S.ROUTINE || this.state === S.RETURN)) return '#f09030';
    switch (this.state) {
      case S.SUSPICIOUS: case S.INVESTIGATE: case S.DISTRACTED: return '#f8c030';
      case S.SEARCH: return '#f88030';
      case S.HUNT: return '#f8a8e0';
      case S.FOLLOW: case S.TRACK: return '#f8c030';
      case S.ALERT: return '#f8d030';
      default: return this.marked ? '#f8e070' : '#f8f0c0';
    }
  }

  draw(ctx, cam, time) {
    const sheet = characterSheet(this.spec);
    let step = 0, oy = 0;
    if (this.moving) step = 1 + (Math.floor(this.animT * 7) % 2);
    if (this.behavior === 'dance' && this.state === S.ROUTINE && !this.moving) {
      oy = Math.floor((time * 4 + this.danceT * 3 + this.x) % 2) ? -1 : 0;
      step = Math.floor(time * 4 + this.x) % 3;
    }
    const di = DIRS.indexOf(this.dir);
    const sx = Math.round(this.x - 8 - cam.x), sy = Math.round(this.y - 14 - cam.y + oy);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx + 3, sy + 15 - oy, 10, 2);
    ctx.drawImage(sheet, step * 16, di * 16, 16, 16, sx, sy, 16, 16);
  }
}
