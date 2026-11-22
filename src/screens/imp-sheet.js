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
const PEN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20 H8 L19 9 L15 5 L4 16 Z"/><path d="M13 7 L17 11"/></svg>';
const cname = k => getData().settings.noteColorNames?.[k] || CNAME[k];
const dLabel = k => { const d = fromKey(k); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`; };

export function openImpSheet(onSaved, id, date) {
  const old = id ? getData().importantDates.find(x => x.id === id) : null;
  const f = old ? { title: old.title, date: old.date, yearly: !!old.yearly, monthly: !!old.monthly, noteColor: old.noteColor || 'yellow' } : { title: '', date: date || todayKey(), yearly: false, monthly: false, noteColor: 'yellow' };
  let view = 'form', names = {};
  const namesPage = () => `<div class="im-names">${Object.entries(NOTE_COLORS).map(([k, [a, b]]) => `<label class="im-nrow"><span class="im-nsw" style="background:linear-gradient(180deg,${a},${b})"></span><input type="text" class="ea-input" maxlength="20" aria-label="ความหมายของสี${CNAME[k]}" placeholder="${CNAME[k]}" value="${esc(names[k] || '')}" data-im-name="${k}"></label>`).join('')}</div>
    <div class="pa-hint" style="margin-top:10px">ตั้งว่าแต่ละสีหมายถึงอะไร เช่น วันเกิด เดดไลน์</div>
    <button type="button" class="btn-primary" style="margin-top:16px" data-im-nsave>บันทึก</button>`;
  const body = () => view === 'names' ? namesPage() : `<div class="hn">
      <div><div class="ea-lab">ชื่อ</div><input type="text" class="ea-input" aria-label="ชื่อวันสำคัญ" value="${esc(f.title)}" data-im-title></div>
      <div><div class="ea-lab">วันที่</div><label class="ea-time pl-date"><span class="ea-ico">${CAL}</span><span style="flex:1">${dLabel(f.date)}</span><input type="date" class="td-dateinput" aria-label="วันที่" value="${f.date}" data-im-date></label></div>
      <div><div class="ea-lab">วนซ้ำ</div><div class="seg hn-seg">${[['n', 'ไม่วน'], ['m', 'ทุกเดือน'], ['y', 'ทุกปี']].map(([k, t]) => { const on = k === (f.monthly ? 'm' : f.yearly ? 'y' : 'n'); return `<button type="button" class="seg-btn${on ? ' on' : ''}" aria-pressed="${on}" data-im-rep="${k}">${t}</button>`; }).join('')}</div></div>
      <div><div class="im-lab-row"><span class="ea-lab" style="margin:0">สีโน้ต</span><button type="button" class="im-edit" data-im-names>${PEN}แก้ไข</button></div><div class="im-colors">${Object.entries(NOTE_COLORS).map(([k, [a, b]]) => `<button type="button" class="im-color${f.noteColor === k ? ' on' : ''}" aria-label="โน้ตสี${CNAME[k]} · ${esc(cname(k))}" aria-pressed="${f.noteColor === k}" data-im-color="${k}"><span class="im-sw" style="background:linear-gradient(180deg,${a},${b})"></span><span class="im-cn">${esc(cname(k))}</span></button>`).join('')}</div></div>
    </div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:20px">${old ? '<button type="button" class="btn-secondary" data-im-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-im-save>บันทึก</button></div>`;
  openSheet({
    title: old ? 'แก้วันสำคัญ' : 'เพิ่มวันสำคัญ', body,
    mount(el, close, render, head) {
      const title = old ? 'แก้วันสำคัญ' : 'เพิ่มวันสำคัญ';
      const back = () => { view = 'form'; head(title); render(); };
      el.addEventListener('input', e => { if (e.target.matches('[data-im-title]')) f.title = e.target.value; if (e.target.dataset.imName) names[e.target.dataset.imName] = e.target.value; });
      el.addEventListener('change', e => { if (e.target.matches('[data-im-date]') && e.target.value) { f.date = e.target.value; render(); } });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-im-rep],[data-im-color],[data-im-save],[data-im-del],[data-im-names],[data-im-nsave]');
        if (!b) return;
        const ds = b.dataset;
        if (ds.imNames !== undefined) { names = { ...(getData().settings.noteColorNames || {}) }; view = 'names'; head('ความหมายของสี', back); render(); return; }
        if (ds.imNsave !== undefined) {
          const clean = Object.fromEntries(Object.entries(names).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
          update(d => { d.settings.noteColorNames = clean; }); back(); return;
        }
        if (ds.imRep) { f.yearly = ds.imRep === 'y'; f.monthly = ds.imRep === 'm'; }
        else if (ds.imColor) f.noteColor = ds.imColor;
        else if (ds.imDel !== undefined) {
          if (!await confirmDelete({ title: `ลบ "${old.title}"?` })) return;
          update(d => { d.importantDates = d.importantDates.filter(x => x.id !== old.id); });
          close(); onSaved?.(); return;
        } else {
          const title = f.title.trim();
          if (!title) { el.querySelector('[data-im-title]').focus(); return; }
          const rec = { title, date: f.date, yearly: f.yearly, monthly: f.monthly, noteColor: f.noteColor };
          update(d => { const ex = old && d.importantDates.find(x => x.id === old.id); if (ex) Object.assign(ex, rec); else d.importantDates.push({ id: newId(), ...rec }); });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}
