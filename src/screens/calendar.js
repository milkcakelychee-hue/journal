// ปฏิทิน · สัปดาห์ (Cal-Week / Cal-WeekEmpty) · เดือน/ปี ทำในขั้นถัดไป
import { getData } from '../store.js';
import { DAYS, DAYS_SHORT, MONTHS, MONTHS_SHORT, toKey, fromKey, todayKey, weekOf, addDays, be } from '../lib/date-th.js';
import { renderTodoCard, bindTodo, setTodoDay } from './todo.js';
import { renderEventsSection } from './events-today.js';
import { renderQuickNotesToday, openQuickNote } from './quicknote.js';
import { nextOccurrence, impNoteHtml, IMP_DOT, IMP_TEXT, NOTE_COLORS } from '../lib/important.js';
import { eventsOn } from './events-today.js';

const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');

// สถานะหน้าปฏิทิน · เปิดแท็บทุกครั้ง = มุมมองเดือน + วันนี้ (บลูกำหนด 22 พ.ย. 2569)
const st = { view: 'month', sel: todayKey(), month: null };
export function resetCalendar() { const t = new Date(); Object.assign(st, { view: 'month', sel: todayKey(), month: { y: t.getFullYear(), m: t.getMonth() } }); }
resetCalendar();

// วันสำคัญที่ตรงกับวัน key (รวมแบบทุกปี)
export function importantOn(d, key) {
  const day = fromKey(key);
  return d.importantDates.filter(x => toKey(x.yearly ? nextOccurrence(x, new Date(day.getFullYear(), 0, 1)) : fromKey(x.date)) === key
    || (x.yearly && x.date.slice(5) === key.slice(5)));
}
const hasEntry = (d, k) => d.events.some(e => e.startDate <= k && k <= (e.endDate || e.startDate)) || d.todos.some(t => t.date === k) || d.quickNotes.some(n => n.date === k);

function segment() {
  const b = (id, label) => `<button type="button" class="seg-btn${st.view === id ? ' on' : ''}" aria-pressed="${st.view === id}" data-cal-view="${id}">${label}</button>`;
  return `<div class="seg">${b('week', 'สัปดาห์')}${b('month', 'เดือน')}${b('year', 'ปี')}</div>`;
}

function weekHeader(days) {
  const a = days[0], z = days[6];
  const range = a.getMonth() === z.getMonth()
    ? `${a.getDate()}–${z.getDate()} ${MONTHS_SHORT[z.getMonth()]}`
    : `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${z.getDate()} ${MONTHS_SHORT[z.getMonth()]}`;
  return `<div class="cal-nav"><button type="button" class="cal-arrow" aria-label="สัปดาห์ก่อน" data-cal-step="-7">${L}</button>
    <div class="cal-range">${range} <span style="color:var(--muted)">${be(z.getFullYear())}</span></div>
    <button type="button" class="cal-arrow" aria-label="สัปดาห์ถัดไป" data-cal-step="7">${R}</button></div>`;
}

function weekStrip(d, days) {
  const tk = todayKey();
  return `<section><div class="wk-row">${days.map(day => {
    const k = toKey(day);
    const sel = k === st.sel, today = k === tk;
    const imp = importantOn(d, k)[0];
    const dot = hasEntry(d, k) ? (sel ? 'var(--ink)' : '#B8B8BE') : 'transparent';
    return `<button type="button" class="wk-day cal-day${sel ? ' today' : ''}${today && !sel ? ' is-today' : ''}" aria-pressed="${sel}"${today ? ' aria-current="date"' : ''}
      aria-label="${DAYS_SHORT[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}${imp ? ` · วันสำคัญ ${imp.title}` : ''}" data-cal-pick="${k}">
      ${imp ? `<span class="cal-imp" style="background:${impDot(imp)}"></span>` : ''}
      <span class="wk-dn">${DAYS_SHORT[day.getDay()]}</span><span class="wk-num">${day.getDate()}</span><span class="wk-dot" style="background:${dot}"></span></button>`;
  }).join('')}</div></section>`;
}
const impDot = x => IMP_DOT[x.noteColor] || IMP_DOT.yellow;

