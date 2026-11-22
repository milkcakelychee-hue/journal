// ตั้งค่า · หมวดกิจกรรม (บอร์ด Set-Cat) · ลากเรียง · แก้/เพิ่มใช้ฟอร์มแบบ Cat-New · ลบแล้วกิจกรรมย้ายไป "อื่น ๆ"
import { getData, update } from '../store.js';
import { newId } from '../defaults.js';
import { openSheet } from '../ui/sheet.js';
import { confirmDelete } from '../ui/confirm.js';
import { sortable } from '../ui/sortable.js';
import { catColor, CAT_COLORS, CAT_ICONS, CAT_ORDER } from '../lib/categories.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = p => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const BACK = ic('<path d="M14.5 6 L8.5 12 L14.5 18"/>'), PLUS = ic('<path d="M12 5 V19"/><path d="M5 12 H19"/>');
const GRIP = ic('<path d="M5 9 H19"/><path d="M5 15 H19"/>'), PEN = ic('<path d="M4 20 H8 L19 9 a2.1 2.1 0 0 0 0 -3 l-1 -1 a2.1 2.1 0 0 0 -3 0 L4 16 Z"/>');
const BIN = ic('<path d="M5 7 H19"/><path d="M9 7 V5 H15 V7"/><path d="M7 7 L8 20 H16 L17 7"/>');
const sorted = () => [...getData().categories].sort((a, b) => a.order - b.order);
const fallbackOf = d => d.categories.find(c => c.fallback) || d.categories.find(c => c.name === 'อื่น ๆ');

export function renderSetCat() {
  const d = getData(), fb = fallbackOf(d);
  const used = id => d.events.filter(e => e.categoryId === id).length;
  const rows = sorted().map(c => { const p = catColor(c); return `<div class="sm2-row" data-id="${c.id}">
      <span class="sm2-grip" aria-hidden="true" data-grip>${GRIP}</span>
      <span class="sc-ic" style="background:${p.tile}"><span style="background:${p.accent}"></span></span>
      <span class="sc-tx"><span class="sc-n">${esc(c.name)}</span><span class="sc-s">ใช้แล้ว ${used(c.id)} ครั้ง</span></span>
      <button type="button" class="dg-ic" aria-label="แก้ไข ${esc(c.name)}" data-sc-edit="${c.id}">${PEN}</button>
      ${c.id === fb?.id ? '<span class="sc-sp"></span>' : `<button type="button" class="dg-ic" aria-label="ลบ ${esc(c.name)}" data-sc-del="${c.id}">${BIN}</button>`}</div>`; }).join('');
  return `<div class="side">
    <button type="button" class="side-back" data-st-back>${BACK}ตั้งค่า</button>
    <div class="ip-head"><h1 class="h-page side-title">หมวดกิจกรรม</h1><button type="button" class="ip-add" aria-label="เพิ่มหมวด" data-sc-add>${PLUS}</button></div>
    <p class="sm2-p">ลากเพื่อเรียงลำดับ · ลบหมวดแล้วกิจกรรมเดิมจะย้ายไป "อื่น ๆ"</p>
    <div class="card sm2-card" data-sc-list>${rows}</div>
  </div>`;
}

function editSheet(id, done) {
  const old = id ? getData().categories.find(c => c.id === id) : null;
  const cn = old ? { name: old.name, color: old.color ?? 7, icon: old.icon ?? 7 } : { name: '', color: 0, icon: 7 };
  const body = () => `<div class="ea">
      <div class="cn-prev"><span class="cn-chip" style="background:${CAT_COLORS[cn.color].tile}">${CAT_ICONS[cn.icon](16)}<span data-cn-prev>${esc(cn.name.trim() || 'ชื่อหมวด')}</span></span></div>
      <div><div class="ea-lab">ชื่อหมวด</div><input type="text" class="ea-input" aria-label="ชื่อหมวด" placeholder="ชื่อหมวด" value="${esc(cn.name)}" data-cn-name></div>
      <div><div class="ea-lab">สี</div><div class="cn-colors">${CAT_ORDER.map(i => `<button type="button" class="cn-color" aria-pressed="${i === cn.color}" aria-label="สี ${i + 1}" data-cn-color="${i}"><span class="${i === cn.color ? 'on' : ''}" style="background:${CAT_COLORS[i].tile}"></span></button>`).join('')}</div></div>
      <div><div class="ea-lab">ไอคอน</div><div class="cn-icons">${CAT_ICONS.map((f, i) => `<button type="button" class="cn-icon${i === cn.icon ? ' on' : ''}" aria-pressed="${i === cn.icon}" aria-label="ไอคอน ${i + 1}" data-cn-icon="${i}">${f(26)}</button>`).join('')}</div></div>
    </div>
    <div style="margin-top:16px"><button type="button" class="btn-primary" data-cn-save>${old ? 'บันทึก' : 'สร้างหมวด'}</button></div>`;
  openSheet({
    title: old ? 'แก้ไขหมวด' : 'หมวดใหม่', body,
    mount(el, close, render) {
      el.addEventListener('input', e => { if (e.target.matches('[data-cn-name]')) { cn.name = e.target.value; el.querySelector('[data-cn-prev]').textContent = cn.name.trim() || 'ชื่อหมวด'; } });
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-cn-color],[data-cn-icon],[data-cn-save]'); if (!b) return;
        if (b.dataset.cnColor) cn.color = Number(b.dataset.cnColor);
        else if (b.dataset.cnIcon) cn.icon = Number(b.dataset.cnIcon);
        else {
          const name = cn.name.trim(); if (!name) { el.querySelector('[data-cn-name]').focus(); return; }
          const pal = CAT_COLORS[cn.color], rec = { name, bg: pal.bg, fg: pal.fg, accent: pal.accent, color: cn.color, icon: cn.icon };
          update(d => { const ex = old && d.categories.find(c => c.id === old.id); if (ex) Object.assign(ex, rec); else d.categories.push({ id: newId(), ...rec, order: Math.max(-1, ...d.categories.map(c => c.order)) + 1 }); });
          close(); done(); return;
        }
        render();
      });
    },
  });
}

export function mountSetCat(root, rerender) {
  root.addEventListener('click', async e => {
    if (e.target.closest('[data-st-back]')) { location.hash = 'settings'; return; }
    if (e.target.closest('[data-sc-add]')) { editSheet(null, rerender); return; }
    const ed = e.target.closest('[data-sc-edit]'); if (ed) { editSheet(ed.dataset.scEdit, rerender); return; }
    const del = e.target.closest('[data-sc-del]');
    if (del) {
      const c = getData().categories.find(x => x.id === del.dataset.scDel);
      if (!await confirmDelete({ title: `ลบ "${c.name}"?` })) return;
      update(d => { const fb = fallbackOf(d); d.events.forEach(ev => { if (ev.categoryId === c.id) ev.categoryId = fb?.id || null; }); d.categories = d.categories.filter(x => x.id !== c.id); });
      rerender();
    }
  });
  sortable(root.querySelector('[data-sc-list]'), ids => { update(d => { d.categories.forEach(c => { c.order = ids.indexOf(c.id); }); }); rerender(); });
}
