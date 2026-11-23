// สร้าง/แก้ Habit · บอร์ด Side-HabitNew · แก้ + ลบ ใช้แผ่นเดียวกัน (บลูอนุมัติ 22 พ.ย. 2569)
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { HABIT_COLORS } from './side-habit.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MINUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 12 H18"/></svg>';
const PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 6 V18"/><path d="M6 12 H18"/></svg>';
const clampPer = n => Math.min(7, Math.max(1, n));
const perMonth = n => `ประมาณ ${Math.round(n * 30 / 7)} วันต่อเดือน (คิดตามจำนวนวันของแต่ละเดือน)`;
const WEEK = [1, 2, 3, 4, 5, 6, 0]; // จ → อา ตามบอร์ด

export function openHabitSheet(onSaved, id) {
  const old = id ? getData().habits.find(h => h.id === id) : null;
  const f = old ? { type: old.type || 'build', name: old.name, color: old.color, kind: old.freq?.kind || 'daily', days: [...(old.freq?.days || [])], per: old.freq?.per || 3, notes: old.notes ?? Object.keys(getData().habitNotes?.[old.id] || {}).length > 0 }
    : { type: 'build', name: '', color: '#6C9BD1', kind: 'daily', days: [], per: 3, notes: false };
  const seg = (key, val, label) => `<button type="button" class="seg-btn${f[key] === val ? ' on' : ''}" aria-pressed="${f[key] === val}" data-hn-${key}="${val}">${label}</button>`;
  const body = () => `<div class="hn">
      <div><div class="ea-lab">ประเภท</div><div class="seg hn-seg">${seg('type', 'build', 'นิสัยที่อยากสร้าง')}${seg('type', 'quit', 'นิสัยที่อยากเลิก')}</div></div>
      <div><div class="ea-lab">ชื่อ</div><input type="text" class="ea-input" aria-label="ชื่อ Habit" value="${esc(f.name)}" data-hn-name></div>
      <div><div class="ea-lab">สี</div><div class="hn-colors">${HABIT_COLORS.map((c, i) => `<button type="button" class="hn-color${f.color === c ? ' on' : ''}" aria-label="สี ${i + 1}" aria-pressed="${f.color === c}" style="background:${c}" data-hn-color="${c}"></button>`).join('')}</div></div>
      <div><div class="ea-lab">ความถี่</div><div class="seg hn-seg hn-small">${seg('kind', 'daily', 'ทุกวัน')}${seg('kind', 'alt', 'วันเว้นวัน')}${seg('kind', 'custom', 'กำหนดวันเอง')}${seg('kind', 'weekly', 'ต่อสัปดาห์')}</div></div>
      ${f.kind === 'weekly' ? `<div><div class="ps-row" style="padding:0"><span class="ps-l">สัปดาห์ละ</span><span class="ps-ctl">
        <button type="button" class="ps-btn" aria-label="ลด" data-hn-per="-1">${MINUS}</button>
        <label class="ps-num"><input type="text" inputmode="numeric" pattern="[0-9]*" aria-label="สัปดาห์ละกี่วัน" value="${f.per}" data-hn-perin><span>วัน</span></label>
        <button type="button" class="ps-btn" aria-label="เพิ่ม" data-hn-per="1">${PLUS}</button></span></div>
        <div class="hd-cnt" data-hn-month>${perMonth(f.per)}</div></div>` : ''}
      <div class="ea-sw-row"><div><div class="ea-sw-t">โน้ตรายวัน</div><div class="ea-sw-s">มีปุ่มจดโน้ตสั้น ๆ และสรุปโน้ตในหน้าปี</div></div>
        <button type="button" role="switch" aria-checked="${f.notes}" aria-label="โน้ตรายวัน" class="ea-sw${f.notes ? ' on' : ''}" data-hn-notes><span></span></button></div>
      ${f.kind === 'custom' ? `<div><div class="ea-lab">เลือกวัน</div><div class="hn-days">${WEEK.map(i => `<button type="button" class="hn-day${f.days.includes(i) ? ' on' : ''}" aria-pressed="${f.days.includes(i)}" data-hn-day="${i}">${DAYS_SHORT[i]}</button>`).join('')}</div></div>` : ''}
    </div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:20px">${old ? '<button type="button" class="btn-secondary" data-hn-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-hn-save>บันทึก</button></div>`;
  openSheet({
    title: old ? 'แก้ Habit' : 'สร้าง Habit', body,
    mount(el, close, render) {
      el.addEventListener('input', e => {
        if (e.target.matches('[data-hn-name]')) f.name = e.target.value;
        if (e.target.matches('[data-hn-perin]')) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 1); const n = parseInt(e.target.value, 10); if (n >= 1 && n <= 7) { f.per = n; el.querySelector('[data-hn-month]').textContent = perMonth(n); } }
      });
      el.addEventListener('focusout', e => { if (e.target.matches('[data-hn-perin]')) e.target.value = f.per; });
      el.addEventListener('click', async e => {
        const pb = e.target.closest('[data-hn-per]');
        if (pb) { f.per = clampPer(f.per + Number(pb.dataset.hnPer)); el.querySelector('[data-hn-perin]').value = f.per; el.querySelector('[data-hn-month]').textContent = perMonth(f.per); return; }
        const b = e.target.closest('[data-hn-type],[data-hn-notes],[data-hn-kind],[data-hn-color],[data-hn-day],[data-hn-save],[data-hn-del]');
        if (!b) return;
        const ds = b.dataset;
        if (ds.hnNotes !== undefined) f.notes = !f.notes;
        else if (ds.hnType) f.type = ds.hnType;
        else if (ds.hnKind) f.kind = ds.hnKind;
        else if (ds.hnColor) f.color = ds.hnColor;
        else if (ds.hnDay) { const i = Number(ds.hnDay); f.days = f.days.includes(i) ? f.days.filter(x => x !== i) : [...f.days, i]; }
        else if (ds.hnDel !== undefined) {
          if (!await confirmDelete({ title: `ลบ "${old.name}"?` })) return;
          update(d => { d.habits = d.habits.filter(h => h.id !== old.id); delete d.habitLog[old.id]; if (d.habitNotes) delete d.habitNotes[old.id]; });
          close(); onSaved?.(); return;
        }
        else {
          const name = f.name.trim();
          if (!name) { el.querySelector('[data-hn-name]').focus(); return; }
          if (f.kind === 'custom' && !f.days.length) return; // ต้องเลือกอย่างน้อย 1 วัน
          const rec = { name, type: f.type, freq: { kind: f.kind, days: f.kind === 'custom' ? f.days : [], ...(f.kind === 'weekly' ? { per: f.per } : {}) }, color: f.color, notes: f.notes };
          update(d => { if (old) Object.assign(d.habits.find(h => h.id === old.id), rec); else d.habits.push({ id: newId(), ...rec, startDate: todayKey() }); });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}
