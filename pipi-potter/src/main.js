import { SCREEN_W, SCREEN_H, CONFIG } from './config.js';
import { input } from './engine/input.js';
import { startLoop } from './engine/loop.js';
import { audio } from './audio/audio.js';
import { isNative } from './engine/share.js';
import { LEVELS } from './levels/index.js';
import { PlayScene } from './scenes/game.js';
import {
  TitleScene, MenuScene, LevelIntroScene, SummaryScene, GameOverScene, VictoryScene,
} from './scenes/menus.js';

const canvas = document.getElementById('screen');
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

// ---------- Escalado entero de la pantalla ----------
function layout() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const consoleW = Math.min(vw, vh * 0.6, 520);
  document.documentElement.style.setProperty('--cw', `${consoleW}px`);
  const maxCssW = Math.min(consoleW - consoleW * 0.14, (vh * 0.52) * (SCREEN_W / SCREEN_H));
  let k = Math.floor((maxCssW * dpr) / SCREEN_W);
  if (k < 1) k = 1;
  const cssW = (SCREEN_W * k) / dpr;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${(SCREEN_H * k) / dpr}px`;
}
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 200));
layout();

// ---------- Aplicación / flujo entre escenas ----------
const app = {
  scene: null,
  run: { score: 0, levelIndex: 0, levelItems: null, startScore: 0, levelStartItems: null },
  setScene(s, resume = false) {
    this.scene = s;
    input.clearAll();
    if (!resume) s.enter();
  },
  unlocked() {
    try { return parseInt(localStorage.getItem('pp_unlocked') || '0', 10) || 0; } catch (_) { return 0; }
  },
  unlock(i) {
    try { if (i > this.unlocked()) localStorage.setItem('pp_unlocked', String(Math.min(i, LEVELS.length - 1))); } catch (_) { /* noop */ }
  },
  newRun(idx) {
    this.run = { score: 0, levelIndex: idx, startIndex: idx, cleared: 0, levelItems: { ...CONFIG.player.startItems }, startScore: 0, levelStartItems: null };
    this.startLevel(idx);
  },
  startLevel(idx) { this.run.levelIndex = idx; this.setScene(new LevelIntroScene(this, idx)); },
  play(idx) {
    this.run.startScore = this.run.score;
    this.run.levelStartItems = { ...this.run.levelItems };
    this.setScene(new PlayScene(this, idx));
  },
  levelCleared(stats, inventory) {
    this.run.levelItems = { ...inventory };
    this.run.cleared = (this.run.cleared || 0) + 1;
    this.unlock(this.run.levelIndex + 1);
    this.setScene(new SummaryScene(this, this.run.levelIndex, stats));
  },
  nextLevel() {
    if (this.run.levelIndex + 1 < LEVELS.length) this.startLevel(this.run.levelIndex + 1);
    else this.setScene(new VictoryScene(this));
  },
  gameOver(info) { this.setScene(new GameOverScene(this, info)); },
  retryLevel() {
    this.run.score = this.run.startScore;
    this.run.levelItems = { ...this.run.levelStartItems };
    this.startLevel(this.run.levelIndex);
  },
  toMenu() { this.setScene(new MenuScene(this)); },
};
window.__pipi = app; // útil para depurar desde la consola
window.__pipiInput = input;
// Vista previa de un nivel completo (depuración): __pipi.preview(i) → dataURL
app.preview = (i) => {
  const sc = new PlayScene(app, i);
  sc.enter();
  const c = document.createElement('canvas');
  c.width = sc.level.pw; c.height = sc.level.ph;
  const g = c.getContext('2d');
  g.drawImage(sc.mapCanvas, 0, 0);
  sc.nearView = () => true;
  for (const n of sc.npcs) { n.update(0.016, sc); if (n.cone) sc.drawCone(g, n, { x: 0, y: 0 }); }
  for (const it of sc.pickups) it.draw(g, { x: 0, y: 0 }, 0);
  sc.drawZones(g, { x: 0, y: 0 });
  for (const e of [...sc.npcs, sc.player].sort((a, b) => a.y - b.y)) e.draw(g, { x: 0, y: 0 }, 0);
  audio.stopMusic();
  return c.toDataURL();
};

input.attach(canvas, document.getElementById('controls'));
input.onFirstInteraction = () => audio.init();
// En la APK el WebView permite audio sin gesto: intenta arrancar ya la música de la intro
try { audio.init(); } catch (_) { /* noop */ }

// ---------- Integración nativa (APK) ----------
if (isNative()) {
  import('@capacitor/status-bar').then(({ StatusBar }) => StatusBar.hide().catch(() => {})).catch(() => {});
  import('@capacitor/screen-orientation').then(({ ScreenOrientation }) => ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {})).catch(() => {});
  import('@capacitor/app').then(({ App }) => {
    // botón atrás de Android = START (pausa) durante el juego, B en menús
    App.addListener('backButton', () => {
      const btn = app.scene instanceof PlayScene ? 'start' : 'b';
      input.hit.add(btn);
    });
    App.addListener('pause', () => { if (app.scene instanceof PlayScene && app.scene.mode === 'play') app.scene.mode = 'paused'; });
  }).catch(() => {});
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && app.scene instanceof PlayScene && app.scene.mode === 'play') app.scene.mode = 'paused';
});

app.setScene(new TitleScene(app));

startLoop(
  (dt) => { input.poll(); app.scene.update(dt); },
  () => { app.scene.render(ctx); },
);
