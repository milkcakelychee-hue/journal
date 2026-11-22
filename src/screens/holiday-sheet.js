// เพิ่ม/แก้วันหยุด · ชื่อ "หยุดอะไร" + แตะเลือกได้หลายวัน · แก้ + ลบ แผ่นเดียวกัน (บลูขอ 22 พ.ย. 2569)
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, MONTHS, toKey, todayKey, fromKey, be } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const L = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), R = ic('<path d="M9.5 6 L15.5 12 L9.5 18"/>');

export const holidaysOn = (d, k) => (d.holidays || []).filter(h => h.dates.includes(k));

export function openHolidaySheet(onSaved, { id, date } = {}) {
  const old = id ? (getData().holidays || []).find(h => h.id === id) : null;
  const f = { name: old?.name || '', dates: new Set(old?.dates || (date ? [date] : [])) };
  const d0 = fromKey(old?.dates[0] || date || todayKey());
  const cal = { y: d0.getFullYear(), m: d0.getMonth() };
  let err = false;
  const grid = () => {
    const ws = getData().settings.weekStart, first = new Date(cal.y, cal.m, 1), lead = (first.getDay() - ws + 7) % 7;
    const n = new Date(cal.y, cal.m + 1, 0).getDate(), tk = todayKey();
    let cells = '<span></span>'.repeat(lead);
    for (let i = 1; i <= n; i++) {
      const k = toKey(new Date(cal.y, cal.m, i)), on = f.dates.has(k);
      cells += `<button type="button" class="hd-d${on ? ' on' : ''}${k === tk ? ' today' : ''}" aria-pressed="${on}" aria-label="${i} ${MONTHS[cal.m]}" data-hd-day="${k}">${i}</button>`;
    }
    return `<div class="hd-cal"><div class="hd-nav"><button type="button" class="cal-arrow" aria-label="ก่อนหน้า" data-hd-month="-1">${L}</button>
      <span>${MONTHS[cal.m]} <span style="color:var(--muted)">${be(cal.y)}</span></span>
      <button type="button" class="cal-arrow" aria-label="ถัดไป" data-hd-month="1">${R}</button></div>
      <div class="hd-g">${Array.from({ length: 7 }, (_, i) => `<span class="hd-h">${DAYS_SHORT[(ws + i) % 7]}</span>`).join('')}${cells}</div></div>`;
  };
  const body = () => `<div class="ea-lab">หยุดอะไร</div><input type="text" class="ea-input" maxlength="40" aria-label="หยุดอะไร" placeholder="เช่น ลาพักร้อน" value="${esc(f.name)}" data-hd-name>
    <div class="ea-lab" style="margin-top:16px">เลือกวัน</div>${grid()}
    <div class="hd-cnt${err ? ' err' : ''}">${f.dates.size ? `เลือกแล้ว ${f.dates.size} วัน` : 'แตะวันในปฏิทินได้หลายวัน'}</div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:16px">${old ? '<button type="button" class="btn-secondary" data-hd-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-hd-save>บันทึก</button></div>`;
  openSheet({
    title: old ? 'แก้วันหยุด' : 'เพิ่มวันหยุด', body,
    mount(el, close, render) {
      el.addEventListener('input', e => { if (e.target.matches('[data-hd-name]')) f.name = e.target.value; });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-hd-day],[data-hd-month],[data-hd-save],[data-hd-del]'); if (!b) return;
        const ds = b.dataset;
        if (ds.hdDay) { f.dates.has(ds.hdDay) ? f.dates.delete(ds.hdDay) : f.dates.add(ds.hdDay); err = false; render(); }
        else if (ds.hdMonth) { const n = cal.m + Number(ds.hdMonth); cal.y += Math.floor(n / 12); cal.m = (n + 12) % 12; render(); }
        else if (ds.hdDel !== undefined) {
          if (!await confirmDelete({ title: `ลบวันหยุด "${old.name}"?` })) return;
          update(d => { d.holidays = (d.holidays || []).filter(h => h.id !== old.id); });
          close(); onSaved?.();
        } else {
          const name = f.name.trim();
          if (!name) { el.querySelector('[data-hd-name]').focus(); return; }
          if (!f.dates.size) { err = true; render(); return; }
          const rec = { name, dates: [...f.dates].sort() };
          update(d => { d.holidays ||= []; if (old) Object.assign(d.holidays.find(h => h.id === old.id), rec); else d.holidays.push({ id: newId(), ...rec }); });
          close(); onSaved?.();
        }
      });
    },
  });
}
