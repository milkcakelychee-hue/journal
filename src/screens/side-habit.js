// แยกด้าน · Habit · มุมมองเดือน (Side-Habit)
// + สร้าง/แก้ Habit (แตะการ์ด) · มุมมองปี (Side-HabitYear)
import { getData, update } from '../store.js';
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, toKey, fromKey, todayKey, addDays } from '../lib/date-th.js';
import { tint } from '../lib/mood.js';
import { openHabitSheet } from './habit-sheet.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
const CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7.5"/></svg>';
const FLAME = c => `<svg width="14" height="14" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="M12 2.5c.6 3.2-1.4 4.9-3 6.6C7.4 10.8 6 12.6 6 15a6 6 0 0 0 12 0c0-2.3-1-4.1-2.3-5.4.1 1.6-.5 2.8-1.6 3.3.3-3.6-.9-7.5-2.1-10.4Z"/></svg>`;
export const HABIT_COLORS = ['#6C9BD1', '#7DBE78', '#9C86D6', '#EBA463', '#E58F88', '#5FBDB6', '#D9BC3C', '#B5A48E'];
export const light = c => tint(c, 0.72); // สีอ่อน = ไม่สำเร็จ

const st = { view: 'month', y: 0, m: 0 };
export function resetSideHabit() { const t = new Date(); Object.assign(st, { view: 'month', y: t.getFullYear(), m: t.getMonth() }); }
resetSideHabit();

