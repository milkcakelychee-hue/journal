import { catOf, catIcon } from '../lib/categories.js';
// กิจกรรมวันนี้ (ดึงจากปฏิทินเท่านั้น) · บอร์ด Main / Today-Empty
import { getData } from '../store.js';
import { todayKey } from '../lib/date-th.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
const PERSON = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="3.6" r="2.4" fill="currentColor"/><path d="M1.5 11 a4.5 4.5 0 0 1 9 0 Z" fill="currentColor"/></svg>';
const PIN = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="4" r="3" fill="currentColor"/><path d="M3.6 6.4 L6 11.2 L8.4 6.4 Z" fill="currentColor"/></svg>';

// กิจกรรมของวัน key (รวมกิจกรรมหลายวันที่คร่อมวันนี้) · มีเวลาเรียงตามเวลา ทั้งวันไว้ท้าย
export function eventsOn(d, key) {
  return d.events
    .filter(e => e.startDate <= key && key <= (e.endDate || e.startDate))
    .sort((a, b) => (a.time || '99') < (b.time || '99') ? -1 : (a.time || '99') > (b.time || '99') ? 1 : 0);
}

const chip = (icon, text, c) => `<span class="ev-chip" style="background:${c.bg};color:${c.fg}"><span class="ev-chip-ic">${icon}</span><span class="ev-chip-tx">${esc(text)}</span></span>`;

export const renderEventsToday = () => renderEventsSection({ key: todayKey(), title: 'กิจกรรมวันนี้', sub: 'จากปฏิทิน', empty: 'วันนี้ยังไม่มีกิจกรรม' });

// ใช้ร่วมกับปฏิทิน (Cal-Week: หัว "กิจกรรม" ไม่มีคำรอง, ว่าง = "ยังไม่มีกิจกรรม", Quick note ต่อท้ายรายการ)
export function renderEventsSection({ key, title, sub = '', empty, after = '' }) {
  const d = getData();
  const list = eventsOn(d, key);
  const body = list.length ? `<div class="ev-list">${list.map(e => {
    const c = catOf(d, e.categoryId);
    const people = (e.peopleIds || []).map(id => d.people.find(p => p.id === id)).filter(Boolean);
    const place = d.places.find(p => p.id === e.placeId);
    const chips = [e.categoryId && c.id ? chip(catIcon(c, 12), c.name, c) : '', ...people.map(p => chip(PERSON, p.name, c)), place ? chip(PIN, place.name, c) : ''].join('');
    return `<div class="ev-card"><div class="ev-bar" style="background:${c.accent}"></div>
      <button type="button" class="ev-btn" data-event-open="${e.id}">
        <span class="ev-top"><span class="ev-title">${esc(e.title)}</span><span class="ev-time">${e.time || 'ทั้งวัน'}</span></span>
        ${chips ? `<span class="ev-chips">${chips}</span>` : ''}
      </button></div>`;
  }).join('')}${after}</div>` : `<div class="ev-empty">${empty}</div>${after ? `<div class="ev-list">${after}</div>` : ''}`;
  return `<section class="ev-sec">
    <div class="ev-head"><div class="ev-hl"><h2 class="h-sec" style="line-height:32px">${title}</h2>${sub ? `<span class="ev-sub">${sub}</span>` : ''}</div>
      <button type="button" class="ev-add" aria-label="เพิ่มกิจกรรม" data-event-add><span>${PLUS}</span></button></div>
    ${body}
  </section>`;
}
