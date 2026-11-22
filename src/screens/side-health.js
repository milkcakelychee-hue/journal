// แยกด้าน · สุขภาพ · มุมมองเดือน (Side-Health) ส่วนประจำเดือน
// + บันทึกประจำเดือน (ปุ่มบันทึก / แตะวัน) · ตั้งค่า / วิตามิน / ยา / อาการป่วย / มุมมองปี ทำในขั้นถัดไป
import { getData } from '../store.js';
import { DAYS_SHORT, MONTHS, MONTHS_SHORT, toKey, fromKey, todayKey, addDays } from '../lib/date-th.js';
import { predicted } from '../lib/period.js';
import { openPeriodSheet } from './period-sheet.js';

const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');
const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 6 L8.5 12 L14.5 18"/></svg>';
const PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>';
const PENCIL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 a2.1 2.1 0 0 0 0 -3 l-1 -1 a2.1 2.1 0 0 0 -3 0 L4 16 Z"/></svg>';
export const FLOW = { h: '#8E2C44', m: '#B8475E', l: '#D98A9C' };
const HATCH_W = 'repeating-linear-gradient(135deg,rgba(255,255,255,0.75) 0px,rgba(255,255,255,0.75) 1px,transparent 1px,transparent 4px)';
const HATCH_P = 'repeating-linear-gradient(135deg,#C4B7EA 0px,#C4B7EA 1px,transparent 1px,transparent 4px)';

const st = { view: 'month', y: 0, m: 0 };
export function resetSideHealth() { const t = new Date(); Object.assign(st, { view: 'month', y: t.getFullYear(), m: t.getMonth() }); }
resetSideHealth();

// ช่องวันหนึ่งวัน (ใช้ร่วมกับมุมมองปีภายหลัง)
export function dayCell(d, k, i, pred) {
  const tk = todayKey();
  const p = (d.periodLog || []).find(x => x.date === k);
  const sym = (d.symptomLog || []).some(x => x.date === k);
  const drug = (d.drugLog || []).some(x => x.date === k);
  let bg = '', color = k > tk ? '#C2C2C7' : 'var(--ink)', bold = false, extra = '';
  if (p) { bg = sym ? `${HATCH_W},${FLOW[p.flow] || FLOW.m}` : FLOW[p.flow] || FLOW.m; color = '#fff'; bold = true; }
  else if (sym) { bg = HATCH_P; color = 'var(--ink)'; bold = true; }
  else if (pred.has(k)) extra = 'border:1.5px dashed #D98A9C;';
  const ring = k === tk ? 'box-shadow:0 0 0 1.5px #fff,0 0 0 3px var(--ink);' : drug ? 'box-shadow:0 0 0 1.5px #fff,0 0 0 3px #B5B5BB;' : '';
  return `<span class="hl-day"${k <= tk ? ` data-hl-day="${k}"` : ''}><span class="hl-n${k <= tk ? ' tap' : ''}" style="${bg ? `background:${bg};` : ''}color:${color};${bold ? 'font-weight:600;' : ''}${extra}${ring}">${i}</span><span class="hl-dot"${p?.cramps ? ' style="background:var(--ink)"' : ''}></span></span>`;
}

