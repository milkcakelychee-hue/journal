// เพิ่มวิตามิน · บอร์ด Side-VitNew · เวลาแบบ dropdown 9 ตัวเลือก · ความถี่
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { DAYS_SHORT, todayKey } from '../lib/date-th.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { vitColor } from './side-vit.js';
import { HABIT_COLORS } from './side-habit.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WEEK = [1, 2, 3, 4, 5, 6, 0];
export const SLOTS = ['ตื่นนอน', 'ก่อนอาหารเช้า', 'หลังอาหารเช้า', 'ก่อนอาหารกลางวัน', 'หลังอาหารกลางวัน', 'ก่อนอาหารเย็น', 'หลังอาหารเย็น', 'ก่อนนอน'];
const CUSTOM = 'กำหนดเวลาเอง…';
const DOWN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10 L12 15 L17 10"/></svg>';

export function openVitSheet(onSaved, id) {
  const old = id ? getData().vitamins.find(v => v.id === id) : null;
  const f = { name: '', dose: '', slot: 'หลังอาหารเช้า', time: '08:00', kind: 'daily', days: [], open: false, color: vitColor(getData().vitamins.length) };
  if (old) {
    const custom = !SLOTS.includes(old.timeSlot);
    Object.assign(f, { name: old.name, dose: old.dose || '', slot: custom ? CUSTOM : old.timeSlot, time: custom ? old.timeSlot : '08:00',
      kind: old.freq?.kind || 'daily', days: [...(old.freq?.days || [])], color: old.color });
  }
  const seg = (val, label) => `<button type="button" class="seg-btn${f.kind === val ? ' on' : ''}" aria-pressed="${f.kind === val}" data-vn-kind="${val}">${label}</button>`;
  const opt = s => `<div role="option" tabindex="0" aria-selected="${f.slot === s}" class="vn-opt${f.slot === s ? ' on' : ''}" data-vn-slot="${s}">${s}${f.slot === s ? '<span>✓</span>' : ''}</div>`;
  const body = () => `<div class="hn">
      <div><div class="ea-lab">ชื่อ</div><input type="text" class="ea-input" aria-label="ชื่อวิตามิน" value="${esc(f.name)}" data-vn-name></div>
      <div><div class="ea-lab">ขนาด</div><input type="text" class="ea-input" aria-label="ขนาด" value="${esc(f.dose)}" data-vn-dose></div>
      <div><div class="ea-lab">สี</div><div class="hn-colors">${HABIT_COLORS.map((c, i) => `<button type="button" class="hn-color${f.color === c ? ' on' : ''}" aria-label="สี ${i + 1}" aria-pressed="${f.color === c}" style="background:${c}" data-vn-color="${c}"></button>`).join('')}</div></div>
      <div class="vn-wrap"><div class="ea-lab">เวลา</div>
        <button type="button" class="vn-sel${f.open ? ' open' : ''}" aria-haspopup="listbox" aria-expanded="${f.open}" data-vn-open><span>${f.slot}</span>${DOWN}</button>
        ${f.open ? `<div role="listbox" class="vn-list">${[...SLOTS, CUSTOM].map(opt).join('')}</div>` : ''}
        ${f.slot === CUSTOM ? `<input type="time" class="ea-input vn-time" aria-label="เวลา" value="${f.time}" data-vn-time>` : ''}</div>
      <div><div class="ea-lab">ความถี่</div><div class="seg hn-seg hn-small">${seg('daily', 'ทุกวัน')}${seg('alt', 'วันเว้นวัน')}${seg('custom', 'กำหนดวันเอง')}</div></div>
      ${f.kind === 'custom' ? `<div><div class="ea-lab">เลือกวัน</div><div class="hn-days">${WEEK.map(i => `<button type="button" class="hn-day${f.days.includes(i) ? ' on' : ''}" aria-pressed="${f.days.includes(i)}" data-vn-day="${i}">${DAYS_SHORT[i]}</button>`).join('')}</div></div>` : ''}
    </div>
    <div class="${old ? 'btn-row' : ''}" style="margin-top:20px">${old ? '<button type="button" class="btn-secondary" data-vn-del>ลบ</button>' : ''}<button type="button" class="btn-primary" data-vn-save>บันทึก</button></div>`;
  openSheet({
    title: old ? 'แก้วิตามิน' : 'เพิ่มวิตามิน', body,
    mount(el, close, render) {
      el.addEventListener('input', e => {
        if (e.target.matches('[data-vn-name]')) f.name = e.target.value;
        else if (e.target.matches('[data-vn-dose]')) f.dose = e.target.value;
        else if (e.target.matches('[data-vn-time]')) f.time = e.target.value;
      });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-vn-open],[data-vn-color],[data-vn-slot],[data-vn-kind],[data-vn-day],[data-vn-save],[data-vn-del]');
        if (!b) { if (f.open && !e.target.closest('.vn-list')) { f.open = false; render(); } return; }
        const ds = b.dataset;
        if (ds.vnOpen !== undefined) f.open = !f.open;
        else if (ds.vnColor) f.color = ds.vnColor;
        else if (ds.vnSlot) { f.slot = ds.vnSlot; f.open = false; }
        else if (ds.vnKind) f.kind = ds.vnKind;
        else if (ds.vnDay) { const i = Number(ds.vnDay); f.days = f.days.includes(i) ? f.days.filter(x => x !== i) : [...f.days, i]; }
        else if (ds.vnDel !== undefined) {
          if (!await confirmDelete({ title: `ลบ "${old.name}"?` })) return;
          update(d => { d.vitamins = d.vitamins.filter(v => v.id !== old.id); delete d.vitaminLog[old.id]; });
          close(); onSaved?.(); return;
        } else {
          const name = f.name.trim();
          if (!name) { el.querySelector('[data-vn-name]').focus(); return; }
          if (f.kind === 'custom' && !f.days.length) return;
          const rec = { name, dose: f.dose.trim(), timeSlot: f.slot === CUSTOM ? f.time : f.slot, freq: { kind: f.kind, days: f.kind === 'custom' ? f.days : [] }, color: f.color };
          update(d => {
            const ex = old && d.vitamins.find(v => v.id === old.id);
            if (ex) Object.assign(ex, rec); else d.vitamins.push({ id: newId(), ...rec, startDate: todayKey() });
          });
          close(); onSaved?.(); return;
        }
        render();
      });
    },
  });
}
