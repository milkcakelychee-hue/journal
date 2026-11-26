// ปฏิทินย่อสำหรับเลือกวัน · บอร์ด Today-Many
import { MONTHS, DAYS_SHORT, toKey, todayKey, be } from '../lib/date-th.js';
const L = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const R = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6 L15.5 12 L9.5 18"/></svg>';

// view = { y, m } เดือนที่แสดง · selected = 'YYYY-MM-DD'
export function miniCalHtml(view, selected, weekStart = 1, marks = null) {
  const tk = todayKey();
  const first = new Date(view.y, view.m, 1);
  const off = (first.getDay() - weekStart + 7) % 7;
  const start = new Date(view.y, view.m, 1 - off);
  const weeks = Math.ceil((off + new Date(view.y, view.m + 1, 0).getDate()) / 7);
  const heads = Array.from({ length: 7 }, (_, i) => `<span class="mc-dn">${DAYS_SHORT[(weekStart + i) % 7]}</span>`).join('');
  let rows = '';
  for (let w = 0; w < weeks; w++) {
    rows += '<div class="mc-row">';
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
      const k = toKey(d);
      const cls = [d.getMonth() !== view.m && 'out', k === tk && 'today', k === selected && 'sel', marks?.has(k) && 'mk'].filter(Boolean).join(' ');
      rows += `<button type="button" class="mc-day" aria-label="${d.getDate()}" data-mc-pick="${k}"><span class="${cls}">${d.getDate()}</span></button>`;
    }
    rows += '</div>';
  }
  return `<div class="mc">
    <div class="mc-head"><span class="mc-title">${MONTHS[view.m]} ${be(view.y)}</span>
      <span style="display:flex"><button type="button" class="mc-nav" aria-label="เดือนก่อน" data-mc-nav="-1">${L}</button><button type="button" class="mc-nav" aria-label="เดือนถัดไป" data-mc-nav="1">${R}</button></span></div>
    <div class="mc-row">${heads}</div>${rows}</div>`;
}
