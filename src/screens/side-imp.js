// แยกด้าน · วันสำคัญ (บอร์ด Imp-List) · เดือนนี้ = โน้ต 2 คอลัมน์ · เดือนหน้า = กองโน้ตปัดดู
import { getData } from '../store.js';
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, fromKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { nextOccurrence, lastOccurrence, impNoteHtml, NOTE_COLORS, repLabel } from '../lib/important.js';
import { getData as _gd, update } from '../store.js';
import { confirmDelete } from '../ui/confirm.js';
import { openImpSheet } from './imp-sheet.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
const CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6 L15.5 12 L9.5 18"/></svg>';
const PIN = '<svg class="imp-pin2" width="18" height="24" viewBox="0 0 16 20" aria-hidden="true"><circle cx="8" cy="5" r="4" fill="#1C1C1E"/><path d="M8 9 V18" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
const PEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 L15 5 L4 16 Z"/><path d="M13 7 L17 11"/></svg>';
const TRASH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7 H20"/><path d="M9 7 V4.5 H15 V7"/><path d="M6 7 L7 20 H17 L18 7"/></svg>';
const STACK = [['0px', 8, -2, 1], ['10px', 14, 2.5, 1], ['22px', 22, 6, 0.85]];

const st = { i: 0 };
export function resetSideImp() { st.i = 0; }

// ทุกรายการ พร้อมวันที่เกิดครั้งถัดไป (ทุกปี = ปีนี้/ปีหน้า) และอีกกี่วัน
export function impItems(d) {
  const t = new Date(); const t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return d.importantDates.map(x => { const at = nextOccurrence(x, t0); return { ...x, at, inDays: Math.round((at - t0) / 864e5) }; }).sort((a, b) => a.at - b.at);
}

function bigNote(x, k) {
  const [c1, c2] = NOTE_COLORS[x.noteColor] || NOTE_COLORS.yellow;
  const [l, top, rot, op] = STACK[k];
  return `<button type="button" class="ip-big" style="left:calc(50% - 118px + ${l});top:${top}px;transform:rotate(${rot}deg);opacity:${op};z-index:${3 - k};background:linear-gradient(180deg,${c1},${c2})" ${k === 0 ? `data-ip-edit="${x.id}"` : 'tabindex="-1" aria-hidden="true"'}>${PIN}
    <span><span class="ip-bt">${esc(x.title)}</span><span class="ip-bd">${x.at.getDate()} ${MONTHS_SHORT[x.at.getMonth()]}</span></span>
    <span class="imp-foot"><span class="ip-bl">${x.inDays === 0 ? 'วันนี้' : `อีก ${x.inDays} วัน`}</span>${repLabel(x) ? `<span class="imp-chip">${repLabel(x)}</span>` : ''}</span></button>`;
}

export function renderSideImp() {
  const d = getData(), t = new Date(), fromToday = location.hash.split('/')[2] === 'today';
  const items = impItems(d).filter(x => x.inDays >= 0);
  const ym = (dt) => dt.getFullYear() * 12 + dt.getMonth(), cur = ym(t);
  const thisM = items.filter(x => ym(x.at) === cur), nextM = items.filter(x => ym(x.at) === cur + 1);
  const nm = new Date(t.getFullYear(), t.getMonth() + 1, 1);
  if (st.i >= nextM.length) st.i = 0;
  const stack = nextM.length ? [0, 1, 2].filter(k => k < nextM.length).map(k => bigNote(nextM[(st.i + k) % nextM.length], k)).reverse().join('') : '';
  return `<div class="side">
    <button type="button" class="side-back" data-ip-back>${BACK}${fromToday ? 'วันนี้' : 'แยกด้าน'}</button>
    <div class="ip-head"><h1 class="h-page side-title">วันสำคัญ</h1><button type="button" class="ip-add" aria-label="เพิ่มวันสำคัญ" data-ip-add>${PLUS}</button></div>
    <div class="hb-sh"><h2>วันสำคัญในเดือนนี้</h2><span>${MONTHS[t.getMonth()]}</span></div>
    ${thisM.length ? `<div class="ip-grid">${thisM.map((x, i) => `<button type="button" class="ip-cell" data-ip-edit="${x.id}">${impNoteHtml(x, x.inDays, i)}</button>`).join('')}</div>` : '<div class="ip-empty">ยังไม่มีวันสำคัญในเดือนนี้</div>'}
    <div class="hb-sh"><h2>วันสำคัญในเดือนหน้า</h2><span>${MONTHS[nm.getMonth()]}</span></div>
    ${nextM.length ? `<div class="ip-stack" role="group" aria-roledescription="carousel" aria-label="วันสำคัญเดือนหน้า ปัดเพื่อดู" data-ip-stack>${stack}</div>
      ${nextM.length > 1 ? `<div class="ip-dots"><span>${nextM.map((_, k) => `<i class="${k === st.i ? 'on' : ''}"></i>`).join('')}</span><span class="ip-hint">${st.i + 1}/${nextM.length} · ปัดเพื่อดูใบถัดไป</span></div>` : ''}` : '<div class="ip-empty">ยังไม่มีวันสำคัญในเดือนหน้า</div>'}
    <div class="card ip-links">
      <button type="button" class="ip-link" data-ip-all><span class="ip-lt">วันสำคัญทั้งหมด</span><span class="ip-ls">${items.length} รายการ</span>${CHEV}</button>
      <button type="button" class="ip-link" data-ip-hist><span class="ip-lt">ประวัติวันสำคัญ</span><span class="ip-ls">ที่ผ่านมาแล้ว</span>${CHEV}</button>
    </div>
  </div>`;
}