// วันที่ต้องทำ (ก่อนวันเริ่ม = ไม่ต้องทำ)
export function isDue(h, k) {
  if (h.startDate && k < h.startDate) return false;
  const f = h.freq || { kind: 'daily' };
  if (f.kind === 'custom') return (f.days || []).includes(fromKey(k).getDay());
  if (f.kind === 'alt') return Math.round((fromKey(k) - fromKey(h.startDate || k)) / 864e5) % 2 === 0;
  return true;
}
const done = (d, h, k) => !!d.habitLog[h.id]?.[k];
const freqLabel = h => { const f = h.freq || { kind: 'daily' }; return f.kind === 'daily' ? 'ทุกวัน' : f.kind === 'alt' ? 'วันเว้นวัน' : [...(f.days || [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(i => DAYS_SHORT[i]).join(', '); };

// streak: นับวันที่ต้องทำย้อนจากวันนี้ (วันนี้ยังไม่ติ๊ก = เริ่มนับจากวันที่ต้องทำก่อนหน้า)
export function streak(d, h) {
  let k = todayKey(), n = 0, first = true;
  for (let i = 0; i < 3660; i++, k = toKey(addDays(fromKey(k), -1))) {
    if (h.startDate && k < h.startDate) break;
    if (!isDue(h, k)) continue;
    if (done(d, h, k)) n++;
    else if (!first) break;
    first = false;
  }
  return n;
}

function card(d, h) {
  const { y, m } = st, ws = d.settings.weekStart, tk = todayKey(), c = h.color, lt = light(c);
  const n = new Date(y, m + 1, 0).getDate(), off = (new Date(y, m, 1).getDay() - ws + 7) % 7;
  let due = 0, ok = 0, cells = '<span></span>'.repeat(off);
  for (let i = 1; i <= n; i++) {
    const k = toKey(new Date(y, m, i));
    if (!isDue(h, k)) { cells += '<span class="hb-c"></span>'; continue; }
    due++;
    const dn = done(d, h, k); if (dn) ok++;
    const ring = k === tk ? ' today' : '';
    cells += k > tk ? '<span class="hb-c fut"></span>'
      : k === tk && !dn ? `<span class="hb-c${ring}" style="border:1.5px solid ${c}"></span>`
      : `<span class="hb-c${ring}" style="background:${dn ? c : lt}"></span>`;
  }
  const quit = h.type === 'quit', s = streak(d, h), unit = (h.freq?.kind || 'daily') === 'daily' ? 'วัน' : 'ครั้ง';
  const todayDue = isDue(h, tk), todayDone = done(d, h, tk);
  const lab = quit ? 'วันนี้ไม่ได้ทำ' : 'ทำวันนี้แล้ว';
  return `<div class="hb-card" data-hb-edit="${h.id}">
    <div class="hb-l"><span class="hb-st" style="color:${c}">${FLAME(c)}${quit ? `เลิกได้แล้ว ${s} วัน` : `ติดต่อกัน ${s} ${unit}`}</span>
      <span class="hb-name">${esc(h.name)}</span><span class="hb-fq">${freqLabel(h)}</span>
      <span class="hb-cnt">${quit ? 'ไม่ได้ทำ' : 'ทำแล้ว'} ${ok}/${due} วัน · ${MONTHS_SHORT[m]}</span></div>
    <div class="hb-r">${todayDue ? `<button type="button" class="hb-chk" role="checkbox" aria-checked="${todayDone}" aria-label="${esc(h.name)} ${lab}" data-hb-toggle="${h.id}">${todayDone ? `<span class="on" style="background:${c}">${CHECK}</span>` : '<span></span>'}</button>` : '<span class="hb-chk-sp"></span>'}
      <div class="hb-grid" role="img" aria-label="${quit ? 'ไม่ได้ทำ' : 'ทำแล้ว'} ${ok}/${due} วัน เดือน${MONTHS[m]}">${cells}</div></div>
  </div>`;
}

function section(d, type, title) {
  const list = d.habits.filter(h => (h.type || 'build') === type);
  if (!list.length) return '';
  return `<div class="hb-sh"><h2>${title}</h2><span>${list.length} นิสัย</span></div>${list.map(h => card(d, h)).join('')}`;
}

// ---------- มุมมองปี · Side-HabitYear (จุด 53×7) ----------
function yearCard(d, h) {
  const y = st.y, ws = d.settings.weekStart, tk = todayKey(), c = h.color, lt = tint(c, 0.75);
  const start = addDays(new Date(y, 0, 1), -((new Date(y, 0, 1).getDay() - ws + 7) % 7));
  let due = 0, ok = 0, cols = '';
  for (let w = 0; w < 53; w++) {
    let col = '';
    for (let r = 0; r < 7; r++) {
      const dt = addDays(start, w * 7 + r), k = toKey(dt);
      if (dt.getFullYear() !== y || !isDue(h, k)) { col += '<span class="hy-c"></span>'; continue; }
      if (k > tk) { col += '<span class="hy-c" style="background:#EFEFF2"></span>'; continue; }
      due++;
      const dn = done(d, h, k); if (dn) ok++;
      col += k === tk && !dn ? `<span class="hy-c" style="border:1px solid ${c}"></span>` : `<span class="hy-c" style="background:${dn ? c : lt}"></span>`;
    }
    cols += `<span class="hy-col">${col}</span>`;
  }
  const quit = h.type === 'quit', txt = quit ? `ไม่ได้ทำ ${ok}/${due} วัน` : `ทำแล้ว ${ok}/${due} ครั้ง`;
  const todayDue = isDue(h, tk), todayDone = done(d, h, tk);
  return `<div class="hy-card" data-hb-edit="${h.id}">
    <div class="hy-top"><span class="hy-l"><span class="hy-name">${esc(h.name)}</span><span class="hy-cnt">${txt} · ปีนี้</span></span>
      ${todayDue ? `<button type="button" class="hb-chk hy-chk" role="checkbox" aria-checked="${todayDone}" aria-label="${esc(h.name)}" data-hb-toggle="${h.id}">${todayDone ? `<span class="on" style="background:${c}">${CHECK}</span>` : '<span></span>'}</button>` : ''}</div>
    <div class="hy-grid" role="img" aria-label="${esc(h.name)} ทั้งปี ${y + 543} ${txt}">${cols}</div>
    <div class="hy-months">${[0, 2, 4, 6, 8, 10].map(m => `<span>${MONTHS_SHORT[m]}</span>`).join('')}</div>
  </div>`;
}
function yearSection(d, type, title) {
  const list = d.habits.filter(h => (h.type || 'build') === type);
  if (!list.length) return '';
  return `<div class="hb-sh"><h2>${title}</h2><span>${list.length} นิสัย</span></div>${list.map(h => yearCard(d, h)).join('')}`;
}

export function renderSideHabit() {
  const d = getData();
  const seg = id => `<button type="button" class="seg-btn${st.view === id ? ' on' : ''}" aria-pressed="${st.view === id}" data-hb-view="${id}">${id === 'month' ? 'เดือน' : 'ปี'}</button>`;
  return `<div class="side">
    <button type="button" class="side-back" data-side-back>${BACK}แยกด้าน</button>
    <div class="hb-titlebar"><h1 class="h-page">Habit</h1><button type="button" class="hb-add" aria-label="สร้าง Habit" data-hb-new>${PLUS}</button></div>
    <div class="seg" style="margin:0">${seg('month')}${seg('year')}</div>
    ${st.view === 'month' ? `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="เดือนก่อน" data-hb-month="-1">${L}</button>
      <div class="sm-title">${MONTHS[st.m]} <span style="color:var(--muted)">${st.y + 543}</span></div>
      <button type="button" class="cal-arrow" aria-label="เดือนถัดไป" data-hb-month="1">${R}</button></div>
    <div class="hb-leg"><span><i style="background:#6C9BD1"></i>สำเร็จ</span><span><i style="background:#D5E3F2"></i>ไม่สำเร็จ</span><span><i class="fut"></i>ยังมาไม่ถึง</span><span>ช่องว่าง = ไม่ต้องทำ</span></div>
    ${section(d, 'build', 'นิสัยที่อยากสร้าง')}${section(d, 'quit', 'นิสัยที่อยากเลิก')}` : `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="ปีก่อน" data-hb-year="-1">${L}</button>
      <div class="sm-title">${st.y + 543}</div>
      <button type="button" class="cal-arrow" aria-label="ปีถัดไป" data-hb-year="1">${R}</button></div>
    ${yearSection(d, 'build', 'นิสัยที่อยากสร้าง')}${yearSection(d, 'quit', 'นิสัยที่อยากเลิก')}`}
  </div>`;
}

export function mountSideHabit(root, rerender) {
  root.addEventListener('click', e => {
    if (e.target.closest('[data-hb-new]')) { openHabitSheet(rerender); return; }
    const ed = e.target.closest('[data-hb-edit]');
    if (ed && !e.target.closest('[data-hb-toggle]')) { openHabitSheet(rerender, ed.dataset.hbEdit); return; }
    const b = e.target.closest('[data-hb-view],[data-hb-month],[data-hb-toggle],[data-hb-year]');
    if (!b) return;
    const ds = b.dataset;
    if (ds.hbView) st.view = ds.hbView;
    else if (ds.hbYear) st.y += Number(ds.hbYear);
    else if (ds.hbMonth) { const n = st.m + Number(ds.hbMonth); st.y += Math.floor(n / 12); st.m = (n + 12) % 12; }
    else if (ds.hbToggle) {
      const k = todayKey();
      update(dd => { const log = dd.habitLog[ds.hbToggle] ||= {}; if (log[k]) delete log[k]; else log[k] = true; });
    }
    rerender();
  });
}
