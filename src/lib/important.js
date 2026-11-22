// วันสำคัญ: หาวันที่เกิดครั้งถัดไป (ทุกปี = เลื่อนเป็นปีนี้/ปีหน้า)
import { fromKey, toKey, MONTHS_SHORT } from './date-th.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PIN = '<svg class="imp-pin" width="16" height="20" viewBox="0 0 16 20" aria-hidden="true"><circle cx="8" cy="5" r="4" fill="#1C1C1E"/><path d="M8 9 V18" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';

export const NOTE_COLORS = {
  yellow: ['#F6EBC2', '#F5E8B8'],
  blue: ['#D9E5EF', '#D3E1EC'],
  pink: ['#F5DDD8', '#F3D6D1'],
  green: ['#DDE8D6', '#D6E4CF'],
};

// วันที่ dd ของเดือน (เดือนสั้นกว่า = วันสุดท้ายของเดือน)
const dayIn = (y, m, dd) => new Date(y, m, Math.min(dd, new Date(y, m + 1, 0).getDate()));
export const repLabel = x => x.monthly ? 'ทุกเดือน' : x.yearly ? 'ทุกปี' : '';

export function nextOccurrence(item, from) {
  const d = fromKey(item.date);
  if (item.monthly) {
    if (toKey(d) >= toKey(from)) return d;
    let n = dayIn(from.getFullYear(), from.getMonth(), d.getDate());
    if (toKey(n) < toKey(from)) n = dayIn(from.getFullYear(), from.getMonth() + 1, d.getDate());
    return n;
  }
  if (!item.yearly) return d;
  let n = new Date(from.getFullYear(), d.getMonth(), d.getDate());
  if (toKey(n) < toKey(from)) n = new Date(from.getFullYear() + 1, d.getMonth(), d.getDate());
  return n;
}

// วันสำคัญที่จะถึงภายใน n วัน (นับวันนี้ด้วย) เรียงตามวัน
export function upcoming(items, today, days) {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return items
    .map(it => { const at = nextOccurrence(it, t0); return { ...it, at, inDays: Math.round((at - t0) / 864e5) }; })
    .filter(x => x.inDays >= 0 && x.inDays < days)
    .sort((a, b) => a.at - b.at);
}

// สีจุด/ชิปวันสำคัญในปฏิทิน (บอร์ดมีแค่เหลือง #D9BC3C · ที่เหลือเลือกโทนเข้มคู่สีโน้ต)
export const IMP_DOT = { yellow: '#D9BC3C', blue: '#7FA3C4', pink: '#D98E84', green: '#8DB07E' };
export const IMP_TEXT = { yellow: '#6B5A1E', blue: '#3D5A73', pink: '#7A3E36', green: '#3F5C34' };

// โน้ตวันสำคัญแบบปักหมุด · ใช้ทั้งหน้าวันนี้และแผงวันในปฏิทิน (Cal-MonthPin)
// at = วันที่ (Date) ที่แสดง · inDays = อีกกี่วันจากวันนี้ (ติดลบ = ผ่านแล้ว ไม่แสดงตัวนับ)
export function impNoteHtml(x, inDays, i = 0, at = x.at) {
  const [c1, c2] = NOTE_COLORS[x.noteColor] || NOTE_COLORS.yellow;
  const left = inDays == null || inDays < 0 ? '' : inDays === 0 ? 'วันนี้' : `อีก ${inDays} วัน`;
  return `<div class="imp-note" style="background:linear-gradient(180deg,${c1},${c2});transform:rotate(${i % 2 ? 1 : -1}deg)">${PIN}
    <div><div class="imp-title">${esc(x.title)}</div><div class="imp-date">${at.getDate()} ${MONTHS_SHORT[at.getMonth()]}</div></div>
    <div class="imp-foot"><span class="imp-left">${left}</span>${repLabel(x) ? `<span class="imp-chip">${repLabel(x)}</span>` : ''}</div>
  </div>`;
}

// ครั้งล่าสุดที่ผ่านมาแล้ว (ก่อนวันนี้) · null = ยังไม่เคยเกิด
export function lastOccurrence(x, t0) {
  const d = fromKey(x.date);
  if (x.monthly) {
    let p = dayIn(t0.getFullYear(), t0.getMonth(), d.getDate());
    if (p >= t0) p = dayIn(t0.getFullYear(), t0.getMonth() - 1, d.getDate());
    return p >= d ? p : null;
  }
  if (!x.yearly) return d < t0 ? d : null;
  let p = new Date(t0.getFullYear(), d.getMonth(), d.getDate());
  if (p >= t0) p = new Date(t0.getFullYear() - 1, d.getMonth(), d.getDate());
  return p >= d ? p : null;
}
// ตรงกับวัน key ไหม (ทุกปี = ทุกปี · ทุกเดือน = ตั้งแต่วันเริ่ม · ครั้งเดียว)
export function impMatches(x, key) {
  if (x.yearly && !x.monthly) return x.date.slice(5) === key.slice(5); // ทุกปี: นับทุกปี (เช่น วันเกิด)
  if (key < x.date) return false;
  if (x.monthly) { const k = fromKey(key), dd = fromKey(x.date).getDate(); return toKey(dayIn(k.getFullYear(), k.getMonth(), dd)) === key; }
  if (x.yearly) return x.date.slice(5) === key.slice(5);
  return x.date === key;
}
