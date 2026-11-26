// แยกด้าน · หนึ่งวันหนึ่งภาพ · มุมมองเดือน (บอร์ด Side-Photo)
import { getData } from '../store.js';
import { DAYS_SHORT, MONTHS, toKey, todayKey, fromKey, addDays } from '../lib/date-th.js';
import { photoURL, posStyle } from '../lib/photos.js';
import { openPhotoSheet, openNoteSheet } from './photo-sheet.js';
const PEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 L15 5 L4 16 Z"/><path d="M13 7 L17 11"/></svg>';
import { openPhotoSlide } from './photo-slide.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const CAM = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8 h3 l2 -2.5 h6 L17 8 h3 v11 H4 Z"/><circle cx="12" cy="13" r="3.5"/></svg>';

const st = { view: 'month', y: 0, m: 0, sel: null };
let redraw = () => {};
export function resetSidePhoto() { const t = new Date(); Object.assign(st, { view: 'month', y: t.getFullYear(), m: t.getMonth(), sel: null }); }
resetSidePhoto();

function cell(d, k, inMonth) {
  const dt = fromKey(k), n = dt.getDate(), tk = todayKey(), lab = `${n} ${MONTHS[dt.getMonth()]}`;
  if (!inMonth) return `<div class="ph-c"><div class="ph-n" style="color:#D4D4D8">${n}</div></div>`;
  const has = !!d.photos[k], ring = k === tk ? '<span class="ph-ring"></span>' : '';
  if (has) {
    const u = photoURL(k, () => redraw());
    return `<button type="button" class="ph-c ph-img" aria-label="${lab} ดูภาพ" data-ph-day="${k}">${u ? `<img src="${u}" alt=""${posStyle(k)}>` : ''}${ring}<span class="ph-nw">${n}</span></button>`;
  }
  if (k > tk) return `<div class="ph-c"><div class="ph-n" style="color:#C2C2C7">${n}</div></div>`;
  return `<button type="button" class="ph-c ph-add" aria-label="${lab} ยังไม่มีภาพ เพิ่มภาพ" data-ph-add="${k}">${ring}<span class="ph-n">${n}</span><span class="ph-plus">+</span></button>`;
}

function monthView(d) {
  const { y, m } = st, ws = d.settings.weekStart;
  const first = new Date(y, m, 1), off = (first.getDay() - ws + 7) % 7;
  const start = addDays(first, -off), n = new Date(y, m + 1, 0).getDate();
  const rows = Math.ceil((off + n) / 7);
  let cells = '';
  for (let i = 0; i < rows * 7; i++) { const dt = addDays(start, i); cells += cell(d, toKey(dt), dt.getMonth() === m); }
  const heads = Array.from({ length: 7 }, (_, i) => `<div class="ph-h">${DAYS_SHORT[(ws + i) % 7]}</div>`).join('');
  const sel = st.sel && d.photos[st.sel] && fromKey(st.sel).getMonth() === m && fromKey(st.sel).getFullYear() === y ? st.sel : null;
  let card = '';
  if (sel) {
    const sd = fromKey(sel), u = photoURL(sel, () => redraw()), note = d.photos[sel].note;
    card = `<div class="card ph-card"><div class="ph-ch"><span>${DAYS_SHORT[sd.getDay()]} ${sd.getDate()} ${MONTHS[sd.getMonth()]}</span><button type="button" class="ph-slide" data-ph-slide>ดูแบบสไลด์</button></div>
      <div class="sl-frame ph-big"><span class="stamp"></span>${u ? `<img src="${u}" alt="ภาพวันที่ ${sd.getDate()} ${MONTHS[sd.getMonth()]}"${posStyle(sel)}>` : ''}</div>
      <button type="button" class="ph-change" data-ph-add="${sel}">${CAM}เปลี่ยนภาพ</button>
      ${note ? `<div class="ph-note">${esc(note)}<button type="button" class="ph-pen" aria-label="แก้ไขคำอธิบาย" data-ph-note="${sel}">${PEN}</button></div>`
        : `<button type="button" class="ph-change" data-ph-note="${sel}">เพิ่มคำอธิบาย</button>`}</div>`;
  }
  return `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="ก่อนหน้า" data-ph-month="-1">${L}</button>
      <div class="sm-title">${MONTHS[m]} <span style="color:var(--muted)">${y + 543}</span></div>
      <button type="button" class="cal-arrow" aria-label="ถัดไป" data-ph-month="1">${R}</button></div>
    <div class="ph-cal"><div class="ph-hs">${heads}</div><div class="ph-g">${cells}</div></div>${card}`;
}

