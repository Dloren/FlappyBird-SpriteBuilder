import { CONFIG } from '../config.js';
import { makePuddle, drawIcon, PUKE_COLORS } from '../assets/sprites.js';
import { rand } from '../engine/util.js';

export class Puddle {
  constructor(x, y) {
    this.kind = 'puddle';
    this.x = x; this.y = y;
    this.img = makePuddle(Math.random());
    this.age = 0;
  }
  draw(ctx, cam) {
    // crece durante el primer medio segundo
    const k = Math.min(1, this.age * 3 + 0.3);
    const w = 18 * k, h = 14 * k;
    ctx.drawImage(this.img, Math.round(this.x - w / 2 - cam.x), Math.round(this.y - h / 2 - cam.y), Math.round(w), Math.round(h));
  }
}

export class Footprint {
  constructor(x, y, dir, side) {
    this.kind = 'trail';
    this.x = x + (dir === 'up' || dir === 'down' ? side * 2 : 0);
    this.y = y + (dir === 'left' || dir === 'right' ? side * 2 : 0);
    this.vertical = dir === 'up' || dir === 'down';
    this.life = CONFIG.trail.fade;
  }
  get alpha() { return Math.max(0, this.life / CONFIG.trail.fade); }
  draw(ctx, cam) {
    ctx.globalAlpha = this.alpha * 0.9;
    ctx.fillStyle = PUKE_COLORS[0];
    const x = Math.round(this.x - cam.x), y = Math.round(this.y - cam.y);
    if (this.vertical) ctx.fillRect(x, y - 1, 2, 3); else ctx.fillRect(x - 1, y, 3, 2);
    ctx.globalAlpha = 1;
  }
}

export class SmokeCloud {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.life = CONFIG.items.pitillo.cloudTime;
    this.r = CONFIG.items.pitillo.cloudRadius;
    this.puffs = [];
    for (let i = 0; i < 14; i++) this.puffs.push({ a: rand(0, Math.PI * 2), d: rand(0, this.r * 0.8), s: rand(4, 8), ph: rand(0, 6) });
    this.age = 0;
  }
  contains(px, py) { return this.life > 0 && Math.hypot(px - this.x, py - this.y) < this.r * Math.min(1, this.age * 2); }
  draw(ctx, cam, time) {
    const grow = Math.min(1, this.age * 2);
    const fade = Math.min(1, this.life / 1.5);
    for (const p of this.puffs) {
      const px = this.x + Math.cos(p.a + time * 0.2) * p.d * grow - cam.x;
      const py = this.y - 6 + Math.sin(p.a + time * 0.2) * p.d * 0.6 * grow - cam.y;
      const s = p.s * grow * (0.9 + 0.1 * Math.sin(time * 2 + p.ph));
      ctx.globalAlpha = 0.55 * fade;
      ctx.fillStyle = '#c8c8d8';
      ctx.beginPath(); ctx.arc(Math.round(px), Math.round(py), s, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.35 * fade;
      ctx.fillStyle = '#f0f0f8';
      ctx.beginPath(); ctx.arc(Math.round(px - 1), Math.round(py - 1), s * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export class Pickup {
  constructor(type, x, y) {
    this.type = type; this.x = x; this.y = y; this.taken = false; this.t = rand(0, 3);
  }
  draw(ctx, cam, time) {
    const bob = Math.round(Math.sin(time * 4 + this.t) * 1.5);
    const sx = Math.round(this.x - 4 - cam.x), sy = Math.round(this.y - 6 - cam.y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx + 1, Math.round(this.y - cam.y) + 3, 6, 2);
    // destello
    if (Math.floor(time * 3 + this.t) % 4 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 7, sy - 1, 1, 1); ctx.fillRect(sx - 1, sy + 6, 1, 1); }
    drawIcon(ctx, this.type, sx, sy);
  }
}

export class Projectile {
  constructor(type, x, y, tx, ty, maxRange, speed) {
    this.type = type;
    this.x = x; this.y = y;
    const d = Math.hypot(tx - x, ty - y) || 1;
    this.vx = ((tx - x) / d) * speed;
    this.vy = ((ty - y) / d) * speed;
    this.remaining = Math.min(d, maxRange);
    this.h = 6;
    this.total = this.remaining;
    this.rot = 0;
    this.done = false;
  }
  update(dt, game) {
    const step = Math.hypot(this.vx, this.vy) * dt;
    const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
    this.rot += dt * 14;
    const t = 1 - this.remaining / this.total;
    this.h = 3 + Math.sin(t * Math.PI) * 8;
    // choca con muros, muebles o NPCs
    let hit = game.level.isSolidAt(nx, ny);
    if (!hit) for (const n of game.npcs) if (Math.hypot(n.x - nx, n.y - 4 - ny) < 6) { hit = true; break; }
    if (hit) { this.land(game); return; }
    this.x = nx; this.y = ny;
    this.remaining -= step;
    if (this.remaining <= 0) this.land(game);
  }
  land(game) {
    this.done = true;
    game.onProjectileLand(this);
  }
  draw(ctx, cam) {
    const sx = Math.round(this.x - cam.x), sy = Math.round(this.y - cam.y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx - 2, sy, 4, 2);
    ctx.save();
    ctx.translate(sx, Math.round(sy - this.h));
    ctx.rotate(Math.round(this.rot / (Math.PI / 2)) * (Math.PI / 2));
    drawIcon(ctx, this.type, -4, -4);
    ctx.restore();
  }
}

// Partículas simples (chorro de pota, cristales, chispas)
export class Particle {
  constructor(x, y, vx, vy, color, life, gravity = 0, z = 0, vz = 0) {
    Object.assign(this, { x, y, vx, vy, color, life, gravity, z, vz, max: life });
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vz -= this.gravity * dt; this.z += this.vz * dt;
    if (this.z < 0) { this.z = 0; this.vz = 0; this.vx *= 0.5; this.vy *= 0.5; }
    this.life -= dt;
  }
  draw(ctx, cam) {
    ctx.globalAlpha = Math.min(1, this.life / (this.max * 0.4));
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x - cam.x), Math.round(this.y - this.z - cam.y), 1, 1);
    ctx.globalAlpha = 1;
  }
}

// Marca del ruido (ondas)
export class NoiseRing {
  constructor(x, y, r) { this.x = x; this.y = y; this.r = r; this.t = 0; }
  update(dt) { this.t += dt; }
  get done() { return this.t > 0.8; }
  draw(ctx, cam) {
    const k = this.t / 0.8;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = '#f8f0c0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(Math.round(this.x - cam.x) + 0.5, Math.round(this.y - cam.y) + 0.5, this.r * k, this.r * k * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
