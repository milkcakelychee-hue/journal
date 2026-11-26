// ป้ายในหน้าวันนี้ แถวละ 3 (บลูขอ 26 พ.ย. 2569) · บอร์ด Main (ป้ายเหมือนกันทุกสถานะ ไม่มีตัวเลข)
import { getData } from '../store.js';
import { todayKey, fromKey, toKey, addDays } from '../lib/date-th.js';
import { isDue } from './side-habit.js';
const ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 L17 7"/><path d="M8.5 7 H17 V15.5"/></svg>';
const G = '#C9C9CE';
const ICONS = {
  habit: `<svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="13" r="8.5" fill="${G}"/><circle cx="35" cy="24" r="8.5" fill="${G}"/><circle cx="24" cy="35" r="8.5" fill="${G}"/><circle cx="13" cy="24" r="8.5" fill="${G}"/><circle cx="24" cy="24" r="8" fill="${G}"/></svg>`,
  health: `<svg width="46" height="46" viewBox="0 0 48 48" aria-hidden="true"><defs><clipPath id="hcl"><polygon points="-25.48,51.42 7.88,60.99 29.93,-15.91 -3.42,-25.48"/></clipPath><clipPath id="hcr"><polygon points="11.34,61.98 51.42,73.48 73.48,-3.42 33.39,-14.92"/></clipPath></defs><circle cx="24" cy="24" r="20" fill="${G}" clip-path="url(#hcl)"/><circle cx="24" cy="24" r="20" fill="${G}" clip-path="url(#hcr)"/></svg>`,
  note: `<svg width="52" height="52" viewBox="0 0 48 48" aria-hidden="true"><rect x="8.5" y="9" width="17" height="30" rx="2.5" fill="${G}" transform="rotate(-12 17 24)"/><rect x="24.5" y="9" width="17" height="30" rx="2.5" fill="${G}" transform="rotate(12 33 24)"/></svg>`,
  photo: `<svg width="50" height="50" viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="7" width="30" height="34" rx="2" fill="${G}"/><circle cx="30" cy="17" r="3.5" fill="#FFFFFF"/><path d="M13 36 L21 25 L27 32 L30 28 L35 36 Z" fill="#FFFFFF"/></svg>`,
  journal: `<svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="6" width="26" height="30" rx="2" fill="${G}"/><rect x="6" y="28" width="36" height="14" rx="5" fill="${G}"/><rect x="15" y="13" width="14" height="2.5" rx="1.25" fill="#FFFFFF"/><rect x="15" y="19" width="18" height="2.5" rx="1.25" fill="#FFFFFF"/></svg>`,
};
// go = ปลายทางเมื่อแตะป้าย
const TILES = [
  { id: 'habit', label: 'Habit วันนี้', go: 'habit' },
  { id: 'health', label: 'สุขภาพวันนี้', go: 'health' },
  { id: 'note', label: 'Quick note', go: 'quicknote' },
  { id: 'photo', label: 'หนึ่งวันหนึ่งภาพ', go: 'photo' },
  { id: 'journal', label: 'บันทึก', go: 'journal' },
];

// ป้ายไหนยังต้องเข้าไปบันทึกวันนี้ → จุดเตือน (บลูขอ 26 พ.ย. 2569)
// Habit: มีนิสัยที่อยากสร้างที่วันนี้ต้องทำแต่ยังไม่ติ๊ก (รายสัปดาห์: สัปดาห์นี้ยังไม่ครบ) · ภาพ/บันทึก: วันนี้ยังไม่มี
function pending(d, go) {
  const k = todayKey();
  if (go === 'habit') return d.habits.some(h => {
    if ((h.type || 'build') !== 'build' || !isDue(h, k) || d.habitLog[h.id]?.[k]) return false;
    if (h.freq?.kind !== 'weekly') return true;
    const t = fromKey(k), w0 = addDays(t, -((t.getDay() - d.settings.weekStart + 7) % 7));
    let c = 0; for (let j = 0; j < 7; j++) if (d.habitLog[h.id]?.[toKey(addDays(w0, j))]) c++;
    return c < (h.freq.per || 1);
  });
  if (go === 'photo') return !d.photos?.[k];
  if (go === 'journal') return !d.journal?.[k];
  return false;
}

export const renderTilesToday = () => { const d = getData(); return `<section aria-label="บันทึกวันนี้"><div class="tl-grid tl3">${TILES.map(t => { const p = pending(d, t.go);
  return `<button type="button" class="tl" aria-label="${t.label}${p ? ' · วันนี้ยังไม่ได้บันทึก' : ''}" data-go="${t.go}">${p ? '<span class="tl-due" aria-hidden="true"></span>' : ''}<span class="tl-arrow">${ARROW}</span><span class="tl-ic">${ICONS[t.id]}</span><span class="tl-lb">${t.label}</span></button>`; }).join('')}</div></section>`; };
