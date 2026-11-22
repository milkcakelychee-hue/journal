// ประจำเดือน: รวม log เป็นรอบ + คาดการณ์ (ตามสเปก APP_SPEC_updates · สุขภาพ)
import { toKey, fromKey, addDays } from './date-th.js';

const diff = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 864e5);

// รอบ = วันที่ log ติดกัน (เว้นได้ไม่เกิน 1 วัน) → [{ start, end, len }]
export function episodes(log) {
  const ds = [...new Set(log.map(x => x.date))].sort();
  const out = [];
  for (const k of ds) {
    const cur = out[out.length - 1];
    if (cur && diff(cur.end, k) <= 2) cur.end = k;
    else out.push({ start: k, end: k });
  }
  out.forEach(e => { e.len = diff(e.start, e.end) + 1; });
  return out;
}

// ค่าที่ใช้คาดการณ์ · รอบครบ = วันแรกรอบหนึ่ง → วันแรกรอบถัดไป (ล่าสุดไม่เกิน 6 รอบ) · < 3 รอบ → ค่าที่ตั้งไว้
export function periodStats(d) {
  const eps = episodes(d.periodLog || []);
  const cycles = [], lens = [];
  for (let i = 1; i < eps.length; i++) { cycles.push(diff(eps[i - 1].start, eps[i].start)); lens.push(eps[i - 1].len); }
  const c6 = cycles.slice(-6), l6 = lens.slice(-6);
  const real = c6.length >= 3;
  const avg = a => Math.round(a.reduce((s, x) => s + x, 0) / a.length);
  return {
    eps, real, n: c6.length,
    cycle: real ? avg(c6) : d.settings.periodDefaultCycle,
    len: real ? avg(l6) : d.settings.periodDefaultLen,
  };
}

// วันที่คาดว่าจะมา ภายในช่วง [fromK, toK] → Set ของ key · และวันแรกรอบถัดไป
export function predicted(d, fromK, toK) {
  const s = periodStats(d);
  const set = new Set();
  if (!s.eps.length) return { set, next: null, s };
  const logged = new Set((d.periodLog || []).map(x => x.date));
  let start = toKey(addDays(fromKey(s.eps[s.eps.length - 1].start), s.cycle));
  const next = start;
  for (let guard = 0; guard < 60 && start <= toK; guard++) {
    for (let i = 0; i < s.len; i++) { const k = toKey(addDays(fromKey(start), i)); if (k >= fromK && k <= toK && !logged.has(k)) set.add(k); }
    start = toKey(addDays(fromKey(start), s.cycle));
  }
  return { set, next, s };
}