function periodCard(d) {
  const { y, m } = st, ws = d.settings.weekStart, tk = todayKey();
  const n = new Date(y, m + 1, 0).getDate(), off = (new Date(y, m, 1).getDay() - ws + 7) % 7;
  const { set, next, s } = predicted(d, toKey(new Date(y, m, 1)), toKey(new Date(y, m, n)));
  let cells = Array.from({ length: 7 }, (_, i) => `<span class="hl-dn">${DAYS_SHORT[(ws + i) % 7]}</span>`).join('') + '<span></span>'.repeat(off);
  for (let i = 1; i <= n; i++) cells += dayCell(d, toKey(new Date(y, m, i)), i, set);
  const anyPred = set.size > 0;
  let note = '';
  if (next) {
    const a = fromKey(next), b = addDays(a, s.len - 1), t = fromKey(tk);
    const rng = a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}` : `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`;
    const days = Math.round((a - t) / 864e5);
    const nextMonth = (a.getFullYear() * 12 + a.getMonth()) - (t.getFullYear() * 12 + t.getMonth()) === 1;
    note = `<div class="hl-pred">${nextMonth ? 'เดือนหน้าคาดว่าจะมา' : 'คาดว่าจะมา'} <b>${rng}</b>${days > 0 ? ` (อีก ${days} วัน)` : ''}</div>`;
  }
  return `<div class="hb-sh hl-sh"><h2>ประจำเดือน</h2><button type="button" class="hl-btn" data-hl-log>${PLUS}บันทึก</button></div>
    <div class="card hl-card">
      <div class="hl-grid">${cells}</div>
      <div class="hl-leg"><span><i style="background:${FLOW.h}"></i>มาก</span><span><i style="background:${FLOW.m}"></i>ปานกลาง</span><span><i style="background:${FLOW.l}"></i>น้อย</span><span><i class="dot"></i>ปวดท้อง</span><span><i class="sym" style="background:${HATCH_P}"></i>อาการป่วย</span><span><i class="drug"></i>กินยา</span>${anyPred ? '<span><i class="pred"></i>คาดว่าจะมา</span>' : ''}</div>
      <button type="button" class="hl-stats" data-hl-set>
        <div><div class="hl-sl">${s.real ? 'มาเฉลี่ย' : 'ปกติมา'}</div><div class="hl-sv">${s.len} วัน</div></div>
        <div><div class="hl-sl">${s.real ? 'รอบเดือนเฉลี่ย' : 'รอบเดือนประมาณ'}</div><div class="hl-sv">${s.cycle} วัน</div></div>
        <span class="hl-edit" aria-label="แก้ไขรอบเดือน">${PENCIL}</span></button>
      <div class="hl-src">${s.real ? `เฉลี่ยจากรอบจริง ${s.n} รอบล่าสุด` : `ใช้ค่าที่ตั้งไว้ · มีข้อมูลจริง ${s.n} รอบ`}</div>
      ${note}
    </div>`;
}

export function renderSideHealth() {
  const d = getData();
  const seg = id => `<button type="button" class="seg-btn${st.view === id ? ' on' : ''}" aria-pressed="${st.view === id}" data-hl-view="${id}">${id === 'month' ? 'เดือน' : 'ปี'}</button>`;
  return `<div class="side">
    <button type="button" class="side-back" data-side-back>${BACK}แยกด้าน</button>
    <h1 class="h-page side-title">สุขภาพ</h1>
    <div class="seg" style="margin:0">${seg('month')}${seg('year')}</div>
    ${st.view === 'month' ? `<div class="sm-nav"><button type="button" class="cal-arrow" aria-label="เดือนก่อน" data-hl-month="-1">${L}</button>
      <div class="sm-title">${MONTHS[st.m]} <span style="color:var(--muted)">${st.y + 543}</span></div>
      <button type="button" class="cal-arrow" aria-label="เดือนถัดไป" data-hl-month="1">${R}</button></div>
    ${periodCard(d)}` : ''}
  </div>`;
}

export function mountSideHealth(root, rerender) {
  root.addEventListener('click', e => {
    if (e.target.closest('[data-hl-log]')) { openPeriodSheet(rerender); return; }
    const day = e.target.closest('[data-hl-day]');
    if (day) { openPeriodSheet(rerender, day.dataset.hlDay); return; }
    const b = e.target.closest('[data-hl-view],[data-hl-month]');
    if (!b) return;
    if (b.dataset.hlView) st.view = b.dataset.hlView;
    else { const n = st.m + Number(b.dataset.hlMonth); st.y += Math.floor(n / 12); st.m = (n + 12) % 12; }
    rerender();
  });
}
