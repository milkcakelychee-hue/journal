// แยกด้าน · Habit · มุมมองเดือน (Side-Habit)
// + สร้าง/แก้ Habit (แตะการ์ด) · มุมมองปี (Side-HabitYear)
import { getData, update } from '../store.js';
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, toKey, fromKey, todayKey, addDays } from '../lib/date-th.js';
import { tint } from '../lib/mood.js';
import { openHabitSheet } from './habit-sheet.js';
import { openSheet } from '../ui/sheet.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
const CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7.5"/></svg>';
const FLAME = c => `<svg width="14" height="14" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="M12 2.5c.6 3.2-1.4 4.9-3 6.6C7.4 10.8 6 12.6 6 15a6 6 0 0 0 12 0c0-2.3-1-4.1-2.3-5.4.1 1.6-.5 2.8-1.6 3.3.3-3.6-.9-7.5-2.1-10.4Z"/></svg>`;
export const HABIT_COLORS = ['#D9675F', '#E58F88', '#E487B4', '#9C86D6', '#6F7BD8', '#6C9BD1', '#5DADE2', '#7D8A9B', '#5FBDB6', '#4F9A6E', '#7DBE78', '#A6C35A', '#D9BC3C', '#EBA463', '#A9805E', '#B5A48E']; // เรียงตามโทนสี (16 สี) // แถวที่ 2 (บลูขอเพิ่ม 22 พ.ย. 2569)
export const light = c => tint(c, 0.72); // สีอ่อน = ไม่สำเร็จ

const st = { view: 'month', y: 0, m: 0, yn: {} }; // yn[habitId] = { m: เดือนที่เปิด, more: ดูทั้งเดือน }
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
// ช่องที่ทำไม่สำเร็จ = ขีดเฉียงตามสีนิสัย
const MISS = (c, w = 3) => `repeating-linear-gradient(135deg, ${c} 0 1px, ${tint(c, 0.85)} 1px ${w}px)`;
const done = (d, h, k) => !!d.habitLog[h.id]?.[k];
const noteOf = (d, h, k) => d.habitNotes?.[h.id]?.[k] || '';
// เปิดโน้ตรายวันไว้ไหม (ตั้งตอนสร้าง/แก้ Habit) · ของเก่าที่ยังไม่ได้ตั้ง = เปิดถ้าเคยจดโน้ตแล้ว
export const hasNotes = (d, h) => h.notes ?? Object.keys(d.habitNotes?.[h.id] || {}).length > 0;
const NOTE_IC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4 H15 L19 8 V20 H5 Z"/><path d="M9 12 H15"/><path d="M9 16 H13"/></svg>';

