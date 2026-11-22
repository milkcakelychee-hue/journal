// ตั้งค่า · อารมณ์ (บอร์ด Set-Mood) + แผ่นแก้ไข/เพิ่มอารมณ์ (Set-MoodEdit) · ลากที่ขีดเพื่อเรียงลำดับ
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { ball } from '../lib/mood.js';
import { sortable } from '../ui/sortable.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const BACK = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), PLUS = ic('<path d="M12 5 V19"/><path d="M5 12 H19"/>');
const GRIP = ic('<path d="M5 9 H19"/><path d="M5 15 H19"/>'), PEN = ic('<path d="M4 20 H8 L19 9 a2.1 2.1 0 0 0 0 -3 l-1 -1 a2.1 2.1 0 0 0 -3 0 L4 16 Z"/>');
export const MOOD_COLORS = ['#E6A3B8', '#76B79D', '#8FCBC3', '#E4C673', '#A3ACB8', '#A99BC9', '#E39F6C', '#D9766B', '#8FA9CF', '#6F6A7D', '#A9C58A', '#C9A27E'];
const GROUPS = { pos: ['บวก', '#E2F1E1', '#4B8A47'], mid: ['กลาง', '#FAF2CC', '#8A7416'], neg: ['ลบ', '#EEEEF1', '#55555B'] };
const sorted = () => [...getData().moods].sort((a, b) => a.order - b.order);

export function renderSetMood() {
  const rows = sorted().map(m => { const g = GROUPS[m.group] || GROUPS.mid; return `<div class="sm2-row" data-id="${m.id}">
      <span class="sm2-grip" aria-hidden="true" data-grip>${GRIP}</span><span class="sm2-ball" style="background:${ball(m.color)}"></span>
      <span class="sm2-n">${esc(m.name)}</span><span class="sm2-g" style="background:${g[1]};color:${g[2]}">${g[0]}</span>
      <button type="button" class="dg-ic" aria-label="แก้ไข ${esc(m.name)}" data-sm-edit="${m.id}">${PEN}</button></div>`; }).join('');
  return `<div class="side">
    <button type="button" class="side-back" data-st-back>${BACK}ตั้งค่า</button>
    <div class="ip-head"><h1 class="h-page side-title">อารมณ์</h1><button type="button" class="ip-add" aria-label="เพิ่มอารมณ์" data-sm-add>${PLUS}</button></div>
    <p class="sm2-p">ลากเพื่อเรียงลำดับที่แสดงในหน้าวันนี้ · กลุ่มบวก/กลาง/ลบ ใช้คำนวณสถิติ</p>
    <div class="card sm2-card" data-sm-list>${rows}</div>
  </div>`;
}

function editSheet(id, done) {
  const old = id ? getData().moods.find(m => m.id === id) : null;
  const f = old ? { name: old.name, color: old.color, group: old.group || 'mid' } : { name: '', color: MOOD_COLORS[0], group: 'pos' };
  const seg = (g, l) => `<button type="button" class="seg-btn${f.group === g ? ' on' : ''}" aria-pressed="${f.group === g}" data-me-group="${g}">${l}</button>`;
  const body = () => `<div class="hn">
      <div class="me-prev"><span style="background:${ball(f.color)}"></span></div>
      <div><div class="ea-lab">ชื่อ</div><input type="text" class="ea-input" maxlength="20" aria-label="ชื่ออารมณ์" value="${esc(f.name)}" data-me-name></div>
      <div><div class="ea-lab">สี</div><div class="me-colors">${MOOD_COLORS.map((c, i) => `<button type="button" class="me-color${f.color === c ? ' on' : ''}" aria-label="สี ${i + 1}" aria-pressed="${f.color === c}" style="background:${ball(c)}" data-me-color="${c}"></button>`).join('')}</div></div>
      <div><div class="ea-lab">กลุ่ม</div><div class="seg" style="margin:0">${seg('pos', 'บวก')}${seg('mid', 'กลาง')}${seg('neg', 'ลบ')}</div><div class="me-hint">ใช้คำนวณ % อารมณ์บวกในสถิติ</div></div>
      ${old ? '<button type="button" class="me-del" data-me-del>ลบอารมณ์นี้</button>' : ''}
    </div>
    <button type="button" class="btn-primary" style="margin-top:16px" data-me-save>บันทึก</button>`;
  openSheet({
    title: old ? 'แก้ไขอารมณ์' : 'เพิ่มอารมณ์', body,
    mount(el, close, render) {
      el.addEventListener('input', e => { if (e.target.matches('[data-me-name]')) f.name = e.target.value; });
      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-me-color],[data-me-group],[data-me-del],[data-me-save]'); if (!b) return;
        const ds = b.dataset;
        if (ds.meColor) f.color = ds.meColor;
        else if (ds.meGroup) f.group = ds.meGroup;
        else if (ds.meDel !== undefined) {
          if (getData().moods.length <= 1) return;
          if (!await confirmDelete({ title: `ลบ "${old.name}"?` })) return;
          update(d => { d.moods = d.moods.filter(m => m.id !== old.id); for (const k in d.moodLog) if (d.moodLog[k]?.moodId === old.id) delete d.moodLog[k]; });
          close(); done(); return;
        } else {
          const name = f.name.trim(); if (!name) { el.querySelector('[data-me-name]').focus(); return; }
          update(d => {
            const ex = old && d.moods.find(m => m.id === old.id);
            if (ex) Object.assign(ex, { name, color: f.color, group: f.group });
            else d.moods.push({ id: newId(), name, color: f.color, group: f.group, order: Math.max(-1, ...d.moods.map(m => m.order)) + 1 });
          });
          close(); done(); return;
        }
        render();
      });
    },
  });
}

export function mountSetMood(root, rerender) {
  root.addEventListener('click', e => {
    if (e.target.closest('[data-st-back]')) { location.hash = 'settings'; return; }
    if (e.target.closest('[data-sm-add]')) { editSheet(null, rerender); return; }
    const ed = e.target.closest('[data-sm-edit]'); if (ed) editSheet(ed.dataset.smEdit, rerender);
  });
  sortable(root.querySelector('[data-sm-list]'), ids => { update(d => { d.moods.forEach(m => { m.order = ids.indexOf(m.id); }); }); rerender(); });
}
