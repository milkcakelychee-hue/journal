// เพิ่ม/แก้วันสำคัญ · บอร์ด Imp-New · แก้ + ลบ ใช้แผ่นเดียวกัน (แบบเดียวกับ Habit)
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { MONTHS_SHORT, fromKey, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { NOTE_COLORS } from '../lib/important.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CAL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="15" rx="3.5"/><path d="M4 10.5 H20"/><path d="M8.5 3.5 V7.5"/><path d="M15.5 3.5 V7.5"/></svg>';
const CNAME = { yellow: 'เหลือง', blue: 'ฟ้า', pink: 'ชมพู', green: 'เขียว' };
const dLabel = k => { const d = fromKey(k); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`; };

export function openImpSheet(onSaved, id) {
  const old = id ? getData().importantDates.find(x => x.id === id) : null;
  const f = old ? { title: old.title, date: old.date, yearly: !!old.yearly, noteColor: old.noteColor || 'yellow' } : { title: '', date: todayKey(), yearly: false, noteColor: 'yellow' };
  const body = () => `<div class="hn">
      <div><div class="ea-lab">ชื่อ</div><input type="text" class="ea-input" aria-label="ชื่อวันสำคัญ" value="${esc(f.title)}" data-im-title></div>
      <div><div class="ea-lab">วันที่</div><label class="ea-time pl-date"><span class="ea-ico">${CAL}</span><span style="flex:1">${dLabel(f.date)}</span><input type="date" class="td-dateinput" aria-label="วันที่" value="${f.date}" data-im-date></label></div>
      <div class="ea-sw-row"><div><div class="ea-sw-t">ทุกปี</div><div class="ea-sw-s">วนซ้ำทุกปีในวันเดียวกัน</div></div>
        <button type="button" role="switch" aria-checked="${f.yearly}" aria-label="ทุกปี" class="ea-sw${f.yearly ? ' on' : ''}" data-im-yearly><span></span></button></div>
      <div><div class="ea-lab">สีโน้ต</div><div class="im-colors">${Object.entries(NOTE_COLORS).map(([k, [a, b]]) => `<button type="button" class="im-color${f.noteColor === k ? ' on' : ''}" aria-label="โน้ตสี${CNAME[k]}" aria-pressed="${f.noteColor === k}" style="background:linear-gradient(180deg,${a},${b})" data-im-color="${k}"></button>`).join('')}</div></div>
    </div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:20px">${old ? '<button type="button" class="btn-secondary" data-im-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-im-save>บันทึก</button></div>`;
  openSheet({
    title: old ? 'แก้วันสำคัญ' : 'เพิ่มวันสำคัญ', body,
    mount(el, close, render) {
      el.addEventListener('input', e => { if (e.target.matches('[data-im-title]')) f.title = e.target.value; });
      el.addEventListener('change', e => { if (e.target.matches('[data-im-date]') && e.target.value) { f.date = e.target.value; render(); } });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-im-yearly],[data-im-color],[data-im-save],[data-im-del]');
        if (!b) return;
        const ds = b.dataset;
        if (ds.imYearly !== undefined) f.yearly = !f.yearly;
        else if (ds.imColor) f.noteColor = ds.imColor;
        else if (ds.imDel !== undefined) {
          if (!await confirmDelete({ title: `ลบ "${old.title}"?` })) return;
          update(d => { d.importantDates = d.importantDates.filter(x => x.id !== old.id); });
          close(); onSaved?.(); return;
        } else {
          const title = f.title.trim();
          if (!title) { el.querySelector('[data-im-title]').focus(); return; }
          const rec = { title, date: f.date, yearly: f.yearly, noteColor: f.noteColor };
          update(d => { const ex = old && d.importantDates.find(x => x.id === old.id); if (ex) Object.assign(ex, rec); else d.importantDates.push({ id: newId(), ...rec }); });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}
