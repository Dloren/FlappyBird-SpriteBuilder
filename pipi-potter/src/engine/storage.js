// Puntuaciones y preferencias en localStorage (también funciona en el WebView de la APK)
const KEY = 'pipipotter_scores_v1';
const NAME_KEY = 'pipipotter_name';

function safeGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* noop */ } }

export function loadScores() {
  try { const s = JSON.parse(safeGet(KEY) || '[]'); return Array.isArray(s) ? s : []; } catch (_) { return []; }
}
export function qualifies(score) {
  if (score <= 0) return false;
  const s = loadScores();
  return s.length < 10 || score > s[s.length - 1].score;
}
export function addScore(entry) {
  const s = loadScores();
  const e = { ...entry, date: entry.date || new Date().toISOString() };
  s.push(e);
  s.sort((a, b) => b.score - a.score);
  const top = s.slice(0, 10);
  safeSet(KEY, JSON.stringify(top));
  return top.indexOf(e);
}
export function lastName() { return (safeGet(NAME_KEY) || 'PIP').slice(0, 3).padEnd(3, 'A'); }
export function saveName(n) { safeSet(NAME_KEY, n); }
export function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--/--/--';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
}
