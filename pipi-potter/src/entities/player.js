import { CONFIG, TILE } from '../config.js';
import { input } from '../engine/input.js';
import { clamp, smoothNoise, DIR_ANGLE, angleToDir, rand } from '../engine/util.js';
import { characterSheet, pipiSpec } from '../assets/sprites.js';

const DIRS = ['down', 'up', 'left', 'right'];

export class Player {
  constructor(tx, ty, inventory) {
    this.x = tx * TILE + TILE / 2;
    this.y = ty * TILE + TILE / 2 + 2;
    this.dir = 'up';
    this.angle = -Math.PI / 2;
    this.moving = false;
    this.animT = 0;
    this.state = 'free';   // free | puking | autopuke | smoking | eating | aiming
    this.actionT = 0;
    this.actionDur = 0;
    this.nausea = 0;
    this.nauseaPause = 0;
    this.chicleT = 0;
    this.trailT = 0;
    this.trailAcc = 0;
    this.inventory = inventory;
    this.equipped = Object.keys(inventory).find((k) => inventory[k] > 0) || null;
    this.noiseA = smoothNoise();
    this.noiseS = smoothNoise();
    this.push = { x: 0, y: 0 };
    this.wobbleX = 0;
    this.stepSfxAcc = 0;
    this.needRelease = false;
    this.hw = CONFIG.player.hitHalfW;
    this.hh = CONFIG.player.hitHalfH;
  }

  get busy() { return this.state !== 'free'; }
  get isPuking() { return this.state === 'puking' || this.state === 'autopuke'; }
  get eyeY() { return this.y - 6; }
  get cy() { return this.y - 5; }

  wobbling() { return this.nausea >= CONFIG.nausea.wobbleFrom; }

  update(dt, game) {
    const N = CONFIG.nausea;
    // --- Náusea ---
    if (this.nauseaPause > 0) this.nauseaPause -= dt;
    else if (!this.isPuking) this.nausea = clamp(this.nausea + (dt / N.fillTime) * game.diff.nauseaMul, 0, 1);
    if (this.chicleT > 0) this.chicleT -= dt;
    if (this.trailT > 0) this.trailT -= dt;

    // Pota automática al 100 %
    if (this.nausea >= 1 && !this.isPuking && this.state !== 'aiming') {
      this.startPuke(game, true);
    }

    switch (this.state) {
      case 'free': this.updateFree(dt, game); break;
      case 'puking':
        this.moving = false;
        if (!input.down.a) { this.state = 'free'; this.needRelease = false; game.onPukeCancel(); break; }
        this.actionT += dt;
        game.onPuking(dt, this);
        if (this.actionT >= this.actionDur) this.finishPuke(game);
        break;
      case 'autopuke':
        this.moving = false;
        this.actionT += dt;
        game.onPuking(dt, this);
        if (this.actionT >= this.actionDur) this.finishPuke(game);
        break;
      case 'smoking':
      case 'eating':
        this.moving = false;
        this.actionT += dt;
        if (this.actionT >= this.actionDur) {
          const s = this.state;
          this.state = 'free';
          game.onActionDone(s, this);
        }
        break;
      case 'aiming':
        this.moving = false;
        break;
      default: break;
    }
  }

  updateFree(dt, game) {
    const N = CONFIG.nausea;
    // Potar: mantener A
    if (!input.down.a) this.needRelease = false;
    if (input.down.a && !this.needRelease) {
      this.needRelease = true;
      if (this.nausea >= CONFIG.puke.minNausea) { this.startPuke(game, false); return; }
      game.onPukeTooEarly();
    }
    if (input.pressed.b) { game.useItem(); if (this.busy) return; }

    const ax = input.axis();
    let mx = ax.x, my = ax.y;
    const len = Math.hypot(mx, my);
    let speed = CONFIG.player.speed * (this.speedMul || 1);
    this.moving = len > 0;
    if (len > 0) {
      mx /= len; my /= len;
      let a = Math.atan2(my, mx);
      if (this.wobbling()) {
        const k = (this.nausea - N.wobbleFrom) / (1 - N.wobbleFrom);
        a += this.noiseA(dt, 1.6) * N.wobbleTurn * (0.4 + 0.6 * k);
        speed *= N.wobbleSpeedMin + (N.wobbleSpeedMax - N.wobbleSpeedMin) * (this.noiseS(dt, 2.2) * 0.5 + 0.5);
      }
      mx = Math.cos(a); my = Math.sin(a);
      this.angle = Math.atan2(ax.y, ax.x);
      this.dir = angleToDir(this.angle);
      this.dir = DIRS[this.dir];
    }
    // Empujones laterales aleatorios cuando va muy pedo (aunque esté quieto)
    if (this.wobbling()) {
      if (Math.random() < N.wobblePushChance * dt) {
        const pa = rand(0, Math.PI * 2);
        this.push.x = Math.cos(pa) * N.wobblePush;
        this.push.y = Math.sin(pa) * N.wobblePush;
      }
      this.wobbleX = Math.sin(game.time * 5) * 1.2;
    } else this.wobbleX = 0;
    this.push.x *= Math.pow(0.02, dt);
    this.push.y *= Math.pow(0.02, dt);

    const vx = (len > 0 ? mx * speed : 0) + this.push.x;
    const vy = (len > 0 ? my * speed : 0) + this.push.y;
    const moved = this.moveBy(vx * dt, vy * dt, game.level);
    if (this.moving) {
      this.animT += dt;
      this.stepSfxAcc += moved;
      if (this.stepSfxAcc > 14) { this.stepSfxAcc = 0; game.sfx('step'); }
      if (this.trailT > 0) {
        this.trailAcc += moved;
        if (this.trailAcc >= CONFIG.trail.stepDist) { this.trailAcc = 0; game.addFootprint(this.x, this.y, this.dir); }
      }
    }
  }