// โน้ตสั้น ๆ ของวันนี้ (100 ตัวอักษร) · ลบข้อความจนว่าง = ไม่มีโน้ต
function openHabitNote(id, onSaved) {
  const h = getData().habits.find(x => x.id === id); if (!h) return;
  const k = todayKey(), dt = fromKey(k);
  let note = noteOf(getData(), h, k);
  openSheet({
    title: `โน้ตวันนี้ · ${DAYS_SHORT[dt.getDay()]} ${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`,
    body: () => `<div class="hb-ns">${esc(h.name)}</div><label class="pa-note" style="margin-top:8px"><span class="pa-nl">โน้ตสั้น ๆ</span><textarea maxlength="100" rows="3" aria-label="โน้ตสั้น ๆ" data-hn-text>${esc(note)}</textarea><span class="pa-cnt" data-hn-cnt>${note.length}/100</span></label>
      <button type="button" class="btn-primary" style="margin-top:16px" data-hn-nsave>บันทึก</button>`,
    mount(el, close) {
      el.addEventListener('input', e => { if (e.target.matches('[data-hn-text]')) { note = e.target.value.slice(0, 100); el.querySelector('[data-hn-cnt]').textContent = `${note.length}/100`; } });
      el.addEventListener('click', e => {
        if (!e.target.closest('[data-hn-nsave]')) return;
        update(dd => { const t = note.trim(); dd.habitNotes ||= {}; const m = dd.habitNotes[id] ||= {}; if (t) m[k] = t; else delete m[k]; });
        close(); onSaved?.();
      });
    },
  });
}
// ต่อสัปดาห์: เป้าของเดือน = สัปดาห์ละ N วัน × วันในเดือน ÷ 7 (ปัดเศษ)
export const monthTarget = (h, y, m) => Math.round((h.freq?.per || 1) * new Date(y, m + 1, 0).getDate() / 7);
const weekly = h => h.freq?.kind === 'weekly';
const freqLabel = (h, y, m) => { const f = h.freq || { kind: 'daily' }; return f.kind === 'weekly' ? `สัปดาห์ละ ${f.per} วัน · ${monthTarget(h, y, m)} วัน/เดือน` : f.kind === 'daily' ? 'ทุกวัน' : f.kind === 'alt' ? 'วันเว้นวัน' : [...(f.days || [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(i => DAYS_SHORT[i]).join(', '); };

// streak: นับวันที่ต้องทำย้อนจากวันนี้ (วันนี้ยังไม่ติ๊ก = เริ่มนับจากวันที่ต้องทำก่อนหน้า)
export function streak(d, h) {
  if (weekly(h)) { // นับสัปดาห์ติดกันที่ทำครบ (สัปดาห์นี้ยังไม่ครบ = ยังไม่นับ ไม่ตัด)
    const ws = d.settings.weekStart, t = fromKey(todayKey());
    let w0 = addDays(t, -((t.getDay() - ws + 7) % 7)), n = 0;
    for (let i = 0; i < 520; i++, w0 = addDays(w0, -7)) {
      let c = 0; for (let j = 0; j < 7; j++) if (done(d, h, toKey(addDays(w0, j)))) c++;
      if (h.startDate && toKey(addDays(w0, 6)) < h.startDate) break;
      if (c >= h.freq.per) n++; else if (i > 0) break;
    }
    return n;
  }
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
    cells += k > tk || (weekly(h) && k < tk && !dn) ? '<span class="hb-c fut"></span>'
      : k === tk && !dn ? `<span class="hb-c${ring}" style="border:1.5px solid ${c}"></span>`
      : `<span class="hb-c${ring}" style="background:${dn ? c : MISS(c)}"></span>`;
  }
  const quit = h.type === 'quit', s = streak(d, h), unit = weekly(h) ? 'สัปดาห์' : (h.freq?.kind || 'daily') === 'daily' ? 'วัน' : 'ครั้ง';
  if (weekly(h)) due = monthTarget(h, y, m);
  const todayDue = isDue(h, tk), todayDone = done(d, h, tk);
  const lab = quit ? 'วันนี้ไม่ได้ทำ' : 'ทำวันนี้แล้ว';
  return `<div class="hb-card" data-hb-edit="${h.id}">
    <div class="hb-l"><span class="hb-st" style="color:${c}">${FLAME(c)}${quit ? `เลิกได้แล้ว ${s} วัน` : `ติดต่อกัน ${s} ${unit}`}</span>
      <span class="hb-name">${esc(h.name)}</span><span class="hb-fq">${freqLabel(h, y, m)}</span>
      ${noteOf(d, h, tk) ? `<span class="hb-note">${esc(noteOf(d, h, tk))}</span>` : ''}
      <span class="hb-cnt">${quit ? 'เลิกได้แล้ว' : 'ทำแล้ว'} ${ok}/${due} วัน · ${MONTHS_SHORT[m]}</span></div>
    <div class="hb-r"><span class="hb-rt">${hasNotes(d, h) ? `<button type="button" class="hb-nb${noteOf(d, h, tk) ? ' on' : ''}" aria-label="โน้ตวันนี้ของ ${esc(h.name)}" data-hb-note="${h.id}">${NOTE_IC}</button>` : ''}${todayDue ? `<button type="button" class="hb-chk" role="checkbox" aria-checked="${todayDone}" aria-label="${esc(h.name)} ${lab}" data-hb-toggle="${h.id}">${todayDone ? `<span class="on" style="background:${c}">${CHECK}</span>` : '<span></span>'}</button>` : '<span class="hb-chk-sp"></span>'}</span>
      <div class="hb-grid" role="img" aria-label="${quit ? 'เลิกได้แล้ว' : 'ทำแล้ว'} ${ok}/${due} วัน เดือน${MONTHS[m]}">${cells}</div></div>
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
      col += weekly(h) && k < tk && !dn ? '<span class="hy-c" style="background:#EFEFF2"></span>' : k === tk && !dn ? `<span class="hy-c" style="border:1px solid ${c}"></span>` : `<span class="hy-c" style="background:${dn ? c : MISS(c, 2.5)}"></span>`;
    }
    cols += `<span class="hy-col">${col}</span>`;
  }
  if (weekly(h)) due = Array.from({ length: 12 }, (_, m) => monthTarget(h, y, m)).reduce((a, b) => a + b, 0);
  const quit = h.type === 'quit', txt = quit ? `เลิกได้แล้ว ${ok}/${due} วัน` : `ทำแล้ว ${ok}/${due} ครั้ง`;
  return `<div class="hy-card" data-hb-edit="${h.id}">
    <div class="hy-top"><span class="hy-l"><span class="hy-name">${esc(h.name)}</span><span class="hy-cnt">${txt} · ปีนี้</span></span>
</div>
    <div class="hy-grid" role="img" aria-label="${esc(h.name)} ทั้งปี ${y + 543} ${txt}">${cols}</div>
    <div class="hy-months">${[0, 2, 4, 6, 8, 10].map(m => `<span>${MONTHS_SHORT[m]}</span>`).join('')}</div>
    ${hasNotes(d, h) ? yearNotes(d, h, y) : ''}
  </div>`;
}
// โน้ตในการ์ดปี · แบบ ค. ป้าย 12 เดือน (6×2) แตะเปิด/ซ่อนโน้ตเดือนนั้น · โชว์ 5 อันแรก แล้วกดดูทั้งเดือน (บลูเลือก 25 พ.ย. 2569)
const SHOW = 5;
function yearNotes(d, h, y) {
  const notes = d.habitNotes?.[h.id] || {}, byM = Array.from({ length: 12 }, () => []);
  for (const [k, t] of Object.entries(notes)) if (k.startsWith(`${y}-`) && t) byM[fromKey(k).getMonth()].push([k, t]);
  const total = byM.reduce((a, b) => a + b.length, 0), o = st.yn[h.id] || {};
  const chips = byM.map((l, m) => l.length
    ? `<button type="button" class="yn-chip${o.m === m ? ' on' : ''}" aria-pressed="${o.m === m}" aria-label="โน้ต${MONTHS[m]} ${l.length} อัน" data-yn-m="${h.id}:${m}"><span>${MONTHS_SHORT[m]}</span><b>${l.length}</b></button>`
    : `<span class="yn-chip off"><span>${MONTHS_SHORT[m]}</span><b>–</b></span>`).join('');
  let list = '';
  if (o.m != null && byM[o.m].length) {
    const l = byM[o.m].sort(([a], [b]) => b < a ? -1 : 1), shown = o.more ? l : l.slice(0, SHOW);
    list = `<div class="yn-list">${shown.map(([k, tx]) => { const dt = fromKey(k); return `<div class="yn-r"><span class="yn-d">${dt.getDate()} ${DAYS_SHORT[dt.getDay()]}</span><span class="yn-t">${esc(tx)}</span></div>`; }).join('')}
      ${l.length > SHOW ? `<button type="button" class="yn-more" data-yn-more="${h.id}">${o.more ? 'ย่อ' : `ดูทั้งเดือน (${l.length})`}</button>` : ''}</div>`;
  }
  return `<div class="yn-box"><div class="yn-head"><span>โน้ต ${total} อัน</span>${total ? `<button type="button" class="yn-all" data-hb-ynotes="${h.id}">ดูทั้งหมด</button>` : ''}</div>
    <div class="yn-chips">${chips}</div>${list}</div>`;
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
    <button type="button" class="side-back" data-side-back>${BACK}${location.hash.split('/')[2] === 'today' ? 'วันนี้' : 'แยกด้าน'}</button>
    <div class="hb-titlebar"><h1 class="h-page">Habit</h1><button type="button" class="hb-add" aria-label="สร้าง Habit" data-hb-new>${PLUS}</button></div>
    <div class="seg" style="margin:0">${seg('month')}${seg('year')}</div>
    ${st.view === 'month' ? `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="เดือนก่อน" data-hb-month="-1">${L}</button>
      <div class="sm-title">${MONTHS[st.m]} <span style="color:var(--muted)">${st.y + 543}</span></div>
      <button type="button" class="cal-arrow" aria-label="เดือนถัดไป" data-hb-month="1">${R}</button></div>
    <div class="hb-leg"><span><i style="background:#6C9BD1"></i>สำเร็จ</span><span><i style="background:${MISS('#6C9BD1')}"></i>ไม่สำเร็จ</span><span><i class="fut"></i>ยังมาไม่ถึง</span><span>ช่องว่าง = ไม่ต้องทำ</span></div>
    ${section(d, 'build', 'นิสัยที่อยากสร้าง')}${section(d, 'quit', 'นิสัยที่อยากเลิก')}` : `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="ปีก่อน" data-hb-year="-1">${L}</button>
      <div class="sm-title">${st.y + 543}</div>
      <button type="button" class="cal-arrow" aria-label="ปีถัดไป" data-hb-year="1">${R}</button></div>
    ${yearSection(d, 'build', 'นิสัยที่อยากสร้าง')}${yearSection(d, 'quit', 'นิสัยที่อยากเลิก')}`}
  </div>`;
}

export function mountSideHabit(root, rerender) {
  root.addEventListener('click', e => {
    if (e.target.closest('[data-hb-new]')) { openHabitSheet(rerender); return; }
    const nb = e.target.closest('[data-hb-note]');
    if (nb) { openHabitNote(nb.dataset.hbNote, rerender); return; }
    const yn = e.target.closest('[data-hb-ynotes]');
    if (yn) { openYearNotes(yn.dataset.hbYnotes, st.y); return; }
    const ym = e.target.closest('[data-yn-m],[data-yn-more]');
    if (ym) {
      if (ym.dataset.ynMore) { const o = st.yn[ym.dataset.ynMore]; o.more = !o.more; }
      else { const [id, m] = ym.dataset.ynM.split(':'), o = st.yn[id] || {}; st.yn[id] = o.m === +m ? {} : { m: +m }; }
      rerender(); return;
    }
    if (e.target.closest('.yn-box')) return; // แตะพื้นที่โน้ตไม่เปิดแผ่นแก้นิสัย
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

// สรุปโน้ตทั้งปี แบ่งตามเดือน · เดือนปัจจุบัน (หรือเดือนล่าสุดที่มีโน้ต) เปิดไว้ ที่เหลือแตะเพื่อดู · ไม่ตัดข้อความ
function openYearNotes(id, y) {
  const d = getData(), h = d.habits.find(x => x.id === id); if (!h) return;
  const all = Object.entries(d.habitNotes?.[id] || {}).filter(([k]) => k.startsWith(`${y}-`)).sort(([a], [b]) => b < a ? -1 : 1);
  const byM = {}; for (const [k, t] of all) (byM[fromKey(k).getMonth()] ||= []).push([k, t]);
  const ms = Object.keys(byM).map(Number).sort((a, b) => b - a);
  const t = new Date(), openM = y === t.getFullYear() && byM[t.getMonth()] ? t.getMonth() : ms[0];
  const body = () => ms.length ? `<div class="yn">${ms.map(m => `<details class="yn-m"${m === openM ? ' open' : ''}><summary><span>${MONTHS[m]}</span><span class="yn-c">${byM[m].length} โน้ต</span></summary>
      ${byM[m].map(([k, tx]) => { const dt = fromKey(k); return `<div class="yn-r"><span class="yn-d">${dt.getDate()} ${DAYS_SHORT[dt.getDay()]}</span><span class="yn-t">${esc(tx)}</span></div>`; }).join('')}</details>`).join('')}</div>`
    : '<div class="ip-empty">ยังไม่มีโน้ตในปีนี้</div>';
  openSheet({
    title: `โน้ต · ${h.name}`, body,
    mount(el) { el.classList.add('sh-tall'); el.querySelector('.sh-title').insertAdjacentHTML('afterend', `<div class="ia-sub">ปี ${y + 543} · ${all.length} โน้ต</div>`); },
  });
}
