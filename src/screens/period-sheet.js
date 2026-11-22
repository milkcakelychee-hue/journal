// บันทึกประจำเดือน · บอร์ด Side-PeriodLog · วันที่มีบันทึกแล้ว = แก้ + ลบ
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { MONTHS_SHORT, fromKey, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { FLOW } from './side-health.js';

const CAL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="15" rx="3.5"/><path d="M4 10.5 H20"/><path d="M8.5 3.5 V7.5"/><path d="M15.5 3.5 V7.5"/></svg>';
const CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 L10 17 L19 7.5"/></svg>';
const dLabel = k => { const d = fromKey(k); return `${k === todayKey() ? 'วันนี้ · ' : ''}${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`; };

export function openPeriodSheet(onSaved, date = todayKey()) {
  let f = null, old = null;
  const load = k => { old = getData().periodLog.find(x => x.date === k) || null; f = old ? { date: k, flow: old.flow, cramps: !!old.cramps, ended: !!old.ended } : { date: k, flow: 'm', cramps: false, ended: false }; };
  load(date);
  const flowBtn = (k, label) => `<button type="button" class="pl-flow${f.flow === k ? ' on' : ''}" aria-pressed="${f.flow === k}" data-pl-flow="${k}"><span style="background:${FLOW[k]}"></span><b>${label}</b></button>`;
  const body = () => `<div class="hn">
      <div><div class="ea-lab">วันที่</div><label class="ea-time pl-date"><span class="ea-ico">${CAL}</span><span style="flex:1">${dLabel(f.date)}</span>
        <input type="date" class="td-dateinput" max="${todayKey()}" value="${f.date}" data-pl-date></label></div>
      <div><div class="ea-lab">ปริมาณ</div><div class="pl-flows">${flowBtn('h', 'มาก')}${flowBtn('m', 'ปานกลาง')}${flowBtn('l', 'น้อย')}</div></div>
      <div class="ea-sw-row"><div><div class="ea-sw-t">ปวดท้อง</div><div class="ea-sw-s">วันนี้มีอาการปวดท้องไหม</div></div>
        <button type="button" role="switch" aria-checked="${f.cramps}" aria-label="ปวดท้อง" class="ea-sw${f.cramps ? ' on' : ''}" data-pl-cramps><span></span></button></div>
      <button type="button" role="checkbox" aria-checked="${f.ended}" class="pl-end" data-pl-ended><span class="pl-box${f.ended ? ' on' : ''}">${f.ended ? CHECK : ''}</span><span class="pl-et">ประจำเดือนหมดแล้ว</span><span class="pl-es">วันสุดท้ายของรอบ</span></button>
    </div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:20px">${old ? '<button type="button" class="btn-secondary" data-pl-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-pl-save>บันทึก</button></div>`;
  openSheet({
    title: 'บันทึกประจำเดือน', body,
    mount(el, close, render) {
      el.addEventListener('change', e => { if (e.target.matches('[data-pl-date]') && e.target.value && e.target.value <= todayKey()) { load(e.target.value); render(); } });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-pl-flow],[data-pl-cramps],[data-pl-ended],[data-pl-save],[data-pl-del]');
        if (!b) return;
        const ds = b.dataset;
        if (ds.plFlow) f.flow = ds.plFlow;
        else if (ds.plCramps !== undefined) f.cramps = !f.cramps;
        else if (ds.plEnded !== undefined) f.ended = !f.ended;
        else if (ds.plDel !== undefined) {
          const d0 = fromKey(f.date);
          if (!await confirmDelete({ title: `ลบบันทึกวันที่ ${d0.getDate()} ${MONTHS_SHORT[d0.getMonth()]}?` })) return;
          update(d => { d.periodLog = d.periodLog.filter(x => x.date !== f.date); });
          close(); onSaved?.(); return;
        } else {
          update(d => {
            const ex = d.periodLog.find(x => x.date === f.date);
            if (ex) Object.assign(ex, { flow: f.flow, cramps: f.cramps, ended: f.ended });
            else d.periodLog.push({ id: newId(), ...f });
          });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}
