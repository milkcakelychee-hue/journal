import { resetSidePhoto } from './side-photo.js';
import { resetSideHealth } from './side-health.js';
import { resetSideHabit } from './side-habit.js';
import { openEventSheet } from './event-sheet.js';
import { resetSideJournal } from './side-journal.js';
import { openHolidaySheet, openWfhSheet, holidaysOn, isWfh } from './holiday-sheet.js';
import { tagRow } from './calendar.js';
// หน้าวันนี้ · บอร์ด Main
import { getData } from '../store.js';
import { renderTodoCard, bindTodo } from './todo.js';
import { renderEventsToday } from './events-today.js';
import { renderTilesToday } from './tiles-today.js';
import { renderMoodCard, bindMood } from './mood-today.js';
import { openQuickNote, renderQuickNotesToday } from './quicknote.js';
import { upcoming, impNoteHtml } from '../lib/important.js';
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, toKey, todayKey, weekOf, monthYear } from '../lib/date-th.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// จุดใต้วันที่ = สีอารมณ์ที่บันทึกในวันนั้น
function moodColor(d, key) {
  const log = d.moodLog[key];
  return log ? d.moods.find(m => m.id === log.moodId)?.color : null;
}

function weekStrip(d) {
  const now = new Date();
  const tk = todayKey();
  const days = weekOf(now, d.settings.weekStart);
  return `<section class="wk">
    <div class="wk-title">${monthYear(now)}</div>
    <div class="wk-row">${days.map(day => {
      const k = toKey(day);
      const today = k === tk;
      const past = k < tk;
      const color = moodColor(d, k);
      // แถบนี้แสดงวันที่อย่างเดียว แตะไม่ได้ (ดูย้อนหลังในปฏิทิน)
      const hol = holidaysOn(d, k)[0];
      return `<div class="wk-day${today ? ' today' : ''}${past ? ' past' : ''}${hol ? ' hol-bg' : isWfh(d, k) ? ' wfh-bg' : ''}" aria-label="${DAYS_SHORT[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}${hol ? ` · วันหยุด ${esc(hol.name)}` : ''}"${today ? ' aria-current="date"' : ''}>
        <span class="wk-dn">${DAYS_SHORT[day.getDay()]}</span><span class="wk-num">${day.getDate()}</span><span class="wk-dot"${color ? ` style="background:${color}"` : ''}></span></div>`;
    }).join('')}</div>
    ${tagRow(d, tk, 'margin:10px 0 0')}
  </section>`;
}

const CHEVRON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6 L15.5 12 L9.5 18"/></svg>';

// วันสำคัญที่ใกล้ถึง · ไม่มีเลย = ไม่แสดงส่วนนี้ (บอร์ด Today-Empty)
function importantSection(d) {
  const list = upcoming(d.importantDates, new Date(), d.settings.importantDaysAhead);
  if (!list.length) return '';
  return `<section>
    <div class="sec-head"><h2 class="h-sec">วันสำคัญที่ใกล้ถึง</h2>
      <a href="#sides/important/today" class="sec-more" aria-label="ดูวันสำคัญทั้งหมด">${CHEVRON}</a></div>
    <div class="imp-row">${list.map((x, i) => impNoteHtml(x, x.inDays, i)).join('')}</div>
  </section>`;
}

// หลอดเวลาปี (บลูขอ 27 พ.ย. 2569) · ส่วนที่ผ่านไป = เส้นทึบ · ที่เหลือ = เส้นประ · กว้างเท่าแถบ 7 วัน
function yearBar() {
  const t = new Date(), y = t.getFullYear(), total = (new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / 864e5;
  const day = Math.round((new Date(y, t.getMonth(), t.getDate()) - new Date(y, 0, 1)) / 864e5) + 1, left = total - day;
  const pct = day / total * 100, leftPct = Math.round(left / total * 100);
  return `<div class="yb" role="img" aria-label="วันนี้วันที่ ${day} จาก ${total} วันของปี เหลือ ${left} วัน ${leftPct}%">
    <div class="yb-bar"><i style="width:${pct}%"></i></div>
    <div class="yb-row"><span>วันที่ ${day} / ${total}</span><span>เหลืออีก ${left} วันจะหมดปีนี้ · ${leftPct}%</span></div></div>`;
}

export function renderToday() {
  const d = getData();
  const name = d.settings.name ? ` ${esc(d.settings.name)}` : '';
  return `<div class="today">
    <div><h1 class="h-page">สวัสดี${name}</h1></div>
    ${yearBar()}
    ${weekStrip(d)}
    ${importantSection(d)}
    <div id="todo-slot">${renderTodoCard()}</div>
    ${renderEventsToday()}
    ${renderTilesToday()}
    <div id="mood-slot">${renderMoodCard()}</div>
    <div id="qn-slot">${renderQuickNotesToday()}</div>
  </div>`;
}

// กลับจากหน้าย่อย → เลื่อนไปตำแหน่งเดิมของหน้าวันนี้ (บลูขอ 26 พ.ย. 2569)
let backY = null;
export function mountToday(root, rerender) {
  if (backY != null) { const y = backY; backY = null; requestAnimationFrame(() => scrollTo(0, y)); }
  const slot = () => root.querySelector('#todo-slot');
  bindTodo(root, () => { slot().innerHTML = renderTodoCard(); });
  // บันทึกอารมณ์แล้ว แถบสัปดาห์ด้านบนต้องเปลี่ยนสีจุดด้วย → วาดทั้งหน้าใหม่
  bindMood(root, () => {
    root.querySelector('#mood-slot').innerHTML = renderMoodCard();
    const wk = root.querySelector('.wk'); if (wk) wk.outerHTML = weekStrip(getData());
  });
  root.addEventListener('click', e => {
    if (e.target.closest('[data-go],a[href$="/today"]')) backY = scrollY;
    const go = e.target.closest('[data-go]')?.dataset.go;
    const redrawQn = () => { root.querySelector('#qn-slot').innerHTML = renderQuickNotesToday(); };
    if (go === 'quicknote') openQuickNote(redrawQn);
    if (go === 'health') { resetSideHealth(); location.hash = 'sides/health/today'; return; }
    if (go === 'habit') { resetSideHabit(); location.hash = 'sides/habit/today'; return; }
    if (go === 'photo') { resetSidePhoto(); location.hash = 'sides/photo/today'; return; }
    if (go === 'journal') { resetSideJournal(); location.hash = 'sides/journal/today'; return; }
    const ho = e.target.closest('[data-hol-open]')?.dataset.holOpen;
    if (ho) { openHolidaySheet(rerender, { id: ho }); return; }
    if (e.target.closest('[data-wfh-add]')) { openWfhSheet(rerender, todayKey()); return; }
    const ea = e.target.closest('[data-event-add],[data-event-open]');
    if (ea) { openEventSheet(ea.dataset.eventOpen ? { id: ea.dataset.eventOpen } : { date: todayKey() }, rerender); return; }
    const qe = e.target.closest('[data-qn-edit]')?.dataset.qnEdit;
    if (qe) openQuickNote(redrawQn, qe);
  });
}