function weekView(d) {
  const days = weekOf(fromKey(st.sel), d.settings.weekStart);
  const sel = fromKey(st.sel);
  return `${weekHeader(days)}</div>
    ${weekStrip(d, days)}
    <h2 class="cal-dayhead">${DAYS[sel.getDay()]} ${sel.getDate()} ${MONTHS[sel.getMonth()]}</h2>
    <div id="todo-slot">${renderTodoCard()}</div>
    ${renderEventsSection({ key: st.sel, title: 'กิจกรรม', empty: 'ยังไม่มีกิจกรรม', after: renderQuickNotesToday(st.sel) })}`;
}

// ---------- มุมมองเดือน · Cal-Month / Cal-MonthPin / Cal-Empty ----------
const PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CHIP_ROWS = 2; // ชิปต่อช่องวันก่อนขึ้น +n

function monthView(d) {
  const { y, m } = st.month;
  const ws = d.settings.weekStart;
  const first = new Date(y, m, 1);
  const off = (first.getDay() - ws + 7) % 7;
  const start = new Date(y, m, 1 - off);
  const weeks = Math.ceil((off + new Date(y, m + 1, 0).getDate()) / 7);
  const tk = todayKey();
  const cat = id => d.categories.find(c => c.id === id) || d.categories.find(c => c.fallback) || d.categories[0];
  const heads = Array.from({ length: 7 }, (_, i) => `<div class="mo-dn">${DAYS_SHORT[(ws + i) % 7]}</div>`).join('');
  let rows = '';
  for (let w = 0; w < weeks; w++) {
    const days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i));
    const keys = days.map(toKey);
    // กิจกรรมหลายวัน → แถบข้ามช่อง จัดเลน (สูงสุด CHIP_ROWS เลน)
    const multi = d.events.filter(e => e.endDate && e.endDate !== e.startDate && e.startDate <= keys[6] && e.endDate >= keys[0])
      .sort((a, b) => a.startDate < b.startDate ? -1 : 1);
    const lanes = []; const bars = []; const laneUse = Array.from({ length: 7 }, () => 0);
    for (const e of multi) {
      const s0 = Math.max(0, keys.findIndex(k => k >= e.startDate)), e0 = keys.findLastIndex(k => k <= e.endDate);
      let lane = 0; while (lanes[lane]?.some(([a, b]) => !(e0 < a || s0 > b))) lane++;
      (lanes[lane] ||= []).push([s0, e0]);
      if (lane < CHIP_ROWS) { bars.push({ e, s0, e0, lane }); for (let i = s0; i <= e0; i++) laneUse[i] = Math.max(laneUse[i], lane + 1); }
      else for (let i = s0; i <= e0; i++) laneUse[i] = 99; // ล้นเลน → นับใน +n
    }
    let cells = '';
    days.forEach((day, i) => {
      const k = keys[i];
      const out = day.getMonth() !== m;
      const br = i < 6 ? ' br' : '';
      if (out) { cells += `<div class="mo-cell out${br}"><div class="mo-outnum">${day.getDate()}</div></div>`; return; }
      const imp = importantOn(d, k);
      const single = eventsOn(d, k).filter(e => !e.endDate || e.endDate === e.startDate);
      const hasNote = d.quickNotes.some(n => n.date === k);
      const chips = [
        ...imp.map(x => `<span class="mo-chip imp" style="background:${(NOTE_COLORS[x.noteColor] || NOTE_COLORS.yellow)[1]};color:${IMP_TEXT[x.noteColor] || IMP_TEXT.yellow}">${esc(x.title)}</span>`),
        ...single.map(e => { const c = cat(e.categoryId); return `<span class="mo-chip" style="background:${c.bg};color:${c.fg}">${esc(e.title)}</span>`; }),
        ...(hasNote ? ['<span class="mo-chip note">โน้ต</span>'] : []),
      ];
      const used = Math.min(laneUse[i], CHIP_ROWS);
      const room = Math.max(0, CHIP_ROWS - used);
      const hiddenBars = laneUse[i] === 99 ? multi.filter(e => e.startDate <= k && k <= e.endDate).length - CHIP_ROWS : 0;
      const shown = chips.slice(0, room);
      const more = chips.length - shown.length + Math.max(0, hiddenBars);
      const cls = k === st.sel ? 'sel' : k === tk ? 'today' : '';
      cells += `<button type="button" class="mo-cell${br}" aria-label="${day.getDate()} ${MONTHS[m]}${imp[0] ? ` · วันสำคัญ ${esc(imp[0].title)}` : ''}"${k === tk ? ' aria-current="date"' : ''} data-cal-pick="${k}">
        ${imp[0] ? `<span class="cal-imp mo-imp" style="background:${impDot(imp[0])}"></span>` : ''}
        <span class="mo-num ${cls}">${day.getDate()}</span>
        <span class="mo-chips">${'<span class="mo-chip spacer"></span>'.repeat(used)}${shown.join('')}${more > 0 ? `<span class="mo-more">+${more}</span>` : ''}</span></button>`;
    });
    const barHtml = bars.map(({ e, s0, e0, lane }) => {
      const c = cat(e.categoryId);
      return `<div class="mo-bar" style="top:${32 + lane * 16}px;left:calc(${(s0 / 7 * 100).toFixed(4)}% + 3px);width:calc(${((e0 - s0 + 1) / 7 * 100).toFixed(4)}% - 6px);background:${c.bg};color:${c.fg}">${esc(e.title)}</div>`;
    }).join('');
    rows += `<div class="mo-week">${cells}${barHtml}</div>`;
  }
  const sel = fromKey(st.sel);
  const imps = importantOn(d, st.sel);
  const t0 = fromKey(tk);
  return `<div class="cal-nav"><button type="button" class="cal-arrow" aria-label="ก่อนหน้า" data-cal-month="-1">${L}</button>
      <div class="cal-range">${MONTHS[m]} <span style="color:var(--muted)">${be(y)}</span></div>
      <button type="button" class="cal-arrow" aria-label="ถัดไป" data-cal-month="1">${R}</button></div></div>
    <div class="mo card"><div class="mo-head">${heads}</div>${rows}</div>
    <div>
      <div class="mo-panelhead"><h2 class="h-sec">${DAYS[sel.getDay()]} ${sel.getDate()} ${MONTHS[sel.getMonth()]}</h2>
        <button type="button" class="mo-add" aria-label="เพิ่มกิจกรรมวันนี้" data-event-add>${PLUS}</button></div>
      <div class="mo-panel">
        ${imps.length ? `<div class="mo-imps">${imps.map((x, i) => impNoteHtml(x, Math.round((sel - t0) / 864e5), i, sel)).join('')}</div>` : ''}
        ${eventsListHtml(d, st.sel)}
      </div>
    </div>`;
}

