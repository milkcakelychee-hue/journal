// สร้าง/แก้ Habit · บอร์ด Side-HabitNew · แก้ + ลบ ใช้แผ่นเดียวกัน (บลูอนุมัติ 22 พ.ย. 2569)
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { HABIT_COLORS } from './side-habit.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // จ → อา ตามบอร์ด

export function openHabitSheet(onSaved, id) {
  const old = id ? getData().habits.find(h => h.id === id) : null;
  const f = old ? { type: old.type || 'build', name: old.name, color: old.color, kind: old.freq?.kind || 'daily', days: [...(old.freq?.days || [])] }
    : { type: 'build', name: '', color: '#6C9BD1', kind: 'daily', days: [] };
  const seg = (key, val, label) => `<button type="button" class="seg-btn${f[key] === val ? ' on' : ''}" aria-pressed="${f[key] === val}" data-hn-${key}="${val}">${label}</button>`;
  const body = () => `<div class="hn">
      <div><div class="ea-lab">ประเภท</div><div class="seg hn-seg">${seg('type', 'build', 'นิสัยที่อยากสร้าง')}${seg('type', 'quit', 'นิสัยที่อยากเลิก')}</div></div>
      <div><div class="ea-lab">ชื่อ</div><input type="text" class="ea-input" aria-label="ชื่อ Habit" value="${esc(f.name)}" data-hn-name></div>
      <div><div class="ea-lab">สี</div><div class="hn-colors">${HABIT_COLORS.map((c, i) => `<button type="button" class="hn-color${f.color === c ? ' on' : ''}" aria-label="สี ${i + 1}" aria-pressed="${f.color === c}" style="background:${c}" data-hn-color="${c}"></button>`).join('')}</div></div>
      <div><div class="ea-lab">ความถี่</div><div class="seg hn-seg hn-small">${seg('kind', 'daily', 'ทุกวัน')}${seg('kind', 'alt', 'วันเว้นวัน')}${seg('kind', 'custom', 'กำหนดวันเอง')}</div></div>
      ${f.kind === 'custom' ? `<div><div class="ea-lab">เลือกวัน</div><div class="hn-days">${WEEK.map(i => `<button type="button" class="hn-day${f.days.includes(i) ? ' on' : ''}" aria-pressed="${f.days.includes(i)}" data-hn-day="${i}">${DAYS_SHORT[i]}</button>`).join('')}</div></div>` : ''}
    </div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:20px">${old ? '<button type="button" class="btn-secondary" data-hn-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-hn-save>บันทึก</button></div>`;
  openSheet({
    title: old ? 'แก้ Habit' : 'สร้าง Habit', body,
    mount(el, close, render) {
      el.addEventListener('input', e => { if (e.target.matches('[data-hn-name]')) f.name = e.target.value; });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-hn-type],[data-hn-kind],[data-hn-color],[data-hn-day],[data-hn-save],[data-hn-del]');
        if (!b) return;
        const ds = b.dataset;
        if (ds.hnType) f.type = ds.hnType;
        else if (ds.hnKind) f.kind = ds.hnKind;
        else if (ds.hnColor) f.color = ds.hnColor;
        else if (ds.hnDay) { const i = Number(ds.hnDay); f.days = f.days.includes(i) ? f.days.filter(x => x !== i) : [...f.days, i]; }
        else if (ds.hnDel !== undefined) {
          if (!await confirmDelete({ title: `ลบ "${old.name}"?` })) return;
          update(d => { d.habits = d.habits.filter(h => h.id !== old.id); delete d.habitLog[old.id]; });
          close(); onSaved?.(); return;
        }
        else {
          const name = f.name.trim();
          if (!name) { el.querySelector('[data-hn-name]').focus(); return; }
          if (f.kind === 'custom' && !f.days.length) return; // ต้องเลือกอย่างน้อย 1 วัน
          const rec = { name, type: f.type, freq: { kind: f.kind, days: f.kind === 'custom' ? f.days : [] }, color: f.color };
          update(d => { if (old) Object.assign(d.habits.find(h => h.id === old.id), rec); else d.habits.push({ id: newId(), ...rec, startDate: todayKey() }); });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}