// มุมมองปี · บอร์ด Side-PhotoYear (โฟลเดอร์รายเดือน)
const PEEK = [['left:14px;top:12px;width:62px;height:52px;transform:rotate(-8deg)'], ['left:52px;top:6px;width:62px;height:52px;transform:rotate(4deg)'], ['left:90px;top:12px;width:60px;height:52px;transform:rotate(9deg)']];
function yearView(d) {
  const y = st.y, t = new Date(), all = Object.keys(d.photos).filter(k => k.startsWith(`${y}-`)).sort();
  const folders = MONTHS.map((name, m) => {
    const keys = all.filter(k => Number(k.slice(5, 7)) === m + 1);
    const future = y * 12 + m > t.getFullYear() * 12 + t.getMonth();
    const img = k => { const u = photoURL(k, () => redraw()); return u ? `<img src="${u}" alt=""${posStyle(k)}>` : ''; };
    const peeks = keys.slice(0, 3).map((k, j) => `<span class="pf-peek" style="${PEEK[j]}"><span>${img(k)}</span></span>`).join('');
    const stamp = keys.length > 3 ? `<span class="pf-stamp"><span class="pf-st"><span>${img(keys[keys.length - 1])}</span></span><span class="pf-clip"></span></span>` : '';
    const empty = !keys.length;
    return `<button type="button" class="pf${future ? ' fut' : ''}" aria-label="${name} ${keys.length} ภาพ" ${empty ? 'disabled' : `data-ph-folder="${m}"`}>
      <span class="pf-box${empty ? ' empty' : ''}"><span class="pf-tab"></span><span class="pf-body"></span>${peeks}<span class="pf-front"></span>${stamp}</span>
      <span class="pf-name">${name}</span><span class="pf-cnt">${future ? 'ยังไม่ถึง' : `${keys.length} ภาพ`}</span></button>`;
  }).join('');
  return `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="ปีก่อน" data-ph-year="-1">${L}</button>
      <div class="sm-title">${y + 543} <span class="pf-total">· ${all.length} ภาพ</span></div>
      <button type="button" class="cal-arrow" aria-label="ปีถัดไป" data-ph-year="1">${R}</button></div>
    <div class="pf-grid">${folders}</div>`;
}

export function renderSidePhoto() {
  const d = getData();
  if (st.sel === null && d.photos[todayKey()]) st.sel = todayKey();
  const seg = id => `<button type="button" class="seg-btn${st.view === id ? ' on' : ''}" aria-pressed="${st.view === id}" data-ph-view="${id}">${id === 'month' ? 'เดือน' : 'ปี'}</button>`;
  return `<div class="side">
    <button type="button" class="side-back" data-side-back>${BACK}${location.hash.split('/')[2] === 'today' ? 'วันนี้' : 'แยกด้าน'}</button>
    <h1 class="h-page side-title">หนึ่งวันหนึ่งภาพ</h1>
    <div class="seg" style="margin:0">${seg('month')}${seg('year')}</div>
    ${st.view === 'month' ? monthView(d) : yearView(d)}
  </div>`;
}

export function mountSidePhoto(root, rerender) {
  redraw = rerender;
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-ph-day],[data-ph-add],[data-ph-note],[data-ph-month],[data-ph-view],[data-ph-year],[data-ph-folder],[data-ph-slide]');
    if (!b) return;
    const ds = b.dataset;
    if (ds.phDay) st.sel = ds.phDay;
    else if (ds.phAdd) { openPhotoSheet(ds.phAdd, () => { st.sel = ds.phAdd; rerender(); }); return; }
    else if (ds.phNote) { openNoteSheet(ds.phNote, rerender); return; }
    else if (ds.phMonth) { const n = st.m + Number(ds.phMonth); st.y += Math.floor(n / 12); st.m = (n + 12) % 12; }
    else if (ds.phView) st.view = ds.phView;
    else if (ds.phYear) st.y += Number(ds.phYear);
    else if (ds.phFolder || ds.phSlide !== undefined) {
      const m = ds.phFolder ? Number(ds.phFolder) : st.m;
      // ปฏิทินในสไลด์ → มุมมองเดือนของเดือนนั้น เลือกวันที่ดูอยู่
      openPhotoSlide(st.y, m, ds.phFolder ? null : st.sel, (y, mm, k) => { Object.assign(st, { view: 'month', y, m: mm, sel: k }); rerender(); });
      return;
    }
    rerender();
  });
}