export function mountSideImp(root, rerender) {
  const n = () => impItems(getData()).filter(x => x.inDays >= 0 && (x.at.getFullYear() * 12 + x.at.getMonth()) === (new Date().getFullYear() * 12 + new Date().getMonth() + 1)).length;
  const step = dir => { const c = n(); if (c > 1) { st.i = (st.i + dir + c) % c; rerender(); } };
  let x0 = null, moved = false;
  root.addEventListener('pointerdown', e => { if (e.target.closest('[data-ip-stack]')) { x0 = e.clientX; moved = false; } });
  root.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 30) { moved = true; step(dx < 0 ? 1 : -1); } });
  root.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    if (e.target.closest('[data-ip-back]')) { location.hash = location.hash.split('/')[2] === 'today' ? 'today' : 'sides'; return; }
    if (e.target.closest('[data-ip-add]')) { openImpSheet(rerender); return; }
    if (e.target.closest('[data-ip-all]')) { openImpList('all', rerender); return; }
    if (e.target.closest('[data-ip-hist]')) { openImpList('hist'); return; }
    const ed = e.target.closest('[data-ip-edit]');
    if (ed) { openImpSheet(rerender, ed.dataset.ipEdit); return; }
  });
}

// ป๊อปอัปรายการ · บอร์ด Imp-All (ที่จะถึง) / Imp-History (ที่ผ่านมาแล้ว ล่าสุดอยู่บน) · ดูอย่างเดียว
// วันสำคัญทั้งหมด: แต่ละแถวมีปุ่มแก้/ลบ · แก้ = ปิดรายการ → เปิดแผ่นแก้ → บันทึกแล้วกลับมารายการ (ไม่ซ้อน sheet)
function openImpList(kind, onChange) {
  const d = getData(), t = new Date(), t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const past = kind === 'hist';
  const rows = past
    ? d.importantDates.map(x => { const at = lastOccurrence(x, t0); return at && { ...x, at, n: Math.round((t0 - at) / 864e5) }; }).filter(Boolean).sort((a, b) => b.at - a.at)
    : impItems(d).filter(x => x.inDays >= 0).map(x => ({ ...x, n: x.inDays }));
  let html = '', ym = '';
  for (const x of rows) {
    const k = `${MONTHS[x.at.getMonth()]} ${x.at.getFullYear() + 543}`;
    if (k !== ym) { html += `<div class="ia-m">${k}</div>`; ym = k; }
    const c = (NOTE_COLORS[x.noteColor] || NOTE_COLORS.yellow)[1];
    const right = past ? `${x.n} วันก่อน` : x.n === 0 ? 'วันนี้' : `อีก ${x.n} วัน`;
    html += `<div class="ia-row${past ? ' past' : ''}"><span class="ia-sw" style="background:${c}"></span><span class="ia-tx"><span class="ia-t">${esc(x.title)}</span><span class="ia-s">${DAYS_SHORT[x.at.getDay()]} ${x.at.getDate()} ${MONTHS_SHORT[x.at.getMonth()]}${repLabel(x) ? ` · ${repLabel(x)}` : ''}</span></span><span class="ia-r">${right}</span>${past ? '' : `<span class="ia-acts"><button type="button" class="ia-btn" aria-label="แก้ ${esc(x.title)}" data-ia-edit="${x.id}">${PEN}</button><button type="button" class="ia-btn" aria-label="ลบ ${esc(x.title)}" data-ia-del="${x.id}">${TRASH}</button></span>`}</div>`;
  }
  openSheet({
    title: past ? 'ประวัติวันสำคัญ' : 'วันสำคัญทั้งหมด',
    body: () => `<div class="ia">${html}</div>`,
    mount(el, close) {
      el.addEventListener('click', async e => {
        const ed = e.target.closest('[data-ia-edit]'), dl = e.target.closest('[data-ia-del]');
        if (ed) { close(); openImpSheet(() => { onChange?.(); openImpList(kind, onChange); }, ed.dataset.iaEdit); return; }
        if (dl) {
          const x = _gd().importantDates.find(i => i.id === dl.dataset.iaDel); if (!x) return;
          if (!await confirmDelete({ title: `ลบ "${x.title}"?` })) return;
          update(dd => { dd.importantDates = dd.importantDates.filter(i => i.id !== x.id); });
          close(); onChange?.(); openImpList(kind, onChange);
        }
      });
      el.classList.add('sh-tall');
      el.querySelector('.sh-title').insertAdjacentHTML('afterend', `<div class="ia-sub">${past ? 'ที่ผ่านมาแล้ว · ล่าสุดอยู่บน' : `ที่จะถึง · ${rows.length} รายการ`}</div>`);
    },
  });
}