// รายการในแผงวัน: กิจกรรม → Quick note (ตามบอร์ด Cal-Month) · ว่าง = "ยังไม่มีกิจกรรม"
function eventsListHtml(d, key) {
  const html = renderEventsSection({ key, title: '', empty: 'ยังไม่มีกิจกรรม', after: renderQuickNotesToday(key) });
  // ตัดหัวส่วนออก (แผงนี้มีหัวเป็นชื่อวันแล้ว)
  return html.replace(/<div class="ev-head">[\s\S]*?<\/button><\/div>/, '');
}

export function renderCalendar() {
  const d = getData();
  setTodoDay(st.sel);
  const body = st.view === 'week' ? weekView(d) : st.view === 'month' ? monthView(d) : '</div>';
  return `<div class="today">
    <div><div style="height:52px;display:flex;align-items:center"><h1 class="h-page">ปฏิทิน</h1></div>
      ${segment()}
      ${body}
  </div>`;
}

export function mountCalendar(root, rerenderPage) {
  bindTodo(root, () => { root.querySelector('#todo-slot').innerHTML = renderTodoCard(); });
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-cal-view],[data-cal-step],[data-cal-pick],[data-qn-edit],[data-cal-month]');
    if (!b) return;
    const ds = b.dataset;
    if (ds.calView) st.view = ds.calView;
    else if (ds.calStep) st.sel = toKey(addDays(fromKey(st.sel), Number(ds.calStep)));
    else if (ds.calPick) st.sel = ds.calPick;
    else if (ds.calMonth) {
      const n = st.month.m + Number(ds.calMonth);
      st.month = { y: st.month.y + Math.floor(n / 12), m: (n + 12) % 12 };
      // เลื่อนเดือน → เลือกวันที่ 1 (หรือวันนี้ถ้าอยู่เดือนนี้)
      const t = new Date();
      st.sel = st.month.y === t.getFullYear() && st.month.m === t.getMonth() ? todayKey() : toKey(new Date(st.month.y, st.month.m, 1));
    }
    else if (ds.qnEdit) { openQuickNote(rerenderPage, ds.qnEdit); return; }
    const sd = fromKey(st.sel); if (!ds.calMonth) st.month = { y: sd.getFullYear(), m: sd.getMonth() };
    rerenderPage();
  });
}