  moveBy(dx, dy, level) {
    const ox = this.x, oy = this.y;
    const { hw, hh } = this;
    if (dx) {
      const nx = this.x + dx;
      if (level.boxFree(nx, this.y, hw, hh)) this.x = nx;
      else {
        // ayuda en esquinas: desliza un poco en vertical
        for (const off of [1, -1, 2, -2, 3, -3, 4, -4]) {
          if (level.boxFree(nx, this.y + off, hw, hh) && Math.abs(dy) < 0.01) { this.y += Math.sign(off) * Math.min(Math.abs(dx), 1); break; }
        }
      }
    }
    if (dy) {
      const ny = this.y + dy;
      if (level.boxFree(this.x, ny, hw, hh)) this.y = ny;
      else {
        for (const off of [1, -1, 2, -2, 3, -3, 4, -4]) {
          if (level.boxFree(this.x + off, ny, hw, hh) && Math.abs(dx) < 0.01) { this.x += Math.sign(off) * Math.min(Math.abs(dy), 1); break; }
        }
      }
    }
    return Math.hypot(this.x - ox, this.y - oy);
  }

  startPuke(game, auto) {
    this.state = auto ? 'autopuke' : 'puking';
    this.actionT = 0;
    this.actionDur = auto ? CONFIG.puke.autoTime : CONFIG.puke.holdTime;
    this.moving = false;
    game.onPukeStart(auto);
  }

  finishPuke(game) {
    this.state = 'free';
    this.nausea = 0;
    game.onPukeDone(this);
  }

  startAction(kind, dur) {
    this.state = kind;
    this.actionT = 0;
    this.actionDur = dur;
    this.moving = false;
  }

  facingVec() {
    const a = DIR_ANGLE[DIRS.indexOf(this.dir)];
    return { x: Math.cos(a), y: Math.sin(a) };
  }

  draw(ctx, cam, time) {
    const spec = pipiSpec(this.nausea, this.stained);
    const sheet = characterSheet(spec);
    let dir = this.dir, step = 0, ox = this.wobbleX, oy = 0;
    if (this.moving) step = 1 + (Math.floor(this.animT * 8) % 2);
    if (this.isPuking) {
      dir = this.dir === 'up' ? 'up' : this.dir;
      // arcadas: el cuerpo se sacude
      ox = Math.sin(this.actionT * 40) * (this.state === 'autopuke' ? 1.5 : 1);
      oy = this.actionT > this.actionDur * 0.5 ? 1 : 0;
    }
    if (this.state === 'eating') oy = Math.floor(this.actionT * 8) % 2;
    const di = ['down', 'up', 'left', 'right'].indexOf(dir);
    const sx = Math.round(this.x - 8 - cam.x + ox), sy = Math.round(this.y - 14 - cam.y + oy);
    // sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx + 3, sy + 15, 10, 2);
    ctx.drawImage(sheet, step * 16, di * 16, 16, 16, sx, sy, 16, 16);
    // detalles de acción
    if (this.state === 'smoking') {
      const hx = dir === 'left' ? sx + 3 : dir === 'right' ? sx + 12 : sx + 9;
      ctx.fillStyle = '#f4f4f4'; ctx.fillRect(hx, sy + 8, 3, 1);
      ctx.fillStyle = Math.floor(time * 6) % 2 ? '#f86020' : '#f8c838'; ctx.fillRect(hx + (dir === 'left' ? -1 : 3), sy + 8, 1, 1);
    }
    if (this.state === 'eating') {
      ctx.fillStyle = '#a05828'; ctx.fillRect(sx + 7, sy + 8, 3, 2);
      ctx.fillStyle = '#f8d048'; ctx.fillRect(sx + 6, sy + 9, 1, 1);
    }
    if (this.chicleT > 0 && Math.floor(time * 3) % 2 === 0) {
      // burbuja de chicle
      ctx.fillStyle = '#f878b8';
      const bx = dir === 'left' ? sx + 1 : dir === 'right' ? sx + 12 : sx + 6;
      ctx.fillRect(bx, sy + 6, 3, 3);
      ctx.fillStyle = '#ffd0e8'; ctx.fillRect(bx, sy + 6, 1, 1);
    }
    // espiral de mareo
    if (this.wobbling() && !this.isPuking) {
      const a = time * 6;
      ctx.fillStyle = '#b8e070';
      for (let i = 0; i < 3; i++) {
        const aa = a + (i * Math.PI * 2) / 3;
        ctx.fillRect(Math.round(sx + 8 + Math.cos(aa) * 5), Math.round(sy - 2 + Math.sin(aa) * 2), 1, 1);
      }
    }
  }
}
