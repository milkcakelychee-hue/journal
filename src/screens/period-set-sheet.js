// ตั้งรอบเดือน · บอร์ด Side-PeriodSet · ช่องตัวเลขพิมพ์ได้ + ปุ่ม ลด/เพิ่ม
import { getData, update } from '../store.js';
import { MONTHS_SHORT, fromKey, todayKey, addDays } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { predicted } from '../lib/period.js';

const MINUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12 H18"/></svg>';
const PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6 V18"/><path d="M6 12 H18"/></svg>';
const LIM = { len: [1, 15], cycle: [15, 60] };
const clamp = (k, v) => Math.min(LIM[k][1], Math.max(LIM[k][0], v));
const dm = dt => `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]}`;

function preview(v) {
  const d0 = getData();
  const d = { ...d0, settings: { ...d0.settings, periodDefaultLen: v.len, periodDefaultCycle: v.cycle } };
  const tk = todayKey();
  const { next, s } = predicted(d, tk, tk);
  const foot = 'ค่าที่ตั้งไว้ด้านบนใช้เมื่อมีรอบจริงไม่ถึง 3 รอบ';
  if (!next) return `<span class="ps-sub">${foot}</span>`;
  const a = fromKey(next), b = addDays(a, s.len - 1), t = fromKey(tk);
  const rng = a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}` : `${dm(a)}–${dm(b)}`;
  const nextMonth = (a.getFullYear() * 12 + a.getMonth()) - (t.getFullYear() * 12 + t.getMonth()) === 1;
  const last = fromKey(s.eps[s.eps.length - 1].start);
  const how = s.real ? `รอบเดือนเฉลี่ย ${s.cycle} วัน (จากรอบจริง ${s.n} รอบล่าสุด)` : `รอบเดือนประมาณ ${s.cycle} วัน (ค่าที่ตั้งไว้)`;
  return `${nextMonth ? 'เดือนหน้าคาดว่าจะมา' : 'คาดว่าจะมา'} <b>${rng}</b><br><span class="ps-sub">คำนวณจากวันแรกของรอบล่าสุด (${dm(last)}) + ${how} ${foot}</span>`;
}

export function openPeriodSetSheet(onSaved) {
  const st = getData().settings;
  const v = { len: st.periodDefaultLen, cycle: st.periodDefaultCycle };
  const row = (k, label, aria) => `<div class="ps-row"><span class="ps-l">${label}</span><span class="ps-ctl">
      <button type="button" class="ps-btn" aria-label="ลด" data-ps-step="${k}" data-d="-1">${MINUS}</button>
      <label class="ps-num"><input type="text" inputmode="numeric" pattern="[0-9]*" aria-label="${aria}" value="${v[k]}" data-ps-in="${k}"><span>วัน</span></label>
      <button type="button" class="ps-btn" aria-label="เพิ่ม" data-ps-step="${k}" data-d="1">${PLUS}</button></span></div>`;
  const body = () => `<div class="ps">
      <div>${row('len', 'ปกติมากี่วัน (ค่าเริ่มต้น)', 'ปกติมากี่วัน')}<div class="ps-div"></div>${row('cycle', 'รอบเดือนประมาณ (ค่าเริ่มต้น)', 'รอบเดือนประมาณ')}</div>
      <div class="ps-box" data-ps-prev>${preview(v)}</div>
    </div>
    <button type="button" class="btn-primary" style="margin-top:20px" data-ps-save>บันทึก</button>`;
  openSheet({
    title: 'รอบเดือน', body,
    mount(el, close) {
      const prev = () => { el.querySelector('[data-ps-prev]').innerHTML = preview(v); };
      const commit = inp => { const k = inp.dataset.psIn; const n = parseInt(inp.value, 10); v[k] = clamp(k, isNaN(n) ? v[k] : n); inp.value = v[k]; prev(); };
      el.addEventListener('input', e => {
        const inp = e.target.closest('[data-ps-in]'); if (!inp) return;
        inp.value = inp.value.replace(/\D/g, '').slice(0, 2);
        const k = inp.dataset.psIn, n = parseInt(inp.value, 10);
        if (!isNaN(n) && n >= LIM[k][0] && n <= LIM[k][1]) { v[k] = n; prev(); }
      });
      el.addEventListener('focusout', e => { const inp = e.target.closest('[data-ps-in]'); if (inp) commit(inp); });
      el.addEventListener('click', e => {
        const sb = e.target.closest('[data-ps-step]');
        if (sb) { const k = sb.dataset.psStep; v[k] = clamp(k, v[k] + +sb.dataset.d); el.querySelector(`[data-ps-in="${k}"]`).value = v[k]; prev(); return; }
        if (e.target.closest('[data-ps-save]')) {
          el.querySelectorAll('[data-ps-in]').forEach(commit);
          update(d => { d.settings.periodDefaultLen = v.len; d.settings.periodDefaultCycle = v.cycle; });
          close(); onSaved?.();
        }
      });
    },
  });
}
