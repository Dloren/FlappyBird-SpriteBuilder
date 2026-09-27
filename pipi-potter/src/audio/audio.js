// ============================================================
//  Sintetizador chiptune con WebAudio (sin archivos externos)
//  Canales: lead (pulso), bass (triángulo), arp (pulso fino), drums (ruido)
// ============================================================
import { SONGS } from './songs.js';

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n) {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  const midi = NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class ChipAudio {
  constructor() {
    this.ctx = null;
    this.song = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('pp_muted') === '1'; } catch (_) { /* noop */ }
    this.timer = null;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.32;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.7;
    this.sfxGain.connect(this.master);
    // buffer de ruido blanco
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // onda de pulso 25 %
    this.pulse25 = this._pulseWave(0.25);
    this.pulse125 = this._pulseWave(0.125);
    if (this.pendingSong) { const s = this.pendingSong; this.pendingSong = null; this.playMusic(s); }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
  }

  _pulseWave(duty) {
    const n = 32, real = new Float32Array(n), imag = new Float32Array(n);
    for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * 1;
    for (let k = 1; k < n; k++) { real[k] = imag[k]; imag[k] = 0; }
    return this.ctx.createPeriodicWave(real, imag);
  }

  // Desbloqueo para móviles: debe llamarse dentro de un gesto válido
  // (touchend / pointerup / click / keydown en Chrome Android e iOS)
  unlock() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    try {
      const b = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = b; src.connect(this.ctx.destination); src.start(0);
    } catch (_) { /* noop */ }
  }

  get running() { return !!(this.ctx && this.ctx.state === 'running'); }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('pp_muted', m ? '1' : '0'); } catch (_) { /* noop */ }
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  }

  // ---------- voces ----------
  tone(f, t, dur, { type = 'square', wave = null, vol = 0.2, slide = 0, attack = 0.005, release = 0.05, dest = null, vib = 0 } = {}) {
    const c = this.ctx;
    const o = c.createOscillator();
    if (wave) o.setPeriodicWave(wave); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    if (vib) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = 12; lg.gain.value = vib;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + release);
    }
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noiseHit(t, dur, { vol = 0.2, filter = 'highpass', f = 4000, f2 = null, q = 1, dest = null } = {}) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const fl = c.createBiquadFilter();
    fl.type = filter; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfxGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  // ---------- música ----------
  playMusic(name) {
    if (!this.ctx) { this.pendingSong = name; return; }
    if (this.song && this.song.name === name) return;
    this.stopMusic();
    const def = SONGS[name];
    if (!def) return;
    const tracks = {};
    const src = { lead: def.leadTrack, bass: def.bassTrack, arp: def.arpTrack, drums: def.drums };
    for (const k of Object.keys(src)) {
      if (!src[k]) continue;
      tracks[k] = src[k].join(' ').trim().split(/\s+/);
    }
    const len = Math.max(...Object.values(tracks).map((t) => t.length));
    this.song = { name, def, tracks, len, step: 0, next: this.ctx.currentTime + 0.08, spb: 60 / def.bpm / (def.div || 4) };
    this.timer = setInterval(() => this._schedule(), 25);
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.song = null;
  }

  _schedule() {
    const s = this.song;
    if (!s || !this.ctx) return;
    while (s.next < this.ctx.currentTime + 0.12) {
      this._playStep(s, s.step % s.len, s.next);
      s.next += s.spb;
      s.step++;
      if (!s.def.loop && s.step >= s.len) { this.stopMusic(); return; }
    }
  }

  _noteLen(track, i) {
    let n = 1;
    while (track[(i + n) % track.length] === '-' && n < 32) n++;
    return n;
  }

  _voice(kind) {
    if (kind === 'p25') return { wave: this.pulse25 };
    if (kind === 'p12') return { wave: this.pulse125 };
    return { type: kind || 'square' };
  }

  _playStep(s, i, t) {
    const { tracks, spb, def } = s;
    const mg = this.musicGain;
    const L = tracks.lead?.[i % tracks.lead.length];
    if (L && L !== '.' && L !== '-') this.tone(freq(L), t, spb * this._noteLen(tracks.lead, i % tracks.lead.length) * 0.95, { ...this._voice(def.lead || 'p25'), vol: def.leadVol || 0.15, dest: mg, vib: def.vib ? 4 : 0 });
    const B = tracks.bass?.[i % tracks.bass.length];
    if (B && B !== '.' && B !== '-') {
      const bt = def.bass || 'triangle';
      const vol = def.bassVol || (bt === 'triangle' ? 0.34 : 0.16);
      this.tone(freq(B), t, spb * this._noteLen(tracks.bass, i % tracks.bass.length) * (bt === 'sawtooth' ? 0.6 : 0.9), { ...this._voice(bt), vol, dest: mg });
    }
    const A = tracks.arp?.[i % tracks.arp.length];
    if (A && A !== '.' && A !== '-') this.tone(freq(A), t, spb * 0.8, { ...this._voice(def.arp || 'p12'), vol: 0.07, dest: mg });
    const D = tracks.drums?.[i % tracks.drums.length];
    if (D && D !== '.') {
      if (D.includes('k')) this.tone(150, t, 0.14, { type: 'sine', vol: 0.55, slide: 0.28, dest: mg });
      if (D.includes('s')) this.noiseHit(t, 0.12, { vol: 0.22, filter: 'bandpass', f: 1800, q: 0.7, dest: mg });
      if (D.includes('h')) this.noiseHit(t, 0.04, { vol: 0.09, f: 7000, dest: mg });
      if (D.includes('o')) this.noiseHit(t, 0.16, { vol: 0.1, f: 6000, dest: mg });
    }
  }

  // "Voz" cómica: diente de sierra con filtro formante que se desliza
  _blargh(t, dur, f0, f1, form0, form1, vol) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = 18; lg.gain.value = f0 * 0.12;
    l.connect(lg); lg.connect(o.frequency);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 4;
    bp.frequency.setValueAtTime(form0, t);
    bp.frequency.exponentialRampToValueAtTime(form1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.03);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(bp); bp.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02); l.start(t); l.stop(t + dur + 0.02);
  }

  // ---------- efectos ----------
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'step': this.noiseHit(t, 0.03, { vol: 0.05, filter: 'lowpass', f: 900 }); break;
      case 'retch': {
        // "¡HUP!" de arcada, como un hipo exagerado
        const up = 180 + Math.random() * 60;
        this._blargh(t, 0.16, up, up * 1.5, 500, 1100, 0.5);
        this.tone(up * 2, t + 0.02, 0.08, { type: 'square', vol: 0.05, slide: 1.4 });
        break;
      }
      case 'puke':
        // "BLUAAARGH" descendente + chof + gluglú
        this._blargh(t, 0.75, 330, 95, 1100, 380, 0.6);
        this._blargh(t + 0.05, 0.7, 250, 80, 800, 300, 0.3);
        this.noiseHit(t + 0.15, 0.6, { vol: 0.3, filter: 'lowpass', f: 1600, f2: 250 });
        this.noiseHit(t + 0.72, 0.18, { vol: 0.4, filter: 'lowpass', f: 900 });
        [520, 440, 360, 300].forEach((f, i) => this.tone(f, t + 0.85 + i * 0.09, 0.07, { type: 'sine', vol: 0.3, slide: 1.8 }));
        break;
      case 'bark':
        this._blargh(t, 0.12, 520, 380, 1400, 900, 0.5);
        this._blargh(t + 0.2, 0.14, 560, 360, 1500, 800, 0.5);
        break;
      case 'splash':
        this.noiseHit(t, 0.25, { vol: 0.2, filter: 'lowpass', f: 900, f2: 300 });
        break;
      case 'suspect':
        this.tone(660, t, 0.07, { wave: this.pulse25, vol: 0.15 });
        this.tone(990, t + 0.08, 0.1, { wave: this.pulse25, vol: 0.15 });
        break;
      case 'alert':
        for (let i = 0; i < 3; i++) this.tone(1320, t + i * 0.07, 0.05, { wave: this.pulse25, vol: 0.16 });
        break;
      case 'caught':
        this.tone(880, t, 0.1, { type: 'square', vol: 0.18 });
        this.tone(1760, t + 0.1, 0.35, { type: 'square', vol: 0.15, slide: 0.25 });
        break;
      case 'throw': this.noiseHit(t, 0.2, { vol: 0.12, filter: 'bandpass', f: 600, f2: 3000, q: 2 }); break;
      case 'glass':
        this.noiseHit(t, 0.35, { vol: 0.25, f: 3500 });
        [2637, 3136, 2349, 3520].forEach((f, i) => this.tone(f, t + i * 0.03, 0.08, { type: 'square', vol: 0.05 }));
        break;
      case 'clack':
        this.noiseHit(t, 0.06, { vol: 0.2, filter: 'bandpass', f: 2500, q: 3 });
        this.tone(1200, t, 0.04, { type: 'square', vol: 0.05 });
        break;
      case 'pickup':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.05, 0.06, { wave: this.pulse25, vol: 0.14 }));
        break;
      case 'eat':
        for (let i = 0; i < 4; i++) this.noiseHit(t + i * 0.12, 0.06, { vol: 0.18, filter: 'bandpass', f: 1200, q: 1.5 });
        break;
      case 'smoke': this.noiseHit(t, 0.9, { vol: 0.06, filter: 'bandpass', f: 1500, f2: 800, q: 0.5 }); break;
      case 'gum':
        this.tone(400, t, 0.05, { type: 'sine', vol: 0.2, slide: 2.5 });
        this.noiseHit(t + 0.05, 0.03, { vol: 0.2, f: 3000 });
        break;
      case 'nope': this.tone(180, t, 0.12, { type: 'square', vol: 0.1 }); break;
      case 'move': this.tone(880, t, 0.03, { wave: this.pulse25, vol: 0.08 }); break;
      case 'select':
        this.tone(660, t, 0.05, { wave: this.pulse25, vol: 0.12 });
        this.tone(1320, t + 0.05, 0.08, { wave: this.pulse25, vol: 0.12 });
        break;
      case 'back': this.tone(440, t, 0.06, { wave: this.pulse25, vol: 0.1, slide: 0.7 }); break;
      case 'win':
        [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.09, i === 5 ? 0.4 : 0.08, { wave: this.pulse25, vol: 0.16 }));
        break;
      case 'gameover':
        [494, 466, 440, 415].forEach((f, i) => this.tone(f, t + i * 0.28, i === 3 ? 0.9 : 0.25, { wave: this.pulse25, vol: 0.18, vib: i === 3 ? 6 : 0 }));
        this.tone(123, t + 0.84, 0.9, { type: 'triangle', vol: 0.35 });
        break;
      default: break;
    }
  }
}

export const audio = new ChipAudio();
