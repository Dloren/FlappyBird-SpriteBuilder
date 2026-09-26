import { CONFIG, TILE } from '../config.js';
import { findPath, tileCenter } from '../engine/path.js';
import { canSee, conePolygon } from '../engine/vision.js';
import { angleDiff, angleToDir, DIR_ANGLE, dist, pick, rand } from '../engine/util.js';
import { characterSheet } from '../assets/sprites.js';

const DIRS = ['down', 'up', 'left', 'right'];
const dirAngle = (d) => DIR_ANGLE[DIRS.indexOf(d)];

// Estados de NPC-A
export const S = {
  ROUTINE: 'routine', SUSPICIOUS: 'suspicious', SEARCH: 'search', ALERT: 'alert',
  INVESTIGATE: 'investigate', DISTRACTED: 'distracted', RETURN: 'return',
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
  get eyeY() { return this.y - 8; }

  say(text, t = 2.4) { this.speech = { text, t }; }

  inZone(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return this.zones.some(([x, y, w, h]) => tx >= x && ty >= y && tx < x + w && ty < y + h);
  }

  planTo(p) {
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
    if (this.waitT > 0) {
      this.waitT -= dt;
      this.moving = false;
      const wp = this.route[(this.routeIdx + this.route.length - 1) % this.route.length];
      if (wp.dir) this.turnTo(dirAngle(wp.dir), dt, 5);
      if (this.waitT <= 0) {
        this.planTo(this.route[this.routeIdx]);
      }
      return;
    }
    if (this.followPath(dt, this.speed)) {
      const wp = this.route[this.routeIdx];
      this.waitT = Math.max(0.01, wp.wait);
      this.routeIdx = (this.routeIdx + 1) % this.route.length;
    }
  }

  resumeRoutine() {
    this.state = S.RETURN;
    this.stateT = 0;
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
    return canSee(this.level, this.x, this.eyeY, this.angle, this.coneHalf, this.coneRange, tx, ty, game.occluders, this);
  }

  // ----------------- NPC-A -----------------
  updateA(dt, game) {
    const P = game.player;
    const D = CONFIG.detection;
    if (this.ignoreT > 0) this.ignoreT -= dt;
    this.stateT += dt;
    const visible = !game.playerHidden() && this.sees(game, P.x, P.cy);
    const d = dist(this.x, this.y, P.x, P.y);
    const immune = P.chicleT > 0;

    // 1) Pillado potando = GAME OVER
    if (P.isPuking && visible) { game.caught(this, 'puke'); return; }

    // 2) Aliento: NPC marcado y Pipi pegado a él
    if (this.marked && d < D.breathDistance) {
      if (immune) { this.marked = false; this.say(pick(['¡QUÉ ALIENTO A FRESA!', 'HUELES A CHICLE...', 'MMM, MENTA.'])); game.sfx('pickup'); }
      else { game.caught(this, 'breath'); return; }
    }
    if (this.marked && immune && d < 22) { this.marked = false; this.say('AH, NADA...'); }

    const canNotice = visible && !immune && this.ignoreT <= 0;
    const prox = 1.6 - Math.min(1, d / this.coneRange);
    const rateS = (prox / D.suspicionFill) * game.diff.suspicion;
    const rateA = (prox / D.alertFill) * game.diff.suspicion;

    switch (this.state) {
      case S.ROUTINE:
      case S.RETURN:
      case S.DISTRACTED: {
        if (canNotice) {
          this.state = S.SUSPICIOUS; this.stateT = 0; this.suspicion = Math.max(this.suspicion, 0.05);
          game.sfx('suspect');
          break;
        }
        this.suspicion = Math.max(0, this.suspicion - D.decay * dt);
        // ¿ve un charco o un rastro?
        const clue = game.findClue(this);
        if (clue) {
          this.state = S.INVESTIGATE; this.stateT = 0; this.target = clue; this.lookT = 0;
          this.planTo({ x: clue.x, y: clue.y - 2 });
          this.say(clue.kind === 'puddle' ? pick(['¿QUÉ ES ESO?', '¿ESO ES... POTA?', 'PUAJ, ¿Y ESTO?']) : '¿HUELLAS?');
          game.onSuspicion(this, 'clue');
          game.sfx('suspect');
          break;
        }
        if (this.state === S.ROUTINE) this.updateRoutine(dt);
        else if (this.state === S.RETURN) {
          if (this.followPath(dt, this.speed)) {
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
            this.say(pick(['¿PIPI?', '¿PIPI, ERES TÚ?', 'EH... ¿PIPI?']), 1.6);
          }
        } else {
          this.suspicion -= D.decay * dt;
          if (this.suspicion <= 0) { this.suspicion = 0; this.resumeRoutine(); }
        }
        break;
      }
      case S.SEARCH:
      case S.INVESTIGATE: {
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
            this.state = S.ALERT; this.stateT = 0; this.moving = false;
            game.onEscape(this);
            this.say(pick(['¿ESTÁS BIEN? TIENES MALA CARA', 'TÍO, ESTÁS BLANCO', '¿TE ENCUENTRAS BIEN?', 'VAYA OJERAS...']), 2.5);
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
          const limit = this.state === S.INVESTIGATE ? D.searchTime : D.lookAroundTime;
          if (this.lookT > limit) {
            if (this.state === S.INVESTIGATE) { this.marked = true; this.say('AQUÍ HAY ALGUIEN QUE HA POTADO...', 2); }
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
      default: break;
    }
  }

  lookAround(dt) {
    this.lookPhase = (this.lookPhase || 0) + dt;
    if (this.lookPhase > 0.8) { this.lookPhase = 0; this.lookTarget = this.angle + (Math.random() < 0.5 ? 1 : -1) * rand(1.2, 2.4); }
    if (this.lookTarget !== undefined) this.turnTo(this.lookTarget, dt, 5);
  }

  // Ruido de un objeto lanzado
  hearNoise(x, y) {
    if (this.kind !== 'A') return;
    if (this.state === S.ALERT || this.state === S.SEARCH) return;
    this.state = S.DISTRACTED;
    this.stateT = 0;
    this.distractEnd = Infinity; // se fija al llegar al punto del ruido
    this.planTo({ x, y: y - 2 });
    this.say(pick(['¿QUÉ HA SIDO ESO?', '¿EH?', '¿HOLA?']), 1.4);
  }

  // ----------------- NPC-B -----------------
  updateB(dt, game) {
    const P = game.player;
    if (this.reactT > 0) {
      this.reactT -= dt;
      this.moving = false;
      if (this.fleeAngle !== undefined) this.turnTo(this.fleeAngle, dt, 10);
      return;
    }
    if (this.worker || this.kind === 'B') {
      if (P.isPuking && !game.playerHidden() && this.sees(game, P.x, P.cy)) {
        if (this.worker && this.inZone(P.x, P.y)) { game.caught(this, 'staff'); return; }
        if (!game.reactedThisPuke.has(this)) {
          game.reactedThisPuke.add(this);
          this.say(pick(this.role === 'kid' ? ['¡MAMÁ, ESE SEÑOR HA POTADO!', '¡HALA, QUÉ ASCO!'] : this.role === 'dog' ? ['¡GUAU!', '¡GRRR!'] : ['¡QUÉ ASCO!', 'TÍO...', '¡MIS ZAPATILLAS!', '¡PUAJ!', 'MADRE MÍA...', '¡AL MENOS APUNTA!']), 2.2);
          this.reactT = 2.2;
          this.fleeAngle = Math.atan2(this.y - P.y, this.x - P.x);
          game.onEscape(this, true);
        }
      }
    }
    // rutina
    if (this.state === S.RETURN) {
      if (this.followPath(dt, this.speed)) {
        this.state = S.ROUTINE;
        if (this.behavior === 'route' && this.route.length) this.planTo(this.route[this.routeIdx]);
      }
    } else this.updateRoutine(dt);
  }

  update(dt, game) {
    if (!this.home) this.home = { x: this.x, y: this.y };
    if (this.kind === 'A') this.updateA(dt, game); else this.updateB(dt, game);
    if (this.speech) { this.speech.t -= dt; if (this.speech.t <= 0) this.speech = null; }
    // cono (sólo NPC-A y trabajadores)
    if (this.kind === 'A' || this.worker) {
      this.cone = conePolygon(this.level, this.x, this.eyeY, this.angle, this.coneHalf, this.coneRange, game.occluders, this);
    }
  }

  coneColor() {
    if (this.kind !== 'A') return '#f09030';
    switch (this.state) {
      case S.SUSPICIOUS: case S.INVESTIGATE: case S.DISTRACTED: return '#f8c030';
      case S.SEARCH: return '#f88030';
      case S.ALERT: return '#f83030';
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
